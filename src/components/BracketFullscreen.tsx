import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Maximize2, Minimize2, Tv, Trophy, Shield, HelpCircle, Activity } from 'lucide-react';

interface BracketFullscreenProps {
  onClose: () => void;
}

export const BracketFullscreen: React.FC<BracketFullscreenProps> = ({ onClose }) => {
  const { games, teams, matches, groups, settings } = useTournament();
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id || '');
 
  const activeGame = games.find(g => g.id === selectedGameId);
  const gameGroups = groups.filter(g => g.gameId === selectedGameId);
  const gameMatches = matches.filter(m => m.gameId === selectedGameId);
 
  // Group standings calculation helper
  const calculateStandings = (teamIds: string[], matches: typeof gameMatches) => {
    return teamIds.map(id => {
      const team = teams.find(t => t.id === id);
      if (!team) return null;
 
      // Filter matches containing this team
      const teamMatches = matches.filter(m => m.score1 !== null && m.score2 !== null && (m.team1Id === id || m.team2Id === id));
      
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
    .filter(Boolean)
    .sort((a, b) => b!.points - a!.points || b!.wins - a!.wins);
  };
 
  // Compute top players leaderboard for projection
  const getLeaderboard = () => {
    const isKillsGame = ['lol', 'val', 'cs'].includes(selectedGameId);
    const gameTeams = teams.filter(t => t.gameId === selectedGameId && t.status === 'approved');
    
    const playersList: { name: string; teamFlag: string; teamName: string; value: number }[] = [];
    
    gameTeams.forEach(t => {
      if (t.stats) {
        t.stats.forEach(s => {
          const val = isKillsGame ? (s.kills || 0) : (s.goals || 0);
          if (val > 0) {
            playersList.push({
              name: s.memberName,
              teamFlag: t.flag,
              teamName: t.name,
              value: val
            });
          }
        });
      }
    });
    
    return playersList.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-[#0A0B0F] z-50 overflow-y-auto p-6 md:p-12 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* FULLSCREEN HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-sans text-xl font-extrabold shadow-lg shadow-indigo-600/25 overflow-hidden shrink-0">
            {settings.logo && (settings.logo.startsWith('/') || settings.logo.includes('.') || settings.logo.startsWith('data:') || settings.logo.startsWith('http')) ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
            ) : (
              settings.logo
            )}
          </div>
          <div>
            <h1 className="font-display font-black text-xl lg:text-3xl text-white uppercase tracking-widest flex items-center gap-2">
              {settings.schoolName} <span className="text-indigo-450 text-indigo-400 font-display font-semibold tracking-wider">{settings.eventTitle}</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500">
              📺 Painel de Projeção Escolar (Placares & Estatísticas Ao Vivo)
            </p>
          </div>
        </div>
 
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <select 
            value={selectedGameId} 
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="bg-[#0E1016] border border-white/10 font-sans text-xs uppercase tracking-wider font-extrabold text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {games.filter(g => g.isConfirmed).map(g => (
              <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
            ))}
          </select>
 
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0E1016] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" /> Sair da Projeção
          </button>
        </div>
      </div>
 
      {/* LIVE BOX IF LIVE MATCHES EXIST */}
      {gameMatches.some(m => m.isLive) && (
        <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between mb-8 animate-pulse text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
            <span className="font-extrabold tracking-widest text-indigo-400 uppercase">Partida Ao Vivo No Projetor:</span>
          </div>
          
          <div className="flex items-center gap-3 justify-center">
            {gameMatches.filter(m => m.isLive).map(m => (
              <span key={m.id} className="font-bold text-white text-sm">
                {m.team1Flag} {m.team1Name} <span className="text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono text-sm">{m.score1} : {m.score2}</span> {m.team2Flag} {m.team2Name}
              </span>
            ))}
          </div>
        </div>
      )}
 
      {/* MID PANEL: STANDINGS & BRACKETS IN FULLSCREEN */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto items-start">
        
        {/* STANDINGS & LEADERBOARD COLUMN */}
        <div className="space-y-6">
          <h2 className="font-display font-bold text-base text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-400" /> Classificação & Recordes
          </h2>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGame?.bracketStyle === 'round-robin' && (() => {
              const approvedTeamsOfGame = teams.filter(t => t.gameId === selectedGameId && t.status === 'approved');
              const standings = calculateStandings(approvedTeamsOfGame.map(t => t.id), gameMatches);
              return (
                <div className="col-span-2 bg-[#0E1016] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-sans font-bold text-white tracking-widest text-xs uppercase">Tabela de Classificação</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-mono">Pontos Corridos</span>
                  </div>

                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                        <th className="py-2.5">Pos</th>
                        <th>Equipe</th>
                        <th className="text-center">PTS</th>
                        <th className="text-center">V</th>
                        <th className="text-right">D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, idx) => {
                        if (!team) return null;
                        return (
                          <tr key={team.id} className="border-b border-white/5 last:border-none hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold font-mono text-slate-500">#{idx + 1}</td>
                            <td>
                              <div className="flex items-center gap-2 text-slate-200">
                                <span className="text-lg">{team.flag}</span>
                                <span className="font-semibold truncate max-w-[150px]">{team.name}</span>
                              </div>
                            </td>
                            <td className="text-center font-bold text-white font-mono">{team.points}</td>
                            <td className="text-center font-semibold text-indigo-400 font-mono">{team.wins}</td>
                            <td className="text-right font-semibold text-rose-500 font-mono">{team.losses}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {activeGame?.bracketStyle === 'single-elimination' && (
              <div className="col-span-2 py-8 text-center text-xs text-slate-500 bg-[#0E1016]/40 rounded-2xl border border-white/5">
                ⚔️ Fase Eliminatória Direta. Acompanhe a agenda de duelos na coluna ao lado.
              </div>
            )}
          </div>

          {/* LEADERBOARD DE DESTAQUES */}
          {getLeaderboard().length > 0 && (
            <div className="bg-[#0E1016] border border-white/5 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-sans font-bold text-[#8F9FFF] tracking-widest text-xs uppercase flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard de Destaques (Top 5)
                </span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-mono">
                  {['lol', 'val', 'cs'].includes(selectedGameId) ? 'Kills' : 'Gols'}
                </span>
              </div>
              
              <div className="space-y-2">
                {getLeaderboard().map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-[#0A0B0F]/50 px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono font-bold text-slate-500">#{idx + 1}</span>
                      <span className="font-bold text-slate-200 truncate">{player.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({player.teamFlag} {player.teamName})</span>
                    </div>
                    <span className="font-mono font-black text-indigo-400 text-sm">{player.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* BRACKET SCHEDULE COLUMN */}
        <div className="space-y-6">
          <h2 className="font-display font-bold text-base text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Confrontos & Resultados Recentes
          </h2>
 
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 bg-[#0E1016]/40 p-2 rounded-2xl border border-white/5">
            {gameMatches.map(m => {
              const finished = m.score1 !== null && m.score2 !== null;
              const scoreHTML = finished
                ? <div className="text-lg font-bold font-mono px-3 py-1 bg-[#0D0E12] border border-white/5 rounded-lg text-indigo-400">{m.score1}:{m.score2}</div>
                : m.isLive 
                  ? <div className="text-[8px] font-black uppercase bg-rose-500/15 border border-rose-500/35 text-rose-500 px-2 py-1 rounded animate-pulse tracking-wider">AO VIVO</div>
                  : <div className="text-xs font-bold font-mono px-2.5 py-1 bg-[#15171F] text-slate-400 rounded-lg border border-white/5">VS</div>;
              
              return (
                <div key={m.id} className="bg-[#0E1016] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow-lg hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
                    <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-[#15171F] text-slate-400 border border-white/5">
                      {m.phase}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">⏰ {m.time}</span>
                  </div>

                  <div className="flex items-center justify-between text-center">
                    {/* Time 1 */}
                    <div className="w-1/3 truncate space-y-1.5">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-slate-200 font-sans text-sm">
                        <span>{m.team1Flag}</span>
                        <span className="truncate">{m.team1Name}</span>
                      </div>
                      {!finished && (
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded inline-block ${m.checkInTeam1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.01] text-slate-600'}`}>
                          {m.checkInTeam1 ? '✔ Presente' : '✘ Ausente'}
                        </span>
                      )}
                    </div>

                    {/* Placar / VS */}
                    <div className="px-2 shrink-0">
                      {scoreHTML}
                    </div>

                    {/* Time 2 */}
                    <div className="w-1/3 truncate space-y-1.5">
                      <div className="flex items-center gap-1.5 justify-center font-bold text-slate-200 font-sans text-sm">
                        <span className="truncate">{m.team2Name}</span>
                        <span>{m.team2Flag}</span>
                      </div>
                      {!finished && (
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded inline-block ${m.checkInTeam2 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.01] text-slate-600'}`}>
                          {m.checkInTeam2 ? '✔ Presente' : '✘ Ausente'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player Stats desta partida */}
                  {m.playerStats && m.playerStats.length > 0 && (
                    <div className="border-t border-white/[0.03] pt-2.5 flex flex-wrap gap-1.5 justify-center">
                      {m.playerStats.map((ps, idx) => (
                        <span key={idx} className="bg-[#0A0B0F] border border-white/5 text-slate-400 text-[8px] px-2 py-0.5 rounded-full font-sans uppercase font-bold tracking-wide">
                          🔥 {ps.playerName}: {ps.value} {ps.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
 
            {gameMatches.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500 bg-[#0E1016] rounded-xl border border-white/5">
                Sem confrontos agendados para este jogo
              </div>
            )}
          </div>
        </div>
 
      </div>
 
      {/* FULLSCREEN FOOTER */}
      <div className="border-t border-white/10 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 font-sans">
        <span>Transmissão Oficial: {settings.liveStreamUrl}</span>
        <span>Organização: Escola Midilana Esports HUB © 2026</span>
      </div>
 
    </div>
  );
};
