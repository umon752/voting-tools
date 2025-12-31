import { ref } from 'vue';

const isAuthenticated = ref(false);
const error = ref('');

// Check if previously authenticated in this session
if (sessionStorage.getItem('auth_token')) {
  isAuthenticated.value = true;
}

export function useAuth() {
  const login = async (username: string, password: string) => {
    // 1. Development Mode (Localhost)
    // We use client-side env vars for simpler local dev experience
    if (import.meta.env.DEV) {
      const envUser = import.meta.env.VITE_ADMIN_USERNAME;
      const envPass = import.meta.env.VITE_ADMIN_PASSWORD;

      if (!envUser || !envPass) {
        error.value = 'Security Warning (Dev): VITE_ADMIN_ credentials not found in .env';
        return false;
      }

      if (username === envUser && password === envPass) {
        isAuthenticated.value = true;
        error.value = '';
        sessionStorage.setItem('auth_token', 'true');
        return true;
      } else {
        error.value = 'Invalid username or password';
        isAuthenticated.value = false;
        return false;
      }
    }

    // 2. Production Mode (Vercel)
    // We utilize the Serverless API for secure authentication
    else {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          isAuthenticated.value = true;
          error.value = '';
          sessionStorage.setItem('auth_token', 'true');
          return true;
        } else {
          error.value = 'Invalid username or password';
          isAuthenticated.value = false;
          return false;
        }
      } catch (e) {
        error.value = 'Login system error. Please try again later.';
        console.error('Auth Error:', e);
        return false;
      }
    }
  };

  const logout = () => {
    isAuthenticated.value = false;
    sessionStorage.removeItem('auth_token');
  };

  return {
    isAuthenticated,
    error,
    login,
    logout
  };
}
