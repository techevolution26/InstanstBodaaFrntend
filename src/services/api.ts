import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// must be called once before any POST /api/login or /api/register
export async function initCsrf() {
  await api.get('/sanctum/csrf-cookie');
}

export default api;
