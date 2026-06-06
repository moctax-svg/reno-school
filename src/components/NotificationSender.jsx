import React, { useState } from 'react';
import { Send, MessageCircle, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Notification } from '../api/entities';

// WhatsApp Web API (click-to-chat)
function sendWhatsApp(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  window.open(url, '_blank');
}

// SMS via tel: protocol (mobile) or SMS gateway
function sendSMS(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  window.open(`sms:${cleanPhone}?body=${encodedMsg}`, '_blank');
}

export default function NotificationSender({ students, onClose, type = 'General', prefillMessage = '' }) {
  const [channel, setChannel] = useState('WhatsApp');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState(prefillMessage);
  const [title, setTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const [step, setStep] = useState('compose'); // compose | sending | done

  const channels = [
    { id: 'WhatsApp', icon: '💬', label: 'WhatsApp', color: 'bg-green-500' },
    { id: 'SMS', icon: '📱', label: 'SMS', color: 'bg-blue-500' },
    { id: 'Email', icon: '📧', label: 'Email', color: 'bg-indigo-500' },
  ];

  function toggleStudent(studentId) {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  }

  function selectAll() {
    setSelectedStudents(students.map(s => s.id));
  }

  async function handleSend() {
    if (!message.trim()) { alert('Veuillez saisir un message.'); return; }
    if (selectedStudents.length === 0) { alert('Veuillez sélectionner au moins un destinataire.'); return; }

    setSending(true);
    setStep('sending');
    const res = [];

    for (const studentId of selectedStudents) {
      const student = students.find(s => s.id === studentId);
      if (!student) continue;

      const fullMessage = message.replace('{nom}', `${student.first_name} ${student.last_name}`);
      const sent = { student, status: 'sent', channel };

      try {
        // Save notification to DB
        await Notification.create({
          student_id: student.id,
          parent_name: student.parent_name,
          parent_email: student.parent_email,
          parent_phone: student.parent_phone,
          type,
          title: title || `Notification — ${student.first_name} ${student.last_name}`,
          message: fullMessage,
          channel,
          status: 'Sent',
          sent_at: new Date().toISOString(),
        });

        // Open channel
        if (channel === 'WhatsApp' && student.parent_phone) {
          sendWhatsApp(student.parent_phone, fullMessage);
        } else if (channel === 'SMS' && student.parent_phone) {
          sendSMS(student.parent_phone, fullMessage);
        } else if (channel === 'Email' && student.parent_email) {
          window.open(`mailto:${student.parent_email}?subject=${encodeURIComponent(title || 'Message de l\'école')}&body=${encodeURIComponent(fullMessage)}`, '_blank');
        }

        res.push({ ...sent, status: 'sent' });
      } catch (e) {
        res.push({ ...sent, status: 'error', error: e.message });
      }

      // Small delay between sends
      await new Promise(r => setTimeout(r, 300));
    }

    setResults(res);
    setSending(false);
    setStep('done');
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Send size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Envoyer une notification</h3>
              <p className="text-xs text-gray-400">Contacter les parents directement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'compose' && (
            <div className="space-y-5">
              {/* Channel selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Canal d'envoi</label>
                <div className="grid grid-cols-3 gap-3">
                  {channels.map(c => (
                    <button key={c.id} onClick={() => setChannel(c.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${channel === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-xl">{c.icon}</span>
                      <span className={`font-medium text-sm ${channel === c.id ? 'text-indigo-700' : 'text-gray-600'}`}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titre (optionnel)</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Absence signalée" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  placeholder="Écrivez votre message ici... Utilisez {nom} pour insérer le nom de l'élève."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1">💡 Utilisez <code className="bg-gray-100 px-1 rounded">{'{nom}'}</code> pour personnaliser avec le nom de l'élève</p>
              </div>

              {/* Destinataires */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinataires ({selectedStudents.length}/{students.length})</label>
                  <button onClick={selectAll} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Tous sélectionner</button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded w-4 h-4 text-indigo-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-3">
                          {s.parent_name && <span>👤 {s.parent_name}</span>}
                          {s.parent_phone && <span>📱 {s.parent_phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {s.parent_phone && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">📱</span>}
                        {s.parent_email && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">📧</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-700 text-lg">Envoi en cours...</p>
              <p className="text-gray-400 text-sm mt-1">Préparation des notifications via {channel}</p>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Notifications envoyées !</h3>
                <p className="text-gray-400 text-sm">{results.filter(r => r.status === 'sent').length} sur {results.length} envoyées avec succès</p>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.status === 'sent' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${r.status === 'sent' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {r.status === 'sent' ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{r.student.first_name} {r.student.last_name}</div>
                      <div className="text-xs text-gray-400">{r.student.parent_name} · {r.channel}</div>
                    </div>
                    <span className={`text-xs font-medium ${r.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                      {r.status === 'sent' ? '✅ Envoyé' : '❌ Erreur'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          {step === 'compose' && (
            <div className="flex gap-3">
              <button onClick={handleSend} disabled={selectedStudents.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Send size={18} /> Envoyer via {channel} ({selectedStudents.length})
              </button>
              <button onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Annuler</button>
            </div>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
