import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { GameConfig, Team, Match, ChampionHistory } from '../types';
import { 
  KeyRound, Settings, CheckCircle2, ShieldAlert, Award, 
  Trash2, Plus, Calendar, Trophy, AlertTriangle, Users, Save, Clock
} from 'lucide-react';

const renderFlag = (flag: string, className = "w-6 h-6 rounded-md object-contain shrink-0 select-none") => {
  if (!flag) return <span className="text-lg leading-none">⚔️</span>;
  const isImg = flag.startsWith('data:image/') || flag.startsWith('http://') || flag.startsWith('https://') || flag.includes('/');
  if (isImg) {
    return <img src={flag} alt="logo" className={className} />;
  }
  return <span className="text-lg leading-none select-none">{flag}</span>;
};

interface AdminPanelProps {
  onSuccess: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSuccess }) => {
  const { 
    settings, updateSettings, games, addGame, updateGame, deleteGame,
    teams, updateTeam, deleteTeam, matches, addMatch, updateMatch, deleteMatch,
    suggestions, voteSuggestion, history, addChampionHistory, resetAllData, clearAllData, localWarning,
    generateGroupsAndMatches
  } = useTournament();

  const [activeTab, setActiveTab] = useState<'config' | 'teams' | 'matches' | 'calendar'>('config');

  // Input states
  const [logo, setLogo] = useState(settings.logo);
  const [school, setSchool] = useState(settings.schoolName);
  const [title, setTitle] = useState(settings.eventTitle);
  const [edition, setEdition] = useState(settings.edition);
  const [desc, setDesc] = useState(settings.description);
  const [date, setDate] = useState(settings.countdownDate.substring(0, 16));
  const [stream, setStream] = useState(settings.liveStreamUrl);
  const [deadline, setDeadline] = useState(settings.registrationDeadline ? settings.registrationDeadline.substring(0, 16) : '');

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Calendar configuration states
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkTime, setBulkTime] = useState('');
  const [calendarFilterGameId, setCalendarFilterGameId] = useState('todos');
  const [matchesFilterGameId, setMatchesFilterGameId] = useState('todos');
  const [localDateTimes, setLocalDateTimes] = useState<Record<string, { date: string, time: string }>>({});

  const isMatchPlayable = (m: Match) => {
    if (m.isLive) return true;
    if (!m.date || m.date === 'A definir' || m.date === '') return false;
    try {
      const nowStr = new Date().toISOString().split('T')[0]; // ex: '2026-06-23'
      return nowStr >= m.date;
    } catch (e) {
      return false;
    }
  };

  // Match result recorder states
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [mvpCandidate, setMvpCandidate] = useState('');
  const [topScorerCandidate, setTopScorerCandidate] = useState('');
  const [isMatchLive, setIsMatchLive] = useState(false);

  // New check-in and individual match stats states
  const [checkInT1, setCheckInT1] = useState(false);
  const [checkInT2, setCheckInT2] = useState(false);
  const [statPlayer1, setStatPlayer1] = useState('');
  const [statValue1, setStatValue1] = useState(0);
  const [statPlayer2, setStatPlayer2] = useState('');
  const [statValue2, setStatValue2] = useState(0);

  // Suggested Games Add states
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameEmoji, setNewGameEmoji] = useState('🎮');
  const [newGameFormat, setNewGameFormat] = useState<'1v1' | '2v2' | '4v4'>('4v4');
  const [newGameBracket, setNewGameBracket] = useState<'groups-and-bracket' | 'single-elimination' | 'round-robin'>('groups-and-bracket');

  // History Champion Add states
  const [isAddingHist, setIsAddingHist] = useState(false);
  const [histGameName, setHistGameName] = useState('');
  const [histEmoji, setHistEmoji] = useState('🏆');
  const [histEdition, setHistEdition] = useState('');
  const [histYear, setHistYear] = useState('2026');
  const [histChamp, setHistChamp] = useState('');
  const [histChampFlag, setHistChampFlag] = useState('🥇');
  const [histRunner, setHistRunner] = useState('');
  const [histRunnerFlag, setHistRunnerFlag] = useState('🥈');

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    await updateSettings({
      logo,
      schoolName: school,
      eventTitle: title,
      edition,
      description: desc,
      countdownDate: new Date(date).toISOString(),
      liveStreamUrl: stream,
      registrationDeadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
    });
    setIsSavingSettings(false);
    alert('✓ Configurações gerais atualizadas!');
  };

  // Convert Suggestion to Confirmed Game
  const handleConfirmSuggestionInGames = async (gameName: string, emoji: string) => {
    await addGame({
      name: gameName,
      emoji: emoji || '🎮',
      format: '2v2',
      bracketStyle: 'single-elimination',
      isConfirmed: true,
      minTeams: 4
    });
    alert(`✓ ${gameName} foi adicionado à lista de jogos oficiais do campeonato!`);
  };

  // Team controls
  const handleApproveTeam = async (id: string) => {
    await updateTeam(id, { status: 'approved' });
  };

  const handleSuspendTeam = async (id: string) => {
    await updateTeam(id, { status: 'suspended' });
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (confirm(`Excluir permanentemente o time ${name}?`)) {
      await deleteTeam(id);
    }
  };

  // Match controls
  const handleSaveMatchScore = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    
    // Build player stats payload based on game type
    const pStats = [];
    const gameType = (match?.gameId === 'lol' || match?.gameId === 'val' || match?.gameId === 'cs') ? 'kills' : 'gols';
    
    if (statPlayer1 && statValue1 > 0 && match) {
      pStats.push({ playerName: statPlayer1, teamId: match.team1Id, value: statValue1, type: gameType });
    }
    if (statPlayer2 && statValue2 > 0 && match) {
      pStats.push({ playerName: statPlayer2, teamId: match.team2Id, value: statValue2, type: gameType });
    }

    await updateMatch(matchId, {
      score1,
      score2,
      isLive: isMatchLive,
      mvp: mvpCandidate.trim() || undefined,
      topScorer: topScorerCandidate.trim() || undefined,
      winnerId: score1 > score2 ? match?.team1Id : 
                score2 > score1 ? match?.team2Id : undefined,
      checkInTeam1: checkInT1,
      checkInTeam2: checkInT2,
      playerStats: pStats.length > 0 ? pStats : undefined
    });
    setEditingMatchId(null);
    alert('✓ Placar registrado e estatísticas atualizadas!');
  };

  const handleToggleLiveMatch = async (matchId: string, status: boolean) => {
    await updateMatch(matchId, { isLive: status });
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (confirm('Excluir este confronto?')) {
      await deleteMatch(matchId);
    }
  };

  // Add customized game
  const handleAddNewGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName) return;
    await addGame({
      name: newGameName,
      emoji: newGameEmoji,
      format: newGameFormat,
      bracketStyle: newGameBracket,
      isConfirmed: true,
      minTeams: 4
    });
    setNewGameName('');
    setIsAddingGame(false);
    alert('🎮 Novo jogo adicionado!');
  };

  // Add champ history records
  const handleAddHistRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!histGameName || !histChamp) return;
    await addChampionHistory({
      gameName: histGameName,
      emoji: histEmoji,
      edition: histEdition,
      year: histYear,
      championName: histChamp,
      championFlag: histChampFlag,
      runnerUpName: histRunner,
      runnerUpFlag: histRunnerFlag
    });
    setHistGameName('');
    setHistChamp('');
    setIsAddingHist(false);
    alert('🏆 Campeão histórico registrado!');
  };

  return (
    <div className="bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-10 shadow-2xl relative">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">{settings.schoolName} Admin Hub</span>
          </div>
          <h1 className="font-sans text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            PAINEL DE MODERAÇÃO DO CAMPEONATO
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={clearAllData}
            className="text-xs uppercase tracking-wider font-extrabold text-rose-500 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Apaga permanentemente todos os registros, deixando o banco limpo para testes do zero."
          >
            🚨 Zerar Banco (Limpar Tudo)
          </button>
        </div>
      </div>

      {localWarning && (
        <div className="mb-6 p-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{localWarning}</span>
        </div>
      )}

      {/* ADMIN TABS NAVIGATION */}
      <div className="flex flex-wrap gap-1 border-b border-white/5 mb-8 pb-px">
        {[
          { tab: 'config', label: 'Configuração Geral' },
          { tab: 'teams', label: 'Gerenciar Inscrições' },
          { tab: 'matches', label: 'Lançar Resultados' },
          { tab: 'calendar', label: 'Configurar Calendário' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab as any)}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all -mb-px hover:text-white cursor-pointer ${
              activeTab === item.tab 
                ? 'border-indigo-500 text-indigo-400 font-extrabold bg-white/5' 
                : 'border-transparent text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: GENERAL APP CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Identidade do Evento Escolar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Logo / Simbolo</label>
                <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Nome da Escola</label>
                <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Nome da Cup / Evento</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Edição</label>
                <input type="text" value={edition} onChange={(e) => setEdition(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Link da Transmissão (YT/Twitch)</label>
                <input type="text" value={stream} onChange={(e) => setStream(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Data de Início do Torneio</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 font-sans" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Data Limite de Inscrição de Equipes</label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 font-sans" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Descrição Principal</label>
                <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-white text-slate-300 text-xs focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <button type="submit" disabled={isSavingSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase px-6 py-3 rounded-xl tracking-wider text-xs cursor-pointer shadow-lg shadow-indigo-600/20 transition-all">
              {isSavingSettings ? 'Salvando...' : '✓ Salvar Alterações'}
            </button>
          </form>

          {/* ADD GAME DIRECTLY */}
          <div className="bg-[#0A0B0F]/65 p-6 rounded-2xl border border-white/5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-widest">Jogos Oficiais</h3>
              <button onClick={() => setIsAddingGame(!isAddingGame)} className="text-indigo-400 hover:text-indigo-350 p-1 rounded-lg cursor-pointer">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {isAddingGame && (
              <form onSubmit={handleAddNewGame} className="space-y-3.5 bg-[#0E1016] border border-white/10 p-4 rounded-xl animate-in fade-in slide-in-from-top-1 shadow-inner">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Nome do Jogo</label>
                  <input 
                    placeholder="Ex: Rocket League" 
                    value={newGameName} 
                    onChange={(e) => setNewGameName(e.target.value)} 
                    required 
                    className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Emoji / Bandeira</label>
                    <input 
                      placeholder="Ex: 🎮" 
                      value={newGameEmoji} 
                      onChange={(e) => setNewGameEmoji(e.target.value)} 
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:outline-none focus:border-indigo-500 font-sans" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Modalidade</label>
                    <select 
                      value={newGameFormat} 
                      onChange={(e: any) => setNewGameFormat(e.target.value)} 
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                    >
                      <option value="1v1">1v1 (Solo)</option>
                      <option value="2v2">2v2 (Duplas)</option>
                      <option value="4v4">4v4 (Equipe)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Modelo de Partidas</label>
                  <select 
                    value={newGameBracket} 
                    onChange={(e: any) => setNewGameBracket(e.target.value)} 
                    className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="round-robin">Tabela de Classificação (Pontos Corridos)</option>
                    <option value="single-elimination">Chave de Eliminatórias (Mata-mata)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase py-2 rounded-lg text-[10px] tracking-wider select-none cursor-pointer shadow transition-colors font-sans">
                  Confirmar Cadastro
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {games.map(g => (
                <div key={g.id} className="flex items-center justify-between text-xs bg-[#0E1016] p-2.5 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{g.emoji} {g.name} ({g.format})</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                      {g.bracketStyle === 'round-robin' 
                        ? 'Pontos Corridos' 
                        : g.bracketStyle === 'single-elimination' 
                          ? 'Mata-mata' 
                          : 'Grupos + Eliminatórias'}
                    </span>
                  </div>
                  <button onClick={() => deleteGame(g.id)} className="text-rose-500 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MANAGE REGISTRATIONS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Inscrições e Moderação de Alunos ({teams.length})</h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 font-extrabold uppercase border border-amber-500/20 px-2 py-1 rounded">Aprovação Obrigatória</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">
                  <th className="py-3">Equipe / Aluno</th>
                  <th>Jogo / Modalidade</th>
                  <th>Modalidade</th>
                  <th>Jogadores Cadastrados</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map(t => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="py-4 font-bold text-white max-w-[150px]">
                      <div className="flex items-center gap-2">
                        {renderFlag(t.flag, "w-6 h-6 rounded-md object-contain shrink-0")}
                        <span className="truncate">{t.name}</span>
                      </div>
                    </td>
                    <td><span className="bg-[#0A0B0F] px-2 py-1 border border-white/5 rounded font-medium text-slate-200">{t.gameName}</span></td>
                    <td className="uppercase font-semibold tracking-wider text-[10px] text-slate-400">{t.type}</td>
                    <td className="text-[11px] text-slate-300 max-w-[120px] truncate">{t.members.join(', ')}</td>
                    <td className="font-mono text-[10px] text-slate-400">{t.contact || 'Nenhum'}</td>
                    <td>
                      {t.status === 'approved' ? (
                        <span className="text-indigo-400 bg-indigo-400/10 border border-indigo-500/20 px-2 py-0.5 rounded font-extrabold">APROVADO</span>
                      ) : t.status === 'suspended' ? (
                        <span className="text-rose-500 bg-rose-500/10 border border-rose-500/15 px-2 py-0.5 rounded font-extrabold">SUSPENSO</span>
                      ) : (
                        <span className="text-amber-500 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded font-extrabold">PENDENTE</span>
                      )}
                    </td>
                    <td className="text-right space-x-1">
                      {t.status !== 'approved' && (
                        <button onClick={() => handleApproveTeam(t.id)} className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors">Aprovar</button>
                      )}
                      {t.status !== 'suspended' && (
                        <button onClick={() => handleSuspendTeam(t.id)} className="text-[10px] uppercase font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded hover:bg-rose-500 hover:text-white cursor-pointer transition-colors">Suspender</button>
                      )}
                      <button onClick={() => handleDeleteTeam(t.id, t.name)} className="text-slate-500 hover:text-rose-500 p-1 cursor-pointer">
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

       {/* TAB CONTENT: RECORD MATCH SCORES */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-wider">Resultados & Placares em Tempo Real ({matches.length})</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Defina check-ins, placares e estatísticas dos confrontos.</p>
            </div>
            
            {/* Gerar Chaves / Tabelas */}
            <div className="flex flex-wrap gap-1.5">
              {games.filter(g => g.isConfirmed).map(g => (
                <button
                  key={g.id}
                  onClick={async () => {
                    const modelName = g.bracketStyle === 'round-robin' ? 'a tabela de pontos corridos' : 'a chave de mata-mata';
                    if (confirm(`Deseja gerar ${modelName} de ${g.name}? Isso limpará confrontos anteriores deste jogo e usará a lista atual de equipes aprovadas.`)) {
                      await generateGroupsAndMatches(g.id);
                    }
                  }}
                  className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all"
                >
                  ⚡ Gerar {g.bracketStyle === 'round-robin' ? 'Tabela' : 'Chave'} {g.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Alternar entre os Jogos Cadastrados */}
          <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-4">
            <button
              onClick={() => setMatchesFilterGameId('todos')}
              className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
                matchesFilterGameId === 'todos'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                  : 'bg-[#0A0B0F] hover:border-white/15 text-slate-400 border-white/5'
              }`}
            >
              🎮 Todos
            </button>
            {games.filter(g => g.isConfirmed).map(g => (
              <button
                key={g.id}
                onClick={() => setMatchesFilterGameId(g.id)}
                className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
                  matchesFilterGameId === g.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                    : 'bg-[#0A0B0F] hover:border-white/15 text-slate-400 border-white/5'
                }`}
              >
                <span>{g.emoji}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches
              .filter(m => matchesFilterGameId === 'todos' || m.gameId === matchesFilterGameId)
              .map(m => {
                const hasScore = m.score1 !== null;
                const isEditing = editingMatchId === m.id;

                return (
                  <div key={m.id} className="bg-[#0A0B0F]/65 border border-white/5 p-4 rounded-xl space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-extrabold text-white text-xs">{m.gameEmoji} {m.gameName}</span>
                      <div className="flex items-center gap-1.5">
                        {m.isLive ? (
                          <span className="text-[9px] bg-rose-500/15 border border-rose-500/25 text-rose-500 font-extrabold px-1.5 py-0.5 rounded animate-pulse">AO VIVO</span>
                        ) : (
                          <span className="text-[9px] bg-[#15171F] border border-white/5 text-slate-400 font-semibold px-1.5 py-0.5 rounded">{m.phase}</span>
                        )}
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-center">
                          <div className="w-1/3 truncate flex flex-col items-center gap-1">
                            {renderFlag(m.team1Flag, "w-8 h-8 rounded-lg object-contain shrink-0 mx-auto")}
                            <span className="text-xs font-bold text-slate-200 block truncate w-full">{m.team1Name}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded mt-1 inline-block ${m.checkInTeam1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.02] text-slate-600 border border-transparent'}`}>
                              {m.checkInTeam1 ? '✔ Presente' : '✘ Ausente'}
                            </span>
                          </div>

                          <div className="text-center font-sans flex flex-col items-center">
                            {hasScore ? (
                              <div className="bg-[#0D0E12] border border-white/10 px-3 py-1 rounded-lg text-lg font-bold font-mono text-indigo-400">
                                {m.score1} : {m.score2}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 uppercase tracking-widest font-extrabold bg-[#15171F] px-2 py-0.5 rounded border border-white/5">Aguardando</div>
                            )}
                            <span className="text-[10px] text-slate-400 mt-1">{m.time}</span>
                          </div>

                          <div className="w-1/3 truncate flex flex-col items-center gap-1">
                            {renderFlag(m.team2Flag, "w-8 h-8 rounded-lg object-contain shrink-0 mx-auto")}
                            <span className="text-xs font-bold text-slate-200 block truncate w-full">{m.team2Name}</span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded mt-1 inline-block ${m.checkInTeam2 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.02] text-slate-600 border border-transparent'}`}>
                              {m.checkInTeam2 ? '✔ Presente' : '✘ Ausente'}
                            </span>
                          </div>
                        </div>

                        {/* Display player stats registered in match */}
                        {m.playerStats && m.playerStats.length > 0 && (
                          <div className="border-t border-white/[0.03] pt-2 flex flex-wrap gap-1.5 justify-center">
                            {m.playerStats.map((ps, idx) => (
                              <span key={idx} className="bg-[#15171F] border border-white/5 text-slate-300 text-[9px] px-2 py-0.5 rounded-full">
                                🔥 {ps.playerName}: {ps.value} {ps.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-[#0E1016] border border-white/10 rounded-lg animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 truncate">{m.team1Name} Placar</label>
                            <input type="number" value={score1} onChange={(e) => setScore1(parseInt(e.target.value) || 0)} className="w-full bg-[#0A0B0F] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-sm text-indigo-400 focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 truncate">{m.team2Name} Placar</label>
                            <input type="number" value={score2} onChange={(e) => setScore2(parseInt(e.target.value) || 0)} className="w-full bg-[#0A0B0F] border border-white/10 rounded px-2.5 py-1 text-center font-bold text-sm text-indigo-400 focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>

                        {/* Check-ins */}
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-2">
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" checked={checkInT1} onChange={(e) => setCheckInT1(e.target.checked)} id="checkin-t1" />
                            <label htmlFor="checkin-t1" className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Check-in {m.team1Name}</label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" checked={checkInT2} onChange={(e) => setCheckInT2(e.target.checked)} id="checkin-t2" />
                            <label htmlFor="checkin-t2" className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Check-in {m.team2Name}</label>
                          </div>
                        </div>

                        {/* Player stats input */}
                        <div className="border-t border-white/5 pt-2 space-y-2">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#8F9FFF] block">Destaques Individuais da Partida</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase">{m.team1Name}</label>
                              <div className="flex gap-1.5">
                                <select 
                                  value={statPlayer1} 
                                  onChange={(e) => setStatPlayer1(e.target.value)} 
                                  className="bg-[#0A0B0F] border border-white/10 rounded px-1.5 py-1 text-[10px] text-white flex-1 focus:outline-none"
                                >
                                  <option value="">Jogador...</option>
                                  {(teams.find(t => t.id === m.team1Id)?.members || []).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                                <input 
                                  type="number" 
                                  placeholder="Qtd" 
                                  value={statValue1 || ''} 
                                  onChange={(e) => setStatValue1(parseInt(e.target.value) || 0)} 
                                  className="bg-[#0A0B0F] border border-white/10 rounded px-1 py-1 text-[10px] text-center text-white w-12 focus:outline-none" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase">{m.team2Name}</label>
                              <div className="flex gap-1.5">
                                <select 
                                  value={statPlayer2} 
                                  onChange={(e) => setStatPlayer2(e.target.value)} 
                                  className="bg-[#0A0B0F] border border-white/10 rounded px-1.5 py-1 text-[10px] text-white flex-1 focus:outline-none"
                                >
                                  <option value="">Jogador...</option>
                                  {(teams.find(t => t.id === m.team2Id)?.members || []).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                                <input 
                                  type="number" 
                                  placeholder="Qtd" 
                                  value={statValue2 || ''} 
                                  onChange={(e) => setStatValue2(parseInt(e.target.value) || 0)} 
                                  className="bg-[#0A0B0F] border border-white/10 rounded px-1 py-1 text-[10px] text-center text-white w-12 focus:outline-none" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 flex-wrap border-t border-white/5 pt-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">MVP da Partida (Opcional)</label>
                            <input type="text" placeholder="Nome do Aluno" value={mvpCandidate} onChange={(e) => setMvpCandidate(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div className="flex items-center gap-1.5 pt-4">
                            <input type="checkbox" checked={isMatchLive} onChange={(e) => setIsMatchLive(e.target.checked)} id={`live-check-${m.id}`} />
                            <label htmlFor={`live-check-${m.id}`} className="text-[10px] uppercase font-bold text-rose-500 cursor-pointer">Definir como Ao Vivo</label>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-white/5 pt-2">
                          <button onClick={() => setEditingMatchId(null)} className="flex-1 bg-[#0A0B0F] border border-white/10 text-slate-400 text-xs py-1.5 rounded cursor-pointer">Cancelar</button>
                          <button onClick={() => handleSaveMatchScore(m.id)} className="flex-1 bg-indigo-600 text-white font-bold text-xs py-1.5 rounded cursor-pointer">✓ Gravar</button>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        {isMatchPlayable(m) ? (
                          <button onClick={() => {
                            setEditingMatchId(m.id);
                            setScore1(m.score1 || 0);
                            setScore2(m.score2 || 0);
                            setMvpCandidate(m.mvp || '');
                            setIsMatchLive(m.isLive);
                            setCheckInT1(m.checkInTeam1 || false);
                            setCheckInT2(m.checkInTeam2 || false);
                            setStatPlayer1('');
                            setStatValue1(0);
                            setStatPlayer2('');
                            setStatValue2(0);
                          }} className="text-[10px] hover:text-indigo-400 text-indigo-400 font-extrabold flex items-center gap-1 cursor-pointer">
                            <Award className="w-3.5 h-3.5" /> Registrar Placar
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="text-[10px] text-slate-600 font-extrabold flex items-center gap-1 cursor-not-allowed opacity-40"
                            title={!m.date || m.date === 'A definir' || m.date === '' 
                              ? "Esta partida ainda não possui data definida no calendário administrativo. Agende-a primeiro." 
                              : "Esta partida está agendada para o futuro. Só é permitido lançar pontuações no próprio dia do jogo ou posteriormente."}
                          >
                            <Clock className="w-3.5 h-3.5" /> 
                            {!m.date || m.date === 'A definir' || m.date === '' 
                              ? "Bloqueado (Sem data agendada)" 
                              : "Bloqueado (Partida Futura)"}
                          </button>
                        )}

                        <div className="space-x-1">
                          <button onClick={() => handleToggleLiveMatch(m.id, !m.isLive)} className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded border border-white/5 ${m.isLive ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400'}`}>LIVE</button>
                          <button onClick={() => handleDeleteMatch(m.id)} className="text-slate-500 hover:text-rose-500 p-0.5"><Trash2 className="w-3.5 h-3.5 inline-block" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONFIGURE MATCHES ON CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-wider">Agendar Partidas no Calendário ({matches.length})</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Defina em quais dias e horários cada confronto do campeonato irá acontecer.</p>
            </div>
            
            {/* Filtros de Jogo pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCalendarFilterGameId('todos')}
                className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer border ${
                  calendarFilterGameId === 'todos'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                    : 'bg-[#0A0B0F] hover:border-white/15 text-slate-400 border-white/5'
                }`}
              >
                🎮 Todos
              </button>
              {games.filter(g => g.isConfirmed).map(g => (
                <button
                  key={g.id}
                  onClick={() => setCalendarFilterGameId(g.id)}
                  className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5 ${
                    calendarFilterGameId === g.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                      : 'bg-[#0A0B0F] hover:border-white/15 text-slate-400 border-white/5'
                  }`}
                >
                  <span>{g.emoji}</span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
          </div>



          {/* Painel de Ações em Lote (Bulk Actions) */}
          <div className={`bg-gradient-to-r from-indigo-950/20 to-slate-950/40 border rounded-2xl p-5 shadow-lg space-y-4 transition-all duration-300 ${
            selectedMatchIds.length > 0 
              ? 'border-indigo-500/40 bg-indigo-500/[0.03] scale-[1.01]' 
              : 'border-white/5 opacity-70'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#8F9FFF] flex items-center gap-1">
                  ⚡ Ações em Lote (Massa)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedMatchIds.length === 0 
                    ? 'Selecione uma ou mais partidas na lista abaixo para agendá-las em lote.' 
                    : `Você selecionou ${selectedMatchIds.length} partida(s) para configurar.`}
                </p>
              </div>
              {selectedMatchIds.length > 0 && (
                <button
                  onClick={() => setSelectedMatchIds([])}
                  className="text-[9px] uppercase font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 px-2 py-1 rounded cursor-pointer"
                >
                  Desmarcar Todas
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Definir Data em Massa</label>
                <input 
                  type="date" 
                  value={bulkDate} 
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans" 
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Definir Hora (Opcional)</label>
                <input 
                  type="time" 
                  value={bulkTime} 
                  onChange={(e) => setBulkTime(e.target.value)}
                  className="bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans" 
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (selectedMatchIds.length === 0) {
                      alert('Selecione ao menos uma partida para agendar em lote!');
                      return;
                    }
                    if (!bulkDate) {
                      alert('Selecione uma data válida para aplicar às partidas!');
                      return;
                    }
                    let count = 0;
                    for (const id of selectedMatchIds) {
                      const payload: Partial<Match> = { date: bulkDate };
                      if (bulkTime) payload.time = bulkTime;
                      await updateMatch(id, payload);
                      count++;
                    }
                    setSelectedMatchIds([]);
                    alert(`✓ ${count} partidas agendadas com sucesso para ${bulkDate.split('-').reverse().join('/')}!`);
                  }}
                  disabled={selectedMatchIds.length === 0 || !bulkDate}
                  className={`bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-950/20 disabled:text-slate-500 bg-indigo-600 text-white font-extrabold uppercase px-4 py-2.5 rounded-xl tracking-wider text-[10px] cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedMatchIds.length > 0 && bulkDate ? 'shadow-md shadow-indigo-600/15' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Aplicar Data/Hora
                </button>

                <button
                  onClick={async () => {
                    if (selectedMatchIds.length === 0) {
                      alert('Selecione ao menos uma partida para limpar agendamentos!');
                      return;
                    }
                    if (confirm(`Deseja limpar a data e hora das ${selectedMatchIds.length} partidas selecionadas?`)) {
                      let count = 0;
                      for (const id of selectedMatchIds) {
                        await updateMatch(id, { date: '', time: '' });
                        count++;
                      }
                      setSelectedMatchIds([]);
                      alert(`✓ Agendamento de ${count} partidas removido.`);
                    }
                  }}
                  disabled={selectedMatchIds.length === 0}
                  className="bg-rose-500/10 hover:bg-rose-500 disabled:bg-transparent disabled:text-slate-600 border border-rose-500/20 hover:border-transparent text-rose-400 hover:text-white font-extrabold uppercase px-4 py-2.5 rounded-xl tracking-wider text-[10px] cursor-pointer transition-all flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Agendados
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Partidas */}
          <div className="bg-[#0A0B0F]/65 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-350">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold bg-[#0E1016]">
                    <th className="py-3.5 px-4 w-10">
                      <input 
                        type="checkbox"
                        checked={
                          matches.filter(m => calendarFilterGameId === 'todos' || m.gameId === calendarFilterGameId).length > 0 &&
                          matches
                            .filter(m => calendarFilterGameId === 'todos' || m.gameId === calendarFilterGameId)
                            .every(m => selectedMatchIds.includes(m.id))
                        }
                        onChange={(e) => {
                          const pageMatches = matches.filter(m => calendarFilterGameId === 'todos' || m.gameId === calendarFilterGameId);
                          if (e.target.checked) {
                            const newSelected = Array.from(new Set([...selectedMatchIds, ...pageMatches.map(m => m.id)]));
                            setSelectedMatchIds(newSelected);
                          } else {
                            const pageMatchIds = pageMatches.map(m => m.id);
                            setSelectedMatchIds(selectedMatchIds.filter(id => !pageMatchIds.includes(id)));
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </th>
                    <th>Jogo</th>
                    <th>Confronto</th>
                    <th>Fase</th>
                    <th className="w-[180px]">Data</th>
                    <th className="w-[120px]">Hora</th>
                    <th className="text-right pr-4 w-[80px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(() => {
                    const filteredMatches = matches.filter(m => calendarFilterGameId === 'todos' || m.gameId === calendarFilterGameId);
                    
                    if (filteredMatches.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            Nenhuma partida encontrada no filtro selecionado.
                          </td>
                        </tr>
                      );
                    }

                    return filteredMatches.map(m => {
                      const isSelected = selectedMatchIds.includes(m.id);
                      
                      // Obter valores locais da edição inline se existirem
                      const curDate = localDateTimes[m.id]?.date ?? m.date ?? '';
                      const curTime = localDateTimes[m.id]?.time ?? m.time ?? '';

                      const isModified = curDate !== (m.date ?? '') || curTime !== (m.time ?? '');

                      return (
                        <tr 
                          key={m.id} 
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isSelected ? 'bg-indigo-500/[0.02] border-l-2 border-l-indigo-500' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMatchIds([...selectedMatchIds, m.id]);
                                } else {
                                  setSelectedMatchIds(selectedMatchIds.filter(id => id !== m.id));
                                }
                              }}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="font-semibold text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm shrink-0">{m.gameEmoji}</span>
                              <span className="truncate max-w-[100px]">{m.gameName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 font-bold text-slate-100">
                              {renderFlag(m.team1Flag, "w-5 h-5 rounded-md object-contain shrink-0")}
                              <span className="truncate max-w-[80px]">{m.team1Name}</span>
                              <span className="text-[10px] text-slate-500 font-medium font-sans shrink-0">vs</span>
                              {renderFlag(m.team2Flag, "w-5 h-5 rounded-md object-contain shrink-0")}
                              <span className="truncate max-w-[80px]">{m.team2Name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="bg-[#15171F] border border-white/5 text-slate-400 font-medium px-2 py-0.5 rounded text-[10px]">
                              {m.phase}
                            </span>
                          </td>
                          <td>
                            <input 
                              type="date"
                              value={curDate}
                              onChange={(e) => {
                                setLocalDateTimes({
                                  ...localDateTimes,
                                  [m.id]: {
                                    date: e.target.value,
                                    time: curTime
                                  }
                                });
                              }}
                              className="bg-[#0A0B0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans w-full"
                              style={{ colorScheme: 'dark' }}
                            />
                          </td>
                          <td>
                            <input 
                              type="time"
                              value={curTime}
                              onChange={(e) => {
                                setLocalDateTimes({
                                  ...localDateTimes,
                                  [m.id]: {
                                    date: curDate,
                                    time: e.target.value
                                  }
                                });
                              }}
                              className="bg-[#0A0B0F] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans w-full"
                              style={{ colorScheme: 'dark' }}
                            />
                          </td>
                          <td className="text-right pr-4">
                            <button
                              onClick={async () => {
                                await updateMatch(m.id, {
                                  date: curDate,
                                  time: curTime
                                });
                                // Limpar estado local
                                const nextLocalDateTimes = { ...localDateTimes };
                                delete nextLocalDateTimes[m.id];
                                setLocalDateTimes(nextLocalDateTimes);
                                alert('✓ Confronto agendado com sucesso!');
                              }}
                              disabled={!isModified}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isModified 
                                  ? 'bg-indigo-650 hover:bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/25' 
                                  : 'bg-transparent border-white/5 text-slate-600 cursor-not-allowed'
                              }`}
                              title="Salvar Agendamento"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
