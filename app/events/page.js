'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  ChevronRight,
  PartyPopper,
  Mic,
  Trophy,
  Palette,
  Heart,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showPast, setShowPast] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [category, showPast]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (!showPast) params.append('upcoming', 'true');
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: '', label: 'Tous', icon: Calendar },
    { value: 'soiree', label: 'Soirées', icon: PartyPopper },
    { value: 'conference', label: 'Conférences', icon: Mic },
    { value: 'sport', label: 'Sport', icon: Trophy },
    { value: 'culture', label: 'Culture', icon: Palette },
    { value: 'integration', label: 'Intégration', icon: Heart },
    { value: 'autre', label: 'Autre', icon: MoreHorizontal },
  ];

  const categoryColors = {
    soiree: 'bg-purple-500',
    conference: 'bg-blue-500',
    sport: 'bg-green-500',
    culture: 'bg-orange-500',
    integration: 'bg-pink-500',
    autre: 'bg-slate-500',
  };

  const categoryBadgeColors = {
    soiree: 'bg-purple-100 text-purple-700',
    conference: 'bg-blue-100 text-blue-700',
    sport: 'bg-green-100 text-green-700',
    culture: 'bg-orange-100 text-orange-700',
    integration: 'bg-pink-100 text-pink-700',
    autre: 'bg-slate-100 text-slate-700',
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Événements
              </h1>
              <p className="text-white/80">
                Soirées, conférences, sport... Ne manquez rien !
              </p>
            </div>
            {user?.user_type === 'bde' && (
              <Link
                href="/events/new"
                className="btn-accent inline-flex items-center gap-2 self-start"
              >
                <Plus className="w-5 h-5" />
                Créer un événement
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 -mt-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un événement..."
                className="input-field pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    category === value
                      ? 'bg-epsi-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Past Events */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="showPast"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-epsi-blue focus:ring-epsi-blue"
            />
            <label htmlFor="showPast" className="text-sm text-slate-600">
              Afficher les événements passés
            </label>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-slate-500">
              {search ? 'Essayez avec d\'autres termes de recherche' : 'Revenez bientôt pour de nouveaux événements !'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
              <div key={monthYear}>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 capitalize flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-epsi-blue" />
                  {monthYear}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthEvents.map((event, index) => {
                    const date = new Date(event.date);
                    const isPast = date < new Date();
                    const isFull = event.participants_count >= event.max_participants;
                    
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className={`group bg-white rounded-2xl shadow-lg overflow-hidden card-hover animate-slide-up`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Category Bar */}
                        <div className={`h-2 ${categoryColors[event.category] || categoryColors.autre}`} />
                        
                        <div className="p-6">
                          {/* Date Badge */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isPast ? 'bg-slate-100' : 'bg-epsi-light'}`}>
                                <span className={`text-2xl font-bold ${isPast ? 'text-slate-400' : 'text-epsi-blue'}`}>
                                  {date.getDate()}
                                </span>
                                <span className={`text-xs uppercase ${isPast ? 'text-slate-400' : 'text-epsi-blue'}`}>
                                  {date.toLocaleString('fr-FR', { month: 'short' })}
                                </span>
                              </div>
                              <div>
                                <span className={`badge text-xs ${categoryBadgeColors[event.category] || categoryBadgeColors.autre}`}>
                                  {categories.find(c => c.value === event.category)?.label || 'Autre'}
                                </span>
                                {isPast && (
                                  <span className="badge bg-slate-100 text-slate-500 text-xs ml-2">Passé</span>
                                )}
                                {isFull && !isPast && (
                                  <span className="badge bg-red-100 text-red-700 text-xs ml-2">Complet</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-epsi-blue transition-colors line-clamp-2">
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                            {event.description}
                          </p>

                          {/* Meta */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Users className="w-4 h-4" />
                              <span>
                                {event.participants_count || 0} / {event.max_participants} participants
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {event.max_participants && (
                            <div className="mt-4">
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${Math.min((event.participants_count / event.max_participants) * 100, 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* CTA */}
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-epsi-blue group-hover:underline">
                              Voir les détails
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-epsi-blue group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}