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
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState(null);
  const [userVotes, setUserVotes] = useState({});

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