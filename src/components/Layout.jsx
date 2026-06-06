import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Bell, ChevronRight, ChevronLeft } from 'lucide-react';

const ROLE_CONFIG = {
  admin:      { gradient: 'from-violet-700 to-purple-800', light: 'bg-violet-50', accent: '#7c3aed', label: 'Administrateur', icon: '🏫' },
  teacher:    { gradient: 'from-blue-600 to-indigo-700',   light: 'bg-blue-50',   accent: '#2563eb', label: 'Professeur',     icon: '👩‍🏫' },
  student:    { gradient: 'from-emerald-500 to-teal-600',  light: 'bg-emerald-50',accent: '#059669', label: 'Élève',          icon: '🎒' },
  parent:     { gradient: 'from-orange-500 to-amber-600',  light: 'bg-orange-50', accent: '#ea580c', label: "Parent d'élève", icon: '👨‍👩‍👧' },
  supervisor: { gradient: 'from-cyan-500 to-sky-600',      light: 'bg-cyan-50',   accent: '#0284c7', label: 'Surveillant',    icon: '📋' },
  security:   { gradient: 'from-red-600 to-rose-700',      light: 'bg-red-50',    accent: '#dc2626', label: 'Sécurité',       icon: '🔐' },
  accountant: { gradient: 'from-yellow-500 to-amber-600',  light: 'bg-yellow-50', accent: '#d97706', label: 'Comptable',      icon: '💰' },
};

export default function Layout({ role, menuItems, children, onLogout, userName, schoolName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState(menuItems[0]?.id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const activeItem = menuItems.find(m => m.id === activePage);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) { setCollapsed(true); setMobileOpen(false); }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Grouper les items du menu par catégorie si ils ont un groupe
  const groups = [];
  const ungrouped = [];
  menuItems.forEach(item => {
    if (item.group) {
      const existing = groups.find(g => g.label === item.group);
      if (existing) existing.items.push(item);
      else groups.push({ label: item.group, items: [item] });
    } else {
      ungrouped.push(item);
    }
  });
  const hasGroups = groups.length > 0;

  const sidebarW = collapsed ? 64 : 220;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo RENO */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/15 flex-shrink-0`}>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
          {cfg.icon}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">{schoolName || 'RENO'}</div>
            <div className="text-white/50 text-xs truncate">{cfg.label}</div>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-white/50 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/10"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {(hasGroups ? [...ungrouped.map(i => ({ ...i, _solo: true })), ...groups.flatMap(g => [{ _groupLabel: g.label }, ...g.items])] : menuItems).map((item, idx) => {
          if (item._groupLabel) {
            return collapsed ? (
              <div key={'sep-' + idx} className="border-t border-white/10 my-2 mx-2" />
            ) : (
              <div key={'grp-' + idx} className="px-3 pt-3 pb-1">
                <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">{item._groupLabel}</span>
              </div>
            );
          }
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActivePage(item.id); if (isMobile) setMobileOpen(false); }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative
                ${isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/65 hover:text-white hover:bg-white/10'
                }`}
            >
              <span className="text-base flex-shrink-0 leading-none">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium truncate flex-1">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 opacity-80" />
              )}
              {/* Tooltip quand collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Utilisateur + déconnexion */}
      <div className="flex-shrink-0 border-t border-white/15 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl mb-1">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {(userName || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{userName || 'Utilisateur'}</div>
              <div className="text-white/40 text-xs">Connecté</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Déconnexion' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all group relative"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Déconnexion
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar desktop ── */}
      {!isMobile && (
        <aside
          style={{ width: sidebarW }}
          className={`h-full flex-shrink-0 bg-gradient-to-b ${cfg.gradient} shadow-2xl transition-all duration-300 z-30 overflow-hidden`}
        >
          <SidebarContent />
        </aside>
      )}

      {/* ── Mobile: overlay + drawer ── */}
      {isMobile && mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b ${cfg.gradient} shadow-2xl z-50 transition-transform`}>
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Zone principale ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar compacte */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm z-20">
          {/* Burger mobile */}
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl">
              <Menu size={20} />
            </button>
          )}

          {/* Titre de la page courante */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none flex-shrink-0">{activeItem?.icon}</span>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-800 truncate leading-tight">{activeItem?.label}</h1>
              <p className="text-xs text-gray-400 hidden sm:block leading-tight">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {/* Breadcrumb optionnel */}
          <div className="flex-1" />

          {/* Actions header — slot enfant */}
          {children?.headerActions && (
            <div className="flex items-center gap-2">
              {children.headerActions}
            </div>
          )}
        </header>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            {menuItems.map((item) => (
              <div key={item.id} className={activePage === item.id ? 'block' : 'hidden'}>
                {item.component}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
