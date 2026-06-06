import React, { useState, useEffect } from 'react';
import { MealOrder, TransportRide, TransportBooking, MedicalRecord, MedicalVisit, Student, Partner, Classroom } from '../../api/entities';

const MENUS_TYPES = [
  { label: 'Menu Standard',    price: 1500, items: 'Riz + Poulet + Salade + Eau',           icon: '🍚' },
  { label: 'Menu Végétarien',  price: 1200, items: 'Riz + Haricots + Légumes + Eau',        icon: '🥗' },
  { label: 'Menu Enfant',      price: 1000, items: 'Pâtes + Sauce tomate + Dessert + Jus',  icon: '🍝' },
  { label: 'Menu Complet',     price: 2000, items: 'Entrée + Plat + Dessert + Boisson',     icon: '🍱' },
];

const STATUS_MEAL  = { 'En attente':'bg-amber-100 text-amber-700','Confirmé':'bg-blue-100 text-blue-700','Livré':'bg-green-100 text-green-700','Annulé':'bg-red-100 text-red-700' };
const STATUS_BOOK  = { 'En attente':'bg-amber-100 text-amber-700','Confirmé':'bg-green-100 text-green-700','Annulé':'bg-red-100 text-red-700' };
const BLOOD_COLORS = { 'A+':'bg-red-100 text-red-700','A-':'bg-red-200 text-red-800','B+':'bg-orange-100 text-orange-700','B-':'bg-orange-200 text-orange-800','AB+':'bg-purple-100 text-purple-700','AB-':'bg-purple-200 text-purple-800','O+':'bg-blue-100 text-blue-700','O-':'bg-blue-200 text-blue-800','Inconnu':'bg-gray-100 text-gray-500' };
const fmt = n => (n||0).toLocaleString('fr-FR') + ' F';

export default function ParentServices({ user }) {
  const [tab, setTab] = useState('repas');
  const [students, setStudents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [rides, setRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Commande repas
  const [showMealForm, setShowMealForm] = useState(false);
  const [menuIdx, setMenuIdx] = useState(0);
  const [mealForm, setMealForm] = useState({ student_id:'', partner_id:'', meal_type:'Déjeuner', date: new Date().toISOString().split('T')[0] });
  const [savingMeal, setSavingMeal] = useState(false);

  // Réservation transport
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookForm, setBookForm] = useState({ student_id:'', parent_name:'', parent_phone:'', pickup_address:'', trip_date: new Date().toISOString().split('T')[0] });
  const [savingBook, setSavingBook] = useState(false);

  // Filtre zone transport
  const [zoneFilter, setZoneFilter] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, p, o, r, b, rec, vis] = await Promise.all([
        Student.list(), Partner.list(), MealOrder.list(),
        TransportRide.list(), TransportBooking.list(),
        MedicalRecord.list(), MedicalVisit.list(),
      ]);
      setStudents(s);
      setPartners(p.filter(x => x.type === 'Restaurant' && x.status === 'Actif'));
      setMyOrders(o.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)));
      setRides(r.filter(x => x.status === 'Disponible'));
      setMyBookings(b.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)));
      setRecords(rec);
      setVisits(vis.sort((a,b) => new Date(b.date)-new Date(a.date)));
    } catch(e) {}
    setLoading(false);
  }

  async function commanderRepas() {
    if (!mealForm.student_id) { alert('Sélectionnez un élève'); return; }
    setSavingMeal(true);
    const menu = MENUS_TYPES[menuIdx];
    const s = students.find(x => x.id === mealForm.student_id);
    try {
      await MealOrder.create({ ...mealForm, classroom_id: s?.classroom_id||'', menu_items: menu.items, amount: menu.price, ordered_by: 'parent', payment_status:'Non payé', status:'En attente' });
      setShowMealForm(false); load();
    } catch(e) { alert(e.message); }
    setSavingMeal(false);
  }

  async function reserverTransport() {
    if (!bookForm.student_id || !selectedRide) { alert('Sélectionnez un élève'); return; }
    setSavingBook(true);
    try {
      await TransportBooking.create({ ...bookForm, ride_id: selectedRide.id, amount: selectedRide.price_per_student||0, payment_status:'Non payé', status:'En attente' });
      setShowBookForm(false); load();
    } catch(e) { alert(e.message); }
    setSavingBook(false);
  }

  const getStudentName = id => { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : '—'; };
  const getRecord = id => records.find(r => r.student_id === id);
  const getStudentVisits = id => visits.filter(v => v.student_id === id);
  const zones = [...new Set(rides.map(r => r.zone).filter(Boolean))];
  const filteredRides = rides.filter(r => !zoneFilter || r.zone === zoneFilter);
  const getRideBookings = id => myBookings.filter(b => b.ride_id === id && b.status !== 'Annulé').length;

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id:'repas',     label:'🍽️ Repas'      },
          { id:'transport', label:'🚗 Transport'   },
          { id:'medical',   label:'🏥 Médical'     },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id ? 'bg-white shadow text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* ══════════════ REPAS ══════════════ */}
          {tab === 'repas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Commandes de repas</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Commandez depuis un restaurant partenaire de l'école</p>
                </div>
                <button onClick={() => setShowMealForm(true)}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600">
                  + Commander un repas
                </button>
              </div>

              {/* Mes commandes */}
              {myOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="text-gray-500 font-medium">Aucune commande</p>
                  <p className="text-xs text-gray-400 mt-1">Commandez un repas pour votre enfant</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-700">Mes commandes</h4>
                    <span className="text-xs text-gray-400">{myOrders.length} commande(s)</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {myOrders.slice(0,10).map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{getStudentName(o.student_id)}</div>
                          <div className="text-xs text-gray-500">{o.menu_items}</div>
                          <div className="text-xs text-gray-400">{o.meal_type} · {o.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600 text-sm">{fmt(o.amount)}</div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_MEAL[o.status]||'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TRANSPORT ══════════════ */}
          {tab === 'transport' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-800">Transport & Covoiturage</h3>
                <p className="text-xs text-gray-400 mt-0.5">Trajets quotidiens et sorties scolaires proposés par des parents conducteurs ou transporteurs agréés</p>
              </div>

              {/* Filtre zone */}
              {zones.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">Zone :</span>
                  <button onClick={() => setZoneFilter('')} className={`px-3 py-1 rounded-lg text-xs font-medium ${!zoneFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Toutes</button>
                  {zones.map(z => (
                    <button key={z} onClick={() => setZoneFilter(z === zoneFilter ? '' : z)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${zoneFilter===z ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      📍 {z}
                    </button>
                  ))}
                </div>
              )}

              {/* Trajets disponibles */}
              {filteredRides.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">🚗</div>
                  <p className="text-gray-500 font-medium">Aucun trajet disponible</p>
                  <p className="text-xs text-gray-400 mt-1">L'école n'a pas encore de trajets enregistrés</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRides.map(r => {
                    const booked = getRideBookings(r.id);
                    const cap = r.vehicle_capacity || 4;
                    const pct = Math.min(100, booked/cap*100);
                    const driverIcon = r.driver_type==='Parent' ? '👨‍👧' : r.driver_type==='Coursier' ? '🛵' : '🚗';
                    return (
                      <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-xl">{driverIcon}</div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{r.driver_name}</div>
                              <div className="text-xs text-gray-400">{r.driver_type} · {r.vehicle_type}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {r.zone && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">📍 {r.zone}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${r.ride_type==='Sortie scolaire' ? 'bg-purple-100 text-purple-700' : r.ride_type==='Ponctuel' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{r.ride_type}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                          {r.route_description && <div>🛣️ {r.route_description}</div>}
                          <div className="flex gap-3">
                            {r.departure_time && <span>🌅 {r.departure_time}</span>}
                            {r.return_time    && <span>🌇 {r.return_time}</span>}
                            {r.days           && <span>📅 {r.days}</span>}
                          </div>
                          {r.destination  && <div className="text-purple-600 font-medium">📍 Destination : {r.destination}</div>}
                          {r.trip_date    && <div className="text-indigo-600 font-medium">📅 Date : {r.trip_date}</div>}
                        </div>

                        {/* Jauge */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{booked}/{cap} places</span>
                            <span className={`font-semibold ${pct>=80?'text-red-600':pct>=50?'text-amber-600':'text-green-600'}`}>{Math.round(pct)}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width:`${pct}%`, background: pct>=80?'#ef4444':pct>=50?'#f59e0b':'#10b981' }} />
                          </div>
                        </div>

                        {r.price_per_student > 0 && <div className="font-bold text-blue-600 text-sm mb-3">{fmt(r.price_per_student)} / élève</div>}

                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedRide(r); setShowBookForm(true); }}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700">
                            Réserver une place
                          </button>
                          {r.driver_phone && (
                            <a href={`https://wa.me/${r.driver_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
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

              {/* Mes réservations */}
              {myBookings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <h4 className="font-semibold text-gray-700">Mes réservations</h4>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {myBookings.slice(0,8).map(b => {
                      const ride = rides.find(r => r.id === b.ride_id) || {};
                      return (
                        <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg">🚗</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{getStudentName(b.student_id)}</div>
                            <div className="text-xs text-gray-400">{ride.driver_name || '—'} · {b.trip_date || '—'}</div>
                            {b.pickup_address && <div className="text-xs text-gray-500">📍 {b.pickup_address}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">{fmt(b.amount)}</div>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_BOOK[b.status]||'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ MÉDICAL ══════════════ */}
          {tab === 'medical' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-800">Suivi médical</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dossiers santé et visites à l'infirmerie de vos enfants</p>
              </div>
              {students.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Aucun élève trouvé</div>
              ) : (
                students.map(s => {
                  const rec = getRecord(s.id);
                  const sVisits = getStudentVisits(s.id);
                  return (
                    <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* En-tête élève */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center font-bold text-red-700">
                          {(s.first_name||'?')[0]}{(s.last_name||'?')[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{s.first_name} {s.last_name}</div>
                          <div className="text-xs text-gray-400">Né(e) le {s.date_of_birth||'—'}</div>
                        </div>
                        {rec && <span className={`px-2.5 py-1 rounded-xl text-sm font-bold ${BLOOD_COLORS[rec.blood_type]||'bg-gray-100'}`}>🩸 {rec.blood_type}</span>}
                      </div>

                      <div className="p-5">
                        {!rec ? (
                          <div className="text-center py-4 text-gray-400 text-sm">Dossier médical non encore créé par l'école</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              {rec.allergies && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                  <div className="text-xs font-bold text-red-700 mb-0.5">⚠️ Allergies</div>
                                  <div className="text-xs text-red-600">{rec.allergies}</div>
                                </div>
                              )}
                              {rec.chronic_conditions && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                  <div className="text-xs font-bold text-amber-700 mb-0.5">🩺 Conditions chroniques</div>
                                  <div className="text-xs text-amber-600">{rec.chronic_conditions}</div>
                                </div>
                              )}
                              {rec.medications && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                  <div className="text-xs font-bold text-blue-700 mb-0.5">💊 Médicaments</div>
                                  <div className="text-xs text-blue-600">{rec.medications}</div>
                                </div>
                              )}
                              {!rec.allergies && !rec.chronic_conditions && !rec.medications && (
                                <div className="text-xs text-gray-400 italic">Aucune condition particulière signalée</div>
                              )}
                            </div>
                            <div className="space-y-2 text-xs text-gray-600">
                              <div className="font-semibold text-gray-500 uppercase text-xs mb-1">Contacts urgence</div>
                              {rec.emergency_contact && <div>🆘 {rec.emergency_contact}</div>}
                              {rec.emergency_phone   && <div>📞 {rec.emergency_phone}</div>}
                              {rec.doctor_name       && <div>👨‍⚕️ Dr. {rec.doctor_name}</div>}
                              {rec.doctor_phone      && <div>📞 {rec.doctor_phone}</div>}
                              {rec.insurance         && <div>🏥 {rec.insurance}</div>}
                              {rec.last_checkup      && <div className="text-gray-400">Dernier bilan : {rec.last_checkup}</div>}
                            </div>
                          </div>
                        )}

                        {/* Visites récentes */}
                        {sVisits.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Dernières visites infirmerie</div>
                            <div className="space-y-2">
                              {sVisits.slice(0,3).map(v => (
                                <div key={v.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                                  <span className="text-lg flex-shrink-0">🏥</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-gray-800">{v.reason}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-lg ${
                                        v.action_taken==='Soins sur place'      ? 'bg-green-100 text-green-700' :
                                        v.action_taken==='Hospitalisé'          ? 'bg-red-100 text-red-700' :
                                        v.action_taken==='Renvoyé à domicile'   ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {v.action_taken}
                                      </span>
                                      {v.parent_notified && <span className="text-xs text-green-600">✓ Vous avez été notifié</span>}
                                    </div>
                                    {v.diagnosis && <div className="text-xs text-gray-500 mt-0.5">Diagnostic : {v.diagnosis}</div>}
                                    {v.treatment  && <div className="text-xs text-gray-500">Traitement : {v.treatment}</div>}
                                    <div className="text-xs text-gray-400 mt-0.5">{v.date}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL COMMANDE REPAS ═══ */}
      {showMealForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">🍽️ Commander un repas</h3>
              <button onClick={() => setShowMealForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Pour quel enfant ?</label>
                <select value={mealForm.student_id} onChange={e => setMealForm({...mealForm, student_id: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>

              {partners.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Restaurant partenaire</label>
                  <select value={mealForm.partner_id} onChange={e => setMealForm({...mealForm, partner_id: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option value="">— Choisir —</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Choisir le menu</label>
                <div className="grid grid-cols-2 gap-2">
                  {MENUS_TYPES.map((m, i) => (
                    <button key={i} onClick={() => setMenuIdx(i)}
                      className={`p-3 border rounded-xl text-left transition-all ${menuIdx===i ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                      <div className="text-lg mb-1">{m.icon}</div>
                      <div className="font-medium text-gray-800 text-xs">{m.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{m.items}</div>
                      <div className="text-orange-600 font-bold text-sm mt-1">{m.price.toLocaleString('fr-FR')} F</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Type de repas</label>
                  <select value={mealForm.meal_type} onChange={e => setMealForm({...mealForm, meal_type: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option>Déjeuner</option><option>Goûter</option><option>Petit-déjeuner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date</label>
                  <input type="date" value={mealForm.date} onChange={e => setMealForm({...mealForm, date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={commanderRepas} disabled={savingMeal}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60">
                {savingMeal ? 'Envoi...' : '🍽️ Commander'}
              </button>
              <button onClick={() => setShowMealForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL RÉSERVATION TRANSPORT ═══ */}
      {showBookForm && selectedRide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-gray-800">Réserver une place</h3>
                <p className="text-xs text-gray-400">{selectedRide.driver_name} · {selectedRide.zone || selectedRide.route_description}</p>
              </div>
              <button onClick={() => setShowBookForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
                🚗 {selectedRide.driver_name} · {selectedRide.vehicle_type} · <strong>{fmt(selectedRide.price_per_student)} / élève</strong>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Enfant *</label>
                <select value={bookForm.student_id} onChange={e => setBookForm({...bookForm, student_id: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              {[{k:'parent_name',l:'Votre nom'},{k:'parent_phone',l:'Votre téléphone'},{k:'pickup_address',l:'Adresse de prise en charge'}].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                  <input value={bookForm[f.k]||''} onChange={e => setBookForm({...bookForm, [f.k]: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date</label>
                <input type="date" value={bookForm.trip_date} onChange={e => setBookForm({...bookForm, trip_date: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={reserverTransport} disabled={savingBook}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
                {savingBook ? '...' : '✅ Confirmer la réservation'}
              </button>
              <button onClick={() => setShowBookForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
