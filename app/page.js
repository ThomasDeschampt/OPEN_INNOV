'use client';

import { useState, useEffect } from 'react';
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
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Clock,
  UserCheck,
  Target,
  Flame,
  Gift,
  Lock,
} from 'lucide-react';

const BADGES = [
  {
    id: 'starter',
    title: 'Starter EPSI',
    image: '/icon/debuttant.png',
    minPoints: 10,
    requirement: '10 points',
    ring: ['#b45309', '#f59e0b'],
  },
  {
    id: 'explorer',
    title: 'Explorateur',
    image: '/icon/explorateur.png',
    minPoints: 35,
    requirement: '35 points',
    ring: ['#0e7490', '#22d3ee'],
  },
  {
    id: 'community',
    title: 'Ambassadeur',
    image: '/icon/moyen.png',
    minPoints: 80,
    requirement: '80 points',
    ring: ['#1e40af', '#60a5fa'],
  },
  {
    id: 'streak',
    title: 'Flamme continue',
    image: '/icon/avance.png',
    minStreak: 3,
    requirement: '3 jours de suite',
    ring: ['#c2410c', '#fb923c'],
  },
  {
    id: 'legend',
    title: 'Légende du campus',
    image: '/icon/expert.png',
    minPoints: 150,
    requirement: '150 points',
    ring: ['#a16207', '#facc15'],
  },
];

const BASE_GAME_PROGRESS = { streak: 0, points: 0 };

export default function HomePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ events: 0, users: 0, testimonials: 0, posts: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [gameProgress, setGameProgress] = useState(BASE_GAME_PROGRESS);

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

  // Progression des jeux (serveur) — pilote les badges et la tuile "jeu du jour".
  useEffect(() => {
    if (!user?.id) {
      setGameProgress(BASE_GAME_PROGRESS);
      return;
    }
    fetch(`/api/games?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.progress) {
          setGameProgress({
            streak: data.progress.streak || 0,
            points: data.progress.points || 0,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const quickLinks = [
    { href: '/events', icon: Calendar, label: 'Événements', desc: 'Soirées, conférences, sport...' },
    { href: '/campus', icon: MapPin, label: 'Campus', desc: 'Plan interactif & ressources' },
    { href: '/forum', icon: MessageSquare, label: 'Forum', desc: 'Discussions & entraide' },
    { href: '/testimonials', icon: Users, label: 'Témoignages', desc: 'Retours des anciens' },
    { href: '/polls', icon: BarChart3, label: 'Sondages', desc: 'Votez et participez !' },
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
      <section className="page-hero">
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="eyebrow justify-center mb-6 animate-fade-in" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="w-6 h-px bg-white/40" />
              EPSI Connect · Communauté étudiante
              <span className="w-6 h-px bg-white/40" />
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-slide-up">
              {user ? (
                <>Salut {user.first_name} !</>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16 max-w-4xl mx-auto">
            {[
              { value: stats.users, label: 'Étudiants', icon: Users },
              { value: stats.events, label: 'Événements', icon: Calendar },
              { value: stats.testimonials, label: 'Témoignages', icon: Award },
              { value: stats.posts, label: 'Discussions', icon: MessageSquare },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`rounded-xl p-4 text-left bg-white/6 border border-white/10 animate-slide-up stagger-${index + 1}`}
              >
                <stat.icon className="w-5 h-5 mb-3 text-epsi-accent" />
                <div className="text-3xl font-data font-semibold tracking-tight">{stat.value ?? '—'}</div>
                <div className="text-xs uppercase tracking-wider text-white/55 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 py-12 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-200 shadow-md card-hover animate-slide-up stagger-${index + 1}`}
            >
              <div className="w-11 h-11 rounded-xl bg-epsi-light text-epsi-blue flex items-center justify-center mb-4 transition-colors group-hover:bg-epsi-blue group-hover:text-white">
                <link.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{link.label}</h3>
              <p className="text-xs text-slate-600 hidden md:block">{link.desc}</p>
              <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-300 group-hover:text-epsi-blue group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Badges visibles */}
      <section className="max-w-7xl mx-auto px-4 py-2">
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="eyebrow">Progression</span>
              <h3 className="text-xl font-display font-bold text-slate-900 mt-1">Mes badges</h3>
            </div>
            <span className="text-sm text-slate-600">
              <span className="font-data font-semibold text-slate-900">{unlockedBadges.length}</span>
              <span className="text-slate-400"> / {BADGES.length}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BADGES.map(badge => {
              const unlocked = unlockedBadges.some(item => item.id === badge.id);

              return (
                <div
                  key={badge.id}
                  className={`badge-tile ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                  style={{ '--badge-a': badge.ring[0], '--badge-b': badge.ring[1] }}
                >
                  <div className="badge-medallion">
                    <Image src={badge.image} alt={badge.title} width={34} height={34} />
                    {!unlocked && (
                      <span className="badge-lock">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{badge.title}</p>
                    <p className="text-xs mt-1 text-slate-500">
                      {unlocked ? (
                        <span className="text-emerald-600 font-medium">Débloqué</span>
                      ) : (
                        badge.requirement
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jeu du jour — accès à l'espace Jeux */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/jeux" className="group block page-hero rounded-3xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="eyebrow mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <Target className="w-4 h-4 text-epsi-accent" />
                Jeu du jour
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold">Relève le défi quotidien</h2>
              <p className="text-white/70 mt-2 max-w-xl">
                Deux mini-jeux chaque jour — LogiCode et la Suite du jour. Garde ta série et grimpe au classement.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-epsi-accent px-5 py-2.5 font-semibold text-white transition group-hover:gap-3">
                Jouer maintenant
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="rounded-2xl bg-white/6 border border-white/10 px-5 py-4 text-center min-w-[110px]">
                <div className="flex items-center gap-1.5 justify-center text-orange-300 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-3xl font-data font-semibold text-white">{gameProgress.streak}</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-white/55">Jours de suite</p>
              </div>
              <div className="rounded-2xl bg-white/6 border border-white/10 px-5 py-4 text-center min-w-[110px]">
                <div className="flex items-center gap-1.5 justify-center text-emerald-300 mb-1">
                  <Gift className="w-4 h-4" />
                  <span className="text-3xl font-data font-semibold text-white">{gameProgress.points}</span>
                </div>
                <p className="text-xs uppercase tracking-wider text-white/55">Points</p>
              </div>
            </div>
          </div>
        </Link>
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
          <div className="page-hero rounded-3xl p-8 md:p-12 text-center">
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