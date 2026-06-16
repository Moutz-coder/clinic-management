import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { conversationAPI, appointmentAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { MessageCircle, Send, ImagePlus, ArrowRight, CheckCircle2, CalendarCheck } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

export default function ChatPage({ basePath = '/patient/chat' }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const loadConversations = () => {
    conversationAPI.getAll()
      .then(({ data }) => setConversations(data.data || []))
      .catch(() => {});
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await conversationAPI.getMessages(id);
        setMessages(data.data);
        loadConversations();
      } catch {
        toast.error('فشل تحميل الرسائل');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getConvName = (conv) => {
    if (user?.role === 'patient') return conv.clinicId?.name || 'عيادة';
    return conv.patientId?.userId?.name || 'مريض';
  };

  const send = async (withImage = false) => {
    if (!text.trim() && !withImage) return;
    setSending(true);
    try {
      let payload;
      if (withImage && fileRef.current?.files[0]) {
        payload = new FormData();
        payload.append('message', text);
        payload.append('image', fileRef.current.files[0]);
      } else {
        payload = { message: text };
      }
      await conversationAPI.sendMessage(id, payload);
      setText('');
      if (fileRef.current) fileRef.current.value = '';
      const { data } = await conversationAPI.getMessages(id);
      setMessages(data.data);
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const confirmFromChat = async (appointmentId) => {
    const aptId = appointmentId?._id || appointmentId;
    setConfirming(aptId);
    try {
      await appointmentAPI.confirm(aptId);
      toast.success('تم تأكيد الموعد بنجاح');
      const { data } = await conversationAPI.getMessages(id);
      setMessages(data.data);
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التأكيد');
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className={`w-full sm:w-80 border-l border-slate-100 flex flex-col bg-slate-50/50 ${id ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-600" /> المحادثات
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">لا توجد محادثات</p>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv._id}
                to={`${basePath}/${conv._id}`}
                className={`block p-4 border-b border-slate-100 hover:bg-white transition-colors ${id === conv._id ? 'bg-white border-r-4 border-r-primary-600' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800 truncate">{getConvName(conv)}</p>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(conv.lastMessageAt)}</p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!id ? 'hidden sm:flex' : 'flex'}`}>
        {!id ? (
          <EmptyState icon={MessageCircle} title="اختر محادثة" description="اختر محادثة من القائمة للبدء" />
        ) : loading ? (
          <LoadingSpinner className="flex-1" size="lg" />
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
              <Link to={basePath} className="sm:hidden p-1 text-slate-500"><ArrowRight className="w-5 h-5" /></Link>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-bold text-slate-800">{getConvName(conversations.find((c) => c._id === id) || {})}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {messages.map((msg) => {
                const isMine = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                const isConfirmedMsg = msg.type === 'appointment_confirmed';

                if (msg.type === 'appointment_confirmation') {
                  const aptStatus = msg.appointmentId?.status;
                  if (aptStatus && aptStatus !== 'pending_confirmation') {
                    return (
                      <div key={msg._id} className="flex justify-center">
                        <div className="max-w-sm bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 opacity-75">
                          <p className="text-sm text-slate-500 whitespace-pre-line line-through">{msg.message}</p>
                          <p className="text-xs text-slate-400 mt-2 text-center">
                            {aptStatus === 'booked' ? '✓ تم التأكيد' : '— انتهى'}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (user?.role === 'patient') {
                    return (
                      <div key={msg._id} className="flex justify-center">
                        <div className="max-w-sm w-full bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarCheck className="w-5 h-5 text-amber-600" />
                            <span className="font-bold text-slate-800 text-sm">طلب تأكيد موعد</span>
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{msg.message}</p>
                          <button
                            type="button"
                            disabled={confirming === (msg.appointmentId?._id || msg.appointmentId)}
                            onClick={() => confirmFromChat(msg.appointmentId)}
                            className="mt-4 w-full py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
                          >
                            {confirming === (msg.appointmentId?._id || msg.appointmentId) ? 'جاري التأكيد...' : '✓ تأكيد الموعد'}
                          </button>
                          <p className="text-xs text-slate-400 mt-3 text-center">{formatDateTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  }
                }

                if (isConfirmedMsg) {
                  return (
                    <div key={msg._id} className="flex justify-center">
                      <div className="max-w-sm bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-bold text-green-800 text-sm">تم التأكيد</span>
                        </div>
                        <p className="text-sm text-green-700 whitespace-pre-line">{msg.message}</p>
                        <p className="text-xs text-green-500/70 mt-2">{formatDateTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-md'}`}>
                      {msg.imageUrl && <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-w-full max-h-48" />}
                      {msg.message && <p className="text-sm whitespace-pre-line leading-relaxed">{msg.message}</p>}
                      <p className={`text-xs mt-1.5 ${isMine ? 'text-primary-200' : 'text-slate-400'}`}>{formatDateTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={() => send(true)} />
              <button onClick={() => fileRef.current?.click()} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                <ImagePlus className="w-5 h-5" />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 outline-none"
              />
              <button onClick={() => send()} disabled={sending} className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
