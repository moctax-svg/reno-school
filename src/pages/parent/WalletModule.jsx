/**
 * WalletModule.jsx — Portefeuille FAMILIAL RENO
 *
 * Concept : un seul portefeuille par famille (identifié par parent_phone).
 * Le parent recharge une fois, et peut payer pour N'IMPORTE QUEL enfant.
 *
 * - Vue consolidée : solde global famille + détail par enfant
 * - Recharge unique qui alimente le solde familial
 * - Paiement d'un frais = débit du portefeuille familial
 * - Côté comptable : remises multi-enfants d'une même famille
 */

import React, { useState, useEffect } from 'react';
import { Student, Fee, WalletTransaction, School } from '../../api/entities';
import {
  Wallet, TrendingUp, AlertTriangle, CheckCircle,
  Plus, Clock, ChevronRight, Users, Eye, EyeOff
} from 'lucide-react';

const fmt = n => (n || 0).toLocaleString('fr-FR') + ' FCFA';

const PAYMENT_METHODS = [
  { id: 'Orange Money', label: 'Orange Money',  icon: '🟠' },
  { id: 'Wave',         label: 'Wave',           icon: '🔵' },
  { id: 'Moov Money',  label: 'Moov Money',     icon: '🟢' },
  { id: 'Mobile Money', label: 'Mobile Money',  icon: '📱' },
  { id: 'Virement',    label: 'Virement bancaire', icon: '🏦' },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL — Portefeuille familial
══════════════════════════════════════════ */
export default function WalletModule({ child, allChildren }) {
  const [school, setSchool]           = useState(null);
  const [allFees, setAllFees]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('overview');
  const [hideBalance, setHideBalance] = useState(false);

  // Portefeuille familial = identifié par parent_phone du premier enfant
  const parentPhone = child?.parent_phone || '';
  const siblings    = allChildren || [child].filter(Boolean); // tous les enfants du parent

  // Solde global famille = somme des soldes de tous les enfants
  const familyBalance = siblings.reduce((s, c) => s + (c?.wallet_balance || 0), 0);
  const familyTotalCredited = siblings.reduce((s, c) => s + (c?.wallet_total_credited || 0), 0);

  useEffect(() => {
    School.list().then(sc => setSchool(sc[0] || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!siblings.length) return;
    setLoading(true);
    const ids = siblings.map(c => c.id);
    Promise.all([
      Fee.list(),
      WalletTransaction.list(),
    ]).then(([f, t]) => {
      setAllFees(f.filter(fee => ids.includes(fee.student_id)));
      setTransactions(
        t.filter(tx => ids.includes(tx.student_id))
         .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, [siblings.map(c => c?.id).join(',')]);

  function reload() {
    const ids = siblings.map(c => c.id);
    Promise.all([Fee.list(), WalletTransaction.list()]).then(([f, t]) => {
      setAllFees(f.filter(fee => ids.includes(fee.student_id)));
      setTransactions(t.filter(tx => ids.includes(tx.student_id)).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    }).catch(() => {});
  }

  // Prochaine échéance globale (tous enfants confondus)
  const unpaidInstallments = allFees
    .filter(f => f.fee_type === 'Scolarité' && f.status !== 'Paid' && f.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextInstallment = unpaidInstallments[0] || null;
  const daysLeft = nextInstallment ? daysUntil(nextInstallment.due_date) : null;
  const nextAmount = unpaidInstallments.slice(0, siblings.length).reduce((s, f) => s + ((f.amount_due || 0) - (f.amount_paid || 0)), 0);
  const isAlertMode = nextInstallment && daysLeft !== null && daysLeft <= 10 && familyBalance < nextAmount;

  const TABS = [
    { id: 'overview', label: 'Aperçu',      icon: '🏠' },
    { id: 'children', label: 'Mes enfants', icon: '👨‍👧‍👦' },
    { id: 'recharge', label: 'Recharger',   icon: '➕' },
    { id: 'history',  label: 'Historique',  icon: '📋' },
  ];

  return (
    <div className="space-y-4">

      {/* ── Carte portefeuille familial ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute right-8 bottom-0 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Portefeuille Familial</div>
              <div className="text-white font-bold text-base flex items-center gap-2">
                <Users size={16} className="opacity-70" />
                {siblings.length > 1
                  ? `${siblings.length} enfants — ${child?.parent_name || 'Famille'}`
                  : `${child?.first_name} ${child?.last_name}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHideBalance(h => !h)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all">
                {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <div className="bg-white/15 p-3 rounded-2xl"><Wallet size={22} /></div>
            </div>
          </div>

          {/* Solde */}
          <div className="mb-5">
            <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Solde disponible</div>
            <div className="text-4xl font-bold tracking-tight">
              {hideBalance ? '••••••' : fmt(familyBalance)}
            </div>
            {siblings.length > 1 && (
              <div className="text-white/50 text-xs mt-1">
                Solde partagé entre {siblings.length} enfants
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <div className="text-white/60 text-xs mb-0.5">Total rechargé</div>
              <div className="font-bold text-sm">{hideBalance ? '••••' : fmt(familyTotalCredited)}</div>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <div className="text-white/60 text-xs mb-0.5">Total dépensé</div>
              <div className="font-bold text-sm">{hideBalance ? '••••' : fmt(Math.max(0, familyTotalCredited - familyBalance))}</div>
            </div>
            <button onClick={() => setTab('recharge')}
              className="bg-white text-indigo-700 font-bold px-4 py-3 rounded-2xl text-sm hover:bg-white/90 transition-all flex items-center gap-2 shadow-sm flex-shrink-0">
              <Plus size={15} /> Recharger
            </button>
          </div>
        </div>
      </div>

      {/* ── Alertes ── */}
      {isAlertMode && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-red-800">⚠️ Solde insuffisant pour la prochaine échéance</div>
            <div className="text-sm text-red-700 mt-1">
              Une ou plusieurs tranches de scolarité sont dues dans <strong>{daysLeft} jour(s)</strong>.
              Il manque <strong>{fmt(nextAmount - familyBalance)}</strong> dans le portefeuille.
            </div>
            <button onClick={() => setTab('recharge')}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 inline-flex items-center gap-2">
              <Plus size={14} /> Recharger maintenant
            </button>
          </div>
        </div>
      )}

      {nextInstallment && daysLeft !== null && daysLeft <= 10 && !isAlertMode && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <Clock size={18} className="text-amber-500 flex-shrink-0" />
          Rappel : une tranche est due dans <strong className="mx-1">{daysLeft} jour(s)</strong>. Solde suffisant ✅
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              ${tab === t.id ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Contenu tabs ── */}
      {tab === 'overview' && (
        <OverviewTab
          siblings={siblings}
          allFees={allFees}
          familyBalance={familyBalance}
          transactions={transactions}
          onRecharge={() => setTab('recharge')}
          onChildren={() => setTab('children')}
        />
      )}
      {tab === 'children' && (
        <ChildrenDetailTab
          siblings={siblings}
          allFees={allFees}
          familyBalance={familyBalance}
        />
      )}
      {tab === 'recharge' && (
        <RechargeTab
          siblings={siblings}
          onSuccess={() => { reload(); setTab('overview'); }}
        />
      )}
      {tab === 'history' && (
        <HistoryTab transactions={transactions} siblings={siblings} />
      )}
    </div>
  );
}

/* ── APERÇU ── */
function OverviewTab({ siblings, allFees, familyBalance, transactions, onRecharge, onChildren }) {
  const totalDue  = allFees.reduce((s, f) => s + (f.amount_due || 0), 0);
  const totalPaid = allFees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalLeft = totalDue - totalPaid;
  const progress  = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

  const nextFees = allFees
    .filter(f => f.status !== 'Paid' && f.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Scolarité globale famille */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-800">🎓 Scolarité — famille complète</span>
          {siblings.length > 1 && (
            <button onClick={onChildren} className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline">
              Voir le détail <ChevronRight size={12} />
            </button>
          )}
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Payé : <strong className="text-green-600">{fmt(totalPaid)}</strong></span>
          <span>Reste : <strong className="text-red-500">{fmt(totalLeft)}</strong></span>
          <span>Total : <strong>{fmt(totalDue)}</strong></span>
        </div>
        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">{progress.toFixed(0)}% réglé</div>
      </div>

      {/* Prochaines échéances */}
      {nextFees.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-800">📆 Prochaines échéances</div>
          <div className="divide-y divide-gray-50">
            {nextFees.map((f, i) => {
              const left = (f.amount_due || 0) - (f.amount_paid || 0);
              const days = daysUntil(f.due_date);
              const child = siblings.find(s => s.id === f.student_id);
              const ok = familyBalance >= left;
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold
                    ${days !== null && days <= 5 ? 'bg-red-100 text-red-700' : days !== null && days <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    <span className="text-lg leading-none">{Math.max(0, days ?? 0)}</span>
                    <span className="text-xs">j.</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm">
                      {child ? `${child.first_name} ${child.last_name}` : '—'}
                      {f.installment_month ? ` — Tranche ${f.installment_month}` : ` — ${f.fee_type}`}
                    </div>
                    <div className="text-xs text-gray-400">Échéance : {f.due_date}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-800">{fmt(left)}</div>
                    <div className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-red-500'}`}>
                      {ok ? '✓ Couvert' : `−${fmt(left - familyBalance)}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Derniers mouvements */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-800">Derniers mouvements</div>
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 5).map((t, i) => {
              const child = siblings.find(s => s.id === t.student_id);
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {t.type === 'credit' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{t.label}</div>
                    <div className="text-xs text-gray-400">
                      {child ? `${child.first_name} · ` : ''}{t.date || t.created_date?.split('T')[0]}
                    </div>
                  </div>
                  <div className={`font-bold text-sm flex-shrink-0 ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '−'}{fmt(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DÉTAIL PAR ENFANT ── */
function ChildrenDetailTab({ siblings, allFees, familyBalance }) {
  return (
    <div className="space-y-4">
      {/* Explication portefeuille partagé */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800 flex items-start gap-3">
        <Wallet size={18} className="flex-shrink-0 mt-0.5 text-indigo-500" />
        <div>
          <div className="font-bold mb-0.5">Portefeuille unique partagé</div>
          Le solde de <strong>{fmt(familyBalance)}</strong> est disponible pour payer les frais de n'importe lequel de vos enfants.
          Chaque paiement est tracé par enfant pour transparence.
        </div>
      </div>

      {siblings.map(child => {
        const childFees = allFees.filter(f => f.student_id === child.id);
        const due  = childFees.reduce((s, f) => s + (f.amount_due || 0), 0);
        const paid = childFees.reduce((s, f) => s + (f.amount_paid || 0), 0);
        const left = due - paid;
        const scolarite = childFees.filter(f => f.fee_type === 'Scolarité');
        const nextFee = childFees
          .filter(f => f.status !== 'Paid' && f.due_date)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
        const days = nextFee ? daysUntil(nextFee.due_date) : null;
        const pct  = due > 0 ? Math.min(100, (paid / due) * 100) : 100;
        const isCovered = familyBalance >= (left || 0);

        return (
          <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header enfant */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {child.first_name?.[0]}{child.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{child.first_name} {child.last_name}</div>
                <div className="text-xs text-gray-500">Matricule : {child.registration_number || '—'}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${left === 0 ? 'text-green-600' : isCovered ? 'text-indigo-600' : 'text-red-500'}`}>
                  {left === 0 ? '✅ Tout réglé' : `Reste : ${fmt(left)}`}
                </div>
                {left > 0 && (
                  <div className={`text-xs ${isCovered ? 'text-green-500' : 'text-red-400'}`}>
                    {isCovered ? '✓ Couvert par le portefeuille' : `Manque : ${fmt(left - familyBalance)}`}
                  </div>
                )}
              </div>
            </div>

            {/* Corps */}
            <div className="p-5 space-y-4">
              {/* Barre progression */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Payé : <strong className="text-green-600">{fmt(paid)}</strong></span>
                  <span>Total : <strong>{fmt(due)}</strong></span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right text-xs text-gray-400 mt-1">{pct.toFixed(0)}%</div>
              </div>

              {/* Tranches scolarité */}
              {scolarite.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Plan de scolarité</div>
                  {scolarite.map((f, i) => {
                    const fl = (f.amount_due || 0) - (f.amount_paid || 0);
                    const d  = f.due_date ? daysUntil(f.due_date) : null;
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${f.status === 'Paid' ? 'bg-green-50' : d !== null && d <= 10 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <span className="text-base flex-shrink-0">
                          {f.status === 'Paid' ? '✅' : d !== null && d <= 5 ? '🔴' : d !== null && d <= 10 ? '🟡' : '📅'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700">
                            {f.installment_month ? `Tranche ${f.installment_month}` : 'Scolarité'} 
                            {f.due_date && <span className="text-xs text-gray-400 ml-2">· {f.due_date}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold ${f.status === 'Paid' ? 'text-green-600' : 'text-gray-800'}`}>{fmt(f.amount_due)}</div>
                          {fl > 0 && <div className="text-xs text-red-500">Reste : {fmt(fl)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Autres frais */}
              {childFees.filter(f => f.fee_type !== 'Scolarité').length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Autres frais</div>
                  {childFees.filter(f => f.fee_type !== 'Scolarité').map((f, i) => {
                    const fl = (f.amount_due || 0) - (f.amount_paid || 0);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2.5 bg-gray-50 rounded-xl">
                        <span className="text-gray-700">{f.fee_type}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${f.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.status}</span>
                          <span className="font-bold text-gray-800">{fmt(f.amount_due)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── RECHARGE ── */
function RechargeTab({ siblings, onSuccess }) {
  const [method, setMethod]   = useState(null);
  const [amount, setAmount]   = useState('');
  const [ref, setRef]         = useState('');
  const [targetChild, setTargetChild] = useState(siblings[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const QUICK = [5000, 10000, 25000, 50000, 100000];

  async function recharge() {
    setError('');
    if (!method)       { setError('Choisissez un mode de paiement.'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Montant invalide.'); return; }
    if (!ref.trim())   { setError('La référence de transaction est requise.'); return; }
    if (!targetChild)  { setError('Sélectionnez un enfant bénéficiaire de la recharge.'); return; }

    const child = siblings.find(s => s.id === targetChild);
    if (!child) return;

    setLoading(true);
    try {
      const newBalance       = (child.wallet_balance || 0) + amt;
      const newTotalCredited = (child.wallet_total_credited || 0) + amt;

      await WalletTransaction.create({
        student_id:     child.id,
        school_id:      child.school_id,
        type:           'credit',
        amount:         amt,
        balance_after:  newBalance,
        label:          `Recharge ${method}`,
        payment_method: method,
        reference:      ref.trim(),
        date:           new Date().toISOString().split('T')[0],
        done_by:        `${child.first_name} ${child.last_name} (parent)`,
      });

      await Student.update(child.id, {
        wallet_balance:       newBalance,
        wallet_total_credited: newTotalCredited,
      });

      setDone(true);
      setTimeout(onSuccess, 1800);
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  }

  if (done) return (
    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-green-100">
      <div className="text-6xl mb-4">✅</div>
      <div className="font-bold text-green-700 text-xl mb-2">Recharge enregistrée !</div>
      <div className="text-gray-500 text-sm">+{fmt(parseFloat(amount))} ajoutés au portefeuille familial</div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <TrendingUp size={18} className="text-indigo-500" /> Recharger le portefeuille
      </h3>

      {/* Info portefeuille familial */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
        <div className="font-bold mb-1">💡 Épargnez à votre rythme</div>
        Rechargez en petits montants quotidiens ou hebdomadaires. Le solde s'accumule
        et vous permet de couvrir les frais de tous vos enfants sans effort.
      </div>

      {/* Enfant bénéficiaire (si plusieurs) */}
      {siblings.length > 1 && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
            Enfant bénéficiaire de la recharge
          </label>
          <div className="grid grid-cols-2 gap-2">
            {siblings.map(s => (
              <button key={s.id} onClick={() => setTargetChild(s.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left
                  ${targetChild === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-bold truncate ${targetChild === s.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {s.first_name} {s.last_name}
                  </div>
                  <div className="text-xs text-gray-400">Solde : {fmt(s.wallet_balance || 0)}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            La recharge est attribuée à l'enfant sélectionné, mais peut servir à payer les frais de tous vos enfants.
          </p>
        </div>
      )}

      {/* Montants rapides */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Montant rapide</label>
        <div className="flex gap-2 flex-wrap">
          {QUICK.map(a => (
            <button key={a} onClick={() => setAmount(String(a))}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
                ${amount === String(a) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
              {fmt(a)}
            </button>
          ))}
        </div>
      </div>

      {/* Montant libre */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Ou montant personnalisé</label>
        <div className="relative">
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 15000"
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-16" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">FCFA</span>
        </div>
      </div>

      {/* Mode paiement */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Mode de paiement</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-medium transition-all
                ${method === m.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}>
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Référence */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Référence de la transaction *
          <span className="text-gray-400 font-normal ml-1">(fournie par votre opérateur)</span>
        </label>
        <input value={ref} onChange={e => setRef(e.target.value)}
          placeholder="Ex: TXN-ORANGE-20250601-84732"
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Récapitulatif */}
      {amount && method && targetChild && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-sm">
          <div className="font-bold text-gray-700 mb-1">Récapitulatif</div>
          <div className="flex justify-between">
            <span className="text-gray-500">Montant</span>
            <span className="font-bold text-indigo-700">+{fmt(parseFloat(amount) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mode</span>
            <span className="font-medium">{method}</span>
          </div>
          {(() => {
            const c = siblings.find(s => s.id === targetChild);
            return c ? (
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Nouveau solde ({c.first_name})</span>
                <span className="font-bold text-green-600">{fmt((c.wallet_balance || 0) + (parseFloat(amount) || 0))}</span>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <button onClick={recharge} disabled={loading || !amount || !method || !ref}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-2">
        {loading ? '⏳ Traitement...' : <><Plus size={20} /> Confirmer la recharge</>}
      </button>
    </div>
  );
}

/* ── HISTORIQUE ── */
function HistoryTab({ transactions, siblings }) {
  const [filter, setFilter] = useState('all'); // all | credit | debit

  const filtered = transactions.filter(t =>
    filter === 'all' ? true : t.type === filter
  );

  const grouped = {};
  filtered.forEach(t => {
    const month = (t.date || t.created_date || '').slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(t);
  });

  const MONTHS = { '01': 'Janv.', '02': 'Févr.', '03': 'Mars', '04': 'Avr.', '05': 'Mai', '06': 'Juin', '07': 'Juil.', '08': 'Août', '09': 'Sept.', '10': 'Oct.', '11': 'Nov.', '12': 'Déc.' };
  const monthLabel = k => { if (!k) return '—'; const [y, m] = k.split('-'); return `${MONTHS[m] || m} ${y}`; };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-2">
        {[['all', 'Tous'], ['credit', '↑ Recharges'], ['debit', '↓ Paiements']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${filter === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, txs]) => {
        const credited = txs.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
        const debited  = txs.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0);
        return (
          <div key={month} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="font-bold text-gray-700 text-sm">{monthLabel(month)}</span>
              <div className="flex items-center gap-3 text-xs">
                {credited > 0 && <span className="text-green-600 font-medium">+{fmt(credited)}</span>}
                {debited  > 0 && <span className="text-red-500 font-medium">−{fmt(debited)}</span>}
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {txs.map((t, i) => {
                const child = siblings.find(s => s.id === t.student_id);
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {t.type === 'credit' ? '↑' : '↓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{t.label}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                        {child && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{child.first_name}</span>}
                        <span>{t.date || t.created_date?.split('T')[0]}</span>
                        {t.payment_method && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{t.payment_method}</span>}
                        {t.reference && <span className="font-mono text-gray-400 truncate max-w-24">{t.reference}</span>}
                      </div>
                    </div>
                    <div className={`font-bold text-sm text-right flex-shrink-0 ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'credit' ? '+' : '−'}{fmt(t.amount)}
                      {t.balance_after !== undefined && (
                        <div className="text-xs text-gray-400 font-normal">Solde : {fmt(t.balance_after)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="text-4xl mb-2">📋</div>Aucun mouvement
        </div>
      )}
    </div>
  );
}
