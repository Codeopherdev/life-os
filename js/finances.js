/**
 * FINANCES MODULE
 * CRUD para finanzas: ingresos, gastos, deudas, ahorros
 */

const Finances = {

    init() {
        this.bindEvents();
    },

    bindEvents() {
        UI.elements.financeForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createFinance();
        });

        UI.elements.financeFilter?.addEventListener('change', () => {
            this.loadFinances();
        });
    },

    async loadFinances() {
        if (!AppState.user) return;

        const filter = UI.elements.financeFilter?.value || 'todas';

        try {
            let query = supabase
                .from(DB.finances)
                .select('*')
                .eq('user_id', AppState.user.id)
                .order('transaction_date', { ascending: false });

            if (filter !== 'todas') {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            AppState.finances = data || [];
            UI.renderFinances(AppState.finances);
            if (typeof Calendar !== 'undefined') {
                Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
            }

        } catch (error) {
            UI.toast('Error cargando finanzas: ' + (error.message || error), 'error');
        }
    },

    async createFinance() {
        const type = document.getElementById('finance-type').value;
        const amountRaw = document.getElementById('finance-amount').value;
        const amount = parseFloat(amountRaw);
        const description = document.getElementById('finance-description').value.trim();
        const category = document.getElementById('finance-category').value.trim();
        const transaction_date = document.getElementById('finance-date').value || null;

        if (isNaN(amount) || amount <= 0) {
            UI.toast('El monto debe ser un número mayor que 0', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from(DB.finances)
                .insert([{
                    user_id: AppState.user.id,
                    type,
                    amount,
                    description,
                    category,
                    transaction_date: transaction_date || new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            UI.toast('Registro financiero creado', 'success');
            UI.resetForms();
            this.loadFinances();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    async deleteFinance(id) {
        if (!confirm('¿Eliminar este registro financiero?')) return;

        try {
            const { error } = await supabase
                .from(DB.finances)
                .delete()
                .eq('id', id)
                .eq('user_id', AppState.user.id);

            if (error) throw error;

            UI.toast('Registro eliminado', 'info');
            this.loadFinances();

        } catch (error) {
            UI.toast(error.message || error, 'error');
        }
    },

    calculateStats() {
        const stats = {
            totalIngresos: 0,
            totalGastos: 0,
            totalDeudas: 0,
            totalAhorros: 0,
            balance: 0
        };

        (AppState.finances || []).forEach(f => {
            const amt = parseFloat(f.amount) || 0;
            switch (f.type) {
                case 'ingreso': stats.totalIngresos += amt; break;
                case 'gasto': stats.totalGastos += amt; break;
                case 'deuda': stats.totalDeudas += amt; break;
                case 'ahorro': stats.totalAhorros += amt; break;
                default: break;
            }
        });

        stats.balance = stats.totalIngresos - stats.totalGastos;
        // Round to cents
        for (const k of Object.keys(stats)) {
            stats[k] = Math.round((stats[k] + Number.EPSILON) * 100) / 100;
        }

        return stats;
    }
};
