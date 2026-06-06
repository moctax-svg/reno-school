import Layout from '../../components/Layout';
import React, { useState, useEffect } from 'react';
import { Student, Attendance, Notification } from '../../api/entities';
import { Save } from 'lucide-react';
import NotificationSender from '../../components/NotificationSender';


function AttendancePage({ students, attendance, setAttendance, save, saved, today, statusConfig, presentCount, absentCount, lateCount }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: 'Présents', value: presentCount, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Absents',  value: absentCount,  color: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'Retards',  value: Object.values(attendance).filter(v => v === 'Late').length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border text-center ${s.color}`}>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={save} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${saved ? 'bg-green-100 text-green-700' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
          {saved ? '✅ Enregistré' : '💾 Enregistrer l\'appel'}
        </button>
      </div>
      <div className="space-y-2">
        {students.length === 0
          ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100"><div className="text-4xl mb-2">📋</div>Aucun élève</div>
          : students.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.first_name?.[0]}{s.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{s.last_name} {s.first_name}</div>
                <div className="text-xs text-gray-400">{s.registration_number || '—'}</div>
              </div>
              <div className="flex gap-2">
                {['Present','Late','Absent','Excused'].map(st => (
                  <button key={st} onClick={() => setAttendance(a => ({ ...a, [s.id]: st }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${attendance[s.id] === st
                      ? (st === 'Present' ? 'bg-green-500 text-white' : st === 'Absent' ? 'bg-red-500 text-white' : st === 'Late' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {st === 'Present' ? '✓ Présent' : st === 'Absent' ? '✗ Absent' : st === 'Late' ? '⏰ Retard' : '📄 Excuse'}
                  </button>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function AbsentsPage({ absents, setShowNotif, saved }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{absents.length} absent(s) enregistré(s)</div>
        {absents.length > 0 && (
          <button onClick={() => setShowNotif(true)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-700">
            💬 Notifier les parents ({absents.length})
          </button>
        )}
      </div>
      {absents.length === 0
        ? <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100"><div className="text-4xl mb-2">✅</div>{saved ? 'Aucun absent aujourd\'hui !' : 'Enregistrez l\'appel pour voir la liste des absents.'}</div>
        : absents.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">✗</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800">{s.last_name} {s.first_name}</div>
              <div className="text-xs text-gray-400">{s.parent_phone || 'Pas de contact parent'}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export default function SupervisorApp({ onLogout, user }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState('attendance');
  const [absents, setAbsents] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Student.list().then(list => {
      setStudents(list);
      const init = {};
      list.forEach(s => { init[s.id] = 'Present'; });
      setAttendance(init);
    }).catch(() => {});
  }, []);

  async function save() {
    try {
      const absentList = students.filter(s => attendance[s.id] !== 'Present');
      setAbsents(absentList);
      await Promise.all(students.map(s =>
        Attendance.create({ student_id: s.id, date: today, status: attendance[s.id] || 'Present', parent_notified: false })
      ));
      setSaved(true);
    } catch (e) { alert(e.message); }
  }

  const menu = [
    { id: 'attendance', label: 'Feuille d\'appel', icon: '📋' },
    { id: 'absents', label: 'Liste des absents', icon: '❌' },
  ];

  const statusConfig = {
    Present: 'bg-green-500 text-white',
    Absent: 'bg-red-500 text-white',
    Late: 'bg-amber-500 text-white',
    Excused: 'bg-blue-500 text-white',
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'Absent').length;
  const lateCount = Object.values(attendance).filter(v => v === 'Late').length;

  const menuItems = [
    { id: 'attendance', label: "Feuille d'appel",   icon: '📋', component: (
      <AttendancePage students={students} attendance={attendance} setAttendance={setAttendance} save={save} saved={saved} today={today} statusConfig={statusConfig} presentCount={presentCount} absentCount={absentCount} lateCount={lateCount} />
    )},
    { id: 'absents',    label: 'Liste des absents', icon: '❌', component: (
      <AbsentsPage absents={absents} setShowNotif={setShowNotif} saved={saved} />
    )},
  ];

  return (
    <>
      <Layout role="supervisor" menuItems={menuItems} onLogout={onLogout} userName={user?.userName} schoolName="RENO" />
      {showNotif && <NotificationSender students={absents} onClose={() => setShowNotif(false)} type="Absence" />}
    </>
  );
}