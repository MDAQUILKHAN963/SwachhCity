import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../lib/api.js';
import { connectSocket, joinUserRoom, disconnectSocket } from '../lib/socket.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const { token, user } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Connect socket and join user room
          const socket = connectSocket(token);
          joinUserRoom(user.id);

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      // Register
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const { token, user } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Connect socket
          const socket = connectSocket(token);
          joinUserRoom(user.id);

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: () => {
        disconnectSocket();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Initialize auth from localStorage
      initAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
            
            // Connect socket
            connectSocket(token);
            joinUserRoom(user.id);
          } catch (error) {
            console.error('Error initializing auth:', error);
            get().logout();
          }
        }
      },

      // Get current user
      getCurrentUser: async () => {
        set({ loading: true });
        try {
          const response = await authAPI.getMe();
          const user = response.data.data.user;
          set({ user, loading: false });
          return user;
        } catch (error) {
          set({ loading: false });
          if (error.response?.status === 401) {
            get().logout();
          }
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
