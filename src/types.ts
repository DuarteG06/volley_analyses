export type Team = 'us' | 'opponent';

export type ReceiveQuality = 'A' | 'B' | 'C';

export interface EventDetails {
  protection?: boolean; // Block against us: ask if protection existed
  failedReceive?: boolean; // Spike kill against us: good spike or failed receive?
  receiveQuality?: ReceiveQuality; // Receive quality: A/B/C
}

export type PointReason = 
  | 'block'
  | 'spike_kill'
  | 'ace'
  | 'set_dump'
  | 'opponent_error'
  | 'block_against'
  | 'spike_kill_against'
  | 'missed_free_ball'
  | 'ball_into_net'
  | 'ball_out_of_bounds'
  | 'bad_set'
  | 'serve_miss';

export interface MatchEvent {
  id: string;
  timestamp: number;
  scoringTeam: Team;
  servingTeam: Team;
  reason: PointReason;
  details: EventDetails;
}

export interface VolleyballSet {
  ourScore: number;
  opponentScore: number;
  events: MatchEvent[];
  finished: boolean;
}

export type MatchType = '3set' | '5set';

export interface MatchData {
  id: string;
  type: MatchType;
  sets: VolleyballSet[];
  currentSetIndex: number;
  status: 'setup' | 'playing' | 'finished';
  initialServer: Team;
}
