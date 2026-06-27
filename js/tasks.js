2/**
 * TASKS MODULE
 * CRUD completo de tareas con Supabase + RLS
 */

const Tasks = {
    
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Crear tarea
        UI.elements.taskForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        // Filtro
        UI.elements.taskFilter?.addEventListener('change', () => {
            this.loadTasks();
        });
    },

    async loadTasks() {
        if (!AppState.user) return;

        const filter = UI.elements.taskFilter?.value || 'todas';
        
        let query = supabase
            .from(DB.tasks)
            .select('*')
            .eq('user_id', AppState.user.id)
            .order('created_at', { ascending: false });

        if (filter !== 'todas') {
            query = query.eq('status', filter);
        }

        try {
            const { data, error } = await query;
            if (error) throw error;

            AppState.tasks = data || [];
            UI.renderTasks(AppState.tasks);
            if (typeof Calendar !== 'undefined') {
                Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
            }

        } catch (error) {
            UI.toast('Error cargando tareas: ' + error.message, 'error');
        }
    },

    async createTask() {
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-desc').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due').value;

        if (!title) {
            UI.toast('El título es obligatorio', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from(DB.tasks)
                .insert([{
                    user_id: AppState.user.id,
                    title,
                    description,
                    category,
                    priority,
                    due_date: dueDate || null,
                    status: 'pendiente'
                }])
                .select();

            if (error) throw error;

            UI.toast('Tarea creada correctamente', 'success');
            UI.resetForms();
            this.loadTasks();

        } catch (error) {
            UI.toast(error.message, 'error');
        }
    },

    async toggleStatus(taskId, currentStatus) {
        const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
        
        try {
            const { error } = await supabase
                .from(DB.tasks)
                .update({ status: newStatus })
                .eq('id', taskId)
                .eq('user_id', AppState.user.id);

            if (error) throw error;

            this.loadTasks();

        } catch (error) {
            UI.toast(error.message, 'error');
        }
    },

    async deleteTask(taskId) {
        if (!confirm('¿Eliminar esta tarea?')) return;

        try {
            const { error } = await supabase
                .from(DB.tasks)
                .delete()
                .eq('id', taskId)
                .eq('user_id', AppState.user.id);

            if (error) throw error;

            UI.toast('Tarea eliminada', 'info');
            this.loadTasks();

        } catch (error) {
            UI.toast(error.message, 'error');
        }
    }
};