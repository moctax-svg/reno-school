/**
 * FamilyDiscounts.jsx — Module Remises RENO
 *
 * 4 catégories de remises :
 * 1. 👨‍👧‍👦 Remise fratrie      — famille avec 2+ enfants inscrits
 * 2. 👧  Remise fille          — encourager la scolarisation des filles
 * 3. 👨‍🏫 Remise enseignant     — parent est prof dans l'école
 * 4. 🎁  Remise spéciale       — bourse, difficulté financière, geste commercial…
 *
 * Accordée par : admin OU comptable
 * Tracée dans l'entité Discount + mise à jour du Fee correspondant
 */

import React, { useState, useEffect } from 'react';
import { Student, Fee, School, Teacher, Discount } from '../../api/entities';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';
import {
  Users, Tag, Percent, DollarSign, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Printer,
  Search, Filter, Clock, Star
} from 'lucide-react';

const fmt = n => (n || 0).toLocaleString('fr-FR') + ' FCFA';

/* ── Catégories de remises ── */
const DISCOUNT_CATEGORIES = [
  {
    id:       'Remise fratrie',
    label:    'Remise fratrie',
    icon:     '👨‍👧‍👦',
    color:    'violet',
    bg:       'bg-violet-50',
    border:   'border-violet-200',
    text:     'text-violet-700',
    badge:    'bg-violet-100 text-violet-700',
    desc:     'Famille avec 2 enfants ou plus inscrits dans l\'école',
    check:    (student, students) => {
      const phone = student.parent_phone || student.parent_email;
      if (!phone) return false;
      return students.filter(s => (s.parent_phone || s.parent_email) === phone && s.id !== student.id).length >= 1;
    },
  },
  {
    id:       'Remise fille',
    label:    'Remise fille',
    icon:     '👧',
    color:    'pink',
    bg:       'bg-pink-50',
    border:   'border-pink-200',
    text:     'text-pink-700',
    badge:    'bg-pink-100 text-pink-700',
    desc:     'Encourager la scolarisation des filles',
    check:    (student) => student.gender === 'Féminin',
  },
  {
    id:       'Remise enseignant',
    label:    'Remise enseignant',
    icon:     '👨‍🏫',
    color:    'blue',
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    text:     'text-blue-700',
    badge:    'bg-blue-100 text-blue-700',
    desc:     'Parent est enseignant dans l\'établissement',
    check:    (student, students, teachers) => {
      if (!teachers?.length) return false;
      const phone = student.parent_phone;
      const email = student.parent_email;
      return teachers.some(t =>
        (phone && t.phone === phone) ||
        (email && t.email === email) ||
        student.parent_name?.toLowerCase() === `${t.first_name} ${t.last_name}`.toLowerCase()
      );
    },
  },
  {
    id:       'Remise spéciale',
    label:    'Remise spéciale',
    icon:     '🎁',
    color:    'amber',
    bg:       'bg-amber-50',
    border:   'border-amber-200',
    text:     'text-amber-700',
    badge:    'bg-amber-100 text-amber-700',
    desc:     'Bourse scolaire, difficulté financière, geste commercial…',
    check:    () => true, // toujours éligible, au jugement du comptable/admin
  },
];

/* ── Grouper familles ── */
function getFamilies(students) {
  const map = {};
  students.forEach(s => {
    const key = s.parent_phone || s.parent_email || `solo_${s.id}`;
    if (!map[key]) map[key] = { key, phone: s.parent_phone||'', email: s.parent_email||'', name: s.parent_name||'Parent', children: [] };
    map[key].children.push(s);
  });
  return Object.values(map);
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function FamilyDiscounts({ userRole = 'accountant', userName = '' }) {
  const [students,  setStudents]  = useState([]);
  const [fees,      setFees]      = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [school,    setSchool]    = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('apply');   // apply | history
  const [catFilter, setCatFilter] = useState('all');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);
  const [receipt,   setReceipt]   = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([Student.list(), Fee.list(), Teacher.list(), School.list(), Discount.list()])
      .then(([s, f, t, sc, d]) => {
        setStudents(s); setFees(f); setTeachers(t);
        setSchool(sc[0]||null); setDiscounts(d);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function reload() {
    Promise.all([Student.list(), Fee.list(), Discount.list()])
      .then(([s, f, d]) => { setStudents(s); setFees(f); setDiscounts(d); });
  }

  // Stats globales
  const totalDiscounted = discounts.filter(d => d.status !== 'Cancelled').reduce((s, d) => s + (d.amount||0), 0);
  const byCategory = DISCOUNT_CATEGORIES.map(cat => ({
    ...cat,
    count: discounts.filter(d => d.category === cat.id && d.status !== 'Cancelled').length,
    total: discounts.filter(d => d.category === cat.id && d.status !== 'Cancelled').reduce((s,d) => s+(d.amount||0), 0),
  }));

  // Élèves éligibles par catégorie
  const eligibleStudents = students.filter(s => {
    const cats = DISCOUNT_CATEGORIES.filter(c => c.check(s, students, teachers));
    if (catFilter !== 'all' && !cats.some(c => c.id === catFilter)) return false;
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    // N'afficher que les élèves avec des frais impayés
    const unpaid = fees.filter(f => f.student_id === s.id && f.status !== 'Paid' && ((f.amount_due||0)-(f.amount_paid||0)) > 0);
    return unpaid.length > 0;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <div className="text-center"><div className="text-4xl mb-3">⏳</div>Chargement...</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/15 p-3 rounded-2xl"><Tag size={22} /></div>
          <div>
            <div className="font-bold text-lg">Gestion des remises</div>
            <div className="text-white/70 text-sm">Accordées par : admin & comptable</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {byCategory.map(cat => (
            <div key={cat.id} className="bg-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/20 transition-all" onClick={() => setCatFilter(catFilter === cat.id ? 'all' : cat.id)}>
              <div className="text-xl mb-1">{cat.icon}</div>
              <div className="font-bold text-sm">{cat.count} remise(s)</div>
              <div className="text-white/60 text-xs">{cat.label}</div>
              <div className="text-white/80 text-xs font-medium mt-0.5">{fmt(cat.total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Total accordé ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
          <div className="text-violet-400 text-xs mb-1">Total remises accordées</div>
          <div className="text-2xl font-bold text-violet-700">{fmt(totalDiscounted)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <div className="text-green-400 text-xs mb-1">Nombre de remises</div>
          <div className="text-2xl font-bold text-green-700">{discounts.filter(d => d.status !== 'Cancelled').length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="text-blue-400 text-xs mb-1">Élèves bénéficiaires</div>
          <div className="text-2xl font-bold text-blue-700">{new Set(discounts.filter(d=>d.status!=='Cancelled').map(d=>d.student_id)).size}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {[['apply','🎟️ Accorder une remise'],['history','📋 Historique des remises']].map(([v,l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab===v ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── ONGLET : Accorder une remise ── */}
      {activeTab === 'apply' && (
        <div className="space-y-4">
          {/* Filtres catégorie */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCatFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${catFilter==='all' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}>
              Toutes catégories
            </button>
            {DISCOUNT_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(catFilter === cat.id ? 'all' : cat.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${catFilter===cat.id ? `${cat.bg} ${cat.text} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          {/* Liste élèves éligibles */}
          {eligibleStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
              <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
              <div className="font-medium text-gray-500">Aucun élève éligible avec frais impayés</div>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleStudents.map(student => {
                const eligibleCats = DISCOUNT_CATEGORIES.filter(c => c.check(student, students, teachers));
                const unpaidFees   = fees.filter(f => f.student_id === student.id && f.status !== 'Paid' && ((f.amount_due||0)-(f.amount_paid||0)) > 0);
                const alreadyDiscounted = discounts.filter(d => d.student_id === student.id && d.status !== 'Cancelled');

                return (
                  <StudentDiscountCard
                    key={student.id}
                    student={student}
                    eligibleCats={eligibleCats}
                    unpaidFees={unpaidFees}
                    alreadyDiscounted={alreadyDiscounted}
                    onApply={(fee, cat) => setModal({ student, fee, cat })}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET : Historique ── */}
      {activeTab === 'history' && (
        <DiscountHistory discounts={discounts} students={students} fees={fees} school={school} onReceipt={setReceipt} onReload={reload} />
      )}

      {/* ── Modal accord de remise ── */}
      {modal && (
        <DiscountModal
          student={modal.student}
          fee={modal.fee}
          category={modal.cat}
          school={school}
          userName={userName}
          userRole={userRole}
          onClose={() => setModal(null)}
          onSuccess={result => { setModal(null); setReceipt(result); reload(); }}
        />
      )}

      {/* ── Reçu ── */}
      {receipt && (
        <DiscountReceipt {...receipt} school={school} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

/* ── Carte élève avec frais éligibles ── */
function StudentDiscountCard({ student, eligibleCats, unpaidFees, alreadyDiscounted, onApply }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-all text-left">
        <div className="w-11 h-11 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {student.first_name?.[0]}{student.last_name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
            {student.first_name} {student.last_name}
            {student.gender === 'Féminin' && <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-medium">👧 Fille</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {eligibleCats.map(cat => (
              <span key={cat.id} className={`text-xs px-2 py-0.5 rounded-lg font-medium ${cat.badge}`}>{cat.icon} {cat.label}</span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <div className="text-sm font-bold text-red-500">{unpaidFees.length} frais impayé(s)</div>
          {alreadyDiscounted.length > 0 && (
            <div className="text-xs text-green-600 font-medium">{alreadyDiscounted.length} remise(s) existante(s)</div>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {/* Détail */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
          {/* Remises déjà accordées */}
          {alreadyDiscounted.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">Remises déjà accordées</div>
              {alreadyDiscounted.map((d, i) => (
                <div key={i} className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-2.5 text-sm">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{d.category}</span>
                    <span className="text-gray-400 ml-2 text-xs">le {d.date} — par {d.granted_by}</span>
                  </div>
                  <span className="font-bold text-green-700">−{fmt(d.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Frais éligibles */}
          <div className="space-y-2 mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase">Frais impayés — choisir sur quel frais appliquer</div>
            {unpaidFees.map(fee => {
              const left = (fee.amount_due||0) - (fee.amount_paid||0);
              return (
                <div key={fee.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{fee.fee_type}{fee.installment_month ? ` — Tranche ${fee.installment_month}` : ''}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Dû : {fmt(fee.amount_due)} · Payé : {fmt(fee.amount_paid)} · <strong className="text-red-500">Reste : {fmt(left)}</strong>
                        {fee.due_date && ` · Échéance : ${fee.due_date}`}
                      </div>
                    </div>
                  </div>
                  {/* Boutons par catégorie éligible */}
                  <div className="flex gap-2 flex-wrap">
                    {eligibleCats.map(cat => (
                      <button key={cat.id} onClick={() => onApply(fee, cat)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${cat.bg} ${cat.text} ${cat.border} hover:opacity-80`}>
                        {cat.icon} {cat.label}
                      </button>
                    ))}
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

/* ── Modal d'application de remise ── */
function DiscountModal({ student, fee, category, school, userName, userRole, onClose, onSuccess }) {
  const [discType, setDiscType] = useState('percent');
  const [value,    setValue]    = useState('');
  const [reason,   setReason]   = useState(category.id);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const left           = (fee.amount_due||0) - (fee.amount_paid||0);
  const discountAmount = discType === 'percent' ? Math.round(left * (parseFloat(value)||0) / 100) : Math.min(left, parseFloat(value)||0);
  const newLeft        = Math.max(0, left - discountAmount);
  const newAmountPaid  = (fee.amount_paid||0) + discountAmount;
  const newStatus      = newAmountPaid >= (fee.amount_due||0) ? 'Paid' : 'Partial';

  // Suggestions de valeurs par catégorie
  const suggestions = {
    'Remise fratrie':    [10, 15, 20],
    'Remise fille':      [10, 20, 25],
    'Remise enseignant': [25, 50, 100],
    'Remise spéciale':   [10, 20, 50],
  };
  const sugg = suggestions[category.id] || [10, 20];

  async function apply() {
    setError('');
    if (!value || discountAmount <= 0) { setError('Saisissez un montant de remise valide.'); return; }
    if (discountAmount > left)         { setError('La remise ne peut pas dépasser le reste dû.'); return; }
    setLoading(true);
    try {
      const receiptNum = 'REM-' + Date.now();
      const today      = new Date().toISOString().split('T')[0];

      // Créer la remise dans Discount
      await Discount.create({
        school_id:    fee.school_id,
        student_id:   student.id,
        fee_id:       fee.id,
        category:     category.id,
        type:         discType,
        value:        parseFloat(value),
        amount:       discountAmount,
        reason:       reason,
        granted_by:   userName || userRole,
        granted_role: userRole,
        date:         today,
        receipt_number: receiptNum,
        status:       'Applied',
      });

      // Mettre à jour le Fee
      await Fee.update(fee.id, {
        amount_paid:    newAmountPaid,
        status:         newStatus,
        payment_date:   today,
        payment_method: 'Remise',
        receipt_number: newStatus === 'Paid' ? receiptNum : fee.receipt_number,
        notes:          `Remise ${category.id} : −${fmt(discountAmount)} accordée le ${today} par ${userName||userRole}`,
        payment_status: 'Validated',
      });

      onSuccess({ student, fee: {...fee, amount_paid: newAmountPaid, status: newStatus, receipt_number: receiptNum, payment_date: today }, category, discountAmount, discType, value: parseFloat(value), reason, receiptNum, newLeft });
    } catch(e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-gray-100 ${category.bg} rounded-t-2xl`}>
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${category.text}`}>
              <span className="text-2xl">{category.icon}</span> {category.label}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">{student.first_name} {student.last_name} · {fee.fee_type}{fee.installment_month ? ` Tr.${fee.installment_month}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white/60 rounded-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info catégorie */}
          <div className={`${category.bg} border ${category.border} rounded-2xl p-3 text-sm ${category.text}`}>
            <div className="font-bold mb-0.5">{category.icon} Motif</div>
            <div>{category.desc}</div>
          </div>

          {/* Reste dû */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <span className="text-sm text-gray-600">Reste dû sur ce frais</span>
            <span className="font-bold text-red-600 text-lg">{fmt(left)}</span>
          </div>

          {/* Type remise */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Type de remise</label>
            <div className="grid grid-cols-2 gap-3">
              {[['percent','📊 Pourcentage','Ex: 10%'],['fixed','💵 Montant fixe','Ex: 5 000 FCFA']].map(([v, label, hint]) => (
                <button key={v} onClick={() => { setDiscType(v); setValue(''); }}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${discType===v ? `border-current ${category.bg} ${category.text}` : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="font-bold text-sm">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Valeurs suggérées */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              {discType === 'percent' ? 'Taux rapide' : 'Montant rapide'}
            </label>
            <div className="flex gap-2 flex-wrap mb-3">
              {discType === 'percent'
                ? sugg.map(s => (
                    <button key={s} onClick={() => setValue(String(s))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${value===String(s) ? `${category.bg} ${category.text} border-current` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {s}%
                    </button>
                  ))
                : [5000, 10000, 25000, 50000].map(a => (
                    <button key={a} onClick={() => setValue(String(a))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${value===String(a) ? `${category.bg} ${category.text} border-current` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {fmt(a)}
                    </button>
                  ))
              }
            </div>
            <div className="relative">
              <input type="number" value={value} onChange={e => setValue(e.target.value)}
                placeholder={discType === 'percent' ? 'Ex: 15' : 'Ex: 7500'}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 pr-16" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{discType==='percent' ? '%' : 'FCFA'}</span>
            </div>
            {discType === 'percent' && value && <div className={`text-xs ${category.text} mt-1 font-medium`}>= {fmt(discountAmount)} de remise</div>}
          </div>

          {/* Motif libre */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Motif détaillé</label>
            <input value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
              placeholder="Ex: 3ème enfant de la famille, bourse académique…" />
          </div>

          {/* Récap */}
          {value && discountAmount > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-sm">
              <div className="font-bold text-gray-700 mb-1">Récapitulatif</div>
              <div className="flex justify-between"><span className="text-gray-500">Reste actuel</span><span className="font-medium">{fmt(left)}</span></div>
              <div className={`flex justify-between ${category.text} font-medium`}><span>Remise accordée</span><span className="font-bold">−{fmt(discountAmount)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Nouveau reste</span>
                <span className={`font-bold ${newLeft===0 ? 'text-green-600' : 'text-red-600'}`}>{newLeft===0 ? '✅ Soldé !' : fmt(newLeft)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>Accordé par</span>
                <span className="font-medium">{userName || userRole} ({userRole === 'admin' ? 'Administrateur' : 'Comptable'})</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertTriangle size={16} />{error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200">Annuler</button>
          <button onClick={apply} disabled={loading || !value || discountAmount <= 0}
            className={`flex-1 py-3 rounded-2xl font-bold text-white transition-all disabled:opacity-40 ${
              category.color === 'pink' ? 'bg-pink-600 hover:bg-pink-700' :
              category.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              category.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' :
              'bg-violet-600 hover:bg-violet-700'
            }`}>
            {loading ? 'Application...' : `✅ Appliquer la remise`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Historique des remises ── */
function DiscountHistory({ discounts, students, fees, school, onReceipt, onReload }) {
  const [filter, setFilter] = useState('all');
  const sorted = [...discounts].sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
  const filtered = sorted.filter(d => filter === 'all' || d.category === filter);

  function studentName(id) {
    const s = students.find(s => s.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  async function cancel(disc) {
    if (!window.confirm('Annuler cette remise ? Le frais sera recalculé.')) return;
    try {
      await Discount.update(disc.id, { status: 'Cancelled' });
      // Recalculer le fee
      const fee = fees.find(f => f.id === disc.fee_id);
      if (fee) {
        const restored = Math.max(0, (fee.amount_paid||0) - (disc.amount||0));
        const newStatus = restored >= (fee.amount_due||0) ? 'Paid' : restored > 0 ? 'Partial' : 'Unpaid';
        await Fee.update(fee.id, { amount_paid: restored, status: newStatus });
      }
      onReload();
    } catch(e) {}
  }

  return (
    <div className="space-y-4">
      {/* Filtre catégorie */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter==='all' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200'}`}>Toutes</button>
        {DISCOUNT_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilter(filter===cat.id ? 'all' : cat.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1 ${filter===cat.id ? `${cat.bg} ${cat.text} border-current` : 'bg-white text-gray-600 border-gray-200'}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <Tag size={36} className="mx-auto mb-3 text-gray-300" />
          <div className="font-medium">Aucune remise enregistrée</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((disc, i) => {
            const cat = DISCOUNT_CATEGORIES.find(c => c.id === disc.category) || DISCOUNT_CATEGORIES[3];
            const isCancelled = disc.status === 'Cancelled';
            return (
              <div key={i} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isCancelled ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:border-violet-200'}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${cat.bg}`}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">{studentName(disc.student_id)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${cat.badge}`}>{cat.label}</span>
                      {isCancelled && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-lg font-medium">Annulée</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{disc.reason}</span>
                      <span>·</span>
                      <span>{disc.date}</span>
                      <span>·</span>
                      <span>par <strong>{disc.granted_by}</strong> ({disc.granted_role === 'admin' ? 'Admin' : 'Comptable'})</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <div className={`font-bold text-base ${isCancelled ? 'text-gray-400 line-through' : cat.text}`}>−{fmt(disc.amount)}</div>
                      <div className="text-xs text-gray-400">{disc.type === 'percent' ? `${disc.value}%` : 'Montant fixe'}</div>
                    </div>
                    {!isCancelled && (
                      <button onClick={() => cancel(disc)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Annuler la remise">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Reçu de remise ── */
function DiscountReceipt({ student, fee, category, discountAmount, discType, value, reason, receiptNum, newLeft, school, onClose }) {
  const color = school?.header_color || '#7c3aed';
  function print() {
    const el = document.getElementById('reno-disc-receipt');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Remise ${receiptNum}</title><style>@media print{body{margin:0}} @page{size:A5;margin:8mm}</style></head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-bold text-gray-800">🎟️ Reçu de remise</span>
          <div className="flex gap-2">
            <button onClick={print} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700">
              <Printer size={14} /> Imprimer
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">✕</button>
          </div>
        </div>
        <div id="reno-disc-receipt" style={{ fontFamily:'Arial,sans-serif', padding:'28px', background:'white' }}>
          <DocumentHeader school={{ ...school, header_color: color }} documentTitle="BON DE REMISE" documentSubtitle={`N° ${receiptNum}`} />
          <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'24px' }}>{category?.icon||'🎟️'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'12px', fontWeight:'bold', color:'#6b21a8' }}>{category?.label||'Remise'} accordée</div>
              <div style={{ fontSize:'10px', color:'#7c3aed' }}>{reason} · {fee?.payment_date||new Date().toLocaleDateString('fr-FR')}</div>
            </div>
            <div style={{ fontSize:'22px', fontWeight:'bold', color:'#7c3aed' }}>−{fmt(discountAmount)}</div>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'10px', marginBottom:'12px' }}>
            <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', marginBottom:'4px' }}>Élève</div>
            <div style={{ fontSize:'13px', fontWeight:'bold', color:'#0f172a' }}>{student?.last_name?.toUpperCase()} {student?.first_name}</div>
            {student?.registration_number && <div style={{ fontSize:'10px', color:'#64748b' }}>Matricule : {student.registration_number}</div>}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', marginBottom:'14px' }}>
            <thead><tr style={{ background:color, color:'white' }}>
              <th style={{ padding:'7px 10px', textAlign:'left' }}>Frais</th>
              <th style={{ padding:'7px 10px', textAlign:'right' }}>Montant initial</th>
              <th style={{ padding:'7px 10px', textAlign:'right' }}>Remise</th>
              <th style={{ padding:'7px 10px', textAlign:'right' }}>Reste dû</th>
            </tr></thead>
            <tbody><tr style={{ background:'#f8fafc' }}>
              <td style={{ padding:'8px 10px', fontWeight:'600' }}>{fee?.fee_type}{fee?.installment_month ? ` Tr.${fee.installment_month}` : ''}</td>
              <td style={{ padding:'8px 10px', textAlign:'right' }}>{fmt(fee?.amount_due)}</td>
              <td style={{ padding:'8px 10px', textAlign:'right', color:'#7c3aed', fontWeight:'bold' }}>−{fmt(discountAmount)}{discType==='percent' ? ` (${value}%)` : ''}</td>
              <td style={{ padding:'8px 10px', textAlign:'right', color: newLeft===0 ? '#166534' : '#dc2626', fontWeight:'bold' }}>{newLeft===0 ? 'Soldé ✅' : fmt(newLeft)}</td>
            </tr></tbody>
          </table>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', marginBottom:'20px' }}>Signature du parent</div>
              <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'4px', fontSize:'9px', color:'#cbd5e1' }}>Signature</div>
            </div>
            <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', marginBottom:'4px' }}>Cachet & Visa</div>
              {school?.stamp_url && <img src={school.stamp_url} alt="" style={{ width:'40px', height:'40px', objectFit:'contain', opacity:0.7, margin:'0 auto' }} />}
              <div style={{ borderTop:'1px solid #e2e8f0', marginTop:'6px', paddingTop:'4px', fontSize:'9px', color:'#cbd5e1' }}>Signature & Cachet</div>
            </div>
          </div>
          <div style={{ borderTop:`2px solid ${color}`, paddingTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'#94a3b8' }}>
            <span>{school?.name||'RENO'}</span><span>Document officiel</span><span>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
