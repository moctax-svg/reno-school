import React, { useState, useEffect, useRef } from 'react';
import { Message, Teacher, Student } from '../api/entities';
import { Send, Search, Plus, AlertCircle, Clock, ChevronRight, X } from 'lucide-react';

/**
 * Messagerie interne réutilisable
 * Props:
 *   currentRole: 'parent' | 'teacher' | 'admin'
 *   currentName: string
 *   accentColor: string (tailwind gradient classes, ex: 'from-blue-500 to-indigo-600')
 */
export default function Messagerie({ currentRole = 'parent', currentName = 'Utilisateur', accentColor = 'from-indigo-500 to-violet-600' }) {
  const [threads, setThreads] = useState([]);       // list of "thread heads"
  const [allMessages, setAllMessages] = useState([]); // all messages fetched
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState({
    recipient_role: currentRole === 'parent' ? 'teacher' : 'parent',
    recipient_id: '',
    student_id: '',
    subject: '',
    body: '',
    priority: 'Normal',
  });
  const messagesEndRef = useRef(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedThread) scrollBottom(); }, [selectedThread, allMessages]);

  async function load() {
    setLoading(true);
    try {
      const [msgs, t, s] = await Promise.all([Message.list(), Teacher.list(), Student.list()]);
      setAllMessages(msgs);
      setTeachers(t);
      setStudents(s);
      buildThreads(msgs);
    } catch (e) {}
    setLoading(false);
  }

  function buildThreads(msgs) {
    // Group by thread_id; thread head = first message in each group
    const map = {};
    msgs.forEach(m => {
      const tid = m.thread_id || m.id;
      if (!map[tid]) map[tid] = [];
      map[tid].push(m);
    });
    const threadList = Object.entries(map).map(([tid, msgs]) => {
      const sorted = [...msgs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const last = sorted[sorted.length - 1];
      const unread = msgs.filter(m => !m.is_read && m.sender_role !== currentRole).length;
      return { tid, head: sorted[0], last, msgs: sorted, unread, count: msgs.length };
    }).sort((a, b) => new Date(b.last.created_date) - new Date(a.last.created_date));
    setThreads(threadList);
  }

  function scrollBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function markRead(tid) {
    const toMark = allMessages.filter(m => m.thread_id === tid && !m.is_read && m.sender_role !== currentRole);
    await Promise.all(toMark.map(m => Message.update(m.id, { is_read: true })));
    setAllMessages(prev => prev.map(m => toMark.find(x => x.id === m.id) ? { ...m, is_read: true } : m));
    buildThreads(allMessages.map(m => toMark.find(x => x.id === m.id) ? { ...m, is_read: true } : m));
  }

  async function selectThread(thread) {
    setSelectedThread(thread);
    await markRead(thread.tid);
  }

  async function sendReply() {
    if (!replyBody.trim() || !selectedThread) return;
    setSending(true);
    const recipientMsg = selectedThread.msgs.find(m => m.sender_role !== currentRole);
    try {
      const newMsg = await Message.create({
        sender_role: currentRole,
        sender_name: currentName,
        recipient_role: recipientMsg?.sender_role || 'teacher',
        recipient_name: recipientMsg?.sender_name || '',
        student_id: selectedThread.head.student_id,
        student_name: selectedThread.head.student_name,
        subject: selectedThread.head.subject,
        body: replyBody.trim(),
        thread_id: selectedThread.tid,
        is_read: false,
        priority: 'Normal',
      });
      const updated = [...allMessages, newMsg];
      setAllMessages(updated);
      buildThreads(updated);
      setReplyBody('');
      // Update selectedThread
      setSelectedThread(prev => ({
        ...prev,
        msgs: [...prev.msgs, newMsg],
        last: newMsg,
      }));
    } catch (e) { alert(e.message); }
    setSending(false);
  }

  async function sendCompose() {
    if (!compose.subject.trim() || !compose.body.trim()) { alert('Objet et message requis.'); return; }
    setSending(true);
    try {
      const recipient = compose.recipient_role === 'teacher'
        ? teachers.find(t => t.id === compose.recipient_id)
        : null;
      const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : compose.recipient_name || '';
      const student = students.find(s => s.id === compose.student_id);
      const studentName = student ? `${student.first_name} ${student.last_name}` : '';
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const newMsg = await Message.create({
        sender_role: currentRole,
        sender_name: currentName,
        recipient_role: compose.recipient_role,
        recipient_id: compose.recipient_id,
        recipient_name: recipientName,
        student_id: compose.student_id,
        student_name: studentName,
        subject: compose.subject.trim(),
        body: compose.body.trim(),
        thread_id: threadId,
        is_read: false,
        priority: compose.priority,
      });
      const updated = [...allMessages, newMsg];
      setAllMessages(updated);
      buildThreads(updated);
      setShowCompose(false);
      setCompose({ recipient_role: currentRole === 'parent' ? 'teacher' : 'parent', recipient_id: '', student_id: '', subject: '', body: '', priority: 'Normal' });
    } catch (e) { alert(e.message); }
    setSending(false);
  }

  const filteredThreads = threads.filter(t =>
    t.head.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.head.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.head.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  function timeAgo(d) {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  function avatarLetters(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
  }

  const ROLE_LABELS = { parent: 'Parent', teacher: 'Professeur', admin: 'Administration' };

  return (
    <div className="flex h-full gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: 520 }}>
      {/* ─── Sidebar: liste des conversations ─── */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${accentColor} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-bold">Messagerie</div>
              <div className="text-white/70 text-xs">{totalUnread > 0 ? `${totalUnread} non lu(s)` : 'Tous lus'}</div>
            </div>
            <button onClick={() => setShowCompose(true)}
              className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all" title="Nouveau message">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-8 pr-3 py-2 bg-white/20 rounded-xl text-white text-xs placeholder-white/60 focus:outline-none focus:bg-white/30" />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Chargement...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-gray-400 text-sm font-medium">Aucun message</p>
              <p className="text-gray-300 text-xs mt-1">Commencez une conversation</p>
            </div>
          ) : (
            filteredThreads.map(t => {
              const isSelected = selectedThread?.tid === t.tid;
              const senderName = t.last.sender_role !== currentRole ? t.last.sender_name : `Vous`;
              return (
                <button key={t.tid} onClick={() => selectThread(t)}
                  className={`w-full text-left p-4 transition-all hover:bg-gray-50 ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : t.unread > 0 ? 'bg-blue-50/40' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br ${accentColor} text-white`}>
                      {avatarLetters(t.last.sender_role !== currentRole ? t.last.sender_name : t.last.recipient_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-${t.unread > 0 ? 'bold' : 'medium'} text-gray-800 truncate`}>
                          {t.last.sender_role !== currentRole ? t.last.sender_name : t.last.recipient_name || 'Destinataire'}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{timeAgo(t.last.created_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {t.head.priority === 'Urgent' && <span className="text-red-500 text-xs">🔴</span>}
                        <span className={`text-xs truncate ${t.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{t.head.subject}</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{t.last.body?.substring(0, 50)}...</div>
                    </div>
                    {t.unread > 0 && (
                      <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{t.unread}</span>
                    )}
                  </div>
                  {t.head.student_name && (
                    <div className="mt-1.5 ml-13 pl-13">
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg ml-12">🎒 {t.head.student_name}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Main: conversation ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Messagerie interne</h3>
            <p className="text-gray-400 text-sm max-w-xs">Communiquez directement avec les professeurs et les parents concernant vos élèves.</p>
            <button onClick={() => setShowCompose(true)}
              className={`mt-6 flex items-center gap-2 bg-gradient-to-r ${accentColor} text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90`}>
              <Plus size={16} /> Nouveau message
            </button>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-3 bg-white">
              <button onClick={() => setSelectedThread(null)} className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                ←
              </button>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentColor} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                {avatarLetters(selectedThread.last.sender_role !== currentRole ? selectedThread.last.sender_name : selectedThread.last.recipient_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm">{selectedThread.head.subject}</div>
                <div className="text-xs text-gray-400">
                  {selectedThread.last.sender_role !== currentRole ? selectedThread.last.sender_name : selectedThread.last.recipient_name}
                  {selectedThread.head.student_name && <span className="ml-2 text-green-600">🎒 {selectedThread.head.student_name}</span>}
                  <span className="mx-1">·</span>
                  {selectedThread.count} message(s)
                  {selectedThread.head.priority === 'Urgent' && <span className="ml-2 text-red-500 font-bold">🔴 Urgent</span>}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedThread.msgs.map(msg => {
                const isMe = msg.sender_role === currentRole;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isMe ? `bg-gradient-to-br ${accentColor} text-white` : 'bg-gray-100 text-gray-600'}`}>
                      {avatarLetters(msg.sender_name)}
                    </div>
                    <div className={`max-w-xs md:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        {msg.body}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-xs text-gray-400">{isMe ? 'Vous' : msg.sender_name}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{timeAgo(msg.created_date)}</span>
                        {isMe && msg.is_read && <span className="text-xs text-indigo-400">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <div className="flex items-end gap-3">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Votre réponse... (Entrée pour envoyer)"
                  rows={2}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
                <button onClick={sendReply} disabled={sending || !replyBody.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${sending || !replyBody.trim() ? 'bg-gray-200 text-gray-400' : `bg-gradient-to-br ${accentColor} text-white hover:opacity-90 shadow-md`}`}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Modal: Nouveau message ─── */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${accentColor} rounded-xl flex items-center justify-center text-white`}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Nouveau message</h3>
                  <p className="text-xs text-gray-400">Envoyer une communication interne</p>
                </div>
              </div>
              <button onClick={() => setShowCompose(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destinataire</label>
                  <select value={compose.recipient_role} onChange={e => setCompose({ ...compose, recipient_role: e.target.value, recipient_id: '' })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    {currentRole !== 'teacher' && <option value="teacher">Professeur</option>}
                    {currentRole !== 'parent' && <option value="parent">Parent</option>}
                    {currentRole !== 'admin' && <option value="admin">Administration</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {compose.recipient_role === 'teacher' ? 'Choisir le professeur' : 'Nom du destinataire'}
                  </label>
                  {compose.recipient_role === 'teacher' ? (
                    <select value={compose.recipient_id} onChange={e => setCompose({ ...compose, recipient_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                      <option value="">— Choisir —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.subject || ''}</option>)}
                    </select>
                  ) : (
                    <input value={compose.recipient_name || ''} onChange={e => setCompose({ ...compose, recipient_name: e.target.value })}
                      placeholder="Nom..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                  )}
                </div>
              </div>

              {students.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Élève concerné (optionnel)</label>
                  <select value={compose.student_id} onChange={e => setCompose({ ...compose, student_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option value="">— Aucun —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Objet *</label>
                  <input value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })}
                    placeholder="Ex: Résultats du trimestre, Absence..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priorité</label>
                  <select value={compose.priority} onChange={e => setCompose({ ...compose, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none">
                    <option>Normal</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message *</label>
                <textarea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })}
                  placeholder="Rédigez votre message..." rows={5}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={sendCompose} disabled={sending}
                className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-60`}>
                <Send size={16} /> {sending ? 'Envoi...' : 'Envoyer le message'}
              </button>
              <button onClick={() => setShowCompose(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
