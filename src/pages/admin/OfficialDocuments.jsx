import React, { useState, useEffect, useRef } from 'react';
import { Student, School, SecurityLog } from '../../api/entities';
import DocumentHeader, { DocumentFooter as DocFooter } from '../../components/DocumentHeader';
import { useSchool } from '../../hooks/useSchool';
import { Search, Printer, FileText, Shield, Heart } from 'lucide-react';

/* ─── Shared header renderer — uses centralized DocumentHeader ─── */
function DocHeader({ school, title, subtitle }) {
  return <DocumentHeader school={school} documentTitle={title} documentSubtitle={subtitle} />;
}

/* ─── CERTIFICAT DE SCOLARITÉ ─── */
function CertificatScolarite({ student, school }) {
  const color = school?.header_color || '#1e3a5f';
  const s = { fontFamily: 'Arial, sans-serif' };
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="doc-certificat" style={{ ...s, maxWidth: 794, margin: '0 auto', background: 'white', padding: 40 }}>
      <DocHeader school={school} title="CERTIFICAT DE SCOLARITÉ" subtitle={`Année ${school?.academic_year_label || new Date().getFullYear()}`} />

      <div style={{ textAlign: 'center', margin: '28px 0' }}>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Le Directeur de</div>
        <div style={{ fontSize: 17, fontWeight: 'bold', color, marginBottom: 4 }}>{school?.name || 'École RENO'}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>certifie que :</div>
      </div>

      {/* Encadré élève */}
      <div style={{ border: `2px solid ${color}`, borderRadius: 12, padding: '20px 28px', margin: '20px 0', background: color + '08' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Nom & Prénom(s)', value: `${student.last_name?.toUpperCase() || ''} ${student.first_name || ''}` },
            { label: 'Date de naissance', value: student.date_of_birth || '—' },
            { label: 'Genre', value: student.gender === 'Male' ? 'Masculin' : 'Féminin' },
            { label: 'N° Matricule', value: student.registration_number || '—' },
            { label: 'Date d\'inscription', value: student.enrollment_date || '—' },
            { label: 'Statut', value: student.status === 'Active' ? 'Élève régulier(e)' : student.status },
          ].map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid ' + color + '33', paddingBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: i === 0 ? 'bold' : '600', color: '#0f172a' }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#334155', lineHeight: 2, marginTop: 24, textAlign: 'justify' }}>
        est régulièrement inscrit(e) dans notre établissement pour l'<strong>année scolaire {school?.academic_year_label || new Date().getFullYear()}</strong>.
        Ce certificat est délivré à l'intéressé(e) pour servir et valoir ce que de droit.
      </div>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Fait à {school?.city || '___________'},</div>
          <div style={{ fontSize: 11, color: '#334155', fontWeight: 'bold' }}>le {today}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Signature du Directeur</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width: 60, height: 60, objectFit: 'contain', opacity: 0.7, margin: '0 auto' }} />}
          <div style={{ marginTop: 30, borderTop: '1px solid #cbd5e1', paddingTop: 4, fontSize: 10, color: '#94a3b8' }}>{school?.director_name || 'Signature & Cachet'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Signature du Parent</div>
          <div style={{ marginTop: 50, borderTop: '1px solid #cbd5e1', paddingTop: 4, fontSize: 10, color: '#94a3b8' }}>Signature</div>
        </div>
      </div>
      <DocFooter school={school} />
    </div>
  );
}

/* ─── BON DE SORTIE (Éducative / Infirmerie) ─── */
function BonSortie({ student, school, type = 'educative' }) {
  const color = type === 'infirmerie' ? '#dc2626' : (school?.header_color || '#1e3a5f');
  const title = type === 'infirmerie' ? 'BON DE SORTIE — INFIRMERIE' : 'BON DE SORTIE ÉDUCATIVE';
  const icon = type === 'infirmerie' ? '🏥' : '🎓';
  const now = new Date();
  const today = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const [motif, setMotif] = useState(type === 'infirmerie' ? '' : '');
  const [destination, setDestination] = useState('');
  const [accompagnateur, setAccompagnateur] = useState('');
  const [heureDepart, setHeureDepart] = useState(time);
  const [heureRetour, setHeureRetour] = useState('');
  const [observations, setObservations] = useState('');

  const s = { fontFamily: 'Arial, sans-serif' };

  return (
    <div style={{ ...s }}>
      {/* Formulaire de saisie (écran) */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-4 space-y-3 print:hidden">
        <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">{icon} Remplir le bon avant impression</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{type === 'infirmerie' ? 'Motif médical' : 'Motif de la sortie'}</label>
            <input value={motif} onChange={e => setMotif(e.target.value)} placeholder={type === 'infirmerie' ? 'Douleur abdominale, fièvre...' : 'Visite musée, compétition sportive...'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': color }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{type === 'infirmerie' ? 'Orientation (structure médicale)' : 'Destination'}</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder={type === 'infirmerie' ? 'Hôpital X, Clinique Y...' : 'Musée National, Stade...'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Accompagnateur(s)</label>
            <input value={accompagnateur} onChange={e => setAccompagnateur(e.target.value)} placeholder="Nom du professeur / responsable" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Heure de départ</label>
            <input type="time" value={heureDepart} onChange={e => setHeureDepart(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Heure de retour prévue</label>
            <input type="time" value={heureRetour} onChange={e => setHeureRetour(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{type === 'infirmerie' ? 'Observations médicales' : 'Observations'}</label>
            <input value={observations} onChange={e => setObservations(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Document imprimable */}
      <div id={`doc-bon-${type}`} style={{ maxWidth: 794, margin: '0 auto', background: 'white', padding: 40 }}>
        <DocHeader school={{ ...school, header_color: color }} title={title} subtitle={today} />

        {/* Bandeau élève */}
        <div style={{ background: color + '12', border: `1.5px solid ${color}`, borderRadius: 10, padding: '14px 20px', display: 'flex', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Élève concerné(e)</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a' }}>{student.last_name?.toUpperCase()} {student.first_name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Matricule : {student.registration_number || '—'} · Né(e) le : {student.date_of_birth || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Parent / Tuteur</div>
            <div style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>{student.parent_name || '—'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{student.parent_phone || '—'}</div>
          </div>
        </div>

        {/* Corps du bon */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
          <tbody>
            {[
              { label: type === 'infirmerie' ? 'Motif médical' : 'Motif de la sortie', value: motif || '___________________________' },
              { label: type === 'infirmerie' ? 'Orientation médicale' : 'Destination', value: destination || '___________________________' },
              { label: 'Accompagnateur(s)', value: accompagnateur || '___________________________' },
              { label: 'Date', value: today },
              { label: 'Heure de départ', value: heureDepart || '________' },
              { label: 'Heure de retour prévue', value: heureRetour || '________' },
              { label: 'Observations', value: observations || '___________________________' },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 12px', fontWeight: 'bold', color: '#475569', width: '35%', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>{row.label}</td>
                <td style={{ padding: '9px 12px', color: '#0f172a', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 30 }}>
          {['Signature du Directeur', type === 'infirmerie' ? 'Signature de l\'Infirmier(e)' : 'Visa du Professeur', 'Signature du Parent / Élève'].map((label, i) => (
            <div key={i} style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 8px' }}>
              {i === 0 && school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width: 50, height: 50, objectFit: 'contain', opacity: 0.6, margin: '0 auto 8px' }} />}
              <div style={{ height: i === 0 && school?.stamp_url ? 0 : 40 }}></div>
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {type === 'infirmerie' && (
          <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', fontSize: 10, color: '#991b1b' }}>
            ⚕️ <strong>Note :</strong> Ce bon doit être conservé par l'infirmerie et une copie remise aux parents. En cas d'urgence, contacter le {school?.phone || '—'}.
          </div>
        )}

        <DocFooter school={{ ...school, header_color: color }} />
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function OfficialDocuments() {
  const { school } = useSchool();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [docType, setDocType] = useState('certificat');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Student.list().then(list => { setStudents(list); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function printDoc(id, studentName, docTitle) {
    const content = document.getElementById(id);
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>${docTitle} — ${studentName}</title><style>@media print { body { margin: 0; } } @page { size: A4; margin: 10mm; }</style></head><body>${content.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  const docTypes = [
    { id: 'certificat', label: 'Certificat de scolarité', icon: '📜', color: 'bg-blue-600' },
    { id: 'bon_educative', label: 'Bon de sortie éducative', icon: '🎓', color: 'bg-emerald-600' },
    { id: 'bon_infirmerie', label: 'Bon de sortie infirmerie', icon: '🏥', color: 'bg-red-600' },
  ];

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.registration_number || '').includes(search)
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar: student list */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Doc type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Type de document</p>
          <div className="space-y-2">
            {docTypes.map(d => (
              <button key={d.id} onClick={() => setDocType(d.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-medium ${docType === d.id ? `${d.color} text-white shadow-md` : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                <span className="text-base">{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none" />
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {loading ? <div className="p-6 text-center text-gray-400 text-sm">Chargement...</div>
              : filtered.length === 0 ? <div className="p-6 text-center text-gray-400 text-sm">Aucun élève</div>
              : filtered.map(s => (
                <button key={s.id} onClick={() => setSelectedStudent(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${selectedStudent?.id === s.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {(s.first_name || '?')[0]}{(s.last_name || '?')[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-400">{s.registration_number || '—'}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Main: document preview */}
      <div className="flex-1 min-w-0">

        {!selectedStudent ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">{docTypes.find(d => d.id === docType)?.icon}</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">{docTypes.find(d => d.id === docType)?.label}</h3>
            <p className="text-gray-400 text-sm">Sélectionnez un élève dans la liste pour générer le document</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {(selectedStudent.first_name || '?')[0]}{(selectedStudent.last_name || '?')[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                  <div className="text-xs text-gray-400">{docTypes.find(d => d.id === docType)?.label}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const id = docType === 'certificat' ? 'doc-certificat' : docType === 'bon_educative' ? 'doc-bon-educative' : 'doc-bon-infirmerie';
                  printDoc(id, `${selectedStudent.first_name} ${selectedStudent.last_name}`, docTypes.find(d => d.id === docType)?.label);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                <Printer size={16} /> Imprimer / PDF
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto p-2">
              {docType === 'certificat' && <CertificatScolarite student={selectedStudent} school={school} />}
              {docType === 'bon_educative' && <BonSortie student={selectedStudent} school={school} type="educative" />}
              {docType === 'bon_infirmerie' && <BonSortie student={selectedStudent} school={school} type="infirmerie" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
