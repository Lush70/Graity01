# 📚 Lavanda Study - Plataforma de Gerenciamento de Tarefas

Uma plataforma moderna, elegante e inclusiva para gerenciamento de tarefas educacionais, desenvolvida especialmente para estudantes do ensino fundamental e médio.

## 🎨 Características Principais

✨ **Design Moderno**: Interface limpa e elegante com paleta de cores em tons de lavanda
🌙 **Modo Escuro**: Suporte completo a dark mode com persistência de preferência
📊 **Dashboard Intuitivo**: Visualização rápida de estatísticas e tarefas pendentes
✅ **Gerenciamento de Tarefas**: Criar, editar, completar e excluir tarefas
📈 **Rastreamento de Progresso**: Visualize seu progresso por matéria
👤 **Perfil Personalizável**: Personalize suas informações e série/ano escolar
🔍 **Busca em Tempo Real**: Encontre tarefas rapidamente
⏱️ **Notificações**: Receba alertas sobre tarefas atrasadas
💾 **Armazenamento Local**: Todos os dados são salvos no navegador (sem servidor necessário)

## 🚀 Como Começar

### Pré-requisitos
- Um navegador moderno (Chrome, Firefox, Safari, Edge)
- Nenhuma instalação necessária!

### Abrir a Aplicação
1. Localize o arquivo `index.html` no diretório do projeto
2. Clique duas vezes para abrir no navegador, OU
3. Arraste o arquivo para a janela do navegador

### Fazer Login

**Conta de Teste (já criada):**
- Email: `teste@lavanda.com`
- Senha: `123456`

**Ou criar uma nova conta:**
1. Clique em "Criar conta" na página de login
2. Preencha os dados (nome, email, senha)
3. Clique em "Entrar"

## 📖 Guia de Uso

### Dashboard
- **Estatísticas Rápidas**: Veja o total de tarefas, pendentes, concluídas e atrasadas
- **Tarefas Próximas**: Visualize as 5 próximas tarefas a vencer
- **Atalho Rápido**: Clique em "Nova Tarefa" para criar uma tarefa imediatamente

### Minhas Tarefas
- **Filtrar**: Use os botões para filtrar tarefas (Todas, Pendentes, Completas, Atrasadas)
- **Buscar**: Use a barra de busca no topo para procurar tarefas
- **Marcar Concluída**: Clique no checkbox para marcar/desmarcar como concluída
- **Deletar**: Use o ícone 🗑️ para remover uma tarefa
- **Acessar Link**: Se a tarefa tiver um link, clique no botão "Abrir" para acessá-lo

### Nova Tarefa
Preencha os seguintes campos:
- **Título**: Nome da tarefa (obrigatório)
- **Matéria**: Selecione a disciplina (obrigatório)
- **Prioridade**: Baixa 🟢, Média 🟡 ou Alta 🔴
- **Descrição**: Descreva detalhes da tarefa
- **Data de Vencimento**: Defina o prazo (obrigatório)
- **Tipo de Conteúdo**: 
  - Link: Para tarefas com recursos online
  - Conteúdo: Para descrição/instruções adicionais

### Progresso
- **Percentual Geral**: Visualize seu progresso geral em porcentagem
- **Barra de Progresso**: Acompanhe visualmente seu avanço
- **Progresso por Matéria**: Veja o progresso em cada disciplina

### Meu Perfil
- **Editar Informações**: Atualize seu nome e série/ano escolar
- **Sair**: Faça logout da sua conta

## 🎯 Matérias Disponíveis

- 🇵🇧 Português
- 🔢 Matemática
- 🔬 Ciências
- 📚 História
- 🌍 Geografia
- 🌐 Inglês
- ⚽ Educação Física
- 🎨 Artes

## 🌓 Dark Mode

- **Ativar**: Clique no ícone da lua (🌙) na barra lateral
- **Desativar**: Clique no ícone do sol (☀️)
- **Automático**: A preferência é salva e carregada automaticamente

## 💾 Dados e Armazenamento

### Como Funciona
- Todos os dados são armazenados no **localStorage** do navegador
- Nenhum servidor ou internet é necessário após o carregamento inicial
- Seus dados persistem entre sessões (permanecem quando você fecha e reabre)

### Estrutura de Dados

```json
{
  "lavanda-users": [
    {
      "id": "timestamp",
      "name": "Nome do Estudante",
      "email": "email@exemplo.com",
      "password": "senha",
      "avatar": "ES",
      "grade": "8"
    }
  ],
  "lavanda-tasks": [
    {
      "id": 1,
      "title": "Título da Tarefa",
      "subject": "Português",
      "priority": "high|medium|low",
      "description": "Descrição",
      "dueDate": "2024-12-25",
      "completed": false,
      "isLink": false,
      "content": "URL ou conteúdo"
    }
  ],
  "lavanda-theme": "dark|light"
}
```

### Exportar/Importar Dados

**Via Console do Navegador (F12):**

Para **exportar** seus dados:
```javascript
copy(JSON.stringify({
  users: JSON.parse(localStorage.getItem('lavanda-users')),
  tasks: JSON.parse(localStorage.getItem('lavanda-tasks'))
}));
```

Para **importar** dados:
```javascript
const data = /* colar dados aqui */;
localStorage.setItem('lavanda-users', JSON.stringify(data.users));
localStorage.setItem('lavanda-tasks', JSON.stringify(data.tasks));
location.reload();
```

## 🎨 Personalização

### Cores (modificar em `assets/css/styles.css`)

**Modo Claro:**
- `--primary-light`: #C8A2FF (roxo lavanda principal)
- `--primary-medium`: #9B7BFF (roxo médio)
- `--primary-dark`: #5A3FC0 (roxo escuro)
- `--background-light`: #F5F5F7 (fundo)
- `--text-dark`: #2D2D3F (texto)

**Modo Escuro:**
Adicione em `html.dark-mode { --colors }` para sobrescrever

### Fontes
Edite em `style.css`:
```css
:root {
  --font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}
```

## 🔧 Estrutura do Projeto

```
lavanda-study/
├── index.html                 # Página de login/signup
├── dashboard.html             # Página principal da aplicação
├── README.md                  # Este arquivo
├── assets/
│   ├── css/
│   │   ├── styles.css        # Sistema de design e componentes
│   │   └── layout.css        # Layout, sidebar, responsive
│   └── js/
│       ├── app.js            # Classes principais (Theme, Navigation, Task, User, Utils)
│       └── dashboard.js       # Lógica do dashboard e orquestração
```

## 📱 Responsividade

A aplicação é totalmente responsiva:
- **Desktop** (1024px+): Layout completo com sidebar
- **Tablet** (768px - 1023px): Sidebar ajustado
- **Mobile** (até 767px): Layout otimizado para tela pequena

## ⌨️ Atalhos Úteis

- Clique no nome na sidebar para acessar o perfil
- Clique na lua/sol para alternar dark mode
- Clique em "Tarefas" para ver todas as suas tarefas
- Clique no botão "🔔" para ver notificações

## 🐛 Troubleshooting

### Dados não salvam
- Certifique-se de que cookies/storage estão habilitados no navegador
- Tente limpar dados e recarregar a página (F5)

### Página em branco
- Abra o Console (F12) e procure por erros
- Certifique-se de que `assets/css/` e `assets/js/` existem

### Login não funciona
- Use a conta de teste: `teste@lavanda.com` / `123456`
- Verifique se localStorage está habilitado

## 📝 Versão

**Lavanda Study v1.0**
- Desenvolvido com: HTML5, CSS3, JavaScript Vanilla (sem frameworks)
- Compatível com: Todos os navegadores modernos

## 🤝 Suporte

Para questões sobre uso, consulte este README ou abra o Console (F12) para verificar se há mensagens de erro.

## 📄 Licença

Este projeto é fornecido para uso pessoal e educacional.

---

**Desenvolvido por**: Brothers BR

**Desenvolvido com 💜 para estudantes**
