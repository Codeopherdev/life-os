/**
 * HABITS MODULE
 * Seguimiento rápido de hábitos diarios usando registros de completado.
 */

const Habits = {

    init() {
        this.bindEvents();
    },

    bindEvents() {
        UI.elements.habitForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createHabit();
        });
    },

    async loadHabits() {
        if (!AppState.user) return;

        try {
            const [{ data: habits, error: habitsError }, { data: logs, error: logsError }] = await Promise.all([
                supabase
                    .from(DB.habits)
                    .select('*')
                    .eq('user_id', AppState.user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from(DB.habit_logs)
                    .select('*')
                    .eq('user_id', AppState.user.id)
                    .order('completed_date', { ascending: false })
            ]);

            if (habitsError) throw habitsError;
            if (logsError) throw logsError;

            AppState.habitLogs = logs || [];
            const today = formatISODate();

            AppState.habits = (habits || []).map(habit => {
                const completedToday = AppState.habitLogs.some(log => log.habit_id === habit.id && log.completed_date === today);
                return {
                    ...habit,
                    completed_today: completedToday,
                    streak: this.calculateStreak(habit.id, AppState.habitLogs)
                };
            });

            UI.renderHabits(AppState.habits);
            if (typeof Calendar !== 'undefined') {
                Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
            }

        } catch (error) {
            UI.toast('Error cargando hábitos: ' + (error.message || error), 'error');
        }
    },

    async createHabit() {
        const title = document.getElementById('habit-name').value.trim();
        const category = document.getElementById('habit-category').value;
        const createdAt = formatISODate();

        if (!title) {
            UI.toast('Nombre del hábito es obligatorio', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from(DB.habits)
                .insert([{
                    user_id: AppState.user.id,
                    title,
                    category,
                    color: '#6366f1',
                    created_at: createdAt
                }]);

            if (error) throw error;

            UI.toast('Hábito añadido', 'success');
            UI.resetForms();
            this.loadHabits();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    async toggleCompleted(habitId) {
        if (!AppState.user) return;
        const today = formatISODate();

        try {
            const { data: existingLog, error: selectError } = await supabase
                .from(DB.habit_logs)
                .select('*')
                .eq('user_id', AppState.user.id)
                .eq('habit_id', habitId)
                .eq('completed_date', today)
                .maybeSingle();

            if (selectError) throw selectError;

            if (existingLog) {
                const { error: deleteError } = await supabase
                    .from(DB.habit_logs)
                    .delete()
                    .eq('id', existingLog.id)
                    .eq('user_id', AppState.user.id);

                if (deleteError) throw deleteError;
                UI.toast('Hábito marcado como pendiente', 'info');
            } else {
                const { error: insertError } = await supabase
                    .from(DB.habit_logs)
                    .insert([{
                        user_id: AppState.user.id,
                        habit_id: habitId,
                        completed_date: today
                    }]);

                if (insertError) throw insertError;
                UI.toast('Hábito completado hoy', 'success');
            }

            this.loadHabits();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    async deleteHabit(id) {
        if (!confirm('¿Eliminar este hábito?')) return;

        try {
            const { error } = await supabase
                .from(DB.habits)
                .delete()
                .eq('id', id)
                .eq('user_id', AppState.user.id);

            if (error) throw error;
            UI.toast('Hábito eliminado', 'info');
            this.loadHabits();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    calculateStreak(habitId, logs = []) {
        const today = new Date(formatISODate());
        const completedDates = logs
            .filter(log => log.habit_id === habitId)
            .map(log => log.completed_date);

        let streak = 0;
        let current = new Date(today);

        while (true) {
            const key = current.toISOString().split('T')[0];
            if (completedDates.includes(key)) {
                streak += 1;
                current.setDate(current.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }
};