import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 60000 // 60 segundos max para esperar al servidor
});

// --- Sistema de notificación de servidor despertando ---
let wakeupCallback = null;
let requestCount = 0;
let slowTimer = null;

export const onServerWakeup = (callback) => {
    wakeupCallback = callback;
};

const showWakeup = () => {
    if (wakeupCallback) wakeupCallback(true);
};

const hideWakeup = () => {
    if (wakeupCallback) wakeupCallback(false);
};

// Agregar token + detectar servidor lento
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    requestCount++;
    // Si después de 4 segundos no hay respuesta, mostrar aviso
    if (requestCount === 1 || !slowTimer) {
        slowTimer = setTimeout(() => {
            showWakeup();
        }, 4000);
    }

    return config;
});

// Ocultar aviso cuando responda
api.interceptors.response.use(
    (response) => {
        requestCount = Math.max(0, requestCount - 1);
        if (requestCount === 0) {
            clearTimeout(slowTimer);
            slowTimer = null;
            hideWakeup();
        }
        return response;
    },
    (error) => {
        requestCount = Math.max(0, requestCount - 1);
        if (requestCount === 0) {
            clearTimeout(slowTimer);
            slowTimer = null;
            hideWakeup();
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;