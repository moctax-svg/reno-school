import Layout from '../../components/Layout';
import React, { useState, useEffect } from 'react';
import { Grade, Attendance, Homework, HomeworkRead } from '../../api/entities';
import ScheduleViewer from '../../components/ScheduleViewer';
import StudentServices from './StudentServices';

function StudentDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="text-2xl font-bold mb-1">Bonjour, {user?.userName || 'Élève'} ! 👋</div>
        <div className="text-white/80">Bienvenue dans votre espace élève</div>
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="bg-white/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold">14.5</div><div className="text-xs text-white/80">Moyenne générale</div></div>
          <div className="bg-white/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold">92%</div><div className="text-xs text-white/80">Taux de présence</div></div>
          <div className="bg-white/20 rounded-xl p-3 text-center"><div className="text-2xl font-bold">3ème</div><div className="text-xs text-white/80">Rang de classe</div></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">📚 Cours du jour</h3>
          <div className="space-y-2">
            {[
              { time: '08h-10h', subject: 'Mathématiques', teacher: 'M. Diallo' },
              { time: '10h-12h', subject: 'Français', teacher: 'Mme. Traoré' },
              { time: '14h-16h', subject: 'Histoire-Géo', teacher: 'M. Koné' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl">
                <span className="text-xs font-mono text-emerald-600 w-16">{c.time}</span>
                <div><div className="font-medium text-gray-800 text-xs">{c.subject}</div><div className="text-xs text-gray-400">{c.teacher}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">📣 Actualités</h3>
          <div className="space-y-2">
            {[
              { icon: '📝', msg: 'Devoir de Maths demain' },
              { icon: '🎭', msg: 'Fête de l\'école le 15 juin' },
              { icon: '📊', msg: 'Bulletins T2 disponibles' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl text-sm">
                <span>{a.icon}</span><span className="text-gray-700">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentGrades() {
  const [grades, setGrades] = useState([]);
  useEffect(() => { Grade.list().then(setGrades).catch(() => {}); }, []);
  const byTrimester = ['T1', 'T2', 'T3'].map(t => {
    const tGrades = grades.filter(g => g.trimester === t);
    const avg = tGrades.length ? (tGrades.reduce((s, g) => s + (g.score / g.max_score * 20), 0) / tGrades.length).toFixed(1) : '—';
    return { t, avg, count: tGrades.length };
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {byTrimester.map(({ t, avg, count }) => (
          <div key={t} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-emerald-600">{avg}</div>
            <div className="text-xs text-gray-500 mt-1">Moyenne {t}</div>
            <div className="text-xs text-gray-400">{count} note(s)</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            {['Type', 'Trimestre', 'Note', 'Appréciation', 'Date'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {grades.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucune note disponible</td></tr>
              : grades.map(g => {
                const pct = g.max_score ? g.score / g.max_score * 20 : 0;
                const color = pct >= 14 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600';
                const mention = pct >= 16 ? 'Très Bien' : pct >= 14 ? 'Bien' : pct >= 12 ? 'Assez Bien' : pct >= 10 ? 'Passable' : 'Insuffisant';
                return (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{g.exam_type}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">{g.trimester}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold ${color}`}>{g.score}/{g.max_score}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{mention}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{g.date}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentHomework() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('devoirs'); // devoirs | modules

  useEffect(() => {
    setLoading(true);
    Promise.all([Homework.list(), HomeworkRead.list()]).then(([hw]) => {
      setHomeworks(hw.sort((a,b) => new Date(a.due_date) - new Date(b.due_date)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function daysDiff(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null; }

  const TYPE_COLORS = {
    'Devoir maison':'bg-violet-100 text-violet-700','Leçon à apprendre':'bg-blue-100 text-blue-700',
    'Exercice':'bg-cyan-100 text-cyan-700','Projet':'bg-orange-100 text-orange-700',
    'Exposé':'bg-pink-100 text-pink-700','Module de cours':'bg-emerald-100 text-emerald-700','Autre':'bg-gray-100 text-gray-700',
  };
  function DueChip({ d }) {
    const diff = daysDiff(d); if (diff===null) return null;
    if (diff<0)  return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700">Expiré</span>;
    if (diff===0)return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 animate-pulse">🔴 Aujourd'hui !</span>;
    if (diff===1)return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">⏰ Demain</span>;
    if (diff<=3) return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600">Dans {diff}j</span>;
    return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-green-50 text-green-600">📅 {d}</span>;
  }

  async function markRead(hw) {
    try {
      await HomeworkRead.create({ homework_id:hw.id, reader_type:'student', read_at:new Date().toISOString() });
    } catch {}
  }

  const devoirs = homeworks.filter(h => !h.is_course_module);
  const modules = homeworks.filter(h =>  h.is_course_module);
  const active  = devoirs.filter(h => daysDiff(h.due_date) >= 0);
  const expired = devoirs.filter(h => daysDiff(h.due_date) < 0);

  if (loading) return <div className="bg-white rounded-2xl p-8 text-center text-gray-400">⏳ Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {[['devoirs',`📋 Devoirs (${devoirs.length})`],['modules',`📚 Modules (${modules.length})`]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===v?'bg-white shadow-sm text-blue-700':'text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'devoirs' && (
        <div className="space-y-4">
          {active.length === 0 && expired.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-3">🎉</div><p className="font-medium text-gray-600">Aucun devoir en cours !</p>
            </div>
          )}
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">📋 Devoirs à faire ({active.length})</h3>
              <div className="space-y-3">
                {active.map(hw => (
                  <div key={hw.id} onClick={() => markRead(hw)}
                    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer hover:shadow-md ${daysDiff(hw.due_date)<=1?'border-amber-200 bg-amber-50/30':'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${(TYPE_COLORS[hw.type]||'bg-gray-100 text-gray-600').split(' ')[0]}`}>
                        {hw.type==='Devoir maison'?'📝':hw.type==='Leçon à apprendre'?'📖':hw.type==='Projet'?'🎯':hw.type==='Exposé'?'🎤':'✏️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${TYPE_COLORS[hw.type]||'bg-gray-100 text-gray-700'}`}>{hw.type}</span>
                          <DueChip d={hw.due_date} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">{hw.title}</h3>
                        {hw.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{hw.description}</p>}
                        {hw.reference_book && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                            📖 <strong>{hw.reference_book}</strong> · Page {hw.reference_page||'?'} · Exercice {hw.reference_exercise||'?'}
                          </div>
                        )}
                        {hw.attachment_type==='photo' && hw.attachment_url && (
                          <img src={hw.attachment_url} alt="devoir" className="mt-2 max-h-28 rounded-xl object-contain border border-gray-200" />
                        )}
                        {hw.attachment_type==='file' && hw.attachment_url && (
                          <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-blue-100">
                            📁 Télécharger le fichier joint
                          </a>
                        )}
                        <div className="text-xs text-gray-400 mt-2">Assigné le {hw.assigned_date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expired.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">✅ Devoirs passés ({expired.length})</h3>
              <div className="space-y-2 opacity-70">
                {expired.map(hw => (
                  <div key={hw.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">✅</div>
                    <div className="flex-1"><span className="font-medium text-gray-600 text-sm">{hw.title}</span><span className="text-xs text-gray-400 ml-2">— Dû le {hw.due_date}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'modules' && (
        <div className="space-y-3">
          {modules.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-3">📚</div><p className="font-medium text-gray-600">Aucun module publié</p>
            </div>
          ) : modules.map(hw => (
            <div key={hw.id} onClick={() => markRead(hw)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 hover:border-emerald-300 cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">📚</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {hw.course_level && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">{hw.course_level}</span>}
                    <span className="text-xs text-gray-400">{hw.assigned_date}</span>
                  </div>
                  <div className="font-bold text-gray-800">{hw.title}</div>
                  {hw.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{hw.description}</div>}
                </div>
                {hw.attachment_url && (
                  <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                    className="flex-shrink-0 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-emerald-700 flex items-center gap-1">
                    ⬇️ Ouvrir
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentAttendance() {
  const [records, setRecords] = useState([]);
  useEffect(() => { Attendance.list().then(r => setRecords(r.reverse())).catch(() => {}); }, []);
  const present = records.filter(r => r.status === 'Present').length;
  const total = records.length;
  const rate = total ? Math.round(present / total * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Présent', count: present, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent', count: records.filter(r => r.status === 'Absent').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Retard', count: records.filter(r => r.status === 'Late').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Taux présence', count: `${rate}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            {['Date', 'Statut', 'Heure arrivée', 'Notes'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {records.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun enregistrement</td></tr>
              : records.slice(0, 20).map(r => {
                const c = { Present: 'bg-green-100 text-green-700', Absent: 'bg-red-100 text-red-700', Late: 'bg-amber-100 text-amber-700', Excused: 'bg-blue-100 text-blue-700' };
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{r.date}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${c[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.check_in_time || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.notes || '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentApp({ onLogout, user }) {
  const menuItems = [
    { id: 'dashboard',  label: 'Mon espace',       icon: '🏠', component: <StudentDashboard user={user} /> },
    { id: 'grades',     label: 'Mes notes',         icon: '📝', component: <StudentGrades /> },
    { id: 'homework',   label: 'Devoirs',           icon: '📚', component: <StudentHomework /> },
    { id: 'attendance', label: 'Mes présences',     icon: '✅', component: <StudentAttendance /> },
    { id: 'schedule',   label: 'Emploi du temps',   icon: '📅', component: (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">📅 Emploi du temps</h3>
        <ScheduleViewer mode="today" />
      </div>
    )},
    { id: 'services',   label: 'Services',          icon: '🛎️', component: <StudentServices user={user} /> },
  ];
  return <Layout role="student" menuItems={menuItems} onLogout={onLogout} userName={user?.userName} schoolName="RENO" />;
}
