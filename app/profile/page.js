'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Calendar,
  Bell,
  LogOut,
  Edit,
  Check,
  X,
  GraduationCap,
  Award,
  Users,
  Clock,
  ChevronRight,
  Settings,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch notifications
      const notifResponse = await fetch(`/api/notifications?userId=${user.id}`);
      const notifData = await notifResponse.json();
      setNotifications(notifData.notifications || []);

      // Fetch registered events
      const eventsResponse = await fetch('/api/events?upcoming=true');
      const eventsData = await eventsResponse.json();
      
      // Filter events where user is registered
      const registered = [];
      for (const event of eventsData.events || []) {
        const eventResponse = await fetch(`/api/events/${event.id}?userId=${user.id}`);
        const eventData = await eventResponse.json();
        if (eventData.isRegistered) {
          registered.push(event);
        }
      }
      setRegisteredEvents(registered);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    router.push('/');
  };

  const handleSaveProfile = () => {
    updateUser(editData);
    setEditing(false);
    toast.success('Profil mis à jour');
  };

  const markNotificationRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => 
        n.id === notifId ? { ...n, is_read: 1 } : n
      ));
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  const userTypeLabels = {
    student: { label: 'Étudiant', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
    alumni: { label: 'Ancien élève', icon: Award, color: 'bg-purple-100 text-purple-700' },
    bde: { label: 'Membre BDE', icon: Users, color: 'bg-orange-100 text-orange-700' },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const typeInfo = userTypeLabels[user.user_type] || userTypeLabels.student;
  const TypeIcon = typeInfo.icon;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'events', label: 'Mes événements' },
    { id: 'notifications', label: 'Notifications', badge: notifications.filter(n => !n.is_read).length },
    { id: 'settings', label: 'Paramètres' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-epsi-blue to-epsi-purple text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="avatar avatar-lg w-24 h-24 text-3xl bg-white/20 backdrop-blur">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-display font-bold mb-2">
                {user.first_name} {user.last_name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className={`badge ${typeInfo.color}`}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {typeInfo.label}
                </span>
                <span className="text-white/70 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-epsi-blue text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
                    <button
                      onClick={() => {
                        setEditing(!editing);
                        setEditData({ bio: user.bio || '' });
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {editing ? <X className="w-5 h-5 text-slate-400" /> : <Edit className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center">
                        <User className="w-5 h-5 text-epsi-blue" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Nom complet</p>
                        <p className="font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center">
                        <Mail className="w-5 h-5 text-epsi-blue" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium text-slate-900">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-epsi-light flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-epsi-blue" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Membre depuis</p>
                        <p className="font-medium text-slate-900">
                          {new Date(user.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-2">Bio</p>
                      {editing ? (
                        <div>
                          <textarea
                            value={editData.bio}
                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                            rows={3}
                            className="input-field resize-none mb-3"
                            placeholder="Présentez-vous en quelques mots..."
                          />
                          <button
                            onClick={handleSaveProfile}
                            className="btn-primary text-sm py-2 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Enregistrer
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-700">{user.bio || 'Aucune bio renseignée'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Statistiques</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-epsi-light rounded-xl">
                        <div className="text-3xl font-bold text-epsi-blue">{registeredEvents.length}</div>
                        <div className="text-sm text-slate-500">Événements inscrits</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-xl">
                        <div className="text-3xl font-bold text-purple-600">{notifications.length}</div>
                        <div className="text-sm text-slate-500">Notifications</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions rapides</h2>
                    <div className="space-y-2">
                      <Link
                        href="/events"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-700">Découvrir les événements</span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </Link>
                      <Link
                        href="/forum"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-700">Accéder au forum</span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </Link>
                      <Link
                        href="/contact"
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-700">Contacter le BDE</span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Mes événements à venir</h2>
                
                {registeredEvents.length > 0 ? (
                  <div className="space-y-4">
                    {registeredEvents.map(event => {
                      const date = new Date(event.date);
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="w-14 h-14 rounded-xl bg-epsi-light flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-epsi-blue">{date.getDate()}</span>
                            <span className="text-xs text-epsi-blue uppercase">
                              {date.toLocaleString('fr-FR', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 truncate">{event.title}</h3>
                            <p className="text-sm text-slate-500">{event.location}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Vous n'êtes inscrit à aucun événement</p>
                    <Link href="/events" className="text-epsi-blue font-medium hover:underline mt-2 inline-block">
                      Découvrir les événements
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Notifications</h2>
                
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`notification-item ${!notif.is_read ? 'unread bg-epsi-light/50' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'event' ? 'bg-purple-100 text-purple-600' :
                          notif.type === 'forum' ? 'bg-emerald-100 text-emerald-600' :
                          notif.type === 'poll' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-500 truncate">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aucune notification</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Paramètres du compte
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">Notifications par email</p>
                        <p className="text-sm text-slate-500">Recevoir les rappels d'événements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-epsi-blue"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-red-600 mb-4">Zone de danger</h2>
                  <p className="text-sm text-slate-500 mb-4">
                    Ces actions sont irréversibles. Procédez avec prudence.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}