import React, { useState } from 'react';
import Layout from '../../components/Layout';
import AdminDashboard from './Dashboard';
import AdminStudents from './Students';
import AdminTeachers from './Teachers';
import AdminClassrooms from './Classrooms';
import StudentTransfer from './StudentTransfer';
import AdminNotifications from './Notifications';
import ReportCards from './ReportCards';
import SchoolSettings from './SchoolSettings';
import OfficialDocuments from './OfficialDocuments';
import ScheduleManager from './Schedule';
import ExamResults from './ExamResults';
import Messagerie from '../../components/Messagerie';
import PartnersManager from '../services/PartnersManager';
import FamilyDiscounts from '../accountant/FamilyDiscounts';
import CantineManager from '../services/CantineManager';
import TransportManager from '../services/TransportManager';
import MedicalManager from '../services/MedicalManager';
import { Event } from '../../api/entities';

/* ── Événements inline ── */
function AdminEvents() {
  const [events, setEvents] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '', description: '', event_type: 'Réunion',
    start_date: '', end_date: '', location: '', target_audience: 'All', notify_parents: false,
  });
  React.useEffect(() => { Event.list().then(e => setEvents(e.reverse())).catch(() => {}); }, []);

  async function save() {
    try {
      await Event.create(form);
      setShowForm(false);
      Event.list().then(e => setEvents(e.reverse()));
    } catch (e) { alert(e.message); }
  }

  const typeColor = {
    Exam: 'bg-red-100 text-red-700', Réunion: 'bg-blue-100 text-blue-700',
    Fête: 'bg-purple-100 text-purple-700', 'Sortie scolaire': 'bg-green-100 text-green-700',
    Sport: 'bg-orange-100 text-orange-700', Autre: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Nouvel événement
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0
          ? <div className="col-span-3 text-center text-gray-400 py-8 bg-white rounded-2xl shadow-sm border border-gray-100"><div className="text-4xl mb-2">📅</div>Aucun événement</div>
          : events.map(e => (
            <div key={e.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeColor[e.event_type] || 'bg-gray-100 text-gray-700'}`}>{e.event_type}</span>
                {e.notify_parents && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">📣 Parents</span>}
              </div>
              <h3 className="font-semibold text-gray-800 mt-2">{e.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{e.description}</p>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <div>📅 {e.start_date}{e.end_date && ` → ${e.end_date}`}</div>
                {e.location && <div>📍 {e.location}</div>}
              </div>
            </div>
          ))
        }
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">Nouvel événement</h3>
            <div className="space-y-3">
              {[{ key: 'title', label: 'Titre' }, { key: 'description', label: 'Description' }, { key: 'location', label: 'Lieu' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option>Exam</option><option>Réunion</option><option>Fête</option><option>Sortie scolaire</option><option>Sport</option><option>Autre</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Public</label>
                  <select value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option>All</option><option>Students</option><option>Teachers</option><option>Parents</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Date début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.notify_parents} onChange={e => setForm({ ...form, notify_parents: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Notifier les parents</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium">Créer</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Menu admin avec groupes ── */
const MENU = [
  { id: 'dashboard',     label: 'Tableau de bord',     icon: '📊', group: null },
  { id: 'students',      label: 'Élèves',               icon: '🎒', group: 'Établissement' },
  { id: 'teachers',      label: 'Enseignants',          icon: '👩‍🏫', group: 'Établissement' },
  { id: 'classrooms',    label: 'Classes',              icon: '🏛️', group: 'Établissement' },
  { id: 'transfers',     label: 'Transferts & Wallet',  icon: '🔄', group: 'Établissement' },
  { id: 'schedule',      label: 'Emploi du temps',      icon: '📅', group: 'Pédagogie' },
  { id: 'results',       label: 'Résultats',            icon: '🏆', group: 'Pédagogie' },
  { id: 'bulletins',     label: 'Bulletins',            icon: '📄', group: 'Pédagogie' },
  { id: 'documents',     label: 'Documents officiels',  icon: '📜', group: 'Pédagogie' },
  { id: 'events',        label: 'Événements',           icon: '🎉', group: 'Communication' },
  { id: 'notifications', label: 'Notifications',        icon: '🔔', group: 'Communication' },
  { id: 'messages',      label: 'Messagerie',           icon: '💬', group: 'Communication' },
  { id: 'discounts',     label: 'Remises',              icon: '🎟️', group: 'Finances' },
  { id: 'partners',      label: 'Partenaires',          icon: '🤝', group: 'Services' },
  { id: 'cantine',       label: 'Cantine & Repas',      icon: '🍽️', group: 'Services' },
  { id: 'transport',     label: 'Transport',            icon: '🚗', group: 'Services' },
  { id: 'medical',       label: 'Suivi médical',        icon: '🏥', group: 'Services' },
  { id: 'settings',      label: 'Paramètres',           icon: '⚙️', group: null },
];

export default function AdminApp({ onLogout, user }) {
  const menuItems = MENU.map(m => ({
    ...m,
    component: <PageContent id={m.id} user={user} onLogout={onLogout} />,
  }));

  return (
    <Layout
      role="admin"
      menuItems={menuItems}
      onLogout={onLogout}
      userName={user?.userName || 'Admin'}
      schoolName="RENO"
    />
  );
}

function PageContent({ id, user }) {
  switch (id) {
    case 'dashboard':     return <AdminDashboard />;
    case 'students':      return <AdminStudents />;
    case 'classrooms':    return <AdminClassrooms />;
    case 'transfers':     return <StudentTransfer />;
    case 'teachers':      return <AdminTeachers />;
    case 'schedule':      return <ScheduleManager />;
    case 'results':       return <ExamResults />;
    case 'bulletins':     return <ReportCards />;
    case 'documents':     return <OfficialDocuments />;
    case 'events':        return <AdminEvents />;
    case 'notifications': return <AdminNotifications />;
    case 'messages':      return <Messagerie currentRole="admin" currentName="Administration" accentColor="from-violet-600 to-purple-700" />;
    case 'discounts':     return <FamilyDiscounts userRole="admin" userName={user?.userName || 'Administrateur'} />;
    case 'partners':      return <PartnersManager />;
    case 'cantine':       return <CantineManager />;
    case 'transport':     return <TransportManager />;
    case 'medical':       return <MedicalManager />;
    case 'settings':      return <SchoolSettings />;
    default:              return null;
  }
}
