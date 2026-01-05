import { ref, computed } from 'vue';
import type { Poll, GlobalState, VoteStatus } from '../types';
import { db } from '../firebase';
import {
  ref as dbRef,
  onValue,
  push,
  set,
  remove,
  runTransaction,
  update
} from 'firebase/database';

// Initial empty state
const state = ref<GlobalState>({
  polls: [],
  activePollId: null,
});

// --- Firebase Listeners ---
// Sync polls
onValue(dbRef(db, 'polls'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Convert object to array
    state.value.polls = Object.keys(data).map(key => data[key]);
  } else {
    state.value.polls = [];
  }
});

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

// --- Active Poll Computed ---
const activePoll = computed(() => {
  if (!state.value.activePollId) return null;
  return state.value.polls.find(p => p.id === state.value.activePollId) || null;
});

// --- Local Helpers ---
const hasVotedFor = (pollId: string, currentSessionId: string) => {
  const key = `voted_${pollId}`;
  const record = localStorage.getItem(key);
  return record === currentSessionId;
};

export function useVote() {

  const getActivePollOrThrow = () => {
    const p = state.value.polls.find(p => p.id === state.value.activePollId);
    if (!p) throw new Error("No active poll");
    return p;
  };

  // --- Actions (Write to Firebase) ---

  const createPoll = async () => {
    const newPoll = createParams();
    try {
      await set(dbRef(db, `polls/${newPoll.id}`), newPoll);
      console.log('Poll created successfully');
      return newPoll.id;
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll. Check console for details. (Is Firebase config correct?)');
      throw err;
    }
  };

  const deletePoll = (id: string) => {
    if (state.value.polls.length <= 1) {
      alert("Cannot delete the last poll.");
      return;
    }
    remove(dbRef(db, `polls/${id}`));

    if (state.value.activePollId === id) {
      state.value.activePollId = null;
    }
  };

  const setActivePoll = (id: string) => {
    // Local state only
    state.value.activePollId = id;
  };

  const updateTitle = (title: string) => {
    const p = getActivePollOrThrow();
    update(dbRef(db, `polls/${p.id}`), { title });
  };

  const setStatus = (status: VoteStatus) => {
    const p = getActivePollOrThrow();
    update(dbRef(db, `polls/${p.id}`), { status });
  };

  const resetVote = () => {
    const p = getActivePollOrThrow();
    const fresh = createParams();
    // Keep ID, reset others
    update(dbRef(db, `polls/${p.id}`), {
      title: fresh.title,
      candidates: fresh.candidates,
      status: 'setup',
      sessionId: crypto.randomUUID()
    });
  };

  const resetVotesOnly = () => {
    const p = getActivePollOrThrow();
    const newCandidates = p.candidates.map(c => ({ ...c, votes: 0 }));
    update(dbRef(db, `polls/${p.id}`), {
      status: 'setup',
      candidates: newCandidates,
      sessionId: crypto.randomUUID()
    });
  };

  // Candidates
  // Note: Since candidates are an array, updating one means rewriting the array 
  // or dealing with array indices which is race-condition prone in Firebase if using indices.
  // Best practice is object map, but to keep refactor minimal we will write whole candidates array for add/remove.
  // For voting, we can try to be specific if we know the index, but finding by ID is safer for 'votes' count transaction.

  const addCandidate = (name: string) => {
    const p = getActivePollOrThrow();
    const newCandidates = [...p.candidates, {
      id: crypto.randomUUID(),
      name,
      votes: 0,
    }];
    update(dbRef(db, `polls/${p.id}`), { candidates: newCandidates });
  };

  const removeCandidate = (id: string) => {
    const p = getActivePollOrThrow();
    const newCandidates = p.candidates.filter(c => c.id !== id);
    update(dbRef(db, `polls/${p.id}`), { candidates: newCandidates });
  };

  const updateCandidateName = (candidateId: string, name: string) => {
    const p = getActivePollOrThrow();
    const idx = p.candidates.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      // Update specific path to avoid overwriting other things? 
      // Array updates are tricky. simple update of array is safer for this scale.
      const newCandidates = [...p.candidates];
      newCandidates[idx] = { ...newCandidates[idx], name };
      update(dbRef(db, `polls/${p.id}`), { candidates: newCandidates });
    }
  };

  const castVote = (pollId: string, candidateId: string) => {
    const p = state.value.polls.find(poll => poll.id === pollId);
    if (!p) return;

    if (hasVotedFor(p.id, p.sessionId)) return;

    // Use transaction to safely increment votes
    // We need to find the correct index in the DB array
    const candidatesRef = dbRef(db, `polls/${pollId}/candidates`);

    runTransaction(candidatesRef, (candidates) => {
      if (candidates) {
        const candidate = candidates.find((c: any) => c.id === candidateId);
        if (candidate) {
          candidate.votes = (candidate.votes || 0) + 1;
        }
      }
      return candidates;
    }).then(() => {
      // Only mark local voted AFTER successful transaction
      const key = `voted_${pollId}`;
      localStorage.setItem(key, p.sessionId);
    }).catch(err => {
      console.error("Vote failed", err);
    });
  };

  const startAllVoting = () => {
    state.value.polls.forEach(poll => {
      if (poll.status === 'setup') {
        update(dbRef(db, `polls/${poll.id}`), { status: 'voting' });
      }
    });
  };

  const endAllVoting = () => {
    state.value.polls.forEach(poll => {
      if (poll.status === 'voting') {
        update(dbRef(db, `polls/${poll.id}`), { status: 'ended' });
      }
    });
  };

  const resetAllVotes = () => {
    state.value.polls.forEach(poll => {
      const newCandidates = poll.candidates.map(c => ({ ...c, votes: 0 }));
      update(dbRef(db, `polls/${poll.id}`), {
        status: 'setup',
        candidates: newCandidates,
        sessionId: crypto.randomUUID()
      });
    });
  };

  return {
    state,
    activePoll,
    createPoll,
    deletePoll,
    setActivePoll,
    hasVotedFor,
    resetVote,
    resetVotesOnly,
    addCandidate,
    removeCandidate,
    updateCandidateName,
    updateTitle,
    setStatus,
    castVote,
    startAllVoting,
    endAllVoting,
    resetAllVotes
  };
}
