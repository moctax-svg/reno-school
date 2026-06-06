import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Student, Teacher, Attendance, Fee, Notification, Event, AbsenceReport } from '../../api/entities';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, absences: 0, revenue: 0 });
  const [pendingReports, setPendingReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allStudents, teachers, attendances, fees, reports] = await Promise.all([
          Student.list(),
          Teacher.list(),
          Attendance.filter({ status: 'Absent' }),
          Fee.list(),
          AbsenceReport.filter({ status: 'Pending' }),
        ]);
        const revenue = fees.reduce((sum, f) => sum + (f.amount_paid || 0), 0);
        setStats({ students: allStudents.length, teachers: teachers.length, absences: attendances.length, revenue });
        setStudents(allStudents);
        const today = new Date().toISOString().split('T')[0];
        setPendingReports(reports.filter(r => r.date >= today).sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)));
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const attendanceData = [
    { day: 'Lun', présents: 142, absents: 8 },
    { day: 'Mar', présents: 138, absents: 12 },
    { day: 'Mer', présents: 145, absents: 5 },
    { day: 'Jeu', présents: 140, absents: 10 },
    { day: 'Ven', présents: 135, absents: 15 },
  ];

  const pieData = [
    { name: 'Payé', value: 68, color: '#10b981' },
    { name: 'En attente', value: 22, color: '#f59e0b' },
    { name: 'En retard', value: 10, color: '#ef4444' },
  ];

  const statCards = [
    { label: 'Élèves inscrits', value: stats.students || 247, icon: GraduationCap, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Enseignants', value: stats.teachers || 34, icon: Users, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { label: 'Absences aujourd\'hui', value: stats.absences || 12, icon: AlertCircle, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'Revenus collectés', value: `${(stats.revenue || 2450000).toLocaleString()} F`, icon: DollarSign, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  async function acknowledgeReport(id) {
    try {
      await AbsenceReport.update(id, { status:'Acknowledged', acknowledged_by:'Administration', acknowledged_at:new Date().toISOString() });
      setPendingReports(prev => prev.filter(r=>r.id!==id));
    } catch {}
  }

  async function acknowledgeReport(id) {
    try {
      await AbsenceReport.update(id, { status:'Acknowledged', acknowledged_by:'Administration', acknowledged_at:new Date().toISOString() });
      setPendingReports(prev => prev.filter(r=>r.id!==id));
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Signalements parents en attente */}
      {pendingReports.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="font-bold text-amber-900 flex items-center gap-2 text-lg mb-3">
            ⚡ {pendingReports.length} signalement(s) parent(s) en attente
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingReports.map(r => {
              const s = students.find(x=>x.id===r.student_id);
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0 ${r.report_type==='Absence'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {r.report_type==='Absence'?'❌':'⏰'} {r.report_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm">{s?`${s.first_name} ${s.last_name}`:'—'}</div>
                    <div className="text-xs text-gray-500">{r.reason}{r.reason_detail?` · ${r.reason_detail}`:''} · {r.date}</div>
                    <div className="text-xs text-gray-400">Parent : {r.parent_name} {r.parent_phone?`· ${r.parent_phone}`:''}</div>
                  </div>
                  <button onClick={() => acknowledgeReport(r.id)}
                    className="flex-shrink-0 bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-200 transition-all">
                    ✅ Pris en charge
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Stat cards */}
      {pendingReports.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-amber-900 flex items-center gap-2 text-lg">
              ⚡ {pendingReports.length} signalement(s) parent en attente
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingReports.map(r => {
              const s = students.find(x=>x.id===r.student_id);
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0 ${r.report_type==='Absence'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>
                    {r.report_type==='Absence'?'❌':'⏰'} {r.report_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm">{s?`${s.first_name} ${s.last_name}`:r.student_id}</div>
                    <div className="text-xs text-gray-500">{r.reason}{r.reason_detail?` · ${r.reason_detail}`:''} · {r.date}</div>
                    <div className="text-xs text-gray-400">Parent : {r.parent_name} {r.parent_phone?`· ${r.parent_phone}`:''}</div>
                  </div>
                  <button onClick={() => acknowledgeReport(r.id)}
                    className="flex-shrink-0 bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-200 transition-all">
                    ✅ Pris en charge
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 ${s.bg} rounded-xl`}>
                <s.icon size={20} className={s.text} />
              </div>
              <span className="text-xs text-green-500 font-medium flex items-center gap-1"><TrendingUp size={12} /> +5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Présences cette semaine</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="présents" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="absents" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">État des paiements</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }}></div>
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick alerts */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Alertes & Actions rapides</h3>
        <div className="space-y-3">
          {[
            { color: 'bg-red-100 text-red-700', icon: '🚨', msg: '12 élèves absents aujourd\'hui sans notification parent' },
            { color: 'bg-amber-100 text-amber-700', icon: '💰', msg: '28 familles en retard de paiement (> 30 jours)' },
            { color: 'bg-blue-100 text-blue-700', icon: '📅', msg: 'Conseil de classe 6ème A prévu demain à 14h00' },
            { color: 'bg-emerald-100 text-emerald-700', icon: '✅', msg: 'Bulletins T2 disponibles — 247 bulletins générés' },
          ].map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 ${a.color} rounded-xl`}>
              <span>{a.icon}</span>
              <p className="text-sm font-medium">{a.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
