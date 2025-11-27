'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/toast';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  Award,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'student',
    bio: '',
  });

  const router = useRouter();
  const { login, register } = useAuth();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        toast.success(isLogin ? 'Connexion réussie !' : 'Compte créé avec succès !');
        router.push('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    { value: 'student', label: 'Étudiant', icon: GraduationCap, desc: 'Actuellement à l\'EPSI' },
    { value: 'alumni', label: 'Ancien élève', icon: Award, desc: 'Diplômé de l\'EPSI' },
    { value: 'bde', label: 'Membre BDE', icon: Users, desc: 'Bureau des étudiants' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8">
            <ChevronLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-epsi-blue to-epsi-purple flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {isLogin ? 'Connexion' : 'Créer un compte'}
              </h1>
              <p className="text-slate-500 text-sm">
                {isLogin ? 'Ravi de vous revoir !' : 'Rejoignez la communauté EPSI'}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Vous êtes...
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {userTypes.map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, user_type: value })}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.user_type === value
                            ? 'border-epsi-blue bg-epsi-light'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${
                          formData.user_type === value ? 'text-epsi-blue' : 'text-slate-400'
                        }`} />
                        <span className={`text-xs font-medium ${
                          formData.user_type === value ? 'text-epsi-blue' : 'text-slate-600'
                        }`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Prénom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="input-field pl-10"
                        placeholder="Marie"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required={!isLogin}
                      className="input-field"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                  placeholder="votre@email.fr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Bio (optionnel)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Présentez-vous en quelques mots..."
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {isLogin ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Comptes de démonstration
            </p>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Étudiant :</span>
                <code className="bg-white px-2 py-0.5 rounded">etudiant@epsi.fr</code>
              </div>
              <div className="flex justify-between">
                <span>Ancien :</span>
                <code className="bg-white px-2 py-0.5 rounded">ancien@epsi.fr</code>
              </div>
              <div className="flex justify-between">
                <span>BDE :</span>
                <code className="bg-white px-2 py-0.5 rounded">bde@epsi.fr</code>
              </div>
              <p className="text-slate-400 pt-1">Mot de passe : password123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-epsi-blue via-epsi-purple to-epsi-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-epsi-accent rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex flex-col justify-center items-center text-white text-center p-12">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <GraduationCap className="w-10 h-10" />
          </div>
          
          <h2 className="text-3xl font-display font-bold mb-4">
            Bienvenue dans la<br />communauté EPSI
          </h2>
          
          <p className="text-white/70 max-w-sm mb-8">
            Connectez-vous pour accéder aux événements, échanger avec les anciens et profiter de toutes les ressources de l'école.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
              { value: '30+', label: 'Étudiants actifs' },
              { value: '15+', label: 'Événements' },
              { value: '10+', label: 'Témoignages' },
              { value: '24/7', label: 'Accès ressources' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}