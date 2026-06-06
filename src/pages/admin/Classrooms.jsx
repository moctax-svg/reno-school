import React, { useState, useEffect } from 'react';
import { Classroom, Teacher, School } from '../../api/entities';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

const CYCLE_LEVELS = {
  'Crèche':            ['Poupons (0-1 an)', 'Bébés (1-2 ans)', 'Grands (2-3 ans)'],
  'Maternelle':        ['Petite Section (PS)', 'Moyenne Section (MS)', 'Grande Section (GS)'],
  'Primaire':          ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  'Collège':           ['6ème', '5ème', '4ème', '3ème'],
  'Lycée':             ['2nde', '1ère A', '1ère D', '1ère C', 'Terminale A', 'Terminale D', 'Terminale C'],
  'Supérieur':         ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'],
  'Autre':             [],
};

const CYCLE_COLORS = {
  'Crèche':     'bg-orange-100 text-orange-700',
  'Maternelle': 'bg-pink-100 text-pink-700',
  'Primaire':   'bg-green-100 text-green-700',
  'Collège':    'bg-indigo-100 text-indigo-700',
  'Lycée':      'bg-violet-100 text-violet-700',
  'Supérieur':  'bg-cyan-100 text-cyan-700',
  'Autre':      'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = {
  name: '', level: '', cycle: 'Collège', capacity: 30, main_teacher_id: '', room: '', section: '', school_id: ''
};

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCycle, setFilterCycle] = useState('Tous');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [cl, t, sc] = await Promise.all([Classroom.list(), Teacher.list(), School.list()]);
      setClassrooms(cl);
      setTeachers(t);
      if (sc.length > 0) {
        setSchool(sc[0]);
        setForm(f => ({ ...f, school_id: sc[0].id }));
      }
    } catch (e) {}
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, school_id: school?.id || '' });
    setShowForm(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      name: c.name || '', level: c.level || '', cycle: c.cycle || 'Collège',
      capacity: c.capacity || 30, main_teacher_id: c.main_teacher_id || '',
      room: c.room || '', section: c.section || '', school_id: c.school_id || school?.id || ''
    });
    setShowForm(true);
  }

  async function save() {
    try {
      if (editing) await Classroom.update(editing.id, form);
      else await Classroom.create(form);
      setShowForm(false);
      load();
    } catch (e) { alert('Erreur : ' + e.message); }
  }

  async function remove(id) {
    if (!confirm('Supprimer cette classe ? Les élèves liés ne seront pas supprimés.')) return;
    await Classroom.delete(id);
    load();
  }

  function autoName() {
    if (form.level && form.section) {
      setForm(f => ({ ...f, name: `${f.level} ${f.section}` }));
    }
  }

  const cycles = ['Tous', ...Object.keys(CYCLE_LEVELS)];
  const filtered = filterCycle === 'Tous' ? classrooms : classrooms.filter(c => c.cycle === filterCycle);

  // Grouper par cycle
  const grouped = {};
  filtered.forEach(c => {
    const key = c.cycle || 'Non défini';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cycles.map(c => (
            <button key={c} onClick={() => setFilterCycle(c)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterCycle === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 whitespace-nowrap">
          <Plus size={16} /> Nouvelle classe
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total classes', val: classrooms.length, emoji: '🏫' },
          { label: 'Cycles actifs', val: Object.keys(grouped).length, emoji: '📚' },
          { label: 'Capacité totale', val: classrooms.reduce((s, c) => s + (c.capacity || 0), 0), emoji: '👥' },
          { label: 'Sans titulaire', val: classrooms.filter(c => !c.main_teacher_id).length, emoji: '⚠️' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-xl font-bold text-gray-800">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste groupée par cycle */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">🏫</div>
          <div className="font-medium">Aucune classe enregistrée</div>
          <button onClick={openCreate} className="mt-3 text-sm text-indigo-600 hover:underline">Créer la première classe</button>
        </div>
      ) : Object.entries(grouped).map(([cycle, classes]) => (
        <div key={cycle}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-xl text-sm font-bold ${CYCLE_COLORS[cycle] || 'bg-gray-100 text-gray-700'}`}>
              {cycle}
            </span>
            <span className="text-xs text-gray-400">{classes.length} classe(s)</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {classes.map(c => {
              const teacher = teachers.find(t => t.id === c.main_teacher_id);
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.level} {c.section && `· Section ${c.section}`}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${CYCLE_COLORS[c.cycle] || 'bg-gray-100 text-gray-700'}`}>
                      {c.cycle || '—'}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={13} className="text-gray-400" />
                      <span>Capacité : <strong>{c.capacity || '—'}</strong> élèves</span>
                    </div>
                    {c.room && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>🚪</span> Salle : <strong>{c.room}</strong>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>👨‍🏫</span>
                      {teacher
                        ? <span>{teacher.first_name} {teacher.last_name}</span>
                        : <span className="text-amber-600 text-xs">Aucun titulaire</span>
                      }
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-sm transition-all">
                      <Edit size={13} /> Modifier
                    </button>
                    <button onClick={() => remove(c.id)}
                      className="flex items-center justify-center p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-5">
              {editing ? '✏️ Modifier la classe' : '🏫 Nouvelle classe'}
            </h3>

            <div className="space-y-4">
              {/* Cycle */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Cycle d'enseignement *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(CYCLE_LEVELS).map(c => (
                    <button key={c} type="button" onClick={() => { setForm(f => ({ ...f, cycle: c, level: '' })); }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${form.cycle === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Niveau */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Niveau *</label>
                {CYCLE_LEVELS[form.cycle]?.length > 0 ? (
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Choisir un niveau --</option>
                    {CYCLE_LEVELS[form.cycle].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <input value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    placeholder="Ex: Licence Informatique"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                )}
              </div>

              {/* Section + auto-nom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section / Groupe</label>
                  <input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                    placeholder="A, B, C..."
                    onBlur={autoName}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom affiché *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: 6ème A"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 font-semibold" />
                </div>
              </div>

              {/* Capacité & Salle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Capacité (élèves)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Salle / Bâtiment</label>
                  <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                    placeholder="Ex: Salle 12, Bât A"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Enseignant principal */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Enseignant titulaire / principal</label>
                <select value={form.main_teacher_id} onChange={e => setForm(f => ({ ...f, main_teacher_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Aucun titulaire --</option>
                  {teachers.filter(t => t.status === 'Active').map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} {t.subject ? `(${t.subject})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={save}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">
                {editing ? 'Mettre à jour' : 'Créer la classe'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
