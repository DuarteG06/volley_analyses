import type { EventDetails, MatchData, MatchEvent, PointReason, Team, VolleyballSet } from './types';

const POINT_REASON_ALIASES: Record<string, PointReason> = {
  block: 'block',
  block_out: 'block_out',
  spike_kill: 'spike_kill',
  spike_tip: 'spike_tip',
  ace: 'ace',
  set_dump: 'set_dump',
  opponent_error: 'opponent_error',
  block_against: 'block_against',
  block_out_against: 'block_out_against',
  spike_kill_against: 'spike_kill_against',
  spike_tip_against: 'spike_tip_against',
  missed_free_ball: 'missed_free_ball',
  ball_into_net: 'ball_into_net',
  ball_out_of_bounds: 'ball_out_of_bounds',
  bad_set: 'bad_set',
  serve_miss: 'serve_miss',
  net_touch: 'net_touch',
  'net touch': 'net_touch',
  'net-touch': 'net_touch',
  backline_fault: 'backline_fault',
  'backline fault': 'backline_fault',
  'backline-fault': 'backline_fault',
  center_line_violation: 'center_line_violation',
  'center line violation': 'center_line_violation',
  'center-line-violation': 'center_line_violation',
  over_the_net_fault: 'over_the_net_fault',
  'over the net fault': 'over_the_net_fault',
  'over-the-net fault': 'over_the_net_fault',
  'over-the-net-fault': 'over_the_net_fault',
  four_touches: 'four_touches',
  '4 touches': 'four_touches',
  'four touches': 'four_touches',
  double_touch: 'double_touch',
  'double touch': 'double_touch',
  'double-touch': 'double_touch',
  amorti: 'spike_tip',
  amorti_against: 'spike_tip_against',
};

const normalizeTeam = (team: unknown): Team => (team === 'opponent' ? 'opponent' : 'us');

const normalizePointReason = (reason: unknown): PointReason => {
  if (typeof reason !== 'string') {
    return 'opponent_error';
  }

  const normalized = reason.trim().toLowerCase();
  return POINT_REASON_ALIASES[normalized] ?? 'opponent_error';
};

const normalizeEventDetails = (details: unknown): EventDetails => {
  if (!details || typeof details !== 'object') {
    return {};
  }

  const source = details as Record<string, unknown>;
  const normalized: EventDetails = {};

  if (source.protection === true || source.protection === false) {
    normalized.protection = source.protection;
  }

  if (source.failedReceive === true || source.failedReceive === false) {
    normalized.failedReceive = source.failedReceive;
  }

  if (source.receiveQuality === 'A' || source.receiveQuality === 'B' || source.receiveQuality === 'C') {
    normalized.receiveQuality = source.receiveQuality;
  }

  if (source.sideout === true || source.sideout === false) {
    normalized.sideout = source.sideout;
  }

  return normalized;
};

const normalizeEvent = (event: unknown, index: number): MatchEvent => {
  const source = event && typeof event === 'object' ? (event as Record<string, unknown>) : {};

  return {
    id: typeof source.id === 'string' ? source.id : `event-${index}`,
    timestamp: typeof source.timestamp === 'number' ? source.timestamp : Date.now(),
    scoringTeam: normalizeTeam(source.scoringTeam),
    servingTeam: normalizeTeam(source.servingTeam),
    reason: normalizePointReason(source.reason),
    details: normalizeEventDetails(source.details),
  };
};

const normalizeSet = (setData: unknown): VolleyballSet => {
  const source = setData && typeof setData === 'object' ? (setData as Record<string, unknown>) : {};
  const events = Array.isArray(source.events) ? source.events.map(normalizeEvent) : [];

  return {
    ourScore: typeof source.ourScore === 'number' ? source.ourScore : 0,
    opponentScore: typeof source.opponentScore === 'number' ? source.opponentScore : 0,
    events,
    finished: source.finished === true,
  };
};

export const normalizeMatchData = (data: unknown): MatchData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid match data');
  }

  const source = data as Record<string, unknown>;
  const sets = Array.isArray(source.sets) ? source.sets.map(normalizeSet) : [];

  if (sets.length === 0) {
    throw new Error('Invalid match data');
  }

  return {
    id: typeof source.id === 'string' ? source.id : Date.now().toString(),
    type: source.type === '5set' ? '5set' : '3set',
    status: source.status === 'finished' ? 'finished' : source.status === 'playing' ? 'playing' : 'setup',
    currentSetIndex:
      typeof source.currentSetIndex === 'number' && source.currentSetIndex >= 0 && source.currentSetIndex < sets.length
        ? source.currentSetIndex
        : 0,
    initialServer: normalizeTeam(source.initialServer),
    ourTeamName: typeof source.ourTeamName === 'string' ? source.ourTeamName : 'Our Team',
    opponentTeamName: typeof source.opponentTeamName === 'string' ? source.opponentTeamName : 'Opponent',
    sets,
  };
};

export const serializeMatch = (match: MatchData) => JSON.stringify(normalizeMatchData(match), null, 2);
