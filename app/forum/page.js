'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Plus,
  Heart,
  MessageCircle,
  Clock,
  User,
  TrendingUp,
  HelpCircle,
  Briefcase,
  Home,
  Gamepad2,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/forum?${params}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Connectez-vous pour poster');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPost, user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      toast.success('Post créé avec succès !');
      setShowNewPostModal(false);
      setNewPost({ title: '', content: '', category: 'general' });
      fetchPosts();
    } catch (error) {
      toast.error('Erreur lors de la création du post');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: '', label: 'Tous', icon: MessageSquare, color: 'text-slate-500' },
    { value: 'general', label: 'Général', icon: TrendingUp, color: 'text-blue-500' },
    { value: 'aide', label: 'Aide', icon: HelpCircle, color: 'text-orange-500' },
    { value: 'emploi', label: 'Emploi', icon: Briefcase, color: 'text-green-500' },
    { value: 'logement', label: 'Logement', icon: Home, color: 'text-purple-500' },
    { value: 'loisirs', label: 'Loisirs', icon: Gamepad2, color: 'text-pink-500' },
  ];

  const categoryColors = {
    general: 'bg-blue-100 text-blue-700',
    aide: 'bg-orange-100 text-orange-700',
    emploi: 'bg-green-100 text-green-700',
    logement: 'bg-purple-100 text-purple-700',
    loisirs: 'bg-pink-100 text-pink-700',
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) ||
    post.content.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Forum
              </h1>
              <p className="text-white/80">
                Échangez, partagez, entraidez-vous !
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowNewPostModal(true)}
                className="btn-accent inline-flex items-center gap-2 self-start bg-white text-emerald-600 hover:bg-emerald-50"
              >
                <Plus className="w-5 h-5" />
                Nouveau post
              </button>
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
                placeholder="Rechercher une discussion..."
                className="input-field pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    category === value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${category === value ? 'text-white' : color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucune discussion trouvée</h3>
            <p className="text-slate-500 mb-6">
              {search ? 'Essayez avec d\'autres termes' : 'Soyez le premier à lancer une discussion !'}
            </p>
            {user && (
              <button
                onClick={() => setShowNewPostModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Créer un post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all animate-slide-up card-hover"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="avatar flex-shrink-0">
                    {post.author_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge text-xs ${categoryColors[post.category] || 'bg-slate-100 text-slate-600'}`}>
                        {categories.find(c => c.value === post.category)?.label || 'Général'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{post.author_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{formatDate(post.created_at)}</span>
                    </div>

                    <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-1 group-hover:text-emerald-600">
                      {post.title}
                    </h3>

                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {post.content}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewPostModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Nouveau post</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Catégorie
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="input-field"
                >
                  {categories.filter(c => c.value).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Titre
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                  className="input-field"
                  placeholder="De quoi voulez-vous parler ?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contenu
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  required
                  rows={5}
                  className="input-field resize-none"
                  placeholder="Décrivez votre sujet en détail..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
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
                      <MessageSquare className="w-5 h-5" />
                      Publier
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB for mobile */}
      {user && (
        <button
          onClick={() => setShowNewPostModal(true)}
          className="fab md:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}