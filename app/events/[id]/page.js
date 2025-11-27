'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  Share2,
  Heart,
  CheckCircle,
  XCircle,
  User,
  PartyPopper,
  Mic,
  Trophy,
  Palette,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const params = user ? `?userId=${user.id}` : '';
      const response = await fetch(`/api/events/${id}${params}`);
      const data = await response.json();
      
      if (data.error) {
        toast.error('Événement non trouvé');
        router.push('/events');
        return;
      }
      
      setEvent(data.event);
      setParticipants(data.participants || []);
      setIsRegistered(data.isRegistered || false);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.info('Connectez-vous pour vous inscrire');
      router.push('/auth');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      toast.success('Inscription confirmée !');
      setIsRegistered(true);
      setEvent(prev => ({ ...prev, participants_count: data.participants_count }));
      fetchEvent(); // Refresh participants list
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`/api/events/${id}/register?userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      toast.success('Désinscription effectuée');
      setIsRegistered(false);
      setEvent(prev => ({ ...prev, participants_count: data.participants_count }));
      fetchEvent();
    } catch (error) {
      toast.error('Erreur lors de la désinscription');
    } finally {
      setRegistering(false);
    }
  };

  const categoryIcons = {
    soiree: PartyPopper,
    conference: Mic,
    sport: Trophy,
    culture: Palette,
    integration: Heart,
    autre: MoreHorizontal,
  };

  const categoryColors = {
    soiree: 'from-purple-500 to-pink-500',
    conference: 'from-blue-500 to-cyan-500',
    sport: 'from-green-500 to-emerald-500',
    culture: 'from-orange-500 to-amber-500',
    integration: 'from-pink-500 to-rose-500',
    autre: 'from-slate-500 to-slate-600',
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Événement non trouvé</h2>
          <Link href="/events" className="text-epsi-blue hover:underline">
            Retour aux événements
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(event.date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isPast = date < new Date();
  const isFull = event.participants_count >= event.max_participants;
  const CategoryIcon = categoryIcons[event.category] || categoryIcons.autre;
  const gradientColor = categoryColors[event.category] || categoryColors.autre;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientColor} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux événements
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <CategoryIcon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  {categoryLabels[event.category]}
                </span>
                {isPast && (
                  <span className="px-3 py-1 bg-black/20 rounded-full text-sm font-medium">
                    Événement passé
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {event.title}
              </h1>
              <p className="text-white/80">
                Organisé par {event.creator_name || 'le BDE'}
              </p>
            </div>

            {/* Date Card */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center min-w-[140px]">
              <div className="text-5xl font-bold">{date.getDate()}</div>
              <div className="text-lg uppercase">{date.toLocaleString('fr-FR', { month: 'short' })}</div>
              <div className="text-sm text-white/70">{date.getFullYear()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">À propos de l'événement</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-line">{event.description}</p>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Participants ({event.participants_count || 0}/{event.max_participants})
                </h2>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar mb-6">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((event.participants_count / event.max_participants) * 100, 100)}%`
                  }}
                />
              </div>

              {/* Participants List */}
              {participants.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {participants.slice(0, 12).map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"
                    >
                      <div className="avatar w-8 h-8 text-xs">
                        {participant.first_name?.[0]}{participant.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {participant.first_name} {participant.last_name?.[0]}.
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{participant.user_type}</p>
                      </div>
                    </div>
                  ))}
                  {participants.length > 12 && (
                    <div className="flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-500 text-sm">
                      +{participants.length - 12} autres
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">
                  Aucun participant pour le moment. Soyez le premier !
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Informations</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-epsi-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-500">Date</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-epsi-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {endDate && ` - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <p className="text-sm text-slate-500">Horaire</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-epsi-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{event.location}</p>
                    <p className="text-sm text-slate-500">Lieu</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-epsi-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {event.max_participants - (event.participants_count || 0)} places restantes
                    </p>
                    <p className="text-sm text-slate-500">Sur {event.max_participants} places</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {isPast ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-900 mb-2">Événement terminé</p>
                  <p className="text-sm text-slate-500">Cet événement a déjà eu lieu</p>
                </div>
              ) : isRegistered ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-medium text-slate-900 mb-2">Vous êtes inscrit !</p>
                  <p className="text-sm text-slate-500 mb-4">On vous attend avec impatience</p>
                  <button
                    onClick={handleUnregister}
                    disabled={registering}
                    className="w-full py-3 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {registering ? (
                      <div className="spinner w-5 h-5 border-2 border-red-200 border-t-red-500" />
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Se désinscrire
                      </>
                    )}
                  </button>
                </div>
              ) : isFull ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="font-medium text-slate-900 mb-2">Événement complet</p>
                  <p className="text-sm text-slate-500">Toutes les places sont prises</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {registering ? (
                      <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        S'inscrire à l'événement
                      </>
                    )}
                  </button>
                  {!user && (
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Vous devez être connecté pour vous inscrire
                    </p>
                  )}
                </>
              )}

              {/* Share Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Lien copié !');
                }}
                className="w-full mt-4 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Partager l'événement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}