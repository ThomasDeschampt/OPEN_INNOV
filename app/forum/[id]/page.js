'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Heart,
  ChevronLeft,
  Send,
  Clock,
  User,
  TrendingUp,
  HelpCircle,
  Briefcase,
  Home,
  Gamepad2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/toast';

export default function ForumPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/forum/${id}`);
      const data = await response.json();
      
      if (data.error) {
        toast.error('Post non trouvé');
        router.push('/forum');
        return;
      }
      
      setPost(data.post);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.info('Connectez-vous pour aimer ce post');
      return;
    }

    setLiking(true);
    try {
      const response = await fetch(`/api/forum/${id}`, { method: 'PATCH' });
      const data = await response.json();
      setPost(prev => ({ ...prev, likes: data.likes }));
    } catch (error) {
      toast.error('Erreur lors du like');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Connectez-vous pour commenter');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/forum/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: newComment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      toast.success('Commentaire ajouté !');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = {
    general: { label: 'Général', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
    aide: { label: 'Aide', icon: HelpCircle, color: 'bg-orange-100 text-orange-700' },
    emploi: { label: 'Emploi', icon: Briefcase, color: 'bg-green-100 text-green-700' },
    logement: { label: 'Logement', icon: Home, color: 'bg-purple-100 text-purple-700' },
    loisirs: { label: 'Loisirs', icon: Gamepad2, color: 'bg-pink-100 text-pink-700' },
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Post non trouvé</h2>
          <Link href="/forum" className="text-epsi-blue hover:underline">
            Retour au forum
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = categories[post.category] || categories.general;
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au forum
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className={`badge ${categoryInfo.color}`}>
              <CategoryIcon className="w-3 h-3 mr-1" />
              {categoryInfo.label}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-bold">
            {post.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 -mt-8 relative">
          {/* Author */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="avatar">
              {post.author_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{post.author_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  post.author_type === 'alumni' ? 'bg-purple-100 text-purple-700' :
                  post.author_type === 'bde' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {post.author_type === 'alumni' ? 'Ancien' :
                   post.author_type === 'bde' ? 'BDE' : 'Étudiant'}
                </span>
              </div>
              <span className="text-sm text-slate-500">{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none mb-6">
            <p className="text-slate-700 whitespace-pre-line">{post.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                liking ? 'opacity-50' : 'hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.likes > 0 ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
              <span className="font-medium text-slate-700">{post.likes || 0}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 text-slate-500">
              <MessageSquare className="w-5 h-5" />
              <span>{comments.length} commentaire{comments.length > 1 ? 's' : ''}</span>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Lien copié !');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
            >
              <Share2 className="w-5 h-5" />
              <span>Partager</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Commentaires ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex items-start gap-3">
                <div className="avatar flex-shrink-0">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                    className="input-field resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="btn-primary flex items-center gap-2 text-sm py-2"
                    >
                      {submitting ? (
                        <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-center">
              <p className="text-slate-600 mb-2">Connectez-vous pour participer à la discussion</p>
              <Link href="/auth" className="text-epsi-blue font-medium hover:underline">
                Se connecter
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="avatar w-8 h-8 text-xs flex-shrink-0">
                    {comment.author_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 text-sm">{comment.author_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        comment.author_type === 'alumni' ? 'bg-purple-100 text-purple-700' :
                        comment.author_type === 'bde' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {comment.author_type === 'alumni' ? 'Ancien' :
                         comment.author_type === 'bde' ? 'BDE' : 'Étudiant'}
                      </span>
                      <span className="text-xs text-slate-400">{formatRelativeDate(comment.created_at)}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun commentaire pour le moment</p>
              <p className="text-sm text-slate-400">Soyez le premier à réagir !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}