import React, { useState, useEffect } from 'react';
import { Fee, Student, Classroom } from '../../api/entities';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';
import { useSchool } from '../../hooks/useSchool';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Printer, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const FEE_COLORS = {
  Scolarité: '#6d28d9',
  Inscription: '#0284c7',
  Transport: '#059669',
  Cantine: '#d97706',
  Activités: '#db2777',
  Uniforme: '#7c3aed',
  Autre: '#64748b',
};

function fmt(n) { return (n || 0).toLocaleString('fr-FR') + ' F'; }

/* ─── Reçu de paiement imprimable ─── */
function Receipt({ fee, student, school }) {
  const color = school?.header_color || '#1e3a5f';
  return (
    <div id="doc-receipt" style={{ fontFamily: 'Arial, sans-serif', maxWidth: 500, margin: '0 auto', background: 'white', padding: 36, border: '2px dashed #e2e8f0', borderRadius: 12 }}>
      <DocumentHeader school={school} documentTitle="REÇU DE PAIEMENT" documentSubtitle={`N° ${fee.receipt_number || '—'}`} />

      {/* Élève */}
      <div style={{ background: color + '10', border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 }}>Élève</div>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>{student?.last_name?.toUpperCase()} {student?.first_name}</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>Matricule : {student?.registration_number || '—'}</div>
      </div>

      {/* Détails paiement */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
        <tbody>
          {[
            ['Type de frais', fee.fee_type],
            ['Montant total dû', fmt(fee.amount_due)],
            ['Montant payé', fmt(fee.amount_paid)],
            ['Reste à payer', fmt((fee.amount_due || 0) - (fee.amount_paid || 0))],
            ['Date de paiement', fee.payment_date || '—'],
            ['Mode de paiement', fee.payment_method || '—'],
            ['Statut', fee.status],
          ].map(([k, v], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 10px', color: '#475569', fontWeight: 'bold' }}>{k}</td>
              <td style={{ padding: '7px 10px', color: '#0f172a', fontWeight: k === 'Montant payé' ? 'bold' : 'normal', color: k === 'Montant payé' ? '#059669' : k === 'Reste à payer' && (fee.amount_due - fee.amount_paid) > 0 ? '#dc2626' : '#0f172a' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        {['Signature du comptable', 'Signature du parent / Élève'].map((l, i) => (
          <div key={i} style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 8px' }}>
            <div style={{ height: 36 }}></div>
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 5, fontSize: 9, color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '2px solid ' + color, paddingTop: 8, marginTop: 16, textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>
        {school?.name || 'École'} · {school?.footer_text || 'Reçu officiel'} · Généré le {new Date().toLocaleDateString('fr-FR')} · RENO
      </div>
    </div>
  );
}

export default function FinancialReports() {
  const { school } = useSchool();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [view, setView] = useState('overview'); // overview | bytype | bystatus | receipt

  useEffect(() => {
    Promise.all([Fee.list(), Student.list(), Classroom.list()])
      .then(([f, s, c]) => { setFees(f); setStudents(s); setClassrooms(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-white rounded-2xl p-10 text-center text-gray-400">Chargement des rapports...</div>;

  /* ─── Calculs ─── */
  const totalDue = fees.reduce((s, f) => s + (f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalPending = totalDue - totalPaid;
  const paidFees = fees.filter(f => f.status === 'Paid');
  const overdueFees = fees.filter(f => f.status === 'Overdue');
  const partialFees = fees.filter(f => f.status === 'Partial');

  // By type
  const byType = Object.entries(
    fees.reduce((acc, f) => {
      acc[f.fee_type] = acc[f.fee_type] || { due: 0, paid: 0 };
      acc[f.fee_type].due += f.amount_due || 0;
      acc[f.fee_type].paid += f.amount_paid || 0;
      return acc;
    }, {})
  ).map(([type, v]) => ({ type, ...v, taux: v.due ? Math.round(v.paid / v.due * 100) : 0 }));

  // By status pie
  const byStatus = [
    { name: 'Payé', value: paidFees.length, color: '#10b981' },
    { name: 'En attente', value: fees.filter(f => f.status === 'Pending').length, color: '#f59e0b' },
    { name: 'En retard', value: overdueFees.length, color: '#ef4444' },
    { name: 'Partiel', value: partialFees.length, color: '#6d28d9' },
  ].filter(d => d.value > 0);

  // Monthly evolution (simulated from payment dates)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const month = d.toISOString().substring(0, 7);
    const monthFees = fees.filter(f => (f.payment_date || '').startsWith(month));
    return { label, collecté: monthFees.reduce((s, f) => s + (f.amount_paid || 0), 0) };
  });

  // Overdue students
  const overdueStudents = overdueFees.map(f => {
    const s = students.find(st => st.id === f.student_id);
    return { fee: f, student: s };
  });

  function printReceipt() {
    const content = document.getElementById('doc-receipt');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Reçu</title><style>@media print{body{margin:0}} @page{size:A5;margin:8mm}</style></head><body>${content.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { id: 'overview', label: '📊 Vue générale' },
            { id: 'bytype', label: '🏷️ Par type' },
            { id: 'bystatus', label: '🔄 Par statut' },
            { id: 'receipt', label: '🧾 Reçu' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={printReport} className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-amber-600">
          <Printer size={14} /> Imprimer le rapport
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total attendu', value: fmt(totalDue), color: 'text-gray-800', bg: 'bg-gray-50', icon: '💰', border: 'border-gray-200' },
          { label: 'Total collecté', value: fmt(totalPaid), color: 'text-green-700', bg: 'bg-green-50', icon: '✅', border: 'border-green-200' },
          { label: 'Reste à collecter', value: fmt(totalPending), color: 'text-red-700', bg: 'bg-red-50', icon: '⏳', border: 'border-red-200' },
          { label: 'Taux de collecte', value: totalDue ? `${Math.round(totalPaid / totalDue * 100)}%` : '—', color: 'text-violet-700', bg: 'bg-violet-50', icon: '📈', border: 'border-violet-200' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Evolution mensuelle */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">📈 Évolution des encaissements</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Line type="monotone" dataKey="collecté" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par statut */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">🔄 Répartition par statut</h3>
            {byStatus.length === 0
              ? <div className="text-center text-gray-400 py-8">Aucune donnée</div>
              : <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Élèves en retard */}
          {overdueStudents.length > 0 && (
            <div className="col-span-2 bg-red-50 border border-red-100 rounded-2xl p-5">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <AlertCircle size={16} /> {overdueStudents.length} élève(s) en retard de paiement
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {overdueStudents.slice(0, 6).map(({ fee, student }, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-100">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{student?.first_name} {student?.last_name}</div>
                      <div className="text-xs text-gray-500">{fee.fee_type} · Éch. {fee.due_date || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{fmt((fee.amount_due || 0) - (fee.amount_paid || 0))}</div>
                      <div className="text-xs text-gray-400">reste</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'bytype' && (
        <div className="space-y-4">
          {/* Graphique */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">💳 Collecte par type de frais</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byType} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="due" name="Attendu" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Collecté" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Tableau */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Type de frais', 'Attendu', 'Collecté', 'Reste', 'Taux'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byType.length === 0
                  ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune donnée</td></tr>
                  : byType.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: FEE_COLORS[row.type] || '#64748b' }}></span>
                          <span className="font-medium text-gray-800">{row.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmt(row.due)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{fmt(row.paid)}</td>
                      <td className="px-4 py-3 text-red-600">{fmt(row.due - row.paid)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${row.taux}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${row.taux >= 80 ? 'text-green-600' : row.taux >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{row.taux}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-800">TOTAL</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{fmt(totalDue)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{fmt(totalPaid)}</td>
                  <td className="px-4 py-3 font-bold text-red-700">{fmt(totalPending)}</td>
                  <td className="px-4 py-3 font-bold text-amber-700">{totalDue ? Math.round(totalPaid / totalDue * 100) : 0}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {view === 'bystatus' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Liste détaillée par statut</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Élève', 'Type', 'Dû', 'Payé', 'Reste', 'Échéance', 'Statut', 'Reçu'].map(h =>
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fees.length === 0
                ? <tr><td colSpan={8} className="p-8 text-center text-gray-400">Aucun frais enregistré</td></tr>
                : [...fees].sort((a, b) => {
                  const order = { Overdue: 0, Partial: 1, Pending: 2, Paid: 3 };
                  return (order[a.status] || 0) - (order[b.status] || 0);
                }).map(f => {
                  const s = students.find(st => st.id === f.student_id);
                  const rest = (f.amount_due || 0) - (f.amount_paid || 0);
                  const statusStyle = { Paid: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', Overdue: 'bg-red-100 text-red-700', Partial: 'bg-blue-100 text-blue-700' };
                  return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800 text-xs">{s ? `${s.first_name} ${s.last_name}` : '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{f.fee_type}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{fmt(f.amount_due)}</td>
                      <td className="px-3 py-2.5 text-green-600 font-medium text-xs">{fmt(f.amount_paid)}</td>
                      <td className={`px-3 py-2.5 font-medium text-xs ${rest > 0 ? 'text-red-600' : 'text-gray-400'}`}>{fmt(rest)}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{f.due_date || '—'}</td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusStyle[f.status] || 'bg-gray-100'}`}>{f.status}</span></td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => { setSelectedFee(f); setView('receipt'); }}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium">🧾 Reçu</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'receipt' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-800">🧾 Reçu de paiement</h3>
              <p className="text-xs text-gray-400">Sélectionnez un paiement dans la liste "Par statut" ou choisissez ci-dessous</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={selectedFee?.id || ''} onChange={e => setSelectedFee(fees.find(f => f.id === e.target.value) || null)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="">— Choisir un paiement —</option>
                {fees.map(f => {
                  const s = students.find(st => st.id === f.student_id);
                  return <option key={f.id} value={f.id}>{s ? `${s.first_name} ${s.last_name}` : '?'} — {f.fee_type} — {fmt(f.amount_paid)}</option>;
                })}
              </select>
              {selectedFee && (
                <button onClick={printReceipt} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600">
                  <Printer size={15} /> Imprimer
                </button>
              )}
            </div>
          </div>
          {selectedFee ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <Receipt fee={selectedFee} student={students.find(s => s.id === selectedFee.student_id)} school={school} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-3">🧾</div>
              <p className="text-gray-500 font-medium">Sélectionnez un paiement pour générer le reçu</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
