<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { LockClosedIcon } from '@heroicons/vue/24/solid';

const { login, error } = useAuth();

const username = ref('');
const password = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  
  isLoading.value = true;
  // Simulate network delay for UX
  await new Promise(resolve => setTimeout(resolve, 500));
  
  login(username.value, password.value);
  isLoading.value = false;
};
</script>

<template>
  <div class="glass p-8 rounded-2xl max-w-md mx-auto w-full animate-fade-in border border-white/10 shadow-2xl">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-indigo-500/20 rounded-full mx-auto flex items-center justify-center mb-4 text-indigo-400">
        <LockClosedIcon class="w-8 h-8" />
      </div>
      <h2 class="text-2xl font-bold text-white">Admin Login</h2>
      <p class="text-slate-400 text-sm mt-2">Please enter your credentials</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
        <input 
          v-model="username" 
          type="text" 
          class="input-field w-full bg-slate-900/50 border-slate-700 focus:border-indigo-500" 
          placeholder="Enter username"
          required
        />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
        <input 
          v-model="password" 
          type="password" 
          class="input-field w-full bg-slate-900/50 border-slate-700 focus:border-indigo-500" 
          placeholder="Enter password"
          required
        />
      </div>

      <div v-if="error" class="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
        {{ error }}
      </div>

      <button 
        type="submit" 
        :disabled="isLoading"
        class="btn-primary w-full flex justify-center py-3 mt-6 font-bold tracking-wide transition-all data-[loading=true]:opacity-70"
      >
        <span v-if="isLoading" class="animate-pulse">Verifying...</span>
        <span v-else>Login</span>
      </button>
    </form>
  </div>
</template>
