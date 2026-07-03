'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  PartyPopper,
  Mic,
  Trophy,
  Palette,
  Heart,
  MoreHorizontal,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/toast';

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    end_date: '',
    location: '',
    category: 'integration',
    max_participants: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.user_type !== 'bde')) {
      // On laisse le rendu afficher l'état d'accès refusé.
    }
  }, [authLoading, user]);

  const categories = [
    { value: 'soiree', label: 'Soirée', icon: PartyPopper },
    { value: 'conference', label: 'Conférence', icon: Mic },
    { value: 'sport', label: 'Sport', icon: Trophy },
    { value: 'culture', label: 'Culture', icon: Palette },
    { value: 'integration', label: 'Intégration', icon: Heart },
    { value: 'autre', label: 'Autre', icon: MoreHorizontal },
  ];

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.info('Connectez-vous pour continuer');
      router.push('/auth');
      return;
    }

    if (user.user_type !== 'bde') {
      toast.error('Accès réservé aux membres du BDE');
      return;
    }

    if (!form.title.trim() || !form.date) {
      toast.error('Le titre et la date sont obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'événement');
      }

      toast.success('Événement créé avec succès');
      router.push(`/events/${data.event.id}`);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création de l\'événement');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user || user.user_type !== 'bde') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Accès réservé au BDE</h1>
          <p className="text-slate-600 mb-6">
            Seuls les membres du BDE peuvent créer de nouveaux événements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user && (
              <Link href="/auth" className="btn-primary inline-flex items-center justify-center gap-2">
                Se connecter
              </Link>
            )}
            <Link href="/events" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour aux événements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Link href="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour aux événements
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Créer un événement</h1>
          <p className="text-white/80">Publiez une nouvelle sortie, conférence ou activité pour la communauté.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Soirée d'intégration"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  placeholder="Décrivez l'événement, le programme, les infos utiles..."
                  className="input-field resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date de fin facultative</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ex: Campus EPSI, salle B12"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Participants max</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_participants}
                    onChange={(e) => handleChange('max_participants', e.target.value)}
                    placeholder="Ex: 80"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Catégorie</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(({ value, label, icon: Icon }) => {
                  const selected = form.category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('category', value)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                        selected
                          ? 'border-epsi-blue bg-epsi-blue/5 text-epsi-blue'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Publication</h2>
                  <p className="text-sm text-slate-500">Visible pour tous les membres</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Date formatée automatiquement
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Ajoutez un lieu clair pour les participants
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Limite optionnelle sur les inscriptions
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  La date de fin clôture automatiquement l'événement
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-accent w-full inline-flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? 'Création...' : 'Créer l\'événement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
