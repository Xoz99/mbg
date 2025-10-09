import { create } from 'zustand';

export interface User {
  email: string;
  role: 'sekolah' | 'kementerian' | 'dapur';
  nama: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

// Dummy users
const DUMMY_USERS = [
  { 
    email: 'sekolah@mbg.id', 
    password: '123456', 
    role: 'sekolah' as const, 
    nama: 'SDN 01 Jakarta' 
  },
  { 
    email: 'kementerian@mbg.id', 
    password: '123456', 
    role: 'kementerian' as const, 
    nama: 'Admin Kemendikbud' 
  },
  { 
    email: 'dapur@mbg.id', 
    password: '123456', 
    role: 'dapur' as const, 
    nama: 'Dapur MBG Jakarta Pusat' 
  }
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const user = DUMMY_USERS.find(
      u => u.email === email && u.password === password
    );

    if (user) {
      const userData = {
        email: user.email,
        role: user.role,
        nama: user.nama
      };
      
      // Store in localStorage and cookie
      if (typeof window !== 'undefined') {
        localStorage.setItem('mbg_user', JSON.stringify(userData));
        document.cookie = `mbg_user=${JSON.stringify(userData)}; path=/; max-age=86400`;
      }
      
      set({ user: userData });
      return true;
    }
    
    return false;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mbg_user');
      document.cookie = 'mbg_user=; path=/; max-age=0';
    }
    set({ user: null });
  },

  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('mbg_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, isLoading: false });
        } catch (e) {
          set({ user: null, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    }
  },
}));