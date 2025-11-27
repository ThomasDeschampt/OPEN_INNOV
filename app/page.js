'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ events: 0, users: 0, testimonials: 0, posts: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activePolls, setActivePolls] = useState([]);

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
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
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