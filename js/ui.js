/**
 * UI HELPERS
 * Funciones puras de interfaz. No tocan Supabase.
 */

const UI = {
    elements: {},

    init() {
        this.elements = {
            authView: document.getElementById('auth-view'),
            dashboardView: document.getElementById('dashboard-view'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            toggleLink: document.getElementById('toggle-link'),
            toggleText: document.getElementById('toggle-text'),
            toastContainer: document.getElementById('toast-container'),
            userName: document.getElementById('user-name'),
            userEmail: document.getElementById('user-email'),
            userAvatar: document.getElementById('user-avatar'),
            // Tareas
            taskForm: document.getElementById('task-form'),
            taskList: document.getElementById('task-list'),
            taskFilter: document.getElementById('task-filter'),
            taskStats: document.getElementById('task-stats'),
            // Calendario
            calendarPrev: document.getElementById('calendar-prev'),
            calendarNext: document.getElementById('calendar-next'),
            calendarMonth: document.getElementById('calendar-month'),
            calendarGrid: document.getElementById('calendar-grid'),
            calendarDetail: document.getElementById('calendar-detail'),
            // Finanzas
            financeForm: document.getElementById('finance-form'),
            financeList: document.getElementById('finance-list'),
            financeFilter: document.getElementById('finance-filter'),
            financeStats: document.getElementById('finance-stats'),
            // Metas
            goalForm: document.getElementById('goal-form'),
            goalList: document.getElementById('goal-list'),
            goalStats: document.getElementById('goal-stats'),
            // Hábitos
            habitForm: document.getElementById('habit-form'),
            habitList: document.getElementById('habit-list'),
            habitStats: document.getElementById('habit-stats'),
            // Reporte
            reportTotalSpent: document.getElementById('report-total-spent'),
            reportPendingTasks: document.getElementById('report-pending-tasks'),
            reportActiveHabits: document.getElementById('report-active-habits'),
            reportBalance: document.getElementById('report-balance'),
            reportEmailBtn: document.getElementById('report-email-btn'),
            // Calendar & notifications
            notificationTime: document.getElementById('notification-time'),
            summaryCards: document.getElementById('summary-cards')
        };

        this.bindToggle();
        this.bindReportActions();
        this.bindNavigation();
    },

    bindNavigation() {
        const navItems = document.querySelectorAll('.top-nav .nav-item');
        const sections = document.querySelectorAll('.module-section');

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const label = item.textContent.toLowerCase();
                let selectedTab = 'tareas';

                if (label.includes('finanzas')) selectedTab = 'finanzas';
                if (label.includes('calendario')) selectedTab = 'calendario';
                if (label.includes('hábitos') || label.includes('habitos')) selectedTab = 'habitos';

                sections.forEach(section => {
                    section.classList.toggle('active', section.dataset.tab === selectedTab);
                });
                navItems.forEach(button => button.classList.toggle('active', button === item));
            });
        });
    },

    bindToggle() {
        this.elements.toggleLink.addEventListener('click', () => {
            AppState.isLoginMode = !AppState.isLoginMode;
            
            if (AppState.isLoginMode) {
                this.elements.loginForm.classList.remove('hidden');
                this.elements.registerForm.classList.add('hidden');
                this.elements.toggleText.textContent = '¿No tienes cuenta?';
                this.elements.toggleLink.textContent = 'Regístrate';
            } else {
                this.elements.loginForm.classList.add('hidden');
                this.elements.registerForm.classList.remove('hidden');
                this.elements.toggleText.textContent = '¿Ya tienes cuenta?';
                this.elements.toggleLink.textContent = 'Inicia sesión';
            }
        });
    },

    bindReportActions() {
        this.elements.reportEmailBtn?.addEventListener('click', () => {
            const subject = encodeURIComponent('Reporte Life OS');
            const body = encodeURIComponent(`Resumen de tu día:\n
Total gastado: ${this.elements.reportTotalSpent?.textContent || 'S/0.00'}\nTareas pendientes: ${this.elements.reportPendingTasks?.textContent || '0'}\nHábitos activos: ${this.elements.reportActiveHabits?.textContent || '0'}\nBalance: ${this.elements.reportBalance?.textContent || 'S/0.00'}\n\nRevisa tu panel en Life OS para más detalles.`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        });
    },

    formatCurrency(value) {
        const amount = parseFloat(value) || 0;
        return `S/${amount.toFixed(2)}`;
    },

    toast(message, type = 'info') {
        const icons = {
            success: '<i class="fa-solid fa-circle-check" style="color: var(--accent);"></i>',
            error: '<i class="fa-solid fa-circle-xmark" style="color: var(--danger);"></i>',
            info: '<i class="fa-solid fa-circle-info" style="color: var(--primary);"></i>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icons[type]} <span>${message}</span>`;
        
        this.elements.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        const originalText = btn.querySelector('span')?.textContent || 'Enviar';

        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Procesando...';
        } else {
            btn.disabled = false;
            btn.innerHTML = `<span>${originalText}</span>`;
        }
    },

    showDashboard(user) {
        this.elements.authView.classList.add('hidden');
        this.elements.dashboardView.classList.remove('hidden');

        const name = user.user_metadata?.full_name || 'Usuario';
        const email = user.email;
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        this.elements.userName.textContent = name;
        this.elements.userEmail.textContent = email;
        this.elements.userAvatar.textContent = initials;
    },

    showAuth() {
        this.elements.authView.classList.remove('hidden');
        this.elements.dashboardView.classList.add('hidden');
    },

    resetForms() {
        this.elements.loginForm.reset();
        this.elements.registerForm.reset();
        if (this.elements.taskForm) this.elements.taskForm.reset();
        if (this.elements.financeForm) this.elements.financeForm.reset();
        if (this.elements.goalForm) this.elements.goalForm.reset();
        if (this.elements.habitForm) this.elements.habitForm.reset();
    },

    // Renderizar lista de tareas
    renderTasks(tasks) {
        const container = this.elements.taskList;
        if (!container) return;
        
        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clipboard-check"></i>
                    <p>No hay tareas aún. ¡Crea la primera!</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const priorityClass = `priority-${task.priority}`;
            const statusClass = `status-${task.status}`;
            const isDone = task.status === 'completada';
            
            const el = document.createElement('div');
            el.className = `task-item ${isDone ? 'task-done' : ''}`;
            el.innerHTML = `
                <div class="task-content">
                    <div class="task-main">
                        <span class="task-priority ${priorityClass}">${task.priority}</span>
                        <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
                    </div>
                    <p class="task-desc">${this.escapeHtml(task.description || '')}</p>
                    <div class="task-meta">
                        <span class="task-category"><i class="fa-solid fa-tag"></i> ${task.category}</span>
                        <span class="task-status ${statusClass}">${task.status.replace('_', ' ')}</span>
                        ${task.due_date ? `<span class="task-date"><i class="fa-solid fa-calendar-day"></i> ${task.due_date}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-task btn-done" onclick="Tasks.toggleStatus('${task.id}', '${task.status}')" title="Completar">
                        <i class="fa-solid ${isDone ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-task btn-delete" onclick="Tasks.deleteTask('${task.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(el);
        });

        // Actualizar stats
        const pendientes = tasks.filter(t => t.status !== 'completada').length;
        const completadas = tasks.filter(t => t.status === 'completada').length;
        if (this.elements.taskStats) {
            this.elements.taskStats.innerHTML = `
                <span class="stat-item"><strong>${tasks.length}</strong> total</span>
                <span class="stat-item"><strong>${pendientes}</strong> pendientes</span>
                <span class="stat-item"><strong>${completadas}</strong> hechas</span>
            `;
        }

        this.renderDashboardSummary();
    },

    renderFinances(finances) {
        const container = this.elements.financeList;
        if (!container) return;

        container.innerHTML = '';

        if (!finances || finances.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-wallet"></i>
                    <p>No hay registros financieros aún.</p>
                </div>
            `;
            if (this.elements.financeStats) this.elements.financeStats.innerHTML = '';

            return;
        }

        finances.forEach(f => {
            const date = f.transaction_date ? new Date(f.transaction_date).toLocaleDateString() : '';
            const amount = Number(f.amount).toFixed(2);

            const typeColors = {
                ingreso: '#10b981',
                gasto: '#ef4444',
                deuda: '#f59e0b',
                ahorro: '#6366f1'
            };

            const color = typeColors[f.type] || '#6b7280';

            const el = document.createElement('div');
            el.className = 'task-item';
            el.innerHTML = `
                <div class="task-content">
                    <div class="task-main">
                        <span class="task-priority" style="background:${color}; color: white;">${f.type}</span>
                        <h4 class="task-title">${this.escapeHtml(f.description || f.category || '')}</h4>
                    </div>
                    <p class="task-desc">${this.escapeHtml(f.category || '')}</p>
                    <div class="task-meta">
                        <span class="task-date"><i class="fa-solid fa-calendar-day"></i> ${date}</span>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div style="font-weight:700;">${this.formatCurrency(amount)}</div>
                    <div class="task-actions">
                        <button class="btn-task btn-delete" onclick="Finances.deleteFinance('${f.id}')" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(el);
        });

        // Stats
        if (this.elements.financeStats && typeof Finances !== 'undefined') {
            const stats = Finances.calculateStats();
            this.elements.financeStats.innerHTML = `
                <div class="task-stats">
                    <span class="stat-item"><strong>${this.formatCurrency(stats.balance)}</strong> balance</span>
                    <span class="stat-item"><strong>${this.formatCurrency(stats.totalIngresos)}</strong> ingresos</span>
                    <span class="stat-item"><strong>${this.formatCurrency(stats.totalGastos)}</strong> gastos</span>
                    <span class="stat-item"><strong>${this.formatCurrency(stats.totalDeudas)}</strong> deudas</span>
                    <span class="stat-item"><strong>${this.formatCurrency(stats.totalAhorros)}</strong> ahorros</span>
                </div>
            `;
        }

        this.renderDashboardSummary();
    },

    renderDashboardSummary() {
        if (!this.elements.summaryCards) return;

        const today = new Date().toISOString().split('T')[0];
        const todayTasks = (AppState.tasks || []).filter(t => t.due_date === today).length;
        const pendingDebts = (AppState.finances || []).filter(f => f.type === 'deuda').length;
        const totalGoals = (AppState.goals || []).length;
        const goalProgress = (AppState.goals || []).reduce((sum, goal) => {
            const target = parseFloat(goal.target_amount) || 0;
            const current = parseFloat(goal.current_amount) || 0;
            return sum + (target > 0 ? Math.min(100, (current / target) * 100) : 0);
        }, 0);
        const averageGoalProgress = totalGoals ? Math.round(goalProgress / totalGoals) : 0;
        const totalSpent = (AppState.finances || []).filter(f => f.type === 'gasto').reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
        const pendingHabits = (AppState.habits || []).filter(h => !h.completed_today).length;
        const balance = Finances ? Finances.calculateStats().balance : 0;
        const activeHabits = pendingHabits;

        this.elements.summaryCards.innerHTML = `
            <div class="summary-card summary-highlight">
                <span>Eventos hoy</span>
                <strong>${todayTasks + pendingDebts}</strong>
                <small>Tareas + pagos</small>
            </div>
            <div class="summary-card">
                <span>Balance</span>
                <strong>${this.formatCurrency(balance)}</strong>
                <small>Balance neto</small>
            </div>
            <div class="summary-card">
                <span>Progreso ahorro</span>
                <strong>${averageGoalProgress}%</strong>
                <small>${totalGoals} metas activas</small>
            </div>
            <div class="summary-card">
                <span>Hábitos pendientes</span>
                <strong>${pendingHabits}</strong>
                <small>Faltan hoy</small>
            </div>
        `;

        if (this.elements.reportTotalSpent) {
            this.elements.reportTotalSpent.textContent = this.formatCurrency(totalSpent);
            this.elements.reportBalance.textContent = this.formatCurrency(balance);
            this.elements.reportPendingTasks.textContent = `${todayTasks}`;
            this.elements.reportActiveHabits.textContent = `${activeHabits}`;
        }
    },

    renderGoals(goals) {
        const container = this.elements.goalList;
        if (!container) return;

        container.innerHTML = '';
        if (!goals || goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bullseye"></i>
                    <p>No hay metas registradas todavía.</p>
                </div>
            `;
            if (this.elements.goalStats) this.elements.goalStats.innerHTML = '';
            return;
        }

        goals.forEach(goal => {
            const progress = Math.min(100, ((parseFloat(goal.current_amount) || 0) / (parseFloat(goal.target_amount) || 1)) * 100);
            const el = document.createElement('div');
            el.className = 'task-item';
            el.innerHTML = `
                <div class="task-content">
                    <div class="task-main">
                        <h4 class="task-title">${this.escapeHtml(goal.title)}</h4>
                    </div>
                    <p class="task-desc">${this.escapeHtml(goal.category || 'Ahorro')}</p>
                    <div class="task-meta">
                        <span>${goal.deadline ? `Hasta ${goal.deadline}` : 'Sin fecha'}</span>
                        <span>${progress.toFixed(0)}% completado</span>
                    </div>
                    <div class="progress-bar">
                        <div style="width:${progress}%"></div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div class="goal-amount">${this.formatCurrency(goal.current_amount)} / ${this.formatCurrency(goal.target_amount)}</div>
                    <div class="task-actions">
                        <button class="btn-task btn-delete" onclick="Goals.deleteGoal('${goal.id}')" title="Eliminar meta">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(el);
        });

        if (this.elements.goalStats) {
            const totalSaved = (goals || []).reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);
            this.elements.goalStats.innerHTML = `
                <div class="task-stats">
                    <span class="stat-item"><strong>${goals.length}</strong> metas</span>
                    <span class="stat-item"><strong>${this.formatCurrency(totalSaved)}</strong> ahorrado</span>
                </div>
            `;
        }

        this.renderDashboardSummary();
    },

    renderHabits(habits) {
        const container = this.elements.habitList;
        if (!container) return;

        container.innerHTML = '';
        if (!habits || habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-repeat"></i>
                    <p>Aún no has creado hábitos.</p>
                </div>
            `;
            if (this.elements.habitStats) this.elements.habitStats.innerHTML = '';
            return;
        }

        habits.forEach(habit => {
            const completed = habit.completed_today;
            const label = this.escapeHtml(habit.category || 'Diario');
            const title = this.escapeHtml(habit.title || habit.name || 'Hábito');
            const streakText = habit.streak ? `${habit.streak} día${habit.streak > 1 ? 's' : ''}` : 'Sin racha';

            const el = document.createElement('div');
            el.className = `task-item ${completed ? 'task-done' : ''}`;
            el.innerHTML = `
                <div class="task-content">
                    <div class="task-main">
                        <span class="task-priority ${completed ? 'priority-baja' : 'priority-alta'}">${label}</span>
                        <h4 class="task-title">${title}</h4>
                    </div>
                    <div class="task-meta">
                        <span>${completed ? 'Completado hoy' : 'Pendiente'}</span>
                        <span>${streakText}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-task btn-done" onclick="Habits.toggleCompleted('${habit.id}')" title="Marcar completado">
                        <i class="fa-solid ${completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-task btn-delete" onclick="Habits.deleteHabit('${habit.id}')" title="Eliminar hábito">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(el);
        });

        if (this.elements.habitStats) {
            const completedCount = (habits || []).filter(h => h.completed_today).length;
            this.elements.habitStats.innerHTML = `
                <div class="task-stats">
                    <span class="stat-item"><strong>${completedCount}</strong> completados</span>
                    <span class="stat-item"><strong>${habits.length}</strong> totales</span>
                </div>
            `;
        }

        this.renderDashboardSummary();
    },

    renderCalendar(daysArray) {
        const container = this.elements.calendarGrid;
        if (!container) return;

        container.innerHTML = '';

        daysArray.forEach(day => {
            const el = document.createElement('div');
            if (day.empty) {
                el.className = 'calendar-day empty';
                container.appendChild(el);
                return;
            }

            const hasEvents = day.events && day.events.length > 0;
            const eventTypes = hasEvents ? [...new Set(day.events.map(e => e.type))] : [];
            const typeColor = {
                task: '#10b981',
                finance: '#ef4444'
            };

            el.className = `calendar-day${day.isToday ? ' today' : ''}${hasEvents ? ' has-task' : ''}`;
            el.innerHTML = `
                <div class="calendar-day-number">${day.day}</div>
                ${hasEvents ? `<div class="calendar-event-count">${day.events.length}</div>` : ''}
            `;

            if (hasEvents) {
                eventTypes.forEach((type, index) => {
                    const dot = document.createElement('span');
                    dot.className = `calendar-task-dot ${type}`;
                    dot.style.background = typeColor[type] || '#6b7280';
                    dot.style.right = `${10 + index * 12}px`;
                    el.appendChild(dot);
                });
            }

            el.addEventListener('click', () => Calendar.selectDay(day.dateString));
            container.appendChild(el);
        });
    },

    renderCalendarDetail(date, data) {
        const container = this.elements.calendarDetail;
        if (!container) return;

        const friendlyDate = new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        container.innerHTML = `
            <div class="module-header" style="margin-bottom:12px;">
                <h4>Resumen para ${this.escapeHtml(friendlyDate)}</h4>
            </div>
        `;

        const tasks = data.tasks || [];
        const finances = data.finances || [];
        const goals = data.goals || [];
        const habits = data.habits || [];

        if (tasks.length === 0 && finances.length === 0 && goals.length === 0 && habits.length === 0) {
            container.innerHTML += `
                <div class="empty-state">
                    <p>No hay actividades programadas para este día.</p>
                </div>
            `;
            return;
        }

        if (goals.length > 0) {
            container.innerHTML += `
                <div class="module-subheader"><i class="fa-solid fa-bullseye"></i> Metas</div>
            `;
            goals.forEach(goal => {
                const progress = Math.min(100, ((parseFloat(goal.current_amount) || 0) / (parseFloat(goal.target_amount) || 1)) * 100);
                container.innerHTML += `
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-main">
                                <h4 class="task-title">${this.escapeHtml(goal.title)}</h4>
                            </div>
                            <div class="task-meta">
                                <span>${goal.deadline ? `Vence ${goal.deadline}` : 'Sin fecha'}</span>
                                <span>${progress.toFixed(0)}% completado</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        if (finances.length > 0) {
            container.innerHTML += `
                <div class="module-subheader"><i class="fa-solid fa-wallet"></i> Finanzas</div>
            `;
            finances.forEach(f => {
                const dateText = f.transaction_date ? new Date(f.transaction_date).toLocaleDateString('es-ES') : '';
                const amount = Number(f.amount).toFixed(2);
                container.innerHTML += `
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-main">
                                <span class="task-priority" style="background:${f.type === 'gasto' ? '#fee2e2' : f.type === 'deuda' ? '#fef9c3' : f.type === 'ahorro' ? '#e0e7ff' : '#d1fae5'}; color:${f.type === 'gasto' ? '#dc2626' : f.type === 'deuda' ? '#ca8a04' : f.type === 'ahorro' ? '#4338ca' : '#047857'};">${f.type}</span>
                                <h4 class="task-title">${this.escapeHtml(f.description || f.category || 'Movimiento financiero')}</h4>
                            </div>
                            <div class="task-meta">
                                <span>$${amount}</span>
                                <span>${dateText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        if (tasks.length > 0) {
            container.innerHTML += `
                <div class="module-subheader"><i class="fa-solid fa-check-circle"></i> Tareas</div>
            `;
            tasks.forEach(task => {
                const statusLabel = task.status ? task.status.replace('_', ' ') : 'pendiente';
                container.innerHTML += `
                    <div class="task-item">
                        <div class="task-content">
                            <div class="task-main">
                                <span class="task-priority priority-${task.priority || 'media'}">${task.priority || 'media'}</span>
                                <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
                            </div>
                            <p class="task-desc">${this.escapeHtml(task.description || '')}</p>
                            <div class="task-meta">
                                <span>${this.escapeHtml(task.category || '')}</span>
                                <span>${statusLabel}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        if (habits.length > 0) {
            container.innerHTML += `
                <div class="module-subheader"><i class="fa-solid fa-repeat"></i> Hábitos</div>
            `;
            container.innerHTML += `
                <div class="task-item">
                    <div class="task-content">
                        <p class="task-desc">Tienes ${habits.filter(h => !h.completed_today).length} hábitos pendientes hoy.</p>
                    </div>
                </div>
            `;
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};