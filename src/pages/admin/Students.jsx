import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Student, Classroom } from '../../api/entities';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: 'Male',
    registration_number: '', enrollment_date: '', status: 'Active',
    classroom_id: '', photo_url: '',
    parent_name: '', parent_phone: '', parent_email: '', parent_address: ''
  });

  useEffect(() => { 
    load(); 
    Classroom.list().then(setClassrooms).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try { setStudents(await Student.list()); } catch (e) {}
    setLoading(false);
  }

  async function save() {
    try {
      if (editing) await Student.update(editing.id, form);
      else await Student.create(form);
      setShowForm(false); setEditing(null);
      setForm({ first_name: '', last_name: '', date_of_birth: '', gender: 'Male', registration_number: '', enrollment_date: '', status: 'Active', classroom_id: '', photo_url: '', parent_name: '', parent_phone: '', parent_email: '', parent_address: '' });
      load();
    } catch (e) { alert('Erreur: ' + e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer cet élève ?')) return;
    await Student.delete(id); load();
  }

  function edit(s) {
    setEditing(s);
    setForm({ first_name: s.first_name||'', last_name: s.last_name||'', date_of_birth: s.date_of_birth||'', gender: s.gender||'Male', registration_number: s.registration_number||'', enrollment_date: s.enrollment_date||'', status: s.status||'Active', classroom_id: s.classroom_id||'', photo_url: s.photo_url||'', parent_name: s.parent_name||'', parent_phone: s.parent_phone||'', parent_email: s.parent_email||'', parent_address: s.parent_address||'' });
    setShowForm(true);
  }

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.registration_number||'').includes(search)
  );

  const statusColor = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-gray-100 text-gray-600', Graduated: 'bg-blue-100 text-blue-700', Transferred: 'bg-orange-100 text-orange-700' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Élève', 'N° Matricule', 'Genre', 'Parent', 'Contact', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucun élève trouvé</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs">
                      {(s.first_name||'?')[0]}{(s.last_name||'?')[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-gray-400">{s.date_of_birth}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.registration_number || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.gender === 'Male' ? '♂ Masculin' : '♀ Féminin'}</td>
                <td className="px-4 py-3 text-gray-700">{s.parent_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{s.parent_phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => edit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => remove(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{filtered.length} élève(s)</div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-5">{editing ? 'Modifier' : 'Nouvel'} élève</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'first_name', label: 'Prénom' }, { key: 'last_name', label: 'Nom' },
                { key: 'date_of_birth', label: 'Date de naissance', type: 'date' },
                { key: 'registration_number', label: 'N° Matricule' },
                { key: 'enrollment_date', label: 'Date d\'inscription', type: 'date' },
                { key: 'parent_name', label: 'Nom du parent' },
                { key: 'parent_phone', label: 'Tél. parent' },
                { key: 'parent_email', label: 'Email parent', type: 'email' },
                { key: 'parent_address', label: 'Adresse parent' },
              ].map(f => (
                <div key={f.key} className={f.key === 'parent_address' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Genre</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Male">Masculin</option><option value="Female">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Active</option><option>Inactive</option><option>Graduated</option><option>Transferred</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">Enregistrer</button>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
