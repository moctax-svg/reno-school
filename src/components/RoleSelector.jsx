import React from 'react';

const roles = [
  {
    id: 'admin',
    label: 'Administrateur',
    icon: '🏫',
    description: 'Gestion complète de l\'école',
    gradient: 'from-violet-600 to-purple-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  {
    id: 'teacher',
    label: 'Professeur',
    icon: '👩‍🏫',
    description: 'Classes, notes & présences',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    id: 'student',
    label: 'Élève',
    icon: '🎒',
    description: 'Notes, emploi du temps & activités',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    id: 'parent',
    label: 'Parent d\'élève',
    icon: '👨‍👩‍👧',
    description: 'Suivi de mon enfant',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  {
    id: 'supervisor',
    label: 'Surveillant',
    icon: '📋',
    description: 'Présences & discipline',
    gradient: 'from-cyan-500 to-sky-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: '🔐',
    description: 'Contrôle des accès & entrées/sorties',
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-700',
  },
  {
    id: 'accountant',
    label: 'Comptable',
    icon: '💰',
    description: 'Frais scolaires & finances',
    gradient: 'from-yellow-500 to-amber-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
];

export default function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mb-6 shadow-2xl">
          <span className="text-4xl">🏫</span>
        </div>
        <img src="https://media.base44.com/images/public/6a10490017772f69e69305fa/947a5a67a_generated_image.png" alt="RENO" className="w-24 h-24 rounded-3xl shadow-2xl object-contain mb-4 bg-white/10 p-2" />
        <h1 className="text-4xl font-bold text-white mb-3">RENO</h1>
        <p className="text-blue-200 text-lg">Système de gestion scolaire</p>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mx-auto mt-4"></div>
      </div>

      {/* Role selection prompt */}
      <div className="mb-8 text-center">
        <p className="text-white/80 text-xl font-medium">Quelle est votre fonction ?</p>
        <p className="text-blue-300 text-sm mt-1">Sélectionnez votre rôle pour accéder à votre espace</p>
      </div>

      {/* Role cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl w-full">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role)}
            className="role-card bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/20 group cursor-pointer"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${role.gradient} rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              <span className="text-2xl">{role.icon}</span>
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{role.label}</h3>
            <p className="text-blue-200 text-xs leading-tight">{role.description}</p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-12 text-blue-400 text-xs">
        © 2025 RENO · Gestion scolaire intelligente
      </p>
    </div>
  );
}
