/**
 * APP ENTRY POINT
 */

document.addEventListener('DOMContentLoaded', () => {
    
    UI.init();
    Auth.init();
    Tasks.init();
    Finances.init();
    Goals.init();
    Habits.init();
    Notifications.init();
    Calendar.init();
    
    Auth.checkSession();

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            AppState.user = session.user;
            UI.showDashboard(session.user);
            Tasks.loadTasks();
            Finances.loadFinances();
            if (typeof Goals !== 'undefined') Goals.loadGoals();
            if (typeof Habits !== 'undefined') Habits.loadHabits();
            if (typeof Notifications !== 'undefined') Notifications.ensurePermission();
            if (typeof Calendar !== 'undefined') Calendar.renderCalendar(Calendar.currentDate.getFullYear(), Calendar.currentDate.getMonth());
        } 
        else if (event === 'SIGNED_OUT') {
            AppState.user = null;
            AppState.tasks = [];
            UI.showAuth();
        }
    });

    console.log('%c Life OS ', 'background: linear-gradient(135deg, #6366f1, #10b981); color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;');
});