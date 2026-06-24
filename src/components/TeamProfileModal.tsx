import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { Shield, Sparkles, Trophy, Award, Mail, Calendar, User, X } from 'lucide-react';

const renderFlag = (flag: string, className = "w-6 h-6 rounded-md object-contain shrink-0 select-none") => {
  if (!flag) return <span className="text-lg leading-none">⚔️</span>;
  const isImg = flag.startsWith('data:image/') || flag.startsWith('http://') || flag.startsWith('https://') || flag.includes('/');
  if (isImg) {
    return <img src={flag} alt="logo" className={className} />;
  }
  return <span className="text-lg leading-none select-none">{flag}</span>;
};

interface TeamProfileModalProps {
  teamId: string;
  onClose: () => void;
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ teamId, onClose }) => {
  const { teams, matches, games } = useTournament();
  
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/?invite=${team.teamCode}`;
    navigator.clipboard.writeText(link);
    alert(`✓ Link de convite copiado para o WhatsApp/e-mail dos amigos!\n${link}`);
  };

  const game = games.find(g => g.id === team.gameId);
  const teamMatches = matches.filter(m => m.team1Id === teamId || m.team2Id === teamId);

  // Separate completed and upcoming matches
  const completedMatches = teamMatches.filter(m => m.score1 !== null && m.score2 !== null);
  const upcomingMatches = teamMatches.filter(m => m.score1 === null && m.score2 === null);

  return (
    <div className="fixed inset-0 bg-[#0A0B0F]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E1016] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Banner header */}
        <div className="relative h-40 bg-gradient-to-r from-indigo-800 to-indigo-950 px-6 pt-6 flex flex-col justify-between">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-slate-950/50 hover:bg-slate-950 text-slate-300 hover:text-white p-2 rounded-full transition-colors font-sans font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 bg-[#0A0B0F]/55 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 w-fit">
            <span className="text-sm font-semibold text-indigo-400">{game?.emoji}</span>
            <span className="text-xs uppercase font-bold text-white/90 tracking-widest">
              {team.gameName}
            </span>
          </div>

          <div className="flex items-end gap-4 translate-y-8 z-10">
            <div className="w-20 h-20 bg-[#0E1016] border-4 border-[#0E1016] rounded-2xl shadow-xl flex items-center justify-center overflow-hidden shrink-0 text-4xl p-1 select-none">
              {renderFlag(team.flag, "w-full h-full object-contain rounded-xl")}
            </div>
            <div className="pb-2">
              <h1 className="font-sans text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                {team.name}
                {team.status === 'approved' && <Shield className="w-5 h-5 text-indigo-400" />}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-350 mt-1">
                <span>Contato: <span className="font-mono text-indigo-400 font-medium">{team.contact || 'Não informado'}</span></span>
                {team.teamCode && (
                  <span className="text-[10px] font-black uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded select-all font-mono">
                    CÓDIGO: {team.teamCode}
                  </span>
                )}
                {team.teamCode && team.type !== 'individual' && (
                  <button 
                    onClick={handleCopyInviteLink}
                    className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    🔗 Copiar Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Space for overlapping avatar */}
        <div className="h-10 bg-[#0E1016]"></div>

        {/* Content body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
          
          {/* Column 1: Stats Panel */}
          <div className="space-y-4">
            <div className="bg-[#15171F] border border-white/5 rounded-xl p-4 shadow-inner">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest mb-3 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Estatísticas Gerais
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#0A0B0F] p-2.5 rounded-lg border border-white/5">
                  <span className="text-2xl font-bold font-mono text-indigo-400">{team.wins}</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Vitórias</p>
                </div>

                <div className="bg-[#0A0B0F] p-2.5 rounded-lg border border-white/5">
                  <span className="text-2xl font-bold font-mono text-rose-400">{team.losses}</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Derrotas</p>
                </div>
                
                <div className="bg-[#0A0B0F] p-2.5 rounded-lg border border-white/5">
                  <span className="text-2xl font-bold font-mono text-blue-400">{team.draws}</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Empates</p>
                </div>
                
                <div className="bg-[#0A0B0F] p-2.5 rounded-lg border border-white/5">
                  <span className="text-2xl font-bold font-mono text-amber-400">{team.points}</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Pontos</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-400" /> MVPs Individuais</span>
                <span className="font-bold font-mono text-amber-400 bg-[#0A0B0F] px-2 py-0.5 rounded">{team.mvps || 0}</span>
              </div>
            </div>

            {/* Roster / Members */}
            <div className="bg-[#15171F] border border-white/5 rounded-xl p-4 shadow-inner">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest mb-3 flex items-center gap-1.5 animate-pulse">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Integrantes da Equipe
              </h3>

              <div className="space-y-2">
                {team.members.map((member, idx) => {
                  const mStat = (team.stats || []).find(s => s.memberName === member);
                  const isKillsGame = ['lol', 'val', 'cs'].includes(team.gameId);
                  return (
                    <div key={idx} className="flex items-center justify-between bg-[#0A0B0F] px-2.5 py-1.5 rounded-lg border border-white/5 text-xs font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold font-sans">
                          {idx + 1}
                        </div>
                        <span className="text-slate-100 truncate">{member}</span>
                      </div>
                      {mStat && (
                        <div className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                          {isKillsGame ? (
                            <>⚔️ {mStat.kills || 0} K / {mStat.assists || 0} A</>
                          ) : (
                            <>⚽ {mStat.goals || 0} G</>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {team.members.length === 0 && (
                  <p className="text-xs text-slate-500 text-center">Nenhum integrante cadastrado</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Match History */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Completed Matches */}
            <div className="bg-[#15171F] border border-white/5 rounded-xl p-4 shadow-inner">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest mb-3">
                Histórico de Partidas
              </h3>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                {completedMatches.map(m => {
                  const isWinner = (m.team1Id === teamId && (m.score1 ?? 0) > (m.score2 ?? 0)) || 
                                   (m.team2Id === teamId && (m.score2 ?? 0) > (m.score1 ?? 0));
                  const isDraw = m.score1 === m.score2;
                  
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-[#0A0B0F]/45 border border-white/5 px-3 py-2.5 rounded-lg hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-1.5 w-1/3">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] bg-[#15171F] px-1.5 py-0.5 rounded">
                          {m.phase}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 justify-center w-2/5">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <span>{m.team1Flag}</span> <span>{m.team1Name}</span>
                        </span>
                        <div className="bg-[#0A0B0F] px-2.5 py-1 text-center font-bold font-mono rounded border border-white/5">
                          <span className={m.team1Id === teamId ? (isWinner ? 'text-indigo-400' : 'text-slate-300') : ''}>{m.score1}</span>
                          <span className="mx-1 text-slate-600">:</span>
                          <span className={m.team2Id === teamId ? (isWinner ? 'text-indigo-400' : 'text-slate-300') : ''}>{m.score2}</span>
                        </div>
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <span>{m.team2Name}</span> <span>{m.team2Flag}</span>
                        </span>
                      </div>

                      <div className="w-1/4 text-right">
                        {isDraw ? (
                          <span className="text-[10px] text-blue-400 font-bold bg-blue-400/10 border border-blue-500/20 px-2 py-0.5 rounded-full">EMPATE</span>
                        ) : isWinner ? (
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-400/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">VITÓRIA</span>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">DERROTA</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {completedMatches.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">Nenhuma partida finalizada até o momento</p>
                )}
              </div>
            </div>

            {/* Upcoming / Agenda Matches */}
            <div className="bg-[#15171F] border border-white/5 rounded-xl p-4 shadow-inner">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest mb-3">
                Partidas Agendadas
              </h3>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                {upcomingMatches.map(m => {
                  const opponent = m.team1Id === teamId ? m.team2Name : m.team1Name;
                  const opponentFlag = m.team1Id === teamId ? m.team2Flag : m.team1Flag;
                  
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-[#0A0B0F]/45 border border-white/5 px-3 py-2.5 rounded-lg hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-mono text-slate-300">{m.date.split('-').reverse().join('/')} às {m.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Contra:</span>
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{opponentFlag}</span>
                          <span>{opponent}</span>
                        </span>
                      </div>

                      <span className="text-[9px] bg-indigo-400/10 text-indigo-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border border-indigo-500/10">
                        {m.phase}
                      </span>
                    </div>
                  );
                })}

                {upcomingMatches.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">Sem confrontos agendados no momento</p>
                )}
              </div>
            </div>
            
          </div>

        </div>

        {/* Footer info lockups */}
        <div className="bg-[#0A0B0F] border-t border-white/10 flex items-center justify-between p-4 px-6 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Escola Midilana Esports HUB</span>
          <span className="font-mono text-[10px]">ID: {team.id}</span>
        </div>

      </div>
    </div>
  );
};
