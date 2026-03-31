const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const fetch = globalThis.fetch || require('node-fetch');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SUPABASE_URL = process.env.SUPABASE_URL || null;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || null;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || null;
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || null;
const SUPABASE_TABLE = 'users';

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  }
}

function loadUsers() {
  ensureDataFiles();
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function hasSupabase() {
  return SUPABASE_URL && SUPABASE_ANON_KEY;
}

function buildSupabaseHeaders(additional = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...additional
  };
}

async function supabaseFetch(path, options = {}) {
  if (!hasSupabase()) {
    throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.');
  }

  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = buildSupabaseHeaders(options.headers || {});

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed ${response.status}: ${text}`);
  }

  return response.json();
}

async function supabaseAuthRequest(path, body) {
  if (!hasSupabase()) {
    throw new Error('Supabase auth não configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env.');
  }

  const url = `${SUPABASE_URL}/auth/v1/${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error_description || data?.error || JSON.stringify(data);
    throw new Error(errorMessage);
  }

  return data;
}

async function supabaseSignUp(email, password, metadata = {}) {
  return supabaseAuthRequest('signup', {
    email,
    password,
    data: metadata
  });
}

async function supabaseSignIn(email, password) {
  return supabaseAuthRequest('token?grant_type=password', {
    email,
    password
  });
}

async function getSupabaseUserByEmail(email) {
  if (!hasSupabase()) return null;

  try {
    const encodedEmail = encodeURIComponent(email.toLowerCase());
    const result = await supabaseFetch(`${SUPABASE_TABLE}?email=eq.${encodedEmail}`, {
      method: 'GET',
      headers: {
        Prefer: 'return=representation'
      }
    });

    return result[0] || null;
  } catch (error) {
    console.error('Supabase read error:', error.message);
    return null;
  }
}

async function createSupabaseUser(user) {
  if (!hasSupabase()) return null;

  try {
    const result = await supabaseFetch(`${SUPABASE_TABLE}`, {
      method: 'POST',
      headers: {
        Prefer: 'return=representation'
      },
      body: JSON.stringify(user)
    });

    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error('Supabase insert error:', error.message);
    return null;
  }
}

async function updateSupabaseUserByEmail(email, updates) {
  if (!hasSupabase()) return null;

  try {
    const encodedEmail = encodeURIComponent(email.toLowerCase());
    const result = await supabaseFetch(`${SUPABASE_TABLE}?email=eq.${encodedEmail}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error('Supabase update error:', error.message);
    return null;
  }
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  if (hasSupabase()) {
    const supabaseUser = await getSupabaseUserByEmail(normalizedEmail);
    if (supabaseUser) {
      return supabaseUser;
    }
  }

  const users = loadUsers();
  return users.find((user) => user.email === normalizedEmail) || null;
}

async function upsertUser(user) {
  if (hasSupabase()) {
    const supabaseUser = await createSupabaseUser(user);
    if (supabaseUser) {
      const users = loadUsers();
      const existingIndex = users.findIndex((item) => item.email === user.email);
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user };
      } else {
        users.push(user);
      }
      saveUsers(users);
      return supabaseUser;
    }
  }

  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

function randomCode(length = 6) {
  const chars = '0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getTransporter(service) {
  if (service === 'outlook') {
    if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASS) {
      throw new Error('Outlook credentials não configuradas. Use OUTLOOK_USER e OUTLOOK_PASS.');
    }
    return nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASS
      }
    });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Gmail credentials não configuradas. Use GMAIL_USER e GMAIL_PASS.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

async function sendEmail({ service, to, subject, text, html }) {
  const transporter = getTransporter(service);
  const message = {
    from: service === 'outlook' ? process.env.OUTLOOK_USER : process.env.GMAIL_USER,
    to,
    subject,
    text,
    html
  };
  return transporter.sendMail(message);
}

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, provider = 'gmail' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const normalizedEmail = email.toLowerCase();
    if (hasSupabase()) {
      try {
        const avatar = name.split(' ').map((item) => item[0]).join('').toUpperCase().slice(0, 2);
        await supabaseSignUp(normalizedEmail, password, { name, avatar });
        return res.json({ message: 'Conta criada. Verifique seu email para confirmar o cadastro.' });
      } catch (error) {
        return res.status(400).json({ error: error.message || 'Erro ao cadastrar no Supabase.' });
      }
    }

    const users = loadUsers();
    if (users.some((user) => user.email === normalizedEmail)) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      name,
      email: normalizedEmail,
      passwordHash,
      verified: true,
      createdAt: new Date().toISOString(),
      avatar: name.split(' ').map((item) => item[0]).join('').toUpperCase().slice(0, 2)
    };

    users.push(user);
    saveUsers(users);
    return res.json({ message: 'Conta criada com sucesso! Agora faça login.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Erro interno ao criar conta.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const normalizedEmail = email.toLowerCase();
    if (hasSupabase()) {
      try {
        const data = await supabaseSignIn(normalizedEmail, password);
        const user = data.user;
        if (!user) {
          return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const safeUser = {
          id: user.id,
          name: user.user_metadata?.name || '',
          email: user.email,
          avatar: user.user_metadata?.avatar || user.email.charAt(0).toUpperCase(),
          verified: true
        };

        return res.json({ user: safeUser });
      } catch (error) {
        return res.status(401).json({ error: error.message || 'Email ou senha inválidos.' });
      }
    }

    const users = loadUsers();
    const user = users.find((item) => item.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      verified: true
    };

    return res.json({ user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao efetuar login.' });
  }
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: 'Email e código são obrigatórios.' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (user.verified) {
      return res.json({ message: 'Email já verificado.' });
    }

    if (user.verificationToken !== token) {
      return res.status(400).json({ error: 'Código de verificação inválido.' });
    }

    user.verified = true;
    delete user.verificationToken;
    if (hasSupabase()) {
      await updateSupabaseUserByEmail(normalizedEmail, { verified: true, verificationToken: null });
    }
    const users = loadUsers();
    const idx = users.findIndex((item) => item.email === normalizedEmail);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
      saveUsers(users);
    }

    return res.json({ message: 'Email verificado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao verificar email.' });
  }
});

app.post('/api/password-reset', async (req, res) => {
  try {
    const { email, provider = 'gmail' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este email.' });
    }

    const resetToken = randomCode(6);
    user.resetToken = resetToken;
    if (hasSupabase()) {
      await updateSupabaseUserByEmail(normalizedEmail, { resetToken });
    }
    const users = loadUsers();
    const idx = users.findIndex((item) => item.email === normalizedEmail);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveUsers(users);

    const subject = 'Graity - Redefinição de senha';
    const text = `Use o código abaixo para redefinir sua senha: ${resetToken}`;
    const html = `<p>Olá ${user.name},</p><p>Seu código de redefinição é:</p><p><strong>${resetToken}</strong></p>`;

    try {
      await sendEmail({ service: provider, to: normalizedEmail, subject, text, html });
      return res.json({ message: 'Email de redefinição enviado com sucesso.' });
    } catch (error) {
      console.error('Falha ao enviar email de redefinição:', error);
      return res.json({
        message: 'Token gerado, mas não foi possível enviar o email. Use o código do servidor para redefinir.',
        fallbackToken: resetToken
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Erro interno ao enviar redefinição de senha.' });
  }
});

async function initServer() {
  ensureDataFiles();

  const users = loadUsers();
  if (!users.some((user) => user.email === 'teste@graity.com')) {
    const passwordHash = await bcrypt.hash('123456', 10);
    users.push({
      id: Date.now(),
      name: 'Estudante',
      email: 'teste@graity.com',
      passwordHash,
      verified: true,
      createdAt: new Date().toISOString(),
      avatar: 'ES'
    });
    saveUsers(users);
    console.log('Usuário de teste criado no backend: teste@graity.com / 123456');
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

initServer().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
});
