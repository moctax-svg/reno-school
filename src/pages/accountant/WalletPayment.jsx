/**
 * WalletPayment.jsx
 * Système de paiement hybride RENO
 * 
 * FLUX :
 * 1. Portefeuille  → parent paie via solde → débité immédiatement → fee.status = Paid
 * 2. Cash (parent) → parent saisit montant + n° reçu → fee.payment_status = 'PendingValidation'
 * 3. Cash (comptable) → comptable impute directement → fee.status = Paid
 * 4. Validation comptable → comptable voit les "PendingValidation", vérifie n° reçu, valide
 * 
 * Anti-doublon : vérification du receipt_number avant toute validation
 */

import React, { useState, useEffect } from 'react';
import { Fee, Student, WalletTransaction, School } from '../../api/entities';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';
import {
  Wallet, CreditCard, Clock, CheckCircle, XCircle,
  AlertTriangle, Printer, Search, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

const fmt = n => (n || 0).toLocaleString('fr-FR') + ' FCFA';

/* ─────────────────────────────────────
   REÇU IMPRIMABLE (commun parent + compta)
───────────────────────────────────── */
export function PaymentReceipt({ fee, student, school, onClose }) {
  const color = school?.header_color || '#4338ca';
  const methodLabel = {
    'Wallet': '💳 Portefeuille RENO',
    'Cash': '💵 Espèces',
    'Mobile Money': '📱 Mobile Money',
    'Virement': '🏦 Virement bancaire',
    'Carte': '💳 Carte bancaire',
  };

  function print() {
    const el = document.getElementById('reno-receipt');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Reçu ${fee.receipt_number}</title>
      <style>@media print{body{margin:0}} @page{size:A5;margin:8mm}</style>
      </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-bold text-gray-800">🧾 Reçu de paiement</span>
          <div className="flex gap-2">
            <button onClick={print} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
              <Printer size={14} /> Imprimer
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
          </div>
        </div>

        {/* Contenu imprimable */}
        <div id="reno-receipt" style={{ fontFamily: 'Arial, sans-serif', padding: '28px', background: 'white' }}>
          <DocumentHeader school={school} documentTitle="REÇU DE PAIEMENT" documentSubtitle={`N° ${fee.receipt_number || '—'}`} />

          {/* Statut */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>Paiement confirmé</div>
              <div style={{ fontSize: '10px', color: '#15803d' }}>
                {fee.payment_date || new Date().toLocaleDateString('fr-FR')} · {methodLabel[fee.payment_method] || fee.payment_method}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: 'bold', color: '#166534' }}>
              {fmt(fee.amount_paid)}
            </div>
          </div>

          {/* Infos élève */}
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Élève</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
              {student ? `${student.last_name?.toUpperCase()} ${student.first_name}` : '—'}
            </div>
            {student?.registration_number && (
              <div style={{ fontSize: '10px', color: '#64748b' }}>Matricule : {student.registration_number}</div>
            )}
          </div>

          {/* Détail frais */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '14px' }}>
            <thead>
              <tr style={{ background: color, color: 'white' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Montant dû</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Payé</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Reste</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '9px 10px', fontWeight: '600' }}>{fee.fee_type}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right' }}>{fmt(fee.amount_due)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: '#166534', fontWeight: 'bold' }}>{fmt(fee.amount_paid)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: ((fee.amount_due||0)-(fee.amount_paid||0)) > 0 ? '#dc2626' : '#166534', fontWeight: 'bold' }}>
                  {fmt((fee.amount_due || 0) - (fee.amount_paid || 0))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes */}
          {fee.notes && (
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px', fontStyle: 'italic' }}>
              Note : {fee.notes}
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>Signature du parent</div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontSize: '9px', color: '#cbd5e1' }}>Signature</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Cachet & Visa comptable</div>
              {school?.stamp_url && (
                <img src={school.stamp_url} alt="Cachet" style={{ width: '45px', height: '45px', objectFit: 'contain', opacity: 0.7, margin: '0 auto' }} />
              )}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '4px', fontSize: '9px', color: '#cbd5e1' }}>Signature & Cachet</div>
            </div>
          </div>

          {/* Pied */}
          <div style={{ borderTop: `2px solid ${color}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
            <span>{school?.name || 'RENO'} — {school?.academic_year_label || new Date().getFullYear()}</span>
            <span>Document officiel — RENO</span>
            <span>Édité le {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MODULE PARENT — Paiement frais
───────────────────────────────────── */
export function ParentFeesModule({ child }) {
  const [fees, setFees] = useState([]);
  const [school, setSchool] = useState(null);
  const [payModal, setPayModal] = useState(null); // fee sélectionnée pour payer
  const [receiptModal, setReceiptModal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    School.list().then(sc => setSchool(sc[0] || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!child) return;
    Fee.filter({ student_id: child.id }).then(f => setFees(f)).catch(() => {});
  }, [child?.id]);

  if (!child) return (
    <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
      <div className="text-4xl mb-2">👶</div>
      <div>Sélectionnez un enfant pour voir ses frais</div>
    </div>
  );

  const totalDue = fees.reduce((s, f) => s + (f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalLeft = totalDue - totalPaid;
  const walletBalance = child.wallet_balance || 0;
  const pendingValidation = fees.filter(f => f.payment_status === 'PendingValidation').length;

  function reload() {
    Fee.filter({ student_id: child.id }).then(setFees).catch(() => {});
  }

  const statusMeta = {
    Paid:    { label: 'Payé',       color: 'bg-green-100 text-green-700',  dot: '🟢' },
    Partial: { label: 'Partiel',    color: 'bg-blue-100 text-blue-700',    dot: '🔵' },
    Unpaid:  { label: 'Impayé',     color: 'bg-red-100 text-red-700',      dot: '🔴' },
    Overdue: { label: 'En retard',  color: 'bg-rose-100 text-rose-700',    dot: '🔴' },
    Pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700',  dot: '🟡' },
  };
  const payStatusMeta = {
    PendingValidation: { label: '⏳ En attente de validation', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    Validated:         { label: '✅ Validé',                   color: 'bg-green-50 text-green-700 border border-green-200' },
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total dû', val: totalDue, color: 'text-gray-800', bg: 'bg-gray-50 border border-gray-100' },
          { label: 'Total payé', val: totalPaid, color: 'text-green-700', bg: 'bg-green-50 border border-green-100' },
          { label: 'Reste à payer', val: totalLeft, color: 'text-red-600', bg: 'bg-red-50 border border-red-100' },
          { label: '💰 Solde portefeuille', val: walletBalance, color: walletBalance > 0 ? 'text-indigo-700' : 'text-gray-400', bg: 'bg-indigo-50 border border-indigo-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className={`text-xl font-bold ${s.color}`}>{fmt(s.val)}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerte validation en attente */}
      {pendingValidation > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <Clock size={18} className="text-amber-500 flex-shrink-0" />
          <div>
            <span className="font-bold">{pendingValidation} paiement(s) en attente de validation</span> par le comptable.
            Vous recevrez une confirmation une fois validé.
          </div>
        </div>
      )}

      {/* Liste des frais */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-gray-800">Mes frais scolaires</span>
          <button onClick={reload} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {fees.length === 0 ? (
            <div className="py-10 text-center text-gray-400">Aucun frais enregistré</div>
          ) : fees.map(fee => {
            const left = (fee.amount_due || 0) - (fee.amount_paid || 0);
            const st = statusMeta[fee.status] || statusMeta.Unpaid;
            const isPaid = fee.status === 'Paid';
            const isPending = fee.payment_status === 'PendingValidation';

            return (
              <div key={fee.id} className={`p-4 hover:bg-gray-50 transition-all ${isPending ? 'bg-amber-50/40' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{fee.fee_type}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${st.color}`}>{st.dot} {st.label}</span>
                      {isPending && (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${payStatusMeta.PendingValidation.color}`}>
                          {payStatusMeta.PendingValidation.label}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                      <span>Dû : <strong>{fmt(fee.amount_due)}</strong></span>
                      <span>Payé : <strong className="text-green-600">{fmt(fee.amount_paid)}</strong></span>
                      {left > 0 && <span>Reste : <strong className="text-red-600">{fmt(left)}</strong></span>}
                      {fee.due_date && <span>Échéance : {fee.due_date}</span>}
                    </div>
                    {isPending && fee.receipt_number && (
                      <div className="mt-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 inline-block">
                        📄 N° Reçu soumis : <strong>{fee.receipt_number}</strong> — En attente de validation comptable
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {isPaid && fee.receipt_number && (
                      <button
                        onClick={() => setReceiptModal(fee)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100 border border-green-200"
                      >
                        <Printer size={13} /> Reçu
                      </button>
                    )}
                    {!isPaid && !isPending && left > 0 && (
                      <button
                        onClick={() => setPayModal(fee)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 shadow-sm"
                      >
                        <CreditCard size={13} /> Payer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal paiement */}
      {payModal && (
        <PaymentModal
          fee={payModal}
          child={child}
          school={school}
          onClose={() => setPayModal(null)}
          onSuccess={(updatedFee) => {
            setPayModal(null);
            reload();
            if (updatedFee?.status === 'Paid') setReceiptModal(updatedFee);
          }}
        />
      )}

      {/* Modal reçu */}
      {receiptModal && (
        <PaymentReceipt
          fee={receiptModal}
          student={child}
          school={school}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   MODAL DE PAIEMENT (côté parent)
───────────────────────────────────── */
function PaymentModal({ fee, child, school, onClose, onSuccess }) {
  const [method, setMethod] = useState('Wallet'); // 'Wallet' | 'Cash'
  const [cashAmount, setCashAmount] = useState(String((fee.amount_due || 0) - (fee.amount_paid || 0)));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const left = (fee.amount_due || 0) - (fee.amount_paid || 0);
  const walletBalance = child?.wallet_balance || 0;
  const canPayWallet = walletBalance >= left;

  async function pay() {
    setError('');
    setLoading(true);
    try {
      if (method === 'Wallet') {
        // ── Paiement portefeuille ──
        if (walletBalance < left) { setError('Solde insuffisant dans le portefeuille.'); setLoading(false); return; }

        const newBalance = walletBalance - left;
        const receiptNum = 'WLT-' + Date.now();
        const today = new Date().toISOString().split('T')[0];

        // Débiter le wallet
        await Student.update(child.id, { wallet_balance: newBalance });
        await WalletTransaction.create({
          student_id: child.id,
          school_id: fee.school_id,
          type: 'debit',
          amount: left,
          balance_after: newBalance,
          label: `Paiement ${fee.fee_type}`,
          payment_method: 'Wallet',
          date: today,
          done_by: child.first_name + ' ' + child.last_name,
          reference: receiptNum,
        });

        // Mettre à jour le frais
        const updatedFee = {
          amount_paid: fee.amount_due,
          status: 'Paid',
          payment_method: 'Wallet',
          payment_date: today,
          receipt_number: receiptNum,
          payment_status: 'Validated',
        };
        await Fee.update(fee.id, updatedFee);
        onSuccess({ ...fee, ...updatedFee });

      } else {
        // ── Déclaration cash par le parent ──
        if (!receiptNumber.trim()) { setError('Le numéro du reçu est obligatoire.'); setLoading(false); return; }
        const amount = parseFloat(cashAmount);
        if (!amount || amount <= 0) { setError('Montant invalide.'); setLoading(false); return; }

        // Vérifier si le n° de reçu existe déjà
        const allFees = await Fee.list();
        const duplicate = allFees.find(f => f.receipt_number === receiptNumber.trim() && f.id !== fee.id);
        if (duplicate) { setError(`⚠️ Ce numéro de reçu (${receiptNumber}) est déjà utilisé. Vérifiez votre reçu.`); setLoading(false); return; }

        await Fee.update(fee.id, {
          payment_status: 'PendingValidation',
          pending_amount: amount,
          pending_receipt: receiptNumber.trim(),
          pending_date: new Date().toISOString().split('T')[0],
          pending_notes: receiptNote,
          payment_method: 'Cash',
        });
        onSuccess(null); // pas de reçu immédiat, attente validation
      }
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">💳 Payer — {fee.fee_type}</h3>
            <p className="text-sm text-gray-500">Reste dû : <strong className="text-red-600">{fmt(left)}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Choix du mode */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMethod('Wallet')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'Wallet' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <Wallet size={24} className={method === 'Wallet' ? 'text-indigo-600' : 'text-gray-400'} />
                <span className={`text-sm font-bold ${method === 'Wallet' ? 'text-indigo-700' : 'text-gray-600'}`}>Portefeuille</span>
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${walletBalance >= left ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  Solde : {fmt(walletBalance)}
                </span>
              </button>
              <button onClick={() => setMethod('Cash')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'Cash' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <CreditCard size={24} className={method === 'Cash' ? 'text-orange-600' : 'text-gray-400'} />
                <span className={`text-sm font-bold ${method === 'Cash' ? 'text-orange-700' : 'text-gray-600'}`}>Paiement manuel</span>
                <span className="text-xs text-gray-400">Espèces / Virement</span>
              </button>
            </div>
          </div>

          {/* Paiement portefeuille */}
          {method === 'Wallet' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Montant à débiter</span>
                <span className="font-bold text-indigo-800">{fmt(left)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Solde actuel</span>
                <span className="font-medium text-indigo-700">{fmt(walletBalance)}</span>
              </div>
              <div className="border-t border-indigo-200 pt-2 flex justify-between text-sm">
                <span className="text-indigo-700">Solde après paiement</span>
                <span className={`font-bold ${walletBalance - left >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmt(walletBalance - left)}
                </span>
              </div>
              {!canPayWallet && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-2">
                  <AlertTriangle size={14} /> Solde insuffisant. Rechargez votre portefeuille ou payez en espèces.
                </div>
              )}
            </div>
          )}

          {/* Paiement cash / déclaration */}
          {method === 'Cash' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
                <div className="font-bold mb-1">📋 Comment ça marche ?</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Vous payez en espèces auprès du comptable</li>
                  <li>Le comptable vous remet un reçu physique avec un numéro</li>
                  <li>Saisissez ce numéro ci-dessous pour enregistrer votre paiement</li>
                  <li>Le comptable validera et le statut sera mis à jour</li>
                </ol>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Montant payé (FCFA) *</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ex: 50000"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Numéro du reçu physique *</label>
                <input
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                  placeholder="Ex: REC-2025-0042"
                />
                <p className="text-xs text-gray-400 mt-1">Ce numéro se trouve sur le reçu que vous a remis le comptable.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Note (optionnel)</label>
                <input
                  value={receiptNote}
                  onChange={e => setReceiptNote(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  placeholder="Ex: Paiement partiel de la tranche 2"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200">
            Annuler
          </button>
          <button
            onClick={pay}
            disabled={loading || (method === 'Wallet' && !canPayWallet)}
            className={`flex-1 py-3 rounded-2xl font-bold text-white transition-all disabled:opacity-50 ${method === 'Wallet' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {loading ? 'Traitement...' : method === 'Wallet' ? '💳 Payer maintenant' : '📤 Soumettre pour validation'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MODULE COMPTABLE — Validation paiements cash
───────────────────────────────────── */
export function CashValidationModule({ fees, students, school, onValidated }) {
  const [pendingFees, setPendingFees] = useState([]);
  const [validatingId, setValidatingId] = useState(null);
  const [receiptOverride, setReceiptOverride] = useState({});
  const [rejecting, setRejecting] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState({});

  useEffect(() => {
    setPendingFees(fees.filter(f => f.payment_status === 'PendingValidation'));
  }, [fees]);

  function studentName(id) {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }
  function studentObj(id) { return students.find(st => st.id === id) || null; }

  const filtered = pendingFees.filter(f => {
    const name = studentName(f.student_id).toLowerCase();
    return name.includes(search.toLowerCase()) || (f.pending_receipt || '').toLowerCase().includes(search.toLowerCase());
  });

  async function validate(fee) {
    setError(prev => ({ ...prev, [fee.id]: '' }));
    const finalReceipt = (receiptOverride[fee.id] || fee.pending_receipt || '').trim();
    if (!finalReceipt) { setError(prev => ({ ...prev, [fee.id]: 'Saisissez un numéro de reçu valide.' })); return; }

    // Anti-doublon
    const allFees = await Fee.list();
    const duplicate = allFees.find(f => f.receipt_number === finalReceipt && f.id !== fee.id && f.payment_status !== 'PendingValidation');
    if (duplicate) {
      setError(prev => ({ ...prev, [fee.id]: `⚠️ Ce numéro de reçu est déjà utilisé (${studentName(duplicate.student_id)}). Vérifiez avant de valider.` }));
      return;
    }

    setValidatingId(fee.id);
    try {
      const amount = fee.pending_amount || ((fee.amount_due || 0) - (fee.amount_paid || 0));
      const newAmountPaid = (fee.amount_paid || 0) + amount;
      const newStatus = newAmountPaid >= (fee.amount_due || 0) ? 'Paid' : 'Partial';
      const today = new Date().toISOString().split('T')[0];

      const updatedFee = {
        amount_paid: newAmountPaid,
        status: newStatus,
        payment_date: today,
        payment_method: 'Cash',
        receipt_number: finalReceipt,
        payment_status: 'Validated',
        notes: fee.pending_notes || '',
      };
      await Fee.update(fee.id, updatedFee);

      if (newStatus === 'Paid') setReceiptModal({ ...fee, ...updatedFee });
      onValidated?.();
    } catch (e) { setError(prev => ({ ...prev, [fee.id]: 'Erreur : ' + e.message })); }
    setValidatingId(null);
  }

  async function reject(fee) {
    setRejecting(fee.id);
    try {
      await Fee.update(fee.id, {
        payment_status: null,
        pending_amount: null,
        pending_receipt: null,
        pending_date: null,
        pending_notes: null,
      });
      onValidated?.();
    } catch (e) {}
    setRejecting(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Chercher par élève ou n° reçu..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>
        <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-2 rounded-xl text-sm font-medium">
          <Clock size={16} />
          {pendingFees.length} en attente
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <div className="font-medium text-gray-600">Aucun paiement en attente de validation</div>
          <div className="text-sm mt-1">Tous les paiements cash déclarés ont été traités.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fee => {
            const stu = studentObj(fee.student_id);
            const isValidating = validatingId === fee.id;
            const currentReceipt = receiptOverride[fee.id] !== undefined ? receiptOverride[fee.id] : (fee.pending_receipt || '');
            const left = (fee.amount_due || 0) - (fee.amount_paid || 0);

            return (
              <div key={fee.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                {/* Bandeau supérieur */}
                <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border-b border-amber-100">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {stu?.first_name?.[0]}{stu?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800">{studentName(fee.student_id)}</div>
                    <div className="text-xs text-gray-500">{fee.fee_type} · Déclaré le {fee.pending_date || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold">
                    <Clock size={12} /> En attente
                  </div>
                </div>

                {/* Détails */}
                <div className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">Montant déclaré</div>
                      <div className="font-bold text-gray-800">{fmt(fee.pending_amount || left)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">Reste à payer</div>
                      <div className="font-bold text-red-600">{fmt(left)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">Mode</div>
                      <div className="font-bold text-gray-800">💵 Espèces</div>
                    </div>
                  </div>

                  {/* N° reçu soumis par le parent */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <div className="text-xs text-indigo-600 font-semibold mb-1">N° Reçu soumis par le parent</div>
                    <div className="font-mono font-bold text-indigo-800 text-base">{fee.pending_receipt || '—'}</div>
                    {fee.pending_notes && <div className="text-xs text-indigo-500 mt-1 italic">"{fee.pending_notes}"</div>}
                  </div>

                  {/* Champ de confirmation/correction du n° reçu */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                      ✏️ Confirmer ou corriger le n° de reçu (obligatoire)
                    </label>
                    <input
                      value={currentReceipt}
                      onChange={e => setReceiptOverride(prev => ({ ...prev, [fee.id]: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="N° du reçu physique"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Vérifiez que ce numéro correspond bien au reçu physique remis au parent. Le système bloquera les doublons.
                    </p>
                  </div>

                  {error[fee.id] && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      {error[fee.id]}
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => reject(fee)}
                      disabled={rejecting === fee.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} /> Rejeter
                    </button>
                    <button
                      onClick={() => validate(fee)}
                      disabled={isValidating || !currentReceipt.trim()}
                      className="flex-2 flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      {isValidating ? 'Validation...' : 'Valider le paiement'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal reçu après validation */}
      {receiptModal && (
        <PaymentReceipt
          fee={receiptModal}
          student={studentObj(receiptModal.student_id)}
          school={school}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   MODULE COMPTABLE — Saisie directe paiement cash
   (Comptable impute lui-même sans passer par le parent)
───────────────────────────────────── */
export function DirectCashEntry({ fees, students, school, onSaved }) {
  const [search, setSearch] = useState('');
  const [selectedFee, setSelectedFee] = useState(null);
  const [form, setForm] = useState({
    amount: '', receipt_number: '', payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptModal, setReceiptModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const unpaidFees = fees.filter(f => f.status !== 'Paid' && f.payment_status !== 'PendingValidation');
  const filtered = unpaidFees.filter(f => {
    const s = students.find(st => st.id === f.student_id);
    const name = s ? `${s.first_name} ${s.last_name}`.toLowerCase() : '';
    return name.includes(search.toLowerCase()) || (f.fee_type || '').toLowerCase().includes(search.toLowerCase());
  });

  function studentName(id) {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }
  function studentObj(id) { return students.find(st => st.id === id) || null; }

  async function saveDirect() {
    setError('');
    if (!selectedFee) return;
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Montant invalide.'); return; }
    if (!form.receipt_number.trim()) { setError('Le numéro de reçu est obligatoire.'); return; }

    // Anti-doublon
    setLoading(true);
    try {
      const allFees = await Fee.list();
      const duplicate = allFees.find(f => f.receipt_number === form.receipt_number.trim() && f.id !== selectedFee.id);
      if (duplicate) {
        setError(`⚠️ Ce numéro de reçu est déjà utilisé (${studentName(duplicate.student_id)}). Vérifiez.`);
        setLoading(false); return;
      }

      const newAmountPaid = (selectedFee.amount_paid || 0) + amount;
      const newStatus = newAmountPaid >= (selectedFee.amount_due || 0) ? 'Paid' : 'Partial';

      const updatedFee = {
        amount_paid: newAmountPaid,
        status: newStatus,
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        receipt_number: form.receipt_number.trim(),
        payment_status: 'Validated',
        notes: form.notes,
      };
      await Fee.update(selectedFee.id, updatedFee);

      const finalFee = { ...selectedFee, ...updatedFee };
      if (newStatus === 'Paid') setReceiptModal(finalFee);
      setSelectedFee(null);
      setForm({ amount: '', receipt_number: '', payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      onSaved?.();
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
        <CreditCard size={18} className="text-blue-500 flex-shrink-0" />
        <div>Saisissez ici les paiements cash reçus directement au guichet. Le reçu sera généré automatiquement après validation.</div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un élève ou un type de frais..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 30).map(fee => {
          const left = (fee.amount_due || 0) - (fee.amount_paid || 0);
          const isExpanded = expanded === fee.id;
          const isSelected = selectedFee?.id === fee.id;

          return (
            <div key={fee.id} className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${isSelected ? 'border-blue-300 shadow-md' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => {
                setSelectedFee(isSelected ? null : fee);
                setExpanded(isSelected ? null : fee.id);
                setForm(f => ({ ...f, amount: String(left) }));
                setError('');
              }}>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {students.find(s => s.id === fee.student_id)?.first_name?.[0]}
                  {students.find(s => s.id === fee.student_id)?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{studentName(fee.student_id)}</div>
                  <div className="text-xs text-gray-500">{fee.fee_type} · Reste : <strong className="text-red-600">{fmt(left)}</strong></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${fee.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {fee.status}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {isSelected && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3 bg-blue-50/30">
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Montant reçu (FCFA) *</label>
                      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder={String(left)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Mode de paiement</label>
                      <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                        {['Cash', 'Mobile Money', 'Virement', 'Carte'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">N° Reçu physique *</label>
                      <input value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="REC-2025-0001" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Date de paiement</label>
                      <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                      placeholder="Ex: Paiement tranche 1" />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" /> {error}
                    </div>
                  )}
                  <button onClick={saveDirect} disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> {loading ? 'Enregistrement...' : 'Valider et enregistrer le paiement'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            Aucun frais impayé trouvé
          </div>
        )}
      </div>

      {receiptModal && (
        <PaymentReceipt
          fee={receiptModal}
          student={studentObj(receiptModal.student_id)}
          school={school}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}
