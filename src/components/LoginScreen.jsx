import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const ROLE_CREDENTIALS = {
  admin:      { password: 'admin2025',       label: 'Administrateur',  icon: '🏫', color: 'from-violet-600 to-purple-700' },
  teacher:    { password: 'prof2025',        label: 'Professeur',      icon: '👩‍🏫', color: 'from-blue-500 to-indigo-600' },
  student:    { password: 'eleve2025',       label: 'Élève',           icon: '🎒', color: 'from-emerald-500 to-teal-600' },
  parent:     { password: 'parent2025',      label: "Parent d'élève",  icon: '👨‍👩‍👧', color: 'from-orange-500 to-amber-600' },
  supervisor: { password: 'surveill2025',    label: 'Surveillant',     icon: '📋', color: 'from-cyan-500 to-sky-600' },
  security:   { password: 'securite2025',    label: 'Sécurité',        icon: '🔐', color: 'from-red-500 to-rose-600' },
  accountant: { password: 'comptable2025',   label: 'Comptable',       icon: '💰', color: 'from-yellow-500 to-amber-500' },
};

export { ROLE_CREDENTIALS };

export default function LoginScreen({ role, onSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const config = ROLE_CREDENTIALS[role.id];

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Veuillez entrer votre identifiant.'); return; }
    if (!password) { setError('Veuillez entrer votre mot de passe.'); return; }

    setLoading(true);
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 800));

    if (password === config.password) {
      onSuccess({ ...role, userName: username });
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors text-sm">
          ← Changer de rôle
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.color} p-8 text-center`}>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
              {config.icon}
            </div>
            <h2 className="text-2xl font-bold text-white">{config.label}</h2>
            <p className="text-white/70 text-sm mt-1">Connectez-vous à votre espace</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Identifiant
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Votre identifiant..."
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg'} bg-gradient-to-r ${config.color}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            {/* Hint box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold mb-1">🔑 Accès démo :</p>
              <p className="text-xs text-blue-500">Identifiant: <span className="font-mono font-bold">admin</span></p>
              <p className="text-xs text-blue-500">Mot de passe: <span className="font-mono font-bold">{config.password}</span></p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">© 2025 RENO · Système de gestion scolaire</p>
      </div>
    </div>
  );
}
