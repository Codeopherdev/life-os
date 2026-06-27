/**
 * CONFIGURACIÓN DE SUPABASE
 * 
 * INSTRUCCIONES:
 * 1. Ve a https://supabase.com → Tu Proyecto → Settings → API
 * 2. Copia tu URL y tu anon key
 * 3. Reemplaza los valores debajo
 */

const SUPABASE_URL = 'https://hjvcrojvwbwvdundvoyq.supabase.co';     // ← REEMPLAZA AQUÍ
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmNyb2p2d2J3dmR1bmR2b3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDM0MzMsImV4cCI6MjA5ODA3OTQzM30.gkqBEtEF2_tkeYk_ANeVk6o74fAVqZmOROr3tCVXHeQ';                    // ← REEMPLAZA AQUÍ

// Cliente global
try {
    // El CDN ya define `supabase` en `window`; no redeclaramos la misma
    // variable con `const` (provocaría "Identifier 'supabase' has already been declared").
    // Aquí reemplazamos la referencia global por el cliente creado.
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.error('No se pudo inicializar Supabase. Asegúrate de que el SDK se cargó antes de config.js', err);
}

// Estado global
const AppState = {
    user: null,
    isLoginMode: true,
    tasks: [],
    finances: [],
    goals: [],
    habits: [],
    habitLogs: [],
    notificationTime: '08:00'
};

// Utilidades de fecha
function formatISODate(value = new Date()) {
    return new Date(value).toISOString().split('T')[0];
}

// Constantes de la base de datos
const DB = {
    profiles: 'profiles',
    tasks: 'tasks',
    finances: 'finances',
    goals: 'goals',
    habits: 'habits',
    habit_logs: 'habit_logs'
};