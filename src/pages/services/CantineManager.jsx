import React, { useState, useEffect } from 'react';
import { MealOrder, Student, Classroom, Partner } from '../../api/entities';
import { Plus, Search, ShoppingCart, X, ChevronDown } from 'lucide-react';

const MENUS_TYPES = [
  { label: 'Menu Standard', price: 1500, items: 'Riz + Poulet + Salade + Eau' },
  { label: 'Menu Végétarien', price: 1200, items: 'Riz + Haricots + Légumes + Eau' },
  { label: 'Menu Enfant', price: 1000, items: 'Pâtes + Sauce tomate + Dessert + Jus' },
  { label: 'Menu Complet', price: 2000, items: 'Entrée + Plat + Dessert + Boisson' },
];

const STATUS_COLORS = {
  'En attente': 'bg-amber-100 text-amber-700',
  'Confirmé': 'bg-blue-100 text-blue-700',
  'Livré': 'bg-green-100 text-green-700',
  'Annulé': 'bg-red-100 text-red-700',
};

export default function CantineManager() {
  const [orders, setOrders] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today'); // today | history | group
  const [showForm, setShowForm] = useState(false);
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ student_id: '', partner_id: '', menu_items: MENUS_TYPES[0].items, meal_type: 'Déjeuner', date: new Date().toISOString().split('T')[0], amount: MENUS_TYPES[0].price, notes: '' });
  const [selectedMenuIdx, setSelectedMenuIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, s, c, p] = await Promise.all([MealOrder.list(), Student.list(), Classroom.list(), Partner.list()]);
      setOrders(o.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setStudents(s); setClassrooms(c);
      setPartners(p.filter(p => p.type === 'Restaurant' && p.status === 'Actif'));
    } catch (e) {}
    setLoading(false);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      if (isGroupOrder && selectedClass) {
        // Commande groupée pour toute la classe
        const classStudents = students.filter(s => s.classroom_id === selectedClass);
        const groupId = `group_${Date.now()}`;
        await Promise.all(classStudents.map(s =>
          MealOrder.create({ ...form, student_id: s.id, classroom_id: selectedClass, group_order_id: groupId, ordered_by: 'admin', payment_status: 'Non payé', status: 'En attente' })
        ));
      } else {
        const s = students.find(st => st.id === form.student_id);
        await MealOrder.create({ ...form, classroom_id: s?.classroom_id || '', ordered_by: 'admin', payment_status: 'Non payé', status: 'En attente' });
      }
      setShowForm(false); load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function updateStatus(id, status) {
    await MealOrder.update(id, { status });
    load();
  }

  const todayOrders = orders.filter(o => o.date === selectedDate);
  const totalToday = todayOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const paidToday = todayOrders.filter(o => o.payment_status === 'Payé').reduce((s, o) => s + (o.amount || 0), 0);

  const fmt = n => (n || 0).toLocaleString('fr-FR') + ' F';
  const getStudentName = id => { const s = students.find(s => s.id === id); return s ? `${s.first_name} ${s.last_name}` : '—'; };
  const getClassName = id => classrooms.find(c => c.id === id)?.name || '';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ id: 'today', label: "📅 Aujourd'hui" }, { id: 'history', label: '📋 Historique' }, { id: 'group', label: '👥 Commande groupée' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? 'bg-white shadow text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white" />
        <div className="flex-1" />
        <button onClick={() => { setShowForm(true); setIsGroupOrder(false); }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600">
          <Plus size={16} /> Commander
        </button>
        <button onClick={() => { setShowForm(true); setIsGroupOrder(true); }}
          className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-200">
          👥 Commande classe
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Commandes du jour', value: todayOrders.length, icon: '🍽️', bg: 'bg-orange-50', text: 'text-orange-700' },
          { label: 'Total du jour', value: fmt(totalToday), icon: '💰', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Payé', value: fmt(paidToday), icon: '✅', bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'En attente livraison', value: todayOrders.filter(o => o.status === 'Confirmé').length, icon: '🛵', bg: 'bg-blue-50', text: 'text-blue-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className={`text-xl font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      {loading ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div> : (
        view === 'group' ? (
          /* ─── Vue commande groupée ─── */
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">👥 Commande groupée par classe</h3>
              <p className="text-sm text-orange-700 mb-4">Passez une commande pour tous les élèves d'une classe en un clic. Idéal pour organiser les repas collectifs même sans cantine sur place.</p>
              <div className="grid grid-cols-3 gap-3">
                {classrooms.map(c => {
                  const count = students.filter(s => s.classroom_id === c.id).length;
                  const todayClass = todayOrders.filter(o => o.classroom_id === c.id);
                  return (
                    <div key={c.id} className="bg-white rounded-xl p-4 border border-orange-100 hover:border-orange-300 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-800">{c.name}</h4>
                        <span className="text-xs text-gray-400">{count} élèves</span>
                      </div>
                      {todayClass.length > 0 ? (
                        <div className="text-xs text-green-600 font-medium">✅ {todayClass.length} commande(s) ce jour</div>
                      ) : (
                        <div className="text-xs text-gray-400">Aucune commande aujourd'hui</div>
                      )}
                      <button onClick={() => { setSelectedClass(c.id); setIsGroupOrder(true); setShowForm(true); }}
                        className="mt-3 w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-medium hover:bg-orange-600">
                        Commander pour cette classe
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Résumé des commandes groupées du jour */}
            {todayOrders.filter(o => o.group_order_id).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-800">📦 Commandes groupées du {selectedDate}</h3>
                </div>
                <div className="p-4">
                  {[...new Set(todayOrders.filter(o => o.group_order_id).map(o => o.group_order_id))].map(gid => {
                    const group = todayOrders.filter(o => o.group_order_id === gid);
                    const cls = classrooms.find(c => c.id === group[0]?.classroom_id);
                    return (
                      <div key={gid} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl mb-2">
                        <div className="text-2xl">📦</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">Classe {cls?.name || '—'}</div>
                          <div className="text-xs text-gray-500">{group.length} élèves · {group[0]?.menu_items}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600">{fmt(group.reduce((s, o) => s + (o.amount || 0), 0))}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-lg ${STATUS_COLORS[group[0]?.status] || 'bg-gray-100 text-gray-600'}`}>{group[0]?.status}</span>
                        </div>
                        <div className="flex gap-2">
                          {group[0]?.status === 'En attente' && (
                            <button onClick={() => Promise.all(group.map(o => updateStatus(o.id, 'Confirmé'))).then(load)}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium">Confirmer</button>
                          )}
                          {group[0]?.status === 'Confirmé' && (
                            <button onClick={() => Promise.all(group.map(o => updateStatus(o.id, 'Livré'))).then(load)}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium">Livré ✓</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── Vue liste commandes ─── */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                {view === 'today' ? `🍽️ Commandes du ${selectedDate}` : '📋 Historique des commandes'}
              </h3>
              <span className="text-xs text-gray-400">{(view === 'today' ? todayOrders : orders).length} commande(s)</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Élève', 'Menu', 'Repas', 'Date', 'Montant', 'Statut', 'Paiement', 'Actions'].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(view === 'today' ? todayOrders : orders).length === 0
                  ? <tr><td colSpan={8} className="p-8 text-center text-gray-400"><div className="text-4xl mb-2">🍽️</div>Aucune commande</td></tr>
                  : (view === 'today' ? todayOrders : orders).map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{getStudentName(o.student_id)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-32 truncate">{o.menu_items}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{o.meal_type}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.date}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800">{fmt(o.amount)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>{o.status}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs ${o.payment_status === 'Payé' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{o.payment_status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {o.status === 'En attente' && <button onClick={() => updateStatus(o.id, 'Confirmé')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">Confirm.</button>}
                          {o.status === 'Confirmé' && <button onClick={() => updateStatus(o.id, 'Livré')} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200">Livré ✓</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal commande */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                🍽️ {isGroupOrder ? 'Commande groupée' : 'Nouvelle commande'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {isGroupOrder ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Classe</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option value="">— Choisir une classe —</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({students.filter(s => s.classroom_id === c.id).length} élèves)</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Élève</label>
                  <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option value="">— Choisir —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
              )}

              {partners.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Restaurant partenaire</label>
                  <select value={form.partner_id} onChange={e => setForm({ ...form, partner_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option value="">— Choisir —</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Menu</label>
                <div className="grid grid-cols-2 gap-2">
                  {MENUS_TYPES.map((m, i) => (
                    <button key={i} onClick={() => { setSelectedMenuIdx(i); setForm({ ...form, menu_items: m.items, amount: m.price }); }}
                      className={`p-3 border rounded-xl text-left transition-all ${selectedMenuIdx === i ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                      <div className="font-medium text-gray-800 text-xs">{m.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.items}</div>
                      <div className="text-orange-600 font-bold text-sm mt-1">{(m.price || 0).toLocaleString('fr-FR')} F</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Type de repas</label>
                  <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option>Déjeuner</option><option>Goûter</option><option>Petit-déjeuner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              </div>

              {isGroupOrder && selectedClass && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                  👥 Cette commande sera passée pour <strong>{students.filter(s => s.classroom_id === selectedClass).length} élève(s)</strong>.
                  Montant total : <strong>{((form.amount || 0) * students.filter(s => s.classroom_id === selectedClass).length).toLocaleString('fr-FR')} F</strong>
                </div>
              )}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={saveOrder} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60">
                <ShoppingCart size={16} /> {saving ? 'Envoi...' : 'Commander'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
