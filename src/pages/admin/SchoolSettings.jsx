import React, { useState, useEffect } from 'react';
import { School } from '../../api/entities';
import { Save, Upload, Eye, Palette } from 'lucide-react';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';

/* Configuration par type d'établissement */
const SCHOOL_TYPE_CONFIG = {
  'Crèche': {
    emoji: '🍼',
    description: 'Enfants de 0 à 3 ans',
    grading_system: 'Aucune note',
    period_type: 'Trimestre',
    has_homework: false,
    has_schedule: false,
    has_canteen: true,
    has_transport: true,
    levels: ['Poupons (0-1 an)', 'Bébés (1-2 ans)', 'Grands (2-3 ans)'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: ['Éveil sensoriel', 'Motricité', 'Repas', 'Sieste'],
    color: '#f97316',
    note: 'Pas de notes ni devoirs. Suivi journalier des repas, siestes et activités d\'éveil.'
  },
  'Maternelle': {
    emoji: '🌸',
    description: 'Petite, Moyenne et Grande Section',
    grading_system: 'Acquis/En cours/Non acquis',
    period_type: 'Trimestre',
    has_homework: false,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
    levels: ['Petite Section (PS)', 'Moyenne Section (MS)', 'Grande Section (GS)'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: ['Lecture', 'Écriture', 'Calcul', 'Éveil artistique', 'EPS'],
    color: '#ec4899',
    note: 'Évaluation par niveaux : Acquis / En cours d\'acquisition / Non acquis. Pas de devoirs à la maison.'
  },
  'Primaire': {
    emoji: '📚',
    description: 'CP, CE1, CE2, CM1, CM2',
    grading_system: 'Note sur 10',
    period_type: 'Trimestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
    levels: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: ['Français', 'Mathématiques', 'Sciences', 'Histoire-Géo', 'EPS', 'Dessin'],
    color: '#10b981',
    note: 'Notes sur 10. Un enseignant principal par classe. Bulletins trimestriels.'
  },
  'Collège': {
    emoji: '🏫',
    description: '6ème, 5ème, 4ème, 3ème',
    grading_system: 'Note sur 20',
    period_type: 'Trimestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
    levels: ['6ème', '5ème', '4ème', '3ème'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: ['Français', 'Maths', 'Physique-Chimie', 'SVT', 'Histoire-Géo', 'Anglais', 'EPS'],
    color: '#4338ca',
    note: 'Notes sur 20 avec coefficients. Plusieurs enseignants par classe. Emploi du temps complet.'
  },
  'Lycée': {
    emoji: '🎓',
    description: '2nde, 1ère, Terminale',
    grading_system: 'Note sur 20',
    period_type: 'Trimestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
    levels: ['2nde', '1ère A', '1ère D', 'Tle A', 'Tle D', 'Tle C'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: ['Français', 'Philosophie', 'Maths', 'PC', 'SVT', 'Histoire-Géo', 'Anglais'],
    color: '#7c3aed',
    note: 'Notes sur 20 avec coefficients par filière. Préparation aux examens nationaux (BAC).'
  },
  'Institut/Université': {
    emoji: '🏛️',
    description: 'Licence, Master, Doctorat',
    grading_system: 'Crédits/UE',
    period_type: 'Semestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: false,
    levels: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'],
    period_labels: ['S1', 'S2'],
    subjects_example: ['UE Fondamentales', 'UE Transversales', 'UE Optionnelles', 'Stage'],
    color: '#0891b2',
    note: 'Système de crédits ECTS / LMD. Notes sur 20 avec compensation entre UE par semestre.'
  },
  'Multi-cycles': {
    emoji: '🏢',
    description: 'Établissement avec plusieurs cycles',
    grading_system: 'Note sur 20',
    period_type: 'Trimestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
    levels: ['Variable selon le cycle'],
    period_labels: ['T1', 'T2', 'T3'],
    subjects_example: [],
    color: '#374151',
    note: 'Configuration manuelle pour chaque cycle et classe.'
  },
};

export default function SchoolSettings() {
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({
    name: '', slogan: '', address: '', city: '', country: 'Niger',
    phone: '', email: '', website: '', director_name: '',
    academic_year_label: '2025-2026', header_color: '#4338ca',
    logo_url: '', stamp_url: '', footer_text: 'Document officiel — Ne pas modifier',
    status: 'Active',
    school_type: 'Collège',
    school_cycles: ['Collège'],
    grading_system: 'Note sur 20',
    period_type: 'Trimestre',
    has_homework: true,
    has_schedule: true,
    has_canteen: true,
    has_transport: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await School.list();
      if (list.length > 0) {
        setSchool(list[0]);
        setForm(f => ({ ...f, ...list[0], school_cycles: list[0].school_cycles || (list[0].school_type ? [list[0].school_type] : ['Collège']) }));
        if (list[0].logo_url) setLogoPreview(list[0].logo_url);
      }
    } catch (e) {}
    setLoading(false);
  }

  const [logoFile, setLogoFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleTypeChange(type) {
    const config = SCHOOL_TYPE_CONFIG[type];
    setForm(f => ({
      ...f,
      school_type: type,
      grading_system: config.grading_system,
      period_type: config.period_type,
      has_homework: config.has_homework,
      has_schedule: config.has_schedule,
      has_canteen: config.has_canteen,
      has_transport: config.has_transport,
      header_color: config.color,
    }));
  }

  async function uploadFileToStorage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        // Convert base64 to blob and upload via backend
        const base64 = ev.target.result;
        resolve(base64); // We'll use the URL directly for now
      };
      reader.readAsDataURL(file);
    });
  }

  async function save() {
    setSaving(true);
    try {
      const saveData = { ...form };
      
      // If a new logo file was selected, use base64 (will be stored)
      if (logoFile) {
        const base64 = await uploadFileToStorage(logoFile);
        saveData.logo_url = base64;
      } else if (logoUrlInput) {
        saveData.logo_url = logoUrlInput;
      }
      
      // Remove base64 stamp if too large, keep existing
      if (saveData.stamp_url && saveData.stamp_url.startsWith('data:') && saveData.stamp_url.length > 500000) {
        delete saveData.stamp_url; // too large, skip
      }
      
      // Remove base64 logo if too large
      if (saveData.logo_url && saveData.logo_url.startsWith('data:') && saveData.logo_url.length > 500000) {
        // Keep existing logo_url from DB
        saveData.logo_url = school?.logo_url || '';
      }

      if (school) {
        await School.update(school.id, saveData);
      } else {
        const created = await School.create(saveData);
        setSchool(created);
      }
      setSaved(true);
      setLogoFile(null);
      setStampFile(null);
      setLogoUrlInput('');
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (e) { alert('Erreur: ' + e.message); }
    setSaving(false);
  }

  const previewSchool = { ...form, logo_url: logoPreview || form.logo_url };
  const currentConfig = SCHOOL_TYPE_CONFIG[form.school_type] || SCHOOL_TYPE_CONFIG['Collège'];

  const colors = [
    '#1e3a5f', '#4338ca', '#7c3aed', '#059669', '#10b981',
    '#dc2626', '#d97706', '#f97316', '#0891b2', '#ec4899'
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Paramètres de l'école</h3>
          <p className="text-sm text-gray-500">Ces informations apparaîtront sur tous les documents officiels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">
            <Eye size={16} /> Aperçu en-tête
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
            <Save size={16} /> {saving ? 'Enregistrement...' : saved ? '✅ Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* === TYPE D'ÉTABLISSEMENT === */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-4">🏫 Type d'établissement</h4>
        <p className="text-xs text-gray-400 mb-3">Cochez tous les cycles présents dans votre établissement (multi-sélection possible)</p>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Object.entries(SCHOOL_TYPE_CONFIG).filter(([t]) => t !== 'Multi-cycles').map(([type, config]) => {
            const isSelected = (form.school_cycles || []).includes(type);
            return (
              <button key={type} type="button" onClick={() => {
                const cycles = form.school_cycles || [];
                const updated = isSelected ? cycles.filter(c => c !== type) : [...cycles, type];
                // Recalculer config dominante
                const primary = updated.length === 1 ? updated[0] : 'Multi-cycles';
                const cfg = SCHOOL_TYPE_CONFIG[primary] || SCHOOL_TYPE_CONFIG['Multi-cycles'];
                const hasHigher = updated.some(c => ['Collège','Lycée','Institut/Université'].includes(c));
                setForm(f => ({
                  ...f,
                  school_cycles: updated,
                  school_type: updated.length === 1 ? updated[0] : 'Multi-cycles',
                  grading_system: hasHigher ? 'Note sur 20' : (cfg.grading_system || 'Note sur 20'),
                  period_type: cfg.period_type || 'Trimestre',
                  has_homework: updated.some(c => SCHOOL_TYPE_CONFIG[c]?.has_homework),
                  has_schedule: updated.some(c => SCHOOL_TYPE_CONFIG[c]?.has_schedule),
                  has_canteen: updated.some(c => SCHOOL_TYPE_CONFIG[c]?.has_canteen),
                  has_transport: updated.some(c => SCHOOL_TYPE_CONFIG[c]?.has_transport),
                  header_color: updated.length === 1 ? (cfg.color || f.header_color) : f.header_color,
                }));
              }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50 shadow-md'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}>
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                )}
                <span className="text-3xl">{config.emoji}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>{type}</span>
                <span className="text-xs text-gray-400 leading-tight">{config.description}</span>
              </button>
            );
          })}
        </div>
        {(form.school_cycles || []).length > 1 && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-50 rounded-xl text-xs text-violet-700">
            <span className="font-bold">🏢 Multi-cycles :</span>
            {(form.school_cycles || []).join(' + ')}
          </div>
        )}

        {/* Récapitulatif config actuelle */}
        <div className="rounded-xl p-4 text-sm" style={{ background: currentConfig.color + '15', borderLeft: `4px solid ${currentConfig.color}` }}>
          <div className="font-semibold mb-2" style={{ color: currentConfig.color }}>
            {currentConfig.emoji} Configuration automatique pour : {form.school_type}
          </div>
          <p className="text-gray-600 text-xs mb-3">{currentConfig.note}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Niveaux de classe</div>
              <div className="flex flex-wrap gap-1">
                {currentConfig.levels.map(l => (
                  <span key={l} className="px-2 py-0.5 rounded-lg text-xs font-medium bg-white border border-gray-200">{l}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Matières typiques</div>
              <div className="flex flex-wrap gap-1">
                {currentConfig.subjects_example.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-lg text-xs bg-white border border-gray-200">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
            {[
              { label: 'Évaluation', val: form.grading_system },
              { label: 'Périodes', val: form.period_type },
            ].map(i => (
              <div key={i.label}>
                <span className="text-xs text-gray-500">{i.label} : </span>
                <span className="text-xs font-semibold text-gray-800">{i.val}</span>
              </div>
            ))}
            {[
              { label: '📚 Devoirs', val: form.has_homework },
              { label: '🗓️ EDT', val: form.has_schedule },
              { label: '🍽️ Cantine', val: form.has_canteen },
              { label: '🚌 Transport', val: form.has_transport },
            ].map(i => (
              <div key={i.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${i.val ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-xs text-gray-600">{i.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Override manuel si besoin */}
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">⚙️ Personnaliser les options (avancé)</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Système d'évaluation</label>
              <select value={form.grading_system} onChange={e => setForm(f => ({...f, grading_system: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {['Aucune note','Acquis/En cours/Non acquis','Note sur 10','Note sur 20','Crédits/UE'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de période</label>
              <select value={form.period_type} onChange={e => setForm(f => ({...f, period_type: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {['Trimestre','Semestre','Année'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-wrap gap-4">
              {[
                { key: 'has_homework', label: 'Gestion des devoirs' },
                { key: 'has_schedule', label: 'Emploi du temps' },
                { key: 'has_canteen', label: 'Cantine / Repas' },
                { key: 'has_transport', label: 'Transport scolaire' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[opt.key]} onChange={e => setForm(f => ({...f, [opt.key]: e.target.checked}))}
                    className="w-4 h-4 rounded accent-violet-600" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Logo & couleur */}
        <div className="space-y-4">
          {/* Logo */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Upload size={16} /> Logo de l'école</h4>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  : <div className="text-center text-gray-400"><div className="text-4xl mb-1">{currentConfig.emoji}</div><div className="text-xs">Pas de logo</div></div>
                }
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100">
                  <Upload size={14} /> Choisir un fichier image
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">ou URL :</span>
                  <input
                    type="text"
                    value={logoUrlInput}
                    onChange={e => {
                      setLogoUrlInput(e.target.value);
                      setLogoPreview(e.target.value);
                      setForm(f => ({ ...f, logo_url: e.target.value }));
                    }}
                    placeholder="https://... coller l'URL du logo"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              {logoPreview && (
                <button onClick={() => { setLogoPreview(''); setLogoFile(null); setLogoUrlInput(''); setForm(f => ({ ...f, logo_url: '' })); }}
                  className="text-xs text-red-500 hover:text-red-700">Supprimer le logo</button>
              )}
            </div>
          </div>

          {/* Tampon/Cachet */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">🔖 Cachet officiel</h4>
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {form.stamp_url
                  ? <img src={form.stamp_url} alt="Cachet" className="w-full h-full object-contain p-2 opacity-60" />
                  : <div className="text-center text-gray-400 text-xs">Tampon</div>
                }
              </div>
              <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                📤 Importer un tampon
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  setStampFile(file);
                  reader.onload = (ev) => setForm(f => ({ ...f, stamp_url: ev.target.result }));
                  reader.readAsDataURL(file);
                }} className="hidden" />
              </label>
            </div>
          </div>

          {/* Couleur */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Palette size={16} /> Couleur des en-têtes</h4>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colors.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, header_color: c }))}
                  style={{ background: c }}
                  className={`w-10 h-10 rounded-xl transition-all ${form.header_color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Personnalisée:</label>
              <input type="color" value={form.header_color} onChange={e => setForm(f => ({ ...f, header_color: e.target.value }))}
                className="w-10 h-8 rounded cursor-pointer border border-gray-200" />
              <span className="text-xs font-mono text-gray-600">{form.header_color}</span>
            </div>
          </div>
        </div>

        {/* Right: Infos */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-4">📋 Informations de l'établissement</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Nom officiel', placeholder: 'Groupe Scolaire RENO', col: 2 },
                { key: 'slogan', label: 'Devise / Slogan', placeholder: 'L\'excellence au service de la nation', col: 2 },
                { key: 'director_name', label: form.school_type === 'Institut/Université' ? 'Nom du recteur / directeur' : 'Nom du directeur', placeholder: 'M. Moctar Talba' },
                { key: 'academic_year_label', label: form.period_type === 'Semestre' ? 'Année universitaire' : 'Année scolaire', placeholder: '2025-2026' },
                { key: 'address', label: 'Adresse', placeholder: 'Rue 12, Médina' },
                { key: 'city', label: 'Ville', placeholder: 'Niamey' },
                { key: 'country', label: 'Pays', placeholder: 'Niger' },
                { key: 'phone', label: 'Téléphone', placeholder: '+227 90 00 00 00' },
                { key: 'email', label: 'Email', placeholder: 'contact@ecole.ne' },
                { key: 'website', label: 'Site web', placeholder: 'www.ecole.ne' },
              ].map(f => (
                <div key={f.key} className={f.col === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-4">📄 Pied de page des documents</h4>
            <input value={form.footer_text || ''} onChange={e => setForm({ ...form, footer_text: e.target.value })}
              placeholder="Document officiel — Ne pas modifier"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50" />
            <p className="text-xs text-gray-400 mt-1">Apparaît en bas de chaque document imprimé (bulletins, certificats, etc.)</p>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">Paramètres enregistrés !</p>
                <p className="text-xs text-green-600">Les en-têtes seront mis à jour sur tous les nouveaux documents.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Aperçu de l'en-tête officielle</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-xl p-6 bg-white">
                <DocumentHeader
                  school={previewSchool}
                  documentTitle="Bulletin de notes"
                  documentSubtitle={`${form.period_type === 'Semestre' ? 'Semestre 1' : 'Trimestre 1'} — ${form.academic_year_label}`}
                  rightInfo={<div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', marginTop: '4px' }}>
                    <div>Élève: <strong>MAHAMANE Aïcha</strong></div>
                    <div>Classe: <strong>{currentConfig.levels[0] || '6ème A'}</strong></div>
                  </div>}
                />
                <div className="py-8 text-center text-gray-300 text-sm">[Contenu du document]</div>
                <DocumentFooter school={previewSchool} documentTitle="Bulletin de notes" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button onClick={() => setShowPreview(false)} className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700">
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
