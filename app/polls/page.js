'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle,
  Clock,
  Users,
  ChevronRight,
  Vote,
  TrendingUp,
  Calendar,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    expiresAt: '',
  });

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchPolls();
  }, [user]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/polls');
      const data = await response.json();
      const pollsData = data.polls || [];
      
      // Fetch user votes for each poll if logged in
      if (user) {
        const votes = {};
        for (const poll of pollsData) {
          const pollResponse = await fetch(`/api/polls/${poll.id}?userId=${user.id}`);
          const pollData = await pollResponse.json();
          if (pollData.poll?.user_vote) {
            votes[poll.id] = pollData.poll.user_vote;
          }
        }
        setUserVotes(votes);
      }
      
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    if (!user) {
      toast.info('Connectez-vous pour voter');
      return;
    }

    if (userVotes[pollId]) {
      toast.info('Vous avez déjà voté');
      return;
    }

    setVotingPollId(pollId);
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, optionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        // Si l'utilisateur a déjà voté, rafraîchir les données pour afficher les résultats
        if (response.status === 409) {
          await fetchPolls();
        }
        return;
      }

      toast.success('Vote enregistré !');
      setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
      
      // Update poll options
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: data.options,
            total_votes: data.total_votes,
          };
        }
        return poll;
      }));
    } catch (error) {
      toast.error('Erreur lors du vote');
    } finally {
      setVotingPollId(null);
    }
  };

  const handleCreatePoll = async (event) => {
    event.preventDefault();

    if (!user || user.user_type !== 'bde') {
      toast.error('Accès réservé aux membres du BDE');
      return;
    }

    const options = newPoll.options.map(option => option.trim()).filter(Boolean);

    if (!newPoll.question.trim()) {
      toast.error('La question est requise');
      return;
    }

    if (options.length < 2) {
      toast.error('Ajoutez au moins deux options');
      return;
    }

    setCreatingPoll(true);
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newPoll.question,
          options,
          expiresAt: newPoll.expiresAt || null,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du sondage');
      }

      setPolls(prev => [data.poll, ...prev]);
      setNewPoll({ question: '', options: ['', ''], expiresAt: '' });
      setShowCreateForm(false);
      toast.success('Sondage créé avec succès');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création du sondage');
    } finally {
      setCreatingPoll(false);
    }
  };

  const updateOption = (index, value) => {
    setNewPoll(prev => {
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      return { ...prev, options: nextOptions };
    });
  };

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const removeOption = (index) => {
    setNewPoll(prev => {
      if (prev.options.length <= 2) {
        return prev;
      }

      return {
        ...prev,
        options: prev.options.filter((_, optionIndex) => optionIndex !== index),
      };
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatExpiryDate = (expiresAt) => {
    if (!expiresAt) return 'Sans limite';
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return 'Expiré';
    if (diff < 86400000) return `Expire dans ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Expire dans ${Math.floor(diff / 86400000)}j`;
    return `Expire le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Sondages
          </h1>
          <p className="text-white/80">
            Donnez votre avis et participez aux décisions du BDE !
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {user?.user_type === 'bde' && (
          <div className="mb-8 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white/70 text-sm uppercase tracking-[0.2em]">Espace BDE</p>
                <h2 className="text-2xl font-semibold mt-1">Créer un nouveau sondage</h2>
                <p className="text-white/80 mt-2">Publiez rapidement un vote pour consulter les étudiants.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white text-indigo-700 px-4 py-2 font-medium shadow-md hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {showCreateForm ? 'Fermer' : 'Nouveau sondage'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreatePoll} className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Ex: Quelle date préférez-vous pour la prochaine soirée ?"
                    className="w-full rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-medium">Options</label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-sm font-medium text-white/90 hover:text-white underline underline-offset-4"
                    >
                      Ajouter une option
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-white/60"
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Supprimer l'option"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date d'expiration facultative</label>
                  <input
                    type="datetime-local"
                    value={newPoll.expiresAt}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="rounded-xl border border-white/20 bg-white/95 text-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-white/60"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-full px-4 py-2 font-medium bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingPoll}
                    className="rounded-full px-5 py-2 font-semibold bg-white text-indigo-700 hover:bg-white/90 disabled:opacity-70 transition-colors"
                  >
                    {creatingPoll ? 'Création...' : 'Créer le sondage'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun sondage actif</h3>
            <p className="text-slate-500">
              Revenez bientôt pour participer aux prochains sondages !
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll, index) => {
              const hasVoted = !!userVotes[poll.id];
              const expired = isExpired(poll.expires_at);
              const showResults = hasVoted || expired;
              
              return (
                <div
                  key={poll.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Poll Header */}
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                          <Vote className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 mb-1">
                            {poll.question}
                          </h2>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {poll.total_votes || 0} votes
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatExpiryDate(poll.expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {hasVoted && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                          Voté
                        </span>
                      )}
                      {expired && !hasVoted && (
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          Terminé
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Poll Options */}
                  <div className="p-6 space-y-3">
                    {poll.options?.map(option => {
                      const isSelected = userVotes[poll.id] === option.id;
                      const percentage = option.percentage || 0;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => !showResults && handleVote(poll.id, option.id)}
                          disabled={showResults || votingPollId === poll.id}
                          className={`poll-option w-full text-left ${
                            isSelected ? 'selected border-indigo-500 bg-indigo-50' : ''
                          } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {/* Progress Bar Background */}
                          {showResults && (
                            <div
                              className="poll-bar bg-indigo-100"
                              style={{ transform: `scaleX(${percentage / 100})` }}
                            />
                          )}
                          
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {showResults ? (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-indigo-500' : 'bg-slate-200'
                                }`}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                              )}
                              <span className={`font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {option.option_text}
                              </span>
                            </div>
                            
                            {showResults && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">{option.votes} votes</span>
                                <span className={`font-semibold ${
                                  isSelected ? 'text-indigo-600' : 'text-slate-700'
                                }`}>
                                  {percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Voting Indicator */}
                  {votingPollId === poll.id && (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-center gap-2 text-indigo-600">
                        <div className="spinner w-4 h-4 border-2 border-indigo-200 border-t-indigo-600" />
                        <span className="text-sm">Enregistrement du vote...</span>
                      </div>
                    </div>
                  )}

                  {/* Not logged in message */}
                  {!user && !expired && (
                    <div className="px-6 pb-6">
                      <p className="text-sm text-slate-500 text-center">
                        <a href="/auth" className="text-indigo-600 hover:underline">Connectez-vous</a> pour voter
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {polls.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{polls.length}</div>
              <div className="text-sm text-slate-500">Sondages actifs</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {polls.reduce((sum, p) => sum + (p.total_votes || 0), 0)}
              </div>
              <div className="text-sm text-slate-500">Votes totaux</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {Object.keys(userVotes).length}
              </div>
              <div className="text-sm text-slate-500">Vos participations</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}