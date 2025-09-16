import { apiRequest } from './queryClient';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const auth = {
  async login(data: LoginData) {
    const response = await apiRequest('POST', '/api/auth/login', data);
    return response.json();
  },

  async register(data: RegisterData) {
    const response = await apiRequest('POST', '/api/auth/register', data);
    return response.json();
  },

  async logout() {
    const response = await apiRequest('POST', '/api/auth/logout');
    return response.json();
  },

  async getMe() {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },
};
