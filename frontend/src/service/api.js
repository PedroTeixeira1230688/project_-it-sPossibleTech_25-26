import axios from 'axios';
import { useAuthStore } from '../store/userAuth'; 

const api = axios.create({
    baseURL: 'http://localhost:5000'
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token; 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getTasks = () => api.get('/tasks/get').then(res => res.data);
export const addTask = (title) => api.post('/tasks/post', { title });
export const toggleTask = (id) => api.post(`/tasks/${id}/complete`);
export const deleteTask = (id) => api.delete(`/tasks/${id}/delete`);
export const loginRequest = (credentials) => api.post('/auth/login', credentials);