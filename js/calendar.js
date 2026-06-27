/**
 * CALENDAR MODULE
 * Calendario mensual con indicadores de tareas.
 */

const Calendar = {

    init() {
        this.currentDate = new Date();
        this.bindEvents();
        this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
    },

    bindEvents() {
        const prev = UI.elements.calendarPrev;
        const next = UI.elements.calendarNext;

        prev?.addEventListener('click', () => {
            this.changeMonth(-1);
        });

        next?.addEventListener('click', () => {
            this.changeMonth(1);
        });
    },

    async changeMonth(offset) {
        const month = this.currentDate.getMonth() + offset;
        const year = this.currentDate.getFullYear();
        this.currentDate = new Date(year, month, 1);
        await this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
    },

    async renderCalendar(year, month) {
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        if (UI.elements.calendarMonth) {
            UI.elements.calendarMonth.textContent = `${monthNames[month]} ${year}`;
        }

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Monday

        const eventsMap = {};
        const normalizeDate = (value) => value ? new Date(value).toISOString().split('T')[0] : null;

        if (AppState.user) {
            try {
                const start = firstDay.toISOString().split('T')[0];
                const end = lastDay.toISOString().split('T')[0];

                const [{ data: taskData, error: taskError }, { data: financeData, error: financeError }] = await Promise.all([
                    supabase
                        .from(DB.tasks)
                        .select('*')
                        .eq('user_id', AppState.user.id)
                        .gte('due_date', start)
                        .lte('due_date', end),
                    supabase
                        .from(DB.finances)
                        .select('*')
                        .eq('user_id', AppState.user.id)
                        .gte('transaction_date', start)
                        .lte('transaction_date', end)
                ]);

                if (taskError) throw taskError;
                if (financeError) throw financeError;

                (taskData || []).forEach(task => {
                    if (!task.due_date) return;
                    const key = normalizeDate(task.due_date);
                    if (!key) return;
                    eventsMap[key] = eventsMap[key] || [];
                    eventsMap[key].push({ type: 'task', item: task });
                });

                (financeData || []).forEach(finance => {
                    if (!finance.transaction_date) return;
                    const key = normalizeDate(finance.transaction_date);
                    if (!key) return;
                    eventsMap[key] = eventsMap[key] || [];
                    eventsMap[key].push({ type: 'finance', item: finance });
                });

                (AppState.goals || []).forEach(goal => {
                    if (!goal.deadline) return;
                    const key = normalizeDate(goal.deadline);
                    if (!key) return;
                    eventsMap[key] = eventsMap[key] || [];
                    eventsMap[key].push({ type: 'goal', item: goal });
                });
            } catch (error) {
                UI.toast('Error cargando calendario: ' + (error.message || error), 'error');
            }
        }

        const daysArray = [];
        const totalCells = firstDayOfWeek + lastDay.getDate();
        const todayString = new Date().toISOString().split('T')[0];

        for (let i = 0; i < firstDayOfWeek; i++) {
            daysArray.push({ empty: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            daysArray.push({
                day,
                dateString,
                isToday: dateString === todayString,
                events: eventsMap[dateString] || []
            });
        }

        if (UI.elements.calendarGrid) {
            UI.renderCalendar(daysArray);
        }

        const selectedDate = todayString.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) ? todayString : null;
        if (selectedDate) {
            const dayEvents = eventsMap[selectedDate] || [];
            UI.renderCalendarDetail(selectedDate, {
                tasks: dayEvents.filter(e => e.type === 'task').map(e => e.item),
                finances: dayEvents.filter(e => e.type === 'finance').map(e => e.item),
                goals: dayEvents.filter(e => e.type === 'goal').map(e => e.item),
                habits: AppState.habits || []
            });
        } else if (UI.elements.calendarDetail) {
            UI.elements.calendarDetail.innerHTML = `<div class="empty-state"><p>Selecciona un día para ver detalles de tareas, finanzas y hábitos.</p></div>`;
        }
    },

    async selectDay(dateString) {
        const tasks = [];
        const finances = [];
        const todayString = new Date().toISOString().split('T')[0];

        if (AppState.user) {
            try {
                const [{ data: taskData, error: taskError }, { data: financeData, error: financeError }] = await Promise.all([
                    supabase
                        .from(DB.tasks)
                        .select('*')
                        .eq('user_id', AppState.user.id)
                        .eq('due_date', dateString),
                    supabase
                        .from(DB.finances)
                        .select('*')
                        .eq('user_id', AppState.user.id)
                        .eq('transaction_date', dateString)
                ]);

                if (taskError) throw taskError;
                if (financeError) throw financeError;

                tasks.push(...(taskData || []));
                finances.push(...(financeData || []));
            } catch (error) {
                UI.toast('Error cargando datos del día: ' + (error.message || error), 'error');
            }
        }

        const goals = (AppState.goals || []).filter(goal => goal.deadline === dateString);
        UI.renderCalendarDetail(dateString, {
            tasks,
            finances,
            goals,
            habits: AppState.habits || []
        });
    }
};
