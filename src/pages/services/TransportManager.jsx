import React, { useState, useEffect } from 'react';
import { TransportRide, TransportBooking, Student } from '../../api/entities';
import { Plus, MapPin, Clock, Users, Phone, X, Car } from 'lucide-react';

const DRIVER_CONFIG = {
  Parent:   { icon: '👨‍👧', color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Parent conducteur', desc: 'Complément de revenu' },
  Privé:    { icon: '🚗', color: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Transporteur privé', desc: 'Professionnel agréé' },
  Coursier: { icon: '🛵', color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Coursier / Escort', desc: 'Sorties & déplacements' },
};

const RIDE_TYPE_COLOR = {
  'Quotidien': 'bg-green-100 text-green-700',
  'Sortie scolaire': 'bg-purple-100 text-purple-700',
  'Ponctuel': 'bg-amber-100 text-amber-700',
};

export default function TransportManager() {
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('rides'); // rides | bookings | trip
  const [showRideForm, setShowRideForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideForm, setRideForm] = useState({
    driver_type: 'Parent', driver_name: '', driver_phone: '', vehicle_type: 'Voiture',
    vehicle_capacity: 4, zone: '', route_description: '', departure_time: '07:00',
    return_time: '17:00', days: 'Lun-Ven', price_per_student: 5000,
    status: 'Disponible', ride_type: 'Quotidien', trip_date: '', destination: '', notes: '',
  });
  const [bookForm, setBookForm] = useState({ student_id: '', parent_name: '', parent_phone: '', pickup_address: '', trip_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [r, b, s] = await Promise.all([TransportRide.list(), TransportBooking.list(), Student.list()]);
      setRides(r); setBookings(b); setStudents(s);
    } catch (e) {}
    setLoading(false);
  }

  async function saveRide() {
    if (!rideForm.driver_name.trim()) { alert('Nom du conducteur requis'); return; }
    setSaving(true);
    try { await TransportRide.create(rideForm); setShowRideForm(false); load(); } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function saveBooking() {
    if (!selectedRide || !bookForm.student_id) { alert('Sélectionnez un élève'); return; }
    setSaving(true);
    try {
      await TransportBooking.create({ ...bookForm, ride_id: selectedRide.id, amount: selectedRide.price_per_student || 0, payment_status: 'Non payé', status: 'En attente' });
      // Mise à jour capacité
      const currentBookings = bookings.filter(b => b.ride_id === selectedRide.id && b.status !== 'Annulé').length + 1;
      if (currentBookings >= (selectedRide.vehicle_capacity || 4)) {
        await TransportRide.update(selectedRide.id, { status: 'Complet' });
      }
      setShowBookForm(false); load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function confirmBooking(id) {
    await TransportBooking.update(id, { status: 'Confirmé' });
    load();
  }

  const zones = [...new Set(rides.map(r => r.zone).filter(Boolean))];
  const filteredRides = rides.filter(r => !zoneFilter || r.zone === zoneFilter);
  const fmt = n => (n || 0).toLocaleString('fr-FR') + ' F';
  const getStudentName = id => { const s = students.find(s => s.id === id); return s ? `${s.first_name} ${s.last_name}` : '—'; };
  const getRideBookings = id => bookings.filter(b => b.ride_id === id && b.status !== 'Annulé').length;

  return (
    <div className="space-y-4">
      {/* Header tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ id: 'rides', label: '🚗 Trajets disponibles' }, { id: 'bookings', label: '📋 Réservations' }, { id: 'trip', label: '🚌 Sorties scolaires' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowRideForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Proposer un trajet
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Trajets actifs', value: rides.filter(r => r.status === 'Disponible').length, icon: '🚗', bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Conducteurs parents', value: rides.filter(r => r.driver_type === 'Parent').length, icon: '👨‍👧', bg: 'bg-indigo-50', text: 'text-indigo-700' },
          { label: 'Réservations actives', value: bookings.filter(b => b.status !== 'Annulé').length, icon: '📋', bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Sorties planifiées', value: rides.filter(r => r.ride_type === 'Sortie scolaire').length, icon: '🚌', bg: 'bg-purple-50', text: 'text-purple-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-500">{s.label}</span><span className="text-xl">{s.icon}</span></div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtre zone */}
      {zones.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Zone :</span>
          <button onClick={() => setZoneFilter('')} className={`px-3 py-1 rounded-lg text-xs font-medium ${!zoneFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Toutes</button>
          {zones.map(z => (
            <button key={z} onClick={() => setZoneFilter(z === zoneFilter ? '' : z)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${zoneFilter === z ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              📍 {z}
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div> : (
        view === 'rides' ? (
          /* ─── Trajets ─── */
          <div>
            {/* Explication covoiturage */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🤝</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">Covoiturage scolaire sécurisé</p>
                <p className="text-xs text-blue-700 mt-1">Les parents d'élèves peuvent proposer leurs trajets quotidiens (complément de revenu), ou des transporteurs privés agréés. Pour les sorties scolaires, un coursier/escort accompagne les élèves. Tous les conducteurs sont identifiés et validés par l'école.</p>
              </div>
            </div>

            {filteredRides.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-3">🚗</div>
                <p className="text-gray-500 font-medium">Aucun trajet disponible</p>
                <p className="text-xs text-gray-400 mt-1">Ajoutez des conducteurs parents ou des transporteurs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRides.map(r => {
                  const cfg = DRIVER_CONFIG[r.driver_type] || DRIVER_CONFIG.Privé;
                  const bookedCount = getRideBookings(r.id);
                  const capacity = r.vehicle_capacity || 4;
                  const pct = Math.min(100, bookedCount / capacity * 100);
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl ${cfg.color}`}>{cfg.icon}</div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{r.driver_name}</div>
                            <div className="text-xs text-gray-500">{cfg.label}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${RIDE_TYPE_COLOR[r.ride_type] || 'bg-gray-100'}`}>{r.ride_type}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${r.status === 'Disponible' ? 'bg-green-100 text-green-700' : r.status === 'Complet' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {r.zone && <div className="flex items-center gap-2 text-xs text-gray-600"><MapPin size={11} className="text-gray-400" /><strong>Zone :</strong> {r.zone}</div>}
                        {r.route_description && <div className="flex items-center gap-2 text-xs text-gray-500"><span>🛣️</span>{r.route_description}</div>}
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {r.departure_time && <span className="flex items-center gap-1"><Clock size={11} />🌅 {r.departure_time}</span>}
                          {r.return_time && <span>🌇 {r.return_time}</span>}
                        </div>
                        {r.vehicle_type && <div className="text-xs text-gray-500">🚙 {r.vehicle_type} · {capacity} places</div>}
                        {r.days && <div className="text-xs text-gray-500">📅 {r.days}</div>}
                        {r.trip_date && <div className="text-xs text-indigo-600 font-medium">📅 Départ : {r.trip_date}</div>}
                        {r.destination && <div className="text-xs text-purple-600">📍 Destination : {r.destination}</div>}
                        {r.driver_phone && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Phone size={11} />{r.driver_phone}</div>}
                      </div>

                      {/* Jauge capacité */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{bookedCount}/{capacity} places</span>
                          <span className={`font-medium ${pct >= 80 ? 'text-red-600' : pct >= 50 ? 'text-amber-600' : 'text-green-600'}`}>{Math.round(pct)}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981' }} />
                        </div>
                      </div>

                      {r.price_per_student > 0 && <div className="text-sm font-bold text-blue-600 mb-3">{fmt(r.price_per_student)}/élève</div>}

                      <div className="flex gap-2">
                        {r.status === 'Disponible' && (
                          <button onClick={() => { setSelectedRide(r); setShowBookForm(true); }}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700">
                            Réserver une place
                          </button>
                        )}
                        {r.driver_phone && (
                          <a href={`https://wa.me/${r.driver_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="py-2 px-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100">
                            💬
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : view === 'bookings' ? (
          /* ─── Réservations ─── */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">📋 Toutes les réservations</h3>
              <span className="text-xs text-gray-400">{bookings.length} réservation(s)</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Élève', 'Parent', 'Adresse prise en charge', 'Date', 'Montant', 'Statut', 'Paiement', 'Actions'].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.length === 0
                  ? <tr><td colSpan={8} className="p-8 text-center text-gray-400"><div className="text-4xl mb-2">📋</div>Aucune réservation</td></tr>
                  : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{getStudentName(b.student_id)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{b.parent_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{b.pickup_address || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{b.trip_date || '—'}</td>
                      <td className="px-4 py-3 text-xs font-medium">{fmt(b.amount)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${b.status === 'Confirmé' ? 'bg-green-100 text-green-700' : b.status === 'Annulé' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs ${b.payment_status === 'Payé' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.payment_status}</span></td>
                      <td className="px-4 py-3">
                        {b.status === 'En attente' && (
                          <button onClick={() => confirmBooking(b.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200">Confirmer</button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── Sorties scolaires ─── */
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">🚌</span>
              <div>
                <p className="text-sm font-semibold text-purple-800">Sorties & Déplacements sécurisés</p>
                <p className="text-xs text-purple-700 mt-1">Pour chaque sortie scolaire, faites appel à un coursier/escort depuis l'app. Le conducteur est identifié, le trajet est tracé, les parents sont notifiés du départ et du retour.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => { setRideForm({ ...rideForm, ride_type: 'Sortie scolaire', driver_type: 'Coursier' }); setShowRideForm(true); }}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700">
                <Plus size={16} /> Planifier une sortie
              </button>
            </div>
            {rides.filter(r => r.ride_type === 'Sortie scolaire').length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-3">🚌</div>
                <p className="text-gray-500 font-medium">Aucune sortie planifiée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rides.filter(r => r.ride_type === 'Sortie scolaire').map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🚌</div>
                      <div>
                        <div className="font-bold text-gray-800">{r.destination || 'Sortie scolaire'}</div>
                        <div className="text-xs text-purple-600 font-medium">📅 {r.trip_date || '—'}</div>
                      </div>
                      <span className={`ml-auto px-2 py-1 rounded-xl text-xs font-medium ${r.status === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>🧑 Conducteur : <strong>{r.driver_name}</strong> ({r.driver_type})</div>
                      <div>🚙 Véhicule : {r.vehicle_type} · {r.vehicle_capacity} places</div>
                      {r.route_description && <div>🛣️ {r.route_description}</div>}
                      <div>📍 Départ : {r.departure_time} · Retour : {r.return_time}</div>
                      <div className="font-medium text-purple-600">{getRideBookings(r.id)}/{r.vehicle_capacity} places réservées</div>
                    </div>
                    {r.driver_phone && (
                      <a href={`https://wa.me/${r.driver_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium">
                        💬 Contacter le conducteur
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Modal: Proposer un trajet */}
      {showRideForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">🚗 Nouveau trajet</h3>
              <button onClick={() => setShowRideForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Type conducteur */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Type de conducteur</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(DRIVER_CONFIG).map(([type, cfg]) => (
                    <button key={type} onClick={() => setRideForm({ ...rideForm, driver_type: type })}
                      className={`p-3 border rounded-xl text-center transition-all ${rideForm.driver_type === type ? `${cfg.color} border-2` : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="text-2xl mb-1">{cfg.icon}</div>
                      <div className="text-xs font-medium">{cfg.label}</div>
                      <div className="text-xs text-gray-400">{cfg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nom conducteur *</label>
                  <input value={rideForm.driver_name} onChange={e => setRideForm({ ...rideForm, driver_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Téléphone</label>
                  <input value={rideForm.driver_phone} onChange={e => setRideForm({ ...rideForm, driver_phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Type de trajet</label>
                  <select value={rideForm.ride_type} onChange={e => setRideForm({ ...rideForm, ride_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option>Quotidien</option><option>Sortie scolaire</option><option>Ponctuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Véhicule</label>
                  <select value={rideForm.vehicle_type} onChange={e => setRideForm({ ...rideForm, vehicle_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option>Voiture</option><option>Van</option><option>Bus</option><option>Moto</option><option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Capacité (places)</label>
                  <input type="number" min={1} max={60} value={rideForm.vehicle_capacity} onChange={e => setRideForm({ ...rideForm, vehicle_capacity: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Prix / élève (F)</label>
                  <input type="number" value={rideForm.price_per_student} onChange={e => setRideForm({ ...rideForm, price_per_student: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Zone couverte</label>
                  <input value={rideForm.zone} onChange={e => setRideForm({ ...rideForm, zone: e.target.value })} placeholder="Ex: Quartier Nord, Zone 3..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Jours</label>
                  <input value={rideForm.days} onChange={e => setRideForm({ ...rideForm, days: e.target.value })} placeholder="Lun-Ven, Tous les jours..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Heure départ</label>
                  <input type="time" value={rideForm.departure_time} onChange={e => setRideForm({ ...rideForm, departure_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Heure retour</label>
                  <input type="time" value={rideForm.return_time} onChange={e => setRideForm({ ...rideForm, return_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                {(rideForm.ride_type === 'Sortie scolaire' || rideForm.ride_type === 'Ponctuel') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date de la sortie</label>
                      <input type="date" value={rideForm.trip_date} onChange={e => setRideForm({ ...rideForm, trip_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Destination</label>
                      <input value={rideForm.destination} onChange={e => setRideForm({ ...rideForm, destination: e.target.value })} placeholder="Musée, stade, hôpital..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Itinéraire / Description</label>
                  <textarea value={rideForm.route_description} onChange={e => setRideForm({ ...rideForm, route_description: e.target.value })} rows={2} placeholder="Départ école → Marché central → Quartier Est..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none resize-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={saveRide} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Enregistrement...' : '✅ Créer le trajet'}
              </button>
              <button onClick={() => setShowRideForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Réservation */}
      {showBookForm && selectedRide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Réserver une place</h3>
                <p className="text-xs text-gray-400">{selectedRide.route_description || selectedRide.zone}</p>
              </div>
              <button onClick={() => setShowBookForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
                🚗 {selectedRide.driver_name} · {selectedRide.vehicle_type} · <strong>{(selectedRide.price_per_student || 0).toLocaleString('fr-FR')} F/élève</strong>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Élève *</label>
                <select value={bookForm.student_id} onChange={e => setBookForm({ ...bookForm, student_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              {[{ k: 'parent_name', l: 'Nom du parent' }, { k: 'parent_phone', l: 'Téléphone parent' }, { k: 'pickup_address', l: 'Adresse de prise en charge' }].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                  <input value={bookForm[f.k] || ''} onChange={e => setBookForm({ ...bookForm, [f.k]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date</label>
                <input type="date" value={bookForm.trip_date} onChange={e => setBookForm({ ...bookForm, trip_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={saveBooking} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? '...' : '✅ Confirmer la réservation'}
              </button>
              <button onClick={() => setShowBookForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
