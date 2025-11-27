'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Heart,
  GraduationCap,
  Building,
  Quote,
  Calendar,
  X,
  Send,
  Award,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    title: '',
    content: '',
    graduation_year: new Date().getFullYear(),
    current_position: '',
    company: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/testimonials');
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Connectez-vous pour partager votre témoignage');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTestimonial, user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      toast.success('Témoignage publié !');
      setShowNewModal(false);
      setNewTestimonial({
        title: '',
        content: '',
        graduation_year: new Date().getFullYear(),
        current_position: '',
        company: '',
      });
      fetchTestimonials();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTestimonials = testimonials.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase()) ||
    t.company?.toLowerCase().includes(search.toLowerCase()) ||
    t.author_name?.toLowerCase().includes(search.toLowerCase())
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Témoignages
              </h1>
              <p className="text-white/80">
                Découvrez les parcours inspirants des anciens EPSI
              </p>
            </div>
            {user?.user_type === 'alumni' && (
              <button
                onClick={() => setShowNewModal(true)}
                className="btn-accent inline-flex items-center gap-2 self-start bg-white text-orange-600 hover:bg-orange-50"
              >
                <Plus className="w-5 h-5" />
                Partager mon témoignage
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 -mt-12 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, entreprise, contenu..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, value: testimonials.length, label: 'Témoignages', color: 'bg-orange-100 text-orange-600' },
            { icon: Building, value: new Set(testimonials.map(t => t.company).filter(Boolean)).size, label: 'Entreprises', color: 'bg-blue-100 text-blue-600' },
            { icon: Heart, value: testimonials.reduce((sum, t) => sum + (t.likes || 0), 0), label: 'Likes', color: 'bg-red-100 text-red-600' },
            { icon: Award, value: testimonials.filter(t => t.graduation_year >= currentYear - 3).length, label: 'Récents (3 ans)', color: 'bg-emerald-100 text-emerald-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-md">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun témoignage trouvé</h3>
            <p className="text-slate-500">
              {search ? 'Essayez avec d\'autres termes' : 'Soyez le premier à partager votre expérience !'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredTestimonials.map((testimonial, index) => {
              const isExpanded = expandedId === testimonial.id;
              const contentPreview = testimonial.content.length > 300 && !isExpanded
                ? testimonial.content.slice(0, 300) + '...'
                : testimonial.content;
              
              return (
                <div
                  key={testimonial.id}
                  className="testimonial-card relative animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Quote Icon */}
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-orange-200" />

                  {/* Author Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="avatar avatar-lg bg-gradient-to-br from-orange-400 to-amber-500 flex-shrink-0">
                      {testimonial.author_name?.split(' ').map(n => n[0]).join('') || 'A'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{testimonial.author_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Briefcase className="w-4 h-4" />
                        {testimonial.current_position}
                        {testimonial.company && (
                          <span className="text-slate-400">@ {testimonial.company}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <GraduationCap className="w-4 h-4" />
                        Promo {testimonial.graduation_year}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-lg text-slate-900 mb-3">
                    {testimonial.title}
                  </h4>

                  {/* Content */}
                  <div className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {contentPreview}
                    {testimonial.content.length > 300 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : testimonial.id)}
                        className="text-orange-600 font-medium ml-1 hover:underline"
                      >
                        {isExpanded ? 'Voir moins' : 'Lire la suite'}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Heart className={`w-5 h-5 ${testimonial.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                      <span className="text-sm font-medium">{testimonial.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(testimonial.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA for alumni */}
        {user?.user_type !== 'alumni' && !loading && (
          <div className="mt-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">Vous êtes ancien EPSI ?</h3>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Partagez votre parcours et inspirez les étudiants actuels. Votre témoignage peut faire la différence !
            </p>
            {user ? (
              <p className="text-white/70 text-sm">
                Seuls les anciens élèves peuvent publier des témoignages
              </p>
            ) : (
              <a href="/auth" className="btn-secondary bg-white text-orange-600 hover:bg-orange-50 inline-block">
                Se connecter en tant qu'ancien
              </a>
            )}
          </div>
        )}
      </div>

      {/* New Testimonial Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Partager mon témoignage</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Titre de votre témoignage
                </label>
                <input
                  type="text"
                  value={newTestimonial.title}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, title: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ex: Mon parcours de l'EPSI à Google"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Année de diplôme
                  </label>
                  <select
                    value={newTestimonial.graduation_year}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, graduation_year: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Entreprise actuelle
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.company}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Google, Capgemini..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Poste actuel
                </label>
                <input
                  type="text"
                  value={newTestimonial.current_position}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, current_position: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ex: Tech Lead, Data Engineer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Votre témoignage
                </label>
                <textarea
                  value={newTestimonial.content}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                  required
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Partagez votre parcours, vos conseils, ce que l'EPSI vous a apporté..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publier
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB for alumni */}
      {user?.user_type === 'alumni' && (
        <button
          onClick={() => setShowNewModal(true)}
          className="fab md:hidden bg-gradient-to-r from-orange-500 to-amber-500"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}