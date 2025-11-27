'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import {
  Home,
  Calendar,
  MapPin,
  MessageSquare,
  Users,
  BarChart3,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Mail,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Check for dark mode preference
    const isDark = localStorage.getItem('epsi_dark_mode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Fetch notification count
    if (user) {
      fetch(`/api/notifications?userId=${user.id}&unreadOnly=true`)
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            setNotificationCount(data.notifications.length);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('epsi_dark_mode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };

  const navItems = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/events', icon: Calendar, label: 'Événements' },
    { href: '/campus', icon: MapPin, label: 'Campus' },
    { href: '/forum', icon: MessageSquare, label: 'Forum' },
    { href: '/testimonials', icon: Users, label: 'Témoignages' },
    { href: '/polls', icon: BarChart3, label: 'Sondages' },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Don't show nav on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 glass shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-epsi-blue to-epsi-purple flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-display font-bold text-xl gradient-text">EPSI Connect</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(href)
                      ? 'bg-epsi-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {user ? (
                <>
                  {/* Notifications */}
                  <Link
                    href="/profile#notifications"
                    className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    {notificationCount > 0 && (
                      <span className="pulse-dot">{notificationCount}</span>
                    )}
                  </Link>

                  {/* Contact */}
                  <Link
                    href="/contact"
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </Link>

                  {/* User Menu */}
                  <div className="relative group">
                    <Link href="/profile" className="flex items-center gap-2">
                      <div className="avatar">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                    </Link>
                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 min-w-[180px]">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg mt-1"
                        >
                          <User className="w-4 h-4" />
                          Mon profil
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link href="/auth" className="btn-primary text-sm">
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 glass shadow-lg px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-epsi-blue to-epsi-purple flex items-center justify-center">
            <span className="text-white font-bold">E</span>
          </div>
          <span className="font-display font-bold gradient-text">EPSI</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {user ? (
            <Link href="/profile" className="relative">
              <div className="avatar w-8 h-8 text-sm">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              {notificationCount > 0 && <span className="pulse-dot" />}
            </Link>
          ) : (
            <Link href="/auth" className="text-sm font-medium text-epsi-blue">
              Connexion
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden mobile-nav">
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              isActive(href)
                ? 'text-epsi-blue'
                : 'text-slate-400'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(href) ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}