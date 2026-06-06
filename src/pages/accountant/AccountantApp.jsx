import Layout from '../../components/Layout';
import React, { useState, useEffect } from 'react';
import { Fee, Student, School, WalletTransaction } from '../../api/entities';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, CreditCard, AlertTriangle, TrendingUp, DollarSign, Users } from 'lucide-react';
import FinancialReports from './FinancialReports';
import { CashValidationModule, DirectCashEntry } from './WalletPayment';
import FamilyDiscounts from './FamilyDiscounts';

const fmt = n => (n || 0).toLocaleString('fr-FR') + ' F';

/* ─── Dashboard ─── */
function AccountantDashboard({ fees, pendingCount }) {
  const totalDue    = fees.reduce((s, f) => s + (f.amount_due || 0), 0);
  const totalPaid   = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalLeft   = totalDue - totalPaid;
  const paidCount   = fees.filter(f => f.status === 'Paid').length;
  const unpaidCount = fees.filter(f => f.status === 'Unpaid' || f.status === 'Overdue').length;

  const chartData = [
    { month: 'Jan', collecté: 850000 },
    { month: 'Fév', collecté: 920000 },
    { month: 'Mar', collecté: 1100000 },
    { month: 'Avr', collecté: 780000 },
    { month: 'Mai', collecté: totalPaid || 950000 },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total collecté',    value: fmt(totalPaid), icon: '✅', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100' },
          { label: 'Reste à collecter', value: fmt(totalLeft), icon: '⏳', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100' },
          { label: 'Frais payés',       value: paidCount,      icon: '📄', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
          { label: 'En attente valid.', value: pendingCount,   icon: '🕐', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl p-5`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">📊 Collectes mensuelles</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v/1000) + 'k'} />
            <Tooltip formatter={v => fmt(v)} />
            <Bar dataKey="collecté" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition statuts */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Répartition des frais</h3>
        <div className="space-y-3">
          {[
            { label: 'Payés intégralement', count: paidCount, color: '#059669', bg: '#d1fae5' },
            { label: 'En attente validation', count: pendingCount, color: '#d97706', bg: '#fef3c7' },
            { label: 'Impayés', count: unpaidCount, color: '#dc2626', bg: '#fee2e2' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-700 w-48">{item.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full" style={{ width: fees.length ? `${item.count / fees.length * 100}%` : '0%', background: item.color }} />
              </div>
              <div className="text-sm font-bold text-gray-700 w-8 text-right">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ─── */

/* ─── Vue portefeuilles élèves (côté comptable) ─── */
function WalletOverview({ students }) {
  const [walletTxs, setWalletTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('balance_desc');

  useEffect(() => {
    WalletTransaction.list().then(setWalletTxs).catch(() => {});
  }, []);

  const studentsWithWallet = students
    .filter(s => (s.wallet_balance || 0) > 0 || (s.wallet_total_credited || 0) > 0)
    .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...studentsWithWallet].sort((a, b) => {
    if (sortBy === 'balance_desc') return (b.wallet_balance || 0) - (a.wallet_balance || 0);
    if (sortBy === 'balance_asc')  return (a.wallet_balance || 0) - (b.wallet_balance || 0);
    if (sortBy === 'name')         return a.last_name.localeCompare(b.last_name);
    return 0;
  });

  const totalInWallets = students.reduce((s, st) => s + (st.wallet_balance || 0), 0);
  const totalCredited   = students.reduce((s, st) => s + (st.wallet_total_credited || 0), 0);
  const recentTxs = walletTxs
    .filter(t => t.type === 'credit')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <div className="text-indigo-400 text-xs mb-1">Total dans les portefeuilles</div>
          <div className="text-2xl font-bold text-indigo-700">{fmt(totalInWallets)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <div className="text-green-400 text-xs mb-1">Total rechargé (cumul)</div>
          <div className="text-2xl font-bold text-green-700">{fmt(totalCredited)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="text-amber-400 text-xs mb-1">Élèves avec portefeuille actif</div>
          <div className="text-2xl font-bold text-amber-700">{studentsWithWallet.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Liste élèves */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un élève..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
              <option value="balance_desc">Solde ↓</option>
              <option value="balance_asc">Solde ↑</option>
              <option value="name">Nom</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Aucun portefeuille actif</div>
              ) : sorted.map(s => {
                const credited = s.wallet_total_credited || 0;
                const balance  = s.wallet_balance || 0;
                const spent    = credited - balance;
                const pct      = credited > 0 ? (spent / credited) * 100 : 0;

                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{s.first_name} {s.last_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bg-gray-100 rounded-full h-1.5 flex-1">
                          <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct.toFixed(0)}% utilisé</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-indigo-700">{fmt(balance)}</div>
                      <div className="text-xs text-gray-400">Rechargé : {fmt(credited)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dernières recharges */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-700 text-sm">Dernières recharges</div>
            <div className="divide-y divide-gray-50">
              {recentTxs.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">Aucune recharge</div>
              ) : recentTxs.map((t, i) => {
                const stu = students.find(s => s.id === t.student_id);
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{stu ? `${stu.first_name} ${stu.last_name}` : '—'}</div>
                        <div className="text-xs text-gray-400">{t.payment_method} · {t.date || t.created_date?.split('T')[0]}</div>
                      </div>
                      <div className="text-sm font-bold text-green-600">+{fmt(t.amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountantApp({ onLogout, user }) {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [f, s, sc] = await Promise.all([Fee.list(), Student.list(), School.list()]);
      setFees(f);
      setStudents(s);
      setSchool(sc[0] || null);
    } catch (e) {}
    setLoading(false);
  }

  const pendingCount = fees.filter(f => f.payment_status === 'PendingValidation').length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: '📊',
      component: <AccountantDashboard fees={fees} pendingCount={pendingCount} />,
    },
    {
      id: 'validation',
      label: pendingCount > 0 ? `Validations (${pendingCount})` : 'Validations cash',
      icon: pendingCount > 0 ? '🔔' : '✅',
      component: (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Paiements cash déclarés par les parents
            </h3>
            <p className="text-sm text-gray-500">Ces paiements ont été saisis par les parents depuis leur application. Vérifiez le n° de reçu et validez.</p>
          </div>
          <CashValidationModule fees={fees} students={students} school={school} onValidated={load} />
        </div>
      ),
    },
    {
      id: 'direct',
      label: 'Saisie directe',
      icon: '💵',
      component: (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-500" />
              Paiement reçu au guichet
            </h3>
            <p className="text-sm text-gray-500">Le parent paye en espèces directement ici. Saisissez le montant et le n° de reçu pour imputer immédiatement.</p>
          </div>
          <DirectCashEntry fees={fees} students={students} school={school} onSaved={load} />
        </div>
      ),
    },
    {
      id: 'discounts',
      label: 'Remises familles',
      icon: '🎟️',
      component: <FamilyDiscounts userRole="accountant" userName={user?.userName || 'Comptable'} />,
    },
    {
      id: 'wallets',
      label: 'Portefeuilles',
      icon: '💰',
      component: <WalletOverview students={students} />,
    },
    {
      id: 'fees',
      label: 'Tous les frais',
      icon: '📋',
      component: <AllFeesTable fees={fees} students={students} reload={load} />,
    },
    {
      id: 'reports',
      label: 'Rapports financiers',
      icon: '📈',
      component: <FinancialReports />,
    },
  ];

  return (
    <Layout
      role="accountant"
      menuItems={menuItems}
      onLogout={onLogout}
      userName={user?.userName}
      schoolName="RENO"
    />
  );
}

/* ─── Tableau complet des frais ─── */
function AllFeesTable({ fees, students, reload }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = fees.filter(f => {
    const s = students.find(st => st.id === f.student_id);
    const name = s ? `${s.first_name} ${s.last_name}` : '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || (f.receipt_number || '').includes(search);
    const matchStatus = filterStatus === 'All' || f.status === filterStatus || (filterStatus === 'PendingValidation' && f.payment_status === 'PendingValidation');
    return matchSearch && matchStatus;
  });

  const statusColor = {
    Paid:    'bg-green-100 text-green-700',
    Pending: 'bg-amber-100 text-amber-700',
    Partial: 'bg-blue-100 text-blue-700',
    Unpaid:  'bg-red-100 text-red-700',
    Overdue: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par élève ou n° reçu..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none">
          <option value="All">Tous les statuts</option>
          <option value="Paid">Payé</option>
          <option value="Partial">Partiel</option>
          <option value="Unpaid">Impayé</option>
          <option value="Overdue">En retard</option>
          <option value="PendingValidation">⏳ En attente validation</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} résultat(s)</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Élève', 'Type', 'Dû', 'Payé', 'Reste', 'Statut', 'N° Reçu', 'Date', 'Mode'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Aucun résultat</td></tr>
              ) : filtered.map(f => {
                const s = students.find(st => st.id === f.student_id);
                const left = (f.amount_due || 0) - (f.amount_paid || 0);
                const isPending = f.payment_status === 'PendingValidation';
                return (
                  <tr key={f.id} className={`hover:bg-gray-50 transition-all ${isPending ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {s ? `${s.first_name} ${s.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.fee_type}</td>
                    <td className="px-4 py-3">{fmt(f.amount_due)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{fmt(f.amount_paid)}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: left > 0 ? '#dc2626' : '#059669' }}>{fmt(left)}</td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">⏳ En validation</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusColor[f.status] || 'bg-gray-100 text-gray-600'}`}>{f.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {f.receipt_number || (isPending ? <span className="text-amber-600">{f.pending_receipt} (non validé)</span> : '—')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{f.payment_date || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{f.payment_method || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
