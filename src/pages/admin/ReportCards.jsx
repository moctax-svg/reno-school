import React, { useState, useEffect } from 'react';
import { Student, Grade, Subject, Classroom, School } from '../../api/entities';
import DocumentHeader, { DocumentFooter } from '../../components/DocumentHeader';
import { Printer, Eye, Search, ChevronDown } from 'lucide-react';

/* ══════════════════════════════════════════
   HELPERS COMMUNS
══════════════════════════════════════════ */

function getMention20(avg) {
  if (avg >= 16) return { label: 'Très Bien', color: '#059669' };
  if (avg >= 14) return { label: 'Bien',       color: '#0284c7' };
  if (avg >= 12) return { label: 'Assez Bien', color: '#7c3aed' };
  if (avg >= 10) return { label: 'Passable',   color: '#d97706' };
  return { label: 'Insuffisant', color: '#dc2626' };
}
function getMention10(avg) {
  if (avg >= 8)  return { label: 'Très Bien', color: '#059669' };
  if (avg >= 7)  return { label: 'Bien',       color: '#0284c7' };
  if (avg >= 6)  return { label: 'Assez Bien', color: '#7c3aed' };
  if (avg >= 5)  return { label: 'Passable',   color: '#d97706' };
  return { label: 'Insuffisant', color: '#dc2626' };
}

function getAppreciationText(avg, max) {
  const pct = avg / max;
  if (pct >= 0.8) return 'Excellent travail. Continuez sur cette lancée !';
  if (pct >= 0.7) return 'Bon trimestre. Des efforts supplémentaires permettront de progresser encore.';
  if (pct >= 0.5) return 'Des efforts sont nécessaires pour progresser.';
  return 'Des lacunes importantes. Un travail régulier et soutenu est indispensable.';
}

/* En-tête commune à tous les bulletins — utilise le composant centralisé */
function BulletinHeader({ school, title, subtitle, color }) {
  return <DocumentHeader school={{ ...school, header_color: color || school?.header_color }} documentTitle={title} documentSubtitle={subtitle} />;
}

/* Pied de page commun */
function BulletinFooter({ school, color }) {
  return <DocumentFooter school={{ ...school, header_color: color || school?.header_color }} />;
}

/* Bloc infos élève */
function StudentInfo({ student, classroom, extraFields = [] }) {
  const baseFields = [
    { label: 'Nom & Prénom', value: `${student.last_name?.toUpperCase() || ''} ${student.first_name || ''}` },
    { label: 'N° Matricule', value: student.registration_number || '—' },
    { label: 'Classe', value: classroom?.name || '—' },
    { label: 'Date de naissance', value: student.date_of_birth || '—' },
    ...extraFields,
  ];
  const cols = Math.min(baseFields.length, 4);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'10px', marginBottom:'18px', background:'#f8fafc', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
      {baseFields.map((f, i) => (
        <div key={i}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'2px' }}>{f.label}</div>
          <div style={{ fontSize:'12px', fontWeight: i === 0 ? 'bold' : '600', color:'#0f172a' }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   1. BULLETIN CRÈCHE — Suivi journalier/mensuel
══════════════════════════════════════════ */
function BulletinCreche({ student, classroom, period, school }) {
  const color = school?.header_color || '#f97316';
  const activities = [
    { emoji:'🍼', label:'Alimentation / Repas', sub:'Appétit, diversification' },
    { emoji:'😴', label:'Sommeil / Sieste',      sub:'Durée, qualité' },
    { emoji:'🚼', label:'Hygiène',               sub:'Changes, propreté' },
    { emoji:'🤲', label:'Motricité',              sub:'Ramper, se tenir assis, marcher' },
    { emoji:'👁️', label:'Éveil sensoriel',       sub:'Réactions aux stimuli' },
    { emoji:'😊', label:'Bien-être émotionnel',  sub:'Pleurs, sourires, interactions' },
    { emoji:'👶', label:'Relations sociales',     sub:'Avec adultes et autres enfants' },
    { emoji:'🎨', label:'Activités créatives',   sub:'Éveil artistique et manuel' },
  ];
  const levels = ['Excellent', 'Bien', 'À encourager', 'En difficulté'];
  const levelColors = { 'Excellent':'#059669', 'Bien':'#0284c7', 'À encourager':'#d97706', 'En difficulté':'#dc2626' };

  return (
    <div id={`bulletin-${student.id}`} style={{ maxWidth:'794px', margin:'0 auto', background:'white', padding:'32px', fontFamily:'Arial, sans-serif' }}>
      <BulletinHeader school={school} color={color} title="BILAN DE DÉVELOPPEMENT" subtitle={`${period} — ${school?.academic_year_label || ''}`} />
      <StudentInfo student={student} classroom={classroom} extraFields={[{ label:'Âge', value: student.date_of_birth ? `${Math.floor((new Date() - new Date(student.date_of_birth)) / (365.25*24*3600*1000))} an(s)` : '—' }]} />

      <div style={{ marginBottom:'18px' }}>
        <div style={{ fontSize:'13px', fontWeight:'bold', color, marginBottom:'10px', borderLeft:`4px solid ${color}`, paddingLeft:'10px' }}>
          🍼 Suivi du développement — {period}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
          <thead>
            <tr style={{ background:color, color:'white' }}>
              <th style={{ padding:'8px 10px', textAlign:'left', width:'35%' }}>Domaine de développement</th>
              {levels.map(l => <th key={l} style={{ padding:'8px 6px', textAlign:'center', fontSize:'10px', width:'13%' }}>{l}</th>)}
              <th style={{ padding:'8px 10px', textAlign:'left', width:'26%' }}>Observations</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={i} style={{ background: i%2===0 ? '#fff7ed':'white', borderBottom:'1px solid #fed7aa' }}>
                <td style={{ padding:'10px' }}>
                  <div style={{ fontWeight:'600', color:'#0f172a' }}>{a.emoji} {a.label}</div>
                  <div style={{ fontSize:'9px', color:'#94a3b8', marginTop:'2px' }}>{a.sub}</div>
                </td>
                {levels.map(l => (
                  <td key={l} style={{ padding:'10px', textAlign:'center' }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:`2px solid ${levelColors[l]}`, margin:'auto', background:'transparent' }}></div>
                  </td>
                ))}
                <td style={{ padding:'10px', fontSize:'10px', color:'#64748b', fontStyle:'italic', borderBottom:'1px dashed #e2e8f0' }}>
                  <div style={{ minHeight:'20px' }}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Appréciation de la puéricultrice</div>
          <div style={{ minHeight:'50px', borderBottom:'1px dashed #e2e8f0' }}></div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Signature du responsable</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width:'50px', height:'50px', objectFit:'contain', opacity:0.7 }} />}
          <div style={{ marginTop:'18px', borderTop:'1px solid #cbd5e1', paddingTop:'4px', fontSize:'10px', color:'#94a3b8', textAlign:'center' }}>Signature & Cachet</div>
        </div>
      </div>
      <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'8px', padding:'10px', fontSize:'10px', color:'#92400e', marginBottom:'14px' }}>
        ℹ️ Ce bilan est établi à partir des observations quotidiennes de l'équipe de la crèche. Chaque enfant évolue à son propre rythme.
      </div>
      <BulletinFooter school={school} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════
   2. BULLETIN MATERNELLE — Acquis/En cours/Non acquis
══════════════════════════════════════════ */
function BulletinMaternelle({ student, classroom, period, school }) {
  const color = school?.header_color || '#ec4899';
  const domaines = [
    { label:'Langage oral', items:['S\'exprimer clairement','Comprendre les consignes','Raconter une histoire','Enrichir son vocabulaire'] },
    { label:'Découverte du monde', items:['Observer et décrire','Manipuler des objets','Notions de quantité','Repères dans le temps'] },
    { label:'Motricité & EPS', items:['Motricité globale','Coordination','Activités rythmiques','Respect des règles'] },
    { label:'Arts & Expression', items:['Dessin / Coloriage','Modelage / Collage','Chant / Comptines','Jeux créatifs'] },
    { label:'Vie collective', items:['Respect des autres','Autonomie','Rangement / Ordre','Participation'] },
  ];
  const niveaux = ['Acquis ✓', 'En cours ◎', 'Non acquis ✗'];
  const niveauColors = { 'Acquis ✓':'#059669', 'En cours ◎':'#d97706', 'Non acquis ✗':'#dc2626' };

  return (
    <div id={`bulletin-${student.id}`} style={{ maxWidth:'794px', margin:'0 auto', background:'white', padding:'32px', fontFamily:'Arial, sans-serif' }}>
      <BulletinHeader school={school} color={color} title="BULLETIN MATERNELLE" subtitle={`${period} — ${school?.academic_year_label || ''}`} />
      <StudentInfo student={student} classroom={classroom} extraFields={[{ label:'Section', value: classroom?.level || '—' }]} />

      {/* Légende */}
      <div style={{ display:'flex', gap:'16px', marginBottom:'14px', padding:'8px 12px', background:'#fdf4ff', borderRadius:'8px', fontSize:'11px' }}>
        {niveaux.map(n => <span key={n} style={{ color:niveauColors[n], fontWeight:'bold' }}>{n}</span>)}
        <span style={{ color:'#94a3b8', marginLeft:'auto' }}>→ Entourer le niveau atteint pour chaque compétence</span>
      </div>

      {domaines.map((domaine, di) => (
        <div key={di} style={{ marginBottom:'14px' }}>
          <div style={{ background:color, color:'white', padding:'6px 12px', borderRadius:'6px 6px 0 0', fontWeight:'bold', fontSize:'12px' }}>
            {domaine.label}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', border:`1px solid ${color}30`, borderTop:'none' }}>
            <tbody>
              {domaine.items.map((item, ii) => (
                <tr key={ii} style={{ background: ii%2===0 ? '#fdf4ff':'white', borderBottom:'1px solid #f5d0fe' }}>
                  <td style={{ padding:'8px 12px', width:'45%', color:'#0f172a' }}>{item}</td>
                  {niveaux.map(n => (
                    <td key={n} style={{ padding:'8px', textAlign:'center', width:'14%' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 8px', border:`1px solid ${niveauColors[n]}44`, borderRadius:'20px', fontSize:'10px', color:niveauColors[n], fontWeight:'600', background:niveauColors[n]+'11' }}>
                        {n}
                      </div>
                    </td>
                  ))}
                  <td style={{ padding:'8px 12px', width:'20%', fontSize:'10px', color:'#94a3b8', fontStyle:'italic' }}>
                    ......................
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'bold', marginBottom:'6px', textTransform:'uppercase' }}>Bilan général de l'enseignante</div>
          <div style={{ minHeight:'50px', borderBottom:'1px dashed #e2e8f0', marginBottom:'8px' }}></div>
          <div style={{ fontSize:'10px', color:'#94a3b8' }}>Date : .............</div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'bold', marginBottom:'6px', textTransform:'uppercase' }}>Signature Direction</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width:'50px', height:'50px', objectFit:'contain', opacity:0.7 }} />}
          <div style={{ marginTop:'18px', borderTop:'1px solid #e2e8f0', paddingTop:'4px', fontSize:'10px', color:'#94a3b8', textAlign:'center' }}>Signature & Cachet</div>
        </div>
      </div>
      <BulletinFooter school={school} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════
   3. BULLETIN PRIMAIRE — Notes sur 10
══════════════════════════════════════════ */
function BulletinPrimaire({ student, classroom, grades, subjects, period, school }) {
  const color = school?.header_color || '#10b981';
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });

  const gradesBySubject = {};
  grades.filter(g => g.student_id === student.id && g.trimester === period).forEach(g => {
    if (!gradesBySubject[g.subject_id]) gradesBySubject[g.subject_id] = [];
    gradesBySubject[g.subject_id].push(g);
  });

  const subjectAverages = Object.entries(gradesBySubject).map(([sid, sGrades]) => {
    const subj = subjectMap[sid] || { name: 'Matière inconnue', coefficient: 1 };
    // Normaliser sur 10
    const avg = sGrades.reduce((s, g) => s + (g.score / g.max_score * 10), 0) / sGrades.length;
    return { subject: subj, avg: parseFloat(avg.toFixed(1)), coeff: Number(subj.coefficient) || 1, grades: sGrades };
  });

  const totalCoeff = subjectAverages.reduce((s, sa) => s + sa.coeff, 0);
  const weightedSum = subjectAverages.reduce((s, sa) => s + sa.avg * sa.coeff, 0);
  const generalAvg = totalCoeff > 0 ? parseFloat((weightedSum / totalCoeff).toFixed(1)) : null;
  const mention = generalAvg !== null ? getMention10(generalAvg) : { label:'—', color:'#94a3b8' };

  return (
    <div id={`bulletin-${student.id}`} style={{ maxWidth:'794px', margin:'0 auto', background:'white', padding:'32px', fontFamily:'Arial, sans-serif' }}>
      <BulletinHeader school={school} color={color} title="BULLETIN SCOLAIRE" subtitle={`${period} — ${school?.academic_year_label || ''}`} />
      <StudentInfo student={student} classroom={classroom} extraFields={[{ label:'Niveau', value: classroom?.level || '—' }]} />

      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'18px', fontSize:'12px' }}>
        <thead>
          <tr style={{ background:color, color:'white' }}>
            {['MATIÈRE', 'COEFF.', 'NOTES (/10)', 'MOYENNE /10', 'APPRÉCIATION', 'OBSERVATIONS'].map(h => (
              <th key={h} style={{ padding:'9px 10px', textAlign: h==='MATIÈRE'?'left':'center', fontSize:'10px', fontWeight:'bold' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjectAverages.length === 0
            ? <tr><td colSpan={6} style={{ padding:'20px', textAlign:'center', color:'#94a3b8' }}>Aucune note pour cette période</td></tr>
            : subjectAverages.map((sa, i) => {
              const m = getMention10(sa.avg);
              return (
                <tr key={i} style={{ background: i%2===0 ? '#f0fdf4':'white', borderBottom:'1px solid #d1fae5' }}>
                  <td style={{ padding:'9px 10px', fontWeight:'600', color:'#0f172a' }}>{sa.subject.name}</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', color:'#64748b' }}>{sa.coeff}</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', fontSize:'10px', color:'#64748b' }}>
                    {sa.grades.map(g => `${g.score}/${g.max_score}`).join(' · ')}
                  </td>
                  <td style={{ padding:'9px 10px', textAlign:'center', fontWeight:'bold', fontSize:'15px', color:m.color }}>{sa.avg}/10</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', fontSize:'11px', color:m.color, fontWeight:'600' }}>{m.label}</td>
                  <td style={{ padding:'9px 10px', fontSize:'10px', color:'#94a3b8', fontStyle:'italic' }}>
                    {sa.grades[0]?.comments || ''}
                  </td>
                </tr>
              );
            })
          }
        </tbody>
        <tfoot>
          <tr style={{ background:color, color:'white' }}>
            <td colSpan={3} style={{ padding:'10px', fontWeight:'bold' }}>MOYENNE GÉNÉRALE (coeff. total : {totalCoeff})</td>
            <td style={{ padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'16px' }}>{generalAvg !== null ? `${generalAvg}/10` : '—'}</td>
            <td colSpan={2} style={{ padding:'10px', fontWeight:'bold', fontSize:'13px', color:'#fbbf24' }}>{mention.label}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:'9px', color:'#16a34a', fontWeight:'bold', textTransform:'uppercase', marginBottom:'4px' }}>Moyenne générale</div>
          <div style={{ fontSize:'22px', fontWeight:'bold', color:'#15803d' }}>{generalAvg !== null ? `${generalAvg}/10` : '—'}</div>
          <div style={{ fontSize:'11px', color:mention.color, fontWeight:'bold', marginTop:'2px' }}>{mention.label}</div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px', minHeight:'70px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Appréciation de l'enseignant(e)</div>
          <div style={{ fontSize:'11px', color:'#475569', fontStyle:'italic' }}>
            {generalAvg !== null ? getAppreciationText(generalAvg, 10) : 'À compléter.'}
          </div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Signature du Directeur</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width:'50px', height:'50px', objectFit:'contain', opacity:0.7 }} />}
          <div style={{ marginTop:'18px', borderTop:'1px solid #e2e8f0', paddingTop:'4px', fontSize:'10px', color:'#94a3b8', textAlign:'center' }}>Signature & Cachet</div>
        </div>
      </div>
      <BulletinFooter school={school} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════
   4. BULLETIN COLLÈGE / LYCÉE — Notes sur 20 avec coefficients
══════════════════════════════════════════ */
function BulletinCollege({ student, classroom, grades, subjects, period, school, isLycee }) {
  const color = school?.header_color || (isLycee ? '#7c3aed' : '#4338ca');
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });

  const gradesBySubject = {};
  grades.filter(g => g.student_id === student.id && g.trimester === period).forEach(g => {
    if (!gradesBySubject[g.subject_id]) gradesBySubject[g.subject_id] = [];
    gradesBySubject[g.subject_id].push(g);
  });

  const subjectAverages = Object.entries(gradesBySubject).map(([sid, sGrades]) => {
    const subj = subjectMap[sid] || { name: 'Matière inconnue', coefficient: 1 };
    const avg = sGrades.reduce((s, g) => s + (g.score / g.max_score * 20), 0) / sGrades.length;
    return { subject: subj, avg: parseFloat(avg.toFixed(2)), coeff: Number(subj.coefficient) || 1, grades: sGrades };
  });

  const totalCoeff = subjectAverages.reduce((s, sa) => s + sa.coeff, 0);
  const weightedSum = subjectAverages.reduce((s, sa) => s + sa.avg * sa.coeff, 0);
  const generalAvg = totalCoeff > 0 ? parseFloat((weightedSum / totalCoeff).toFixed(2)) : null;
  const mention = generalAvg !== null ? getMention20(generalAvg) : { label:'—', color:'#94a3b8' };

  return (
    <div id={`bulletin-${student.id}`} style={{ maxWidth:'794px', margin:'0 auto', background:'white', padding:'32px', fontFamily:'Arial, sans-serif' }}>
      <BulletinHeader school={school} color={color}
        title={isLycee ? 'BULLETIN DE NOTES — LYCÉE' : 'BULLETIN DE NOTES'}
        subtitle={`${period} — ${school?.academic_year_label || ''}`} />
      <StudentInfo student={student} classroom={classroom}
        extraFields={isLycee ? [{ label:'Filière', value: classroom?.section || '—' }] : []} />

      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'18px', fontSize:'12px' }}>
        <thead>
          <tr style={{ background:color, color:'white' }}>
            {['MATIÈRE', 'COEFF.', 'NOTES OBTENUES', 'MOY./20', 'MOY.×COEFF', 'APPRÉCIATION'].map(h => (
              <th key={h} style={{ padding:'9px 10px', textAlign: h==='MATIÈRE'?'left':'center', fontSize:'10px', fontWeight:'bold' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjectAverages.length === 0
            ? <tr><td colSpan={6} style={{ padding:'20px', textAlign:'center', color:'#94a3b8' }}>Aucune note pour cette période</td></tr>
            : subjectAverages.map((sa, i) => {
              const m = getMention20(sa.avg);
              return (
                <tr key={i} style={{ background: i%2===0 ? '#f8fafc':'white', borderBottom:'1px solid #e2e8f0' }}>
                  <td style={{ padding:'9px 10px', fontWeight:'600', color:'#0f172a' }}>{sa.subject.name}</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', color:'#64748b' }}>{sa.coeff}</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', fontSize:'10px', color:'#64748b' }}>
                    {sa.grades.map(g => `${g.score}/${g.max_score}`).join(' · ')}
                  </td>
                  <td style={{ padding:'9px 10px', textAlign:'center', fontWeight:'bold', fontSize:'14px', color:m.color }}>{sa.avg}</td>
                  <td style={{ padding:'9px 10px', textAlign:'center', color:'#334155' }}>{(sa.avg * sa.coeff).toFixed(2)}</td>
                  <td style={{ padding:'9px 10px', fontSize:'11px', color:m.color, fontWeight:'600' }}>{m.label}</td>
                </tr>
              );
            })
          }
        </tbody>
        <tfoot>
          <tr style={{ background:color, color:'white' }}>
            <td colSpan={3} style={{ padding:'10px', fontWeight:'bold' }}>MOYENNE GÉNÉRALE (Σ coefficients : {totalCoeff})</td>
            <td style={{ padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'16px' }}>{generalAvg !== null ? `${generalAvg}/20` : '—'}</td>
            <td colSpan={2} style={{ padding:'10px', fontWeight:'bold', fontSize:'13px', color:'#fbbf24' }}>{mention.label}</td>
          </tr>
        </tfoot>
      </table>

      {/* Résumé */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:'9px', color:'#16a34a', fontWeight:'bold', textTransform:'uppercase', marginBottom:'4px' }}>Moyenne générale</div>
          <div style={{ fontSize:'24px', fontWeight:'bold', color:'#15803d' }}>{generalAvg !== null ? `${generalAvg}` : '—'}<span style={{ fontSize:'14px' }}>/20</span></div>
          <div style={{ fontSize:'11px', color:mention.color, fontWeight:'bold', marginTop:'2px' }}>{mention.label}</div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px', minHeight:'70px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Appréciation du conseil de classe</div>
          <div style={{ fontSize:'11px', color:'#475569', fontStyle:'italic' }}>
            {generalAvg !== null ? getAppreciationText(generalAvg, 20) : 'À compléter par le professeur principal.'}
          </div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', marginBottom:'6px' }}>Signature du Directeur</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width:'50px', height:'50px', objectFit:'contain', opacity:0.7 }} />}
          <div style={{ marginTop:'18px', borderTop:'1px solid #e2e8f0', paddingTop:'4px', fontSize:'10px', color:'#94a3b8', textAlign:'center' }}>Signature & Cachet</div>
        </div>
      </div>
      <BulletinFooter school={school} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════
   5. BULLETIN SUPÉRIEUR — Crédits / UE / LMD
══════════════════════════════════════════ */
function BulletinSuperieur({ student, classroom, grades, subjects, period, school }) {
  const color = school?.header_color || '#0891b2';
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.id] = s; });

  // Grouper par UE (ue_code)
  const gradesBySubject = {};
  grades.filter(g => g.student_id === student.id && g.trimester === period).forEach(g => {
    if (!gradesBySubject[g.subject_id]) gradesBySubject[g.subject_id] = [];
    gradesBySubject[g.subject_id].push(g);
  });

  const subjectLines = Object.entries(gradesBySubject).map(([sid, sGrades]) => {
    const subj = subjectMap[sid] || { name: 'Matière', coefficient: 1, ue_code: 'UE?' };
    const avg = sGrades.reduce((s, g) => s + (g.score / g.max_score * 20), 0) / sGrades.length;
    const credits = sGrades[0]?.credits || Number(subj.coefficient) || 3;
    const ueCode = sGrades[0]?.ue_code || subj.ue_code || '—';
    const validated = avg >= 10;
    return { subject: subj, avg: parseFloat(avg.toFixed(2)), credits, ueCode, validated, grades: sGrades };
  });

  // Grouper par UE
  const byUE = {};
  subjectLines.forEach(sl => {
    if (!byUE[sl.ueCode]) byUE[sl.ueCode] = [];
    byUE[sl.ueCode].push(sl);
  });

  const totalCredits = subjectLines.reduce((s, sl) => s + sl.credits, 0);
  const validatedCredits = subjectLines.filter(sl => sl.validated).reduce((s, sl) => s + sl.credits, 0);
  const totalWeighted = subjectLines.reduce((s, sl) => s + sl.avg * sl.credits, 0);
  const generalAvg = totalCredits > 0 ? parseFloat((totalWeighted / totalCredits).toFixed(2)) : null;

  return (
    <div id={`bulletin-${student.id}`} style={{ maxWidth:'794px', margin:'0 auto', background:'white', padding:'32px', fontFamily:'Arial, sans-serif' }}>
      <BulletinHeader school={school} color={color} title="RELEVÉ DE NOTES" subtitle={`${period} — Année ${school?.academic_year_label || ''}`} />
      <StudentInfo student={student} classroom={classroom}
        extraFields={[
          { label:'Filière', value: classroom?.level || '—' },
          { label:'Crédits validés', value: `${validatedCredits} / ${totalCredits} ECTS` },
        ]} />

      {/* Par UE */}
      {Object.entries(byUE).length === 0 ? (
        <div style={{ padding:'20px', textAlign:'center', color:'#94a3b8', border:'1px dashed #e2e8f0', borderRadius:'8px', marginBottom:'18px' }}>
          Aucune note enregistrée pour ce semestre.
        </div>
      ) : Object.entries(byUE).map(([ue, lines], ui) => {
        const ueCredits = lines.reduce((s, l) => s + l.credits, 0);
        const ueValidated = lines.every(l => l.validated);
        return (
          <div key={ui} style={{ marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', background:color, color:'white', padding:'7px 12px', borderRadius:'6px 6px 0 0', fontSize:'12px', fontWeight:'bold' }}>
              <span>Unité d'Enseignement : {ue}</span>
              <span style={{ marginLeft:'auto', background: ueValidated?'#059669':'#dc2626', padding:'2px 10px', borderRadius:'20px', fontSize:'10px' }}>
                {ueValidated ? '✓ Validée' : '✗ Non validée'} — {ueCredits} crédits
              </span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', border:`1px solid ${color}30`, borderTop:'none' }}>
              <thead>
                <tr style={{ background:color+'18' }}>
                  <th style={{ padding:'7px 10px', textAlign:'left', fontSize:'10px', color:color }}>MATIÈRE / EC</th>
                  <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'10px', color:color }}>CRÉDITS</th>
                  <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'10px', color:color }}>NOTES</th>
                  <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'10px', color:color }}>MOYENNE</th>
                  <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'10px', color:color }}>RÉSULTAT</th>
                  <th style={{ padding:'7px 10px', textAlign:'center', fontSize:'10px', color:color }}>MENTION</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((sl, li) => {
                  const m = getMention20(sl.avg);
                  return (
                    <tr key={li} style={{ background: li%2===0?'#f8fafc':'white', borderBottom:'1px solid #e2e8f0' }}>
                      <td style={{ padding:'8px 10px', fontWeight:'600', color:'#0f172a' }}>{sl.subject.name}</td>
                      <td style={{ padding:'8px 10px', textAlign:'center', color:'#64748b' }}>{sl.credits} ECTS</td>
                      <td style={{ padding:'8px 10px', textAlign:'center', fontSize:'10px', color:'#64748b' }}>
                        {sl.grades.map(g => `${g.score}/${g.max_score}`).join(' · ')}
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:'bold', fontSize:'14px', color:m.color }}>{sl.avg}/20</td>
                      <td style={{ padding:'8px 10px', textAlign:'center' }}>
                        <span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:'bold',
                          background: sl.validated?'#dcfce7':'#fee2e2', color: sl.validated?'#166534':'#991b1b' }}>
                          {sl.validated ? '✓ Validé' : '✗ Ajourné'}
                        </span>
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'center', fontSize:'11px', color:m.color, fontWeight:'600' }}>{m.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Bilan crédits */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Moyenne générale', value: generalAvg !== null ? `${generalAvg}/20` : '—', bg:'#f0fdf4', border:'#bbf7d0', color:'#15803d' },
          { label:'Crédits obtenus', value: `${validatedCredits} ECTS`, bg:'#eff6ff', border:'#bfdbfe', color:'#1d4ed8' },
          { label:'Crédits totaux', value: `${totalCredits} ECTS`, bg:'#f8fafc', border:'#e2e8f0', color:'#334155' },
          { label:'Taux de validation', value: totalCredits>0 ? `${Math.round(validatedCredits/totalCredits*100)}%` : '—', bg:'#faf5ff', border:'#e9d5ff', color:'#7c3aed' },
        ].map((c, i) => (
          <div key={i} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'8px', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'9px', color:c.color, fontWeight:'bold', textTransform:'uppercase', marginBottom:'4px' }}>{c.label}</div>
            <div style={{ fontSize:'20px', fontWeight:'bold', color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', marginBottom:'6px', textTransform:'uppercase' }}>Décision du jury</div>
          <div style={{ minHeight:'40px', borderBottom:'1px dashed #e2e8f0', marginBottom:'6px' }}></div>
          <div style={{ display:'flex', gap:'16px', fontSize:'11px', color:'#64748b' }}>
            {['Admis(e)', 'Ajourné(e)', 'Redoublement'].map(d => (
              <span key={d}>☐ {d}</span>
            ))}
          </div>
        </div>
        <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', padding:'12px' }}>
          <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:'bold', marginBottom:'6px', textTransform:'uppercase' }}>Cachet & Signature</div>
          {school?.stamp_url && <img src={school.stamp_url} alt="Cachet" style={{ width:'50px', height:'50px', objectFit:'contain', opacity:0.7 }} />}
          <div style={{ marginTop:'14px', borderTop:'1px solid #e2e8f0', paddingTop:'4px', fontSize:'10px', color:'#94a3b8', textAlign:'center' }}>Le Directeur / Doyen</div>
        </div>
      </div>
      <BulletinFooter school={school} color={color} />
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */

const CYCLE_PERIODS = {
  'Crèche':            ['T1 — Période 1', 'T2 — Période 2', 'T3 — Période 3'],
  'Maternelle':        ['T1', 'T2', 'T3'],
  'Primaire':          ['T1', 'T2', 'T3'],
  'Collège':           ['T1', 'T2', 'T3'],
  'Lycée':             ['T1', 'T2', 'T3'],
  'Supérieur':         ['S1', 'S2'],
  'Institut/Université': ['S1', 'S2'],
};

export default function ReportCards() {
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('T1');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sc, s, g, subj, cl] = await Promise.all([
          School.list(), Student.list(), Grade.list(), Subject.list(), Classroom.list()
        ]);
        const activeSchool = sc[0] || null;
        setSchool(activeSchool);
        setStudents(s); setGrades(g); setSubjects(subj); setClassrooms(cl);

        // Déterminer le cycle dominant
        const cycles = activeSchool?.school_cycles || [];
        const dominant = cycles.length === 1 ? cycles[0] : (activeSchool?.school_type || 'Collège');
        setSelectedCycle(dominant);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const allCycles = (school?.school_cycles || [school?.school_type]).filter(Boolean);
  const periods = CYCLE_PERIODS[selectedCycle] || ['T1', 'T2', 'T3'];

  const filtered = students.filter(s => {
    const cl = classrooms.find(c => c.id === s.classroom_id);
    const matchCycle = !selectedCycle || cl?.cycle === selectedCycle || allCycles.length <= 1;
    const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
      || (s.registration_number || '').includes(search);
    return matchSearch && matchCycle;
  });

  function getClassroom(student) {
    return classrooms.find(c => c.id === student.classroom_id) || null;
  }

  function renderBulletin(student) {
    const classroom = getClassroom(student);
    const cycle = classroom?.cycle || selectedCycle || 'Collège';
    const props = { student, classroom, grades, subjects, period: selectedPeriod, school };

    switch (cycle) {
      case 'Crèche':      return <BulletinCreche {...props} />;
      case 'Maternelle':  return <BulletinMaternelle {...props} />;
      case 'Primaire':    return <BulletinPrimaire {...props} />;
      case 'Lycée':       return <BulletinCollege {...props} isLycee={true} />;
      case 'Supérieur':
      case 'Institut/Université': return <BulletinSuperieur {...props} />;
      default:            return <BulletinCollege {...props} isLycee={false} />;
    }
  }

  function handlePrint() {
    const content = document.getElementById(`bulletin-${selectedStudent.id}`);
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Bulletin — ${selectedStudent.first_name} ${selectedStudent.last_name}</title><style>@media print { body { margin: 0; } } @page { size: A4; margin: 10mm; }</style></head><body>${content.outerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 300);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;

  const cycleEmoji = { 'Crèche':'🍼', 'Maternelle':'🌸', 'Primaire':'📚', 'Collège':'🏫', 'Lycée':'🎓', 'Supérieur':'🏛️', 'Institut/Université':'🏛️' };

  return (
    <div className="space-y-4">
      {/* Barre de contrôles */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Sélecteur cycle si multi-cycles */}
          {allCycles.length > 1 && (
            <select value={selectedCycle} onChange={e => { setSelectedCycle(e.target.value); setSelectedPeriod(CYCLE_PERIODS[e.target.value]?.[0] || 'T1'); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium">
              {allCycles.map(c => <option key={c} value={c}>{cycleEmoji[c] || '🏫'} {c}</option>)}
            </select>
          )}

          {/* Sélecteur période */}
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none font-medium">
            {periods.map(p => <option key={p} value={p.split('—')[0].trim()}>{p}</option>)}
          </select>

          {selectedStudent && (
            <div className="flex gap-2">
              <button onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                <Eye size={16} /> Aperçu
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
                <Printer size={16} /> Imprimer / PDF
              </button>
            </div>
          )}
        </div>

        {/* Badge cycle actif */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Type de bulletin :</span>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg font-semibold">
            {cycleEmoji[selectedCycle] || '🏫'} {selectedCycle || 'Collège'} — {selectedPeriod}
          </span>
          {allCycles.length > 1 && <span className="text-gray-400">· Basculez le cycle pour changer de modèle de bulletin</span>}
        </div>
      </div>

      {/* Liste élèves */}
      {!selectedStudent && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-2 bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">📄</div>
              <div>Aucun élève trouvé</div>
            </div>
          )}
          {filtered.map(s => {
            const cl = getClassroom(s);
            const cycle = cl?.cycle || selectedCycle;
            const studentGrades = grades.filter(g => g.student_id === s.id && g.trimester === selectedPeriod);
            return (
              <button key={s.id} onClick={() => setSelectedStudent(s)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all text-left flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{s.last_name} {s.first_name}</div>
                  <div className="text-xs text-gray-500">{cl?.name || '—'} · {s.registration_number || '—'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-indigo-100 text-indigo-700">
                      {cycleEmoji[cycle]} {cycle || 'Collège'}
                    </span>
                    <span className="text-xs text-gray-400">{studentGrades.length} note(s) en {selectedPeriod}</span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-300 -rotate-90 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Vue bulletin sélectionné */}
      {selectedStudent && (
        <div>
          <button onClick={() => setSelectedStudent(null)}
            className="text-sm text-indigo-600 hover:underline mb-4 flex items-center gap-1">
            ← Retour à la liste
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {renderBulletin(selectedStudent)}
          </div>
        </div>
      )}

      {/* Modal aperçu */}
      {showPreview && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-800">
                Bulletin — {selectedStudent.first_name} {selectedStudent.last_name} · {selectedPeriod}
              </span>
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
                  <Printer size={14} /> Imprimer
                </button>
                <button onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
              </div>
            </div>
            <div className="p-4">
              {renderBulletin(selectedStudent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
