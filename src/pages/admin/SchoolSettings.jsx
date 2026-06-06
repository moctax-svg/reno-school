import React, { useState, useEffect } from 'react';
import { School } from '../../api/entities';
import { Save, Eye, Image, Stamp, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';

const SCHOOL_TYPE_CONFIG = {
  'Crèche': { emoji: '🍼', description: 'Enfants de 0 à 3 ans', grading_system: 'Aucune note', period_type: 'Trimestre', has_homework: false, has_schedule: false, has_canteen: true, has_transport: true, color: '#f97316' },
  'Maternelle': { emoji: '🌸', description: 'Petite, Moyenne et Grande Section', grading_system: 'Acquis/En cours/Non acquis', period_type: 'Trimestre', has_homework: false, has_schedule: true, has_canteen: true, has_transport: true, color: '#ec4899' },
  'Primaire': { emoji: '📚', description: 'CP, CE1, CE2, CM1, CM2', grading_system: 'Note sur 10', period_type: 'Trimestre', has_homework: true, has_schedule: true, has_canteen: true, has_transport: true, color: '#10b981' },
  'Collège': { emoji: '🏫', description: '6ème, 5ème, 4ème, 3ème', grading_system: 'Note sur 20', period_type: 'Trimestre', has_homework: true, has_schedule: true, has_canteen: true, has_transport: true, color: '#4338ca' },
  'Lycée': { emoji: '🎓', description: '2nde, 1ère, Terminale', grading_system: 'Note sur 20', period_type: 'Trimestre', has_homework: true, has_schedule: true, has_canteen: true, has_transport: true, color: '#7c3aed' },
  'Institut/Université': { emoji: '🏛️', description: 'Licence, Master, Doctorat', grading_system: 'Crédits/UE', period_type: 'Semestre', has_homework: true, has_schedule: true, has_canteen: true, has_transport: false, color: '#0891b2' },
  'Multi-cycles': { emoji: '🏢', description: 'Établissement avec plusieurs cycles', grading_system: 'Note sur 20', period_type: 'Trimestre', has_homework: true, has_schedule: true, has_canteen: true, has_transport: true, color: '#374151' },
};

const COLORS = ['#1e3a5f','#4338ca','#7c3aed','#059669','#10b981','#dc2626','#d97706','#f97316','#0891b2','#ec4899'];

const DEFAULT_FORM = {
  name: '', slogan: '', address: '', city: '', country: 'Niger',
  phone: '', email: '', website: '', director_name: '',
  academic_year_label: '2025-2026', header_color: '#4338ca',
  logo_url: '', stamp_url: '', footer_text: 'Document officiel — Ne pas modifier',
  status: 'Active', school_type: 'Collège', school_cycles: ['Collège'],
  grading_system: 'Note sur 20', period_type: 'Trimestre',
  has_homework: true, has_schedule: true, has_canteen: true, has_transport: true,
};

export default function SchoolSettings() {
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [saveError, setSaveError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await School.list();
      if (list.length > 0) {
        const s = list[0];
        setSchool(s);
        setForm({
          ...DEFAULT_FORM,
          ...s,
          school_cycles: s.school_cycles || (s.school_type ? [s.school_type] : ['Collège']),
          // Ne jamais charger de base64 dans le formulaire
          logo_url: (s.logo_url && !s.logo_url.startsWith('data:')) ? s.logo_url : '',
          stamp_url: (s.stamp_url && !s.stamp_url.startsWith('data:')) ? s.stamp_url : '',
        });
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
    }
    setLoading(false);
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleTypeChange(type) {
    const config = SCHOOL_TYPE_CONFIG[type];
    if (!config) return;
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

  function toggleCycle(cycle) {
    setForm(f => {
      const cycles = f.school_cycles || [];
      const next = cycles.includes(cycle)
        ? cycles.filter(c => c !== cycle)
        : [...cycles, cycle];
      return { ...f, school_cycles: next.length > 0 ? next : [cycle] };
    });
  }

  async function save() {
    setSaving(true);
    setSaveStatus(null);
    setSaveError('');

    try {
      // Valider que les URLs ne sont pas du base64
      const saveData = { ...form };

      if (saveData.logo_url && saveData.logo_url.startsWith('data:')) {
        setSaveError('Le logo doit être une URL publique (ex: https://...), pas un fichier chargé localement.');
        setSaveStatus('error');
        setSaving(false);
        return;
      }
      if (saveData.stamp_url && saveData.stamp_url.startsWith('data:')) {
        setSaveError('Le cachet doit être une URL publique (ex: https://...), pas un fichier chargé localement.');
        setSaveStatus('error');
        setSaving(false);
        return;
      }

      if (school) {
        await School.update(school.id, saveData);
      } else {
        const created = await School.create(saveData);
        setSchool(created);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 4000);
      await load();
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      setSaveError(e.message || 'Erreur inconnue');
      setSaveStatus('error');
    }
    setSaving(false);
  }

  const currentConfig = SCHOOL_TYPE_CONFIG[form.school_type] || SCHOOL_TYPE_CONFIG['Collège'];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
  );

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Paramètres de l'école</h3>
          <p className="text-sm text-gray-500">Ces informations apparaissent sur tous les documents officiels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">
            <Eye size={16} /> Aperçu
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Statut sauvegarde */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} /> Paramètres enregistrés avec succès !
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} /> {saveError || 'Erreur lors de l\'enregistrement.'}
        </div>
      )}

      {/* Aperçu en-tête */}
      {showPreview && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-700 mb-3">👁️ Aperçu de l'en-tête</h4>
          <DocumentHeader school={form} title="Aperçu document officiel" subtitle="Prévisualisation" />
        </div>
      )}

      {/* Type d'établissement */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-3">🏫 Type d'établissement</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Object.entries(SCHOOL_TYPE_CONFIG).filter(([t]) => t !== 'Multi-cycles').map(([type, config]) => {
            const isSelected = (form.school_cycles || []).includes(type);
            return (
              <button key={type} onClick={() => toggleCycle(type)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                  isSelected ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-2xl mb-1">{config.emoji}</span>
                <span className="text-xs font-semibold text-gray-700">{type}</span>
                <span className="text-xs text-gray-400 mt-0.5">{config.description}</span>
              </button>
            );
          })}
        </div>
        {(form.school_cycles || []).length > 1 && (
          <p className="text-xs text-violet-600 mt-3">✅ Multi-cycles : {(form.school_cycles || []).join(', ')}</p>
        )}
      </div>

      {/* Informations générales */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-4">📋 Informations générales</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom de l'école *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Ex: Collège Saint-Paul" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Slogan</label>
            <input value={form.slogan} onChange={e => set('slogan', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Ex: Excellence & Valeurs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Directeur / Directrice</label>
            <input value={form.director_name} onChange={e => set('director_name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Nom complet" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Année académique</label>
            <input value={form.academic_year_label} onChange={e => set('academic_year_label', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="2025-2026" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="+227 XX XX XX XX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="contact@ecole.ne" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Niamey" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Quartier, Rue..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Site web</label>
            <input value={form.website} onChange={e => set('website', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="https://www.ecole.ne" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pied de page documents</label>
            <input value={form.footer_text} onChange={e => set('footer_text', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="Document officiel — Ne pas modifier" />
          </div>
        </div>
      </div>

      {/* Logo et cachet — URL uniquement */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-1">🖼️ Logo & Cachet de l'école</h4>
        <p className="text-xs text-gray-400 mb-4">
          Collez l'URL publique de votre image (hébergée sur Google Drive, Imgur, Cloudinary, etc.).<br/>
          <span className="text-violet-600 font-medium">Ne pas utiliser de fichier local — seules les URLs http:// ou https:// sont acceptées.</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Image size={13} className="inline mr-1" /> URL du Logo
            </label>
            <input
              value={form.logo_url}
              onChange={e => set('logo_url', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono"
              placeholder="https://exemple.com/logo.png"
            />
            {form.logo_url && form.logo_url.startsWith('http') && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                <img src={form.logo_url} alt="Logo"
                  className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                  onError={e => { e.target.style.display='none'; }} />
                <span className="text-xs text-green-600 font-medium">✅ Logo chargé</span>
              </div>
            )}
            {form.logo_url && !form.logo_url.startsWith('http') && (
              <p className="text-xs text-red-500 mt-1">⚠️ URL invalide — elle doit commencer par https://</p>
            )}
          </div>

          {/* Cachet */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Stamp size={13} className="inline mr-1" /> URL du Cachet / Tampon
            </label>
            <input
              value={form.stamp_url}
              onChange={e => set('stamp_url', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono"
              placeholder="https://exemple.com/cachet.png"
            />
            {form.stamp_url && form.stamp_url.startsWith('http') && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                <img src={form.stamp_url} alt="Cachet"
                  className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                  onError={e => { e.target.style.display='none'; }} />
                <span className="text-xs text-green-600 font-medium">✅ Cachet chargé</span>
              </div>
            )}
            {form.stamp_url && !form.stamp_url.startsWith('http') && (
              <p className="text-xs text-red-500 mt-1">⚠️ URL invalide — elle doit commencer par https://</p>
            )}
          </div>
        </div>

        {/* Guide hébergement images */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">📌 Comment obtenir une URL publique pour votre image ?</p>
          <ul className="space-y-0.5 list-disc list-inside text-blue-600">
            <li><strong>Imgur</strong> : imgur.com → Upload → copier le lien direct (.png/.jpg)</li>
            <li><strong>Google Drive</strong> : Partager → "Tout le monde" → copier l'ID et utiliser : https://drive.google.com/uc?id=VOTRE_ID</li>
            <li><strong>Cloudinary</strong> : cloudinary.com (gratuit) → Upload → copier l'URL</li>
          </ul>
        </div>
      </div>

      {/* Couleur d'en-tête */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-3">🎨 Couleur de l'en-tête des documents</h4>
        <div className="flex flex-wrap gap-3">
          {COLORS.map(color => (
            <button key={color} onClick={() => set('header_color', color)}
              className={`w-10 h-10 rounded-xl border-4 transition-all ${form.header_color === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: color }} />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Personnalisée :</label>
            <input type="color" value={form.header_color} onChange={e => set('header_color', e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200" />
          </div>
        </div>
        <div className="mt-3 h-6 rounded-xl" style={{ backgroundColor: form.header_color }}>
          <p className="text-white text-xs text-center leading-6 font-medium">{form.name || 'Nom de l\'école'}</p>
        </div>
      </div>

      {/* Modules actifs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-3">⚙️ Modules actifs</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'has_homework', label: 'Devoirs', icon: '📝' },
            { key: 'has_schedule', label: 'Emploi du temps', icon: '📅' },
            { key: 'has_canteen', label: 'Cantine', icon: '🍽️' },
            { key: 'has_transport', label: 'Transport', icon: '🚌' },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => set(key, !form[key])}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                form[key] ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-400'}`}>
              <span>{icon}</span> {label}
              {form[key] && <span className="ml-auto text-violet-500">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton bas */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60">
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>

    </div>
  );
}
