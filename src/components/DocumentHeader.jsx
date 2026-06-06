import React from 'react';

/**
 * En-tête officielle réutilisable pour tous les documents imprimables.
 * Props:
 *  - school: objet School
 *  - documentTitle: titre du document
 *  - documentSubtitle: sous-titre optionnel
 *  - rightInfo: contenu JSX affiché à droite
 *  - print: boolean
 */
export default function DocumentHeader({ school, documentTitle, documentSubtitle, rightInfo, print = false }) {
  const color = school?.header_color || '#1e3a5f';
  const colorLight = color + '18';

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", marginBottom: '24px' }}>
      
      {/* Bandeau supérieur coloré */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        height: '6px',
        borderRadius: '4px 4px 0 0',
        marginBottom: '0',
      }} />

      {/* Conteneur principal */}
      <div style={{
        border: `1px solid ${color}33`,
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px 20px',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Filigrane léger en arrière-plan */}
        <div style={{
          position: 'absolute',
          right: '-10px',
          top: '-10px',
          width: '120px',
          height: '120px',
          background: colorLight,
          borderRadius: '50%',
          zIndex: 0,
        }} />

        {/* Ligne principale : Logo | Infos école | Titre document */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            {school?.logo_url ? (
              <div style={{
                width: '76px', height: '76px',
                border: `2px solid ${color}33`,
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}>
                <img src={school.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
              </div>
            ) : (
              <div style={{
                width: '76px', height: '76px',
                background: colorLight,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px',
                border: `2px solid ${color}22`,
              }}>🏫</div>
            )}
          </div>

          {/* Infos école (centre) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Pays / République */}
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
              {school?.country || 'République du Niger'}
            </div>

            {/* Nom de l'école */}
            <div style={{ fontSize: '20px', fontWeight: '800', color: color, lineHeight: '1.1', letterSpacing: '-0.3px' }}>
              {school?.name || 'École RENO'}
            </div>

            {/* Slogan */}
            {school?.slogan && (
              <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px', marginBottom: '6px' }}>
                « {school.slogan} »
              </div>
            )}

            {/* Séparateur */}
            <div style={{ width: '40px', height: '2px', background: color, borderRadius: '2px', marginBottom: '6px' }} />

            {/* Coordonnées sur une ligne */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '10.5px', color: '#475569' }}>
              {school?.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: color }}>📍</span>
                  {school.address}{school?.city ? `, ${school.city}` : ''}
                </span>
              )}
              {school?.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: color }}>📞</span>
                  {school.phone}
                </span>
              )}
              {school?.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: color }}>✉️</span>
                  {school.email}
                </span>
              )}
              {school?.website && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: color }}>🌐</span>
                  {school.website}
                </span>
              )}
            </div>

            {/* Directeur + Année scolaire */}
            {(school?.director_name || school?.academic_year_label) && (
              <div style={{ marginTop: '5px', fontSize: '10.5px', color: '#64748b', display: 'flex', gap: '20px' }}>
                {school?.director_name && (
                  <span>Dir. : <strong style={{ color: '#374151' }}>{school.director_name}</strong></span>
                )}
                {school?.academic_year_label && (
                  <span>Année scolaire : <strong style={{ color: '#374151' }}>{school.academic_year_label}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Titre du document (droite) */}
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '160px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              color: 'white',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: `0 4px 12px ${color}44`,
              lineHeight: '1.3',
            }}>
              {documentTitle}
            </div>
            {documentSubtitle && (
              <div style={{
                fontSize: '11px',
                color: color,
                marginTop: '6px',
                fontWeight: '600',
                background: colorLight,
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {documentSubtitle}
              </div>
            )}
            {rightInfo && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                {rightInfo}
              </div>
            )}

            {/* Tampon si disponible */}
            {school?.stamp_url && (
              <div style={{ marginTop: '8px' }}>
                <img src={school.stamp_url} alt="Cachet" style={{
                  width: '60px', height: '60px',
                  objectFit: 'contain',
                  opacity: 0.7,
                  filter: 'sepia(20%)',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Bandeau inférieur avec ligne de séparation stylisée */}
        <div style={{
          marginTop: '14px',
          height: '1px',
          background: `linear-gradient(90deg, ${color}66, ${color}22, transparent)`,
        }} />
      </div>
    </div>
  );
}

/**
 * Pied de page officiel — propre et discret
 */
export function DocumentFooter({ school, documentTitle }) {
  const color = school?.header_color || '#1e3a5f';
  return (
    <div style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      marginTop: '24px',
    }}>
      {/* Ligne de séparation dégradée */}
      <div style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}55, ${color}cc, ${color}55, transparent)`,
        marginBottom: '10px',
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: '#94a3b8',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: color, fontWeight: '700' }}>{school?.name || 'RENO'}</span>
          {school?.academic_year_label && <span>· {school.academic_year_label}</span>}
        </span>

        <span style={{
          background: color + '12',
          color: color,
          padding: '2px 10px',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '9px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {school?.footer_text || 'Document officiel'}
        </span>

        <span>Émis le {new Date().toLocaleDateString('fr-FR')} · RENO</span>
      </div>

      {/* Bandeau coloré bas */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        height: '4px',
        borderRadius: '0 0 4px 4px',
        marginTop: '8px',
      }} />
    </div>
  );
}
