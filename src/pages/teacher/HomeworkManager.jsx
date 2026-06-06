/**
 * HomeworkManager.jsx — Gestion des devoirs RENO (côté Professeur)
 *
 * Fonctionnalités :
 * 1. 📋 Devoirs & modules — liste, filtres, stats de lecture
 * 2. ➕ Création devoir avec 3 types de pièce jointe :
 *    - 📁 Fichier uploadé (PDF, Word, image...)
 *    - 📸 Photo (page de livre, tableau...)
 *    - 📖 Référence livre (nom, page, n° exercice)
 * 3. 📚 Modules de cours téléchargeables (Primaire → Université)
 * 4. 👁️ Statistiques vu/ouvert par élève ET parent
 * 5. 🔔 Notification groupée tous parents de la classe
 * 6. 🚌 Route du matin — appel rapide avant le cours
 * 7. ✅ Vérification devoirs rendus par classe
 * 8. 💬 Messagerie directe vers un parent spécifique
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Homework, HomeworkRead, Student, Subject, Notification,
  Classroom, Attendance, Message
} from '../../api/entities';
import {
  Plus, Eye, Bell, Calendar, CheckCircle, Clock, AlertCircle,
  Send, Upload, Camera, BookOpen, Users, Search, Filter,
  Bus, MessageSquare, Download, RefreshCw, ChevronDown, ChevronUp,
  FileText, Image, Hash, X, CheckSquare, Square, Save
} from 'lucide-react';

const TYPE_COLORS = {
  'Devoir maison':     'bg-violet-100 text-violet-700',
  'Leçon à apprendre':'bg-blue-100 text-blue-700',
  'Exercice':          'bg-cyan-100 text-cyan-700',
  'Projet':            'bg-orange-100 text-orange-700',
  'Exposé':            'bg-pink-100 text-pink-700',
  'Module de cours':   'bg-emerald-100 text-emerald-700',
  'Autre':             'bg-gray-100 text-gray-700',
};

function daysDiff(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}
function DueBadge({ dueDate }) {
  const d = daysDiff(dueDate);
  if (d === null) return null;
  if (d < 0)  return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700">⚠️ Expiré</span>;
  if (d === 0) return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700">🔴 Aujourd'hui</span>;
  if (d === 1) return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">⏰ Demain</span>;
  if (d <= 3)  return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600">📅 Dans {d}j</span>;
  return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-green-50 text-green-600">📅 {dueDate}</span>;
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function HomeworkManager({ user }) {
  const [tab, setTab] = useState('devoirs');
  const [homeworks,  setHomeworks]  = useState([]);
  const [students,   setStudents]   = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [readStats,  setReadStats]  = useState({});
  const [allReads,   setAllReads]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const TABS = [
    { id:'devoirs',       label:'📋 Devoirs',          },
    { id:'modules',       label:'📚 Modules de cours', },
    { id:'route',         label:'🚌 Route du matin',   },
    { id:'verification',  label:'✅ Vérification',     },
    { id:'messages',      label:'💬 Contacter parent', },
  ];

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [hw, st, subj, reads, cls] = await Promise.all([
        Homework.list(), Student.list(), Subject.list(), HomeworkRead.list(), Classroom.list(),
      ]);
      setHomeworks(hw.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)));
      setStudents(st); setSubjects(subj); setClassrooms(cls); setAllReads(reads);
      const stats = {};
      hw.forEach(h => {
        const hwR = reads.filter(r => r.homework_id === h.id);
        const seenStudents = new Set(hwR.filter(r=>r.reader_type==='student').map(r=>r.student_id)).size;
        const seenParents  = new Set(hwR.filter(r=>r.reader_type==='parent').map(r=>r.student_id)).size;
        const openedStudents = hwR.filter(r=>r.reader_type==='student'&&r.opened_at).length;
        const openedParents  = hwR.filter(r=>r.reader_type==='parent'&&r.opened_at).length;
        stats[h.id] = { seenStudents, seenParents, openedStudents, openedParents, total: st.length };
      });
      setReadStats(stats);
    } catch(e) {}
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab===t.id ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'devoirs'      && <DevoirsTab homeworks={homeworks.filter(h=>!h.is_course_module)} students={students} subjects={subjects} classrooms={classrooms} readStats={readStats} allReads={allReads} user={user} onReload={load} loading={loading} />}
      {tab === 'modules'      && <ModulesTab homeworks={homeworks.filter(h=>h.is_course_module)} students={students} subjects={subjects} classrooms={classrooms} readStats={readStats} allReads={allReads} user={user} onReload={load} loading={loading} />}
      {tab === 'route'        && <RouteMatinTab students={students} classrooms={classrooms} />}
      {tab === 'verification' && <VerificationTab homeworks={homeworks.filter(h=>!h.is_course_module)} students={students} classrooms={classrooms} subjects={subjects} />}
      {tab === 'messages'     && <ParentMessageTab students={students} classrooms={classrooms} user={user} />}
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET : DEVOIRS
══════════════════════════════════════════ */
function DevoirsTab({ homeworks, students, subjects, classrooms, readStats, allReads, user, onReload, loading }) {
  const [showForm,   setShowForm]   = useState(false);
  const [filter,     setFilter]     = useState({ cls:'', type:'' });
  const [expanded,   setExpanded]   = useState(null);
  const [sending,    setSending]    = useState(false);

  const filtered = homeworks.filter(h =>
    (!filter.cls  || h.classroom_id === filter.cls) &&
    (!filter.type || h.type === filter.type)
  );
  const active  = filtered.filter(h => daysDiff(h.due_date) >= 0);
  const expired = filtered.filter(h => daysDiff(h.due_date) < 0 || h.status === 'Expired');

  async function sendReminder(hw) {
    const clsStudents = hw.classroom_id ? students.filter(s=>s.classroom_id===hw.classroom_id) : students;
    const subj = subjects.find(s=>s.id===hw.subject_id);
    await Promise.allSettled(clsStudents.map(s => Notification.create({
      student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
      type:'Rappel', title:`⏰ Rappel — ${hw.title}`,
      message:`Rappel : le devoir "${hw.title}" (${subj?.name||''}) est à remettre le ${hw.due_date}.`,
      channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
    })));
    await Homework.update(hw.id, { reminder_sent:true });
    alert(`✅ Rappel envoyé à ${clsStudents.length} famille(s)`);
    onReload();
  }

  async function notifyAll(hw) {
    const clsStudents = hw.classroom_id ? students.filter(s=>s.classroom_id===hw.classroom_id) : students;
    const subj = subjects.find(s=>s.id===hw.subject_id);
    await Promise.allSettled(clsStudents.map(s => Notification.create({
      student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
      type:'Devoir', title:`📚 Nouveau devoir — ${hw.title}`,
      message:`${s.first_name} a un nouveau devoir :\n📖 ${subj?.name||'Matière'} — ${hw.type}\n📅 À rendre le : ${hw.due_date||'—'}\n\n${hw.description||''}${hw.reference_book ? `\n📖 Réf: ${hw.reference_book} p.${hw.reference_page||'?'} Ex.${hw.reference_exercise||'?'}` : ''}`,
      channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
    })));
    alert(`✅ Notification envoyée à ${clsStudents.length} parent(s)`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <span className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-3 py-2 text-sm font-medium">
            📋 {active.length} actif(s) · ⚠️ {filtered.filter(h=>daysDiff(h.due_date)===1&&!h.reminder_sent).length} rappel(s) à envoyer
          </span>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Nouveau devoir
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <select value={filter.cls} onChange={e => setFilter({...filter, cls:e.target.value})}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Toutes les classes</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filter.type} onChange={e => setFilter({...filter, type:e.target.value})}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous types</option>
          {Object.keys(TYPE_COLORS).filter(t=>t!=='Module de cours').map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">⏳ Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">📚</div>
          <p className="font-medium text-gray-600">Aucun devoir</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...active, ...expired].map(hw => {
            const stats = readStats[hw.id] || { seenStudents:0, seenParents:0, openedStudents:0, openedParents:0, total:students.length };
            const subj = subjects.find(s=>s.id===hw.subject_id);
            const cls  = classrooms.find(c=>c.id===hw.classroom_id);
            const isExp = daysDiff(hw.due_date) < 0;
            const isOpen = expanded === hw.id;
            const clsStudents = hw.classroom_id ? students.filter(s=>s.classroom_id===hw.classroom_id) : students;
            const hwReads = allReads.filter(r=>r.homework_id===hw.id);

            return (
              <div key={hw.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${isExp?'opacity-70 border-gray-100':'border-gray-100 hover:border-blue-200'}`}>
                <button onClick={() => setExpanded(isOpen ? null : hw.id)} className="w-full text-left">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${TYPE_COLORS[hw.type]||'bg-gray-100 text-gray-600'}`}>{hw.type}</span>
                        {subj && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs">{subj.name}</span>}
                        {cls  && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">🏛️ {cls.name}</span>}
                        <DueBadge dueDate={hw.due_date} />
                        {/* Badges pièce jointe */}
                        {hw.attachment_type === 'file'      && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs">📁 Fichier</span>}
                        {hw.attachment_type === 'photo'     && <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-lg text-xs">📸 Photo</span>}
                        {hw.attachment_type === 'reference' && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-xs">📖 Référence</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{hw.title}</h3>
                      {hw.description && <p className="text-xs text-gray-500 line-clamp-2">{hw.description}</p>}
                      {hw.reference_book && (
                        <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1 inline-block">
                          📖 {hw.reference_book} · p.{hw.reference_page||'?'} · Ex.{hw.reference_exercise||'?'}
                        </div>
                      )}
                    </div>
                    {/* Stats rapides */}
                    <div className="flex-shrink-0 text-center space-y-1">
                      <div className="bg-blue-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-blue-500 font-medium">Élèves</div>
                        <div className="font-bold text-blue-700">{stats.seenStudents}/{clsStudents.length}</div>
                        <div className="text-xs text-gray-400">vus</div>
                      </div>
                      <div className="bg-violet-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-violet-500 font-medium">Parents</div>
                        <div className="font-bold text-violet-700">{stats.seenParents}/{clsStudents.length}</div>
                        <div className="text-xs text-gray-400">vus</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 mt-1 flex-shrink-0" />}
                  </div>
                </button>

                {/* Détail déroulant */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => notifyAll(hw)}
                        className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-violet-700">
                        <Bell size={14} /> Notifier tous les parents
                      </button>
                      {!hw.reminder_sent && daysDiff(hw.due_date) >= 0 && (
                        <button onClick={() => sendReminder(hw)}
                          className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-amber-600">
                          <Clock size={14} /> Envoyer rappel
                        </button>
                      )}
                      {hw.attachment_url && (
                        <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-medium hover:bg-blue-100">
                          <Download size={14} /> Télécharger la pièce jointe
                        </a>
                      )}
                    </div>

                    {/* Pièce jointe photo */}
                    {hw.attachment_type === 'photo' && hw.attachment_url && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">📸 Photo jointe</div>
                        <img src={hw.attachment_url} alt="devoir" className="max-h-48 rounded-xl object-contain border border-gray-200" />
                      </div>
                    )}

                    {/* Suivi par élève */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">👁️ Suivi lecture par élève</div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {clsStudents.map(s => {
                          const sRead   = hwReads.find(r=>r.student_id===s.id&&r.reader_type==='student');
                          const pRead   = hwReads.find(r=>r.student_id===s.id&&r.reader_type==='parent');
                          return (
                            <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {s.first_name?.[0]}{s.last_name?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</div>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${sRead ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                  🎒 {sRead ? (sRead.opened_at ? 'Ouvert' : 'Vu') : 'Non vu'}
                                </span>
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${pRead ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                                  👨‍👩‍👧 {pRead ? (pRead.opened_at ? 'Ouvert' : 'Vu') : 'Non vu'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <HomeworkForm
          subjects={subjects} classrooms={classrooms} students={students}
          isModule={false}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onReload(); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET : MODULES DE COURS
══════════════════════════════════════════ */
function ModulesTab({ homeworks, students, subjects, classrooms, readStats, allReads, user, onReload, loading }) {
  const [showForm,  setShowForm]  = useState(false);
  const [filter,    setFilter]    = useState({ level:'', cls:'' });
  const [expanded,  setExpanded]  = useState(null);

  const filtered = homeworks.filter(h =>
    (!filter.level || h.course_level === filter.level) &&
    (!filter.cls   || h.classroom_id === filter.cls)
  );

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-100 p-2 rounded-xl"><BookOpen size={18} className="text-emerald-600" /></div>
          <div>
            <div className="font-bold text-emerald-800">Modules de cours téléchargeables</div>
            <div className="text-sm text-emerald-600">Primaire · Collège · Lycée · Université</div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700">
            <Plus size={15} /> Publier un module
          </button>
        </div>
        <p className="text-xs text-emerald-700">
          Partagez des PDF, supports de cours, exercices corrigés. Chaque téléchargement est tracé (vu/ouvert) par élève et parent.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <select value={filter.level} onChange={e => setFilter({...filter, level:e.target.value})}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous niveaux</option>
          {['Primaire','Collège','Lycée','Université','Autre'].map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={filter.cls} onChange={e => setFilter({...filter, cls:e.target.value})}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Toutes les classes</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <div className="py-10 text-center text-gray-400">⏳ Chargement...</div>
       : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">📚</div>
          <p className="font-medium text-gray-600">Aucun module publié</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(hw => {
            const stats = readStats[hw.id] || { seenStudents:0, seenParents:0, total:students.length };
            const subj  = subjects.find(s=>s.id===hw.subject_id);
            const cls   = classrooms.find(c=>c.id===hw.classroom_id);
            const clsStudents = hw.classroom_id ? students.filter(s=>s.classroom_id===hw.classroom_id) : students;
            const hwReads = allReads.filter(r=>r.homework_id===hw.id);
            const isOpen  = expanded === hw.id;

            return (
              <div key={hw.id} className="bg-white rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-300 transition-all">
                <button onClick={() => setExpanded(isOpen ? null : hw.id)} className="w-full text-left">
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {hw.attachment_type === 'photo' ? <Image size={22} className="text-emerald-600" /> : <FileText size={22} className="text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {hw.course_level && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">{hw.course_level}</span>}
                        {subj && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs">{subj.name}</span>}
                        {cls  && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">{cls.name}</span>}
                      </div>
                      <div className="font-bold text-gray-800">{hw.title}</div>
                      {hw.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hw.description}</div>}
                    </div>
                    <div className="flex-shrink-0 text-right mr-2">
                      <div className="text-sm font-bold text-emerald-700">{stats.seenStudents}/{clsStudents.length}</div>
                      <div className="text-xs text-gray-400">élèves vus</div>
                      <div className="text-sm font-bold text-violet-700">{stats.seenParents}/{clsStudents.length}</div>
                      <div className="text-xs text-gray-400">parents vus</div>
                    </div>
                    {hw.attachment_url && (
                      <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                        className="flex-shrink-0 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-emerald-700 flex items-center gap-1">
                        <Download size={14} /> Télécharger
                      </a>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">👁️ Suivi par élève</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {clsStudents.map(s => {
                        const sRead = hwReads.find(r=>r.student_id===s.id&&r.reader_type==='student');
                        const pRead = hwReads.find(r=>r.student_id===s.id&&r.reader_type==='parent');
                        return (
                          <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2">
                            <div className="flex-1 text-sm font-medium text-gray-700">{s.first_name} {s.last_name}</div>
                            <span className={`text-xs px-2 py-1 rounded-lg font-medium ${sRead?(sRead.opened_at?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-600'):'bg-gray-100 text-gray-400'}`}>
                              🎒 {sRead?(sRead.opened_at?'Téléchargé':'Vu'):'Non vu'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-lg font-medium ${pRead?(pRead.opened_at?'bg-emerald-100 text-emerald-700':'bg-violet-100 text-violet-600'):'bg-gray-100 text-gray-400'}`}>
                              👨‍👩‍👧 {pRead?(pRead.opened_at?'Téléchargé':'Vu'):'Non vu'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <HomeworkForm subjects={subjects} classrooms={classrooms} students={students}
          isModule={true}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onReload(); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE DEVOIR / MODULE (unifié)
══════════════════════════════════════════ */
function HomeworkForm({ subjects, classrooms, students, isModule, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:'', description:'', type: isModule ? 'Module de cours' : 'Devoir maison',
    subject_id:'', classroom_id:'', due_date:'',
    assigned_date: new Date().toISOString().split('T')[0],
    notify_parents:true, notify_students:true, status:'Active',
    attachment_type:'none', attachment_url:'', reference_book:'', reference_page:'', reference_exercise:'',
    course_level: isModule ? 'Primaire' : '', is_course_module: isModule,
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef();
  const photoRef = useRef();

  async function handleFileUpload(e, isPhoto) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Lire en base64 dataURL pour preview / stockage
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(f => ({ ...f, attachment_url: ev.target.result, attachment_type: isPhoto ? 'photo' : 'file' }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploading(false); }
  }

  async function save() {
    if (!form.title.trim()) { alert('Le titre est obligatoire.'); return; }
    setSaving(true);
    try {
      const hw = await Homework.create({ ...form });
      // Notification groupée aux parents de la classe
      if (form.notify_parents && form.classroom_id) {
        const clsStudents = students.filter(s=>s.classroom_id===form.classroom_id);
        const subj = subjects.find(s=>s.id===form.subject_id);
        await Promise.allSettled(clsStudents.map(s => Notification.create({
          student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
          type: isModule ? 'Module' : 'Devoir',
          title: isModule ? `📚 Nouveau module — ${form.title}` : `📝 Nouveau devoir — ${form.title}`,
          message: isModule
            ? `Un module de cours "${form.title}" (${form.course_level} · ${subj?.name||''}) a été publié. Consultez-le dans RENO.`
            : `${s.first_name} a un nouveau devoir : "${form.title}"\n📖 ${subj?.name||''} — ${form.type}\n📅 À rendre le : ${form.due_date||'—'}\n${form.reference_book ? `\n📖 Réf: ${form.reference_book} p.${form.reference_page||'?'} Ex.${form.reference_exercise||'?'}` : ''}\n${form.description||''}`,
          channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
        })));
      }
      onSaved();
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl">
        <div className={`flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl ${isModule ? 'bg-emerald-50' : 'bg-blue-50'}`}>
          <h3 className={`font-bold text-lg flex items-center gap-2 ${isModule ? 'text-emerald-800' : 'text-blue-800'}`}>
            {isModule ? <><BookOpen size={18} /> Publier un module de cours</> : <><Plus size={18} /> Nouveau devoir</>}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white/60 rounded-xl">✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Infos de base */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Titre *</label>
            <input value={form.title} onChange={e => setForm({...form, title:e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={isModule ? "Ex: Cours de Mathématiques — Les fractions" : "Ex: Problèmes de mathématiques"} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Matière</label>
              <select value={form.subject_id} onChange={e => setForm({...form, subject_id:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                <option value="">— Matière —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Classe</label>
              <select value={form.classroom_id} onChange={e => setForm({...form, classroom_id:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                <option value="">— Classe —</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {!isModule && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                  {['Devoir maison','Leçon à apprendre','Exercice','Projet','Exposé','Autre'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            {isModule && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Niveau</label>
                <select value={form.course_level} onChange={e => setForm({...form, course_level:e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                  {['Primaire','Collège','Lycée','Université','Autre'].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            )}
            {!isModule && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Date limite</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date:e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description / Instructions</label>
            <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none"
              placeholder={isModule ? "Contenu du cours, objectifs pédagogiques..." : "Instructions pour les élèves..."} />
          </div>

          {/* ── PIÈCE JOINTE — 3 types ── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              {isModule ? '📎 Fichier / Support de cours' : '📎 Pièce jointe'}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id:'none',      icon:<X size={16}/>,        label:'Aucune' },
                { id:'file',      icon:<FileText size={16}/>, label:'Fichier' },
                { id:'photo',     icon:<Camera size={16}/>,   label:'Photo' },
                { id:'reference', icon:<Hash size={16}/>,     label:'Référence', hideForModule: isModule },
              ].filter(t=>!t.hideForModule).map(opt => (
                <button key={opt.id} onClick={() => setForm({...form, attachment_type:opt.id, attachment_url:''})}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${form.attachment_type===opt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>
                  {opt.icon}<span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Upload fichier */}
            {form.attachment_type === 'file' && (
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" className="hidden" onChange={e => handleFileUpload(e, false)} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-200 rounded-xl p-4 text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2">
                  <Upload size={18} /> {uploading ? 'Chargement...' : form.attachment_url ? '✅ Fichier chargé — Changer' : 'Sélectionner un fichier (PDF, Word, PPT...)'}
                </button>
                {form.attachment_url && !uploading && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Fichier prêt à publier</div>
                )}
              </div>
            )}

            {/* Upload photo */}
            {form.attachment_type === 'photo' && (
              <div>
                <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e, true)} />
                <button onClick={() => photoRef.current?.click()}
                  className="w-full border-2 border-dashed border-pink-200 rounded-xl p-4 text-pink-600 text-sm font-medium hover:bg-pink-50 flex items-center justify-center gap-2">
                  <Camera size={18} /> {uploading ? 'Chargement...' : form.attachment_url ? '✅ Photo chargée — Changer' : 'Prendre une photo ou sélectionner une image'}
                </button>
                {form.attachment_url && !uploading && (
                  <img src={form.attachment_url} alt="preview" className="mt-2 max-h-32 rounded-xl object-contain border border-pink-200" />
                )}
              </div>
            )}

            {/* Référence livre */}
            {form.attachment_type === 'reference' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-2"><BookOpen size={14} /> Référence du manuel scolaire</div>
                <div>
                  <label className="text-xs font-medium text-amber-700 mb-1 block">Nom du livre / manuel *</label>
                  <input value={form.reference_book} onChange={e => setForm({...form, reference_book:e.target.value})}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:outline-none bg-white"
                    placeholder="Ex: Mathématiques 5ème — Édition CELTA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-amber-700 mb-1 block">Page(s)</label>
                    <input value={form.reference_page} onChange={e => setForm({...form, reference_page:e.target.value})}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:outline-none bg-white"
                      placeholder="Ex: 47-48" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-700 mb-1 block">N° exercice(s)</label>
                    <input value={form.reference_exercise} onChange={e => setForm({...form, reference_exercise:e.target.value})}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:outline-none bg-white"
                      placeholder="Ex: 3, 5 et 7" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">🔔 Notifications</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.notify_parents} onChange={e => setForm({...form, notify_parents:e.target.checked})} className="rounded" />
              <span className="text-sm text-gray-700">Notifier tous les parents de la classe</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.notify_students} onChange={e => setForm({...form, notify_students:e.target.checked})} className="rounded" />
              <span className="text-sm text-gray-700">Notifier les élèves</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200">Annuler</button>
          <button onClick={save} disabled={saving || uploading}
            className={`flex-1 py-3 rounded-2xl font-bold text-white transition-all disabled:opacity-50 ${isModule ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saving ? 'Publication...' : isModule ? '📚 Publier le module' : '✅ Créer le devoir'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET : ROUTE DU MATIN
══════════════════════════════════════════ */
function RouteMatinTab({ students, classrooms }) {
  const [selectedCls, setSelectedCls] = useState('');
  const [statuses,    setStatuses]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const STATUS = {
    Present: { label:'✅ Présent',  color:'bg-green-500 text-white border-green-500', btn:'bg-green-500 text-white' },
    Absent:  { label:'❌ Absent',   color:'bg-red-500 text-white border-red-500',     btn:'bg-red-500 text-white' },
    Late:    { label:'⏰ En retard',color:'bg-amber-500 text-white border-amber-500', btn:'bg-amber-500 text-white' },
    Bus:     { label:'🚌 Bus',      color:'bg-blue-500 text-white border-blue-500',   btn:'bg-blue-500 text-white' },
    Walk:    { label:'🚶 À pied',   color:'bg-teal-500 text-white border-teal-500',   btn:'bg-teal-500 text-white' },
  };

  const cls = classrooms.find(c=>c.id===selectedCls);
  const clsStudents = students.filter(s=>s.classroom_id===selectedCls);

  useEffect(() => {
    if (!selectedCls) return;
    const init = {};
    clsStudents.forEach(s => { init[s.id] = 'Present'; });
    setStatuses(init); setSaved(false);
  }, [selectedCls]);

  function markAll(st) {
    const u = {}; clsStudents.forEach(s => { u[s.id] = st; }); setStatuses(u);
  }

  async function saveRoute() {
    setSaving(true);
    try {
      await Promise.all(clsStudents.map(async s => {
        const st = statuses[s.id] || 'Present';
        await Attendance.create({ student_id:s.id, classroom_id:selectedCls, date:today, status: st === 'Bus' || st === 'Walk' ? 'Present' : st, check_in_time: new Date().toTimeString().slice(0,5), notes:`Route : ${STATUS[st]?.label||st}`, parent_notified:false });
        if (st === 'Absent') {
          await Notification.create({ student_id:s.id, parent_name:s.parent_name, parent_email:s.parent_email, parent_phone:s.parent_phone, type:'Absence', title:`⚠️ Absent — ${s.first_name} ${s.last_name}`, message:`${s.first_name} n'est pas arrivé(e) à l'école ce matin (${today}). Veuillez contacter l'établissement.`, channel:'Push', status:'Sent', sent_at:new Date().toISOString() });
        }
      }));
      setSaved(true);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  const stats = { Present:0, Absent:0, Late:0, Bus:0, Walk:0 };
  Object.values(statuses).forEach(st => { if(stats[st]!==undefined) stats[st]++; });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
        <div className="font-bold text-lg mb-1 flex items-center gap-2"><Bus size={20} /> Route du matin</div>
        <div className="text-white/70 text-sm">Prise en charge rapide à l'arrivée · {today}</div>
      </div>

      {/* Sélecteur classe */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Classe</label>
        <select value={selectedCls} onChange={e => setSelectedCls(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">— Sélectionner une classe —</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedCls && clsStudents.length > 0 && (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(stats).map(([st,n]) => (
              <div key={st} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
                <div className="text-xl font-bold text-gray-800">{n}</div>
                <div className="text-xs text-gray-400 truncate">{STATUS[st]?.label.split(' ')[0]||st}</div>
              </div>
            ))}
          </div>

          {/* Boutons globaux */}
          <div className="flex gap-2 flex-wrap">
            {['Present','Absent','Bus'].map(st => (
              <button key={st} onClick={() => markAll(st)}
                className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-all ${STATUS[st]?.btn}`}>
                Tous {STATUS[st]?.label}
              </button>
            ))}
          </div>

          {/* Liste élèves */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {clsStudents.map((s, i) => {
                const current = statuses[s.id] || 'Present';
                return (
                  <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${current==='Absent'?'bg-red-50':current==='Late'?'bg-amber-50':''}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {Object.entries(STATUS).map(([st, cfg]) => (
                        <button key={st} onClick={() => setStatuses({...statuses, [s.id]:st})}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all border ${current===st ? cfg.color : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={saveRoute} disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${saved?'bg-green-500 text-white':'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'}`}>
            {saving ? <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</> :
             saved  ? <><CheckCircle size={16} /> Route enregistrée !</> :
                      <><Save size={16} /> Valider la route du matin</>}
          </button>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET : VÉRIFICATION DEVOIRS
══════════════════════════════════════════ */
function VerificationTab({ homeworks, students, classrooms, subjects }) {
  const [selectedHW, setSelectedHW]   = useState('');
  const [rendered,   setRendered]     = useState({});
  const [saving,     setSaving]       = useState(false);
  const [saved,      setSaved]        = useState(false);

  const hw      = homeworks.find(h=>h.id===selectedHW);
  const subj    = subjects.find(s=>s.id===hw?.subject_id);
  const cls     = classrooms.find(c=>c.id===hw?.classroom_id);
  const clsStudents = hw?.classroom_id ? students.filter(s=>s.classroom_id===hw.classroom_id) : students;

  useEffect(() => {
    if (!hw) return;
    const init = {};
    clsStudents.forEach(s => { init[s.id] = false; });
    setRendered(init); setSaved(false);
  }, [selectedHW]);

  function markAll(v) { const u={}; clsStudents.forEach(s=>{u[s.id]=v;}); setRendered(u); }

  const countRendered = Object.values(rendered).filter(Boolean).length;

  async function saveVerif() {
    setSaving(true);
    try {
      // Notifier les parents des élèves n'ayant PAS rendu
      const notRendered = clsStudents.filter(s => !rendered[s.id]);
      await Promise.allSettled(notRendered.map(s => Notification.create({
        student_id: s.id, parent_name: s.parent_name, parent_email: s.parent_email, parent_phone: s.parent_phone,
        type:'Devoir', title:`⚠️ Devoir non rendu — ${s.first_name} ${s.last_name}`,
        message:`Votre enfant ${s.first_name} n'a pas rendu le devoir "${hw?.title||'—'}" (${subj?.name||''}) prévu pour le ${hw?.due_date||'—'}.`,
        channel:'Push', status:'Sent', sent_at: new Date().toISOString(),
      })));
      setSaved(true);
      if (notRendered.length > 0) alert(`✅ ${notRendered.length} parent(s) notifié(s) (devoir non rendu)`);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  const activeHW = homeworks.filter(h => daysDiff(h.due_date) >= -3);

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <div className="font-bold text-indigo-800 flex items-center gap-2 mb-1"><CheckCircle size={18} /> Vérification des devoirs rendus</div>
        <div className="text-sm text-indigo-600">Cochez les élèves ayant rendu leur devoir. Les parents des élèves restants seront automatiquement notifiés.</div>
      </div>

      {/* Sélecteur devoir */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Devoir à vérifier</label>
        <select value={selectedHW} onChange={e => setSelectedHW(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">— Sélectionner un devoir —</option>
          {activeHW.map(h => {
            const s = subjects.find(s=>s.id===h.subject_id);
            const c = classrooms.find(c=>c.id===h.classroom_id);
            return <option key={h.id} value={h.id}>{h.title} · {s?.name||'—'} · {c?.name||'—'} · {h.due_date}</option>;
          })}
        </select>
      </div>

      {selectedHW && hw && (
        <>
          {/* Infos devoir */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-xl"><FileText size={18} className="text-indigo-600" /></div>
              <div>
                <div className="font-bold text-gray-800">{hw.title}</div>
                <div className="text-xs text-gray-500">{subj?.name||'—'} · {cls?.name||'—'} · Rendu le {hw.due_date}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold text-indigo-700">{countRendered}/{clsStudents.length}</div>
                <div className="text-xs text-gray-400">rendus</div>
              </div>
            </div>
            {/* Barre progression */}
            <div className="mt-3 bg-gray-100 rounded-full h-3">
              <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width:`${clsStudents.length ? countRendered/clsStudents.length*100 : 0}%` }} />
            </div>
          </div>

          {/* Boutons globaux */}
          <div className="flex gap-2">
            <button onClick={() => markAll(true)}  className="flex-1 bg-green-100 text-green-700 border border-green-200 py-2 rounded-xl text-sm font-medium hover:bg-green-200">✅ Tous rendus</button>
            <button onClick={() => markAll(false)} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-medium hover:bg-red-100">❌ Aucun rendu</button>
          </div>

          {/* Liste élèves */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {clsStudents.map((s) => (
                <button key={s.id} onClick={() => setRendered({...rendered, [s.id]:!rendered[s.id]})}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-all text-left ${rendered[s.id]?'bg-green-50':''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all ${rendered[s.id]?'bg-green-500 text-white':'bg-gray-100 text-gray-400'}`}>
                    {rendered[s.id] ? <CheckCircle size={18} /> : <Square size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${rendered[s.id]?'text-green-800':'text-gray-800'}`}>{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-400">{s.registration_number||'—'}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-xl font-medium ${rendered[s.id]?'bg-green-100 text-green-700':'bg-red-50 text-red-500'}`}>
                    {rendered[s.id] ? '✅ Rendu' : '❌ Non rendu'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveVerif} disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${saved?'bg-green-500 text-white':'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'}`}>
            {saving ? 'Envoi...' :
             saved  ? '✅ Vérification enregistrée' :
                      `🔔 Valider et notifier les ${clsStudents.length - countRendered} parent(s) concerné(s)`}
          </button>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET : MESSAGE DIRECT PARENT
══════════════════════════════════════════ */
function ParentMessageTab({ students, classrooms, user }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [search,          setSearch]          = useState('');
  const [subject,         setSubject]         = useState('');
  const [body,            setBody]            = useState('');
  const [priority,        setPriority]        = useState('Normal');
  const [sending,         setSending]         = useState(false);
  const [sent,            setSent]            = useState(false);
  const [selectedCls,     setSelectedCls]     = useState('');

  const filteredStudents = students.filter(s =>
    (!selectedCls || s.classroom_id === selectedCls) &&
    (!search || `${s.first_name} ${s.last_name} ${s.parent_name||''}`.toLowerCase().includes(search.toLowerCase()))
  );

  const student = students.find(s=>s.id===selectedStudent);
  const cls     = classrooms.find(c=>c.id===student?.classroom_id);

  const QUICK_MESSAGES = [
    { label:'Convocation parent', text:'Nous vous convoquons à l\'école pour discuter de la situation scolaire de votre enfant.' },
    { label:'Retard répété',      text:`Votre enfant accumule des retards répétés. Merci de veiller à la ponctualité.` },
    { label:'Comportement',       text:`Le comportement de votre enfant en classe nécessite votre attention.` },
    { label:'Félicitations',      text:`Félicitations ! Votre enfant fait preuve d'excellents résultats et d'un comportement exemplaire.` },
    { label:'Devoir non rendu',   text:`Votre enfant n'a pas rendu le devoir prévu. Merci de vérifier avec lui/elle.` },
  ];

  async function sendMessage() {
    if (!selectedStudent || !subject.trim() || !body.trim()) { alert('Élève, objet et message obligatoires.'); return; }
    setSending(true);
    try {
      await Message.create({
        sender_role:    'teacher',
        sender_name:    user?.userName || 'Professeur',
        sender_email:   user?.email   || '',
        recipient_role: 'parent',
        recipient_name: student?.parent_name || 'Parent',
        student_id:     student.id,
        student_name:   `${student.first_name} ${student.last_name}`,
        subject:        subject.trim(),
        body:           body.trim(),
        is_read:        false,
        priority,
      });
      // Notification push au parent
      await Notification.create({
        student_id:   student.id,
        parent_name:  student.parent_name,
        parent_email: student.parent_email,
        parent_phone: student.parent_phone,
        type:         'Message',
        title:        `💬 Message du professeur — ${subject}`,
        message:      body.trim(),
        channel:      'Push',
        status:       'Sent',
        sent_at:      new Date().toISOString(),
      });
      setSent(true);
      setSubject(''); setBody('');
      setTimeout(() => setSent(false), 3000);
    } catch(e) { alert(e.message); }
    setSending(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-4 text-white">
        <div className="font-bold text-lg flex items-center gap-2 mb-1"><MessageSquare size={20} /> Contacter un parent</div>
        <div className="text-white/70 text-sm">Message direct · Confidentiel · Tracé dans la messagerie</div>
      </div>

      {/* Recherche élève */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Classe (filtre)</label>
          <select value={selectedCls} onChange={e => setSelectedCls(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Toutes</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Rechercher</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom élève ou parent..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Sélecteur élève */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Élève concerné *</label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
          {filteredStudents.slice(0,20).map(s => {
            const c = classrooms.find(c=>c.id===s.classroom_id);
            return (
              <button key={s.id} onClick={() => setSelectedStudent(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-all ${selectedStudent===s.id?'bg-indigo-50 border-l-4 border-indigo-500':''}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</div>
                  <div className="text-xs text-gray-400">{c?.name||'—'} · Parent : {s.parent_name||'—'}</div>
                </div>
                {s.parent_phone && <span className="text-xs text-gray-400 flex-shrink-0">📞 {s.parent_phone}</span>}
              </button>
            );
          })}
          {filteredStudents.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">Aucun élève trouvé</div>}
        </div>
      </div>

      {/* Infos parent sélectionné */}
      {student && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
            {student.parent_name?.[0]||'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-indigo-900">{student.parent_name||'Parent'}</div>
            <div className="text-xs text-indigo-600 flex items-center gap-2 flex-wrap">
              {student.parent_phone && <span>📞 {student.parent_phone}</span>}
              {student.parent_email && <span>✉️ {student.parent_email}</span>}
              <span>Enfant : {student.first_name} {student.last_name} · {cls?.name||'—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages rapides */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Messages rapides</label>
        <div className="flex gap-2 flex-wrap">
          {QUICK_MESSAGES.map(m => (
            <button key={m.label} onClick={() => { setSubject(m.label); setBody(m.text); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-indigo-100 hover:text-indigo-700 transition-all border border-gray-200">
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Priorité</label>
          <div className="flex gap-2">
            {['Normal','Important','Urgent'].map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${priority===p ? (p==='Urgent'?'bg-red-600 text-white border-red-600':p==='Important'?'bg-amber-500 text-white border-amber-500':'bg-indigo-600 text-white border-indigo-600') : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {p==='Urgent'?'🔴':p==='Important'?'🟡':'🟢'} {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Objet *</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Ex: Retards répétés — À voir ensemble" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Votre message au parent de l'élève..." />
        </div>
      </div>

      <button onClick={sendMessage} disabled={sending || !selectedStudent || !subject || !body}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${sent?'bg-green-500 text-white':sending?'bg-indigo-400 text-white':'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40'}`}>
        {sending ? <><RefreshCw size={16} className="animate-spin" /> Envoi...</>  :
         sent    ? <><CheckCircle size={16} /> Message envoyé au parent !</>        :
                   <><Send size={16} /> Envoyer le message</>}
      </button>
    </div>
  );
}
