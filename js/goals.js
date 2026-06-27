/**
 * GOALS MODULE
 * Metas de ahorro con progreso y fechas de vencimiento.
 */

const Goals = {

    init() {
        this.bindEvents();
        this.loadGoals();
    },

    bindEvents() {
        UI.elements.goalForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGoal();
        });
    },

    async loadGoals() {
        if (!AppState.user) return;

        try {
            const { data, error } = await supabase
                .from(DB.goals)
                .select('*')
                .eq('user_id', AppState.user.id)
                .order('deadline', { ascending: true });

            if (error) throw error;

            AppState.goals = data || [];
            UI.renderGoals(AppState.goals);
            UI.renderDashboardSummary();
            if (typeof Calendar !== 'undefined') {
                Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
            }

        } catch (error) {
            UI.toast('Error cargando metas: ' + (error.message || error), 'error');
        }
    },

    async createGoal() {
        const title = document.getElementById('goal-name').value.trim();
        const targetAmount = parseFloat(document.getElementById('goal-target').value);
        const currentAmount = parseFloat(document.getElementById('goal-current').value);
        const deadline = document.getElementById('goal-deadline').value;
        const category = document.getElementById('goal-category').value.trim();

        if (!title || isNaN(targetAmount) || targetAmount <= 0) {
            UI.toast('Nombre de meta y monto objetivo son obligatorios', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from(DB.goals)
                .insert([{
                    user_id: AppState.user.id,
                    title,
                    category,
                    target_amount: targetAmount,
                    current_amount: isNaN(currentAmount) ? 0 : currentAmount,
                    deadline: deadline || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            UI.toast('Meta creada', 'success');
            UI.resetForms();
            this.loadGoals();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    async deleteGoal(id) {
        if (!confirm('¿Eliminar esta meta de ahorro?')) return;

        try {
            const { error } = await supabase
                .from(DB.goals)
                .delete()
                .eq('id', id)
                .eq('user_id', AppState.user.id);

            if (error) throw error;

            UI.toast('Meta eliminada', 'info');
            this.loadGoals();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    getProgress(goal) {
        const target = parseFloat(goal.target_amount) || 0;
        const current = parseFloat(goal.current_amount) || 0;
        return target > 0 ? Math.min(100, (current / target) * 100) : 0;
    }
};