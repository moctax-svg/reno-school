import React, { useState, useEffect } from 'react';
import { Schedule, Teacher, Subject, Classroom } from '../../api/entities';
import { Plus, Trash2, Clock, Grid } from 'lucide-react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-red-100 border-red-300 text-red-800',
];

function getColorForSubject(name) {
  if (!name) return COLORS[7];
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    day_of_week: 'Lundi', start_time: '08:00', end_time: '10:00',
    subject_id: '', teacher_id: '', classroom_id: '', room: '',
  });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [sc, t, sub, cl] = await Promise.all([Schedule.list(), Teacher.list(), Subject.list(), Classroom.list()]);
      setSchedules(sc);
      setTeachers(t);
      setSubjects(sub);
      setClassrooms(cl);
      if (cl.length > 0 && !selectedClass) setSelectedClass(cl[0].id);
    } catch (e) {}
    setLoading(false);
  }

  async function save() {
    if (!form.subject_id || !form.day_of_week) { alert('Matière et jour obligatoires.'); return; }
    setSaving(true);
    try {
      await Schedule.create({ ...form, classroom_id: selectedClass });
      setShowForm(false);
      setForm({ day_of_week: 'Lundi', start_time: '08:00', end_time: '10:00', subject_id: '', teacher_id: '', classroom_id: '', room: '' });
      await load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function deleteSlot(id) {
    if (!confirm('Supprimer ce créneau ?')) return;
    await Schedule.delete(id);
    load();
  }

  const filtered = schedules.filter(s => !selectedClass || s.classroom_id === selectedClass);
  const selectedClassObj = classrooms.find(c => c.id === selectedClass);

  // Build grid: day → hour → slot
  function getSlot(day, hour) {
    return filtered.find(s => {
      if (s.day_of_week !== day) return false;
      const start = s.start_time || '';
      const end = s.end_time || '';
      return start <= hour && hour < end;
    });
  }

  function getSubjectName(id) { return subjects.find(s => s.id === id)?.name || '—'; }
  function getTeacherName(id) { const t = teachers.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : ''; }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Classe</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium bg-white shadow-sm">
            {classrooms.length === 0 && <option value="">Aucune classe</option>}
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.level || ''}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setView('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'grid' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <Grid size={14} className="inline mr-1" />Grille
          </button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            📋 Liste
          </button>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm">
          <Plus size={16} /> Ajouter un créneau
        </button>
      </div>

      {classrooms.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center text-amber-800">
          <div className="text-3xl mb-2">🏫</div>
          <p className="font-medium">Aucune classe enregistrée</p>
          <p className="text-xs mt-1 text-amber-600">Ajoutez des classes dans la gestion des élèves pour commencer</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div>
      ) : view === 'grid' ? (
        /* ─── Vue grille ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">
              📅 Emploi du temps — {selectedClassObj?.name || ''}
              {selectedClassObj?.level && <span className="text-gray-400 font-normal ml-2">· {selectedClassObj.level}</span>}
            </h3>
            <button onClick={() => {
              const win = window.open('', '_blank');
              win.document.write(`<!DOCTYPE html><html><head><title>EDT — ${selectedClassObj?.name || ''}</title><style>body{font-family:Arial;padding:24px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #e2e8f0;padding:6px 10px;font-size:12px} th{background:#6d28d9;color:white}</style></head><body><h2>Emploi du temps — ${selectedClassObj?.name || ''}</h2>${document.getElementById('edt-grid')?.outerHTML || ''}</body></html>`);
              win.document.close();
              setTimeout(() => { win.focus(); win.print(); }, 300);
            }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              🖨️ Imprimer
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table id="edt-grid" className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="w-16 text-left py-2 px-3 text-gray-400 font-medium border border-gray-100 bg-gray-50">Heure</th>
                  {DAYS.map(d => (
                    <th key={d} className="py-2 px-3 text-center font-bold text-white bg-indigo-600 border border-indigo-500">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour, hi) => {
                  const isBreak = hour === '12:00';
                  return (
                    <tr key={hour} className={isBreak ? 'bg-amber-50' : hi % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                      <td className="py-2 px-3 text-gray-400 font-mono text-xs border border-gray-100 bg-gray-50 font-medium">{hour}</td>
                      {DAYS.map(day => {
                        const slot = getSlot(day, hour);
                        if (!slot) return (
                          <td key={day} className={`border border-gray-100 ${isBreak ? 'bg-amber-50 text-center text-amber-600 text-xs font-medium' : ''}`}>
                            {isBreak && day === 'Lundi' ? '🍽️ Pause déjeuner' : null}
                          </td>
                        );
                        const color = getColorForSubject(getSubjectName(slot.subject_id));
                        return (
                          <td key={day} className="border border-gray-100 p-1">
                            <div className={`rounded-lg border p-2 ${color} relative group`}>
                              <div className="font-bold text-xs truncate">{getSubjectName(slot.subject_id)}</div>
                              <div className="text-xs opacity-70 truncate">{getTeacherName(slot.teacher_id)}</div>
                              <div className="text-xs opacity-60">{slot.start_time} → {slot.end_time}</div>
                              {slot.room && <div className="text-xs opacity-60">📍 {slot.room}</div>}
                              <button onClick={() => deleteSlot(slot.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition-opacity">×</button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {subjects.length > 0 && (
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {subjects.slice(0, 8).map(s => (
                <div key={s.id} className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${getColorForSubject(s.name)}`}>
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Vue liste ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Liste des créneaux — {selectedClassObj?.name || 'toutes classes'}</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p>Aucun créneau pour cette classe</p>
              <p className="text-xs mt-1">Cliquez sur "Ajouter un créneau" pour commencer</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {DAYS.map(day => {
                const daySlots = filtered.filter(s => s.day_of_week === day).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day}>
                    <div className="px-5 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm border-b border-indigo-100">{day}</div>
                    {daySlots.map(slot => {
                      const color = getColorForSubject(getSubjectName(slot.subject_id));
                      return (
                        <div key={slot.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono w-28">
                            <Clock size={12} />
                            {slot.start_time} — {slot.end_time}
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${color}`}>
                            {getSubjectName(slot.subject_id)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{getTeacherName(slot.teacher_id) || '—'}</div>
                            {slot.room && <div className="text-xs text-gray-400">📍 {slot.room}</div>}
                          </div>
                          <button onClick={() => deleteSlot(slot.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal Nouveau créneau ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">📅</div>
                <div>
                  <h3 className="font-bold text-gray-800">Nouveau créneau</h3>
                  <p className="text-xs text-gray-400">{selectedClassObj?.name || 'Classe sélectionnée'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Jour</label>
                  <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Matière *</label>
                  <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    <option value="">— Choisir —</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Heure début</label>
                  <select value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Heure fin</label>
                  <select value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Enseignant</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                  <option value="">— Choisir —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Salle / Local</label>
                <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                  placeholder="Salle 12, Labo Sciences..." 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Enregistrement...' : '✅ Ajouter le créneau'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
