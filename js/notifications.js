/**
 * NOTIFICATIONS MODULE
 * Solicita permiso y programa recordatorios del día.
 */

const Notifications = {

    init() {
        this.bindEvents();
        this.ensurePermission();
    },

    bindEvents() {
        const notifyTopBtn = document.getElementById('notification-top-btn');
        const notifyActionBtn = document.getElementById('notification-action-btn');

        const bindNotify = (button) => button?.addEventListener('click', async () => {
            await this.requestPermission();
        });

        bindNotify(notifyTopBtn);
        bindNotify(notifyActionBtn);

        const timeInput = document.getElementById('notification-time');
        if (timeInput) {
            timeInput.value = AppState.notificationTime || '08:00';
            timeInput.addEventListener('change', (e) => {
                AppState.notificationTime = e.target.value;
                if (Notification.permission === 'granted') {
                    this.scheduleDailyReminder();
                }
            });
        }
    },

    async ensurePermission() {
        if (!('Notification' in window)) {
            UI.toast('Tu navegador no soporta notificaciones', 'error');
            return;
        }

        if (Notification.permission === 'default') {
            await this.requestPermission();
        }

        if (Notification.permission === 'granted') {
            this.scheduleDailyReminder();
        }
    },

    scheduleDailyReminder() {
        if (Notification.permission !== 'granted') return;

        const schedule = AppState.notificationTime || '08:00';
        const [hour, minute] = schedule.split(':').map(Number);
        const now = new Date();
        const trigger = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

        if (trigger <= now) {
            trigger.setDate(trigger.getDate() + 1);
        }

        const timeout = trigger.getTime() - now.getTime();

        clearTimeout(this.dailyTimeout);
        this.dailyTimeout = setTimeout(() => {
            this.sendReminder();
            this.scheduleDailyReminder();
        }, timeout);
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            UI.toast('Notificaciones no disponibles', 'error');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            UI.toast('Notificaciones activadas', 'success');
            this.scheduleDailyReminder();
        } else {
            UI.toast('No se activaron las notificaciones', 'info');
        }
    },

    sendReminder() {
        if (Notification.permission !== 'granted') return;

        const pendingTasks = (AppState.tasks || []).filter(t => t.status !== 'completada').length;
        const pendingHabits = (AppState.habits || []).filter(h => !h.completed_today).length;
        const pendingFinances = (AppState.finances || []).filter(f => f.type === 'gasto').length;

        if (pendingTasks === 0 && pendingHabits === 0 && pendingFinances === 0) {
            return;
        }

        const title = 'Resumen diario';
        const body = `Tienes ${pendingTasks} tarea(s) pendientes y ${pendingHabits} hábito(s) sin completar hoy.`;
        new Notification(title, {
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828921.png'
        });
    }
};
