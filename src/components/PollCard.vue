<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Poll } from '../types';
import { useVote } from '../composables/useVote';
import PollChart from './PollChart.vue';

const props = defineProps<{
  poll: Poll
}>();

const { castVote, hasVotedFor } = useVote();
const showSuccess = ref(false);
const hasVoted = ref(false);
const isExporting = ref(false);
const exportContainer = ref<HTMLElement | null>(null);

import { watch, nextTick } from 'vue';
import { toPng } from 'html-to-image';

const checkStatus = () => {
  hasVoted.value = hasVotedFor(props.poll.id, props.poll.sessionId);
};

// Check when poll session changes (e.g. reset)
watch(() => props.poll.sessionId, checkStatus, { immediate: true });

const handleVote = (candidateId: string) => {
  castVote(props.poll.id, candidateId);
  hasVoted.value = true;
  showSuccess.value = true;
};

const totalVotes = computed(() => {
  return props.poll.candidates.reduce((acc, c) => acc + c.votes, 0);
});

const handleDownloadChart = async () => {
  isExporting.value = true;
  await nextTick();
  
  // Give charts a moment to render content
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!exportContainer.value) return;
  
  try {
    const dataUrl = await toPng(exportContainer.value, { backgroundColor: '#1e293b' });
    const link = document.createElement('a');
    link.download = `poll-result-${props.poll.title.replace(/\s+/g, '_')}-${props.poll.id.slice(0, 4)}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export chart', err);
  }
  
  isExporting.value = false;
};
</script>

<template>
  <div class="glass p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 border border-white/10">
    
    <!-- Header -->
    <div>
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          {{ poll.title }}
        </h3>
        <span 
          v-if="poll.status === 'ended'" 
          class="px-2 py-1 text-xs font-bold rounded bg-red-500/20 text-red-400 border border-red-500/20"
        >
          ENDED
        </span>
        <span 
          v-else-if="poll.status === 'setup'" 
          class="px-2 py-1 text-xs font-bold rounded bg-slate-500/20 text-slate-400 border border-slate-500/20"
        >
          UPCOMING
        </span>
        <span 
          v-else-if="hasVoted" 
          class="px-2 py-1 text-xs font-bold rounded bg-green-500/20 text-green-400 border border-green-500/20"
        >
          VOTED
        </span>
        <span 
          v-else
          class="px-2 py-1 text-xs font-bold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 animate-pulse"
        >
          LIVE
        </span>
      </div>
      <p class="text-slate-400 text-sm">
        <span v-if="poll.status === 'ended'">Final Count: {{ totalVotes }} votes</span>
        <span v-else-if="poll.status === 'setup'">Waiting for admin to start...</span>
        <span v-else-if="hasVoted">Thanks for voting!</span>
        <span v-else>Select an option below</span>
      </p>
    </div>

    <!-- View: Setup (Upcoming) -->
    <div v-if="poll.status === 'setup'" class="text-center py-8 opacity-50">
      <div class="w-16 h-16 bg-slate-500/20 rounded-full mx-auto flex items-center justify-center mb-4 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <p class="text-slate-300 font-medium">Coming Soon</p>
      <p class="text-slate-500 text-sm">This poll hasn't started yet.</p>
    </div>

    <!-- View: Voting (Active) -->
    <div v-if="poll.status === 'voting'" class="space-y-3">
      <button
        v-for="(candidate, index) in poll.candidates"
        :key="candidate.id"
        @click="handleVote(candidate.id)"
        :disabled="hasVoted"
        class="w-full text-left p-4 rounded-xl glass transition-all duration-200 ease-in-out group border border-white/5 
               hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer
               disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white/5"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 transition-transform">
            {{ index + 1 }}
          </div>
          <span class="font-medium text-lg">{{ candidate.name }}</span>
          
          <span v-if="hasVoted" class="ml-auto text-xs font-bold text-green-400 border border-green-500/30 px-2 py-1 rounded bg-green-500/10">
            Locked
          </span>
        </div>
      </button>
      
      <div v-if="hasVoted" class="text-center pt-2 animate-fade-in text-green-400 text-sm font-bold flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
        </svg>
        Vote Submitted
      </div>
    </div>

    <!-- View: Results (Ended) -->
    <div v-else-if="poll.status === 'ended'" class="space-y-4">
      <PollChart ref="chartRef" :poll="poll" />
      
      <!-- Download Button -->
      <button
        @click="handleDownloadChart"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-200 font-medium cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download Chart
      </button>
      
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div v-for="candidate in poll.candidates" :key="candidate.id" class="flex justify-between p-2 rounded bg-white/5">
          <span class="text-slate-400">{{ candidate.name }}</span>
          <span class="font-bold">{{ candidate.votes }}</span>
        </div>
      </div>
    </div>

    <!-- Success Toast Overlay -->
    <transition name="fade">
      <div v-if="showSuccess" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-fade-in p-6">
        <div class="text-center relative w-full">
          <button 
            @click="showSuccess = false" 
            class="absolute -top-12 right-0 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div class="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4 text-white shadow-lg shadow-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Vote Recorded!</h3>
          <p class="text-slate-300">Thanks for participating.</p>
        </div>
      </div>
    </transition>

    <!-- Hidden Export Container -->
    <div 
      v-show="isExporting" 
      class="fixed left-0 flex flex-col gap-8 p-8 bg-slate-900 z-[-1]" 
      style="top: -9999px;"
    >
      <div 
        ref="exportContainer"
        class="w-[600px] p-8 bg-slate-900 text-white rounded-xl"
      >
        <h2 class="text-2xl font-bold mb-4 text-center">{{ poll.title }}</h2>
        <PollChart :poll="poll" />
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div v-for="c in poll.candidates" :key="c.id" class="flex justify-between border-b border-slate-700 pb-1">
            <span>{{ c.name }}</span>
            <span class="font-bold">{{ c.votes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
