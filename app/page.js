'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './components/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Clock,
  UserCheck,
  Target,
  Flame,
  Gift,
} from 'lucide-react';

const BADGES = [
  {
    id: 'starter',
    title: 'Starter EPSI',
    image: '/icon/image-removebg-preview.png',
    minPoints: 10,
  },
  {
    id: 'explorer',
    title: 'Explorateur',
    image: '/icon/image-removebg-preview%20(1).png',
    minPoints: 35,
  },
  {
    id: 'community',
    title: 'Ambassadeur',
    image: '/icon/image-removebg-preview%20(2).png',
    minPoints: 80,
  },
  {
    id: 'streak',
    title: 'Flamme continue',
    image: '/icon/image-removebg-preview%20(3).png',
    minStreak: 3,
  },
  {
    id: 'legend',
    title: 'Légende du campus',
    image: '/icon/image-removebg-preview%20(4).png',
    minPoints: 150,
  },
];

const BASE_GAME_PROGRESS = {
  streak: 0,
  points: 0,
  lastCompletedDate: null,
  lastReward: 0,
  lastAttempts: null,
};

const CODE_LENGTH = 6;

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailySeed(date = new Date()) {
  const yearStart = new Date(date.getFullYear(), 0, 0);
  const dayNumber = Math.floor((date - yearStart) / 86400000);
  return dayNumber;
}

function buildDailyLogicCode(date = new Date()) {
  const seed = getDailySeed(date);
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let index = digits.length - 1; index > 0; index -= 1) {
    const swapIndex = (seed * (index + 3) + 17) % (index + 1);
    [digits[index], digits[swapIndex]] = [digits[swapIndex], digits[index]];
  }

  return digits.slice(0, CODE_LENGTH);
}

function evaluateCodeGuess(secretCode, guessCode) {
  const statuses = guessCode.map((digit, index) => {
    if (digit === secretCode[index]) {
      return 'exact';
    }

    if (secretCode.includes(digit)) {
      return 'misplaced';
    }

    return 'absent';
  });

  const exact = guessCode.reduce(
    (count, digit, index) => (digit === secretCode[index] ? count + 1 : count),
    0,
  );

  const shared = guessCode.reduce(
    (count, digit) => (secretCode.includes(digit) ? count + 1 : count),
    0,
  );

  return {
    exact,
    misplaced: shared - exact,
    statuses,
  };
}

function getUserQuestStorageKey(user) {
  if (user?.id) {
    return `epsi_quest_progress_user_${user.id}`;
  }

  if (user?.email) {
    return `epsi_quest_progress_user_${encodeURIComponent(user.email)}`;
  }

  return 'epsi_quest_progress_guest';
}

function normalizeProgress(progress) {
  const normalized = {
    ...BASE_GAME_PROGRESS,
    ...(progress && typeof progress === 'object' ? progress : {}),
  };

  return normalized;
}

function isValidGuess(input) {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(input)) {
    return false;
  }

  const uniqueDigits = new Set(input.split(''));
  return uniqueDigits.size === CODE_LENGTH;
}

function formatCode(code) {
  return code.join(' ');
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ events: 0, users: 0, testimonials: 0, posts: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [gameProgress, setGameProgress] = useState(BASE_GAME_PROGRESS);
  const [gameNotice, setGameNotice] = useState('');
  const [logicCode, setLogicCode] = useState([]);
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [logicSolved, setLogicSolved] = useState(false);

  const todayKey = getLocalDateKey();
  const userProgressStorageKey = getUserQuestStorageKey(user);
  const gameCompletedToday = gameProgress.lastCompletedDate === todayKey;
  const dailyLogicCode = useMemo(() => buildDailyLogicCode(new Date()), [todayKey]);
  const maxAttempts = 6;
  const guessesRemaining = Math.max(0, maxAttempts - attempts.length);
  const hiddenCodeDisplay = '? '.repeat(CODE_LENGTH).trim();

  const questTier = gameProgress.points >= 150 ? 'Légende du campus' : gameProgress.points >= 80 ? 'Ambassadeur' : gameProgress.points >= 30 ? 'Explorateur' : 'Nouvel arrivant';
  const unlockedBadges = BADGES.filter(badge => {
    const hasPoints = typeof badge.minPoints === 'number' ? gameProgress.points >= badge.minPoints : true;
    const hasStreak = typeof badge.minStreak === 'number' ? gameProgress.streak >= badge.minStreak : true;
    return hasPoints && hasStreak;
  });

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});

    // Fetch upcoming events
    fetch('/api/events?limit=3&upcoming=true')
      .then(res => res.json())
      .then(data => setUpcomingEvents(data.events || []))
      .catch(() => {});

    // Fetch recent forum posts
    fetch('/api/forum?limit=3')
      .then(res => res.json())
      .then(data => setRecentPosts(data.posts || []))
      .catch(() => {});

    // Fetch active polls
    fetch('/api/polls?active=true&limit=1')
      .then(res => res.json())
      .then(data => setActivePolls(data.polls || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedProgress = localStorage.getItem(userProgressStorageKey);

      if (savedProgress) {
        setGameProgress(normalizeProgress(JSON.parse(savedProgress)));
        return;
      }

      const legacyProgress = localStorage.getItem('epsi_quest_progress');
      if (legacyProgress) {
        const normalizedProgress = normalizeProgress(JSON.parse(legacyProgress));
        setGameProgress(normalizedProgress);
        localStorage.setItem(userProgressStorageKey, JSON.stringify(normalizedProgress));
        localStorage.removeItem('epsi_quest_progress');
        return;
      }

      setGameProgress(BASE_GAME_PROGRESS);
    } catch (error) {
      localStorage.removeItem(userProgressStorageKey);
      setGameProgress(BASE_GAME_PROGRESS);
    }
  }, [userProgressStorageKey]);

  useEffect(() => {
    setLogicCode(dailyLogicCode);
    setGuessInput('');
    setAttempts([]);
    setLogicSolved(gameCompletedToday);
    setGameNotice(gameCompletedToday
      ? 'Défi du jour déjà validé. Un nouveau puzzle sera disponible demain.'
      : `Trouve le code secret à ${CODE_LENGTH} chiffres (chiffres tous différents).`);
  }, [dailyLogicCode, gameCompletedToday, todayKey]);

  const rewardDailyGame = (attemptCount) => {
    if (gameCompletedToday) {
      return;
    }

    const efficiencyBonus = Math.max(0, 8 - attemptCount);
    const dailyReward = 20 + efficiencyBonus;
    const yesterdayKey = getLocalDateKey(new Date(Date.now() - 86400000));
    const nextStreak = gameProgress.lastCompletedDate === yesterdayKey ? gameProgress.streak + 1 : 1;
    const nextProgress = {
      streak: nextStreak,
      points: gameProgress.points + dailyReward,
      lastCompletedDate: todayKey,
      lastReward: dailyReward,
      lastAttempts: attemptCount,
    };

    setGameProgress(nextProgress);
    setGameNotice(`Code trouvé en ${attemptCount} essai${attemptCount > 1 ? 's' : ''}. +${dailyReward} points.`);
    localStorage.setItem(userProgressStorageKey, JSON.stringify(nextProgress));
  };

  const submitGuess = () => {
    if (gameCompletedToday || logicSolved) {
      return;
    }

    const cleanGuess = guessInput.trim();
    if (!isValidGuess(cleanGuess)) {
      setGameNotice(`Entre ${CODE_LENGTH} chiffres différents (exemple: 573190).`);
      return;
    }

    if (attempts.length >= maxAttempts) {
      setGameNotice('Tu as utilisé tous tes essais pour aujourd\'hui.');
      return;
    }

    const guessDigits = cleanGuess.split('').map(Number);
    const feedback = evaluateCodeGuess(logicCode, guessDigits);
    const nextAttempts = [
      ...attempts,
      {
        guess: cleanGuess,
        exact: feedback.exact,
        misplaced: feedback.misplaced,
        statuses: feedback.statuses,
      },
    ];

    setAttempts(nextAttempts);
    setGuessInput('');

    if (feedback.exact === CODE_LENGTH) {
      setLogicSolved(true);
      rewardDailyGame(nextAttempts.length);
      return;
    }

    if (nextAttempts.length >= maxAttempts) {
      setLogicSolved(true);
      setGameNotice('Plus d\'essais disponibles pour aujourd\'hui. Nouveau défi demain.');
      return;
    }

    setGameNotice(`Indice: ${feedback.exact} bien placé(s), ${feedback.misplaced} mal placé(s).`);
  };

  const appendDigit = (digit) => {
    if (gameCompletedToday || logicSolved) {
      return;
    }

    setGuessInput(previous => {
      if (previous.length >= CODE_LENGTH || previous.includes(String(digit))) {
        return previous;
      }

      return `${previous}${digit}`;
    });
  };

  const popDigit = () => {
    if (gameCompletedToday || logicSolved) {
      return;
    }

    setGuessInput(previous => previous.slice(0, -1));
  };

  const quickLinks = [
    { href: '/events', icon: Calendar, label: 'Événements', color: 'from-purple-500 to-pink-500', desc: 'Soirées, conférences, sport...' },
    { href: '/campus', icon: MapPin, label: 'Campus', color: 'from-blue-500 to-cyan-500', desc: 'Plan interactif & ressources' },
    { href: '/forum', icon: MessageSquare, label: 'Forum', color: 'from-emerald-500 to-teal-500', desc: 'Discussions & entraide' },
    { href: '/testimonials', icon: Users, label: 'Témoignages', color: 'from-orange-500 to-amber-500', desc: 'Retours des anciens' },
    { href: '/polls', icon: BarChart3, label: 'Sondages', color: 'from-indigo-500 to-violet-500', desc: 'Votez et participez !' },
  ];

  const categoryColors = {
    soiree: 'bg-purple-100 text-purple-700',
    conference: 'bg-blue-100 text-blue-700',
    sport: 'bg-green-100 text-green-700',
    culture: 'bg-orange-100 text-orange-700',
    integration: 'bg-pink-100 text-pink-700',
    autre: 'bg-slate-100 text-slate-700',
  };

  const categoryLabels = {
    soiree: 'Soirée',
    conference: 'Conférence',
    sport: 'Sport',
    culture: 'Culture',
    integration: 'Intégration',
    autre: 'Autre',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-epsi-blue via-epsi-purple to-epsi-dark text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-epsi-accent rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-epsi-accent" />
              <span className="text-sm font-medium">Bienvenue sur EPSI Connect</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-slide-up">
              {user ? (
                <>Salut {user.first_name} ! 👋</>
              ) : (
                <>Votre aventure EPSI<br />commence ici</>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 animate-slide-up stagger-1">
              {user ? (
                "Découvrez les derniers événements, échangez avec la communauté et restez connecté avec l'EPSI."
              ) : (
                "Découvrez l'école, participez aux événements du BDE, échangez avec les anciens et intégrez la communauté EPSI."
              )}
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
                <Link href="/auth" className="btn-accent inline-flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Rejoindre la communauté
                </Link>
                <Link href="/campus" className="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20 inline-flex items-center justify-center gap-2">
                  Découvrir le campus
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { value: stats.users || '30+', label: 'Étudiants', icon: Users },
              { value: stats.events || '15+', label: 'Événements', icon: Calendar },
              { value: stats.testimonials || '10+', label: 'Témoignages', icon: Award },
              { value: stats.posts || '20+', label: 'Discussions', icon: MessageSquare },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`glass bg-white/10 rounded-2xl p-4 text-center animate-slide-up stagger-${index + 1}`}
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-epsi-accent" />
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 60L60 52.5C120 45 240 30 360 22.5C480 15 600 15 720 18.75C840 22.5 960 30 1080 33.75C1200 37.5 1320 37.5 1380 37.5L1440 37.5V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative overflow-hidden rounded-2xl p-6 bg-white shadow-lg card-hover animate-slide-up stagger-${index + 1}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                <link.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{link.label}</h3>
              <p className="text-xs text-slate-500 hidden md:block">{link.desc}</p>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Badges visibles */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-slate-900">Mes badges</h3>
            <span className="text-sm text-slate-500">{unlockedBadges.length}/{BADGES.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BADGES.map(badge => {
              const unlocked = unlockedBadges.some(item => item.id === badge.id);

              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-3 text-center transition-all ${
                    unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 opacity-70'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Image src={badge.image} alt={badge.title} width={42} height={42} className="object-contain" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{badge.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{unlocked ? 'Débloqué' : 'Verrouillé'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mini-jeu quotidien */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-6 md:p-8">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.55),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.45),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.35),transparent_28%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm mb-3">
                  <Target className="w-4 h-4 text-epsi-accent" />
                  Mini-jeu du jour
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">EPSI LogiCode</h2>
                <p className="text-white/75 mt-2 max-w-2xl">Trouve le code secret à {CODE_LENGTH} chiffres différents.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="font-semibold">{gameProgress.streak} jours</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 space-y-3">
                  <p className="text-sm text-white/70">Essais restants: {guessesRemaining}/{maxAttempts}</p>
                  <div className="flex gap-2">
                    <input
                      value={guessInput}
                      onChange={(event) => {
                        const nextValue = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
                        setGuessInput(nextValue);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          submitGuess();
                        }
                      }}
                      disabled={gameCompletedToday || logicSolved}
                      placeholder="Ex: 573190"
                      className="w-full rounded-xl px-4 py-3 text-lg tracking-[0.22em] text-center font-black bg-slate-950/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={submitGuess}
                      disabled={gameCompletedToday || logicSolved || attempts.length >= maxAttempts}
                      className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Tester
                    </button>
                  </div>
                  <p className="text-xs text-white/60">Règle: {CODE_LENGTH} chiffres, tous différents. Vert = bien placé, orange = présent mais mal placé.</p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-3">Pavé rapide</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                      <button
                        key={digit}
                        type="button"
                        disabled={gameCompletedToday || logicSolved}
                        onClick={() => appendDigit(digit)}
                        className="rounded-lg py-2 bg-white/15 hover:bg-white/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={popDigit}
                      disabled={gameCompletedToday || logicSolved}
                      className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Effacer
                    </button>
                    <button
                      type="button"
                      onClick={submitGuess}
                      disabled={gameCompletedToday || logicSolved || attempts.length >= maxAttempts}
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Valider l'essai
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-3">Historique des essais</p>
                  {attempts.length === 0 ? (
                    <p className="text-sm text-white/60">Aucun essai pour le moment.</p>
                  ) : (
                    <div className="space-y-2">
                      {attempts.map((attempt, index) => (
                        <div key={`${attempt.guess}-${index}`} className="rounded-xl bg-slate-950/40 border border-white/10 p-3 flex items-center justify-between">
                          <span className="flex flex-wrap gap-1.5">
                            {attempt.guess.split('').map((digit, digitIndex) => {
                              const status = attempt.statuses?.[digitIndex];
                              const statusClass = status === 'exact'
                                ? 'bg-emerald-500 text-white border-emerald-300'
                                : status === 'misplaced'
                                  ? 'bg-amber-400 text-slate-900 border-amber-200'
                                  : 'bg-slate-800 text-slate-200 border-slate-600';

                              return (
                                <span
                                  key={`${attempt.guess}-${digitIndex}`}
                                  className={`w-8 h-8 rounded-lg border text-sm font-black flex items-center justify-center ${statusClass}`}
                                >
                                  {digit}
                                </span>
                              );
                            })}
                          </span>
                          <span className="text-sm text-white/80">{attempt.exact} bien placés • {attempt.misplaced} mal placés</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-1">Points cumulés</p>
                  <p className="text-3xl font-bold">{gameProgress.points}</p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-1">Récompense jour</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-300" />
                    +{gameProgress.lastReward || 20} pts
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-1">Niveau</p>
                  <p className="text-lg font-semibold">{questTier}</p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-1">Dernière victoire</p>
                  <p className="text-lg font-semibold">
                    {typeof gameProgress.lastAttempts === 'number'
                      ? `${gameProgress.lastAttempts} essai${gameProgress.lastAttempts > 1 ? 's' : ''}`
                      : 'Aucune'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-white/70 mb-1">Code du jour</p>
                  <p className="text-lg font-semibold tracking-[0.2em]">
                    {gameCompletedToday || logicSolved ? formatCode(logicCode) : hiddenCodeDisplay}
                  </p>
                </div>
                {gameNotice && (
                  <div className="rounded-2xl bg-emerald-500/20 border border-emerald-300/20 p-4 text-emerald-100">
                    {gameNotice}
                  </div>
                )}
                {logicSolved && (
                  <div className="rounded-2xl bg-sky-500/20 border border-sky-300/30 p-3 text-sm text-sky-100">
                    Code trouvé: {formatCode(logicCode)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900">
                <Calendar className="inline w-6 h-6 mr-2 text-epsi-blue" />
                Prochains événements
              </h2>
              <Link href="/events" className="text-epsi-blue font-medium text-sm hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className={`event-card ${event.category} p-6 block animate-slide-up stagger-${index + 1}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-epsi-light flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-epsi-blue">
                            {new Date(event.date).getDate()}
                          </span>
                          <span className="text-xs text-epsi-blue uppercase">
                            {new Date(event.date).toLocaleString('fr-FR', { month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`badge ${categoryColors[event.category]}`}>
                            {categoryLabels[event.category]}
                          </span>
                          {event.participants_count >= event.max_participants && (
                            <span className="badge bg-red-100 text-red-700">Complet</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            {event.participants_count || 0}/{event.max_participants}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 hidden md:block" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucun événement à venir pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Poll */}
            {activePolls.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-epsi-purple" />
                  <h3 className="font-semibold text-slate-900">Sondage actif</h3>
                </div>
                <p className="text-slate-700 mb-4">{activePolls[0].question}</p>
                <Link href="/polls" className="btn-primary w-full text-center text-sm">
                  Voter maintenant
                </Link>
              </div>
            )}

            {/* Recent Forum Posts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg animate-slide-up stagger-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Forum
                </h3>
                <Link href="/forum" className="text-xs text-epsi-blue hover:underline">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-3">
                {recentPosts.length > 0 ? (
                  recentPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/forum/${post.id}`}
                      className="block p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <p className="font-medium text-slate-900 text-sm truncate">{post.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        par {post.author_name} • {post.likes} ❤️
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Aucun post récent
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action - Contact BDE */}
            {user && (
              <Link
                href="/contact"
                className="block bg-gradient-to-br from-epsi-accent to-emerald-400 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow animate-slide-up stagger-2"
              >
                <TrendingUp className="w-8 h-8 mb-3" />
                <h3 className="font-semibold mb-1">Contacter le BDE</h3>
                <p className="text-sm text-white/80">Une question ? Une suggestion ? On vous écoute !</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section (for non-logged users) */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-epsi-blue to-epsi-purple rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-epsi-accent rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Prêt à rejoindre l'aventure ?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Créez votre compte en quelques secondes et accédez à toutes les fonctionnalités de l'application.
              </p>
              <Link href="/auth" className="btn-accent inline-flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Créer mon compte
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}