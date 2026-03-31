/* ===== LAVANDA STUDY - DASHBOARD JAVASCRIPT ===== */

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    if (!userManager.currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Inicializar dados de exemplo
    initSampleData();

    // Atualizar UI
    updateDashboard();
    setupEventListeners();
    updateUserDisplay();
});

function updateUserDisplay() {
    const user = userManager.currentUser;
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('avatarDisplay').textContent = user.avatar;
        document.getElementById('profileAvatar').textContent = user.avatar;
    }
    renderGroupState();
}

function renderGroupState() {
    const activeGroup = groupManager.getActiveGroup();
    const statusEl = document.getElementById('userGroupStatus');
    const activeInfo = document.getElementById('activeGroupInfo');

    if (statusEl) {
        statusEl.textContent = activeGroup ? `Grupo: ${activeGroup.name}` : 'Sem grupo';
    }

    if (activeInfo) {
        if (activeGroup) {
            activeInfo.innerHTML = `
                <p>Você está conectado ao grupo <strong>${activeGroup.name}</strong>.</p>
                <button type="button" class="btn btn-outline" id="leaveGroupBtn">Sair do grupo</button>
            `;
        } else {
            activeInfo.innerHTML = '<p class="text-muted">Nenhum grupo selecionado. Crie ou entre em um grupo para começar.</p>';
        }
        const leaveBtn = document.getElementById('leaveGroupBtn');
        if (leaveBtn) leaveBtn.addEventListener('click', leaveGroup);
    }
}

function renderGroupPage() {
    renderGroupState();
}

async function handleCreateGroupSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('groupName').value.trim();
    const password = document.getElementById('groupPassword').value;

    if (!name || !password) {
        Utils.showNotification('Preencha nome e senha do grupo.', 'error');
        return;
    }

    try {
        const group = await groupManager.createGroup({ name, password });
        if (!group) {
            Utils.showNotification('Já existe um grupo com esse nome.', 'error');
            return;
        }

        groupManager.setActiveGroupId(group.id);
        Utils.showNotification('Grupo criado e conectado com sucesso!', 'success');
        document.getElementById('createGroupForm').reset();
        renderGroupPage();
        updateDashboard();
        navigateToPage('dashboard');
    } catch (error) {
        Utils.showNotification('Erro ao criar grupo.', 'error');
        console.error(error);
    }
}

async function handleJoinGroupSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('joinGroupPassword').value;

    if (!password) {
        Utils.showNotification('Digite a senha do grupo.', 'error');
        return;
    }

    const group = await groupManager.getGroupByPassword(password);
    if (!group) {
        Utils.showNotification('Senha incorreta ou grupo não encontrado.', 'error');
        return;
    }

    groupManager.setActiveGroupId(group.id);
    Utils.showNotification(`Entrou no grupo ${group.name}!`, 'success');
    document.getElementById('joinGroupForm').reset();
    renderGroupPage();
    updateDashboard();
    navigateToPage('dashboard');
}

function leaveGroup() {
    groupManager.clearActiveGroup();
    renderGroupPage();
    updateDashboard();
    Utils.showNotification('Você saiu do grupo.', 'success');
}

function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(item.getAttribute('data-page'));
        });
    });

    // Busca
    document.getElementById('searchBox').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        filterTasksBySearch(search);
    });

    // Criar tarefa
    document.getElementById('createTaskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        createNewTask();
    });

    // Perfil
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile();
    });

    // Grupos
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) createGroupForm.addEventListener('submit', handleCreateGroupSubmit);

    const joinGroupForm = document.getElementById('joinGroupForm');
    if (joinGroupForm) joinGroupForm.addEventListener('submit', handleJoinGroupSubmit);

    renderGroupPage();

    // Carregar dados do perfil
    const user = userManager.currentUser;
    if (user) {
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
    }
}

function navigateToPage(pageKey) {
    // Ocultar todas as páginas
    document.querySelectorAll('.page-section').forEach(page => {
        page.style.display = 'none';
    });

    // Remover active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Mostrar a página selecionada
    const pageMap = {
        'dashboard': 'dashboardPage',
        'tarefas': 'tarefasPage',
        'criar-tarefa': 'criarTarefaPage',
        'grupos': 'gruposPage',
        'progresso': 'progressoPage',
        'perfil': 'perfilPage'
    };

    if (pageMap[pageKey]) {
        document.getElementById(pageMap[pageKey]).style.display = 'block';
        document.querySelector(`[data-page="${pageKey}"]`)?.classList.add('active');

        // Atualizar título
        const titles = {
            'dashboard': 'Dashboard',
            'tarefas': 'Minhas Tarefas',
            'criar-tarefa': 'Nova Tarefa',
            'grupos': 'Grupos',
            'progresso': 'Progresso',
            'perfil': 'Meu Perfil'
        };
        document.getElementById('pageTitle').textContent = titles[pageKey] || pageKey;
    }

    if (pageKey === 'tarefas') {
        renderTasksList();
    } else if (pageKey === 'progresso') {
        updateProgressPage();
    } else if (pageKey === 'grupos') {
        renderGroupPage();
    }
}

function updateDashboard() {
    const stats = taskManager.getStatistics();

    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('pendingTasks').textContent = stats.pending;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('overdueTasks').textContent = stats.overdue;

    renderUpcomingTasks();
    updateNotificationBadge();
}

function renderUpcomingTasks() {
    const tasks = taskManager.getTasks()
        .filter(t => !t.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    const container = document.getElementById('upcomingTasksList');

    if (!groupManager.activeGroupId) {
        container.innerHTML = '<p class="text-muted text-center p-6">Nenhum grupo selecionado. Crie ou entre em um grupo para ver as próximas tarefas.</p>';
        return;
    }

    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center p-6">Nenhuma tarefa pendente!</p>';
        return;
    }

    container.innerHTML = tasks.map(task => {
        const daysRemaining = Utils.getDaysRemaining(task.dueDate);
        const status = Utils.getTaskStatus(task.dueDate, task.completed);
        const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
        const statusColors = {
            pending: 'var(--text-secondary)',
            warning: 'var(--accent-warning)',
            overdue: 'var(--accent-error)',
            completed: 'var(--accent-success)'
        };

        return `
            <div class="card task-row-card">
                <div class="task-card-top">
                    <div class="task-card-main">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" class="task-card-checkbox">
                        <div>
                            <h4 class="task-card-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${task.title}</h4>
                            <p class="text-sm text-muted" style="margin: 0;">${task.subject}</p>
                        </div>
                    </div>
                    <div class="task-card-meta">
                        <span class="badge badge-primary">${priorityEmojis[task.priority]} ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                        <span class="badge ${task.completed ? 'badge-success' : status === 'overdue' ? 'badge-error' : 'badge-warning'}">
                            ${task.completed ? '✓ Concluída' : Utils.formatDaysRemaining(daysRemaining)}
                        </span>
                        <span class="text-sm text-muted">${Utils.formatDate(task.dueDate)}</span>
                    </div>
                    <div class="task-card-actions">
                        ${task.isLink ? `<a href="${task.content}" target="_blank" class="btn btn-sm btn-outline">🔗 Abrir</a>` : ''}
                        <button onclick="event.stopPropagation(); deleteTask(${task.id})" class="btn btn-sm btn-outline task-card-delete">🗑️</button>
                    </div>
                </div>
                <p class="text-sm text-muted task-card-description">${task.description || 'Sem descrição'}</p>
            </div>
        `;
    }).join('');
}

function renderTasksList() {
    let tasks = taskManager.getTasks();

    if (currentFilter === 'pending') {
        tasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        tasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'overdue') {
        tasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date());
    }

    const container = document.getElementById('tasksListContainer');

    if (!groupManager.activeGroupId) {
        container.innerHTML = '<p class="text-muted text-center p-6" style="grid-column: 1/-1;">Nenhum grupo selecionado. Crie ou entre em um grupo para gerenciar tarefas.</p>';
        return;
    }

    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center p-6" style="grid-column: 1/-1;">Nenhuma tarefa encontrada</p>';
        return;
    }

    container.innerHTML = tasks.map(task => {
        const daysRemaining = Utils.getDaysRemaining(task.dueDate);
        const status = Utils.getTaskStatus(task.dueDate, task.completed);
        const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
        const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' };

        return `
            <div class="card task-row-card" onclick="expandTask(${task.id})">
                <div class="task-card-top">
                    <div class="task-card-main">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="event.stopPropagation(); toggleTask(${task.id})" class="task-card-checkbox">
                        <div>
                            <h4 class="task-card-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${task.title}</h4>
                            <p class="text-sm text-muted" style="margin: 0;">${task.subject}</p>
                        </div>
                    </div>
                    <div class="task-card-meta">
                        <span class="badge badge-primary">${priorityEmojis[task.priority]} ${priorityLabels[task.priority]}</span>
                        <span class="badge ${task.completed ? 'badge-success' : status === 'overdue' ? 'badge-error' : 'badge-warning'}">
                            ${task.completed ? '✓ Concluída' : Utils.formatDaysRemaining(daysRemaining)}
                        </span>
                        <span class="text-sm text-muted">${Utils.formatDate(task.dueDate)}</span>
                    </div>
                    <div class="task-card-actions">
                        ${task.isLink ? `<a href="${task.content}" target="_blank" class="btn btn-sm btn-outline">🔗 Abrir</a>` : ''}
                        <button onclick="event.stopPropagation(); deleteTask(${task.id})" class="btn btn-sm btn-outline task-card-delete">🗑️</button>
                    </div>
                </div>
                <p class="text-sm text-muted task-card-description">${task.description || 'Sem descrição'}</p>
            </div>
        `;
    }).join('');
}

function createNewTask() {
    const title = document.getElementById('taskTitle').value;
    const subject = document.getElementById('taskSubject').value;
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const isLink = document.getElementById('taskIsLink').checked;
    const content = isLink ? document.getElementById('taskLink').value : document.getElementById('taskContent').value;

    if (!title || !subject || !dueDate) {
        Utils.showNotification('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    const task = taskManager.addTask({
        title,
        subject,
        priority,
        description,
        dueDate,
        isLink,
        content
    });

    Utils.showNotification('✅ Tarefa criada com sucesso!', 'success');
    document.getElementById('createTaskForm').reset();

    // Voltar ao dashboard
    setTimeout(() => {
        navigateToPage('dashboard');
        updateDashboard();
    }, 500);
}

function toggleTask(id) {
    const task = taskManager.toggleTask(id);
    Utils.showNotification(
        task.completed ? '✅ Tarefa marcada como concluída!' : '⏳ Tarefa marcada como pendente',
        'success'
    );
    updateDashboard();
    renderTasksList();
}

function deleteTask(id) {
    if (Utils.confirmAction('Tem certeza que deseja deletar esta tarefa?')) {
        taskManager.deleteTask(id);
        Utils.showNotification('🗑️ Tarefa deletada', 'success');
        updateDashboard();
        renderTasksList();
    }
}

function filterTasks(filter) {
    currentFilter = filter;
    renderTasksList();

    // Atualizar botões
    document.querySelectorAll('.page-actions .btn').forEach((btn, idx) => {
        const filters = ['all', 'pending', 'completed', 'overdue'];
        btn.classList.toggle('btn-primary', filters[idx] === filter);
        btn.classList.toggle('btn-outline', filters[idx] !== filter);
    });
}

function filterTasksBySearch(search) {
    const tasks = taskManager.getTasks();
    const filtered = tasks.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.subject.toLowerCase().includes(search)
    );

    const container = document.getElementById('tasksListContainer');
    if (!groupManager.activeGroupId) {
        container.innerHTML = '<p class="text-muted text-center p-6" style="grid-column: 1/-1;">Nenhum grupo selecionado. Crie ou entre em um grupo para gerenciar tarefas.</p>';
        return;
    }
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-muted text-center p-6" style="grid-column: 1/-1;">Nenhuma tarefa encontrada</p>';
        return;
    }

    // Renderizar tarefas filtradas (usar parte do renderTasksList)
    const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
    const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' };

    container.innerHTML = filtered.map(task => {
        const daysRemaining = Utils.getDaysRemaining(task.dueDate);
        const status = Utils.getTaskStatus(task.dueDate, task.completed);

        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h4 style="margin: 0;">${task.title}</h4>
                        <p class="text-sm text-muted">${task.subject}</p>
                    </div>
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" style="cursor: pointer;">
                </div>
                <p class="text-sm mb-4">${task.description || 'Sem descrição'}</p>
                <div class="flex gap-2">
                    <span class="badge badge-primary">${priorityEmojis[task.priority]} ${priorityLabels[task.priority]}</span>
                    <button onclick="deleteTask(${task.id})" class="btn btn-sm btn-outline">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateProgressPage() {
    const stats = taskManager.getStatistics();
    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    document.getElementById('completionPercentage').textContent = percentage + '%';
    document.getElementById('progressBar').style.width = percentage + '%';

    if (!groupManager.activeGroupId) {
        document.getElementById('completionPercentage').textContent = '0%';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('subjectProgressList').innerHTML = '<p class="text-muted text-sm">Nenhum grupo selecionado.</p>';
        return;
    }

    // Progresso por matéria
    const bySubject = {};
    taskManager.getTasks().forEach(task => {
        if (!bySubject[task.subject]) {
            bySubject[task.subject] = { total: 0, completed: 0 };
        }
        bySubject[task.subject].total++;
        if (task.completed) bySubject[task.subject].completed++;
    });

    const subjectList = document.getElementById('subjectProgressList');
    const subjects = Object.entries(bySubject);

    if (subjects.length === 0) {
        subjectList.innerHTML = '<p class="text-muted text-sm">Nenhuma tarefa ainda</p>';
        return;
    }

    subjectList.innerHTML = subjects.map(([subject, data]) => {
        const percentage = Math.round((data.completed / data.total) * 100);
        return `
            <div>
                <div class="flex flex-between mb-2">
                    <h4 style="margin: 0; font-size: 0.95rem;">${subject}</h4>
                    <span class="text-sm text-muted">${percentage}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                </div>
                <p class="text-xs text-muted mt-2">${data.completed} de ${data.total} concluídas</p>
            </div>
        `;
    }).join('');
}

function saveProfile() {
    const name = document.getElementById('profileName').value;
    const grade = document.getElementById('profileGrade').value;

    if (!name) {
        Utils.showNotification('Nome é obrigatório!', 'error');
        return;
    }

    userManager.updateProfile({ name, grade });
    updateUserDisplay();
    Utils.showNotification('💾 Perfil atualizado com sucesso!', 'success');
}

function navigateToProfile() {
    navigateToPage('perfil');
}

function navigateToCreateTask() {
    navigateToPage('criar-tarefa');
}

function toggleLinkInput() {
    const isLink = document.getElementById('taskIsLink').checked;
    document.getElementById('linkInput').style.display = isLink ? 'block' : 'none';
    document.getElementById('contentInput').style.display = isLink ? 'none' : 'block';
}

function handleLogout() {
    if (Utils.confirmAction('Deseja sair da sua conta?')) {
        userManager.logout();
        Utils.showNotification('👋 Até logo!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

function expandTask(id) {
    const task = taskManager.getTaskById(id);
    if (task && task.content && !task.isLink) {
        Utils.openModal('taskModal');
        // Implementar modal de detalhes
    }
}

function showNotifications() {
    if (!groupManager.activeGroupId) {
        Utils.showNotification('Entre em um grupo para ver notificações de tarefas atrasadas.', 'info');
        return;
    }
    const overdueTasks = taskManager.getTasksByStatus('overdue');
    const count = overdueTasks.length;

    if (count > 0) {
        Utils.showNotification(`⚠️ Você tem ${count} tarefa(s) atrasada(s)!`, 'warning', 5000);
    } else {
        Utils.showNotification('✅ Nenhuma notificação!', 'info');
    }
}

function updateNotificationBadge() {
    const overdueTasks = taskManager.getTasksByStatus('overdue');
    const badge = document.getElementById('notificationBadge');

    if (overdueTasks.length > 0) {
        badge.textContent = overdueTasks.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}
