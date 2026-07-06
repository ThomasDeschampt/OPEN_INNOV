'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';
import {
  Gamepad2,
  Target,
  Flame,
  Trophy,
  Crown,
  Gift,
  ArrowRight,
  Check,
  Delete,
  ListOrdered,
  Award,
} from 'lucide-react';

/* =====================================================
   Daily helpers — deterministic per local calendar day
   ===================================================== */
function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDailySeed(date = new Date()) {
  const yearStart = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - yearStart) / 86400000);
}

/* ---- Game 1: LogiCode (find the secret code) ---- */
const CODE_LENGTH = 6;

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
    if (digit === secretCode[index]) return 'exact';
    if (secretCode.includes(digit)) return 'misplaced';
    return 'absent';
  });
  const exact = guessCode.reduce((c, d, i) => (d === secretCode[i] ? c + 1 : c), 0);
  const shared = guessCode.reduce((c, d) => (secretCode.includes(d) ? c + 1 : c), 0);
  return { exact, misplaced: shared - exact, statuses };
}

function isValidCodeGuess(input) {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(input)) return false;
  return new Set(input.split('')).size === CODE_LENGTH;
}

/* ---- Game 2: Suite du jour (guess the next number) ---- */
function buildDailySequence(date = new Date()) {
  const seed = getDailySeed(date) * 7 + 3; // decorrelate from LogiCode
  const type = seed % 4;
  let terms = [];
  let rule = '';

  if (type === 0) {
    const start = 2 + (seed % 6);
    const step = 3 + (seed % 7);
    for (let i = 0; i < 6; i += 1) terms.push(start + i * step);
    rule = `on ajoute ${step} à chaque fois`;
  } else if (type === 1) {
    const start = 1 + (seed % 3);
    const ratio = 2 + (seed % 2);
    let v = start;
    for (let i = 0; i < 6; i += 1) {
      terms.push(v);
      v *= ratio;
    }
    rule = `on multiplie par ${ratio} à chaque fois`;
  } else if (type === 2) {
    const a = 1 + (seed % 4);
    const b = 2 + (seed % 5);
    terms = [a, b];
    for (let i = 2; i < 6; i += 1) terms.push(terms[i - 1] + terms[i - 2]);
    rule = 'chaque terme est la somme des deux précédents';
  } else {
    const start = 1 + (seed % 5);
    const d = 1 + (seed % 3);
    terms = [start];
    for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] + d * i);
    rule = `l'écart augmente de ${d} à chaque étape`;
  }

  return { shown: terms.slice(0, 5), answer: terms[5], rule };
}

const SEQ_MAX_ATTEMPTS = 4;

/* =====================================================
   Page
   ===================================================== */
const EMPTY_PROGRESS = { streak: 0, best_streak: 0, points: 0, games_played: 0, last_played_date: null };

export default function GamesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [todayGames, setTodayGames] = useState([]);
  const [rank, setRank] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const todayKey = getLocalDateKey();
  const dailyCode = useMemo(() => buildDailyLogicCode(new Date()), [todayKey]);
  const dailySequence = useMemo(() => buildDailySequence(new Date()), [todayKey]);

  const fetchLeaderboard = useCallback(() => {
    const suffix = user?.id ? `&userId=${user.id}` : '';
    fetch(`/api/games/leaderboard?limit=10${suffix}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!user?.id) {
      setProgress(EMPTY_PROGRESS);
      setTodayGames([]);
      setRank(null);
      return;
    }
    fetch(`/api/games?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.progress) setProgress(data.progress);
        setTodayGames(data.todayGames || []);
        setRank(data.rank ?? null);
      })
      .catch(() => {});
  }, [user]);

  const handleWin = useCallback(
    async (gameKey, score) => {
      if (todayGames.includes(gameKey)) return;

      if (!user?.id) {
        setTodayGames((prev) => [...prev, gameKey]);
        toast.info('Connecte-toi pour enregistrer ton score et grimper au classement.');
        return;
      }

      try {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, gameKey, score }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.progress) setProgress(data.progress);
        setTodayGames(data.todayGames || []);
        setRank(data.rank ?? null);

        if (data.rewarded) {
          toast.success(
            `+${data.reward} pts${data.streakIncreased ? ` · série de ${data.progress.streak} jours` : ''}`
          );
          fetchLeaderboard();
        }
      } catch {
        toast.error('Impossible d’enregistrer le score.');
      }
    },
    [user, todayGames, toast, fetchLeaderboard]
  );

  const gamesDoneToday = todayGames.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="eyebrow mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <Gamepad2 className="w-4 h-4 text-epsi-accent" />
                Jeux du jour
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Espace Jeux</h1>
              <p className="text-white/70 max-w-xl">
                Deux défis chaque jour. Reviens quotidiennement pour entretenir ta série et grimper au classement.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/6 border border-white/10 px-5 py-3 text-center">
                <div className="flex items-center gap-2 justify-center text-orange-300 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-3xl font-data font-semibold text-white">{progress.streak}</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-white/55">Jours de suite</p>
              </div>
              <div className="rounded-2xl bg-white/6 border border-white/10 px-5 py-3 text-center">
                <div className="text-3xl font-data font-semibold text-white mb-1">{gamesDoneToday}/2</div>
                <p className="text-xs uppercase tracking-wider text-white/55">Défis du jour</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
          {/* Games column */}
          <div className="space-y-6">
            <LogiCodeGame
              secret={dailyCode}
              solvedToday={todayGames.includes('logicode')}
              onWin={handleWin}
            />
            <SequenceGame
              puzzle={dailySequence}
              solvedToday={todayGames.includes('sequence')}
              onWin={handleWin}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StatsCard progress={progress} rank={rank} user={user} />
            <LeaderboardCard leaderboard={leaderboard} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   Personal stats
   ===================================================== */
function StatsCard({ progress, rank, user }) {
  const stats = [
    { label: 'Série actuelle', value: progress.streak, icon: Flame, tone: 'text-orange-500' },
    { label: 'Meilleure série', value: progress.best_streak, icon: Award, tone: 'text-epsi-blue' },
    { label: 'Points', value: progress.points, icon: Gift, tone: 'text-emerald-600' },
    { label: 'Parties jouées', value: progress.games_played, icon: Gamepad2, tone: 'text-slate-500' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="eyebrow">Ma progression</span>
          <h3 className="font-display font-bold text-slate-900 mt-1">Statistiques</h3>
        </div>
        {rank && (
          <div className="text-right">
            <div className="text-2xl font-data font-semibold text-slate-900">#{rank}</div>
            <p className="text-xs text-slate-500">au classement</p>
          </div>
        )}
      </div>

      {!user && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-slate-600">
          <Link href="/auth" className="text-epsi-blue font-medium hover:underline">
            Connecte-toi
          </Link>{' '}
          pour sauvegarder tes scores et apparaître au classement.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 p-3">
            <s.icon className={`w-4 h-4 mb-2 ${s.tone}`} />
            <div className="text-2xl font-data font-semibold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================
   Leaderboard
   ===================================================== */
const USER_TYPE_LABEL = { student: 'Étudiant', alumni: 'Alumni', bde: 'BDE' };

function LeaderboardCard({ leaderboard, user }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-display font-bold text-slate-900">Classement</h3>
        <span className="text-xs text-slate-500 ml-auto">Jours de suite</span>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Le classement se remplit…</p>
      ) : (
        <ol className="space-y-1.5">
          {leaderboard.map((entry, index) => {
            const isMe = user?.id === entry.id;
            const rankNum = index + 1;
            const medal =
              rankNum === 1
                ? 'bg-amber-100 text-amber-700'
                : rankNum === 2
                  ? 'bg-slate-200 text-slate-600'
                  : rankNum === 3
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-500';

            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl p-2 pr-3 ${
                  isMe ? 'bg-epsi-light ring-1 ring-epsi-blue/30' : ''
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-data font-semibold flex-shrink-0 ${medal}`}
                >
                  {rankNum === 1 ? <Crown className="w-4 h-4" /> : rankNum}
                </span>
                <div className="avatar avatar-sm">
                  {entry.first_name?.[0]}
                  {entry.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {entry.first_name} {entry.last_name}
                    {isMe && <span className="text-epsi-blue"> · toi</span>}
                  </p>
                  <p className="text-xs text-slate-500">{USER_TYPE_LABEL[entry.user_type] || ''}</p>
                </div>
                <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
                  <Flame className="w-4 h-4" />
                  <span className="font-data font-semibold text-slate-900">{entry.streak}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* =====================================================
   Game card shell
   ===================================================== */
function GameShell({ icon: Icon, accent, name, tagline, solvedToday, children, footer }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-500">{tagline}</p>
          </div>
        </div>
        {solvedToday && (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            Terminé
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
      {footer}
    </div>
  );
}

/* =====================================================
   Game 1 — LogiCode
   ===================================================== */
function LogiCodeGame({ secret, solvedToday, onWin }) {
  const MAX_ATTEMPTS = 6;
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [solved, setSolved] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setGuess('');
    setAttempts([]);
    setSolved(false);
    setNotice('');
  }, [secret]);

  const locked = solved || solvedToday || attempts.length >= MAX_ATTEMPTS;

  const appendDigit = (digit) => {
    if (locked) return;
    setGuess((prev) => (prev.length >= CODE_LENGTH || prev.includes(String(digit)) ? prev : `${prev}${digit}`));
  };

  const submit = () => {
    if (locked) return;
    if (!isValidCodeGuess(guess)) {
      setNotice(`Entre ${CODE_LENGTH} chiffres différents (ex : 573190).`);
      return;
    }
    const digits = guess.split('').map(Number);
    const feedback = evaluateCodeGuess(secret, digits);
    const next = [...attempts, { guess, ...feedback }];
    setAttempts(next);
    setGuess('');

    if (feedback.exact === CODE_LENGTH) {
      setSolved(true);
      setNotice('');
      const score = 12 + (MAX_ATTEMPTS - next.length) * 2;
      onWin('logicode', score);
      return;
    }
    if (next.length >= MAX_ATTEMPTS) {
      setNotice(`Perdu ! Le code était ${secret.join(' ')}.`);
      return;
    }
    setNotice(`${feedback.exact} bien placé(s), ${feedback.misplaced} mal placé(s).`);
  };

  const done = solved || solvedToday;

  return (
    <GameShell
      icon={Target}
      accent="bg-epsi-light text-epsi-blue"
      name="EPSI LogiCode"
      tagline={`Trouve le code secret à ${CODE_LENGTH} chiffres différents`}
      solvedToday={solvedToday}
    >
      {done ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
          <Check className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="font-medium text-slate-900">Défi validé pour aujourd’hui</p>
          <p className="text-sm text-slate-500 mt-1">Un nouveau code t’attend demain.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">
              Essais : <span className="font-data text-slate-900">{attempts.length}</span>/{MAX_ATTEMPTS}
            </p>
            <p className="text-xs text-slate-400">Vert = bien placé · Orange = mal placé</p>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ex : 573190"
              inputMode="numeric"
              className="input-field text-center tracking-[0.3em] font-data font-semibold text-lg"
            />
            <button type="button" onClick={submit} className="btn-primary px-5 whitespace-nowrap">
              Tester
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const used = guess.includes(String(d));
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => appendDigit(d)}
                  disabled={used}
                  className="rounded-lg py-2 font-data font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setGuess((prev) => prev.slice(0, -1))}
            className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <Delete className="w-4 h-4" /> Effacer
          </button>

          {notice && <p className="mt-3 text-sm font-medium text-slate-700">{notice}</p>}
        </>
      )}

      {attempts.length > 0 && (
        <div className="mt-4 space-y-2">
          {attempts.map((attempt, i) => (
            <div key={`${attempt.guess}-${i}`} className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {attempt.guess.split('').map((digit, di) => {
                  const status = attempt.statuses?.[di];
                  const cls =
                    status === 'exact'
                      ? 'bg-emerald-500 text-white'
                      : status === 'misplaced'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-slate-200 text-slate-500';
                  return (
                    <span
                      key={di}
                      className={`w-8 h-8 rounded-lg font-data font-bold flex items-center justify-center ${cls}`}
                    >
                      {digit}
                    </span>
                  );
                })}
              </div>
              <span className="text-xs text-slate-500 font-data">
                {attempt.exact}✓ · {attempt.misplaced}~
              </span>
            </div>
          ))}
        </div>
      )}
    </GameShell>
  );
}

/* =====================================================
   Game 2 — Suite du jour
   ===================================================== */
function SequenceGame({ puzzle, solvedToday, onWin }) {
  const [value, setValue] = useState('');
  const [tries, setTries] = useState([]);
  const [solved, setSolved] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setValue('');
    setTries([]);
    setSolved(false);
    setNotice('');
  }, [puzzle]);

  const failed = tries.length >= SEQ_MAX_ATTEMPTS && !solved;
  const locked = solved || solvedToday || failed;
  const done = solved || solvedToday;

  const submit = () => {
    if (locked) return;
    if (!/^-?\d+$/.test(value.trim())) {
      setNotice('Entre un nombre entier.');
      return;
    }
    const guess = parseInt(value.trim(), 10);
    const next = [...tries, guess];
    setTries(next);
    setValue('');

    if (guess === puzzle.answer) {
      setSolved(true);
      setNotice('');
      const score = 22 - (next.length - 1) * 4;
      onWin('sequence', score);
      return;
    }
    if (next.length >= SEQ_MAX_ATTEMPTS) {
      setNotice(`Perdu ! La réponse était ${puzzle.answer}.`);
      return;
    }
    setNotice(guess < puzzle.answer ? 'Plus grand ↑' : 'Plus petit ↓');
  };

  return (
    <GameShell
      icon={ListOrdered}
      accent="bg-violet-100 text-violet-600"
      name="Suite du jour"
      tagline="Devine le nombre qui complète la suite logique"
      solvedToday={solvedToday}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {puzzle.shown.map((term, i) => (
          <span
            key={i}
            className="min-w-[3rem] h-12 px-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-data font-semibold text-lg text-slate-900"
          >
            {term}
          </span>
        ))}
        <span className="text-slate-300 font-bold px-1">→</span>
        <span
          className={`min-w-[3rem] h-12 px-3 rounded-xl flex items-center justify-center font-data font-bold text-lg ${
            done ? 'bg-emerald-500 text-white' : 'bg-epsi-blue/10 text-epsi-blue border-2 border-dashed border-epsi-blue/40'
          }`}
        >
          {done ? puzzle.answer : '?'}
        </span>
      </div>

      {done ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <Check className="w-5 h-5" />
            {solvedToday && !solved ? 'Déjà résolu aujourd’hui' : 'Bien joué !'}
          </div>
          <p className="text-sm text-slate-600 mt-1">Règle : {puzzle.rule}.</p>
        </div>
      ) : failed ? (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="font-medium text-slate-900">La réponse était {puzzle.answer}.</p>
          <p className="text-sm text-slate-500 mt-1">Règle : {puzzle.rule}. Reviens demain !</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">
              Essais : <span className="font-data text-slate-900">{tries.length}</span>/{SEQ_MAX_ATTEMPTS}
            </p>
            {tries.length > 0 && (
              <div className="flex gap-1.5">
                {tries.map((t, i) => (
                  <span key={i} className="text-xs font-data px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ton nombre"
              inputMode="numeric"
              className="input-field font-data font-semibold text-lg"
            />
            <button type="button" onClick={submit} className="btn-primary px-5 whitespace-nowrap">
              Valider
            </button>
          </div>
          {notice && <p className="mt-3 text-sm font-medium text-slate-700">{notice}</p>}
        </>
      )}
    </GameShell>
  );
}
