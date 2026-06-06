import React, { useState, useEffect } from 'react';
import { MedicalRecord, MedicalVisit, Student } from '../../api/entities';
import { Plus, Search, Heart, AlertTriangle, X, FileText } from 'lucide-react';

const ACTION_COLORS = {
  'Soins sur place': 'bg-green-100 text-green-700',
  'Renvoyé à domicile': 'bg-amber-100 text-amber-700',
  'Hospitalisé': 'bg-red-100 text-red-700',
  'Orienté médecin': 'bg-blue-100 text-blue-700',
  'Observation': 'bg-violet-100 text-violet-700',
};

const BLOOD_COLORS = {
  'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-200 text-red-800',
  'B+': 'bg-orange-100 text-orange-700', 'B-': 'bg-orange-200 text-orange-800',
  'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-200 text-purple-800',
  'O+': 'bg-blue-100 text-blue-700', 'O-': 'bg-blue-200 text-blue-800',
  'Inconnu': 'bg-gray-100 text-gray-500',
};

export default function MedicalManager() {
  const [records, setRecords] = useState([]);
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('records'); // records | visits | new-visit
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordForm, setRecordForm] = useState({
    student_id: '', blood_type: 'Inconnu', allergies: '', chronic_conditions: '',
    medications: '', emergency_contact: '', emergency_phone: '', doctor_name: '',
    doctor_phone: '', insurance: '', notes: '', last_checkup: '',
  });
  const [visitForm, setVisitForm] = useState({
    student_id: '', date: new Date().toISOString().split('T')[0], reason: '',
    diagnosis: '', treatment: '', nurse_name: '', action_taken: 'Soins sur place',
    parent_notified: false, notes: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [r, v, s] = await Promise.all([MedicalRecord.list(), MedicalVisit.list(), Student.list()]);
      setRecords(r); setVisits(v.sort((a, b) => new Date(b.date) - new Date(a.date))); setStudents(s);
    } catch (e) {}
    setLoading(false);
  }

  async function saveRecord() {
    if (!recordForm.student_id) { alert('Sélectionnez un élève'); return; }
    setSaving(true);
    try { await MedicalRecord.create(recordForm); setShowRecordForm(false); load(); } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function saveVisit() {
    if (!visitForm.student_id || !visitForm.reason) { alert('Élève et motif requis'); return; }
    setSaving(true);
    try { await MedicalVisit.create(visitForm); setShowVisitForm(false); load(); } catch (e) { alert(e.message); }
    setSaving(false);
  }

  const getStudentName = id => { const s = students.find(s => s.id === id); return s ? `${s.first_name} ${s.last_name}` : '—'; };
  const getRecord = id => records.find(r => r.student_id === id);

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const alertStudents = records.filter(r => r.allergies || r.chronic_conditions);
  const todayVisits = visits.filter(v => v.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ id: 'records', label: '📋 Dossiers médicaux' }, { id: 'visits', label: '🏥 Visites infirmerie' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.id ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {view === 'records'
          ? <button onClick={() => setShowRecordForm(true)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600"><Plus size={16} /> Nouveau dossier</button>
          : <button onClick={() => setShowVisitForm(true)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600"><Plus size={16} /> Enregistrer une visite</button>
        }
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Dossiers créés', value: records.length, icon: '📋', bg: 'bg-red-50', text: 'text-red-700' },
          { label: 'Visites aujourd\'hui', value: todayVisits.length, icon: '🏥', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Élèves avec allergies', value: records.filter(r => r.allergies).length, icon: '⚠️', bg: 'bg-orange-50', text: 'text-orange-700' },
          { label: 'Hospitalisations', value: visits.filter(v => v.action_taken === 'Hospitalisé').length, icon: '🚑', bg: 'bg-red-100', text: 'text-red-800' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-500">{s.label}</span><span className="text-xl">{s.icon}</span></div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alertes santé */}
      {alertStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Élèves avec conditions particulières</h3>
          <div className="flex flex-wrap gap-2">
            {alertStudents.map(r => (
              <div key={r.id} className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs">
                <div className="font-bold text-gray-800">{getStudentName(r.student_id)}</div>
                {r.allergies && <div className="text-red-600">⚠️ Allergie : {r.allergies}</div>}
                {r.chronic_conditions && <div className="text-amber-700">🩺 {r.chronic_conditions}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Chargement...</div> : (
        view === 'records' ? (
          /* ─── Dossiers médicaux ─── */
          <div className="flex gap-4">
            {/* Liste élèves */}
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none" />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {filteredStudents.map(s => {
                  const rec = getRecord(s.id);
                  return (
                    <button key={s.id} onClick={() => setSelectedStudent(s)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-all ${selectedStudent?.id === s.id ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${rec ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {(s.first_name || '?')[0]}{(s.last_name || '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{s.first_name} {s.last_name}</div>
                        {rec ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${BLOOD_COLORS[rec.blood_type] || 'bg-gray-100 text-gray-500'}`}>{rec.blood_type}</span>
                            {rec.allergies && <span className="text-xs text-red-500">⚠️</span>}
                          </div>
                        ) : <div className="text-xs text-gray-400">Pas de dossier</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Détail dossier */}
            <div className="flex-1">
              {!selectedStudent ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center">
                  <div className="text-5xl mb-3">💊</div>
                  <p className="text-gray-500 font-medium">Sélectionnez un élève</p>
                </div>
              ) : (() => {
                const rec = getRecord(selectedStudent.id);
                const studentVisits = visits.filter(v => v.student_id === selectedStudent.id);
                return (
                  <div className="space-y-4">
                    {/* En-tête */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl font-bold text-red-700">
                            {(selectedStudent.first_name || '?')[0]}{(selectedStudent.last_name || '?')[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                            <p className="text-xs text-gray-400">{selectedStudent.registration_number} · Né(e) le {selectedStudent.date_of_birth}</p>
                          </div>
                        </div>
                        {!rec && (
                          <button onClick={() => { setRecordForm({ ...recordForm, student_id: selectedStudent.id }); setShowRecordForm(true); }}
                            className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-600">
                            <Plus size={14} /> Créer le dossier
                          </button>
                        )}
                      </div>
                      {rec ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Informations médicales</div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-sm font-bold ${BLOOD_COLORS[rec.blood_type] || 'bg-gray-100'}`}>🩸 {rec.blood_type}</span></div>
                              {rec.allergies && <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs"><span className="font-bold text-red-700">⚠️ Allergies :</span> <span className="text-red-600">{rec.allergies}</span></div>}
                              {rec.chronic_conditions && <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs"><span className="font-bold text-amber-700">🩺 Conditions chroniques :</span> <span className="text-amber-600">{rec.chronic_conditions}</span></div>}
                              {rec.medications && <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-xs"><span className="font-bold text-blue-700">💊 Médicaments :</span> {rec.medications}</div>}
                              {rec.insurance && <div className="text-xs text-gray-600">🏥 Assurance : {rec.insurance}</div>}
                              {rec.last_checkup && <div className="text-xs text-gray-500">📅 Dernier bilan : {rec.last_checkup}</div>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Contacts d'urgence</div>
                            <div className="space-y-2 text-xs text-gray-700">
                              {rec.emergency_contact && <div>🆘 <strong>{rec.emergency_contact}</strong></div>}
                              {rec.emergency_phone && <div>📞 {rec.emergency_phone}</div>}
                              {rec.doctor_name && <div>👨‍⚕️ Dr. {rec.doctor_name}</div>}
                              {rec.doctor_phone && <div>📞 {rec.doctor_phone}</div>}
                              {rec.notes && <div className="italic text-gray-500">{rec.notes}</div>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm">Aucun dossier médical créé</div>
                      )}
                    </div>

                    {/* Historique visites */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 py-3 border-b flex items-center justify-between">
                        <h4 className="font-bold text-gray-800">🏥 Visites infirmerie ({studentVisits.length})</h4>
                        <button onClick={() => { setVisitForm({ ...visitForm, student_id: selectedStudent.id }); setShowVisitForm(true); }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium">+ Nouvelle visite</button>
                      </div>
                      {studentVisits.length === 0
                        ? <div className="p-6 text-center text-gray-400 text-sm">Aucune visite enregistrée</div>
                        : <div className="divide-y divide-gray-50">
                          {studentVisits.map(v => (
                            <div key={v.id} className="px-5 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800 text-sm">{v.reason}</span>
                                  {v.parent_notified && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Parents informés ✓</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${ACTION_COLORS[v.action_taken] || 'bg-gray-100 text-gray-600'}`}>{v.action_taken}</span>
                                  <span className="text-xs text-gray-400">{v.date}</span>
                                </div>
                              </div>
                              {v.diagnosis && <div className="text-xs text-gray-600">🔍 Diagnostic : {v.diagnosis}</div>}
                              {v.treatment && <div className="text-xs text-gray-600">💊 Traitement : {v.treatment}</div>}
                              {v.nurse_name && <div className="text-xs text-gray-400">Infirmier(e) : {v.nurse_name}</div>}
                            </div>
                          ))}
                        </div>
                      }
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ─── Visites infirmerie ─── */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-800">🏥 Journal des visites infirmerie</h3>
              <span className="text-xs text-gray-400">{visits.length} visite(s)</span>
            </div>
            {visits.length === 0
              ? <div className="p-8 text-center text-gray-400"><div className="text-4xl mb-2">🏥</div>Aucune visite enregistrée</div>
              : <div className="divide-y divide-gray-50">
                {visits.map(v => (
                  <div key={v.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏥</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{getStudentName(v.student_id)}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${ACTION_COLORS[v.action_taken] || 'bg-gray-100 text-gray-600'}`}>{v.action_taken}</span>
                        {v.parent_notified && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">✓ Parents informés</span>}
                        <span className="text-xs text-gray-400 ml-auto">{v.date}</span>
                      </div>
                      <div className="text-sm text-gray-700 font-medium">{v.reason}</div>
                      {v.diagnosis && <div className="text-xs text-gray-500 mt-0.5">Diagnostic : {v.diagnosis}</div>}
                      {v.treatment && <div className="text-xs text-gray-500">Traitement : {v.treatment}</div>}
                      {v.nurse_name && <div className="text-xs text-gray-400 mt-1">Infirmier(e) : {v.nurse_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )
      )}

      {/* Modal: Dossier médical */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">💊 Dossier médical</h3>
              <button onClick={() => setShowRecordForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Élève *</label>
                <select value={recordForm.student_id} onChange={e => setRecordForm({ ...recordForm, student_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Groupe sanguin</label>
                  <select value={recordForm.blood_type} onChange={e => setRecordForm({ ...recordForm, blood_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Dernier bilan</label>
                  <input type="date" value={recordForm.last_checkup} onChange={e => setRecordForm({ ...recordForm, last_checkup: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              </div>
              {[{ k: 'allergies', l: 'Allergies connues', ph: 'Pénicilline, arachides...' }, { k: 'chronic_conditions', l: 'Maladies chroniques', ph: 'Asthme, diabète...' }, { k: 'medications', l: 'Médicaments en cours', ph: 'Ventoline, insuline...' }, { k: 'insurance', l: 'Assurance maladie', ph: '' }].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                  <input value={recordForm[f.k]} onChange={e => setRecordForm({ ...recordForm, [f.k]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[{ k: 'emergency_contact', l: 'Contact urgence' }, { k: 'emergency_phone', l: 'Tél. urgence' }, { k: 'doctor_name', l: 'Médecin traitant' }, { k: 'doctor_phone', l: 'Tél. médecin' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                    <input value={recordForm[f.k]} onChange={e => setRecordForm({ ...recordForm, [f.k]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={saveRecord} disabled={saving} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 disabled:opacity-60">
                {saving ? '...' : '✅ Créer le dossier'}
              </button>
              <button onClick={() => setShowRecordForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Visite infirmerie */}
      {showVisitForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">🏥 Enregistrer une visite</h3>
              <button onClick={() => setShowVisitForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Élève *</label>
                <select value={visitForm.student_id} onChange={e => setVisitForm({ ...visitForm, student_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Date</label>
                  <input type="date" value={visitForm.date} onChange={e => setVisitForm({ ...visitForm, date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Action prise</label>
                  <select value={visitForm.action_taken} onChange={e => setVisitForm({ ...visitForm, action_taken: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    {Object.keys(ACTION_COLORS).map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              {[{ k: 'reason', l: 'Motif de visite *', ph: 'Douleur abdominale, fièvre...' }, { k: 'diagnosis', l: 'Diagnostic', ph: '' }, { k: 'treatment', l: 'Traitement administré', ph: '' }, { k: 'nurse_name', l: "Infirmier(e)", ph: '' }].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{f.l}</label>
                  <input value={visitForm[f.k]} onChange={e => setVisitForm({ ...visitForm, [f.k]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={visitForm.parent_notified} onChange={e => setVisitForm({ ...visitForm, parent_notified: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Parents notifiés ✓</span>
              </label>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={saveVisit} disabled={saving} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 disabled:opacity-60">
                {saving ? '...' : '✅ Enregistrer'}
              </button>
              <button onClick={() => setShowVisitForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
