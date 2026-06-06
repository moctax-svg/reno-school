import React, { useState, useEffect } from 'react';
import { Schedule, Teacher, Subject } from '../api/entities';

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
];

function colorFor(name) {
  if (!name) return COLORS[0];
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

const TODAY_IDX = new Date().getDay(); // 0=Sun, 1=Mon...
const TODAY_DAY = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][TODAY_IDX];

/**
 * Props:
 *  - classroomId: string — filter by classroom (optional)
 *  - teacherId: string — filter by teacher (optional)
 *  - mode: 'week' | 'today' — default 'week'
 */
export default function ScheduleViewer({ classroomId, teacherId, mode = 'week' }) {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(mode);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sc, t, sub] = await Promise.all([Schedule.list(), Teacher.list(), Subject.list()]);
        let filtered = sc;
        if (classroomId) filtered = filtered.filter(s => s.classroom_id === classroomId);
        if (teacherId) filtered = filtered.filter(s => s.teacher_id === teacherId);
        setSchedules(filtered);
        setTeachers(t);
        setSubjects(sub);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, [classroomId, teacherId]);

  function getSubjectName(id) { return subjects.find(s => s.id === id)?.name || '—'; }
  function getTeacherName(id) { const t = teachers.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : ''; }

  function getSlot(day, hour) {
    return schedules.find(s => {
      if (s.day_of_week !== day) return false;
      return (s.start_time || '') <= hour && hour < (s.end_time || '');
    });
  }

  const todaySlots = schedules
    .filter(s => s.day_of_week === TODAY_DAY)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  if (loading) return <div className="text-center text-gray-400 py-8 text-sm">Chargement de l'emploi du temps...</div>;

  if (schedules.length === 0) return (
    <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
      <div className="text-4xl mb-3">📅</div>
      <p className="text-gray-500 font-medium">Aucun cours programmé</p>
      <p className="text-xs text-gray-400 mt-1">L'administration doit configurer l'emploi du temps</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setView('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'today' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>
          📍 Aujourd'hui
        </button>
        <button onClick={() => setView('week')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'week' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>
          📅 Semaine
        </button>
      </div>

      {view === 'today' ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Cours du {TODAY_DAY} — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
          {todaySlots.length === 0
            ? <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">Pas de cours aujourd'hui 🎉</div>
            : todaySlots.map(slot => {
              const color = colorFor(getSubjectName(slot.subject_id));
              const now = new Date().toTimeString().substring(0, 5);
              const isNow = slot.start_time <= now && now < slot.end_time;
              return (
                <div key={slot.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isNow ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-100'}`}>
                  {isNow && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse flex-shrink-0"></span>}
                  <div className="font-mono text-xs text-gray-500 w-24 flex-shrink-0">
                    {slot.start_time} → {slot.end_time}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex-shrink-0 ${color}`}>
                    {getSubjectName(slot.subject_id)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{getTeacherName(slot.teacher_id)}</div>
                    {slot.room && <div className="text-xs text-gray-400">📍 {slot.room}</div>}
                  </div>
                  {isNow && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">En cours</span>}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <th className="w-14 py-2 px-3 text-gray-400 font-medium border border-gray-100 bg-gray-50 text-left">⏰</th>
                {DAYS.map(d => (
                  <th key={d} className={`py-2 px-3 text-center font-bold border text-xs ${d === TODAY_DAY ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {d.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hi) => {
                const isBreak = hour === '12:00';
                return (
                  <tr key={hour} className={isBreak ? 'bg-amber-50' : hi % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}>
                    <td className="py-1.5 px-2 text-gray-400 font-mono text-xs border border-gray-100 bg-gray-50">{hour}</td>
                    {DAYS.map(day => {
                      const slot = getSlot(day, hour);
                      if (!slot) return <td key={day} className={`border border-gray-100 ${isBreak && day === 'Lundi' ? 'text-center text-amber-500 text-xs' : ''}`}>{isBreak && day === 'Lundi' ? '☀️' : null}</td>;
                      const color = colorFor(getSubjectName(slot.subject_id));
                      return (
                        <td key={day} className="border border-gray-100 p-0.5">
                          <div className={`rounded-lg border p-1.5 ${color}`}>
                            <div className="font-bold text-xs truncate">{getSubjectName(slot.subject_id)}</div>
                            <div className="text-xs opacity-60 truncate">{slot.room || ''}</div>
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
      )}
    </div>
  );
}
