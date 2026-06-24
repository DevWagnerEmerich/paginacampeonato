export type BracketStyle = 'single-elimination' | 'round-robin';

export interface GameConfig {
  id: string;
  name: string;
  emoji: string;
  format: '1v1' | '2v2' | '4v4';
  bracketStyle: BracketStyle;
  isConfirmed: boolean;
  minTeams: number;
}

export interface Team {
  id: string;
  name: string;
  flag: string;
  gameId: string;
  gameName: string;
  type: 'individual' | 'dupla' | 'time';
  members: string[]; // members with names
  contact: string;
  status: 'approved' | 'pending' | 'suspended';
  wins: number;
  losses: number;
  draws: number;
  points: number;
  mvps: number;
  teamCode?: string; // 6-digit random code for roster-sharing
  stats?: { memberName: string; goals?: number; kills?: number; assists?: number }[];
}

export interface Match {
  id: string;
  gameId: string;
  gameName: string;
  gameEmoji: string;
  team1Id: string;
  team1Name: string;
  team1Flag: string;
  team2Id: string;
  team2Name: string;
  team2Flag: string;
  score1: number | null;
  score2: number | null;
  phase: string; // 'Grupos' | 'Oitavas' | 'Quartas' | 'Semifinais' | 'Final'
  side?: 'left' | 'right' | 'center';
  groupName?: string; // e.g. 'Grupo A'
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isLive: boolean;
  streamUrl?: string; // Overrides global stream if specific
  winnerId?: string;
  mvp?: string;
  topScorer?: string;
  checkInTeam1?: boolean;
  checkInTeam2?: boolean;
  playerStats?: { playerName: string; teamId: string; value: number; type: 'gols' | 'kills' }[];
}

export interface Group {
  id: string;
  gameId: string;
  name: string; // 'Grupo A', 'Grupo B'
  teamIds: string[];
}

export interface GameSuggestion {
  id: string;
  studentName: string;
  gameName: string;
  formatSuggested: string;
  votesCount: number;
  votedBy: string[]; // user ip/fingerprint or email mock
}

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string; // ISO string
  type: 'match_soon' | 'match_start' | 'result_update' | 'announcement';
  gameId?: string;
}

export interface ChampionHistory {
  id: string;
  gameName: string;
  emoji: string;
  edition: string;
  year: string;
  championName: string;
  championFlag: string;
  runnerUpName: string;
  runnerUpFlag: string;
}

export interface AppSettings {
  id: string;
  logo: string;
  schoolName: string;
  eventTitle: string;
  edition: string;
  description: string;
  countdownDate: string; // ISO string
  liveStreamUrl: string; // Stream link (YT / Twitch)
  registrationDeadline: string; // ISO string para limite de inscrição de equipes
}
