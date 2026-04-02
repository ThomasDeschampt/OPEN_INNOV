'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';
import {
  Mail,
  MessageSquare,
  Sparkles,
  Clock,
  Send,
  ShieldCheck,
  HelpCircle,
  Phone,
  Users,
  ArrowRight,
} from 'lucide-react';

const initialForm = {
  name: '',
  email: '',
  category: 'question',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(current => ({
      ...current,
      name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : current.name,
      email: user?.email || current.email,
    }));
  }, [user]);

  const contactTopics = useMemo(() => ([
    { id: 'question', label: 'Question', icon: HelpCircle, description: 'Information pratique ou demande générale.' },
    { id: 'suggestion', label: 'Suggestion', icon: Sparkles, description: 'Idée d’amélioration ou fonctionnalité à ajouter.' },
    { id: 'problem', label: 'Problème', icon: ShieldCheck, description: 'Bug, blocage ou comportement incohérent.' },
    { id: 'partnership', label: 'Partenariat', icon: Users, description: 'Contact externe ou opportunité de collaboration.' },
  ]), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          name: form.name,
          email: form.email,
          category: form.category,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’envoi');
      }

      toast.success('Message envoyé au BDE');
      setForm({
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
        email: user?.email || '',
        category: 'question',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast.error(error.message || 'Impossible d’envoyer le message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-epsi-blue via-epsi-purple to-epsi-dark text-white">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-16 left-16 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-epsi-accent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                <MessageSquare className="w-4 h-4 text-epsi-accent" />
                <span className="text-sm font-medium">Contact BDE</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
                Un point d’entrée unique pour parler au BDE.
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                Posez une question, signalez un problème, proposez une idée ou préparez un partenariat. Le formulaire alimente directement la messagerie interne du projet.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Réponse', value: '48h', icon: Clock },
                { label: 'Confidentiel', value: 'RGPD', icon: ShieldCheck },
                { label: 'Canaux', value: 'Email + app', icon: Mail },
                { label: 'Équipe', value: 'BDE / admin', icon: Users },
              ].map(card => (
                <div key={card.label} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
                  <card.icon className="w-5 h-5 text-epsi-accent mb-4" />
                  <p className="text-sm text-white/70">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-epsi-light flex items-center justify-center">
                <Send className="w-6 h-6 text-epsi-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">Envoyer un message</h2>
                <p className="text-slate-500">Le BDE reçoit votre demande avec le contexte utile pour répondre vite.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="prenom.nom@epsi.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  {contactTopics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sujet</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input-field"
                  placeholder="Résumez votre demande en quelques mots"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  rows={7}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Décrivez votre demande avec un maximum de contexte utile."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer au BDE'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link href="/profile#notifications" className="btn-secondary inline-flex items-center justify-center gap-2">
                  Voir mes notifications
                </Link>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Sujet rapide</h3>
              <div className="space-y-3">
                {contactTopics.map(topic => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: topic.id })}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${form.category === topic.id ? 'border-epsi-blue bg-epsi-light' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-epsi-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{topic.label}</p>
                          <p className="text-sm text-slate-500">{topic.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Canaux utiles</h3>
              <p className="text-white/70 text-sm mb-5">
                Pour les urgences ou les demandes formelles, ces points de contact complètent le formulaire.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-epsi-accent" />
                  </div>
                  <div>
                    <p className="font-medium">bde@epsi.fr</p>
                    <p className="text-sm text-white/60">Pour les demandes générales</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-epsi-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Accueil EPSI</p>
                    <p className="text-sm text-white/60">Relais administratif si besoin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}