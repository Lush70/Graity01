/* ===== LAVANDA STUDY - JAVASCRIPT PRINCIPAL ===== */

// Sistema de Temas
class ThemeManager {
    constructor() {
        this.isDark = localStorage.getItem('lavanda-theme') === 'dark';
        this.init();
    }

    init() {
        if (this.isDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            if (!localStorage.getItem('lavanda-theme')) {
                localStorage.setItem('lavanda-theme', 'light');
            }
        }
        this.setupThemeToggle();
    }

    setupThemeToggle() {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
            this.updateToggleIcon();
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        if (this.isDark) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('lavanda-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-mode');
            localStorage.setItem('lavanda-theme', 'light');
        }
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.isDark ? '☀️' : '🌙';
        }
    }
}

// Gerenciador de Navegação
class NavigationManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.setupNavigation();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        // Remover active de todos os items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adicionar active ao item clicado
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Trocar página (implementar conforme necessário)
        this.currentPage = page;
        console.log('Navegando para:', page);
    }
}

// Gerenciador de Tarefas
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('lavanda-tasks')) || [];
        this.subjects = JSON.parse(localStorage.getItem('lavanda-subjects')) || 
                       ['Português', 'Matemática', 'Ciências', 'História', 'Inglês', 'Educação Física'];
    }

    addTask(taskData) {
        const task = {
            id: Date.now(),
            ...taskData,
            createdAt: new Date().toISOString(),
            completed: false,
            progress: 0,
            groupId: groupManager?.activeGroupId ? parseInt(groupManager.activeGroupId) : null
        };
        this.tasks.push(task);
        this.save();
        return task;
    }

    getTasks(groupId = null) {
        const activeGroupId = groupId || (typeof groupManager !== 'undefined' ? groupManager.activeGroupId : null);
        if (!activeGroupId) {
            return [];
        }
        return this.tasks.filter(task => task.groupId === parseInt(activeGroupId));
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === parseInt(id));
    }

    updateTask(id, updates) {
        const task = this.getTaskById(id);
        if (task) {
            Object.assign(task, updates);
            this.save();
        }
        return task;
    }

    toggleTask(id) {
        const task = this.getTaskById(id);
        if (task) {
            task.completed = !task.completed;
            task.progress = task.completed ? 100 : 0;
            this.save();
        }
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== parseInt(id));
        this.save();
    }

    getTasksByStatus(status) {
        return this.tasks.filter(task => {
            if (status === 'pending') return !task.completed;
            if (status === 'completed') return task.completed;
            if (status === 'overdue') {
                return !task.completed && new Date(task.dueDate) < new Date();
            }
            return true;
        });
    }

    getStatistics() {
        const tasks = this.getTasks();
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
            overdue: tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length
        };
    }

    save() {
        localStorage.setItem('lavanda-tasks', JSON.stringify(this.tasks));
    }
}

// Gerenciador de Grupos
class GroupManager {
    constructor() {
        this.groups = JSON.parse(localStorage.getItem('lavanda-groups')) || [];
        this.activeGroupId = sessionStorage.getItem('lavanda-active-group') || null;
        if (this.activeGroupId && !this.getGroupById(this.activeGroupId)) {
            this.activeGroupId = null;
            sessionStorage.removeItem('lavanda-active-group');
        }
    }

    save() {
        localStorage.setItem('lavanda-groups', JSON.stringify(this.groups));
    }

    async createGroup(groupData) {
        const existing = this.groups.find(g => g.name.toLowerCase() === groupData.name.toLowerCase());
        if (existing) return null;
        const passwordHash = await Utils.hashText(groupData.password);
        const group = {
            id: Date.now(),
            name: groupData.name,
            passwordHash,
            createdAt: new Date().toISOString()
        };
        this.groups.push(group);
        this.save();
        return group;
    }

    getGroupById(id) {
        return this.groups.find(g => g.id === parseInt(id));
    }

    async getGroupByPassword(password) {
        const hash = await Utils.hashText(password);
        return this.groups.find(g => g.passwordHash === hash) || null;
    }

    getActiveGroup() {
        return this.activeGroupId ? this.getGroupById(this.activeGroupId) : null;
    }

    setActiveGroupId(groupId) {
        this.activeGroupId = String(groupId);
        sessionStorage.setItem('lavanda-active-group', this.activeGroupId);
    }

    clearActiveGroup() {
        this.activeGroupId = null;
        sessionStorage.removeItem('lavanda-active-group');
    }
}

// Gerenciador de Usuários
class UserManager {
    constructor() {
        this.currentUser = JSON.parse(sessionStorage.getItem('lavanda-user')) ||
                           JSON.parse(localStorage.getItem('lavanda-user')) || null;
        this.users = JSON.parse(localStorage.getItem('lavanda-users')) || [];
        this.loginAttempts = JSON.parse(localStorage.getItem('lavanda-login-attempts')) || {};
    }

    save() {
        localStorage.setItem('lavanda-users', JSON.stringify(this.users));
    }

    saveLoginAttempts() {
        localStorage.setItem('lavanda-login-attempts', JSON.stringify(this.loginAttempts));
    }

    getUserByEmail(email) {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    async register(userData) {
        const existing = this.getUserByEmail(userData.email);
        if (existing) {
            return null;
        }

        const passwordHash = userData.passwordHash || await Utils.hashText(userData.password);
        const user = {
            id: Date.now(),
            name: userData.name,
            email: userData.email.toLowerCase(),
            passwordHash,
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar(userData.name),
            verified: userData.verified || false,
            verificationToken: userData.verified ? null : Utils.generateToken(6),
            grade: userData.grade || ''
        };

        this.users.push(user);
        this.save();
        return user;
    }

    async login(email, password, remember = false) {
        const normalizedEmail = email.toLowerCase();
        const user = this.getUserByEmail(normalizedEmail);

        if (!user) {
            this.recordFailedAttempt(normalizedEmail);
            return { success: false, error: 'Credenciais inválidas.' };
        }

        if (this.isLoginBlocked(normalizedEmail)) {
            const blockedUntil = new Date(this.loginAttempts[normalizedEmail].blockedUntil);
            return {
                success: false,
                error: `Conta bloqueada. Tente novamente em ${blockedUntil.toLocaleTimeString('pt-BR')}.`
            };
        }

        const passwordHash = await Utils.hashText(password);
        const isPasswordValid = user.passwordHash ? user.passwordHash === passwordHash : user.password === password;

        if (!isPasswordValid) {
            this.recordFailedAttempt(normalizedEmail);
            return { success: false, error: 'Credenciais inválidas.' };
        }

        if (!user.verified) {
            return { success: false, error: 'Email não verificado. Confira sua caixa de entrada.' };
        }

        this.resetLoginAttempts(normalizedEmail);
        this.setCurrentUser(user, remember);
        return { success: true };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('lavanda-user');
        sessionStorage.removeItem('lavanda-user');
    }

    setCurrentUser(user, remember = false) {
        const safeUser = { ...user };
        delete safeUser.password;
        delete safeUser.passwordHash;
        delete safeUser.verificationToken;
        delete safeUser.resetToken;

        this.currentUser = safeUser;
        if (remember) {
            localStorage.setItem('lavanda-user', JSON.stringify(safeUser));
            sessionStorage.removeItem('lavanda-user');
        } else {
            sessionStorage.setItem('lavanda-user', JSON.stringify(safeUser));
            localStorage.removeItem('lavanda-user');
        }
    }

    isLoginBlocked(email) {
        const attempts = this.loginAttempts[email];
        return attempts && attempts.blockedUntil && new Date(attempts.blockedUntil) > new Date();
    }

    recordFailedAttempt(email) {
        const attempts = this.loginAttempts[email] || { count: 0, blockedUntil: null };
        attempts.count += 1;
        if (attempts.count >= 5) {
            const blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
            attempts.blockedUntil = blockedUntil.toISOString();
        }
        this.loginAttempts[email] = attempts;
        this.saveLoginAttempts();
    }

    resetLoginAttempts(email) {
        if (this.loginAttempts[email]) {
            delete this.loginAttempts[email];
            this.saveLoginAttempts();
        }
    }

    verifyEmail(email, token) {
        const normalizedEmail = email.toLowerCase();
        const user = this.getUserByEmail(normalizedEmail);
        if (!user || user.verified) return false;
        if (user.verificationToken !== token) return false;

        user.verified = true;
        delete user.verificationToken;
        this.save();
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateProfile(updates) {
        if (this.currentUser) {
            Object.assign(this.currentUser, updates);
            const storage = localStorage.getItem('lavanda-user') ? localStorage : sessionStorage;
            storage.setItem('lavanda-user', JSON.stringify(this.currentUser));

            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.users[userIndex], ...updates };
                this.save();
            }
        }
    }

    generateAvatar(name) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return initials;
    }
}

// Utilitários
class Utils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    static formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getDaysRemaining(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return diff;
    }

    static formatDaysRemaining(days) {
        if (days < 0) return `${Math.abs(days)} dias atrasado`;
        if (days === 0) return 'Vence hoje';
        if (days === 1) return '1 dia restante';
        return `${days} dias restantes`;
    }

    static getTaskStatus(dueDate, completed) {
        if (completed) return 'completed';
        if (new Date(dueDate) < new Date()) return 'overdue';
        const days = this.getDaysRemaining(dueDate);
        if (days <= 3) return 'warning';
        return 'pending';
    }

    static async hashText(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    static generateToken(length = 6) {
        const digits = '0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return token;
    }

    static isValidEmail(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} animate-fade-in`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#6AC96C' : type === 'error' ? '#FF6B6B' : '#5B9FFF'};
            color: white;
            font-weight: 600;
            z-index: 3000;
            box-shadow: 0 10px 15px rgba(0,0,0,0.1);
            max-width: 320px;
            line-height: 1.4;
        `;

        const anchors = notification.querySelectorAll('a');
        anchors.forEach(anchor => {
            anchor.style.color = 'rgba(255,255,255,0.95)';
            anchor.style.textDecoration = 'underline';
            anchor.style.cursor = 'pointer';
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    static confirmAction(message) {
        return confirm(message);
    }

    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

// Modal Controller
document.addEventListener('DOMContentLoaded', () => {
    // Fechar modal ao clicar no X ou fora do modal
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', initAuthPage);

// Inicializar aplicação
const themeManager = new ThemeManager();
const navigationManager = new NavigationManager();
const groupManager = new GroupManager();
const taskManager = new TaskManager();
const userManager = new UserManager();
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

function buildEmail(localPart, provider) {
    const raw = (localPart || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw.includes('@')) {
        return raw;
    }

    const domain = provider === 'outlook' ? '@outlook.com' : '@gmail.com';
    return `${raw}${domain}`;
}

function apiPost(path, body) {
    return fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

function getSavedEmails() {
    return JSON.parse(localStorage.getItem('lavanda-saved-emails') || '[]');
}

function saveEmailSuggestion(email) {
    if (!email) return;
    const saved = getSavedEmails();
    const normalized = email.trim().toLowerCase();
    if (!saved.includes(normalized)) {
        saved.unshift(normalized);
        if (saved.length > 5) saved.splice(5);
        localStorage.setItem('lavanda-saved-emails', JSON.stringify(saved));
    }
}

function renderSavedEmails() {
    const bar = document.getElementById('savedEmailBar');
    const list = document.getElementById('savedEmailList');
    if (!bar || !list) return;

    const emails = getSavedEmails();
    if (!emails.length) {
        bar.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    bar.style.display = 'flex';
    list.innerHTML = emails.map(email => `
        <button type="button" class="saved-email-chip" onclick="fillSavedEmail('${email}')">
            ${email}
        </button>
    `).join('');
}

function fillSavedEmail(email) {
    const input = document.getElementById('email');
    if (input) {
        input.value = email;
    }
}

function togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? 'Ocultar' : 'Mostrar';
}

function initAuthPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => Utils.openModal('signupModal'));
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }

    const guestBtn = document.getElementById('guestBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', handleGuestAccess);
    }

    const resetRequestForm = document.getElementById('resetRequestForm');
    if (resetRequestForm) {
        resetRequestForm.addEventListener('submit', handlePasswordResetSubmit);
    }

    renderSavedEmails();

    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });

    if (loginForm && userManager.currentUser) {
        window.location.href = 'dashboard.html';
    }

}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    if (!email || !password) {
        Utils.showNotification('Preencha todos os campos.', 'error');
        return;
    }

    if (!Utils.isValidEmail(email)) {
        Utils.showNotification('Digite um email válido.', 'error');
        return;
    }

    try {
        const response = await apiPost('/login', { email, password });
        const data = await response.json();

        if (!response.ok) {
            const message = data.error || 'Falha no login.';
            Utils.showNotification(message, 'error');
            return;
        }

        userManager.setCurrentUser(data.user, remember);
        saveEmailSuggestion(email);
        renderSavedEmails();
        Utils.showNotification('Login realizado com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } catch (error) {
        Utils.showNotification('Erro ao conectar com o servidor.', 'error');
        console.error(error);
    }
}

async function handleSignupSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const localPart = document.getElementById('signupEmailLocal').value.trim();
    const provider = document.getElementById('emailProvider')?.value || 'gmail';
    const email = buildEmail(localPart, provider);
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;

    if (!name || !email || !password || !confirmPassword) {
        Utils.showNotification('Preencha todos os campos para criar a conta.', 'error');
        return;
    }

    if (!Utils.isValidEmail(email)) {
        Utils.showNotification('Digite um email válido.', 'error');
        return;
    }

    if (password.length < 6) {
        Utils.showNotification('A senha precisa ter pelo menos 6 caracteres.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        Utils.showNotification('As senhas não coincidem.', 'error');
        return;
    }

    try {
        const response = await apiPost('/register', {
            name,
            email,
            password,
            provider
        });
        const data = await response.json();

        if (!response.ok) {
            Utils.showNotification(data.error || 'Erro ao criar conta.', 'error');
            return;
        }

        saveEmailSuggestion(email);
        renderSavedEmails();
        Utils.closeModal('signupModal');
        const providerUrl = provider === 'outlook'
            ? 'https://outlook.live.com/mail/'
            : 'https://mail.google.com/';
        Utils.showNotification(
            `${data.message || 'Conta criada! Verifique seu email.'} <a href="${providerUrl}" target="_blank">Abrir ${provider === 'outlook' ? 'Outlook' : 'Gmail'}</a>`,
            'success',
            8000
        );
    } catch (error) {
        Utils.showNotification('Erro ao conectar com o servidor.', 'error');
        console.error(error);
    }
}

function handleGuestAccess() {
    const guestUser = {
        id: 0,
        name: 'Convidado',
        email: '',
        avatar: 'GV',
        guest: true
    };
    userManager.setCurrentUser(guestUser, false);
    Utils.showNotification('Acessando como convidado...', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 200);
}

function handleForgotPassword() {
    Utils.openModal('resetModal');
}

async function handlePasswordResetSubmit(event) {
    event.preventDefault();

    const localPart = document.getElementById('resetEmailLocal').value.trim();
    const provider = document.getElementById('resetEmailProvider')?.value || 'gmail';
    const email = buildEmail(localPart, provider);

    if (!email) {
        Utils.showNotification('Digite o email da sua conta.', 'error');
        return;
    }

    if (!Utils.isValidEmail(email)) {
        Utils.showNotification('Digite um email válido.', 'error');
        return;
    }

    try {
        const response = await apiPost('/password-reset', { email, provider });
        const data = await response.json();

        if (!response.ok) {
            Utils.showNotification(data.error || 'Erro ao enviar email de redefinição.', 'error');
            return;
        }

        Utils.closeModal('resetModal');
        Utils.showNotification(data.message || 'Email de recuperação enviado! Verifique seu email.', 'success', 6000);
        if (data.fallbackToken) {
            setTimeout(() => {
                Utils.showNotification(`Código de redefinição: ${data.fallbackToken}`, 'info', 8000);
            }, 100);
        }
    } catch (error) {
        Utils.showNotification('Erro ao conectar com o servidor.', 'error');
        console.error(error);
    }
}

// Dados de exemplo (para primeira vez)
function initSampleData() {
    if (taskManager.tasks.length === 0 && userManager.currentUser && groupManager.activeGroupId) {
        taskManager.addTask({
            title: 'Ler capítulo 3 de Física',
            description: 'Leitura de cinemática e dinâmica',
            subject: 'Física',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
            content: 'https://example.com',
            isLink: true
        });

        taskManager.addTask({
            title: 'Trabalho de Português',
            description: 'Análise de poema modernista',
            subject: 'Português',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium',
            content: 'Escolher um poema de Fernando Pessoa e analisar sua estrutura...'
        });

        taskManager.addTask({
            title: 'Exercícios de Matemática',
            description: '20 exercícios de álgebra linear',
            subject: 'Matemática',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
            content: 'Resolver todos os exercícios do cap. 5'
        });
    }
}
