/**
 * ParentNotifications.jsx — Notifications + Fil d'actualité + Signalement absence/retard
 *
 * Logique :
 * 🔴 NOTIFICATION DIRECTE (push, importante, action requise) :
 *    - Absence non justifiée détectée
 *    - Retard répété (3e de la semaine)
 *    - Note < seuil critique (configurable, défaut 8/20)
 *    - Devoir non rendu (1 seule fois le jour J)
 *    - Message prof priorité Important/Urgent
 *    - Paiement validé / rejeté
 *    - Solde insuffisant (1 fois/semaine max)
 *    - Convocation
 *
 * 📰 FIL D'ACTUALITÉ (consulté à la demande, pas de push) :
 *    - Nouveau devoir, module, bulletin
 *    - Nouvelle note normale
 *    - Événement scolaire
 *    - Livraison repas, transport
 *    - Programme semaine
 *
 * 📢 SIGNALEMENT PARENT → ÉCOLE :
 *    - Parent signale absence ou retard avant l'appel
 *    - Prof voit "⚡ Signalé par parent" dans sa feuille d'appel
 *    - Supprime la fausse alerte d'absence ce jour-là
 */

import React, { useState, useEffect } from 'react';
import { Notification, AbsenceReport, Student, Classroom } from '../../api/entities';
import {
  Bell, AlertTriangle, CheckCircle, Clock, MessageSquare,
  CreditCard, FileText, Calendar, ChevronRight, X, Send,
  RefreshCw, Newspaper, BellOff
} from 'lucide-react';

/* ── Catégories notification directe ── */
const DIRECT_TYPES = new Set([
  'Absence', 'Retard_Repete', 'Note_Critique', 'Devoir_NonRendu',
  'Message_Urgent', 'Paiement', 'Solde_Insuffisant', 'Convocation',
  'Message'
]);

/* ── Config affichage par type ── */
const TYPE_CONFIG = {
  Absence:          { icon:'❌', color:'bg-red-100 text-red-700 border-red-200',       label:'Absence',        direct:true  },
  Retard_Repete:    { icon:'⏰', color:'bg-amber-100 text-amber-700 border-amber-200', label:'Retard répété',  direct:true  },
  Note_Critique:    { icon:'📉', color:'bg-red-100 text-red-700 border-red-200',       label:'Note critique',  direct:true  },
  Devoir_NonRendu:  { icon:'📋', color:'bg-orange-100 text-orange-700 border-orange-200', label:'Devoir',      direct:true  },
  Message_Urgent:   { icon:'💬', color:'bg-red-100 text-red-700 border-red-200',       label:'Urgent',         direct:true  },
  Message:          { icon:'💬', color:'bg-indigo-100 text-indigo-700 border-indigo-200', label:'Message',     direct:true  },
  Paiement:         { icon:'💳', color:'bg-green-100 text-green-700 border-green-200', label:'Paiement',       direct:true  },
  Solde_Insuffisant:{ icon:'⚠️', color:'bg-amber-100 text-amber-700 border-amber-200', label:'Solde bas',      direct:true  },
  Convocation:      { icon:'📢', color:'bg-red-100 text-red-700 border-red-200',       label:'Convocation',    direct:true  },
  // Fil d'actualité
  Devoir:           { icon:'📚', color:'bg-violet-100 text-violet-700 border-violet-200', label:'Devoir',      direct:false },
  Module:           { icon:'📖', color:'bg-emerald-100 text-emerald-700 border-emerald-200', label:'Module',   direct:false },
  Note:             { icon:'📝', color:'bg-blue-100 text-blue-700 border-blue-200',    label:'Note',           direct:false },
  Bulletin:         { icon:'📄', color:'bg-gray-100 text-gray-700 border-gray-200',    label:'Bulletin',       direct:false },
  Evenement:        { icon:'🎉', color:'bg-pink-100 text-pink-700 border-pink-200',    label:'Événement',      direct:false },
  Rappel:           { icon:'⏰', color:'bg-amber-50 text-amber-600 border-amber-100',  label:'Rappel',         direct:false },
  Transport:        { icon:'🚌', color:'bg-teal-100 text-teal-700 border-teal-200',    label:'Transport',      direct:false },
  Repas:            { icon:'🍽️', color:'bg-orange-100 text-orange-700 border-orange-200', label:'Repas',       direct:false },
  default:          { icon:'🔔', color:'bg-gray-100 text-gray-600 border-gray-200',    label:'Info',           direct:false },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400)return `Il y a ${Math.floor(diff/3600)}h`;
  if (diff < 604800)return `Il y a ${Math.floor(diff/86400)}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function ParentNotificationsPage({ child }) {
  const [tab,           setTab]           = useState('direct');
  const [notifications, setNotifications] = useState([]);
  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showSignal,    setShowSignal]    = useState(false);

  useEffect(() => { if (child) load(); }, [child?.id]);

  async function load() {
    setLoading(true);
    try {
      const [notifs, reps] = await Promise.all([
        Notification.list(),
        AbsenceReport.filter({ student_id: child.id }),
      ]);
      const childNotifs = notifs
        .filter(n => n.student_id === child.id)
        .sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
      setNotifications(childNotifs);
      setReports(reps.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch {}
    setLoading(false);
  }

  async function markRead(n) {
    if (n.read_at) return;
    try {
      await Notification.update(n.id, { read_at: new Date().toISOString() });
      setNotifications(prev => prev.map(x => x.id===n.id ? {...x, read_at:new Date().toISOString()} : x));
    } catch {}
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read_at);
    try {
      await Promise.all(unread.map(n => Notification.update(n.id, { read_at: new Date().toISOString() })));
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch {}
  }

  if (!child) return (
    <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
      <Bell size={32} className="mx-auto mb-2 text-gray-300" />
      Sélectionnez un enfant
    </div>
  );

  const direct   = notifications.filter(n => DIRECT_TYPES.has(n.type));
  const actuality = notifications.filter(n => !DIRECT_TYPES.has(n.type));
  const unreadDirect = direct.filter(n => !n.read_at).length;

  const TABS = [
    { id:'direct',    label:`🔴 Alertes`,       badge: unreadDirect || null },
    { id:'actuality', label:`📰 Fil d'actualité` },
    { id:'signals',   label:`📢 Mes signalements`, badge: reports.filter(r=>r.status==='Pending').length || null },
  ];

  return (
    <div className="space-y-4">
      {/* Bouton signalement rapide — toujours visible */}
      <button onClick={() => setShowSignal(true)}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-md hover:shadow-lg transition-all active:scale-95">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div className="text-left flex-1">
          <div className="font-bold text-lg">Signaler une absence ou un retard</div>
          <div className="text-white/80 text-sm">Prévenez l'école avant l'appel · Le professeur sera informé</div>
        </div>
        <ChevronRight size={20} className="flex-shrink-0" />
      </button>

      {/* Onglets */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all relative ${tab===t.id?'bg-white shadow-sm text-orange-700':'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.badge ? (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── ALERTES DIRECTES ── */}
      {tab === 'direct' && (
        <div className="space-y-3">
          {unreadDirect > 0 && (
            <button onClick={markAllRead} className="w-full text-right text-xs text-orange-600 font-medium py-1 hover:underline">
              Tout marquer comme lu ({unreadDirect})
            </button>
          )}
          {loading ? <LoadingCard /> :
           direct.length === 0 ? (
            <EmptyCard icon={<BellOff size={32} className="text-gray-300" />} text="Aucune alerte" sub="Toutes les notifications importantes apparaîtront ici" />
           ) : direct.map(n => (
            <NotifCard key={n.id} n={n} onRead={() => markRead(n)} />
           ))}
        </div>
      )}

      {/* ── FIL D'ACTUALITÉ ── */}
      {tab === 'actuality' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-2 text-sm text-blue-700">
            <Newspaper size={16} className="flex-shrink-0" />
            <span>Ces informations sont disponibles ici — pas de notification push envoyée.</span>
          </div>
          {loading ? <LoadingCard /> :
           actuality.length === 0 ? (
            <EmptyCard icon={<Newspaper size={32} className="text-gray-300" />} text="Fil d'actualité vide" sub="Les nouveaux devoirs, notes, événements apparaîtront ici" />
           ) : actuality.map(n => (
            <NotifCard key={n.id} n={n} onRead={() => markRead(n)} compact />
           ))}
        </div>
      )}

      {/* ── MES SIGNALEMENTS ── */}
      {tab === 'signals' && (
        <SignalementsTab reports={reports} child={child} onNewSignal={() => setShowSignal(true)} onReload={load} />
      )}

      {/* Modal signalement */}
      {showSignal && (
        <SignalementModal child={child} onClose={() => setShowSignal(false)} onSaved={() => { setShowSignal(false); load(); }} />
      )}
    </div>
  );
}

/* ── Carte notification ── */
function NotifCard({ n, onRead, compact }) {
  const cfg = getConfig(n.type);
  return (
    <div onClick={onRead}
      className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md ${!n.read_at ? 'border-l-4 shadow-sm' : 'border-gray-100 opacity-80'} ${!n.read_at ? cfg.color.split(' ')[2] || 'border-orange-300' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${!n.read_at ? cfg.color.split(' ')[0] : 'bg-gray-100'}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              {!n.read_at && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>}
              <span className="text-xs text-gray-400 ml-auto">{timeAgo(n.sent_at || n.created_date)}</span>
            </div>
            <div className="font-semibold text-gray-800 text-sm mb-1">{n.title}</div>
            <p className={`text-xs text-gray-600 ${compact ? 'line-clamp-2' : 'whitespace-pre-line'}`}>{n.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Signalements ── */
function SignalementsTab({ reports, child, onNewSignal, onReload }) {
  const STATUS_CFG = {
    Pending:      { label:'En attente',   color:'bg-amber-100 text-amber-700',  icon:'⏳' },
    Acknowledged: { label:'Pris en charge', color:'bg-green-100 text-green-700', icon:'✅' },
    Closed:       { label:'Clôturé',      color:'bg-gray-100 text-gray-500',    icon:'🔒' },
  };

  return (
    <div className="space-y-3">
      <button onClick={onNewSignal}
        className="w-full border-2 border-dashed border-orange-200 rounded-2xl p-4 text-orange-600 font-medium text-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
        <AlertTriangle size={16} /> Nouveau signalement
      </button>

      {reports.length === 0 ? (
        <EmptyCard icon={<CheckCircle size={32} className="text-gray-300" />} text="Aucun signalement" sub="Vos signalements d'absence ou de retard apparaîtront ici" />
      ) : reports.map(r => {
        const cfg = STATUS_CFG[r.status] || STATUS_CFG.Pending;
        return (
          <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${r.report_type==='Absence'?'bg-red-100':'bg-amber-100'}`}>
                {r.report_type==='Absence' ? '❌' : '⏰'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${r.report_type==='Absence'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {r.report_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm">{r.reason}</div>
                {r.reason_detail && <p className="text-xs text-gray-500 mt-0.5">{r.reason_detail}</p>}
                {r.report_type==='Retard' && r.expected_return && (
                  <div className="text-xs text-amber-700 mt-1">⏰ Retour prévu : {r.expected_return}</div>
                )}
                {r.report_type==='Absence' && r.duration_days && (
                  <div className="text-xs text-red-600 mt-1">📅 Durée estimée : {r.duration_days} jour(s)</div>
                )}
                {r.status==='Acknowledged' && r.acknowledged_by && (
                  <div className="text-xs text-green-700 mt-1 bg-green-50 rounded-lg px-2 py-1">
                    ✅ Pris en charge par {r.acknowledged_by} · {r.acknowledged_at ? timeAgo(r.acknowledged_at) : ''}
                  </div>
                )}
                {r.notes && (
                  <div className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-2 py-1">💬 École : {r.notes}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Modal signalement ── */
function SignalementModal({ child, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    report_type: 'Absence',
    reason: '',
    reason_detail: '',
    date: today,
    expected_return: '',
    duration_days: 1,
  });
  const [saving, setSaving] = useState(false);

  const REASONS_ABSENCE = ['Maladie', 'Rendez-vous médical', 'Urgence familiale', 'Deuil', 'Voyage', 'Autre'];
  const REASONS_RETARD  = ['Problème de transport', 'Rendez-vous médical', 'Urgence familiale', 'Retard de réveil', 'Autre'];
  const reasons = form.report_type === 'Absence' ? REASONS_ABSENCE : REASONS_RETARD;

  async function send() {
    if (!form.reason) { alert('Veuillez indiquer le motif.'); return; }
    setSaving(true);
    try {
      // Créer le signalement
      await AbsenceReport.create({
        student_id:    child.id,
        classroom_id:  child.classroom_id,
        parent_name:   child.parent_name,
        parent_phone:  child.parent_phone,
        report_type:   form.report_type,
        reason:        form.reason,
        reason_detail: form.reason_detail,
        date:          form.date,
        expected_return: form.expected_return,
        duration_days:   parseInt(form.duration_days)||1,
        status:          'Pending',
        notified_teacher: true,
        notified_admin:   true,
      });

      // Notifier le prof / admin (notification interne)
      const msg = form.report_type === 'Absence'
        ? `⚡ Signalement parent — ${child.first_name} ${child.last_name} sera absent(e) le ${form.date}.\nMotif : ${form.reason}${form.reason_detail ? ` (${form.reason_detail})` : ''}.\nDurée estimée : ${form.duration_days} jour(s).`
        : `⚡ Signalement parent — ${child.first_name} ${child.last_name} sera en retard le ${form.date}.\nMotif : ${form.reason}${form.reason_detail ? ` (${form.reason_detail})` : ''}.\nRetour prévu : ${form.expected_return || 'non précisé'}.`;

      // Notification vers l'école (admin/prof) — stockée avec student_id pour que l'admin/prof la voie
      await Notification.create({
        student_id:   child.id,
        parent_name:  child.parent_name,
        parent_phone: child.parent_phone,
        type:         form.report_type === 'Absence' ? 'Absence_Signalee' : 'Retard_Signale',
        title:        `⚡ ${form.report_type} signalée — ${child.first_name} ${child.last_name}`,
        message:      msg,
        channel:      'Internal',
        status:       'Sent',
        sent_at:      new Date().toISOString(),
      });

      onSaved();
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  const isToday = form.date === today;
  const isTomorrow = form.date === new Date(Date.now()+86400000).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl">
        {/* Header */}
        <div className={`p-5 rounded-t-3xl ${form.report_type==='Absence'?'bg-gradient-to-r from-red-500 to-red-600':'bg-gradient-to-r from-amber-500 to-orange-600'} text-white`}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-xl flex items-center gap-2">
              {form.report_type==='Absence' ? '❌' : '⏰'} Signalement {form.report_type}
            </div>
            <button onClick={onClose} className="p-1.5 bg-white/20 rounded-xl hover:bg-white/30">
              <X size={18} />
            </button>
          </div>
          <div className="text-white/80 text-sm">
            Pour : <strong>{child.first_name} {child.last_name}</strong> · Le professeur sera informé automatiquement
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            {['Absence','Retard'].map(t => (
              <button key={t} onClick={() => setForm({...form, report_type:t, reason:''})}
                className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${form.report_type===t
                  ? (t==='Absence'?'border-red-500 bg-red-50 text-red-700':'border-amber-500 bg-amber-50 text-amber-700')
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t==='Absence' ? '❌ Absence' : '⏰ Retard'}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setForm({...form, date:today})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.date===today?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 text-gray-500'}`}>
                Aujourd'hui
              </button>
              <button onClick={() => setForm({...form, date:new Date(Date.now()+86400000).toISOString().split('T')[0]})}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isTomorrow?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 text-gray-500'}`}>
                Demain
              </button>
            </div>
            <input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>

          {/* Motif */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Motif *</label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button key={r} onClick={() => setForm({...form, reason:r})}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 text-left transition-all ${form.reason===r
                    ? (form.report_type==='Absence'?'border-red-400 bg-red-50 text-red-700':'border-amber-400 bg-amber-50 text-amber-700')
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Précision */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Précision (optionnel)</label>
            <input value={form.reason_detail} onChange={e => setForm({...form, reason_detail:e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
              placeholder="Ex: Fièvre 38.5°, rendez-vous à 9h..." />
          </div>

          {/* Durée / Retour */}
          {form.report_type === 'Absence' ? (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Durée estimée</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm({...form, duration_days:n})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.duration_days===n?'border-red-400 bg-red-50 text-red-700':'border-gray-200 text-gray-500'}`}>
                    {n}j
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Heure de retour prévue</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {['08:30','09:00','09:30','10:00','10:30'].map(h => (
                  <button key={h} onClick={() => setForm({...form, expected_return:h})}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.expected_return===h?'border-amber-400 bg-amber-50 text-amber-700':'border-gray-200 text-gray-500'}`}>
                    {h}
                  </button>
                ))}
              </div>
              <input type="time" value={form.expected_return} onChange={e => setForm({...form, expected_return:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          )}

          {/* Récap */}
          {form.reason && (
            <div className={`rounded-2xl p-4 text-sm ${form.report_type==='Absence'?'bg-red-50 border border-red-200':'bg-amber-50 border border-amber-200'}`}>
              <div className="font-bold mb-1 text-gray-800">📋 Récapitulatif</div>
              <div className="text-gray-700 space-y-0.5">
                <div>👤 <strong>{child.first_name} {child.last_name}</strong></div>
                <div>{form.report_type==='Absence'?'❌':'⏰'} <strong>{form.report_type}</strong> le {form.date}</div>
                <div>📌 Motif : {form.reason}{form.reason_detail ? ` — ${form.reason_detail}` : ''}</div>
                {form.report_type==='Absence' && <div>📅 Durée : {form.duration_days} jour(s)</div>}
                {form.report_type==='Retard' && form.expected_return && <div>⏰ Retour : {form.expected_return}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 pt-0">
          <button onClick={send} disabled={saving || !form.reason}
            className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
              form.report_type==='Absence'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-40'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-40'
            }`}>
            {saving
              ? <><RefreshCw size={18} className="animate-spin" /> Envoi en cours...</>
              : <><Send size={18} /> Envoyer le signalement à l'école</>
            }
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">
            Le professeur et l'administration seront notifiés immédiatement
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers UI ── */
function LoadingCard() {
  return <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">⏳ Chargement...</div>;
}
function EmptyCard({ icon, text, sub }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="font-medium text-gray-600">{text}</div>
      {sub && <div className="text-sm text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
