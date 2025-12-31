<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVote } from '../composables/useVote';
import PollCard from '../components/PollCard.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/solid';

const { state } = useVote();
const router = useRouter();

const visiblePolls = computed(() => {
  return state.value.polls;
});

const goToAdmin = () => {
  router.push('/admin');
};
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 relative">
    <!-- Admin Button -->
    <div class="absolute top-4 right-4 z-50">
      <button 
        @click="goToAdmin"
        class="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-500 hover:text-white transition-all duration-200 ease-in-out backdrop-blur-md cursor-pointer"
        title="Admin Controls"
      >
        <Cog6ToothIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- Main Dashboard -->
    <main class="max-w-6xl mx-auto pt-12 animate-fade-in">
      
      <!-- Welcome / Empty State -->
      <div v-if="visiblePolls.length === 0" class="text-center py-20">
        <h1 class="text-4xl font-bold mb-4 text-slate-700">No Active Polls</h1>
        <p class="text-slate-500">Waiting for administrator to start a session.</p>
        <button @click="goToAdmin" class="mt-8 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-all duration-200">
          Open Admin Panel
        </button>
      </div>

      <!-- Poll Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PollCard 
          v-for="poll in visiblePolls" 
          :key="poll.id" 
          :poll="poll" 
        />
      </div>

    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
