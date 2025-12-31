import { ref, computed, watch } from 'vue';
import type { Poll, GlobalState, VoteStatus } from '../types';

const STORAGE_KEY = 'voting-tool-state-v2';

const createParams = (): Poll => ({
  id: crypto.randomUUID(),
  title: 'New Vote',
  status: 'setup',
  candidates: [
    { id: crypto.randomUUID(), name: 'Option A', votes: 0 },
    { id: crypto.randomUUID(), name: 'Option B', votes: 0 },
  ],
  sessionId: crypto.randomUUID(),
});

const defaultState: GlobalState = {
  polls: [createParams()],
  activePollId: null,
};
defaultState.activePollId = defaultState.polls[0]?.id || '';

const state = ref<GlobalState>(defaultState);

// Initialize from local storage
const stored = localStorage.getItem(STORAGE_KEY);
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.polls && Array.isArray(parsed.polls)) {
      state.value = { ...defaultState, ...parsed };
    } else {
      console.warn('Old data format detected, starting fresh.');
      state.value = defaultState;
    }
  } catch (e) {
    console.error('Failed to parse stored items', e);
  }
}

// Watch for changes and save
watch(state, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true });

// --- Active Poll Computed ---
const activePoll = computed(() => {
  if (!state.value.activePollId) return null;
  return state.value.polls.find(p => p.id === state.value.activePollId) || null;
});

// --- Voting Logic (Scoped to Poll ID) ---
// We no longer rely on a single global hasVoted ref for the view, 
// but we keep the helper for checking specific polls.

const hasVotedFor = (pollId: string, currentSessionId: string) => {
  const key = `voted_${pollId}`;
  const record = localStorage.getItem(key);
  return record === currentSessionId;
};

export function useVote() {

  // --- Poll Management ---
  const createPoll = () => {
    const newPoll = createParams();
    state.value.polls.push(newPoll);
    return newPoll.id;
  };

  const deletePoll = (id: string) => {
    if (state.value.polls.length <= 1) {
      alert("Cannot delete the last poll.");
      return;
    }
    state.value.polls = state.value.polls.filter(p => p.id !== id);
    if (state.value.activePollId === id) {
      state.value.activePollId = state.value.polls[0]?.id || null;
    }
  };

  const setActivePoll = (id: string) => {
    state.value.activePollId = id;
  };

  // --- Helpers ---
  const getActivePollOrThrow = () => {
    const p = state.value.polls.find(p => p.id === state.value.activePollId);
    if (!p) throw new Error("No active poll");
    return p;
  };

  // --- Actions ---
  const resetVote = () => {
    const p = getActivePollOrThrow();
    const fresh = createParams();
    p.title = fresh.title;
    p.candidates = fresh.candidates;
    p.status = 'setup';
    p.sessionId = crypto.randomUUID();
  };

  const resetVotesOnly = () => {
    const p = getActivePollOrThrow();
    p.status = 'setup';
    p.candidates = p.candidates.map(c => ({ ...c, votes: 0 }));
    p.sessionId = crypto.randomUUID();
  };

  const addCandidate = (name: string) => {
    const p = getActivePollOrThrow();
    p.candidates.push({
      id: crypto.randomUUID(),
      name,
      votes: 0,
    });
  };

  const removeCandidate = (id: string) => {
    const p = getActivePollOrThrow();
    p.candidates = p.candidates.filter(c => c.id !== id);
  };

  const updateTitle = (title: string) => {
    const p = getActivePollOrThrow();
    p.title = title;
  };

  const setStatus = (status: VoteStatus) => {
    const p = getActivePollOrThrow();
    p.status = status;
  };

  const castVote = (pollId: string, candidateId: string) => {
    const p = state.value.polls.find(poll => poll.id === pollId);
    if (!p) return;

    // Double check if already voted
    if (hasVotedFor(p.id, p.sessionId)) return;

    const candidate = p.candidates.find(c => c.id === candidateId);

    if (candidate) {
      candidate.votes++;
      const key = `voted_${p.id}`;
      localStorage.setItem(key, p.sessionId);
    }
  };

  const startAllVoting = () => {
    state.value.polls.forEach(poll => {
      if (poll.status === 'setup') {
        poll.status = 'voting';
      }
    });
  };

  const endAllVoting = () => {
    state.value.polls.forEach(poll => {
      if (poll.status === 'voting') {
        poll.status = 'ended';
      }
    });
  };

  const resetAllVotes = () => {
    state.value.polls.forEach(poll => {
      poll.status = 'setup';
      poll.candidates = poll.candidates.map(c => ({ ...c, votes: 0 }));
      poll.sessionId = crypto.randomUUID();
    });
  };

  return {
    // Global
    state,
    activePoll,
    createPoll,
    deletePoll,
    setActivePoll,
    // Helpers
    hasVotedFor,
    // Active Poll Actions
    resetVote,
    resetVotesOnly,
    addCandidate,
    removeCandidate,
    updateTitle,
    setStatus,
    castVote,
    startAllVoting,
    endAllVoting,
    resetAllVotes
  };
}
