import React, { useState, useEffect } from 'react';
import { Partner } from '../../api/entities';
import { Plus, Search, Star, Phone, Mail, MapPin, X } from 'lucide-react';

const TYPE_CONFIG = {
  Restaurant:  { icon: '🍽️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  Transport:   { icon: '🚗', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  Médical:     { icon: '🏥', color: 'bg-red-100 text-red-700 border-red-200' },
  Librairie:   { icon: '📚', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  Sport:       { icon: '⚽', color: 'bg-green-100 text-green-700 border-green-200' },
  Autre:       { icon: '🤝', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function PartnersManager() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', type: 'Restaurant', contact_name: '', phone: '', email: '',
    address: '', description: '', zone: '', status: 'Actif',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setPartners(await Partner.list()); } catch (e) {}
    setLoading(false);
  }

  async function save() {
    if (!form.name.trim()) { alert('Nom requis'); return; }
    try { await Partner.create(form); setShowForm(false); setForm({ name: '', type: 'Restaurant', contact_name: '', phone: '', email: '', address: '', description: '', zone: '', status: 'Actif' }); load(); }
    catch (e) { alert(e.message); }
  }

  async function toggleStatus(p) {
    await Partner.update(p.id, { status: p.status === 'Actif' ? 'Inactif' : 'Actif' });
    load();
  }

  const types = ['Tous', ...Object.keys(TYPE_CONFIG)];
  const filtered = partners.filter(p =>
    (filterType === 'Tous' || p.type === filterType) &&
    (`${p.name} ${p.contact_name}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un partenaire..."
            className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none w-60" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t !== 'Tous' ? TYPE_CONFIG[t]?.icon + ' ' : ''}{t}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Ajouter un partenaire
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = partners.filter(p => p.type === type && p.status === 'Actif').length;
          return (
            <div key={type} className={`border rounded-2xl p-3 text-center cursor-pointer ${filterType === type ? cfg.color + ' border-2' : 'bg-white border-gray-100'}`}
              onClick={() => setFilterType(filterType === type ? 'Tous' : type)}>
              <div className="text-2xl mb-1">{cfg.icon}</div>
              <div className="text-lg font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-500">{type}</div>
            </div>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-gray-500 font-medium">Aucun partenaire</p>
          <p className="text-xs text-gray-400 mt-1">Ajoutez vos restaurants, transporteurs et prestataires médicaux</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.Autre;
            return (
              <div key={p.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${p.status === 'Inactif' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${cfg.color}`}>{cfg.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-800">{p.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${cfg.color}`}>{p.type}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleStatus(p)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium ${p.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </button>
                </div>
                {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                <div className="space-y-1.5">
                  {p.contact_name && <div className="flex items-center gap-2 text-xs text-gray-600"><span className="text-gray-400">👤</span>{p.contact_name}</div>}
                  {p.phone && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone size={11} className="text-gray-400" /><a href={`tel:${p.phone}`} className="hover:text-indigo-600">{p.phone}</a></div>}
                  {p.email && <div className="flex items-center gap-2 text-xs text-gray-600"><Mail size={11} className="text-gray-400" /><span className="truncate">{p.email}</span></div>}
                  {p.address && <div className="flex items-center gap-2 text-xs text-gray-600"><MapPin size={11} className="text-gray-400" /><span className="truncate">{p.address}</span></div>}
                  {p.zone && <div className="text-xs text-indigo-600 font-medium">📍 Zone : {p.zone}</div>}
                </div>
                {p.phone && (
                  <a href={`https://wa.me/${p.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100">
                    💬 WhatsApp
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">🤝 Nouveau partenaire</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nom *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Restaurant Le Bon Repas..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50">
                    {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Zone couverte</label>
                  <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Quartier, arrondissement..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50" />
                </div>
                {[{ k: 'contact_name', l: 'Responsable' }, { k: 'phone', l: 'Téléphone' }, { k: 'email', l: 'Email' }, { k: 'address', l: 'Adresse' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                    <input value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Description / Services offerts</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50 resize-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={save} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">✅ Ajouter le partenaire</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
