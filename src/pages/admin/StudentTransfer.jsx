import React, { useState, useEffect } from 'react';
import { Student, School, Classroom, WalletTransaction, TransferRecord, Fee } from '../../api/entities';
import { ArrowRight, Search, CheckCircle, AlertCircle, Wallet, History } from 'lucide-react';

/* ─── Portefeuille élève ─── */
function WalletPanel({ student, school, onRecharge, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('Espèces');
  const [rechargeLabel, setRechargeLabel] = useState('Recharge portefeuille');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    WalletTransaction.filter({ student_id: student.id })
      .then(t => setTransactions(t.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))))
      .catch(() => {});
  }, [student.id]);

  async function doRecharge() {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) return alert('Montant invalide');
    setLoading(true);
    try {
      const newBalance = (student.wallet_balance || 0) + amount;
      await Student.update(student.id, {
        wallet_balance: newBalance,
        wallet_total_credited: (student.wallet_total_credited || 0) + amount,
      });
      await WalletTransaction.create({
        student_id: student.id,
        school_id: school?.id,
        type: 'credit',
        amount,
        balance_after: newBalance,
        label: rechargeLabel,
        payment_method: rechargeMethod,
        date: new Date().toISOString().split('T')[0],
        done_by: 'Admin',
        reference: 'REC-' + Date.now(),
      });
      alert(`✅ Portefeuille rechargé : +${amount.toLocaleString('fr-FR')} FCFA\nNouveau solde : ${newBalance.toLocaleString('fr-FR')} FCFA`);
      setRechargeAmount('');
      onRecharge?.();
    } catch (e) { alert('Erreur : ' + e.message); }
    setLoading(false);
  }

  const balance = student.wallet_balance || 0;
  const typeColor = { credit: 'text-green-600', debit: 'text-red-600', transfer_in: 'text-blue-600', transfer_out: 'text-orange-600', refund: 'text-violet-600' };
  const typeLabel = { credit: '+ Recharge', debit: '- Dépense', transfer_in: '→ Reçu (transfert)', transfer_out: '← Envoyé (transfert)', refund: '↩ Remboursement' };

  return (
    <div className="space-y-5">
      {/* Solde */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Wallet size={20} />
          <span className="font-medium">Portefeuille de {student.first_name} {student.last_name}</span>
        </div>
        <div className="text-4xl font-bold mb-1">{balance.toLocaleString('fr-FR')} <span className="text-2xl font-medium">FCFA</span></div>
        <div className="text-white/70 text-sm">Total rechargé depuis l'ouverture : {(student.wallet_total_credited || 0).toLocaleString('fr-FR')} FCFA</div>
      </div>

      {/* Recharger */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-700 mb-3">💳 Recharger le portefeuille</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Montant (FCFA)</label>
            <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)}
              placeholder="Ex: 25000"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mode de paiement</label>
            <select value={rechargeMethod} onChange={e => setRechargeMethod(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['Espèces','Mobile Money','Virement','Carte'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Libellé</label>
            <input value={rechargeLabel} onChange={e => setRechargeLabel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button onClick={doRecharge} disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-all">
          {loading ? 'Traitement...' : '✅ Valider la recharge'}
        </button>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <History size={16} className="text-gray-400" />
          <span className="font-semibold text-gray-700">Historique des transactions</span>
          <span className="ml-auto text-xs text-gray-400">{transactions.length} opération(s)</span>
        </div>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Aucune transaction</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 15).map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{t.label}</div>
                  <div className="text-xs text-gray-400">{t.date} · {t.payment_method || '—'} · {t.done_by || ''}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${typeColor[t.type] || 'text-gray-600'}`}>
                    {t.type === 'debit' || t.type === 'transfer_out' ? '-' : '+'}{t.amount?.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-xs text-gray-400">Solde : {t.balance_after?.toLocaleString('fr-FR')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Module principal Transfert ─── */
export default function StudentTransfer() {
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState('list'); // list | transfer | wallet | history
  const [form, setForm] = useState({
    to_school_id: '', to_classroom_id: '', reason: 'Déménagement',
    notes: '', transfer_wallet: true, carry_fees: true,
  });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [sc, st, cl, tr] = await Promise.all([
      School.list(), Student.list(), Classroom.list(), TransferRecord.list()
    ]);
    setSchools(sc.filter(s => !s.is_group));
    setStudents(st);
    setClassrooms(cl);
    setTransfers(tr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  }

  const filtered = students.filter(s =>
    s.status === 'Active' &&
    (s.first_name + ' ' + s.last_name + ' ' + (s.registration_number || '')).toLowerCase().includes(search.toLowerCase())
  );

  function schoolName(id) { return schools.find(s => s.id === id)?.name || '—'; }
  function classroomName(id) { return classrooms.find(c => c.id === id)?.name || '—'; }
  function studentName(id) { const s = students.find(s => s.id === id); return s ? `${s.first_name} ${s.last_name}` : '—'; }

  const destClassrooms = classrooms.filter(c => c.school_id === form.to_school_id);

  async function executeTransfer() {
    if (!form.to_school_id) return alert('Choisissez un établissement destination');
    if (!window.confirm(`Confirmer le transfert de ${selectedStudent.first_name} ${selectedStudent.last_name} vers ${schoolName(form.to_school_id)} ?`)) return;

    setProcessing(true);
    try {
      const walletBalance = selectedStudent.wallet_balance || 0;
      const walletToTransfer = form.transfer_wallet ? walletBalance : 0;
      const today = new Date().toISOString().split('T')[0];

      // 1. Créer le transfert
      await TransferRecord.create({
        student_id: selectedStudent.id,
        from_school_id: selectedStudent.school_id,
        to_school_id: form.to_school_id,
        from_classroom_id: selectedStudent.classroom_id,
        to_classroom_id: form.to_classroom_id || '',
        transfer_date: today,
        reason: form.reason,
        notes: form.notes,
        wallet_transferred: walletToTransfer,
        fees_carried_over: form.carry_fees,
        approved_by: 'Admin',
        status: 'Completed',
      });

      // 2. Historique wallet si transfert de solde
      if (form.transfer_wallet && walletBalance > 0) {
        await WalletTransaction.create({
          student_id: selectedStudent.id,
          school_id: selectedStudent.school_id,
          type: 'transfer_out',
          amount: walletBalance,
          balance_after: walletBalance,
          label: `Transfert vers ${schoolName(form.to_school_id)}`,
          from_school_id: selectedStudent.school_id,
          to_school_id: form.to_school_id,
          date: today,
          done_by: 'Admin',
          reference: 'TRF-' + Date.now(),
        });
        await WalletTransaction.create({
          student_id: selectedStudent.id,
          school_id: form.to_school_id,
          type: 'transfer_in',
          amount: walletBalance,
          balance_after: walletBalance,
          label: `Reçu depuis ${schoolName(selectedStudent.school_id)}`,
          from_school_id: selectedStudent.school_id,
          to_school_id: form.to_school_id,
          date: today,
          done_by: 'Système',
          reference: 'TRF-' + Date.now() + '-IN',
        });
      }

      // 3. Mettre à jour l'élève
      const prevIds = selectedStudent.previous_school_ids || [];
      if (!prevIds.includes(selectedStudent.school_id)) prevIds.push(selectedStudent.school_id);

      await Student.update(selectedStudent.id, {
        school_id: form.to_school_id,
        classroom_id: form.to_classroom_id || selectedStudent.classroom_id,
        status: 'Active',
        transfer_date: today,
        transfer_notes: form.notes,
        previous_school_ids: prevIds,
        origin_school_id: selectedStudent.origin_school_id || selectedStudent.school_id,
        wallet_balance: walletToTransfer, // conservé si transféré
      });

      setDone(true);
      setTimeout(() => { setDone(false); setView('list'); setSelectedStudent(null); load(); }, 2500);
    } catch (e) { alert('Erreur : ' + e.message); }
    setProcessing(false);
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'list', label: '🔄 Effectuer un transfert' },
          { id: 'history', label: '📋 Historique des transferts' },
        ].map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${view === t.id || (view === 'transfer' && t.id === 'list') || (view === 'wallet' && t.id === 'list') ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LISTE ÉLÈVES ── */}
      {(view === 'list') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un élève par nom ou matricule..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} élève(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.slice(0, 20).map(s => {
              const currentSchool = schools.find(sc => sc.id === s.school_id);
              const currentClass = classrooms.find(c => c.id === s.classroom_id);
              const hasPrevious = (s.previous_school_ids || []).length > 0;
              return (
                <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{s.first_name} {s.last_name}</span>
                      <span className="text-xs text-gray-400">#{s.registration_number || '—'}</span>
                      {hasPrevious && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-lg font-medium">Transféré</span>}
                    </div>
                    <div className="text-sm text-gray-500">{currentSchool?.name || '—'} · {currentClass?.name || 'Classe ?'} · {currentSchool?.city || ''}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-indigo-600 font-medium">💰 {(s.wallet_balance || 0).toLocaleString('fr-FR')} FCFA</span>
                      {hasPrevious && <span className="text-xs text-gray-400">{(s.previous_school_ids || []).length} site(s) précédent(s)</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedStudent(s); setView('wallet'); }}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-all flex items-center gap-1">
                      <Wallet size={13} /> Portefeuille
                    </button>
                    <button onClick={() => { setSelectedStudent(s); setForm({ to_school_id: '', to_classroom_id: '', reason: 'Déménagement', notes: '', transfer_wallet: true, carry_fees: true }); setView('transfer'); }}
                      className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-all flex items-center gap-1">
                      <ArrowRight size={13} /> Transférer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PORTEFEUILLE ── */}
      {view === 'wallet' && selectedStudent && (
        <div>
          <button onClick={() => { setView('list'); setSelectedStudent(null); }} className="text-sm text-indigo-600 hover:underline mb-4 flex items-center gap-1">← Retour</button>
          <WalletPanel student={selectedStudent} school={schools.find(s => s.id === selectedStudent.school_id)} onRecharge={load} />
        </div>
      )}

      {/* ── FORMULAIRE TRANSFERT ── */}
      {view === 'transfer' && selectedStudent && (
        <div>
          <button onClick={() => { setView('list'); setSelectedStudent(null); }} className="text-sm text-indigo-600 hover:underline mb-4 flex items-center gap-1">← Retour</button>

          {done ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <div className="text-xl font-bold text-green-800">Transfert effectué avec succès !</div>
              <div className="text-green-600 text-sm mt-1">Le dossier de l'élève a été mis à jour automatiquement.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {/* Gauche : info élève */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-4">👤 Élève à transférer</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                      <div className="text-sm text-gray-500">Matricule : {selectedStudent.registration_number || '—'}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Établissement actuel</span>
                      <span className="font-medium text-gray-800">{schoolName(selectedStudent.school_id)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">Classe actuelle</span>
                      <span className="font-medium text-gray-800">{classroomName(selectedStudent.classroom_id)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-indigo-50 rounded-xl">
                      <span className="text-indigo-600">💰 Solde portefeuille</span>
                      <span className="font-bold text-indigo-700">{(selectedStudent.wallet_balance || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {(selectedStudent.previous_school_ids || []).length > 0 && (
                      <div className="p-2.5 bg-amber-50 rounded-xl">
                        <div className="text-xs text-amber-700 font-medium mb-1">Établissements précédents :</div>
                        {(selectedStudent.previous_school_ids || []).map(id => (
                          <div key={id} className="text-xs text-amber-600">• {schoolName(id)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Droite : formulaire */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><ArrowRight size={16} className="text-violet-600" /> Destination</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Établissement destination *</label>
                      <select value={form.to_school_id} onChange={e => setForm(f => ({ ...f, to_school_id: e.target.value, to_classroom_id: '' }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Choisir un établissement --</option>
                        {schools.filter(s => s.id !== selectedStudent.school_id).map(s => (
                          <option key={s.id} value={s.id}>{s.name} — {s.city || '?'}</option>
                        ))}
                      </select>
                    </div>
                    {form.to_school_id && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Classe destination (optionnel)</label>
                        <select value={form.to_classroom_id} onChange={e => setForm(f => ({ ...f, to_classroom_id: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">-- Choisir une classe --</option>
                          {destClassrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level || c.cycle || ''})</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Raison du transfert</label>
                      <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {['Déménagement','Changement de cycle','Raison familiale','Raison médicale','Exclusion','Autre'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Notes / Commentaires</label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                        placeholder="Informations supplémentaires..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                  </div>
                </div>

                {/* Options portefeuille & frais */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-3">⚙️ Options de transition</h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
                      <input type="checkbox" checked={form.transfer_wallet} onChange={e => setForm(f => ({ ...f, transfer_wallet: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded accent-indigo-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">💰 Transférer le solde du portefeuille</div>
                        <div className="text-xs text-gray-500">
                          {(selectedStudent.wallet_balance || 0).toLocaleString('fr-FR')} FCFA seront disponibles sur le nouveau site
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
                      <input type="checkbox" checked={form.carry_fees} onChange={e => setForm(f => ({ ...f, carry_fees: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded accent-indigo-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">📋 Reporter les frais déjà payés</div>
                        <div className="text-xs text-gray-500">Les paiements effectués dans l'ancien site sont pris en compte — pas de double paiement</div>
                      </div>
                    </label>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                      <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Le dossier scolaire (notes, présences, devoirs, santé) de l'élève reste accessible depuis tous les sites du réseau. Le matricule <strong>{selectedStudent.registration_number || '—'}</strong> reste inchangé.</p>
                    </div>
                  </div>
                </div>

                <button onClick={executeTransfer} disabled={!form.to_school_id || processing}
                  className="w-full bg-violet-600 text-white py-3 rounded-2xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {processing ? 'Traitement en cours...' : <><ArrowRight size={18} /> Confirmer le transfert</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {view === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="font-bold text-gray-800">Historique des transferts inter-sites</span>
            <span className="ml-3 text-xs text-gray-400">{transfers.length} transfert(s)</span>
          </div>
          {transfers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Aucun transfert enregistré</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Élève', 'Matricule', 'De', 'Vers', 'Raison', 'Date', 'Portefeuille', 'Statut'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transfers.map(t => {
                  const student = students.find(s => s.id === t.student_id);
                  return (
                    <tr key={t.id} className="hover:bg-violet-50 transition-all">
                      <td className="px-4 py-3 font-medium text-gray-800">{student ? `${student.first_name} ${student.last_name}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{student?.registration_number || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{schoolName(t.from_school_id)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-violet-700">{schoolName(t.to_school_id)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.reason}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{t.transfer_date}</td>
                      <td className="px-4 py-3 text-xs font-medium text-indigo-600">
                        {t.wallet_transferred > 0 ? `${t.wallet_transferred.toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
