<script setup lang="ts">
import { ref } from 'vue';
import { useVote } from '../composables/useVote';
import { ArrowPathIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/solid';

const { 
  state, 
  activePoll, 
  createPoll, 
  deletePoll, 
  setActivePoll,
  addCandidate, 
  removeCandidate, 
  updateTitle, 
  setStatus, 
  resetVote, 
  resetVotesOnly,
  startAllVoting,
  endAllVoting,
  resetAllVotes
} = useVote();

import { computed } from 'vue';

const hasVotingPolls = computed(() => {
  return state.value.polls.some(poll => poll.status === 'voting');
});

const newCandidateName = ref('');

const handleAdd = () => {
  if (newCandidateName.value.trim()) {
    addCandidate(newCandidateName.value.trim());
    newCandidateName.value = '';
  }
};

const handleCreatePoll = () => {
  const id = createPoll();
  setActivePoll(id);
};

const handleDeletePoll = (id: string, event: Event) => {
  event.stopPropagation();
  const poll = state.value.polls.find(p => p.id === id);
  const pollTitle = poll?.title || 'this poll';
  
  showConfirm(
    'Delete Poll',
    `Are you sure you want to delete "${pollTitle}"? This action cannot be undone.`,
    () => deletePoll(id)
  );
};

import ConfirmDialog from './ConfirmDialog.vue';

const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {}
});

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = {
    show: true,
    title,
    message,
    onConfirm
  };
};

const handleConfirm = () => {
  confirmDialog.value.onConfirm();
  confirmDialog.value.show = false;
};

const handleCancel = () => {
  confirmDialog.value.show = false;
};

const handleResetVotes = () => {
  showConfirm(
    'Reset vote count',
    'Are you sure you want to reset all vote counts? The candidate list will be preserved.',
    () => resetVotesOnly()
  );
};

const handleResetAll = () => {
  showConfirm(
    'Reset all',
    'Are you sure you want to reset all vote counts? The candidate list will be preserved.',
    () => resetVote()
  );
};

const handleResetAllVotes = () => {
  showConfirm(
    'Reset All Votes',
    'Are you sure you want to reset vote counts for ALL polls? All candidate lists will be preserved, but all votes will be cleared.',
    () => resetAllVotes()
  );
};

import { nextTick } from 'vue';
import { toPng } from 'html-to-image';
import PollChart from './PollChart.vue';
import { ArrowDownTrayIcon } from '@heroicons/vue/24/solid';

const exportContainer = ref<HTMLElement | null>(null);
const isExporting = ref(false);

const handleExport = async () => {
  if (state.value.polls.length === 0) return;
  
  isExporting.value = true;
  await nextTick();
  
  // Give charts a moment to render content
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!exportContainer.value) return;
  
  const charts = exportContainer.value.querySelectorAll('.export-chart-wrapper');
  
  for (let i = 0; i < charts.length; i++) {
    const el = charts[i] as HTMLElement;
    const pollId = el.dataset.pollId;
    const pollTitle = el.dataset.pollTitle;
    
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#1e293b' });
      const link = document.createElement('a');
      link.download = `poll-result-${pollTitle || 'untitled'}-${pollId?.slice(0, 4)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export chart', err);
    }
  }
  
  isExporting.value = false;
};

  const handleExportCombined = async () => {
    if (state.value.polls.length === 0) return;
    
    // Reuse the same container as individual export
    isExporting.value = true;
    await nextTick();
    
    // Give charts time to render content
    await new Promise(resolve => setTimeout(resolve, 800));
  
    if (!exportContainer.value) {
      console.error('Export container not found');
      isExporting.value = false;
      return;
    }
    
    try {
      // Capture the entire container which holds all charts vertically
      const dataUrl = await toPng(exportContainer.value, { 
        backgroundColor: '#0f172a', // slate-900 to match bg
        pixelRatio: 2,
        skipFonts: false,
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `all-poll-results-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export combined chart', err);
    }
    
    isExporting.value = false;
  };
  
  </script>
  
  <template>
    <div class="glass rounded-xl overflow-hidden max-w-4xl mx-auto animate-fade-in flex flex-col md:flex-row min-h-[500px]">
      
      <!-- Sidebar: Poll List -->
      <div class="w-full md:w-64 bg-slate-900/50 border-r border-slate-700/50 p-4 flex flex-col gap-4">
        <!-- Polls Section -->
        <div class="flex flex-col flex-1 min-h-0">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Polls</h3>
          
          <div class="space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
            <div 
              v-for="poll in state.polls" 
              :key="poll.id"
              @click="setActivePoll(poll.id)"
              class="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border"
              :class="activePoll?.id === poll.id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-slate-200'"
            >
              <div class="flex flex-col flex-1 min-w-0">
                <div class="truncate font-medium text-sm">
                  {{ poll.title || 'Untitled Poll' }}
                </div>
                <div class="text-[10px] uppercase font-bold tracking-wider" :class="{
                  'text-slate-500': poll.status === 'setup',
                  'text-green-400': poll.status === 'voting',
                  'text-red-400': poll.status === 'ended'
                }">
                  {{ poll.status }}
                </div>
              </div>
              <button 
                @click="handleDeletePoll(poll.id, $event)"
                class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all duration-200 cursor-pointer"
                title="Delete Poll"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
  
          <button 
            @click="handleCreatePoll"
            class="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-white/5 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <PlusIcon class="w-4 h-4" />
            New Poll
          </button>
        </div>
  
        <!-- Global Actions Section -->
        <div class="border-t border-slate-700/50 pt-4 space-y-2">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Global Actions</h3>
          
          <button 
            v-if="!hasVotingPolls"
            @click="startAllVoting"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
            Start All Voting
          </button>
  
          <button 
            v-else
            @click="endAllVoting"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
            </svg>
            End All Voting
          </button>
  
          <button 
            @click="handleResetAllVotes"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <ArrowPathIcon class="w-4 h-4" />
            Reset All Votes
          </button>
        </div>
  
        <!-- Export Section -->
        <div class="border-t border-slate-700/50 pt-4 space-y-2">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Export</h3>
          
          <button 
            @click="handleExport"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            Download Results
          </button>
  
          <button 
            @click="handleExportCombined"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-200 ease-in-out cursor-pointer text-sm font-medium"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            Combined Export
          </button>
        </div>
      </div>
  
      <!-- Visible Export Overlay -->
      <!-- Stealth Export Container (Hidden from view but rendered in DOM) -->
    <div 
      v-if="isExporting" 
      class="fixed bottom-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      <div 
        ref="exportContainer"
        class="w-[800px] bg-slate-900 p-12 flex flex-col items-center gap-8"
      >
        <h1 class="text-4xl font-bold text-white mb-8">All Poll Results</h1>
        
        <div 
          v-for="poll in state.polls" 
          :key="poll.id" 
          class="export-chart-wrapper w-full p-8 bg-slate-800 text-white rounded-xl border border-slate-700 shadow-sm"
          :data-poll-id="poll.id"
          :data-poll-title="poll.title"
        >
          <h2 class="text-2xl font-bold mb-4 text-center">{{ poll.title }}</h2>
          <PollChart :poll="poll" :options="{ animation: false }" />
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div v-for="c in poll.candidates" :key="c.id" class="flex justify-between border-b border-slate-700 pb-1">
              <span>{{ c.name }}</span>
              <span class="font-bold">{{ c.votes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main: Active Poll Config -->
    <div class="flex-1 p-8 bg-slate-800/20" v-if="activePoll">
      
      <!-- Title Input -->
      <div class="mb-8">
        <label class="block text-sm font-medium text-slate-400 mb-2">Vote Title</label>
        <input 
          :value="activePoll.title"
          @input="e => updateTitle((e.target as HTMLInputElement).value)"
          class="input-field text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="activePoll.status === 'ended'"
          placeholder="Enter vote title..."
        />
      </div>

      <!-- Candidates -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <label class="block text-sm font-medium text-slate-400">Candidates</label>
          <span class="text-xs text-slate-500">{{ activePoll.candidates.length }} items</span>
        </div>
        
        <div class="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <div 
            v-for="(candidate, index) in activePoll.candidates" 
            :key="candidate.id"
            class="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 group"
          >
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              {{ index + 1 }}
            </div>
            <span class="flex-1 font-medium truncate">{{ candidate.name }}</span>
            <button 
              @click="removeCandidate(candidate.id)"
              title="Remove candidate"
              class="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 ease-in-out opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0 disabled:opacity-0 disabled:cursor-not-allowed"
              :disabled="activePoll.status === 'ended'"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <input 
            v-model="newCandidateName"
            @keyup.enter="handleAdd"
            class="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="activePoll.status === 'ended'"
            placeholder="New candidate name..."
          />
          <button 
            @click="handleAdd"
            class="btn-secondary whitespace-nowrap px-4 cursor-pointer transition-all duration-200 ease-in-out"
            :disabled="!newCandidateName.trim() || activePoll.status === 'ended'"
          >
            Add Option
          </button>
        </div>
      </div>

      <!-- Controls -->
      <div class="border-t border-slate-700/50 pt-6 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex gap-2 md:gap-4">
          <button 
            @click="handleResetVotes"
            class="text-sm text-yellow-400 hover:text-yellow-300 transition-all duration-200 ease-in-out flex items-center gap-2 border border-yellow-400/20 px-3 py-2 rounded-lg bg-yellow-400/5 hover:bg-yellow-400/10 cursor-pointer"
            title="Keep candidates, clear votes"
          >
            <ArrowPathIcon class="w-4 h-4" />
            <span class="hidden md:inline">Reset Votes</span>
          </button>
          
          <button 
            @click="handleResetAll"
            class="text-sm text-slate-500 hover:text-red-400 transition-all duration-200 ease-in-out flex items-center gap-2 px-3 py-2 cursor-pointer"
            title="Factory Reset"
          >
            <ExclamationTriangleIcon class="w-4 h-4" />
            <span class="hidden md:inline">Reset All</span>
          </button>
        </div>

        <div class="flex gap-3">
          <button 
            v-if="activePoll.status === 'setup'"
            @click="setStatus('voting')"
            class="btn-primary flex items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out"
          >
            <span>Start Voting</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
          </button>

          <button 
            v-if="activePoll.status === 'voting'"
            @click="setStatus('ended')"
            class="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200 ease-in-out flex items-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
            </svg>
            End Voting
          </button>

          <button 
            v-if="activePoll.status === 'ended'"
            @click="setStatus('setup')"
            class="btn-secondary cursor-pointer transition-all duration-200 ease-in-out"
          >
            Back to Setup
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="flex-1 flex items-center justify-center text-slate-500">
      Select or create a poll to manage
    </div>
    
    <!-- Confirmation Dialog -->
    <ConfirmDialog 
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
