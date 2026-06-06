import React, { useState, useEffect } from 'react';
import { MealOrder, TransportRide, TransportBooking, MedicalRecord, MedicalVisit, Student } from '../../api/entities';

const STATUS_MEAL = { 'En attente':'bg-amber-100 text-amber-700','Confirmé':'bg-blue-100 text-blue-700','Livré':'bg-green-100 text-green-700','Annulé':'bg-red-100 text-red-700' };
const BLOOD_COLORS = { 'A+':'bg-red-100 text-red-700','A-':'bg-red-200 text-red-800','B+':'bg-orange-100 text-orange-700','B-':'bg-orange-200 text-orange-800','AB+':'bg-purple-100 text-purple-700','AB-':'bg-purple-200 text-purple-800','O+':'bg-blue-100 text-blue-700','O-':'bg-blue-200 text-blue-800','Inconnu':'bg-gray-100 text-gray-500' };
const ACTION_COLORS = { 'Soins sur place':'bg-green-100 text-green-700','Renvoyé à domicile':'bg-amber-100 text-amber-700','Hospitalisé':'bg-red-100 text-red-700','Orienté médecin':'bg-blue-100 text-blue-700','Observation':'bg-violet-100 text-violet-700' };
const fmt = n => (n||0).toLocaleString('fr-FR') + ' F';

export default function StudentServices({ user }) {
  const [tab, setTab] = useState('repas');
  const [students, setStudents] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [rides, setRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [myVisits, setMyVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, o, r, b, rec, vis] = await Promise.all([
        Student.list(), MealOrder.list(), TransportRide.list(),
        TransportBooking.list(), MedicalRecord.list(), MedicalVisit.list(),
      ]);
      setStudents(s);
      // Pour la démo on prend le premier élève — en production on filtrerait par user
      const me = s[0];
      if (me) {
        setMyOrders(o.filter(x => x.student_id === me.id).sort((a,b) => new Date(b.created_date)-new Date(a.created_date)));
        setMyBookings(b.filter(x => x.student_id === me.id));
        setMyRecord(rec.find(x => x.student_id === me.id) || null);
        setMyVisits(vis.filter(x => x.student_id === me.id).sort((a,b) => new Date(b.date)-new Date(a.date)));
      }
      setRides(r.filter(x => x.status === 'Disponible'));
    } catch(e) {}
    setLoading(false);
  }

  const me = students[0];

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ id:'repas', label:'🍽️ Mes repas' }, { id:'transport', label:'🚗 Transport' }, { id:'medical', label:'🏥 Mon dossier médical' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* ══ REPAS ══ */}
          {tab === 'repas' && (
            <div className="space-y-4">
              {/* Stats du jour */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total commandes', value: myOrders.length,                               icon:'🍽️', bg:'bg-orange-50', text:'text-orange-700' },
                  { label: 'Livrés',           value: myOrders.filter(o=>o.status==='Livré').length, icon:'✅', bg:'bg-green-50',  text:'text-green-700'  },
                  { label: 'En attente',        value: myOrders.filter(o=>o.status==='En attente' || o.status==='Confirmé').length, icon:'⏳', bg:'bg-amber-50', text:'text-amber-700' },
                ].map((s,i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-4`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className="text-xl">{s.icon}</span>
                    </div>
                    <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {myOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="text-gray-500 font-medium">Aucun repas commandé</p>
                  <p className="text-xs text-gray-400 mt-1">Tes parents peuvent commander via leur espace</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b bg-gray-50">
                    <h4 className="font-semibold text-gray-700">Historique de mes repas</h4>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {myOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${o.status==='Livré' ? 'bg-green-50' : 'bg-orange-50'}`}>
                          {o.status==='Livré' ? '✅' : '🍽️'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{o.menu_items}</div>
                          <div className="text-xs text-gray-400">{o.meal_type} · {o.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-orange-600">{fmt(o.amount)}</div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_MEAL[o.status]||'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TRANSPORT ══ */}
          {tab === 'transport' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Trajets disponibles depuis l'école. Tes parents peuvent réserver une place depuis leur espace.</p>

              {/* Mes réservations */}
              {myBookings.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Mes réservations</h4>
                  <div className="space-y-2">
                    {myBookings.map(b => {
                      const ride = rides.find(r => r.id === b.ride_id);
                      return (
                        <div key={b.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                          <span className="text-xl">🚗</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{ride?.driver_name || '—'}</div>
                            <div className="text-xs text-gray-500">{b.pickup_address || '—'} · {b.trip_date || '—'}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${b.status==='Confirmé' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trajets disponibles */}
              {rides.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">🚗</div>
                  <p className="text-gray-500 font-medium">Aucun trajet disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rides.map(r => {
                    const driverIcon = r.driver_type==='Parent' ? '👨‍👧' : r.driver_type==='Coursier' ? '🛵' : '🚗';
                    return (
                      <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">{driverIcon}</div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{r.driver_name}</div>
                            <div className="text-xs text-gray-400">{r.driver_type} · {r.vehicle_type}</div>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-gray-500">
                          {r.zone              && <div>📍 Zone : <strong>{r.zone}</strong></div>}
                          {r.route_description && <div>🛣️ {r.route_description}</div>}
                          {r.departure_time    && <div>🕐 Départ {r.departure_time} · Retour {r.return_time}</div>}
                          {r.destination       && <div className="text-purple-600">🎯 {r.destination}</div>}
                          {r.trip_date         && <div className="text-indigo-600">📅 {r.trip_date}</div>}
                        </div>
                        {r.price_per_student > 0 && (
                          <div className="mt-2 font-bold text-blue-600 text-sm">{fmt(r.price_per_student)} / élève</div>
                        )}
                        {r.driver_phone && (
                          <a href={`https://wa.me/${r.driver_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium hover:bg-green-100">
                            💬 Contacter le conducteur
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ MÉDICAL ══ */}
          {tab === 'medical' && (
            <div className="space-y-4">
              {!me ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Profil introuvable</div>
              ) : !myRecord ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">💊</div>
                  <p className="text-gray-500 font-medium">Dossier médical non encore créé</p>
                  <p className="text-xs text-gray-400 mt-1">L'infirmier(e) ou l'administration peut le créer</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b bg-gradient-to-r from-red-50 to-rose-50">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center font-bold text-red-700 text-lg">
                      {(me.first_name||'?')[0]}{(me.last_name||'?')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{me.first_name} {me.last_name}</div>
                      <div className="text-xs text-gray-400">Né(e) le {me.date_of_birth||'—'} · {me.registration_number||''}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl font-bold text-sm ${BLOOD_COLORS[myRecord.blood_type]||'bg-gray-100'}`}>🩸 {myRecord.blood_type}</span>
                  </div>

                  <div className="p-5 space-y-3">
                    {myRecord.allergies && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="font-bold text-red-700 mb-1">⚠️ Allergies connues</div>
                        <div className="text-sm text-red-600">{myRecord.allergies}</div>
                      </div>
                    )}
                    {myRecord.chronic_conditions && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="font-bold text-amber-700 mb-1">🩺 Conditions chroniques</div>
                        <div className="text-sm text-amber-600">{myRecord.chronic_conditions}</div>
                      </div>
                    )}
                    {myRecord.medications && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="font-bold text-blue-700 mb-1">💊 Médicaments</div>
                        <div className="text-sm text-blue-600">{myRecord.medications}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {myRecord.emergency_contact && <div>🆘 Urgence : <strong>{myRecord.emergency_contact}</strong></div>}
                      {myRecord.emergency_phone   && <div>📞 {myRecord.emergency_phone}</div>}
                      {myRecord.doctor_name       && <div>👨‍⚕️ Dr. {myRecord.doctor_name}</div>}
                      {myRecord.doctor_phone      && <div>📞 {myRecord.doctor_phone}</div>}
                      {myRecord.insurance         && <div>🏥 {myRecord.insurance}</div>}
                      {myRecord.last_checkup      && <div className="text-gray-400 text-xs col-span-2">Dernier bilan : {myRecord.last_checkup}</div>}
                    </div>
                  </div>

                  {/* Historique visites */}
                  {myVisits.length > 0 && (
                    <div className="border-t border-gray-100">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h4 className="font-semibold text-gray-700">Mes visites à l'infirmerie ({myVisits.length})</h4>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {myVisits.map(v => (
                          <div key={v.id} className="flex items-start gap-3 px-5 py-4">
                            <span className="text-xl flex-shrink-0">🏥</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{v.reason}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${ACTION_COLORS[v.action_taken]||'bg-gray-100 text-gray-600'}`}>{v.action_taken}</span>
                              </div>
                              {v.diagnosis && <div className="text-xs text-gray-500 mt-0.5">Diagnostic : {v.diagnosis}</div>}
                              {v.treatment  && <div className="text-xs text-gray-500">Traitement : {v.treatment}</div>}
                              <div className="text-xs text-gray-400 mt-1">{v.date}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
