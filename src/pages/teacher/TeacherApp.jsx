/**
 * TeacherApp.jsx — Interface Professeur RENO
 *
 * Modules :
 * 1. 📊 Tableau de bord      — stats réelles, cours du jour (EDT), devoirs actifs, alertes absences
 * 2. ✅ Appel / Présences    — feuille d'appel par classe, filtre par date, stats, notif parent auto
 * 3. 📝 Notes & Évaluations  — saisie par classe/matière, moyenne classe, top/flop, notif parent auto
 * 4. 📚 Devoirs              — HomeworkManager existant
 * 5. 📅 Emploi du temps      — ScheduleViewer existant
 * 6. 📋 Mes classes          — vue par classe : effectif, moyenne, taux présence
 * 7. 💬 Messagerie           — Messagerie existant
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Student, Attendance, Grade, Subject, Notification,
  Classroom, Schedule, Teacher, AbsenceReport
} from '../../api/entities';
import {
  CheckCircle, XCircle, Clock, Plus, Save, Send,
  Users, BookOpen, TrendingUp, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, Search, Filter, Star, BarChart2
} from 'lucide-react';
import Layout from '../../components/Layout';
import HomeworkManager from './HomeworkManager';
import ScheduleViewer from '../../components/ScheduleViewer';
import Messagerie from '../../components/Messagerie';

const fmt = n => (n || 0).toLocaleString('fr-FR');

/* ══════════════════════════════════════════
   TABLEAU DE BORD
══════════════════════════════════════════ */
function TeacherDashboard({ user }) {
  const [data, setData]     = useState({ students:[], grades:[], attendances:[], homeworks:[], classrooms:[], schedules:[], teacher:null });
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const DAYS  = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const todayIdx = new Date().getDay();
  const todayName = DAYS[todayIdx];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      Student.list(), Grade.list(), Attendance.list(),
      Classroom.list(), Schedule.list(), Teacher.list(),
    ]).then(([students, grades, attendances, classrooms, schedules, teachers]) => {
      // Trouver le profil enseignant
      const teacher = teachers.find(t =>
        t.email === user?.email ||
        `${t.first_name} ${t.last_name}`.toLowerCase() === (user?.userName||'').toLowerCase()
      ) || teachers[0];
      setData({ students, grades, attendances, classrooms, schedules, teacher });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { students, grades, attendances, classrooms, schedules, teacher } = data;

  // Cours du jour pour ce prof
  const mySchedules = teacher
    ? schedules.filter(s => s.teacher_id === teacher.id && Number(s.day_of_week) === todayIdx)
    : schedules.filter(s => Number(s.day_of_week) === todayIdx).slice(0, 4);

  // Stats
  const todayAttendance = attendances.filter(a => a.date === today);
  const absentToday     = todayAttendance.filter(a => a.status === 'Absent').length;
  const myGrades        = teacher ? grades.filter(g => g.teacher_id === teacher.id) : grades;
  const myClasses       = teacher
    ? [...new Set(schedules.filter(s => s.teacher_id === teacher.id).map(s => s.classroom_id))]
    : classrooms.map(c => c.id);

  // Absences récurrentes (3+ fois cette semaine)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - todayIdx);
  const weekDates = Array.from({length:7}, (_,i) => { const d=new Date(weekStart); d.setDate(d.getDate()+i); return d.toISOString().split('T')[0]; });
  const absByStudent = {};
  attendances.filter(a => weekDates.includes(a.date) && a.status === 'Absent').forEach(a => {
    absByStudent[a.student_id] = (absByStudent[a.student_id]||0) + 1;
  });
  const alertStudents = Object.entries(absByStudent).filter(([,c]) => c >= 3)
    .map(([id,c]) => ({ student: students.find(s=>s.id===id), count: c })).filter(x=>x.student);

  const kpis = [
    { icon:'👨‍🎓', label:'Mes élèves',     val: students.length,  color:'text-blue-700',  bg:'bg-blue-50 border-blue-100' },
    { icon:'🏛️', label:'Mes classes',     val: myClasses.length, color:'text-indigo-700', bg:'bg-indigo-50 border-indigo-100' },
    { icon:'📝', label:'Notes saisies',   val: myGrades.length,  color:'text-green-700',  bg:'bg-green-50 border-green-100' },
    { icon:'❌', label:'Absents auj.',    val: absentToday,      color:'text-red-700',    bg:'bg-red-50 border-red-100' },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="text-2xl font-bold mb-1">Bonjour{user?.userName ? `, ${user.userName}` : ''} ! 👋</div>
        <div className="text-white/70 text-sm">{todayName} {new Date().toLocaleDateString('fr-FR')}</div>
        {teacher && <div className="text-white/60 text-xs mt-1">Matière principale : {teacher.subject || '—'}</div>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k,i) => (
          <div key={i} className={`${k.bg} border rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Cours du jour */}
      {mySchedules.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Programme du jour — {todayName}
          </h3>
          <div className="space-y-2">
            {mySchedules.sort((a,b) => (a.start_time||'').localeCompare(b.start_time||'')).map((s,i) => {
              const cls = classrooms.find(c => c.id === s.classroom_id);
              const now = new Date().toTimeString().slice(0,5);
              const isCurrent = s.start_time && s.end_time && now >= s.start_time && now <= s.end_time;
              return (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {s.start_time||'?'}–{s.end_time||'?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{s.subject_name || '—'} {cls ? `— ${cls.name}` : ''}</div>
                    {s.room && <div className="text-xs text-gray-400">📍 {s.room}</div>}
                  </div>
                  {isCurrent && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-lg font-bold animate-pulse">EN COURS</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alertes absences répétées */}
      {alertStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 font-bold text-amber-800 mb-3">
            <AlertTriangle size={18} /> Absences répétées cette semaine
          </div>
          <div className="space-y-2">
            {alertStudents.map(({student, count}, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 text-xs">
                  {student.first_name?.[0]}{student.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{student.first_name} {student.last_name}</div>
                  <div className="text-xs text-gray-400">{student.parent_phone && `📞 ${student.parent_phone}`}</div>
                </div>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">{count} abs. cette semaine</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières notes */}
      {myGrades.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">📝 Dernières notes saisies</h3>
          <div className="space-y-2">
            {[...myGrades].sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).slice(0,5).map((g,i)=>{
              const s = students.find(x=>x.id===g.student_id);
              const pct = g.max_score ? g.score/g.max_score*20 : 0;
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold flex-shrink-0 ${pct>=14?'bg-green-100 text-green-700':pct>=10?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                    {g.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s?`${s.first_name} ${s.last_name}`:'—'}</div>
                    <div className="text-xs text-gray-400">{g.exam_type} · {g.trimester} · {g.date}</div>
                  </div>
                  <span className="text-xs text-gray-400">/{g.max_score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   FEUILLE D'APPEL
══════════════════════════════════════════ */
function AttendanceManager({ user }) {
  const [students,    setStudents]    = useState([]);
  const [classrooms,  setClassrooms]  = useState([]);
  const [existing,    setExisting]    = useState([]);
  const [attendance,  setAttendance]  = useState({});
  const [selectedCls, setSelectedCls] = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [search,      setSearch]      = useState('');
  const [absReports,  setAbsReports]  = useState([]);

  useEffect(() => {
    Promise.all([Student.list(), Classroom.list(), Attendance.list(), AbsenceReport.list()])
      .then(([s,c,a,rep]) => {
        setStudents(s); setClassrooms(c); setExisting(a);
        setAbsReports(rep.filter(r => r.status === 'Pending'));
        if (c.length) setSelectedCls(c[0].id);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const cls = students.filter(s => s.classroom_id === selectedCls);
    const init = {};
    cls.forEach(s => {
      const prev = existing.find(a => a.student_id === s.id && a.date === date);
      init[s.id] = prev?.status || 'Present';
    });
    setAttendance(init);
    setSaved(false);
  }, [selectedCls, date, students, existing]);

  const clsStudents = students
    .filter(s => s.classroom_id === selectedCls)
    .filter(s => !search || `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    Present: Object.values(attendance).filter(v=>v==='Present').length,
    Absent:  Object.values(attendance).filter(v=>v==='Absent').length,
    Late:    Object.values(attendance).filter(v=>v==='Late').length,
    Excused: Object.values(attendance).filter(v=>v==='Excused').length,
  };

  const STATUS = {
    Present: { label:'✅ Présent',  color:'bg-green-500 text-white border-green-500' },
    Absent:  { label:'❌ Absent',   color:'bg-red-500 text-white border-red-500' },
    Late:    { label:'⏰ Retard',   color:'bg-amber-500 text-white border-amber-500' },
    Excused: { label:'📄 Excusé',  color:'bg-blue-500 text-white border-blue-500' },
  };

  function markAll(status) {
    const updated = {};
    clsStudents.forEach(s => { updated[s.id] = status; });
    setAttendance(prev => ({...prev, ...updated}));
  }

  async function saveAttendance() {
    setSaving(true);
    try {
      await Promise.all(clsStudents.map(async s => {
        const prev = existing.find(a => a.student_id === s.id && a.date === date);
        const status = attendance[s.id] || 'Present';
        if (prev) {
          await Attendance.update(prev.id, { status });
        } else {
          await Attendance.create({ student_id: s.id, classroom_id: selectedCls, date, status, parent_notified: false });
        }
        // Notifier parent si absent
        if (status === 'Absent' && !prev) {
          await Notification.create({
            student_id:   s.id,
            parent_name:  s.parent_name,
            parent_email: s.parent_email,
            parent_phone: s.parent_phone,
            type:         'Absence',
            title:        `⚠️ Absence — ${s.first_name} ${s.last_name}`,
            message:      `Votre enfant ${s.first_name} ${s.last_name} a été marqué(e) absent(e) le ${date}. Veuillez contacter l'établissement si nécessaire.`,
            channel:      'Push',
            status:       'Sent',
            sent_at:      new Date().toISOString(),
          });
        }
      }));
      setSaved(true);
      // Rafraîchir
      Attendance.list().then(setExisting);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  const cls = classrooms.find(c => c.id === selectedCls);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Classe</label>
            <select value={selectedCls} onChange={e => setSelectedCls(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Rechercher</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom de l'élève..."
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Entête classe + stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-lg">{cls?.name || '—'}</div>
            <div className="text-white/70 text-sm">{clsStudents.length} élève(s) · {date}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => markAll('Present')} className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/30">
              Tous présents
            </button>
            <button onClick={() => markAll('Absent')} className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/30">
              Tous absents
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(stats).map(([s,n]) => (
            <div key={s} className="bg-white/15 rounded-xl p-2 text-center">
              <div className="text-xl font-bold">{n}</div>
              <div className="text-xs text-white/70">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bandeau signalements parents */}
      {absReports.filter(r => r.classroom_id === selectedCls && r.date === date).length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="font-bold text-amber-800 flex items-center gap-2 mb-2">
            ⚡ Signalements parents pour aujourd'hui
          </div>
          <div className="space-y-2">
            {absReports.filter(r => r.classroom_id === selectedCls && r.date === date).map(r => {
              const s = students.find(x => x.id === r.student_id);
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.report_type==='Absence'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {r.report_type==='Absence'?'❌':'⏰'} {r.report_type}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800 text-sm">{s?`${s.first_name} ${s.last_name}`:r.student_id}</span>
                    <span className="text-xs text-gray-500 ml-2">· {r.reason}{r.reason_detail?` (${r.reason_detail})`:''}</span>
                    {r.report_type==='Retard'&&r.expected_return&&<span className="text-xs text-amber-700 ml-2">· Retour {r.expected_return}</span>}
                    {r.report_type==='Absence'&&r.duration_days&&<span className="text-xs text-red-600 ml-2">· {r.duration_days}j estimé(s)</span>}
                  </div>
                  <span className="text-xs text-gray-400">{r.parent_name||''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste élèves */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {clsStudents.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            Aucun élève dans cette classe
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clsStudents.map((s, i) => {
              const status = attendance[s.id] || 'Present';
              return (
                <div key={s.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-all ${status === 'Absent' ? 'bg-red-50' : ''}`}>
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate flex items-center gap-2">
                      {s.first_name} {s.last_name}
                      {(() => { const rep = absReports.find(r => r.student_id === s.id && r.date === date); return rep ? (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold animate-pulse ${rep.report_type==='Absence'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                          ⚡ {rep.report_type} signalée · {rep.reason}
                        </span>
                      ) : null; })()}
                    </div>
                    <div className="text-xs text-gray-400">{s.registration_number || `N°${i+1}`}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {Object.entries(STATUS).map(([st, cfg]) => (
                      <button key={st} onClick={() => setAttendance({...attendance, [s.id]: st})}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${status === st ? cfg.color : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Légende + Enregistrer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span className="text-red-500 font-medium">⚠️ Les absences notifient automatiquement les parents</span>
        </div>
        <button onClick={saveAttendance} disabled={saving || clsStudents.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md flex-shrink-0 ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'}`}>
          {saving ? <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</> :
           saved  ? <><CheckCircle size={16} /> Appel sauvegardé !</> :
                    <><Save size={16} /> Enregistrer l'appel</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOTES & ÉVALUATIONS
══════════════════════════════════════════ */
function GradesManager({ user }) {
  const [students,   setStudents]   = useState([]);
  const [grades,     setGrades]     = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [filter,     setFilter]     = useState({ cls: '', trimester: '', type: '' });
  const [search,     setSearch]     = useState('');
  const [bulkMode,   setBulkMode]   = useState(false);
  const [bulkRows,   setBulkRows]   = useState([]);
  const [form, setForm] = useState({
    student_id:'', exam_type:'Devoir', score:'', max_score:'20',
    trimester:'T1', date: new Date().toISOString().split('T')[0],
    comments:'', subject_id:'', classroom_id:'', notify_parent: true,
  });

  useEffect(() => {
    Promise.all([Student.list(), Grade.list(), Subject.list(), Classroom.list()])
      .then(([s,g,subj,c]) => { setStudents(s); setGrades(g); setSubjects(subj); setClassrooms(c); })
      .catch(() => {});
  }, []);

  // Initialiser les lignes de saisie en masse quand on change de classe
  useEffect(() => {
    if (!bulkMode || !form.classroom_id) return;
    const cls = students.filter(s => s.classroom_id === form.classroom_id);
    setBulkRows(cls.map(s => ({ student_id: s.id, score: '' })));
  }, [form.classroom_id, bulkMode, students]);

  async function save() {
    if (!form.student_id || !form.score) { alert('Élève et note obligatoires.'); return; }
    setSaving(true);
    try {
      await Grade.create({ ...form, score: parseFloat(form.score), max_score: parseFloat(form.max_score) });
      if (form.notify_parent) {
        const s = students.find(x => x.id === form.student_id);
        const subj = subjects.find(x => x.id === form.subject_id);
        if (s) {
          const pct = parseFloat(form.score) / parseFloat(form.max_score) * 20;
          const mention = pct>=16?'Très Bien':pct>=14?'Bien':pct>=12?'Assez Bien':pct>=10?'Passable':'Insuffisant';
          await Notification.create({
            student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
            type:'Note', title:`📝 Nouvelle note — ${s.first_name} ${s.last_name}`,
            message:`${s.first_name} a obtenu ${form.score}/${form.max_score} (${pct.toFixed(1)}/20 — ${mention}) en ${form.exam_type} de ${subj?.name||'Matière'} (${form.trimester}).\n${form.comments ? 'Commentaire : '+form.comments : ''}`,
            channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
          });
        }
      }
      setShowForm(false);
      setForm(f => ({...f, student_id:'', score:'', comments:''}));
      Grade.list().then(setGrades);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  async function saveBulk() {
    const valid = bulkRows.filter(r => r.score !== '' && !isNaN(parseFloat(r.score)));
    if (!valid.length) { alert('Saisissez au moins une note.'); return; }
    if (!form.subject_id || !form.exam_type) { alert('Matière et type d\'évaluation obligatoires.'); return; }
    setSaving(true);
    try {
      await Promise.all(valid.map(async row => {
        const score = parseFloat(row.score);
        const max   = parseFloat(form.max_score);
        await Grade.create({ ...form, student_id: row.student_id, score, max_score: max });
        if (form.notify_parent) {
          const s = students.find(x => x.id === row.student_id);
          const subj = subjects.find(x => x.id === form.subject_id);
          if (s) {
            const pct = score/max*20;
            const mention = pct>=16?'Très Bien':pct>=14?'Bien':pct>=12?'Assez Bien':pct>=10?'Passable':'Insuffisant';
            await Notification.create({
              student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
              type:'Note', title:`📝 Nouvelle note — ${s.first_name} ${s.last_name}`,
              message:`${s.first_name} a obtenu ${score}/${max} (${pct.toFixed(1)}/20 — ${mention}) en ${form.exam_type} de ${subj?.name||'Matière'} (${form.trimester}).`,
              channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
            });
          }
        }
      }));
      setBulkMode(false);
      Grade.list().then(setGrades);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  // Filtrage + recherche
  const filtered = grades.filter(g => {
    const s = students.find(x => x.id === g.student_id);
    if (filter.cls && s?.classroom_id !== filter.cls) return false;
    if (filter.trimester && g.trimester !== filter.trimester) return false;
    if (filter.type && g.exam_type !== filter.type) return false;
    if (search && s && !`${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats de la sélection
  const avgScore = filtered.length
    ? filtered.reduce((s,g) => s + (g.max_score ? g.score/g.max_score*20 : 0), 0) / filtered.length
    : 0;
  const best  = [...filtered].sort((a,b) => (b.score/b.max_score) - (a.score/a.max_score))[0];
  const worst = [...filtered].sort((a,b) => (a.score/a.max_score) - (b.score/b.max_score))[0];

  const mention = n => n>=16?'Très Bien':n>=14?'Bien':n>=12?'Assez Bien':n>=10?'Passable':'Insuffisant';
  const noteColor = n => n>=14?'text-green-600':n>=10?'text-amber-600':'text-red-600';

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setBulkMode(false); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Note individuelle
          </button>
          <button onClick={() => { setShowForm(true); setBulkMode(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
            <Users size={16} /> Saisie par classe
          </button>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          🔔 Notification parent automatique activée
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <select value={filter.cls} onChange={e => setFilter({...filter, cls:e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Toutes les classes</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filter.trimester} onChange={e => setFilter({...filter, trimester:e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Tous trimestres</option>
            <option>T1</option><option>T2</option><option>T3</option>
          </select>
          <select value={filter.type} onChange={e => setFilter({...filter, type:e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Tous types</option>
            <option>Devoir</option><option>Composition</option><option>Examen</option><option>Contrôle</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="text-xs text-blue-500 mb-1">Moyenne de la sélection</div>
            <div className={`text-2xl font-bold ${noteColor(avgScore)}`}>{avgScore.toFixed(2)}<span className="text-base font-normal text-gray-400">/20</span></div>
            <div className="text-xs text-gray-500">{mention(avgScore)} · {filtered.length} note(s)</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="text-xs text-green-500 mb-1">🏆 Meilleure note</div>
            {best && (() => {
              const s = students.find(x=>x.id===best.student_id);
              const pct = best.max_score ? best.score/best.max_score*20 : 0;
              return <><div className="text-2xl font-bold text-green-700">{pct.toFixed(1)}/20</div><div className="text-xs text-gray-500 truncate">{s?`${s.first_name} ${s.last_name}`:'—'}</div></>;
            })()}
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <div className="text-xs text-red-500 mb-1">📉 Note la plus basse</div>
            {worst && (() => {
              const s = students.find(x=>x.id===worst.student_id);
              const pct = worst.max_score ? worst.score/worst.max_score*20 : 0;
              return <><div className="text-2xl font-bold text-red-600">{pct.toFixed(1)}/20</div><div className="text-xs text-gray-500 truncate">{s?`${s.first_name} ${s.last_name}`:'—'}</div></>;
            })()}
          </div>
        </div>
      )}

      {/* Tableau des notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 border-b">
            <tr>{['Élève','Classe','Matière','Type','Trim.','Note /20','Mention','Date'].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0
              ? <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucune note</td></tr>
              : [...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(g => {
                  const s    = students.find(x=>x.id===g.student_id);
                  const subj = subjects.find(x=>x.id===g.subject_id);
                  const cls  = classrooms.find(x=>x.id===g.classroom_id || x.id===s?.classroom_id);
                  const pct  = g.max_score ? g.score/g.max_score*20 : 0;
                  return (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s?`${s.first_name} ${s.last_name}`:'—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cls?.name||'—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{subj?.name||'—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{g.exam_type}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">{g.trimester}</span></td>
                      <td className="px-4 py-3"><span className={`font-bold ${noteColor(pct)}`}>{pct.toFixed(1)}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{mention(pct)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{g.date}</td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Modal saisie */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {bulkMode ? <><Users size={18} className="text-indigo-500" /> Saisie par classe</> : <><Plus size={18} className="text-blue-500" /> Note individuelle</>}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Champs communs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Matière *</label>
                  <select value={form.subject_id} onChange={e => setForm({...form, subject_id:e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    <option value="">— Matière —</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type *</label>
                  <select value={form.exam_type} onChange={e => setForm({...form, exam_type:e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    <option>Devoir</option><option>Composition</option><option>Examen</option><option>Contrôle</option><option>Interrogation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Trimestre</label>
                  <select value={form.trimester} onChange={e => setForm({...form, trimester:e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    <option>T1</option><option>T2</option><option>T3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Note max</label>
                  <input type="number" value={form.max_score} onChange={e => setForm({...form, max_score:e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>

              {/* Mode individuel */}
              {!bulkMode && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Élève *</label>
                    <select value={form.student_id} onChange={e => setForm({...form, student_id:e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                      <option value="">— Sélectionner un élève —</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Note obtenue *</label>
                    <input type="number" min="0" step="0.5" value={form.score} onChange={e => setForm({...form, score:e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                    {form.score && <div className={`text-xs mt-1 font-medium ${noteColor(parseFloat(form.score)/parseFloat(form.max_score)*20)}`}>
                      = {(parseFloat(form.score)/parseFloat(form.max_score)*20).toFixed(1)}/20 — {mention(parseFloat(form.score)/parseFloat(form.max_score)*20)}
                    </div>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Commentaire</label>
                    <input value={form.comments} onChange={e => setForm({...form, comments:e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" placeholder="Appréciation libre..." />
                  </div>
                </>
              )}

              {/* Mode classe entière */}
              {bulkMode && (
                <div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Classe *</label>
                    <select value={form.classroom_id} onChange={e => setForm({...form, classroom_id:e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                      <option value="">— Sélectionner une classe —</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {form.classroom_id && bulkRows.length > 0 && (
                    <div className="mt-4 max-h-56 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-3">
                      {bulkRows.map((row, i) => {
                        const s = students.find(x => x.id === row.student_id);
                        const pct = row.score !== '' ? parseFloat(row.score)/parseFloat(form.max_score)*20 : null;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 text-sm font-medium text-gray-700 truncate">{s?`${s.first_name} ${s.last_name}`:'—'}</div>
                            <input type="number" min="0" step="0.5" max={form.max_score} value={row.score}
                              onChange={e => setBulkRows(rows => rows.map((r,j) => j===i ? {...r, score:e.target.value} : r))}
                              placeholder={`/${form.max_score}`}
                              className={`w-20 px-2 py-1.5 border rounded-lg text-sm text-center focus:outline-none font-bold ${pct===null?'border-gray-200':pct>=14?'border-green-300 bg-green-50 text-green-700':pct>=10?'border-amber-300 bg-amber-50 text-amber-700':'border-red-300 bg-red-50 text-red-700'}`} />
                            {pct !== null && <span className={`text-xs font-medium w-16 text-right ${noteColor(pct)}`}>{pct.toFixed(1)}/20</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.notify_parent} onChange={e => setForm({...form, notify_parent:e.target.checked})} className="rounded" />
                <span className="text-sm text-gray-700">🔔 Notifier les parents automatiquement</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200">Annuler</button>
              <button onClick={bulkMode ? saveBulk : save} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MES CLASSES — vue synthétique
══════════════════════════════════════════ */
function MyClasses() {
  const [classrooms, setClassrooms] = useState([]);
  const [students,   setStudents]   = useState([]);
  const [grades,     setGrades]     = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([Classroom.list(), Student.list(), Grade.list(), Attendance.list()])
      .then(([c,s,g,a]) => { setClassrooms(c); setStudents(s); setGrades(g); setAttendance(a); if(c.length) setSelected(c[0].id); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const cls = classrooms.find(c => c.id === selected);
  const clsStudents = students.filter(s => s.classroom_id === selected);
  const clsGrades   = grades.filter(g => clsStudents.some(s => s.id === g.student_id));
  const clsAtt      = attendance.filter(a => clsStudents.some(s => s.id === a.student_id));
  const presenceRate = clsAtt.length ? (clsAtt.filter(a=>a.status==='Present').length / clsAtt.length * 100) : 100;
  const avgGrade = clsGrades.length ? clsGrades.reduce((s,g)=>s+(g.max_score?g.score/g.max_score*20:0),0)/clsGrades.length : 0;

  const mention = n => n>=16?'Très Bien':n>=14?'Bien':n>=12?'Assez Bien':n>=10?'Passable':'Insuffisant';

  // Classement des élèves par moyenne
  const ranking = clsStudents.map(s => {
    const sg = clsGrades.filter(g=>g.student_id===s.id);
    const avg = sg.length ? sg.reduce((acc,g)=>acc+(g.max_score?g.score/g.max_score*20:0),0)/sg.length : null;
    const abs = clsAtt.filter(a=>a.student_id===s.id&&a.status==='Absent').length;
    return { ...s, avg, absCount: abs, gradeCount: sg.length };
  }).sort((a,b)=>(b.avg??-1)-(a.avg??-1));

  if (loading) return <div className="py-20 text-center text-gray-400">⏳ Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* Sélecteur de classe */}
      <div className="flex gap-2 flex-wrap">
        {classrooms.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all ${selected===c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {cls && (
        <>
          {/* Infos classe */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="font-bold text-xl mb-3">{cls.name}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon:'👨‍🎓', label:'Effectif',        val:`${clsStudents.length} élèves` },
                { icon:'📝', label:'Moyenne classe',   val:`${avgGrade.toFixed(1)}/20` },
                { icon:'✅', label:'Taux présence',    val:`${presenceRate.toFixed(0)}%` },
                { icon:'🏆', label:'Meilleur',         val: ranking[0]?.avg != null ? `${ranking[0].avg.toFixed(1)}/20` : '—' },
              ].map((k,i) => (
                <div key={i} className="bg-white/15 rounded-xl p-3">
                  <div className="text-xl mb-0.5">{k.icon}</div>
                  <div className="font-bold text-sm">{k.val}</div>
                  <div className="text-white/60 text-xs">{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Classement élèves */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-800">
              Classement de la classe
            </div>
            <div className="divide-y divide-gray-50">
              {ranking.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-4 px-5 py-3 ${i < 3 ? 'bg-amber-50' : ''}`}>
                  <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-sm flex-shrink-0 ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-amber-600 text-white':'bg-gray-100 text-gray-500'}`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-400">{s.gradeCount} note(s) · {s.absCount} abs.</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.avg != null ? (
                      <>
                        <div className={`font-bold text-sm ${s.avg>=14?'text-green-600':s.avg>=10?'text-amber-600':'text-red-600'}`}>{s.avg.toFixed(1)}/20</div>
                        <div className="text-xs text-gray-400">{mention(s.avg)}</div>
                      </>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   APP PRINCIPALE
══════════════════════════════════════════ */
export default function TeacherApp({ onLogout, user }) {
  const menuItems = [
    { id: 'dashboard',  label: 'Tableau de bord',     icon: '📊', component: <TeacherDashboard user={user} /> },
    { id: 'attendance', label: 'Appel / Présences',   icon: '✅', component: <AttendanceManager user={user} /> },
    { id: 'grades',     label: 'Notes & Évaluations', icon: '📝', component: <GradesManager user={user} /> },
    { id: 'classes',    label: 'Mes classes',          icon: '🏛️', component: <MyClasses /> },
    { id: 'homework',   label: 'Devoirs',              icon: '📚', component: <HomeworkManager user={user} /> },
    { id: 'schedule',   label: 'Emploi du temps',      icon: '📅', component: (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <ScheduleViewer userRole="teacher" userId={user?.id} />
        </div>
      )
    },
    { id: 'messages',   label: 'Messagerie',           icon: '💬', component: <Messagerie currentRole="teacher" currentName={user?.userName||'Professeur'} accentColor="from-blue-500 to-indigo-600" /> },
  ];
  return <Layout role="teacher" menuItems={menuItems} onLogout={onLogout} userName={user?.userName} schoolName="RENO" />;
}
