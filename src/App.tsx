import React, { useState, useEffect, useRef } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { TeamProfileModal } from './components/TeamProfileModal';
import { BracketFullscreen } from './components/BracketFullscreen';
import { AdminPanel } from './components/AdminPanel';
import { 
  Trophy, Calendar as CalIcon, Users, PlusCircle, Settings, 
  Tv, Volume2, Shield, Search, Sparkles, LogIn, Lock, 
  Share2, ArrowRight, CheckCircle2, ChevronRight, Crown, 
  Printer, QrCode, AlertCircle, Trash, Swords, Vote, MessageSquare,
  Award, Maximize2, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const renderFlag = (flag: string, className = "w-6 h-6 rounded-md object-contain shrink-0 select-none") => {
  if (!flag) return <span className="text-lg leading-none">⚔️</span>;
  const isImg = flag.startsWith('data:image/') || flag.startsWith('http://') || flag.startsWith('https://') || flag.includes('/');
  if (isImg) {
    return <img src={flag} alt="logo" className={className} />;
  }
  return <span className="text-lg leading-none select-none">{flag}</span>;
};

function AppContent() {
  const { 
    settings, games, teams, matches, groups, 
    notifications, isAdmin, loginAdmin, logoutAdmin,
    addTeam, addNotification,
    joinTeamByCode, updateMatch, generateGroupsAndMatches,
    alertUser, confirmUser
  } = useTournament();
  const isRegistrationClosed = true; // Inscrições encerradas de forma definitiva
  
  // Navigation pages
  const [currentPage, setCurrentPage] = useState<'inicio' | 'chaveamento' | 'calendario' | 'cadastro' | 'admin'>('inicio');
  
  // Game filters
  const [gameFilter, setGameFilter] = useState('todos');
  const [chaveGameFilter, setChaveGameFilter] = useState('todos');
  const [bracketScales, setBracketScales] = useState<Record<string, number>>({});
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Modals & Overlays
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showFullscreenBracket, setShowFullscreenBracket] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showChampionSlide, setShowChampionSlide] = useState(false);
  const [championDetails, setChampionDetails] = useState<{name: string, flag: string, game: string} | null>(null);

  // Join Team by code states
  const [joinStudentName, setJoinStudentName] = useState('');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [joinTab, setJoinTab] = useState<'create' | 'join'>('create');

  // Custom Game theme resolver
  const getGameThemeColor = (gameId: string) => {
    switch(gameId) {
      case 'lol': return { text: 'text-indigo-400', border: 'border-indigo-500/20 hover:border-indigo-500/40', shadow: 'shadow-indigo-500/10', glow: 'from-indigo-950/20 to-transparent', ring: 'ring-indigo-500/20', bg: 'bg-indigo-600' };
      case 'val': return { text: 'text-rose-500', border: 'border-rose-500/20 hover:border-rose-500/40', shadow: 'shadow-rose-500/10', glow: 'from-rose-950/20 to-transparent', ring: 'ring-rose-500/20', bg: 'bg-rose-600' };
      case 'cs': return { text: 'text-amber-500', border: 'border-amber-500/20 hover:border-amber-500/40', shadow: 'shadow-amber-500/10', glow: 'from-amber-950/20 to-transparent', ring: 'ring-amber-500/20', bg: 'bg-amber-600' };
      case 'ea': return { text: 'text-emerald-500', border: 'border-emerald-500/20 hover:border-emerald-500/40', shadow: 'shadow-emerald-500/10', glow: 'from-emerald-950/20 to-transparent', ring: 'ring-emerald-500/20', bg: 'bg-emerald-600' };
      default: return { text: 'text-indigo-400', border: 'border-white/10 hover:border-indigo-500/20', shadow: 'shadow-indigo-500/5', glow: 'from-slate-950/10 to-transparent', ring: 'ring-white/10', bg: 'bg-indigo-600' };
    }
  };

  // Custom Notifications toaster queue
  const [toasterQueue, setToasterQueue] = useState<{id: string, msg: string}[]>([]);

  // Local Voting IP Mock
  const [voterId] = useState(() => {
    let id = localStorage.getItem('esports_voter_id');
    if (!id) {
      id = 'voter_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('esports_voter_id', id);
    }
    return id;
  });

  // Countdown clock ticking
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(settings.countdownDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        mins: String(m).padStart(2, '0'),
        secs: String(s).padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.countdownDate]);

  // Listener to final matches to trigger champion celebrare slide
  useEffect(() => {
    const finalMatch = matches.find(m => m.phase === 'Final' && m.score1 !== null && m.score2 !== null);
    if (finalMatch) {
      const s1 = finalMatch.score1!;
      const s2 = finalMatch.score2!;
      const winnerName = s1 > s2 ? finalMatch.team1Name : finalMatch.team2Name;
      const winnerFlag = s1 > s2 ? finalMatch.team1Flag : finalMatch.team2Flag;
      
      setChampionDetails({
        name: winnerName,
        flag: winnerFlag,
        game: finalMatch.gameName
      });
      setShowChampionSlide(true);
    }
  }, [matches]);

  // Aderir à equipe via link de convite
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const inviteCode = queryParams.get('invite');
    if (inviteCode) {
      setCurrentPage('cadastro');
      setJoinTab('join');
      setJoinTeamCode(inviteCode.toUpperCase());
      
      // Limpa o parâmetro da URL para não reprocessar ao recarregar a página
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Toast dynamic triggers based on notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const timerKey = `esports_notif_seen_${latest.id}`;
      if (!localStorage.getItem(timerKey)) {
        localStorage.setItem(timerKey, 'seen');
        const newItem = { id: latest.id, msg: latest.message };
        setToasterQueue(prev => [...prev, newItem]);
        setTimeout(() => {
          setToasterQueue(prev => prev.filter(x => x.id !== latest.id));
        }, 5000);
      }
    }
  }, [notifications]);

  // Automatic match start notification trigger (30 minutes before scheduled time)
  useEffect(() => {
    const checkUpcomingMatches = () => {
      const now = new Date();
      matches.forEach(m => {
        // Skip matches that are already played or in progress (have recorded scores)
        if (m.score1 !== null || m.score2 !== null) return;
        if (!m.date || !m.time) return;

        try {
          // Robust parse of date (YYYY-MM-DD) and time (HH:MM) to local timezone
          const [year, month, day] = m.date.split('-').map(Number);
          const [hour, min] = m.time.split(':').map(Number);
          const matchTime = new Date(year, month - 1, day, hour, min);

          const timeDiffMins = (matchTime.getTime() - now.getTime()) / (1000 * 60);

          // If the match is scheduled to start in 30 minutes or less, and has not started yet
          if (timeDiffMins > 0 && timeDiffMins <= 30) {
            const notifMsg = `⏰ O jogo de ${m.gameName} entre ${m.team1Name} e ${m.team2Name} está prestes a começar em instantes às ${m.time}! Preparem-se!`;
            const localKey = `esports_match_warned_soon_${m.id}`;
            
            // Check if already notified locally OR if there is an existing database notification for this match
            const alreadyInDb = notifications.some(n => 
              n.type === 'match_soon' && 
              n.message.includes(m.team1Name) && 
              n.message.includes(m.team2Name)
            );
            const alreadyWarnedLocal = localStorage.getItem(localKey);

            if (!alreadyWarnedLocal && !alreadyInDb) {
              localStorage.setItem(localKey, 'true');
              addNotification(notifMsg, 'match_soon', m.gameId);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar partidas do chaveamento:', error);
        }
      });
    };

    // Run immediately when mounted or when state shifts (matches / notifications / addNotification changes)
    checkUpcomingMatches();

    const intervalId = setInterval(checkUpcomingMatches, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [matches, notifications, addNotification]);

  // Automação: Gerar confrontos automaticamente quando o tempo limite de inscrição expira
  useEffect(() => {
    if (!settings.registrationDeadline) return;
    const isDeadlinePassed = new Date() > new Date(settings.registrationDeadline);
    if (!isDeadlinePassed) return;

    // Achar jogos que estão confirmados e possuem pelo menos 2 equipes aprovadas, mas não possuem partidas geradas
    const gamesToGenerate = games.filter(g => {
      if (!g.isConfirmed) return false;
      const approvedTeamsCount = teams.filter(t => t.gameId === g.id && t.status === 'approved').length;
      if (approvedTeamsCount < 2) return false;
      const matchCount = matches.filter(m => m.gameId === g.id).length;
      return matchCount === 0;
    });

    if (gamesToGenerate.length > 0) {
      gamesToGenerate.forEach(async (g) => {
        const runKey = `esports_auto_gen_run_${g.id}`;
        if (!localStorage.getItem(runKey)) {
          localStorage.setItem(runKey, 'true');
          try {
            await generateGroupsAndMatches(g.id);
            console.log(`✓ Confrontos de ${g.name} gerados automaticamente pelo encerramento de inscrições.`);
          } catch (e) {
            console.error(`Falha ao gerar chaves automaticamente para ${g.name}`, e);
          }
        }
      });
    }
  }, [settings, games, teams, matches, generateGroupsAndMatches]);

  // Custom administrative password validation
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(adminPasswordInput);
    if (success) {
      setShowAdminLogin(false);
      setCurrentPage('admin');
      setAdminPasswordInput('');
    } else {
      alertUser('🔒 Senha Incorreta! Tente "admin123" ou "admin"', 'error');
    }
  };

  // Calendar States
  const [currentCalMonth, setCurrentCalMonth] = useState(5); // June
  const [currentCalYear, setCurrentCalYear] = useState(2026);
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>('2026-06-18');
  const CAL_MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Forms Registration states
  const [regGame, setRegGame] = useState('');
  const [regType, setRegType] = useState<'individual' | 'dupla' | 'time'>('time');
  const [regTeamName, setRegTeamName] = useState('');
  const [regFlag, setRegFlag] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [regContact, setRegContact] = useState('');
  const [regMembers, setRegMembers] = useState<string[]>(['', '', '', '']);

  const processUploadedImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Não foi possível criar contexto do canvas"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          let minX = canvas.width, maxX = 0;
          let minY = canvas.height, maxY = 0;
          let hasContent = false;

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const index = (y * canvas.width + x) * 4;
              const alpha = data[index + 3];
              
              if (alpha > 10) {
                hasContent = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (!hasContent) {
            minX = 0;
            maxX = canvas.width - 1;
            minY = 0;
            maxY = canvas.height - 1;
          }

          const cropWidth = (maxX - minX) + 1;
          const cropHeight = (maxY - minY) + 1;

          const targetSize = 128;
          const outputCanvas = document.createElement("canvas");
          outputCanvas.width = targetSize;
          outputCanvas.height = targetSize;
          const outCtx = outputCanvas.getContext("2d");
          
          if (!outCtx) {
            reject(new Error("Não foi possível criar contexto de saída do canvas"));
            return;
          }

          outCtx.clearRect(0, 0, targetSize, targetSize);

          const scale = Math.min(targetSize / cropWidth, targetSize / cropHeight);
          const drawWidth = cropWidth * scale;
          const drawHeight = cropHeight * scale;
          const drawX = (targetSize - drawWidth) / 2;
          const drawY = (targetSize - drawHeight) / 2;

          outCtx.drawImage(
            img,
            minX, minY, cropWidth, cropHeight,
            drawX, drawY, drawWidth, drawHeight
          );

          const base64 = outputCanvas.toDataURL("image/png");
          resolve(base64);
        };
        img.onerror = () => reject(new Error("Falha ao carregar imagem"));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleRegisterTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regGame || !regTeamName || !regContact) {
      alertUser('Por favor preencha todos os campos obrigatórios!', 'error');
      return;
    }

    if (!regFlag) {
      alertUser('Por favor envie a imagem do logo ou escudo da sua equipe!', 'error');
      return;
    }

    const filteredMembers = regMembers.filter(m => m.trim() !== '');
    if (regType !== 'individual' && filteredMembers.length === 0) {
      alertUser('Adicione pelo menos um integrante para a equipe!', 'error');
      return;
    }

    const activeGame = games.find(g => g.id === regGame);

    const generatedCode = await addTeam({
      name: regTeamName,
      flag: regFlag,
      gameId: regGame,
      gameName: activeGame?.name || 'Vários',
      type: regType,
      members: regType === 'individual' ? [regTeamName] : filteredMembers,
      contact: regContact,
      status: 'pending' // needs admin approval
    });

    addNotification(`Inscrição recebida: Time ${regTeamName} para o jogo ${activeGame?.name}!`, 'announcement');
    
    let inviteMessage = '';
    if (regType === 'dupla' || regType === 'time') {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${generatedCode}`;
      inviteMessage = `\n\nLink de convite para os amigos entrarem:\n${inviteUrl}`;
    }
    
    alertUser(`✓ Inscrição de ${regTeamName} cadastrada e enviada para aprovação! Código da equipe: ${generatedCode}${inviteMessage}`, 'success-modal');
    
    // Clear forms
    setRegGame('');
    setRegTeamName('');
    setRegFlag('');
    setSelectedFileName('');
    setRegContact('');
    setRegMembers(['', '', '', '']);
    setCurrentPage('inicio');
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinStudentName || !joinTeamCode) {
      alertUser('Por favor preencha todos os campos!', 'error');
      return;
    }
    
    const success = await joinTeamByCode(joinStudentName, joinTeamCode);
    if (success) {
      alertUser(`✓ ${joinStudentName} foi adicionado à equipe com sucesso!`, 'success');
      setJoinStudentName('');
      setJoinTeamCode('');
      setCurrentPage('inicio');
    } else {
      alertUser('✘ Código de equipe inválido ou não encontrado. Tente novamente!', 'error');
    }
  };



  // Standing/Pool points calculator helper
  const calculateStandings = (teamIds: string[], gameMatches: typeof matches) => {
    return teamIds.map(id => {
      const team = teams.find(t => t.id === id);
      if (!team) return null;

      // Filter matches containing this team
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
    .filter(Boolean)
    .sort((a, b) => b!.points - a!.points || b!.wins - a!.wins);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-slate-100 font-sans flex flex-col justify-between selection:bg-indigo-505 selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER NAVBAR */}
      <nav className="bg-[#0E1016]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-4 py-3 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('inicio')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-display font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0">
            {settings.logo && (settings.logo.startsWith('/') || settings.logo.includes('.') || settings.logo.startsWith('data:') || settings.logo.startsWith('http')) ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              settings.logo
            )}
          </div>
          <div>
            <div className="font-display font-black text-lg lg:text-xl text-white tracking-widest uppercase">
              {settings.schoolName}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#8F9FFF] font-bold">
              {settings.eventTitle}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {[
            { page: 'inicio', label: 'Início', icon: Tv },
            { page: 'chaveamento', label: 'Chaveamento', icon: Swords },
            { page: 'calendario', label: 'Calendário', icon: CalIcon },
            { page: 'cadastro', label: 'Cadastrar', icon: PlusCircle },
          ].filter(item => item.page !== 'cadastro' || !isRegistrationClosed)
           .map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  currentPage === item.page 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Admin and Projection Controls Buttons */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 py-1.5 px-3 rounded-xl uppercase tracking-wider select-none">
                ⚙️ Admin Ativo
              </span>
              <button 
                onClick={() => setCurrentPage('admin')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold font-sans transition-all cursor-pointer"
              >
                Painel
              </button>
              <button 
                onClick={logoutAdmin}
                className="text-xs text-rose-500 hover:text-rose-400 font-bold px-2 py-1"
              >
                Sair
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.02] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Moderador
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Nav Sticky Assistant Bottom Bar */}
      <div className="lg:hidden bg-[#0A0B0F]/95 backdrop-blur-md border-t border-white/10 fixed bottom-0 left-0 right-0 z-40 px-3 py-2 flex justify-around">
        {[
          { page: 'inicio', label: 'Home', icon: Tv },
          { page: 'chaveamento', label: 'Chaves', icon: Swords },
          { page: 'cadastro', label: 'Inscrição', icon: PlusCircle },
        ].filter(item => item.page !== 'cadastro' || !isRegistrationClosed)
         .map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors ${
                currentPage === item.page ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* CORE PAGES ROUTER DISPLAY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 pb-20 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
        
        {/* PAGE 1: INÍCIO (HOMEPAGE WITH LIVE stream & countdown) */}
        {currentPage === 'inicio' && (
          <div className="space-y-8">
            
            {/* HERO CAROUSEL / STATS SECTION */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0E1016] border border-white/10 p-6 lg:p-12">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0F] via-[#0E1016]/60 to-indigo-950/10 z-0"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl z-0"></div>
              
              {/* Background Logo da E-Sports Cup */}
              <div className="absolute left-0 bottom-0 top-0 w-full lg:w-2/3 opacity-[0.08] pointer-events-none z-0 flex items-center justify-center lg:justify-start overflow-hidden select-none pl-4 lg:pl-16">
                <img src="/logo-hero.png" alt="Logo de Fundo" className="w-full max-w-[420px] object-contain transform -rotate-6 scale-105" />
              </div>
              
              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#8F9FFF]">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {settings.edition}
                </div>
                
                <h1 className="font-display font-black text-4xl lg:text-6xl text-white tracking-widest uppercase leading-none">
                  {settings.schoolName} <br />
                  <span className="text-indigo-400">{settings.eventTitle}</span>
                </h1>

                <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-xl">
                  {settings.description}
                </p>

                <div className="flex flex-wrap gap-6 text-slate-300 font-display">
                  <div className="space-y-0.5">
                    <span className="text-2xl lg:text-3xl font-extrabold text-white block font-mono">{teams.filter(t => t.status === 'approved').length}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Times Confirmados</span>
                  </div>
                  <div className="w-px h-10 bg-white/5 hidden md:block"></div>
                  <div className="space-y-0.5">
                    <span className="text-2xl lg:text-3xl font-extrabold text-white block font-mono">{games.filter(g => g.isConfirmed).length}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Jogos Oficiais</span>
                  </div>
                  <div className="w-px h-10 bg-white/5 hidden md:block"></div>
                  <div className="space-y-0.5">
                    <span className="text-2xl lg:text-3xl font-extrabold text-white block font-mono">{matches.length}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Partidas Totais</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setCurrentPage('chaveamento')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                  >
                    Acessar Chaveamento
                  </button>
                  {!isRegistrationClosed ? (
                    <button 
                      onClick={() => setCurrentPage('cadastro')}
                      className="bg-[#15171F] hover:bg-[#1C1E26] border border-white/10 text-white font-extrabold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                    >
                      Inscrever Equipe
                    </button>
                  ) : (
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-rose-400 font-extrabold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl flex items-center gap-1.5 select-none font-sans">
                      🚫 Inscrições Encerradas
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE MATCH EMBED BLOCK */}
            {settings.liveStreamUrl && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                    <span className="text-xs uppercase tracking-widest font-black text-rose-500">🔴 TRANSMISSÃO OFICIAL AO VIVO</span>
                  </div>
                  <a href={settings.liveStreamUrl} target="_blank" rel="noreferrer" className="text-xs text-[#8F9FFF] hover:underline">Ver no Twitch/YouTube →</a>
                </div>

                <div className="bg-[#0E1016] border border-white/10 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0E1016] via-[#0A0B0F] to-[#0A0B0F]">
                  <Tv className="w-16 h-16 text-indigo-500/25 animate-pulse mb-3" />
                  <h3 className="font-sans font-bold text-lg text-slate-200">ASSISTA AO CAMPEONATO DA ESCOLA</h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">Conexão iniciada com {settings.liveStreamUrl}. Durante as finais, projete ao vivo para toda a quadra escolar!</p>
                  <a 
                    href={settings.liveStreamUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    <Volume2 className="w-4 h-4" /> Abrir Link de Stream
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 2: CHAVEAMENTO (BRACKETS, GROUPS & HIGH QUALITY STANDINGS) */}
        {currentPage === 'chaveamento' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-indigo-400" />
                <h1 className="font-display font-black text-xl lg:text-3xl text-white tracking-widest uppercase">
                  Tabelas, Grupos & Chaves
                </h1>
              </div>

              {/* Action utilities */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">

                <button 
                  onClick={() => window.print()}
                  className="bg-[#0E1016] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white font-bold text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors font-sans"
                >
                  <Printer className="w-4 h-4" /> Imprimir Chaves
                </button>

                <button 
                  onClick={() => setShowFullscreenBracket(true)}
                  className="bg-[#0E1016] hover:bg-white/5 border border-white/10 text-indigo-400 hover:text-indigo-300 font-bold text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors font-sans"
                >
                  <Maximize2 className="w-4 h-4" /> Projetor
                </button>
              </div>
            </div>

            {/* HIGH END GAME PILL BUTTONS FOR HIGH EXQUISITE UX MINIMALISM */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
              <button
                onClick={() => setChaveGameFilter('todos')}
                className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap border font-sans ${
                  chaveGameFilter === 'todos'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                    : 'bg-[#0E1016] hover:border-white/15 text-slate-400 hover:text-white border-white/5'
                }`}
              >
                🎮 Todos os Jogos
              </button>
              {games.filter(g => g.isConfirmed).map(g => (
                <button
                  key={g.id}
                  onClick={() => setChaveGameFilter(g.id)}
                  className={`px-4.5 py-2.5 text-xs uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap border flex items-center gap-2 font-sans ${
                    chaveGameFilter === g.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-[#0E1016] hover:border-white/15 text-slate-400 hover:text-white border-white/5'
                  }`}
                >
                  <span className="text-sm">{g.emoji}</span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>

            {/* Display list of pools / standings per game */}
            <div className="space-y-12">
              {games
                .filter(g => g.isConfirmed && (chaveGameFilter === 'todos' || g.id === chaveGameFilter))
                .map(game => {
                  const gameGroups = groups.filter(gr => gr.gameId === game.id);
                  const gameMatches = matches.filter(m => m.gameId === game.id);

                  return (
                    <div key={game.id} className="bg-[#0E1016]/80 border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6">
                      
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{game.emoji}</span>
                          <div>
                            <h3 className="font-display font-extrabold text-lg text-white uppercase tracking-widest">{game.name}</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5">
                              Formato: {game.format} · Chave: {
                                game.bracketStyle === 'single-elimination' 
                                  ? 'Chave de Eliminatórias (Mata-mata)' 
                                  : 'Tabela de Classificação (Pontos Corridos)'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tabela de Classificação de Pontos Corridos */}
                      {game.bracketStyle === 'round-robin' && (() => {
                        const approvedTeamsOfGame = teams.filter(t => t.gameId === game.id && t.status === 'approved');
                        const standings = calculateStandings(approvedTeamsOfGame.map(t => t.id), gameMatches);

                        return (
                          <div className="bg-[#0A0B0F] border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
                            <h4 className="font-sans font-extrabold text-sm text-[#8F9FFF] uppercase tracking-wider">Tabela de Classificação</h4>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
                                    <th className="py-2.5">Pos</th>
                                    <th>Equipe</th>
                                    <th className="text-center">PTS</th>
                                    <th className="text-center">V</th>
                                    <th className="text-center">E</th>
                                    <th className="text-right">D</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {standings.map((team, idx) => {
                                    if (!team) return null;
                                    return (
                                      <tr key={team.id} className="hover:bg-white/[0.01]">
                                        <td className="py-3 font-extrabold font-mono text-slate-500">#{idx + 1}</td>
                                        <td className="font-semibold text-slate-200">
                                          <span 
                                            onClick={() => setSelectedTeamId(team.id)}
                                            className="hover:text-indigo-400 cursor-pointer flex items-center gap-2"
                                          >
                                            {renderFlag(team.flag, "w-5 h-5 rounded-md object-contain shrink-0")}
                                            <span className="truncate max-w-[120px]">{team.name}</span>
                                          </span>
                                        </td>
                                        <td className="text-center font-bold text-white font-mono">{team.points}</td>
                                        <td className="text-center text-indigo-400 font-semibold font-mono">{team.wins}</td>
                                        <td className="text-center text-blue-400 font-semibold font-mono">{team.draws}</td>
                                        <td className="text-right text-rose-500 font-semibold font-mono">{team.losses}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Display Matches bracket checklist tree / playoffs visual tree */}
                      {(() => {
                        let playoffMatches = gameMatches.filter(m => m.phase !== 'Grupos' && m.phase !== 'Fase Única');
                        const groupMatchesList = gameMatches.filter(m => m.phase === 'Grupos' || m.phase === 'Fase Única');
                        
                        const hasPlayoffsStyle = game.bracketStyle === 'single-elimination';
                        let isVirtualPlayoffs = false;
                        
                        if (playoffMatches.length === 0 && hasPlayoffsStyle) {
                          isVirtualPlayoffs = true;
                          const approvedTeams = teams.filter(t => t.gameId === game.id && t.status === 'approved');
                          const numTeams = approvedTeams.length;
                          
                          const getTeamName = (idx: number) => approvedTeams[idx]?.name || `Time A definir #${idx + 1}`;
                          const getTeamFlag = (idx: number) => approvedTeams[idx]?.flag || '⚔️';
                          const getTeamId = (idx: number) => approvedTeams[idx]?.id || `virtual_t_${idx + 1}`;

                          if (numTeams > 4) {
                            playoffMatches = [
                              { id: 'v_semi_l1', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(0), team1Name: getTeamName(0), team1Flag: getTeamFlag(0), team2Id: getTeamId(1), team2Name: getTeamName(1), team2Flag: getTeamFlag(1), score1: null, score2: null, phase: 'Semifinais', side: 'left', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_semi_l2', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(2), team1Name: getTeamName(2), team1Flag: getTeamFlag(2), team2Id: getTeamId(3), team2Name: getTeamName(3), team2Flag: getTeamFlag(3), score1: null, score2: null, phase: 'Semifinais', side: 'left', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_semi_r1', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(4), team1Name: getTeamName(4), team1Flag: getTeamFlag(4), team2Id: getTeamId(5), team2Name: getTeamName(5), team2Flag: getTeamFlag(5), score1: null, score2: null, phase: 'Semifinais', side: 'right', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_semi_r2', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(6), team1Name: getTeamName(6), team1Flag: getTeamFlag(6), team2Id: getTeamId(7), team2Name: getTeamName(7), team2Flag: getTeamFlag(7), score1: null, score2: null, phase: 'Semifinais', side: 'right', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_final_l', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: 'placeholder_wl1', team1Name: 'Vencedor Semifinal Esq 1', team1Flag: '🏁', team2Id: 'placeholder_wl2', team2Name: 'Vencedor Semifinal Esq 2', team2Flag: '🏁', score1: null, score2: null, phase: 'Final de Ala', side: 'left', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_final_r', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: 'placeholder_wr1', team1Name: 'Vencedor Semifinal Dir 1', team1Flag: '🏁', team2Id: 'placeholder_wr2', team2Name: 'Vencedor Semifinal Dir 2', team2Flag: '🏁', score1: null, score2: null, phase: 'Final de Ala', side: 'right', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_gfinal', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: 'placeholder_gfl', team1Name: 'Campeão Ala Esquerda', team1Flag: '👑', team2Id: 'placeholder_gfr', team2Name: 'Campeão Ala Direita', team2Flag: '👑', score1: null, score2: null, phase: 'Grande Final', side: 'center', date: 'A definir', time: 'A definir', isLive: false }
                            ];
                          } else {
                            playoffMatches = [
                              { id: 'v_final_l', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(0), team1Name: getTeamName(0), team1Flag: getTeamFlag(0), team2Id: getTeamId(1), team2Name: getTeamName(1), team2Flag: getTeamFlag(1), score1: null, score2: null, phase: 'Final de Ala', side: 'left', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_final_r', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: getTeamId(2), team1Name: getTeamName(2), team1Flag: getTeamFlag(2), team2Id: getTeamId(3), team2Name: getTeamName(3), team2Flag: getTeamFlag(3), score1: null, score2: null, phase: 'Final de Ala', side: 'right', date: 'A definir', time: 'A definir', isLive: false },
                              { id: 'v_gfinal', gameId: game.id, gameName: game.name, gameEmoji: game.emoji, team1Id: 'placeholder_gfl', team1Name: 'Campeão Ala Esquerda', team1Flag: '👑', team2Id: 'placeholder_gfr', team2Name: 'Campeão Ala Direita', team2Flag: '👑', score1: null, score2: null, phase: 'Grande Final', side: 'center', date: 'A definir', time: 'A definir', isLive: false }
                            ];
                          }
                        }

                        const hasSemis = playoffMatches.some(m => m.phase === 'Semifinais');
                        
                        const columns = hasSemis 
                          ? [
                              { id: 'semi_left', phase: 'Semifinais', side: 'left', title: 'Semifinais', matches: playoffMatches.filter(m => m.phase === 'Semifinais' && m.side === 'left').sort((a,b) => a.id.localeCompare(b.id)) },
                              { id: 'final_left', phase: 'Final de Ala', side: 'left', title: 'Final de Ala', matches: playoffMatches.filter(m => m.phase === 'Final de Ala' && m.side === 'left').sort((a,b) => a.id.localeCompare(b.id)) },
                              { id: 'grand_final', phase: 'Grande Final', side: 'center', title: 'Grande Final', matches: playoffMatches.filter(m => (m.phase === 'Grande Final' || m.phase === 'Final') && (m.side === 'center' || m.phase === 'Grande Final' || m.phase === 'Final')) },
                              { id: 'final_right', phase: 'Final de Ala', side: 'right', title: 'Final de Ala', matches: playoffMatches.filter(m => m.phase === 'Final de Ala' && m.side === 'right').sort((a,b) => a.id.localeCompare(b.id)) },
                              { id: 'semi_right', phase: 'Semifinais', side: 'right', title: 'Semifinais', matches: playoffMatches.filter(m => m.phase === 'Semifinais' && m.side === 'right').sort((a,b) => a.id.localeCompare(b.id)) }
                            ]
                          : [
                              { id: 'final_left', phase: 'Final de Ala', side: 'left', title: 'Final de Ala', matches: playoffMatches.filter(m => m.phase === 'Final de Ala' && m.side === 'left').sort((a,b) => a.id.localeCompare(b.id)) },
                              { id: 'grand_final', phase: 'Grande Final', side: 'center', title: 'Grande Final', matches: playoffMatches.filter(m => (m.phase === 'Grande Final' || m.phase === 'Final') && (m.side === 'center' || m.phase === 'Grande Final' || m.phase === 'Final')) },
                              { id: 'final_right', phase: 'Final de Ala', side: 'right', title: 'Final de Ala', matches: playoffMatches.filter(m => m.phase === 'Final de Ala' && m.side === 'right').sort((a,b) => a.id.localeCompare(b.id)) }
                            ];

                        return (
                          <div className="space-y-8">
                            {playoffMatches.length > 0 && game.bracketStyle === 'single-elimination' && (
                              <div className="space-y-6 border-t border-white/5 pt-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <h4 className="text-sm font-display font-extrabold uppercase tracking-widest text-[#8F9FFF] flex items-center gap-2">
                                    <Trophy className="w-4.5 h-4.5 text-amber-500" /> Chave de Eliminatórias (Mata-mata)
                                  </h4>
                                  
                                  {/* Zoom Controls */}
                                  <div className="flex items-center gap-2 bg-[#0A0B0F]/90 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs backdrop-blur shrink-0 shadow-lg">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider mr-1 select-none">Zoom:</span>
                                    <button 
                                      onClick={() => {
                                        const cur = bracketScales[game.id] ?? 1.0;
                                        setBracketScales({ ...bracketScales, [game.id]: Math.max(0.4, Number((cur - 0.1).toFixed(1))) });
                                      }}
                                      className="w-6 h-6 rounded-lg bg-[#15171F] hover:bg-[#8F9FFF]/20 border border-white/5 text-slate-200 hover:text-white font-black flex items-center justify-center cursor-pointer transition-all text-xs active:scale-95"
                                      title="Diminuir Zoom"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono text-[10px] font-black text-indigo-400 w-10 text-center select-none">
                                      {Math.round((bracketScales[game.id] ?? 1.0) * 100)}%
                                    </span>
                                    <button 
                                      onClick={() => {
                                        const cur = bracketScales[game.id] ?? 1.0;
                                        setBracketScales({ ...bracketScales, [game.id]: Math.min(1.6, Number((cur + 0.1).toFixed(1))) });
                                      }}
                                      className="w-6 h-6 rounded-lg bg-[#15171F] hover:bg-[#8F9FFF]/20 border border-white/5 text-slate-200 hover:text-white font-black flex items-center justify-center cursor-pointer transition-all text-xs active:scale-95"
                                      title="Aumentar Zoom"
                                    >
                                      +
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const next = { ...bracketScales };
                                        delete next[game.id];
                                        setBracketScales(next);
                                      }}
                                      className="text-[9px] uppercase font-black tracking-widest text-slate-400 hover:text-indigo-400 ml-1.5 cursor-pointer select-none transition-colors"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                                  <div 
                                    className="flex gap-16 py-6 px-4 min-w-max items-center justify-center transition-all duration-300 origin-top"
                                    style={{
                                      zoom: bracketScales[game.id] ?? 1.0
                                    }}
                                  >
                                    {columns.map((col, colIdx) => (
                                      <div key={col.id} className="flex flex-col justify-around h-[480px] relative">
                                        <div className="absolute -top-6 left-0 right-0 text-center">
                                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-[#0A0B0F] border border-white/5 px-3 py-1 rounded-full shadow-md">
                                            {col.title}
                                          </span>
                                        </div>
                                        
                                        {col.matches.map((m, matchIdx) => {
                                          const finished = m.score1 !== null && m.score2 !== null;
                                          const isLive = m.isLive;
                                          const theme = getGameThemeColor(m.gameId);
                                          const isT1Winner = finished && m.score1! > m.score2!;
                                          const isT2Winner = finished && m.score2! > m.score1!;
                                          
                                          return (
                                            <div key={m.id} className="relative py-4 group">
                                              {(() => {
                                                if (col.side === 'left') {
                                                  const nextCol = columns[colIdx + 1];
                                                  if (nextCol && nextCol.matches.length > 0) {
                                                    const M = col.matches.length;
                                                    const M_next = nextCol.matches.length;
                                                    const nextMatchIdx = Math.floor(matchIdx / 2);
                                                    const H = 480;
                                                    const y_curr = (H * (2 * matchIdx + 1)) / (2 * M);
                                                    const y_next = (H * (2 * nextMatchIdx + 1)) / (2 * M_next);
                                                    const dy = y_next - y_curr;
                                                    const isActive = finished;
                                                    const colorClass = isActive ? theme.text : 'text-slate-700 group-hover:text-indigo-500/40';
                                                    const opacityClass = isActive ? 'opacity-80' : 'opacity-30 group-hover:opacity-60';
                                                    const shadowClass = isActive ? 'shadow-[0_0_10px_currentColor]' : '';
                                                    
                                                    return (
                                                      <div className="absolute left-full top-1/2 w-16 h-0 -translate-y-1/2 z-0 pointer-events-none">
                                                        <div className={`absolute left-0 top-0 w-8 h-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} />
                                                        <div className={`absolute left-8 w-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} style={{ height: `${Math.abs(dy)}px`, top: dy < 0 ? `${dy}px` : '0px' }} />
                                                        <div className={`absolute left-8 w-8 h-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} style={{ top: `${dy}px` }} />
                                                      </div>
                                                    );
                                                  }
                                                } else if (col.side === 'right') {
                                                  const nextCol = columns[colIdx - 1];
                                                  if (nextCol && nextCol.matches.length > 0) {
                                                    const M = col.matches.length;
                                                    const M_next = nextCol.matches.length;
                                                    const nextMatchIdx = Math.floor(matchIdx / 2);
                                                    const H = 480;
                                                    const y_curr = (H * (2 * matchIdx + 1)) / (2 * M);
                                                    const y_next = (H * (2 * nextMatchIdx + 1)) / (2 * M_next);
                                                    const dy = y_next - y_curr;
                                                    const isActive = finished;
                                                    const colorClass = isActive ? theme.text : 'text-slate-700 group-hover:text-indigo-500/40';
                                                    const opacityClass = isActive ? 'opacity-80' : 'opacity-30 group-hover:opacity-60';
                                                    const shadowClass = isActive ? 'shadow-[0_0_10px_currentColor]' : '';
                                                    
                                                    return (
                                                      <div className="absolute right-full top-1/2 w-16 h-0 -translate-y-1/2 z-0 pointer-events-none">
                                                        <div className={`absolute right-0 top-0 w-8 h-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} />
                                                        <div className={`absolute right-8 w-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} style={{ height: `${Math.abs(dy)}px`, top: dy < 0 ? `${dy}px` : '0px' }} />
                                                        <div className={`absolute right-8 w-8 h-[2px] bg-current transition-all ${colorClass} ${opacityClass} ${shadowClass}`} style={{ top: `${dy}px` }} />
                                                      </div>
                                                    );
                                                  }
                                                }
                                                return null;
                                              })()}
                                              
                                              <div className={`w-[260px] bg-[#0A0B0F]/95 border ${isLive ? 'border-rose-500/50 shadow-lg shadow-rose-500/10 animate-pulse' : finished ? 'border-white/5 shadow-md shadow-indigo-950/5' : 'border-white/10 hover:border-white/20 shadow-lg'} rounded-2xl p-4 space-y-3 relative z-10 transition-all duration-300`}>
                                                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                                                  <span>⏰ {m.time}</span>
                                                  <span>{m.date.includes('-') ? m.date.split('-').reverse().slice(0, 2).join('/') : m.date}</span>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${isT1Winner ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : finished ? 'bg-transparent border-transparent text-slate-500' : 'bg-white/[0.02] border-white/5 text-slate-200'}`}>
                                                    <div className="flex items-center gap-2 truncate max-w-[75%]">
                                                      {renderFlag(m.team1Flag, "w-6 h-6 rounded-md object-contain shrink-0")}
                                                      <span onClick={() => m.team1Id !== 'bye' && !m.team1Id.startsWith('placeholder') && setSelectedTeamId(m.team1Id)} className={`font-semibold truncate ${m.team1Id !== 'bye' && !m.team1Id.startsWith('placeholder') ? 'hover:text-indigo-400 cursor-pointer' : ''}`}>
                                                        {m.team1Name}
                                                      </span>
                                                    </div>
                                                    <span className={`font-mono font-black text-sm ${isT1Winner ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                      {m.score1 !== null ? m.score1 : '-'}
                                                    </span>
                                                  </div>
                                                  
                                                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${isT2Winner ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : finished ? 'bg-transparent border-transparent text-slate-500' : 'bg-white/[0.02] border-white/5 text-slate-200'}`}>
                                                    <div className="flex items-center gap-2 truncate max-w-[75%]">
                                                      {renderFlag(m.team2Flag, "w-6 h-6 rounded-md object-contain shrink-0")}
                                                      <span onClick={() => m.team2Id !== 'bye' && !m.team2Id.startsWith('placeholder') && setSelectedTeamId(m.team2Id)} className={`font-semibold truncate ${m.team2Id !== 'bye' && !m.team2Id.startsWith('placeholder') ? 'hover:text-indigo-400 cursor-pointer' : ''}`}>
                                                        {m.team2Name}
                                                      </span>
                                                    </div>
                                                    <span className={`font-mono font-black text-sm ${isT2Winner ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                      {m.score2 !== null ? m.score2 : '-'}
                                                    </span>
                                                  </div>
                                                </div>
                                                
                                                {!finished && m.team1Id !== 'bye' && m.team2Id !== 'bye' && !isVirtualPlayoffs && (
                                                  <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2">
                                                    <button onClick={() => updateMatch(m.id, { checkInTeam1: !m.checkInTeam1 })} className={`text-[8px] font-black uppercase py-1 px-1 rounded-md border transition-all cursor-pointer truncate ${m.checkInTeam1 ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400' : 'bg-[#0A0B0F] border-white/5 text-slate-500 hover:text-slate-350'}`}>
                                                      {m.checkInTeam1 ? '✓ T1 Ok' : 'Check-in T1'}
                                                    </button>
                                                    <button onClick={() => updateMatch(m.id, { checkInTeam2: !m.checkInTeam2 })} className={`text-[8px] font-black uppercase py-1 px-1 rounded-md border transition-all cursor-pointer truncate ${m.checkInTeam2 ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400' : 'bg-[#0A0B0F] border-white/5 text-slate-500 hover:text-slate-350'}`}>
                                                      {m.checkInTeam2 ? '✓ T2 Ok' : 'Check-in T2'}
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                    
                                    {(() => {
                                      const finalMatch = playoffMatches.find(m => m.phase === 'Grande Final' || m.phase === 'Final');
                                      if (finalMatch && finalMatch.score1 !== null && finalMatch.score2 !== null) {
                                        const winnerName = finalMatch.score1 > finalMatch.score2 ? finalMatch.team1Name : finalMatch.team2Name;
                                        const winnerFlag = finalMatch.score1 > finalMatch.score2 ? finalMatch.team1Flag : finalMatch.team2Flag;
                                        return (
                                          <div className="flex flex-col justify-center h-[480px] relative">
                                            <div className="absolute -top-6 left-0 right-0 text-center">
                                              <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shadow-md">
                                                🏆 Campeão
                                              </span>
                                            </div>
                                            <div className="w-[200px] bg-gradient-to-br from-amber-950/20 to-slate-900/50 border border-amber-500/30 rounded-2xl p-4 text-center shadow-xl space-y-2 relative z-10 flex flex-col items-center justify-center">
                                              <Crown className="w-8 h-8 text-amber-500 animate-bounce" />
                                              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-center overflow-hidden shrink-0 filter drop-shadow my-1 select-none">
                                                {renderFlag(winnerFlag, "w-full h-full object-contain")}
                                              </div>
                                              <h5 className="font-display font-black text-sm text-white uppercase tracking-wider truncate w-full">{winnerName}</h5>
                                              <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest">Campeão Oficial</p>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {groupMatchesList.length > 0 && game.bracketStyle !== 'single-elimination' && (
                              <div className="space-y-4">
                                <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                                  Roteiro de Duelos Oficiais
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {groupMatchesList.map(m => {
                                    const theme = getGameThemeColor(game.id);
                                    return (
                                      <div key={m.id} className={`bg-[#0A0B0F]/40 p-3 rounded-xl border ${theme.border} flex items-center justify-between text-xs transition-all hover:border-white/15`}>
                                        <span className="font-mono text-[9px] bg-[#15171F] border border-white/5 text-slate-500 px-1.5 py-0.5 rounded">{m.phase}</span>
                                        <span className="font-bold text-slate-200">
                                          {m.team1Flag} {m.team1Name.substring(0, 10)}... {m.score1 !== null ? `${m.score1}:${m.score2}` : 'vs'} {m.team2Flag} {m.team2Name.substring(0, 10)}...
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {/* PAGE 3: CALENDÁRIO (SCHEDULE DAILY BOARD) */}
        {currentPage === 'calendario' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <CalIcon className="w-5 h-5 text-indigo-400" />
                <h1 className="font-display font-black text-xl lg:text-3xl text-white tracking-widest uppercase">
                  Agenda do Torneio
                </h1>
              </div>

              {/* Month controllers */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (currentCalMonth === 0) { setCurrentCalMonth(11); setCurrentCalYear(prev => prev - 1); }
                    else { setCurrentCalMonth(prev => prev - 1); }
                  }}
                  className="bg-[#0E1016] hover:bg-white/5 border border-white/10 text-slate-300 p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  ◀
                </button>
                <span className="font-display font-extrabold text-slate-200 tracking-wider text-sm uppercase">
                  {CAL_MONTHS_PT[currentCalMonth]} {currentCalYear}
                </span>
                <button 
                  onClick={() => {
                    if (currentCalMonth === 11) { setCurrentCalMonth(0); setCurrentCalYear(prev => prev + 1); }
                    else { setCurrentCalMonth(prev => prev + 1); }
                  }}
                  className="bg-[#0E1016] hover:bg-white/5 border border-white/10 text-slate-300 p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Calendar grid container (left column) */}
              <div className="lg:col-span-2 bg-[#0E1016]/80 border border-white/5 rounded-2xl p-5 shadow-xl h-fit">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold font-display uppercase tracking-widest text-[#8F9FFF] mb-3">
                  {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(d => (
                    <div key={d} className="py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {/* Blank spacers */}
                  {Array.from({ length: new Date(currentCalYear, currentCalMonth, 1).getDay() }).map((_, idx) => (
                    <div key={`blank-${idx}`} className="bg-transparent aspect-square border border-transparent rounded-lg"></div>
                  ))}

                  {/* Days */}
                  {Array.from({ length: new Date(currentCalYear, currentCalMonth + 1, 0).getDate() }).map((_, idx) => {
                    const day = idx + 1;
                    const dayStr = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayMatches = matches.filter(m => m.date === dayStr);
                    const isSelected = selectedCalDate === dayStr;
                    const hasMatches = dayMatches.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedCalDate(dayStr)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border font-sans cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/35 scale-[1.03] z-10'
                            : hasMatches
                              ? 'bg-indigo-500/[0.05] border-indigo-500/25 hover:border-indigo-500/50 text-indigo-400'
                              : 'bg-[#0A0B0F]/50 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-mono text-sm font-bold">{day}</span>
                        
                        {/* Beautiful minimalist dot indicator */}
                        {hasMatches && (
                          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                            isSelected ? 'bg-white animate-bounce' : 'bg-indigo-400 animate-pulse'
                          }`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Day matches timeline explorer panel (right column) */}
              <div className="space-y-4">
                <div className="bg-[#0E1016] border border-white/10 rounded-2xl p-5 shadow-xl min-h-[300px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#8F9FFF]">Partidas Agendadas</span>
                      <h3 className="font-display font-bold text-base text-white tracking-wider uppercase mt-0.5">
                        {(() => {
                          if (!selectedCalDate) return 'Selecione uma Data';
                          const [y, m, d] = selectedCalDate.split('-');
                          return `${d} de ${CAL_MONTHS_PT[parseInt(m) - 1]} de ${y}`;
                        })()}
                      </h3>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {(() => {
                        if (!selectedCalDate) return null;
                        const dayMatches = matches.filter(m => m.date === selectedCalDate);
                        
                        if (dayMatches.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                              <AlertCircle className="w-8 h-8 mb-2 text-slate-600" />
                              <p className="text-xs">Nenhum duelo marcado para este dia.</p>
                              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto">Procure por dias que possuam o ponto indicador roxo.</p>
                            </div>
                          );
                        }

                        return dayMatches.map(m => {
                          const finished = m.score1 !== null && m.score2 !== null;
                          const theme = getGameThemeColor(m.gameId);
                          return (
                            <div key={m.id} className={`bg-[#0A0B0F] border ${theme.border} rounded-xl p-3.5 space-y-3 hover:border-white/20 transition-all group ${theme.shadow} bg-gradient-to-b ${theme.glow}`}>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={`bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider font-sans ${theme.text}`}>
                                  {m.gameEmoji} {m.gameName}
                                </span>
                                <span className="font-mono text-slate-400 font-bold">⏰ {m.time}</span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex flex-col items-start truncate max-w-[40%] space-y-1">
                                  <div className="flex items-center gap-2">
                                    {renderFlag(m.team1Flag, "w-6 h-6 rounded-md object-contain shrink-0")}
                                    <span className="font-bold text-slate-200 truncate">{m.team1Name}</span>
                                  </div>
                                  {!finished && (
                                    <span className={`text-[7px] uppercase tracking-wider font-extrabold px-1 py-0.2 rounded ${m.checkInTeam1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.01] text-slate-600'}`}>
                                      {m.checkInTeam1 ? '✔ Presente' : '✘ Ausente'}
                                    </span>
                                  )}
                                </div>

                                <div className="px-2 font-mono text-center shrink-0">
                                  {finished ? (
                                    <span className="text-indigo-400 font-extrabold text-[13px] bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                                      {m.score1}:{m.score2}
                                    </span>
                                  ) : m.isLive ? (
                                    <span className="bg-rose-500/20 text-rose-500 font-black text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-rose-500/25">AO VIVO</span>
                                  ) : (
                                    <span className="text-[9px] text-slate-600 bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded font-black">VS</span>
                                  )}
                                </div>

                                <div className="flex flex-col items-end truncate max-w-[40%] text-right space-y-1">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-slate-200 truncate">{m.team2Name}</span>
                                    {renderFlag(m.team2Flag, "w-6 h-6 rounded-md object-contain shrink-0")}
                                  </div>
                                  {!finished && (
                                    <span className={`text-[7px] uppercase tracking-wider font-extrabold px-1 py-0.2 rounded ${m.checkInTeam2 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.01] text-slate-600'}`}>
                                      {m.checkInTeam2 ? '✔ Presente' : '✘ Ausente'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quick Check-in simulation inside Calendar matches list */}
                              {!finished && (
                                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5">
                                  <button
                                    onClick={() => updateMatch(m.id, { checkInTeam1: !m.checkInTeam1 })}
                                    className={`text-[8px] font-black uppercase tracking-wider py-1 px-1.5 rounded border transition-all cursor-pointer ${
                                      m.checkInTeam1
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                        : 'bg-[#0A0B0F] border-white/5 text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    {m.checkInTeam1 ? '✓ Check-in T1' : 'Check-in T1'}
                                  </button>
                                  <button
                                    onClick={() => updateMatch(m.id, { checkInTeam2: !m.checkInTeam2 })}
                                    className={`text-[8px] font-black uppercase tracking-wider py-1 px-1.5 rounded border transition-all cursor-pointer ${
                                      m.checkInTeam2
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                        : 'bg-[#0A0B0F] border-white/5 text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    {m.checkInTeam2 ? '✓ Check-in T2' : 'Check-in T2'}
                                  </button>
                                </div>
                              )}

                              <div className="text-[9px] uppercase tracking-wider text-slate-500 border-t border-white/[0.02] pt-2 flex justify-between font-bold">
                                <span>Fase: {m.phase}</span>
                                {m.mvp && <span className="text-[#8F9FFF]">🏆 MVP: {m.mvp}</span>}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Agenda oficial escolar</span>
                    <span>Total: {matches.length} d</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}



        {/* PAGE 6: CADASTRO (FORM REGISTRATION FOR TEAMS) */}
        {currentPage === 'cadastro' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {(() => {
              const isDeadlinePassed = settings.registrationDeadline 
                ? new Date() > new Date(settings.registrationDeadline) 
                : false;

              if (isDeadlinePassed) {
                return (
                  <div className="bg-[#0E1016] border border-red-500/20 rounded-3xl p-8 text-center space-y-4 shadow-xl animate-in fade-in duration-200">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto text-red-400 text-3xl animate-bounce">
                      ⏰
                    </div>
                    <h2 className="font-display font-black text-xl lg:text-2xl text-white tracking-wider uppercase">Inscrições Encerradas!</h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                      O prazo limite para inscrição de equipes e entrada de participantes (dia {settings.registrationDeadline ? new Date(settings.registrationDeadline).toLocaleString('pt-BR') : ''}) já expirou. 
                      Os confrontos estão sendo gerados e as chaves estão sendo preparadas pelos organizadores.
                    </p>
                    <button 
                      onClick={() => setCurrentPage('inicio')} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase px-6 py-2.5 rounded-xl tracking-wider text-xs cursor-pointer transition-all shadow-lg"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                );
              }

              const activeGames = games.filter(g => g.isConfirmed);
              if (activeGames.length === 0) {
                return (
                  <div className="bg-[#0E1016] border border-indigo-500/20 rounded-3xl p-8 text-center space-y-4 shadow-xl animate-in fade-in duration-200">
                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 text-3xl animate-bounce">
                      🎮
                    </div>
                    <h2 className="font-display font-black text-xl lg:text-2xl text-white tracking-wider uppercase">Inscrições Não Iniciadas!</h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                      Ainda não existem jogos oficiais cadastrados e confirmados para o campeonato. 
                      Aguarde a configuração das modalidades pelos moderadores para poder inscrever seu time.
                    </p>
                    <button 
                      onClick={() => setCurrentPage('inicio')} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase px-6 py-2.5 rounded-xl tracking-wider text-xs cursor-pointer transition-all shadow-lg"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8F9FFF]">Escola Midilana Esports</span>
                      <h1 className="font-display font-black text-2xl lg:text-4xl text-white tracking-widest uppercase">Inscrições do Torneio</h1>
                      <p className="text-xs text-slate-500 mt-1">Crie um novo time ou use o código enviado pelo seu capitão para se juntar a um time existente.</p>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                      <Clock className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
                      <div className="text-xs text-slate-350 leading-relaxed font-sans">
                        <span className="font-extrabold text-white uppercase tracking-wider text-[10px] block mb-0.5 text-indigo-300">Prazo Limite de Inscrições:</span>
                        <span>As inscrições e entradas de integrantes fecham em: <strong>{settings.registrationDeadline ? new Date(settings.registrationDeadline).toLocaleString('pt-BR') : 'A definir'}</strong>.</span>
                      </div>
                    </div>
                  </div>

            {/* TAB SELECTOR FOR ROSTER REGISTRATION OR SHARABLE CODE */}
            <div className="flex gap-2 border-b border-white/5 pb-4 mb-6">
              <button 
                type="button" 
                onClick={() => setJoinTab('create')}
                className={`flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold rounded-xl border transition-all cursor-pointer ${
                  joinTab === 'create' 
                    ? 'bg-indigo-650 bg-indigo-650 bg-indigo-650 bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15' 
                    : 'bg-[#0E1016] border-white/5 text-slate-450 text-slate-400 hover:text-white'
                }`}
              >
                🏆 Criar Nova Equipe
              </button>
              <button 
                type="button" 
                onClick={() => setJoinTab('join')}
                className={`flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold rounded-xl border transition-all cursor-pointer ${
                  joinTab === 'join' 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15' 
                    : 'bg-[#0E1016] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                👥 Entrar em Equipe Existente
              </button>
            </div>

            {joinTab === 'join' ? (
              <form onSubmit={handleJoinTeamSubmit} className="bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl animate-in fade-in duration-200">
                <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-widest border-b border-white/5 pb-3">
                  Passo Único: Entrar com o Código do Time
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seu Nome Completo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Carlos Eduardo Lima" 
                      value={joinStudentName}
                      onChange={(e) => setJoinStudentName(e.target.value)}
                      required
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Código da Equipe</label>
                    <input 
                      type="text" 
                      placeholder="Ex: PHX123" 
                      value={joinTeamCode}
                      onChange={(e) => setJoinTeamCode(e.target.value)}
                      required
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center uppercase tracking-widest focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-extrabold uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                  >
                    ✓ Aderir à Equipe
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterTeamSubmit} className="space-y-6 animate-in fade-in duration-200">
                
                {/* GAME ROW CARDS */}
                <div className="bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
                  <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                    <Swords className="w-4 h-4 text-indigo-400" /> Passo 1: Informações de Jogo
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Escolha do Jogo</label>
                      <select 
                        value={regGame} 
                        onChange={(e) => {
                          setRegGame(e.target.value);
                          // pre-select type recommendation
                          const matchGame = games.find(g => g.id === e.target.value);
                          if (matchGame) {
                            if (matchGame.format === '1v1') setRegType('individual');
                            else if (matchGame.format === '2v2') setRegType('dupla');
                            else setRegType('time');
                          }
                        }}
                        required
                        className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Selecione...</option>
                        {games.filter(g => g.isConfirmed).map(g => (
                          <option key={g.id} value={g.id}>{g.emoji} {g.name} ({g.format})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* TEAM INFORMATION CARD */}
                <div className="bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
                  <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                    <Users className="w-4 h-4 text-indigo-400" /> Passo 2: Dados cadastrais da Equipe
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nome da Equipe ou Nick do Jogador</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Team Phoenix..." 
                        value={regTeamName}
                        onChange={(e) => setRegTeamName(e.target.value)}
                        required
                        className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Logo / Escudo da Equipe</label>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4 bg-[#0A0B0F] border border-white/10 rounded-xl p-3">
                          <div className="w-12 h-12 rounded-xl bg-[#15171F] border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            {regFlag ? (
                              <img src={regFlag} alt="preview" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Logo</span>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <input 
                              type="file" 
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedFileName(file.name);
                                  try {
                                    const base64 = await processUploadedImage(file);
                                    setRegFlag(base64);
                                  } catch (err) {
                                    alert("Falha ao processar a imagem. Tente outro arquivo.");
                                    console.error(err);
                                  }
                                }
                              }}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 shadow-md shadow-indigo-600/10"
                            >
                              Escolher Arquivo
                            </button>
                            <span className="text-xs text-slate-400 truncate font-medium">
                              {selectedFileName || 'Nenhum arquivo escolhido'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Explicação pedagógica de diretrizes de design do logo para os alunos */}
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans">
                          <span className="font-extrabold uppercase text-[#8F9FFF] block mb-1">💡 DICA PARA O LOGO DO TIME:</span>
                          Para melhor resultado visual, envie imagens em formato **PNG com fundo transparente** e de proporção **quadrada**. 
                          O sistema fará o recorte automático de bordas vazias e centralizará o seu escudo perfeitamente.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">WhatsApp ou E-mail para contato</label>
                      <input 
                        type="text" 
                        placeholder="Ex: (11) 99999-0000 ou email@exemplo.com" 
                        value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        required
                        className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ADD PLAYERS / ROSTER SUBFIELDS */}
                {regType !== 'individual' && (
                  <div className="bg-[#0E1016] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
                    <h3 className="text-xs uppercase font-extrabold text-[#8F9FFF] tracking-widest border-b border-white/5 pb-3">
                      Passo 3: Integrantes e Nicks de Jogadores (Capitão deve cadastrar ao menos o seu nome)
                    </h3>

                    <div className="space-y-3">
                      {Array.from({ length: regType === 'dupla' ? 2 : 4 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-[#0A0B0F] p-2 border border-white/5 rounded-xl">
                          <span className="w-8 h-8 rounded bg-[#15171F] text-indigo-400 font-bold flex items-center justify-center text-xs font-mono border border-white/5">{idx + 1}</span>
                          <input 
                            type="text" 
                            placeholder={idx === 0 ? "Nome do Capitão de Equipe (Obrigatório)" : "Nome do Integrante (Opcional - pode entrar por código depois)"} 
                            value={regMembers[idx]}
                            onChange={(e) => {
                              const copy = [...regMembers];
                              copy[idx] = e.target.value;
                              setRegMembers(copy);
                            }}
                            className="flex-1 bg-transparent border-none text-xs text-white py-1 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-extrabold uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  Enviar Solicitação de Inscrição
                </button>

              </form>
            )}
                </>
              );
            })()}
          </div>
        )}

        {/* PAGE 8: SECURE CONTROLS FOR MODERATORS */}
        {currentPage === 'admin' && isAdmin && (
          <div className="space-y-6">
            <AdminPanel onSuccess={() => setCurrentPage('inicio')} />
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0E1016] border-t border-white/5 px-4 lg:px-8 py-6 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 font-medium uppercase text-[11px] tracking-wider mb-2">
          <span className="cursor-pointer hover:text-indigo-400" onClick={() => setCurrentPage('inicio')}>Início</span>
          <span className="cursor-pointer hover:text-indigo-400" onClick={() => setCurrentPage('chaveamento')}>Chaveamento</span>
          <span className="cursor-pointer hover:text-indigo-400" onClick={() => setCurrentPage('cadastro')}>Cadastrar Time</span>
        </div>
        <p>Transmissão oficial, tabelas em tempo real e sorteios da Escola Midilana Esports HUB © 2026. Todos os direitos reservados.</p>
        <p className="text-[10px] text-slate-600 font-mono">Desenvolvido com React, Tailwind CSS e Firebase Firestore.</p>
      </footer>

      {/* MODAL 1: TEAM PROFILE */}
      {selectedTeamId && (
        <TeamProfileModal teamId={selectedTeamId} onClose={() => setSelectedTeamId(null)} />
      )}



      {/* MODAL 3: FULLSCREEN PROJECTOR INTERFACES */}
      {showFullscreenBracket && (
        <BracketFullscreen onClose={() => setShowFullscreenBracket(false)} />
      )}

      {/* MODAL 4: ADMIN PASSWORD AUTHORIZATION LOGIN */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdminAuthSubmit} className="bg-[#0E1016] border border-white/10 p-6 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto text-xl">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-sans font-black text-slate-100 uppercase tracking-tight text-lg">Acesso do Administrador</h2>
              <p className="text-xs text-slate-500 leading-snug">Painel restrito para lançar resultados e moderar inscrições. Digite a senha administrativa padrão.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-sans">Senha de Acesso</label>
              <input 
                type="password" 
                placeholder="Tente 'admin123' ou 'admin'" 
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                required
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowAdminLogin(false)}
                className="flex-1 bg-[#0A0B0F] border border-white/10 text-slate-400 text-xs py-2 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-extrabold uppercase text-xs py-2 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
              >
                ✓ Entrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY 5: CELESTIAL CELEBRATING CHAMPION GLIDE SLIDE */}
      {showChampionSlide && championDetails && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-lg mx-auto bg-[#0E1016] border border-white/10 p-8 rounded-3xl shadow-3xl animate-in zoom-in duration-350">
            <div className="space-y-2">
              <Crown className="w-16 h-16 text-amber-500 mx-auto animate-bounce filter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-110 transition-transform" />
              <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                ⭐ CAMPEÃO DO TORNEIO DECLARADO ⭐
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-24 h-24 bg-[#15171F] border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden shrink-0 mx-auto shadow-2xl my-3 select-none">
                {renderFlag(championDetails.flag, "w-full h-full object-contain")}
              </div>
              <h1 className="font-display font-black text-3xl lg:text-5xl text-white tracking-widest uppercase leading-none mt-4">
                {championDetails.name}
              </h1>
              <p className="text-xs text-slate-400">Grande vencedor do torneio de <strong className="text-indigo-400">{championDetails.game}</strong> na Escola Midilana!</p>
            </div>

            <div className="border-t border-white/5 my-4 pt-4 text-xs text-slate-500">
              <p>O resultado oficial foi homologado pelos moderadores nas chaves e placares públicos.</p>
            </div>

            <button 
              onClick={() => setShowChampionSlide(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-extrabold uppercase text-xs px-6 py-3 rounded-xl tracking-wider select-none cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              ✓ Fechar e Curtir Celebração
            </button>
          </div>
        </div>
      )}

      {/* TOASTER NOTIFICATION ALERTS QUEUE IN BOTTOM RIGHT CORNER */}
      <div className="fixed bottom-16 lg:bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasterQueue.map(t => (
          <div 
            key={t.id} 
            className="bg-[#0E1016]/95 border border-indigo-500/30 text-slate-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm pointer-events-auto animate-in slide-in-from-right duration-300"
          >
            <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">🔔</div>
            <p className="text-xs font-medium text-slate-200 leading-snug">{t.msg}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}
