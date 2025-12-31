<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import AdminPanel from '../components/AdminPanel.vue';
import AdminLogin from '../components/AdminLogin.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
const { isAuthenticated, logout } = useAuth();

const goBack = () => {
  router.push('/');
};

const handleLogout = () => {
  logout();
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-slate-900/95 backdrop-blur-sm p-4 md:p-8">
    <div class="max-w-4xl mx-auto pt-8 relative">
      
      <!-- Header with Back and Logout -->
      <div class="flex justify-between items-center mb-8">
        <button 
          @click="goBack"
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium">Back to Dashboard</span>
        </button>
        
        <button 
          v-if="isAuthenticated"
          @click="handleLogout"
          class="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider px-3 py-1 rounded border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>

      <h1 class="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
        Admin Control Center
      </h1>
      
      <AdminPanel v-if="isAuthenticated" />
      <AdminLogin v-else />
    </div>
  </div>
</template>
