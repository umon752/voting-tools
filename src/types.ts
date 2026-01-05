export interface Candidate {
  id: string;
  name: string;
  votes: number;
}

export type VoteStatus = 'setup' | 'voting' | 'ended';

export interface Poll {
  id: string;
  title: string;
  status: VoteStatus;
  candidates: Candidate[];
  sessionId: string;
  createdAt: number;
}

export interface GlobalState {
  polls: Poll[];
  activePollId: string | null;
}
