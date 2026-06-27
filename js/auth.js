/**
 * AUTH MODULE
 * Login, registro, sesión + creación de perfil en BD
 */

const Auth = {
    
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    async handleLogin() {
        UI.setLoading('login-btn', true);

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            AppState.user = data.user;
            UI.toast(`¡Bienvenido de vuelta!`, 'success');
            UI.showDashboard(data.user);
            UI.resetForms();

            // Cargar datos del usuario
            await Tasks.loadTasks();
            if (typeof Finances !== 'undefined') await Finances.loadFinances();
            if (typeof Goals !== 'undefined') await Goals.loadGoals();
            if (typeof Habits !== 'undefined') await Habits.loadHabits();
            if (typeof Notifications !== 'undefined') await Notifications.ensurePermission();
            if (typeof Calendar !== 'undefined') await Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());

        } catch (error) {
            UI.toast(error.message, 'error');
        } finally {
            UI.setLoading('login-btn', false);
        }
    },

    async handleRegister() {
        UI.setLoading('register-btn', true);

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });

            if (error) throw error;

            // El trigger en SQL ya creó el perfil automáticamente
            UI.toast('¡Cuenta creada! Revisa tu correo para confirmar.', 'success');
            
            setTimeout(() => {
                UI.elements.toggleLink.click();
                UI.resetForms();
            }, 2000);

        } catch (error) {
            UI.toast(error.message, 'error');
        } finally {
            UI.setLoading('register-btn', false);
        }
    },

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            AppState.user = null;
            AppState.tasks = [];
            UI.showAuth();
            UI.toast('Sesión cerrada correctamente', 'info');

        } catch (error) {
            UI.toast(error.message, 'error');
        }
    },

    async checkSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            AppState.user = session.user;
            UI.showDashboard(session.user);
            await Tasks.loadTasks();
            if (typeof Finances !== 'undefined') await Finances.loadFinances();
            if (typeof Goals !== 'undefined') await Goals.loadGoals();
            if (typeof Habits !== 'undefined') await Habits.loadHabits();
            if (typeof Notifications !== 'undefined') await Notifications.ensurePermission();
            if (typeof Calendar !== 'undefined') await Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
        }
    }
};

window.logout = () => Auth.logout();