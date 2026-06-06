import Layout from '../../components/Layout';
import React, { useState, useEffect } from 'react';
import { SecurityLog, Student } from '../../api/entities';
import { LogIn, LogOut, Search, AlertTriangle } from 'lucide-react';

export default function SecurityApp({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ person_name: '', person_type: 'Student', action: 'Entry', gate: 'Entrée principale', notes: '', student_id: '' });
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([SecurityLog.list(), Student.list()]);
      setLogs(l.reverse()); setStudents(s);
    } catch (e) {}
    setLoading(false);
  }

  async function saveLog() {
    try {
      await SecurityLog.create({ ...form, timestamp: new Date().toISOString() });
      setShowForm(false);
      setForm({ person_name: '', person_type: 'Student', action: 'Entry', gate: 'Entrée principale', notes: '', student_id: '' });
      load();
    } catch (e) { alert(e.message); }
  }

  async function quickAction(student, action) {
    try {
      await SecurityLog.create({ student_id: student.id, person_name: `${student.first_name} ${student.last_name}`, person_type: 'Student', action, gate: 'Entrée principale', timestamp: new Date().toISOString() });
      load();
    } catch (e) { alert(e.message); }
  }

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp && l.timestamp.startsWith(today));
  const entries = todayLogs.filter(l => l.action === 'Entry').length;
  const exits = todayLogs.filter(l => l.action === 'Exit').length;
  const inside = entries - exits;

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const menu = [
    { id: 'dashboard', label: 'Contrôle d\'accès', icon: '🔐' },
    { id: 'logs', label: 'Journal des accès', icon: '📋' },
    { id: 'scan', label: 'Enregistrement rapide', icon: '⚡' },
  ];

  const menuItems = [
    { id: 'dashboard', label: "Contrôle d'accès",      icon: '🔐', component: <SecurityDashboard entries={entries} exits={exits} inside={inside} todayLogs={todayLogs} /> },
    { id: 'logs',      label: 'Journal des accès',     icon: '📋', component: <SecurityLogs logs={logs} /> },
    { id: 'scan',      label: 'Enregistrement rapide', icon: '⚡', component: <SecurityScan students={students} search={search} setSearch={setSearch} filteredStudents={filteredStudents} quickAction={quickAction} /> },
  ];

  return (
    <>
      <Layout role="security" menuItems={menuItems} onLogout={onLogout} schoolName="RENO" />
      <button
        onClick={() => setShowForm(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}
        className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-2xl font-medium shadow-2xl hover:bg-red-700 transition-all"
      >
        <LogIn size={18} /> Enregistrer entrée/sortie
      </button>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">🔐 Enregistrer une entrée/sortie</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nom de la personne</label>
                <input value={form.person_name} onChange={e => setForm({...form, person_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.person_type} onChange={e => setForm({...form, person_type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    <option>Student</option><option>Parent</option><option>Staff</option><option>Visitor</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
                  <select value={form.action} onChange={e => setForm({...form, action: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    <option>Entry</option><option>Exit</option><option>Unauthorized</option>
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Porte</label>
                <select value={form.gate} onChange={e => setForm({...form, gate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option>Entrée principale</option><option>Entrée secondaire</option><option>Sortie de secours</option>
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveLog} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium">Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SecurityDashboard({ entries, exits, inside, todayLogs }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Entrées aujourd'hui", value: entries, color: 'text-green-600', bg: 'bg-green-50', icon: '🟢' },
          { label: "Sorties aujourd'hui", value: exits,   color: 'text-red-600',   bg: 'bg-red-50',   icon: '🔴' },
          { label: "Présents actuellement", value: Math.max(0, inside), color: 'text-blue-600', bg: 'bg-blue-50', icon: '🔵' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-4xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-800">Derniers mouvements</div>
        {todayLogs.slice(0, 10).map((l, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 hover:bg-gray-50">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${l.action === 'Entry' ? 'bg-green-100 text-green-700' : l.action === 'Exit' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{l.action}</span>
            <span className="font-medium text-gray-800 flex-1">{l.person_name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{l.gate}</span>
            <span className="text-xs text-gray-400">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityLogs({ logs }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-gray-800">Journal des accès</span>
        <span className="text-xs text-gray-400">{logs.length} entrée(s)</span>
      </div>
      <div className="divide-y divide-gray-50">
        {logs.slice(0, 50).map((l, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${l.action === 'Entry' ? 'bg-green-100 text-green-700' : l.action === 'Exit' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{l.action === 'Entry' ? '→ Entrée' : l.action === 'Exit' ? '← Sortie' : '⚠️ Refusé'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm">{l.person_name}</div>
              <div className="text-xs text-gray-400">{l.person_type} · {l.gate}</div>
            </div>
            <div className="text-xs text-gray-400 text-right">
              {l.timestamp ? new Date(l.timestamp).toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityScan({ students, search, setSearch, filteredStudents, quickAction }) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white shadow-sm" />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>
      <div className="space-y-2">
        {filteredStudents.slice(0, 20).map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
              {s.first_name?.[0]}{s.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800">{s.first_name} {s.last_name}</div>
              <div className="text-xs text-gray-400">{s.registration_number || '—'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => quickAction(s, 'Entry')} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200">→ Entrée</button>
              <button onClick={() => quickAction(s, 'Exit')}  className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200">← Sortie</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
