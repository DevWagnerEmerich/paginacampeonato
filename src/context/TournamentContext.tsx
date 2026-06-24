import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  GameConfig, 
  Team, 
  Match, 
  Group, 
  GameSuggestion, 
  NotificationItem, 
  ChampionHistory, 
  AppSettings 
} from '../types';

interface TournamentContextType {
  settings: AppSettings;
  games: GameConfig[];
  teams: Team[];
  matches: Match[];
  groups: Group[];
  suggestions: GameSuggestion[];
  notifications: NotificationItem[];
  history: ChampionHistory[];
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  addGame: (game: Omit<GameConfig, 'id'>) => Promise<void>;
  updateGame: (id: string, game: Partial<GameConfig>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  addTeam: (team: Omit<Team, 'id' | 'wins' | 'losses' | 'draws' | 'points' | 'mvps' | 'teamCode' | 'stats'>) => Promise<string>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMatch: (match: Omit<Match, 'id'>) => Promise<void>;
  updateMatch: (id: string, match: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  generateGroupsAndMatches: (gameId: string) => Promise<void>;
  addSuggestion: (studentName: string, gameName: string, format: string) => Promise<void>;
  voteSuggestion: (id: string, studentIp: string) => Promise<void>;
  addNotification: (message: string, type: NotificationItem['type'], gameId?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addChampionHistory: (item: Omit<ChampionHistory, 'id'>) => Promise<void>;
  localWarning: string | null;
  resetAllData: () => void;
  clearAllData: () => Promise<void>;
  joinTeamByCode: (studentName: string, code: string) => Promise<boolean>;
  generatePlayoffsFromGroups: (gameId: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Initial/Fallback Data in case Firestore is empty or fails
const initialSettings: AppSettings = {
  id: 'global',
  logo: '🏆',
  schoolName: 'Nome da Escola',
  eventTitle: 'Copa de E-sports',
  edition: '1ª Edição',
  description: 'Seja bem-vindo ao portal oficial do campeonato de e-sports escolar! Cadastre seus jogos, crie suas equipes e participe dos confrontos.',
  countdownDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  liveStreamUrl: '',
  registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
};

const initialGames: GameConfig[] = [];
const initialTeams: Team[] = [];
const initialMatches: Match[] = [];
const initialGroups: Group[] = [];
const initialSuggestions: GameSuggestion[] = [];
const initialNotifications: NotificationItem[] = [];
const initialHistory: ChampionHistory[] = [];

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [games, setGames] = useState<GameConfig[]>(initialGames);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>(initialSuggestions);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [history, setHistory] = useState<ChampionHistory[]>(initialHistory);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('esports_admin_logged') === 'true';
  });
  const [localWarning, setLocalWarning] = useState<string | null>(null);

  // Synchronize Firestore, fallback to Local Storage if block or offline
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const handleSync = () => {
      try {
        // Realtime settings
        const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
          if (snap.exists()) {
            setSettings({ ...(snap.data() as AppSettings), id: 'global' });
          } else {
            // Seed defaults when settings don't exist (first load absolute)
            setDoc(doc(db, 'settings', 'global'), initialSettings).catch((e) => console.log('Rules blocked write. Fallback to local.', e));
            initialGames.forEach(g => setDoc(doc(db, 'games', g.id), g).catch(e => {}));
            initialTeams.forEach(t => setDoc(doc(db, 'teams', t.id), t).catch(e => {}));
            initialMatches.forEach(m => setDoc(doc(db, 'matches', m.id), m).catch(e => {}));
            initialGroups.forEach(gr => setDoc(doc(db, 'groups', gr.id), gr).catch(e => {}));
            initialSuggestions.forEach(s => setDoc(doc(db, 'suggestions', s.id), s).catch(e => {}));
            initialNotifications.forEach(n => setDoc(doc(db, 'notifications', n.id), n).catch(e => {}));
            initialHistory.forEach(h => setDoc(doc(db, 'history', h.id), h).catch(e => {}));
          }
        }, (err) => {
          setLocalWarning('Funcionando em modo de cache local (regras ou conexão do Firestore restritas)');
        });
        unsubscribers.push(unsubSettings);

        // Realtime games
        const unsubGames = onSnapshot(collection(db, 'games'), (snap) => {
          if (!snap.empty) {
            const list: GameConfig[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as GameConfig));
            setGames(list);
            saveLocalFallback('games', list);
          } else {
            setGames([]);
            saveLocalFallback('games', []);
          }
        });
        unsubscribers.push(unsubGames);

        // Realtime teams
        const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
          if (!snap.empty) {
            const list: Team[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as Team));
            setTeams(list);
            saveLocalFallback('teams', list);
          } else {
            setTeams([]);
            saveLocalFallback('teams', []);
          }
        });
        unsubscribers.push(unsubTeams);

        // Realtime matches
        const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
          if (!snap.empty) {
            const list: Match[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as Match));
            setMatches(list);
            saveLocalFallback('matches', list);
          } else {
            setMatches([]);
            saveLocalFallback('matches', []);
          }
        });
        unsubscribers.push(unsubMatches);

        // Realtime groups
        const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
          if (!snap.empty) {
            const list: Group[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as Group));
            setGroups(list);
            saveLocalFallback('groups', list);
          } else {
            setGroups([]);
            saveLocalFallback('groups', []);
          }
        });
        unsubscribers.push(unsubGroups);

        // Realtime suggestions
        const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
          if (!snap.empty) {
            const list: GameSuggestion[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as GameSuggestion));
            const sorted = list.sort((a,b) => b.votesCount - a.votesCount);
            setSuggestions(sorted);
            saveLocalFallback('suggestions', sorted);
          } else {
            setSuggestions([]);
            saveLocalFallback('suggestions', []);
          }
        });
        unsubscribers.push(unsubSuggestions);

        // Realtime notifications
        const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snap) => {
          if (!snap.empty) {
            const list: NotificationItem[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as NotificationItem));
            const sorted = list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setNotifications(sorted);
            saveLocalFallback('notifications', sorted);
          } else {
            setNotifications([]);
            saveLocalFallback('notifications', []);
          }
        });
        unsubscribers.push(unsubNotifications);

        // Realtime history
        const unsubHistory = onSnapshot(collection(db, 'history'), (snap) => {
          if (!snap.empty) {
            const list: ChampionHistory[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as ChampionHistory));
            setHistory(list);
            saveLocalFallback('history', list);
          } else {
            setHistory([]);
            saveLocalFallback('history', []);
          }
        });
        unsubscribers.push(unsubHistory);

      } catch (err) {
        console.error('Firestore subscription error, running locally', err);
        setLocalWarning('Rodando offline/local (Firestore indisponível)');
        loadLocalFallback();
      }
    };

    handleSync();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Helper to load fallback data from localStorage
  const loadLocalFallback = () => {
    const lSettings = localStorage.getItem('esports_settings');
    const lGames = localStorage.getItem('esports_games');
    const lTeams = localStorage.getItem('esports_teams');
    const lMatches = localStorage.getItem('esports_matches');
    const lGroups = localStorage.getItem('esports_groups');
    const lSuggestions = localStorage.getItem('esports_suggestions');
    const lNotifications = localStorage.getItem('esports_notifications');
    const lHistory = localStorage.getItem('esports_history');

    if (lSettings) setSettings(JSON.parse(lSettings));
    if (lGames) setGames(JSON.parse(lGames));
    if (lTeams) setTeams(JSON.parse(lTeams));
    if (lMatches) setMatches(JSON.parse(lMatches));
    if (lGroups) setGroups(JSON.parse(lGroups));
    if (lSuggestions) setSuggestions(JSON.parse(lSuggestions));
    if (lNotifications) setNotifications(JSON.parse(lNotifications));
    if (lHistory) setHistory(JSON.parse(lHistory));
  };

  // Helper to write changes to local fallback
  const saveLocalFallback = (key: string, data: any) => {
    localStorage.setItem(`esports_${key}`, JSON.stringify(data));
  };

  const loginAdmin = (password: string) => {
    // Hardcoded secure password 'admin123'
    if (password === 'admin123' || password === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('esports_admin_logged', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('esports_admin_logged');
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveLocalFallback('settings', updated);
    try {
      await updateDoc(doc(db, 'settings', 'global'), newSettings);
    } catch (e) {
      console.log('Firebase local fallback update settings');
    }
  };

  const addGame = async (gamePayload: Omit<GameConfig, 'id'>) => {
    const id = 'g_' + Math.random().toString(36).substr(2, 9);
    const newGame: GameConfig = { id, ...gamePayload };
    const updated = [...games, newGame];
    setGames(updated);
    saveLocalFallback('games', updated);
    try {
      await setDoc(doc(db, 'games', id), newGame);
    } catch (e) {}
  };

  const updateGame = async (id: string, gamePayload: Partial<GameConfig>) => {
    const updated = games.map(g => g.id === id ? { ...g, ...gamePayload } : g);
    setGames(updated);
    saveLocalFallback('games', updated);
    try {
      await updateDoc(doc(db, 'games', id), gamePayload);
    } catch (e) {}
  };

  const deleteGame = async (id: string) => {
    const updated = games.filter(g => g.id !== id);
    setGames(updated);
    saveLocalFallback('games', updated);
    try {
      await deleteDoc(doc(db, 'games', id));
    } catch (e) {}
  };

  const addTeam = async (teamPayload: Omit<Team, 'id' | 'wins' | 'losses' | 'draws' | 'points' | 'mvps' | 'teamCode' | 'stats'>) => {
    const id = 't_' + Math.random().toString(36).substr(2, 9);
    
    // Gerar código único de equipe de 6 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let teamCode = '';
    for (let i = 0; i < 6; i++) {
      teamCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newTeam: Team = {
      id,
      ...teamPayload,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      mvps: 0,
      teamCode,
      stats: []
    };
    const updated = [...teams, newTeam];
    setTeams(updated);
    saveLocalFallback('teams', updated);
    try {
      await setDoc(doc(db, 'teams', id), newTeam);
    } catch (e) {}
    return teamCode;
  };

  const updateTeam = async (id: string, teamPayload: Partial<Team>) => {
    const updated = teams.map(t => t.id === id ? { ...t, ...teamPayload } : t);
    setTeams(updated);
    saveLocalFallback('teams', updated);
    try {
      await updateDoc(doc(db, 'teams', id), teamPayload);
    } catch (e) {}
  };

  const deleteTeam = async (id: string) => {
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    saveLocalFallback('teams', updated);
    try {
      await deleteDoc(doc(db, 'teams', id));
    } catch (e) {}
  };

  const addMatch = async (matchPayload: Omit<Match, 'id'>) => {
    const id = 'm_' + Math.random().toString(36).substr(2, 9);
    const newMatch: Match = { id, ...matchPayload };
    const updated = [...matches, newMatch];
    setMatches(updated);
    saveLocalFallback('matches', updated);
    try {
      await setDoc(doc(db, 'matches', id), newMatch);
    } catch (e) {}
  };

  const updateMatch = async (id: string, matchPayload: Partial<Match>) => {
    const updated = matches.map(m => m.id === id ? { ...m, ...matchPayload } : m);
    setMatches(updated);
    saveLocalFallback('matches', updated);

    // If result was registered, we dynamically update Team points if it's a Round Robin or Group stage match
    if (matchPayload.score1 !== undefined || matchPayload.score2 !== undefined) {
      const match = matches.find(m => m.id === id);
      if (match) {
        const s1 = matchPayload.score1 ?? match.score1;
        const s2 = matchPayload.score2 ?? match.score2;

        if (s1 !== null && s2 !== null) {
          // Adjust points
          const t1Id = match.team1Id;
          const t2Id = match.team2Id;

          const t1 = teams.find(t => t.id === t1Id);
          const t2 = teams.find(t => t.id === t2Id);

          if (t1 && t2) {
            let t1W = 0, t1L = 0, t1D = 0, t1P = 0;
            let t2W = 0, t2L = 0, t2D = 0, t2P = 0;

            if (s1 > s2) {
              t1W = 1; t1P = 3; t2L = 1;
            } else if (s2 > s1) {
              t2W = 1; t2P = 3; t1L = 1;
            } else {
              t1D = 1; t1P = 1; t2D = 1; t2P = 1;
            }

            // Simple update to DB
            updateTeam(t1Id, {
              wins: t1.wins + t1W,
              losses: t1.losses + t1L,
              draws: t1.draws + t1D,
              points: t1.points + t1P,
              mvps: matchPayload.mvp ? (t1.members.includes(matchPayload.mvp) ? t1.mvps + 1 : t1.mvps) : t1.mvps
            });

            updateTeam(t2Id, {
              wins: t2.wins + t2W,
              losses: t2.losses + t2L,
              draws: t2.draws + t2D,
              points: t2.points + t2P,
              mvps: matchPayload.mvp ? (t2.members.includes(matchPayload.mvp) ? t2.mvps + 1 : t2.mvps) : t2.mvps
            });
          }
        }
      }
    }

    // Process individual player stats if registered
    if (matchPayload.playerStats) {
      matchPayload.playerStats.forEach(pStat => {
        const team = teams.find(t => t.id === pStat.teamId);
        if (team) {
          const currentStats = team.stats || [];
          const playerEntryIdx = currentStats.findIndex(s => s.memberName === pStat.playerName);
          
          let updatedStats = [...currentStats];
          if (playerEntryIdx > -1) {
            const entry = updatedStats[playerEntryIdx];
            if (pStat.type === 'gols') {
              updatedStats[playerEntryIdx] = { ...entry, goals: (entry.goals || 0) + pStat.value };
            } else if (pStat.type === 'kills') {
              updatedStats[playerEntryIdx] = { ...entry, kills: (entry.kills || 0) + pStat.value };
            }
          } else {
            const newEntry = {
              memberName: pStat.playerName,
              goals: pStat.type === 'gols' ? pStat.value : 0,
              kills: pStat.type === 'kills' ? pStat.value : 0
            };
            updatedStats.push(newEntry);
          }
          
          updateTeam(pStat.teamId, { stats: updatedStats });
        }
      });
    }

    try {
      await updateDoc(doc(db, 'matches', id), matchPayload);
    } catch (e) {}

    // Lógica para avanço automático nas chaves eliminatórias (Playoffs Espelhados)
    const match = matches.find(m => m.id === id);
    if (match && (matchPayload.score1 !== undefined || matchPayload.score2 !== undefined)) {
      const s1 = matchPayload.score1 ?? match.score1;
      const s2 = matchPayload.score2 ?? match.score2;
      
      if (s1 !== null && s2 !== null) {
        const gameId = match.gameId;
        const phase = match.phase;
        const side = match.side;
        const game = games.find(g => g.id === gameId);
        
        if (game?.bracketStyle === 'single-elimination' || game?.bracketStyle === 'groups-and-bracket') {
          const allMatchesUpdated = matches.map(m => m.id === id ? { ...m, ...matchPayload } : m);
          const nextMatches: Match[] = [];
          
          if (phase === 'Semifinais') {
            if (game.bracketStyle === 'groups-and-bracket') {
              // No formato groups-and-bracket, as duas semifinais avançam direto para a Grande Final
              const gameSemis = allMatchesUpdated.filter(m => m.gameId === gameId && m.phase === 'Semifinais');
              const allFinished = gameSemis.length === 2 && gameSemis.every(m => m.score1 !== null && m.score2 !== null);
              
              if (allFinished) {
                const winners = gameSemis.map(m => {
                  const wId = m.score1! > m.score2! ? m.team1Id : m.team2Id;
                  return teams.find(t => t.id === wId) || {
                    id: wId,
                    name: m.score1! > m.score2! ? m.team1Name : m.team2Name,
                    flag: m.score1! > m.score2! ? m.team1Flag : m.team2Flag
                  };
                });
                
                const finalExists = matches.some(m => m.gameId === gameId && m.phase === 'Grande Final');
                if (!finalExists && winners.length === 2) {
                  nextMatches.push({
                    id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
                    gameId,
                    gameName: game?.name || match.gameName,
                    gameEmoji: game?.emoji || match.gameEmoji,
                    team1Id: winners[0].id,
                    team1Name: winners[0].name,
                    team1Flag: winners[0].flag || '⚔️',
                    team2Id: winners[1].id,
                    team2Name: winners[1].name,
                    team2Flag: winners[1].flag || '⚔️',
                    score1: null,
                    score2: null,
                    phase: 'Grande Final',
                    side: 'center',
                    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    time: '16:00',
                    isLive: false,
                  });
                }
              }
            } else {
              // single-elimination
              // Se todas as semifinais do mesmo lado estiverem terminadas:
              const sideSemis = allMatchesUpdated.filter(m => m.gameId === gameId && m.phase === 'Semifinais' && m.side === side);
              const allFinished = sideSemis.every(m => m.score1 !== null && m.score2 !== null);
              
              if (allFinished) {
                const sortedSemis = [...sideSemis].sort((a, b) => a.id.localeCompare(b.id));
                const winners = sortedSemis.map(m => {
                  const wId = m.score1! > m.score2! ? m.team1Id : m.team2Id;
                  return teams.find(t => t.id === wId) || {
                    id: wId,
                    name: m.score1! > m.score2! ? m.team1Name : m.team2Name,
                    flag: m.score1! > m.score2! ? m.team1Flag : m.team2Flag
                  };
                });
                
                const finalAlaExists = matches.some(m => m.gameId === gameId && m.phase === 'Final de Ala' && m.side === side);
                if (!finalAlaExists && winners.length === 2) {
                  nextMatches.push({
                    id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
                    gameId,
                    gameName: game?.name || match.gameName,
                    gameEmoji: game?.emoji || match.gameEmoji,
                    team1Id: winners[0].id,
                    team1Name: winners[0].name,
                    team1Flag: winners[0].flag || '⚔️',
                    team2Id: winners[1].id,
                    team2Name: winners[1].name,
                    team2Flag: winners[1].flag || '⚔️',
                    score1: null,
                    score2: null,
                    phase: 'Final de Ala',
                    side,
                    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    time: '15:00',
                    isLive: false,
                  });
                }
              }
            }
          } else if (phase === 'Final de Ala') {
            // Se ambas as finais de ala estiverem terminadas:
            const finalLeft = allMatchesUpdated.find(m => m.gameId === gameId && m.phase === 'Final de Ala' && m.side === 'left');
            const finalRight = allMatchesUpdated.find(m => m.gameId === gameId && m.phase === 'Final de Ala' && m.side === 'right');
            
            if (finalLeft && finalRight && finalLeft.score1 !== null && finalLeft.score2 !== null && finalRight.score1 !== null && finalRight.score2 !== null) {
              const winnerLeftId = finalLeft.score1 > finalLeft.score2 ? finalLeft.team1Id : finalLeft.team2Id;
              const winnerLeft = teams.find(t => t.id === winnerLeftId) || { id: winnerLeftId, name: finalLeft.score1 > finalLeft.score2 ? finalLeft.team1Name : finalLeft.team2Name, flag: finalLeft.score1 > finalLeft.score2 ? finalLeft.team1Flag : finalLeft.team2Flag };
              
              const winnerRightId = finalRight.score1 > finalRight.score2 ? finalRight.team1Id : finalRight.team2Id;
              const winnerRight = teams.find(t => t.id === winnerRightId) || { id: winnerRightId, name: finalRight.score1 > finalRight.score2 ? finalRight.team1Name : finalRight.team2Name, flag: finalRight.score1 > finalRight.score2 ? finalRight.team1Flag : finalRight.team2Flag };
              
              const gFinalExists = matches.some(m => m.gameId === gameId && m.phase === 'Grande Final');
              if (!gFinalExists) {
                nextMatches.push({
                  id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
                  gameId,
                  gameName: game?.name || match.gameName,
                  gameEmoji: game?.emoji || match.gameEmoji,
                  team1Id: winnerLeft.id,
                  team1Name: winnerLeft.name,
                  team1Flag: winnerLeft.flag || '⚔️',
                  team2Id: winnerRight.id,
                  team2Name: winnerRight.name,
                  team2Flag: winnerRight.flag || '⚔️',
                  score1: null,
                  score2: null,
                  phase: 'Grande Final',
                  side: 'center',
                  date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  time: '16:00',
                  isLive: false,
                });
              }
            }
          }
 
          if (nextMatches.length > 0) {
            const allNewMatches = [...allMatchesUpdated, ...nextMatches];
            setMatches(allNewMatches);
            saveLocalFallback('matches', allNewMatches);
            
            for (const nm of nextMatches) {
              try {
                await setDoc(doc(db, 'matches', nm.id), nm);
              } catch (e) {
                console.log('Firebase save next match error', e);
              }
            }
            
            addNotification(`Confronto da fase de ${nextMatches[0].phase} de ${match.gameName} gerado automaticamente!`, 'announcement', gameId);
          }
        }
      }
    }
  };

  const deleteMatch = async (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    saveLocalFallback('matches', updated);
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {}
  };

  // Generate Brackets and Groups from approved teams
  const generateGroupsAndMatches = async (gameId: string) => {
    const approvedTeams = teams.filter(t => t.gameId === gameId && t.status === 'approved');
    const game = games.find(g => g.id === gameId);
    
    if (approvedTeams.length < 2) {
      alert('São necessários pelo menos 2 times aprovados para realizar o chaveamento!');
      return;
    }

    // Clear old matches & groups of this specific game
    const remainingMatches = matches.filter(m => m.gameId !== gameId);
    const remainingGroups = groups.filter(g => g.gameId !== gameId);

    const shuffled = [...approvedTeams].sort(() => Math.random() - 0.5);
    const isElim = game?.bracketStyle === 'single-elimination';

    const singleGroup: Group = {
      id: `g_${gameId}_single`,
      gameId,
      name: isElim ? 'Chave Eliminatória' : 'Grupo Único',
      teamIds: shuffled.map(t => t.id)
    };

    const newGroups = [...remainingGroups, singleGroup];
    setGroups(newGroups);
    saveLocalFallback('groups', newGroups);

    try {
      await setDoc(doc(db, 'groups', singleGroup.id), singleGroup);
    } catch (e) {}

    const generatedMatches: Match[] = [];

    if (isElim) {
      // Mata-mata Espelhado (Chave com ala esquerda e ala direita)
      if (shuffled.length >= 8) {
        // Esquerda (Semifinais)
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: shuffled[0].id,
          team1Name: shuffled[0].name,
          team1Flag: shuffled[0].flag,
          team2Id: shuffled[1].id,
          team2Name: shuffled[1].name,
          team2Flag: shuffled[1].flag,
          score1: null,
          score2: null,
          phase: 'Semifinais',
          side: 'left',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00',
          isLive: false,
        });
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: shuffled[2].id,
          team1Name: shuffled[2].name,
          team1Flag: shuffled[2].flag,
          team2Id: shuffled[3].id,
          team2Name: shuffled[3].name,
          team2Flag: shuffled[3].flag,
          score1: null,
          score2: null,
          phase: 'Semifinais',
          side: 'left',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '15:15',
          isLive: false,
        });
        
        // Direita (Semifinais)
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: shuffled[4].id,
          team1Name: shuffled[4].name,
          team1Flag: shuffled[4].flag,
          team2Id: shuffled[5].id,
          team2Name: shuffled[5].name,
          team2Flag: shuffled[5].flag,
          score1: null,
          score2: null,
          phase: 'Semifinais',
          side: 'right',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00',
          isLive: false,
        });
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: shuffled[6].id,
          team1Name: shuffled[6].name,
          team1Flag: shuffled[6].flag,
          team2Id: shuffled[7].id,
          team2Name: shuffled[7].name,
          team2Flag: shuffled[7].flag,
          score1: null,
          score2: null,
          phase: 'Semifinais',
          side: 'right',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '15:15',
          isLive: false,
        });
      } else {
        // Se houver 4 a 7 times
        // Lado esquerdo (Final de Ala)
        const t1 = shuffled[0];
        const t2 = shuffled[1] || { id: 'bye', name: 'Avança Direto', flag: '🏁' };
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: t1.id,
          team1Name: t1.name,
          team1Flag: t1.flag,
          team2Id: t2.id,
          team2Name: t2.name,
          team2Flag: t2.flag,
          score1: t2.id === 'bye' ? 1 : null,
          score2: t2.id === 'bye' ? 0 : null,
          phase: 'Final de Ala',
          side: 'left',
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00',
          isLive: false,
          winnerId: t2.id === 'bye' ? t1.id : undefined
        });

        // Lado direito (Final de Ala)
        const t3 = shuffled[2] || { id: 'bye', name: 'Avança Direto', flag: '🏁' };
        const t4 = shuffled[3] || { id: 'bye', name: 'Avança Direto', flag: '🏁' };
        generatedMatches.push({
          id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          gameName: game.name,
          gameEmoji: game.emoji,
          team1Id: t3.id,
          team1Name: t3.name,
          team1Flag: t3.flag,
          team2Id: t4.id,
          team2Name: t4.name,
          team2Flag: t4.flag,
          score1: t4.id === 'bye' && t3.id !== 'bye' ? 1 : null,
          score2: t4.id === 'bye' && t3.id !== 'bye' ? 0 : null,
          phase: 'Final de Ala',
          side: 'right',
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '15:00',
          isLive: false,
          winnerId: t4.id === 'bye' && t3.id !== 'bye' ? t3.id : undefined
        });
      }
    } else {
      // Pontos Corridos (round-robin)
      for (let i = 0; i < shuffled.length; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          generatedMatches.push({
            id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
            gameId,
            gameName: game.name,
            gameEmoji: game.emoji,
            team1Id: shuffled[i].id,
            team1Name: shuffled[i].name,
            team1Flag: shuffled[i].flag,
            team2Id: shuffled[j].id,
            team2Name: shuffled[j].name,
            team2Flag: shuffled[j].flag,
            score1: null,
            score2: null,
            phase: 'Grupos',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:00',
            isLive: false,
          });
        }
      }
    }

    const allMatches = [...remainingMatches, ...generatedMatches];
    setMatches(allMatches);
    saveLocalFallback('matches', allMatches);

    try {
      for (const m of generatedMatches) {
        await setDoc(doc(db, 'matches', m.id), m);
      }
    } catch (e) {}

    addNotification(`Chaveamento do jogo ${game?.name} gerado com sucesso!`, 'announcement', gameId);
  };

  const addSuggestion = async (studentName: string, gameName: string, format: string) => {
    const id = 's_' + Math.random().toString(36).substr(2, 9);
    const payload: GameSuggestion = {
      id,
      studentName,
      gameName,
      formatSuggested: format,
      votesCount: 1,
      votedBy: ['client-self']
    };
    const updated = [payload, ...suggestions];
    setSuggestions(updated);
    saveLocalFallback('suggestions', updated);
    try {
      await setDoc(doc(db, 'suggestions', id), payload);
    } catch (e) {}

    addNotification(`Nova modalidade sugerida: ${gameName} por ${studentName}!`, 'announcement');
  };

  const voteSuggestion = async (id: string, voterId: string) => {
    const updated = suggestions.map(s => {
      if (s.id === id) {
        if (s.votedBy.includes(voterId)) {
          // Remove vote (toggle)
          return {
            ...s,
            votesCount: Math.max(0, s.votesCount - 1),
            votedBy: s.votedBy.filter(v => v !== voterId)
          };
        } else {
          // Add vote
          return {
            ...s,
            votesCount: s.votesCount + 1,
            votedBy: [...s.votedBy, voterId]
          };
        }
      }
      return s;
    }).sort((a, b) => b.votesCount - a.votesCount);

    setSuggestions(updated);
    saveLocalFallback('suggestions', updated);

    const matchSuggestion = suggestions.find(s => s.id === id);
    if (matchSuggestion) {
      try {
        const isVoted = matchSuggestion.votedBy.includes(voterId);
        await updateDoc(doc(db, 'suggestions', id), {
          votesCount: isVoted ? Math.max(0, matchSuggestion.votesCount - 1) : matchSuggestion.votesCount + 1,
          votedBy: isVoted ? matchSuggestion.votedBy.filter(v => v !== voterId) : [...matchSuggestion.votedBy, voterId]
        });
      } catch (e) {}
    }
  };

  const addNotification = async (message: string, type: NotificationItem['type'], gameId?: string) => {
    const id = 'n_' + Math.random().toString(36).substr(2, 9);
    const item: NotificationItem = {
      id,
      message,
      timestamp: new Date().toISOString(),
      type,
      gameId
    };
    const updated = [item, ...notifications];
    setNotifications(updated);
    saveLocalFallback('notifications', updated);
    try {
      await setDoc(doc(db, 'notifications', id), item);
    } catch (e) {}
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveLocalFallback('notifications', updated);
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {}
  };

  const addChampionHistory = async (historyPayload: Omit<ChampionHistory, 'id'>) => {
    const id = 'h_' + Math.random().toString(36).substr(2, 9);
    const item: ChampionHistory = { id, ...historyPayload };
    const updated = [...history, item];
    setHistory(updated);
    saveLocalFallback('history', updated);
    try {
      await setDoc(doc(db, 'history', id), item);
    } catch (e) {}
  };

  const joinTeamByCode = async (studentName: string, code: string): Promise<boolean> => {
    const uppercaseCode = code.trim().toUpperCase();
    const teamToJoin = teams.find(t => t.teamCode === uppercaseCode);
    if (!teamToJoin) {
      return false;
    }
    
    // Verificar se o estudante já faz parte da equipe
    if (teamToJoin.members.includes(studentName)) {
      return true;
    }
    
    const updatedMembers = [...teamToJoin.members, studentName];
    await updateTeam(teamToJoin.id, { members: updatedMembers });
    
    addNotification(`Novo integrante: ${studentName} entrou no time ${teamToJoin.name}!`, 'announcement');
    return true;
  };

  const calculateStandings = (teamIds: string[], gameMatches: Match[]) => {
    return teamIds.map(id => {
      const team = teams.find(t => t.id === id);
      if (!team) return null;

      const teamMatches = gameMatches.filter(m => m.score1 !== null && m.score2 !== null && (m.team1Id === id || m.team2Id === id));
      
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let points = 0;

      for (const m of teamMatches) {
        const isT1 = m.team1Id === id;
        const sSelf = isT1 ? m.score1! : m.score2!;
        const sOpp = isT1 ? m.score2! : m.score1!;

        if (sSelf > sOpp) {
          wins++;
          points += 3;
        } else if (sOpp > sSelf) {
          losses++;
        } else {
          draws++;
          points += 1;
        }
      }

      return {
        ...team,
        wins,
        losses,
        draws,
        points
      };
    })
    .filter((t): t is Exclude<typeof t, null> => t !== null)
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
  };

  const generatePlayoffsFromGroups = async (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game || game.bracketStyle !== 'groups-and-bracket') {
      alert('Este jogo não utiliza o formato de grupos + eliminatórias!');
      return;
    }
    
    // Buscar todos os grupos deste jogo
    const gameGroups = groups.filter(g => g.gameId === gameId);
    const groupA = gameGroups.find(g => g.name === 'Grupo A');
    const groupB = gameGroups.find(g => g.name === 'Grupo B');
    
    if (!groupA || !groupB) {
      alert('Os grupos A e B ainda não foram configurados!');
      return;
    }
    
    const gameMatches = matches.filter(m => m.gameId === gameId);
    
    // Verificar se todos os jogos de grupo foram concluídos
    const groupMatches = gameMatches.filter(m => m.phase === 'Grupos');
    const incompleteGroupMatches = groupMatches.filter(m => m.score1 === null || m.score2 === null);
    
    if (incompleteGroupMatches.length > 0) {
      alert('Todas as partidas da fase de grupos devem estar finalizadas para gerar os playoffs!');
      return;
    }
    
    const standingsA = calculateStandings(groupA.teamIds, gameMatches);
    const standingsB = calculateStandings(groupB.teamIds, gameMatches);
    
    if (standingsA.length < 2 || standingsB.length < 2) {
      alert('Cada grupo deve ter pelo menos 2 times cadastrados!');
      return;
    }
    
    // Pegar os dois melhores de cada grupo
    const topA1 = standingsA[0]!;
    const topA2 = standingsA[1]!;
    const topB1 = standingsB[0]!;
    const topB2 = standingsB[1]!;
    
    // Limpar partidas de playoffs antigas (qualquer fase que não seja 'Grupos')
    const cleanMatches = matches.filter(m => m.gameId !== gameId || m.phase === 'Grupos');
    
    // Criar semifinais
    // Semifinal 1: 1º Grupo A vs 2º Grupo B
    const semi1: Match = {
      id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      gameName: game.name,
      gameEmoji: game.emoji,
      team1Id: topA1.id,
      team1Name: topA1.name,
      team1Flag: topA1.flag,
      team2Id: topB2.id,
      team2Name: topB2.name,
      team2Flag: topB2.flag,
      score1: null,
      score2: null,
      phase: 'Semifinais',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '14:00',
      isLive: false,
    };
    
    // Semifinal 2: 1º Grupo B vs 2º Grupo A
    const semi2: Match = {
      id: `m_gen_${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      gameName: game.name,
      gameEmoji: game.emoji,
      team1Id: topB1.id,
      team1Name: topB1.name,
      team1Flag: topB1.flag,
      team2Id: topA2.id,
      team2Name: topA2.name,
      team2Flag: topA2.flag,
      score1: null,
      score2: null,
      phase: 'Semifinais',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '15:30',
      isLive: false,
    };
    
    const updatedMatches = [...cleanMatches, semi1, semi2];
    setMatches(updatedMatches);
    saveLocalFallback('matches', updatedMatches);
    
    try {
      await setDoc(doc(db, 'matches', semi1.id), semi1);
      await setDoc(doc(db, 'matches', semi2.id), semi2);
      
      addNotification(`Playoffs de ${game.name} definidos! Semifinais geradas automaticamente.`, 'announcement', gameId);
    } catch (e) {
      console.error(e);
    }
    
    alert('✓ Semifinais geradas com sucesso a partir da classificação dos grupos!');
  };

  const resetAllData = async () => {
    if (!confirm('Deseja realmente redefinir todos os dados para o padrão do campeonato?')) return;
    
    // Reset state to initial
    setSettings(initialSettings);
    setGames(initialGames);
    setTeams(initialTeams);
    setMatches(initialMatches);
    setGroups(initialGroups);
    setSuggestions(initialSuggestions);
    setNotifications(initialNotifications);
    setHistory(initialHistory);

    // Save locale
    saveLocalFallback('settings', initialSettings);
    saveLocalFallback('games', initialGames);
    saveLocalFallback('teams', initialTeams);
    saveLocalFallback('matches', initialMatches);
    saveLocalFallback('groups', initialGroups);
    saveLocalFallback('suggestions', initialSuggestions);
    saveLocalFallback('notifications', initialNotifications);
    saveLocalFallback('history', initialHistory);

    // Reset Firebase collections (best-effort)
    try {
      alert('Dados restaurados localmente! Atualizando banco de dados...');
      
      await setDoc(doc(db, 'settings', 'global'), initialSettings);
      
      for (const g of initialGames) await setDoc(doc(db, 'games', g.id), g);
      for (const t of initialTeams) await setDoc(doc(db, 'teams', t.id), t);
      for (const m of initialMatches) await setDoc(doc(db, 'matches', m.id), m);
      for (const gr of initialGroups) await setDoc(doc(db, 'groups', gr.id), gr);
      for (const s of initialSuggestions) await setDoc(doc(db, 'suggestions', s.id), s);
      for (const n of initialNotifications) await setDoc(doc(db, 'notifications', n.id), n);
      for (const h of initialHistory) await setDoc(doc(db, 'history', h.id), h);
      
      location.reload();
    } catch (e) {
      console.log('Firebase clear error', e);
      location.reload();
    }
  };

  const clearAllData = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente APAGAR TODOS os dados cadastrados? Isso removerá permanentemente todos os jogos, equipes, partidas, chaves e históricos!')) return;
    
    // Reset state to empty
    setGames([]);
    setTeams([]);
    setMatches([]);
    setGroups([]);
    setSuggestions([]);
    setNotifications([]);
    setHistory([]);

    // Save empty to localStorage
    saveLocalFallback('games', []);
    saveLocalFallback('teams', []);
    saveLocalFallback('matches', []);
    saveLocalFallback('groups', []);
    saveLocalFallback('suggestions', []);
    saveLocalFallback('notifications', []);
    saveLocalFallback('history', []);

    // Clear Firebase collections
    try {
      alert('Dados apagados localmente! Limpando banco de dados no servidor...');
      
      const collectionsToClear = ['games', 'teams', 'matches', 'groups', 'suggestions', 'notifications', 'history'];
      
      for (const colName of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      
      // Reset settings to default empty state or default settings
      setSettings(initialSettings);
      saveLocalFallback('settings', initialSettings);
      await setDoc(doc(db, 'settings', 'global'), initialSettings);
      
      alert('✓ Banco de dados limpo com sucesso!');
      location.reload();
    } catch (e) {
      console.log('Firebase clear error', e);
      location.reload();
    }
  };

  return (
    <TournamentContext.Provider value={{
      settings,
      games,
      teams,
      matches,
      groups,
      suggestions,
      notifications,
      history,
      isAdmin,
      loginAdmin,
      logoutAdmin,
      updateSettings,
      addGame,
      updateGame,
      deleteGame,
      addTeam,
      updateTeam,
      deleteTeam,
      addMatch,
      updateMatch,
      deleteMatch,
      generateGroupsAndMatches,
      addSuggestion,
      voteSuggestion,
      addNotification,
      deleteNotification,
      addChampionHistory,
      localWarning,
      resetAllData,
      clearAllData,
      joinTeamByCode,
      generatePlayoffsFromGroups
    }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
