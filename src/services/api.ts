//app/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// must be called once before any POST /api/login or /api/register
export async function initCsrf() {
  await api.get('/sanctum/csrf-cookie');
}

export default api;
