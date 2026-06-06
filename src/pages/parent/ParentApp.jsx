import Layout from '../../components/Layout';
import { ParentFeesModule } from '../accountant/WalletPayment';
import WalletModule from './WalletModule';
import React, { useState, useEffect } from 'react';
import { Grade, Attendance, Notification, Event, Fee, Homework, HomeworkRead, Student, AbsenceReport } from '../../api/entities';
import Messagerie from '../../components/Messagerie';
import ParentNotificationsPage from './ParentNotifications';
import ParentServices from './ParentServices';
import { useSchool } from '../../hooks/useSchool';
import { ChevronDown, Users } from 'lucide-react';

/* ─── Sélecteur d'enfant ─── */
function ChildSelector({ children, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  if (!children.length) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
      <Users size={16} /> Aucun enfant enregistré avec ce numéro de téléphone
    </div>
  );
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white border border-orange-200 rounded-xl px-4 py-2.5 shadow-sm hover:border-orange-400 transition-all">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {selected?.first_name?.[0]}{selected?.last_name?.[0]}
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-800">{selected?.first_name} {selected?.last_name}</div>
          <div className="text-xs text-gray-500">{selected?.registration_number || 'Élève'}</div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[220px] overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 flex items-center gap-2">
            <Users size={12} /> Mes enfants ({children.length})
          </div>
          {children.map(c => (
            <button key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-all ${selected?.id === c.id ? 'bg-orange-50' : ''}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-800">{c.first_name} {c.last_name}</div>
                <div className="text-xs text-gray-400">{c.registration_number || '—'}</div>
              </div>
              {selected?.id === c.id && <span className="ml-auto text-orange-500 text-xs font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard ─── */
function ParentDashboard({ child, notifications, grades, attendance, homeworks }) {
  if (!child) return (
    <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
      <div className="text-5xl mb-3">👨‍👩‍👧</div>
      <div className="font-medium">Sélectionnez un enfant pour voir son tableau de bord</div>
    </div>
  );

  const childGrades = grades.filter(g => g.student_id === child.id);
  const childAttendance = attendance.filter(a => a.student_id === child.id);
  const childHomeworks = homeworks.filter(h => h.classroom_id === child.classroom_id);
  const childNotifs = notifications.filter(n => n.student_id === child.id);

  const present = childAttendance.filter(a => a.status === 'Present').length;
  const total = childAttendance.length;
  const rate = total ? Math.round(present / total * 100) : 0;
  const tGrades = childGrades.filter(g => g.trimester === 'T2');
  const avg = tGrades.length ? (tGrades.reduce((s, g) => s + g.score / g.max_score * 20, 0) / tGrades.length).toFixed(1) : '—';
  const todayHW = childHomeworks.filter(h => {
    const diff = Math.ceil((new Date(h.due_date) - new Date()) / 86400000);
    return diff >= 0 && diff <= 1;
  });
  const unread = childNotifs.filter(n => !n.read_at);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {child.first_name?.[0]}{child.last_name?.[0]}
          </div>
          <div>
            <div className="text-2xl font-bold">{child.first_name} {child.last_name}</div>
            <div className="text-white/80 text-sm">Matricule : {child.registration_number || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Moyenne T2', value: avg, emoji: '📝' },
            { label: 'Présences', value: `${rate}%`, emoji: '✅' },
            { label: 'Devoirs urgents', value: todayHW.length, emoji: '⏰' },
            { label: 'Non lues', value: unread.length, emoji: '🔔' },
          ].map((s, i) => (
            <div key={i} className="bg-white/20 rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{s.emoji}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {todayHW.length > 0 && (
          <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="font-bold text-amber-800 mb-2">⏰ Devoirs urgents</h3>
            <div className="space-y-2">
              {todayHW.map(hw => {
                const diff = Math.ceil((new Date(hw.due_date) - new Date()) / 86400000);
                return (
                  <div key={hw.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${diff === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {diff === 0 ? "Aujourd'hui !" : 'Demain'}
                    </span>
                    <span className="font-medium text-gray-800 text-sm">{hw.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">📝 Dernières notes</h3>
          <div className="space-y-2">
            {childGrades.length === 0 ? <p className="text-sm text-gray-400">Aucune note</p>
              : childGrades.slice(0, 4).map(g => {
                const pct = g.max_score ? g.score / g.max_score * 20 : 0;
                const color = pct >= 14 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600';
                return (
                  <div key={g.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-xs font-medium text-gray-700">{g.exam_type} · {g.trimester}</div>
                      <div className="text-xs text-gray-400">{g.date}</div>
                    </div>
                    <span className={`text-lg font-bold ${color}`}>{pct.toFixed(1)}<span className="text-xs text-gray-400">/20</span></span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">🔔 Notifications</h3>
          <div className="space-y-2">
            {childNotifs.length === 0 ? <p className="text-sm text-gray-400">Aucune notification</p>
              : childNotifs.slice(0, 4).map(n => (
                <div key={n.id} className={`p-3 rounded-xl ${!n.read_at ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">{n.type}</span>
                    {!n.read_at && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{n.message}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Notes ─── */
function ParentGrades({ child }) {
  const [grades, setGrades] = useState([]);
  const [trimester, setTrimester] = useState('T1');
  useEffect(() => {
    if (!child) return;
    Grade.filter({ student_id: child.id }).then(setGrades).catch(() => {});
  }, [child?.id]);

  if (!child) return <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Sélectionnez un enfant</div>;

  const filtered = grades.filter(g => g.trimester === trimester);
  const avg = filtered.length ? (filtered.reduce((s, g) => s + g.score / g.max_score * 20, 0) / filtered.length).toFixed(2) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Notes de {child.first_name}</h3>
          <div className="flex gap-2">
            {['T1','T2','T3'].map(t => (
              <button key={t} onClick={() => setTrimester(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${trimester === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {avg && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-gray-600 font-medium">Moyenne générale {trimester}</span>
            <span className={`text-2xl font-bold ${parseFloat(avg) >= 14 ? 'text-green-600' : parseFloat(avg) >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
              {avg} / 20
            </span>
          </div>
        )}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Aucune note pour {trimester}</div>
          ) : filtered.map(g => {
            const pct = g.max_score ? g.score / g.max_score * 20 : 0;
            return (
              <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-all">
                <div>
                  <div className="font-medium text-gray-800 text-sm">{g.exam_type}</div>
                  <div className="text-xs text-gray-400">{g.date} {g.comments && `· ${g.comments}`}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${pct >= 14 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                    {g.score} / {g.max_score}
                  </div>
                  <div className="text-xs text-gray-400">({pct.toFixed(1)}/20)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Devoirs ─── */
function ParentHomework({ child }) {
  const [homeworks, setHomeworks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('devoirs');

  useEffect(() => {
    if (!child) return;
    setLoading(true);
    Homework.filter({ classroom_id: child.classroom_id }).then(h => {
      setHomeworks(h.sort((a,b) => new Date(a.due_date) - new Date(b.due_date)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [child?.id]);

  if (!child) return <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Sélectionnez un enfant</div>;

  function daysDiff(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null; }

  async function markRead(hw) {
    try { await HomeworkRead.create({ homework_id:hw.id, student_id:child.id, parent_phone:child.parent_phone, reader_type:'parent', read_at:new Date().toISOString(), opened_at:new Date().toISOString() }); } catch {}
  }

  const devoirs = homeworks.filter(h => !h.is_course_module);
  const modules = homeworks.filter(h =>  h.is_course_module);
  const active  = devoirs.filter(h => { const d=daysDiff(h.due_date); return d===null||d>=0; });
  const passed  = devoirs.filter(h => { const d=daysDiff(h.due_date); return d!==null&&d<0; });

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {[['devoirs',`📋 Devoirs (${devoirs.length})`],['modules',`📚 Modules (${modules.length})`]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===v?'bg-white shadow-sm text-orange-700':'text-gray-500'}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total devoirs', val: devoirs.length, color: 'from-orange-500 to-amber-600' },
          { label: 'Pour demain', val: devoirs.filter(h => daysDiff(h.due_date) === 1).length, color: 'from-amber-500 to-yellow-500' },
          { label: "Aujourd'hui", val: devoirs.filter(h => daysDiff(h.due_date) === 0).length, color: 'from-red-500 to-rose-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
            <div className="text-2xl font-bold">{s.val}</div>
            <div className="text-white/80 text-sm">{s.label}</div>
          </div>
        ))}
      </div>
      {loading ? <div className="text-center text-gray-400 py-8">Chargement...</div> : (
        <div className="space-y-3">
          {active.map(hw => {
            const diff = daysDiff(hw.due_date);
            return (
              <div key={hw.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${diff === 0 ? 'border-red-200' : diff === 1 ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{hw.title}</h4>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${diff === 0 ? 'bg-red-100 text-red-700' : diff === 1 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {diff === 0 ? "Aujourd'hui !" : diff === 1 ? 'Demain' : `Dans ${diff}j`}
                  </span>
                </div>
                {hw.description && <p className="text-sm text-gray-600 mb-2">{hw.description}</p>}
                    {hw.reference_book && (
                      <div className="my-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                        📖 <strong>{hw.reference_book}</strong> · Page {hw.reference_page||'?'} · Ex. {hw.reference_exercise||'?'}
                      </div>
                    )}
                    {hw.attachment_type==='photo' && hw.attachment_url && (
                      <img src={hw.attachment_url} alt="devoir" className="my-2 max-h-28 rounded-xl object-contain border border-gray-200" />
                    )}
                    {hw.attachment_type==='file' && hw.attachment_url && (
                      <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer"
                        className="my-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-blue-100">
                        📁 Télécharger
                      </a>
                    )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>📅 {new Date(hw.due_date).toLocaleDateString('fr-FR')}</span>
                  <span>📋 {hw.type}</span>
                </div>
              </div>
            );
          })}
          {passed.length > 0 && (
            <details className="bg-gray-50 rounded-2xl overflow-hidden">
              <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer font-medium">
                Devoirs passés ({passed.length})
              </summary>
              <div className="p-4 space-y-2">
                {passed.map(hw => (
                  <div key={hw.id} className="bg-white rounded-xl p-3 border border-gray-100 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{hw.title}</span>
                      <span className="text-xs text-gray-400">{new Date(hw.due_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Frais ─── */
function ParentFees({ child }) {
  const [fees, setFees] = useState([]);
  useEffect(() => {
    if (!child) return;
    Fee.filter({ student_id: child.id }).then(setFees).catch(() => {});
  }, [child?.id]);

  if (!child) return <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Sélectionnez un enfant</div>;

  const totalDue = fees.reduce((s, f) => s + (f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
  const totalLeft = totalDue - totalPaid;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total dû', val: totalDue, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Payé', val: totalPaid, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Reste', val: totalLeft, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val.toLocaleString('fr-FR')} FCFA</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Type', 'Montant dû', 'Payé', 'Reste', 'Statut', 'Échéance'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {fees.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun frais enregistré</td></tr>
            ) : fees.map(f => {
              const left = (f.amount_due || 0) - (f.amount_paid || 0);
              const statusColor = { Paid: 'bg-green-100 text-green-700', Partial: 'bg-amber-100 text-amber-700', Unpaid: 'bg-red-100 text-red-700', Overdue: 'bg-red-200 text-red-800' };
              return (
                <tr key={f.id} className="hover:bg-orange-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{f.fee_type}</td>
                  <td className="px-4 py-3">{(f.amount_due || 0).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-green-600">{(f.amount_paid || 0).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{left.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusColor[f.status] || 'bg-gray-100 text-gray-600'}`}>{f.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{f.due_date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
                  {hw.course_level && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">{hw.course_level}</span>}
                  <div className="font-bold text-gray-800 mt-1">{hw.title}</div>
                  {hw.description && <div className="text-xs text-gray-500 mt-0.5">{hw.description}</div>}
                </div>
                {hw.attachment_url && (
                  <a href={hw.attachment_url} target="_blank" rel="noopener noreferrer" onClick={e=>{e.stopPropagation();markRead(hw);}}
                    className="flex-shrink-0 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-emerald-700">
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

/* ─── Notifications ─── */
function ParentNotifications({ child, notifications }) {
  const childNotifs = child ? notifications.filter(n => n.student_id === child.id) : notifications;
  const unreadCount = childNotifs.filter(n => !n.read_at).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{unreadCount} non lue(s)</span>
      </div>
      {childNotifs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Aucune notification</div>
      ) : childNotifs.map(n => (
        <div key={n.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${!n.read_at ? 'border-orange-200' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-semibold text-gray-800">{n.title}</span>
              {!n.read_at && <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block"></span>}
            </div>
            <span className="text-xs text-gray-400">{new Date(n.created_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <p className="text-sm text-gray-600">{n.message}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── App principale ─── */
export default function ParentApp({ onLogout, user }) {
  const [page, setPage] = useState('dashboard');
  const { school } = useSchool();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [homeworks, setHomeworks] = useState([]);

  useEffect(() => {
    // Charger tous les enfants (en prod : filtrer par parent_phone/email du user connecté)
    Student.list().then(all => {
      setChildren(all);
      if (all.length > 0) setSelectedChild(all[0]);
    }).catch(() => {});

    Promise.all([
      Notification.list(),
      Grade.list(),
      Attendance.list(),
      Homework.list(),
    ]).then(([n, g, a, h]) => {
      setNotifications(n.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setGrades(g.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setAttendance(a);
      setHomeworks(h);
    }).catch(() => {});
  }, []);

  const childNotifs = selectedChild ? notifications.filter(n => n.student_id === selectedChild.id) : [];
  const urgentHW = homeworks.filter(h => {
    if (!selectedChild || h.classroom_id !== selectedChild.classroom_id) return false;
    const diff = Math.ceil((new Date(h.due_date) - new Date()) / 86400000);
    return diff >= 0 && diff <= 1;
  }).length;
  const unreadCount = childNotifs.filter(n => !n.read_at).length;

  const menu = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '🏠' },
    { id: 'grades', label: 'Notes', icon: '📝' },
    { id: 'homework', label: 'Devoirs', icon: '📚', badge: urgentHW > 0 ? urgentHW : null },
    { id: 'fees', label: 'Frais scolaires', icon: '💳' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'messages', label: 'Messagerie', icon: '💬' },
    { id: 'services', label: 'Services', icon: '🛎️' },
  ];

  // Sélecteur enfant — widget compact placé dans chaque page
  const ChildBanner = () => selectedChild ? (
    <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-3 mb-4">
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {selectedChild.first_name?.[0]}{selectedChild.last_name?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-800 text-sm">{selectedChild.first_name} {selectedChild.last_name}</div>
        <div className="text-xs text-gray-500">Matricule : {selectedChild.registration_number || '—'}</div>
      </div>
      {children.length > 1 && (
        <select
          value={selectedChild.id}
          onChange={e => setSelectedChild(children.find(c => c.id === e.target.value))}
          className="text-xs border border-orange-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-orange-700 font-medium"
        >
          {children.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      )}
    </div>
  ) : null;

  const menuItems = [
    { id: 'dashboard',     label: 'Tableau de bord', icon: '🏠', component: <><ChildBanner /><ParentDashboard child={selectedChild} notifications={notifications} grades={grades} attendance={attendance} homeworks={homeworks} /></> },
    { id: 'grades',        label: 'Notes',           icon: '📝', component: <><ChildBanner /><ParentGrades child={selectedChild} /></> },
    { id: 'homework',      label: 'Devoirs',         icon: '📚', component: <><ChildBanner /><ParentHomework child={selectedChild} /></> },
    { id: 'fees',          label: 'Frais scolaires', icon: '💳', component: <><ChildBanner /><ParentFeesModule child={selectedChild} allChildren={children} /></> },
    { id: 'wallet',        label: 'Portefeuille',    icon: '💰', component: <WalletModule child={selectedChild} allChildren={children} /> },
    { id: 'notifications', label: 'Notifications',   icon: '🔔', component: <ParentNotificationsPage child={selectedChild} /> },
    { id: 'messages',      label: 'Messagerie',      icon: '💬', component: <Messagerie currentRole="parent" currentName="Parent" accentColor="from-orange-500 to-amber-600" /> },
    { id: 'services',      label: 'Services',        icon: '🛎️', component: <><ChildBanner /><ParentServices user={user} child={selectedChild} /></> },
  ];

  return <Layout role="parent" menuItems={menuItems} onLogout={onLogout} userName={user?.userName} schoolName="RENO" />;
}
