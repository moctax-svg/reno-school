import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Teacher } from '../../api/entities';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', subject: '', hire_date: '', status: 'Active' });

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setTeachers(await Teacher.list()); } catch (e) {}
    setLoading(false);
  }
  async function save() {
    try {
      if (editing) await Teacher.update(editing.id, form);
      else await Teacher.create(form);
      setShowForm(false); setEditing(null); load();
    } catch (e) { alert(e.message); }
  }
  async function remove(id) {
    if (!confirm('Supprimer ?')) return;
    await Teacher.delete(id); load();
  }
  function edit(t) {
    setEditing(t);
    setForm({ first_name: t.first_name||'', last_name: t.last_name||'', email: t.email||'', phone: t.phone||'', subject: t.subject||'', hire_date: t.hire_date||'', status: t.status||'Active' });
    setShowForm(true);
  }
  const filtered = teachers.filter(t => `${t.first_name} ${t.last_name} ${t.subject}`.toLowerCase().includes(search.toLowerCase()));
  const statusColor = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-gray-100 text-gray-600', 'On Leave': 'bg-orange-100 text-orange-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => { setEditing(null); setForm({ first_name: '', last_name: '', email: '', phone: '', subject: '', hire_date: '', status: 'Active' }); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 text-center text-gray-400 py-8">Chargement...</div>
          : filtered.length === 0 ? <div className="col-span-3 text-center text-gray-400 py-8">Aucun enseignant</div>
          : filtered.map(t => (
          <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                {(t.first_name||'?')[0]}{(t.last_name||'?')[0]}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{t.first_name} {t.last_name}</div>
                <div className="text-xs text-indigo-600 font-medium">{t.subject || 'Matière non définie'}</div>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <div>📧 {t.email || '—'}</div>
              <div>📞 {t.phone || '—'}</div>
              <div>📅 Embauché: {t.hire_date || '—'}</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor[t.status] || 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
              <div className="flex gap-2">
                <button onClick={() => edit(t)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                <button onClick={() => remove(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">{editing ? 'Modifier' : 'Nouvel'} enseignant</h3>
            <div className="space-y-3">
              {[{ key: 'first_name', label: 'Prénom' }, { key: 'last_name', label: 'Nom' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Téléphone' }, { key: 'subject', label: 'Matière enseignée' }, { key: 'hire_date', label: 'Date d\'embauche', type: 'date' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option>Active</option><option>Inactive</option><option>On Leave</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">Enregistrer</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
