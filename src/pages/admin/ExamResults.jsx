import React, { useState, useEffect } from 'react';
import { Grade, Student, Subject, Classroom, School } from '../../api/entities';
import { Trophy, TrendingUp, TrendingDown, Award, Printer, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';

/* ── Helpers cycle ── */
function getMaxScore(cycle) {
  if (cycle === 'Primaire') return 10;
  if (cycle === 'Crèche' || cycle === 'Maternelle') return null; // pas de note
  return 20; // Collège, Lycée, Supérieur
}

function getMentionByCycle(avg, cycle) {
  if (cycle === 'Primaire') {
    if (avg >= 8)  return { label: 'Très Bien', color: '#059669', bg: 'bg-emerald-100 text-emerald-800', star: '⭐⭐⭐' };
    if (avg >= 7)  return { label: 'Bien',       color: '#0284c7', bg: 'bg-blue-100 text-blue-800', star: '⭐⭐' };
    if (avg >= 6)  return { label: 'Assez Bien', color: '#7c3aed', bg: 'bg-violet-100 text-violet-800', star: '⭐' };
    if (avg >= 5)  return { label: 'Passable',   color: '#d97706', bg: 'bg-amber-100 text-amber-800', star: '✓' };
    return { label: 'Insuffisant', color: '#dc2626', bg: 'bg-red-100 text-red-800', star: '✗' };
  }
  // Supérieur : seuil 10/20 pour validation
  if (cycle === 'Institut/Université' || cycle === 'Supérieur') {
    if (avg >= 16) return { label: 'Félicitations', color: '#059669', bg: 'bg-emerald-100 text-emerald-800', star: '⭐⭐⭐' };
    if (avg >= 14) return { label: 'Mention TB', color: '#0284c7', bg: 'bg-blue-100 text-blue-800', star: '⭐⭐' };
    if (avg >= 12) return { label: 'Mention B',  color: '#7c3aed', bg: 'bg-violet-100 text-violet-800', star: '⭐' };
    if (avg >= 10) return { label: 'Validé',     color: '#d97706', bg: 'bg-amber-100 text-amber-800', star: '✓' };
    return { label: 'Ajourné', color: '#dc2626', bg: 'bg-red-100 text-red-800', star: '✗' };
  }
  // Collège / Lycée /20
  if (avg >= 16) return { label: 'Très Bien', color: '#059669', bg: 'bg-emerald-100 text-emerald-800', star: '⭐⭐⭐' };
  if (avg >= 14) return { label: 'Bien',       color: '#0284c7', bg: 'bg-blue-100 text-blue-800', star: '⭐⭐' };
  if (avg >= 12) return { label: 'Assez Bien', color: '#7c3aed', bg: 'bg-violet-100 text-violet-800', star: '⭐' };
  if (avg >= 10) return { label: 'Passable',   color: '#d97706', bg: 'bg-amber-100 text-amber-800', star: '✓' };
  return { label: 'Insuffisant', color: '#dc2626', bg: 'bg-red-100 text-red-800', star: '✗' };
}

function getMention(avg) {
  if (avg >= 16) return { label: 'Très Bien', color: '#059669', bg: 'bg-emerald-100 text-emerald-800', star: '⭐⭐⭐' };
  if (avg >= 14) return { label: 'Bien', color: '#0284c7', bg: 'bg-blue-100 text-blue-800', star: '⭐⭐' };
  if (avg >= 12) return { label: 'Assez Bien', color: '#7c3aed', bg: 'bg-violet-100 text-violet-800', star: '⭐' };
  if (avg >= 10) return { label: 'Passable', color: '#d97706', bg: 'bg-amber-100 text-amber-800', star: '✓' };
  return { label: 'Insuffisant', color: '#dc2626', bg: 'bg-red-100 text-red-800', star: '✗' };
}

/* Palmarès imprimable */
function PalmaresPrint({ students, grades, subjects, trimester, classrooms, school, classId }) {
  const color = school?.header_color || '#1e3a5f';
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });
  const classObj = classrooms.find(c => c.id === classId);

  const ranking = students.map(s => {
    const sGrades = grades.filter(g => g.student_id === s.id && g.trimester === trimester);
    if (sGrades.length === 0) return { student: s, avg: null, mention: null };
    const total = sGrades.reduce((sum, g) => sum + (g.score / g.max_score * 20), 0);
    const avg = parseFloat((total / sGrades.length).toFixed(2));
    return { student: s, avg, mention: getMention(avg) };
  }).filter(r => r.avg !== null).sort((a, b) => b.avg - a.avg);

  return (
    <div id="doc-palmares" style={{ fontFamily: 'Arial, sans-serif', maxWidth: 794, margin: '0 auto', background: 'white', padding: 40 }}>
      <DocumentHeader school={school} documentTitle="PALMARÈS" documentSubtitle={`${classObj?.name || ''} · ${trimester}`} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: color, color: 'white' }}>
            {['Rang', 'Nom & Prénom', 'Matr.', 'Moy. /20', 'Mention', 'Décision'].map(h => (
              <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 'bold' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.student.id} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '9px 10px', fontWeight: 'bold', color: i === 0 ? '#d97706' : i === 1 ? '#94a3b8' : i === 2 ? '#92400e' : '#475569' }}>
                {i === 0 ? '🥇 1er' : i === 1 ? '🥈 2ème' : i === 2 ? '🥉 3ème' : `${i + 1}ème`}
              </td>
              <td style={{ padding: '9px 10px', fontWeight: i < 3 ? 'bold' : 'normal' }}>{r.student.last_name?.toUpperCase()} {r.student.first_name}</td>
              <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 10 }}>{r.student.registration_number || '—'}</td>
              <td style={{ padding: '9px 10px', fontWeight: 'bold', fontSize: 15, color: r.mention.color }}>{r.avg}</td>
              <td style={{ padding: '9px 10px', fontWeight: '600', color: r.mention.color }}>{r.mention.label}</td>
              <td style={{ padding: '9px 10px', fontSize: 11 }}>{r.avg >= 10 ? '✅ Admis(e)' : '❌ Redoublant(e)'}</td>
            </tr>
          ))}
          {ranking.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Aucun résultat pour ce trimestre</td></tr>
          )}
        </tbody>
      </table>
      <div style={{ borderTop: `2px solid ${color}`, paddingTop: 8, marginTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8' }}>
        <span>🏫 {school?.name || 'École'}</span>
        <span>{school?.footer_text || 'Document officiel'}</span>
        <span>Généré le {new Date().toLocaleDateString('fr-FR')} · RENO</span>
      </div>
    </div>
  );
}

export default function ExamResults() {
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trimester, setTrimester] = useState('T1');
  const [selectedClass, setSelectedClass] = useState('');
  const [view, setView] = useState('ranking'); // 'ranking' | 'stats' | 'palmares'
  const [selectedCycle, setSelectedCycle] = useState('Collège');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [g, s, sub, cl, sc] = await Promise.all([Grade.list(), Student.list(), Subject.list(), Classroom.list(), School.list()]);
      setGrades(g); setStudents(s); setSubjects(sub); setClassrooms(cl);
      if (sc.length > 0) {
        setSchool(sc[0]);
        const cycles = sc[0]?.school_cycles || [];
        if (cycles.length > 0) setSelectedCycle(cycles[0]);
      }
      if (cl.length > 0) setSelectedClass('all');
    } catch (e) {}
    setLoading(false);
  }

  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });

  const filteredStudents = selectedClass && selectedClass !== 'all'
    ? students.filter(s => s.classroom_id === selectedClass)
    : students;

  // Compute per-student average
  // Cycle actif de la classe sélectionnée ou cycle global
  const getStudentCycle = (s) => {
    const cl = classrooms.find(c => c.id === s.classroom_id);
    return cl?.cycle || selectedCycle || 'Collège';
  };
  const activeCycle = selectedClass && selectedClass !== 'all'
    ? (classrooms.find(c => c.id === selectedClass)?.cycle || selectedCycle)
    : selectedCycle;
  const maxScoreRef = activeCycle === 'Primaire' ? 10 : 20;
  const admissionThreshold = activeCycle === 'Primaire' ? 5 : 10;

  const ranking = filteredStudents.map(s => {
    const sGrades = grades.filter(g => g.student_id === s.id && g.trimester === trimester);
    if (sGrades.length === 0) return { student: s, avg: null, nbGrades: 0, subjectAvgs: {} };
    const subjectAvgs = {};
    const allSubjects = [...new Set(sGrades.map(g => g.subject_id))];
    allSubjects.forEach(subId => {
      const sg = sGrades.filter(g => g.subject_id === subId);
      subjectAvgs[subId] = sg.reduce((sum, g) => sum + g.score / g.max_score * maxScoreRef, 0) / sg.length;
    });
    const total = sGrades.reduce((sum, g) => sum + g.score / g.max_score * maxScoreRef, 0);
    const avg = parseFloat((total / sGrades.length).toFixed(2));
    return { student: s, avg, nbGrades: sGrades.length, subjectAvgs };
  }).filter(r => r.avg !== null).sort((a, b) => b.avg - a.avg);

  // Stats
  const avgAll = ranking.length ? (ranking.reduce((s, r) => s + r.avg, 0) / ranking.length).toFixed(2) : '—';
  const admitted = ranking.filter(r => r.avg >= admissionThreshold).length;
  const failed = ranking.filter(r => r.avg < admissionThreshold).length;
  const best = ranking[0];
  const worst = ranking[ranking.length - 1];

  // Subject averages for chart
  const subjectStats = subjects.map(sub => {
    const relGrades = grades.filter(g => g.subject_id === sub.id && g.trimester === trimester);
    const avg = relGrades.length ? (relGrades.reduce((s, g) => s + g.score / g.max_score * maxScoreRef, 0) / relGrades.length).toFixed(1) : 0;
    return { name: sub.name.length > 10 ? sub.name.substring(0, 10) + '…' : sub.name, avg: parseFloat(avg), fullName: sub.name };
  }).filter(s => s.avg > 0);

  // Mention distribution
  const mentionDist = activeCycle === 'Primaire'
    ? [
        { label: 'Très Bien (≥8)', count: ranking.filter(r => r.avg >= 8).length, color: '#059669' },
        { label: 'Bien (7–8)', count: ranking.filter(r => r.avg >= 7 && r.avg < 8).length, color: '#0284c7' },
        { label: 'Assez Bien (6–7)', count: ranking.filter(r => r.avg >= 6 && r.avg < 7).length, color: '#7c3aed' },
        { label: 'Passable (5–6)', count: ranking.filter(r => r.avg >= 5 && r.avg < 6).length, color: '#d97706' },
        { label: 'Insuffisant (<5)', count: ranking.filter(r => r.avg < 5).length, color: '#dc2626' },
      ]
    : [
        { label: 'Très Bien (≥16)', count: ranking.filter(r => r.avg >= 16).length, color: '#059669' },
        { label: 'Bien (14–16)', count: ranking.filter(r => r.avg >= 14 && r.avg < 16).length, color: '#0284c7' },
        { label: 'Assez Bien (12–14)', count: ranking.filter(r => r.avg >= 12 && r.avg < 14).length, color: '#7c3aed' },
        { label: 'Passable (10–12)', count: ranking.filter(r => r.avg >= 10 && r.avg < 12).length, color: '#d97706' },
        { label: 'Insuffisant (<10)', count: ranking.filter(r => r.avg < 10).length, color: '#dc2626' },
      ];

  function printPalmares() {
    const content = document.getElementById('doc-palmares');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Palmarès</title><style>@media print{body{margin:0}} @page{size:A4;margin:10mm}</style></head><body>${content.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sélecteur cycle si multi-cycles */}
        {(school?.school_cycles || []).length > 1 && (
          <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm focus:outline-none">
            {(school.school_cycles || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={trimester} onChange={e => setTrimester(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm focus:outline-none">
          {(activeCycle === 'Institut/Université' || activeCycle === 'Supérieur')
            ? [['S1','Semestre 1'],['S2','Semestre 2']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
            : [['T1','Trimestre 1'],['T2','Trimestre 2'],['T3','Trimestre 3']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
          }
        </select>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm focus:outline-none">
          <option value="all">Toutes les classes</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1" />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { id: 'ranking', label: '🏆 Classement' },
            { id: 'stats', label: '📊 Statistiques' },
            { id: 'palmares', label: '📜 Palmarès' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: `Moyenne classe`, value: avgAll !== '—' ? `${avgAll}/${maxScoreRef}` : '—', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '📊' },
          { label: 'Admis (≥10)', value: admitted, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'En échec (<10)', value: failed, color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
          { label: 'Taux réussite', value: ranking.length ? `${Math.round(admitted / ranking.length * 100)}%` : '—', color: 'text-violet-600', bg: 'bg-violet-50', icon: '🎯' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-medium text-gray-600">Aucune note pour {trimester}</p>
          <p className="text-sm text-gray-400 mt-1">Saisissez des notes dans l'interface professeur</p>
        </div>
      ) : view === 'ranking' ? (
        /* ─── Classement ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">🏆 Classement — {trimester}</h3>
            <span className="text-xs text-gray-400">{ranking.length} élève(s) classé(s)</span>
          </div>

          {/* Podium */}
          {ranking.length >= 3 && (
            <div className="flex items-end justify-center gap-4 px-8 py-6 bg-gradient-to-b from-amber-50 to-white">
              {/* 2nd */}
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
                  {(ranking[1].student.first_name||'?')[0]}{(ranking[1].student.last_name||'?')[0]}
                </div>
                <div className="text-xs font-medium text-gray-700 mt-2 text-center max-w-20 truncate">{ranking[1].student.first_name}</div>
                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg mt-1">{ranking[1].avg}/20</div>
                <div className="bg-gray-300 h-12 w-20 rounded-t-xl mt-3 flex items-center justify-center text-white font-bold">2</div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">👑</div>
                <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4 ring-amber-200">
                  {(ranking[0].student.first_name||'?')[0]}{(ranking[0].student.last_name||'?')[0]}
                </div>
                <div className="text-sm font-bold text-gray-800 mt-2">{ranking[0].student.first_name}</div>
                <div className="bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-lg mt-1">{ranking[0].avg}/20</div>
                <div className="bg-amber-400 h-20 w-24 rounded-t-xl mt-3 flex items-center justify-center text-white font-bold text-lg">1</div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold text-sm">
                  {(ranking[2].student.first_name||'?')[0]}{(ranking[2].student.last_name||'?')[0]}
                </div>
                <div className="text-xs font-medium text-gray-700 mt-2 text-center max-w-20 truncate">{ranking[2].student.first_name}</div>
                <div className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg mt-1">{ranking[2].avg}/20</div>
                <div className="bg-orange-300 h-8 w-20 rounded-t-xl mt-3 flex items-center justify-center text-white font-bold">3</div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {ranking.map((r, i) => {
              const mention = getMentionByCycle(r.avg, activeCycle);
              return (
                <div key={r.student.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < 3 ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                  {/* Rang */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{r.student.last_name?.toUpperCase()} {r.student.first_name}</div>
                    <div className="text-xs text-gray-400">{r.student.registration_number || '—'} · {r.nbGrades} note(s)</div>
                  </div>
                  {/* Barre de progression */}
                  <div className="w-32 hidden md:block">
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${r.avg / 20 * 100}%`, background: mention.color }} />
                    </div>
                  </div>
                  {/* Moyenne */}
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: mention.color }}>{r.avg}</div>
                    <div className="text-xs text-gray-400">/20</div>
                  </div>
                  {/* Mention */}
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-medium ${mention.bg} hidden sm:block`}>{mention.label}</span>
                  {/* Décision */}
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.avg >= admissionThreshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.avg >= admissionThreshold ? '✅ Admis' : '❌ Échec'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'stats' ? (
        /* ─── Statistiques ─── */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Moyennes par matière */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-indigo-500" /> Moyennes par matière</h3>
              {subjectStats.length === 0
                ? <div className="text-center text-gray-400 py-6">Aucune donnée</div>
                : <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={subjectStats} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v, n, p) => [`${v}/20`, p.payload.fullName]} />
                      <Bar dataKey="avg" fill="#6d28d9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Répartition des mentions */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🏅 Répartition des mentions</h3>
              <div className="space-y-3">
                {mentionDist.map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium" style={{ color: m.color }}>{m.label}</span>
                      <span className="text-gray-500">{m.count} élève(s)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3">
                      <div className="h-3 rounded-full transition-all"
                        style={{ width: ranking.length ? `${m.count / ranking.length * 100}%` : '0%', background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meilleur / Moins bon + infos */}
          <div className="grid grid-cols-2 gap-4">
            {best && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🏆</div>
                  <div>
                    <p className="text-xs text-amber-600 font-semibold uppercase">Meilleur(e) élève</p>
                    <p className="font-bold text-gray-800">{best.student.first_name} {best.student.last_name}</p>
                    <p className="text-2xl font-bold text-amber-600">{best.avg}/20</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-medium">{getMention(best.avg).label}</span>
                  </div>
                </div>
              </div>
            )}
            {worst && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">📉</div>
                  <div>
                    <p className="text-xs text-red-600 font-semibold uppercase">Nécessite un soutien</p>
                    <p className="font-bold text-gray-800">{worst.student.first_name} {worst.student.last_name}</p>
                    <p className="text-2xl font-bold text-red-600">{worst.avg}/20</p>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg font-medium">{getMention(worst.avg).label}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Palmarès imprimable ─── */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800">📜 Palmarès officiel — {trimester}</h3>
            <button onClick={printPalmares}
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700">
              <Printer size={16} /> Imprimer le palmarès
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto p-2">
            <PalmaresPrint
              students={filteredStudents}
              grades={grades}
              subjects={subjects}
              trimester={trimester}
              classrooms={classrooms}
              school={school}
              classId={selectedClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
