import React, { useState, useEffect } from 'react';
import { Send, Bell, Users, Mail } from 'lucide-react';
import { Notification, Student } from '../../api/entities';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', type: 'General', channel: 'Email', parent_name: '', parent_email: '', parent_phone: '' });

  useEffect(() => {
    async function load() {
      try {
        const [n, s] = await Promise.all([Notification.list(), Student.list()]);
        setNotifications(n.reverse()); setStudents(s);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  async function send() {
    try {
      await Notification.create({ ...form, status: 'Sent', sent_at: new Date().toISOString() });
      setShowForm(false);
      const n = await Notification.list();
      setNotifications(n.reverse());
    } catch (e) { alert(e.message); }
  }

  const typeColor = { Absence: 'bg-red-100 text-red-700', Note: 'bg-blue-100 text-blue-700', Paiement: 'bg-amber-100 text-amber-700', General: 'bg-gray-100 text-gray-700', Evénement: 'bg-purple-100 text-purple-700' };
  const channelIcon = { Email: '📧', SMS: '📱', WhatsApp: '💬', Push: '🔔' };
  const statusColor = { Sent: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', Failed: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm text-sm font-medium text-gray-700 flex items-center gap-2">
            <Bell size={16} className="text-indigo-500" /> {notifications.length} notifications
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Send size={16} /> Envoyer une notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Envoyées', count: notifications.filter(n => n.status === 'Sent').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'En attente', count: notifications.filter(n => n.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Échouées', count: notifications.filter(n => n.status === 'Failed').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div>
            : notifications.length === 0 ? <div className="p-8 text-center text-gray-400">Aucune notification</div>
            : notifications.slice(0,20).map(n => (
            <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50">
              <div className={`p-2 rounded-xl ${typeColor[n.type] || 'bg-gray-100'} flex-shrink-0`}>
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{n.title}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs ${typeColor[n.type] || 'bg-gray-100 text-gray-700'}`}>{n.type}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs ${statusColor[n.status] || 'bg-gray-100 text-gray-700'}`}>{n.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{n.message}</p>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <span>{channelIcon[n.channel]} {n.channel}</span>
                  <span>·</span>
                  <span>{n.parent_name || 'Destinataire'}</span>
                  <span>·</span>
                  <span>{n.sent_at ? new Date(n.sent_at).toLocaleString('fr-FR') : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">Nouvelle notification</h3>
            <div className="space-y-3">
              {[{ key: 'title', label: 'Titre' }, { key: 'parent_name', label: 'Nom du parent' }, { key: 'parent_email', label: 'Email', type: 'email' }, { key: 'parent_phone', label: 'Téléphone' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type||'text'} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option>General</option><option>Absence</option><option>Note</option><option>Paiement</option><option>Evénement</option><option>Comportement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
                  <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                    <option>Email</option><option>SMS</option><option>WhatsApp</option><option>Push</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={send} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"><Send size={16} /> Envoyer</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
