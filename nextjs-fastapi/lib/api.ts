import axios from 'axios';
import * as apiTypes from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: apiTypes.UserCreate) =>
    api.post<apiTypes.User>('/api/py/auth/register', data),
  
  login: (data: apiTypes.UserLogin) =>
    api.post<apiTypes.Token>('/api/py/auth/login', data),
  
  getMe: () =>
    api.get<apiTypes.User>('/api/py/auth/me'),
  
  getUsers: () =>
    api.get<apiTypes.UserListResponse>('/api/py/auth/users'),
};

// Projects API
export const projectsAPI = {
  create: (data: apiTypes.ProjectCreate) =>
    api.post<apiTypes.Project>('/api/py/projects/', data),
  
  getAll: () =>
    api.get<apiTypes.ProjectListResponse>('/api/py/projects/'),
  
  getById: (id: number) =>
    api.get<apiTypes.Project>(`/api/py/projects/${id}`),
  
  update: (id: number, data: apiTypes.ProjectUpdate) =>
    api.patch<apiTypes.Project>(`/api/py/projects/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/api/py/projects/${id}`),
  
  // Project members
  getMembers: (projectId: number) =>
    api.get<apiTypes.ProjectMember[]>(`/api/py/projects/${projectId}/members`),
  
  addMember: (projectId: number, data: apiTypes.ProjectMemberCreate) =>
    api.post<apiTypes.ProjectMember>(`/api/py/projects/${projectId}/members`, data),
  
  updateMemberRole: (projectId: number, userId: number, data: apiTypes.ProjectMemberUpdate) =>
    api.patch<apiTypes.ProjectMember>(`/api/py/projects/${projectId}/members/${userId}`, data),
  
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/api/py/projects/${projectId}/members/${userId}`),
  
  // Project tasks
  getTasks: (projectId: number) =>
    api.get<apiTypes.TaskListResponse>(`/api/py/projects/${projectId}/tasks`),
  
  createTask: (projectId: number, data: apiTypes.TaskCreate) =>
    api.post<apiTypes.Task>(`/api/py/projects/${projectId}/tasks`, data),
};

// Tasks API
export const tasksAPI = {
  getAll: (filters?: apiTypes.TaskFilter) =>
    api.get<apiTypes.TaskListResponse>('/api/py/tasks/', { params: filters }),
  
  getById: (id: number) =>
    api.get<apiTypes.Task>(`/api/py/tasks/${id}`),
  
  update: (id: number, data: apiTypes.TaskUpdate) =>
    api.patch<apiTypes.Task>(`/api/py/tasks/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/api/py/tasks/${id}`),
  
  // Task comments
  getComments: (taskId: number) =>
    api.get<apiTypes.CommentListResponse>(`/api/py/tasks/${taskId}/comments`),
  
  createComment: (taskId: number, data: apiTypes.CommentCreate) =>
    api.post<apiTypes.Comment>(`/api/py/tasks/${taskId}/comments`, data),
};

// Comments API
export const commentsAPI = {
  update: (id: number, data: apiTypes.CommentUpdate) =>
    api.patch<apiTypes.Comment>(`/api/py/comments/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/api/py/comments/${id}`),
};

export default api;
