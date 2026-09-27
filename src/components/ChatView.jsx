import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  ChevronLeft, 
  CheckCircle2, 
  MapPin, 
  GraduationCap, 
  Phone, 
  Heart,
  Smile,
  ShieldCheck,
  Shield,
  Search,
  MoreVertical,
  UserX,
  Flag,
  User,
  AlertCircle,
  Sparkles,
  X,
  CheckCheck,
  HeartCrack,
  Info
} from 'lucide-react';
import { 
  getMessagesForMatch, 
  sendRealtimeMessage, 
  subscribeToMatchChat 
} from '../services/supabaseService';
import { addNotification } from '../services/notificationManager';

const ICEBREAKERS = [
  "Coffee date this weekend?",
  "What's your major at university?",
  "Favorite late-night hangout spot?",
  "What's your current Spotify anthem?",
  "Are you more introvert or extrovert?"
];

export default function ChatView({ 
  user, 
  matchedUsers = [], 
  onOpenMatchProfile, 
  initialChatUser = null,
  onGoToDeck,
  onUnmatch,
  onActiveChatChange
}) {
  const [activeChatUser, setActiveChatUser] = useState(initialChatUser || null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [blockUserAlso, setBlockUserAlso] = useState(true);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Mobile visual viewport and keyboard height tracking
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return null;
  });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Notify parent of active chat user changes
  useEffect(() => {
    if (onActiveChatChange) {
      onActiveChatChange(activeChatUser);
    }
  }, [activeChatUser, onActiveChatChange]);

  // Sync initialChatUser only when explicitly passed from parent
  useEffect(() => {
    if (initialChatUser) {
      setActiveChatUser(initialChatUser);
    }
  }, [initialChatUser]);

  // Mobile visual viewport listener to prevent keyboard from obscuring input or scrolling header off-screen
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      setViewportHeight(vv.height);

      const isMobile = window.innerWidth < 768;
      const keyboardActive = isMobile && vv.height < (window.innerHeight - 80);
      setIsKeyboardOpen(keyboardActive);

      // Lock document scroll so top header & banner are never pushed off screen
      if (window.scrollY !== 0 || window.pageYOffset !== 0) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [activeChatUser]);

  // Smooth scroll container to bottom without bouncing the window
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatUser]);

  const handleInputFocus = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    setTimeout(() => {
      window.scrollTo(0, 0);
      scrollToBottom();
    }, 70);
    setTimeout(() => {
      window.scrollTo(0, 0);
      scrollToBottom();
    }, 220);
  };

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Compute unique channel ID for this pair
  const getMatchChannelId = (u1Id, u2Id) => {
    if (!u1Id || !u2Id) return 'general';
    return [String(u1Id), String(u2Id)].sort().join('_');
  };

  // Realtime Supabase Chat Sync
  useEffect(() => {
    if (!activeChatUser || !user) return;

    const channelId = getMatchChannelId(user.id, activeChatUser.id);

    // 1. Load initial cloud messages
    getMessagesForMatch(channelId).then((cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        const formatted = cloudMsgs.map(m => ({
          id: m.id || m.created_at,
          sender: m.sender_id === user.id ? 'me' : 'them',
          text: m.text,
          time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(prev => ({
          ...prev,
          [activeChatUser.id]: formatted
        }));
      } else {
        // Default warm greetings
        setMessages(prev => {
          if (prev[activeChatUser.id] && prev[activeChatUser.id].length > 0) return prev;
          return {
            ...prev,
            [activeChatUser.id]: [
              { 
                id: 'welcome_1', 
                sender: 'them', 
                text: `Hey ${(user.name || '').split(' ')[0]}! We matched on Cupid's ${user.state || 'Delhi NCR'} round ✨`, 
                time: 'Just now' 
              },
              {
                id: 'welcome_2',
                sender: 'them',
                text: "Love your vibe! What are you studying on campus?",
                time: 'Just now'
              }
            ]
          };
        });
      }
    }).catch(() => {});

    // 2. Subscribe to realtime messages from Supabase
    const sub = subscribeToMatchChat(channelId, (newMsg) => {
      if (newMsg && newMsg.sender_id !== user.id) {
        setMessages(prev => ({
          ...prev,
          [activeChatUser.id]: [
            ...(prev[activeChatUser.id] || []),
            {
              id: newMsg.id || Date.now(),
              sender: 'them',
              text: newMsg.text,
              time: 'Just now'
            }
          ]
        }));
      }
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    };
  }, [activeChatUser?.id, user?.id]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !activeChatUser || !user) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text,
      time: timeStr
    };

    // Optimistic update
    setMessages(prev => ({
      ...prev,
      [activeChatUser.id]: [...(prev[activeChatUser.id] || []), newMsg]
    }));
    setInputMessage('');

    // Keep mobile keyboard open! Never blur on send
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    // Sync to Supabase cloud
    const channelId = getMatchChannelId(user.id, activeChatUser.id);
    sendRealtimeMessage(channelId, user.id, text).catch(() => {});

    // Simulated partner response if no other replies yet
    setTimeout(() => {
      const cuteReplies = [
        "Haha totally! Let's definitely grab coffee around campus ☕",
        "That's so awesome! What year are you in?",
        "Omg yes! Blue Tokai or campus canteen anytime ✨",
        "Aww that made my day! Check out my Instagram too!"
      ];
      const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
      setMessages(prev => ({
        ...prev,
        [activeChatUser.id]: [
          ...(prev[activeChatUser.id] || []),
          {
            id: `reply_${Date.now()}`,
            sender: 'them',
            text: reply,
            time: 'Just now'
          }
        ]
      }));
    }, 1400);

    // Send push notification to partner
    addNotification(activeChatUser.id, {
      type: 'chat',
      title: `New message from ${(user.name || '').split(' ')[0]}`,
      message: text.length > 40 ? text.substring(0, 37) + '...' : text,
      actionUrl: 'chat'
    });
  };

  // Unmatch confirmation action
  const confirmUnmatch = () => {
    if (!activeChatUser) return;
    const partnerName = activeChatUser.name;
    const partnerId = activeChatUser.id;

    if (typeof onUnmatch === 'function') {
      onUnmatch(partnerId);
    }

    setShowUnmatchModal(false);
    setShowMenu(false);
    setActiveChatUser(null);
    if (onActiveChatChange) onActiveChatChange(null);
    showToast(`Unmatched with ${partnerName}`);
  };

  // Submit Report & Block
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!activeChatUser) return;
    const partnerName = activeChatUser.name;
    const partnerId = activeChatUser.id;

    // Log report to notifications for admin review
    addNotification('admin_master', {
      type: 'report',
      title: `User Reported: ${partnerName}`,
      message: `Reported by ${user.name} for: "${reportReason}". Details: "${reportDetails || 'None'}". Profile ID: ${partnerId}`,
      actionUrl: 'admin'
    });

    setReportSubmitted(true);

    setTimeout(() => {
      setReportSubmitted(false);
      setShowReportModal(false);
      setShowMenu(false);

      if (blockUserAlso && typeof onUnmatch === 'function') {
        onUnmatch(partnerId);
      }

      setActiveChatUser(null);
      if (onActiveChatChange) onActiveChatChange(null);
      showToast(`Report received. ${partnerName} has been blocked.`);
    }, 1200);
  };

  const filteredMatches = matchedUsers.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.university || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = activeChatUser ? (messages[activeChatUser.id] || []) : [];

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: ACTIVE DIRECT CHAT WINDOW (FLUID, ZERO BOTTOM GAP, SAAS LEVEL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeChatUser) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
      <div 
        className="fixed md:absolute inset-0 z-50 flex flex-col bg-[#FFF5F8] overflow-hidden select-none md:rounded-[44px]"
        style={{
          height: (isMobile && viewportHeight) ? `${viewportHeight}px` : '100%',
          maxHeight: (isMobile && viewportHeight) ? `${viewportHeight}px` : '100%',
          top: 0,
          left: 0,
          right: 0,
          bottom: 'auto'
        }}
      >
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-white/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Top Header (Glassmorphic, Sticky, SaaS Quality) */}
        <div className="pt-[max(0.75rem,env(safe-area-inset-top))] px-3 pb-2.5 bg-white/95 backdrop-blur-xl border-b border-pink-100 flex items-center justify-between z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveChatUser(null);
                if (onActiveChatChange) onActiveChatChange(null);
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              title="Back to Matches"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div 
              onClick={() => onOpenMatchProfile && onOpenMatchProfile(activeChatUser)}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF2E79] cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="View Profile"
            >
              <img src={activeChatUser.avatar} alt={activeChatUser.name} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>

            <div className="leading-tight text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 font-display">
                  {activeChatUser.name.split(' ')[0]}, {activeChatUser.age || 22}
                </span>
                <span className="text-[9px] bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.2 rounded-full font-black">
                  Matched
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold truncate block max-w-[140px]">
                {activeChatUser.university || activeChatUser.state || 'Bennett University'}
              </span>
            </div>
          </div>

          {/* Right Header Options (Safety & Kebab Menu) */}
          <div className="flex items-center gap-1.5 relative">
            <button
              onClick={() => setShowReportModal(true)}
              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer"
              title="Safety & Report"
            >
              <Shield className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-pink-100 py-1.5 z-50 text-left animate-scale-in">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onOpenMatchProfile) onOpenMatchProfile(activeChatUser);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-[#FF2E79] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Full Profile</span>
                </button>

                {activeChatUser.contact && (
                  <div className="px-3.5 py-1.5 border-y border-slate-50 text-[10.5px] font-bold text-[#FF2E79] bg-pink-50/50">
                    <span className="block text-[9px] text-slate-400 uppercase font-black">Social Contact</span>
                    <span>{activeChatUser.contact}</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowUnmatchModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserX className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unmatch User</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-500" />
                  <span>Report & Block</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mutual Connection Verified Banner */}
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-b border-pink-100/80 flex items-center justify-between text-[11px] select-none shrink-0">
          <span className="font-bold text-slate-700 truncate flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF2E79]" />
            <span>Connection: <strong className="text-[#FF2E79]">Mutual Yes Match</strong></span>
          </span>
          <span className="text-[10px] font-black text-rose-600 shrink-0">
            {activeChatUser.contact ? activeChatUser.contact : 'Verified Profile'}
          </span>
        </div>

        {/* Message Stream (Contained Scrolling, No Parent Bounce) */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 min-h-0 p-3.5 space-y-3 overflow-y-auto overscroll-contain no-scrollbar"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 bg-pink-100 text-[#FF2E79] rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Heart className="w-6 h-6 fill-current animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-700">Say hi to {activeChatUser.name.split(' ')[0]}!</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs leading-relaxed">
                Break the ice with one of the prompt chips below or send your first message.
              </p>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                    msg.sender === 'me'
                      ? 'bg-gradient-to-r from-[#FF2E79] to-[#FF4B8B] text-white rounded-br-xs shadow-pink-200'
                      : 'bg-white text-slate-800 border border-pink-100/90 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[9px] text-slate-400 font-semibold">{msg.time}</span>
                  {msg.sender === 'me' && (
                    <CheckCheck className="w-3 h-3 text-[#FF2E79]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Icebreakers Carousel (Quick Tap Replies) */}
        <div className="px-3 py-2 bg-white/90 backdrop-blur-md border-t border-pink-100/70 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <Heart className="w-3.5 h-3.5 text-[#FF2E79] fill-[#FF2E79] shrink-0" />
          {ICEBREAKERS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                handleSendMessage(prompt);
              }}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full bg-pink-50 hover:bg-pink-100 active:scale-95 text-[#FF2E79] text-[10.5px] font-bold shrink-0 transition-all border border-pink-200/60 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Message Input (Flush Bottom, Sits Directly Above Keyboard) */}
        <div className={`p-2.5 ${isKeyboardOpen ? 'pb-2.5' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'} bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center gap-2 shrink-0 z-20 shadow-md`}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Message ${activeChatUser.name.split(' ')[0]}...`}
            className="flex-1 h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-full font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#FF2E79] focus:bg-white transition-all shadow-inner"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="w-10 h-10 rounded-full bg-[#FF2E79] hover:bg-[#e02447] active:scale-90 text-white flex items-center justify-center shadow-md shadow-pink-200 transition-all disabled:opacity-40 cursor-pointer shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* ─── UNMATCH CONFIRMATION MODAL ─── */}
        {showUnmatchModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[28px] p-5 w-full max-w-xs shadow-2xl border border-pink-100 space-y-3.5 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto">
                <HeartCrack className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 font-display">
                  Unmatch with {activeChatUser.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This will remove {activeChatUser.name} from your matches and delete your conversation history permanently.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUnmatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmUnmatch}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer"
                >
                  Yes, Unmatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── REPORT & SAFETY MODAL ─── */}
        {showReportModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[28px] p-5 w-full max-w-xs shadow-2xl border border-pink-100 space-y-3 text-left">
              {reportSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 font-display">Report Submitted</h3>
                  <p className="text-xs text-slate-500">
                    Thank you for keeping Cupid safe. The user has been blocked and our safety team has been alerted.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 font-display">
                      <Flag className="w-4 h-4 text-rose-500" />
                      <span>Report {activeChatUser.name}</span>
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowReportModal(false)} 
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Why are you reporting this profile?
                  </p>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                    {[
                      { id: 'inappropriate', label: 'Inappropriate or vulgar messages' },
                      { id: 'fake_profile', label: 'Fake, bot or misleading photos' },
                      { id: 'harassment', label: 'Harassment, stalking or threats' },
                      { id: 'scam', label: 'Commercial spam or asking for money' },
                      { id: 'underage', label: 'Safety concern or underage profile' },
                      { id: 'other', label: 'Other violation' }
                    ].map(r => (
                      <label 
                        key={r.id} 
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          reportReason === r.id ? 'border-[#FF2E79] bg-pink-50/60 text-slate-900' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="reportReason" 
                          value={r.id} 
                          checked={reportReason === r.id}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="accent-[#FF2E79]"
                        />
                        <span className="text-[11px]">{r.label}</span>
                      </label>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Details or context (optional)..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF2E79] placeholder:text-slate-400 resize-none font-medium"
                  />

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={blockUserAlso}
                      onChange={(e) => setBlockUserAlso(e.target.checked)}
                      className="accent-[#FF2E79] rounded w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">Also block this user immediately</span>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer"
                    >
                      Submit & Block
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: MATCHES & ACTIVE CONVERSATIONS LIST
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col h-full bg-[#FFF5F8] relative select-none p-4 pb-24 overflow-y-auto overscroll-contain">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-white/20 max-w-sm mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-3">
        <div>
          <h2 className="font-display text-base font-black text-slate-900">Matches & Messages</h2>
          <p className="text-[11px] text-slate-500 font-medium">Direct chats from your mutual round matches</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-pink-100 text-[#FF2E79] text-xs font-black border border-pink-200 shadow-2xs">
          {matchedUsers.length} Matches
        </span>
      </div>

      {/* Empty State: No Matches Yet */}
      {matchedUsers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-[#FF2E79] flex items-center justify-center mb-3 shadow-inner">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h3 className="text-base font-black text-slate-900 font-display">No Matches Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
            Swipe right on candidate profiles in the Home deck to create mutual matches!
          </p>
          {onGoToDeck && (
            <button
              onClick={onGoToDeck}
              className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E79] to-rose-500 text-white font-extrabold text-xs shadow-md shadow-pink-300 active:scale-95 transition-all cursor-pointer"
            >
              Go to Swipe Deck
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top Stories Row: New Mutual Matches */}
          <div className="mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
              Mutual Matches ({matchedUsers.length})
            </span>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {matchedUsers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveChatUser(m);
                    if (onActiveChatChange) onActiveChatChange(m);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
                >
                  <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2E79] to-pink-500 shadow-md ring-2 ring-white group-hover:scale-105 transition-transform">
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover rounded-full" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 max-w-[65px] truncate text-center">
                    {m.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches or university..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-pink-100 rounded-xl placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-[#FF2E79] shadow-2xs"
            />
          </div>

          {/* Conversations List */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Active Conversations
            </span>

            {filteredMatches.map((m) => {
              const chatMsgs = messages[m.id] || [];
              const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveChatUser(m);
                    if (onActiveChatChange) onActiveChatChange(m);
                  }}
                  className="p-3 bg-white hover:bg-pink-50/60 rounded-2xl border border-pink-100/70 shadow-2xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-300 shrink-0">
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900 font-display">
                          {m.name}
                        </h4>
                        <span className="text-[8px] bg-pink-100 text-[#FF2E79] px-1.5 py-0.2 rounded-full font-bold">
                          {m.university ? m.university.split(' ')[0] : 'Delhi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px] mt-0.5">
                        {lastMsg ? lastMsg.text : 'Tap to start conversation...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold">
                      {lastMsg ? lastMsg.time : 'Just now'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#FF2E79]"></span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
