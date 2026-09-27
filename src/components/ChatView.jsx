import React, { useState, useEffect, useRef } from 'react';
import { 
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
  X,
  CheckCheck,
  HeartCrack,
  Image as ImageIcon,
  Plus,
  Volume2,
  PhoneOff,
  Music,
  ChevronRight
} from 'lucide-react';
import { 
  getMessagesForMatch, 
  sendRealtimeMessage, 
  subscribeToMatchChat 
} from '../services/supabaseService';
import { addNotification } from '../services/notificationManager';

const ICEBREAKERS = [
  { emoji: '☕', text: "Coffee date this weekend?" },
  { emoji: '🎓', text: "What's your major at university?" },
  { emoji: '🥂', text: "Let's plan something fun!" },
  { emoji: '🎵', text: "What's your current Spotify anthem?" },
  { emoji: '📍', text: "Favorite late-night hangout spot?" }
];

const CUTE_STICKERS = [
  { emoji: '☕', label: 'Coffee date?', tag: 'Date' },
  { emoji: '💖', label: 'Total Vibe', tag: 'Love' },
  { emoji: '🌸', label: "You're Cute", tag: 'Flirt' },
  { emoji: '🥂', label: 'Cheers to us', tag: 'Fun' },
  { emoji: '🦋', label: 'Butterflies', tag: 'Love' },
  { emoji: '🍦', label: 'Ice cream run?', tag: 'Date' },
  { emoji: '🍕', label: 'Pizza cravings', tag: 'Food' },
  { emoji: '🔥', label: 'Great vibe', tag: 'Compliment' },
  { emoji: '🎧', label: 'Listening to you', tag: 'Vibe' },
  { emoji: '🥺', label: 'So sweet', tag: 'Cute' },
  { emoji: '💃', label: 'Weekend plans?', tag: 'Party' },
  { emoji: '💌', label: 'Cupid Match', tag: 'Love' }
];

const QUICK_EMOJIS = [
  '❤️', '🥰', '😍', '🔥', '🥺', '☕', '🌸', '🦋', 
  '🍕', '🥂', '💃', '🎸', '🎓', '🎉', '💌', '🌙', 
  '🍿', '🧸', '🍩', '🥑', '🌺', '🍓', '🍦', '😊'
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

  // Luxury Interactive Chat States: Photos, Emojis, Stickers, Audio Calls, Likes
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState('stickers'); // 'stickers' | 'emojis'
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [likedMessages, setLikedMessages] = useState({});
  const fileInputRef = useRef(null);

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

  // Voice Call Timer Simulation
  useEffect(() => {
    let timer;
    if (showCallModal) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      setIsCallMuted(false);
    }
    return () => clearInterval(timer);
  }, [showCallModal]);

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
        // Default warm greetings matching conversation dialogue
        setMessages(prev => {
          if (prev[activeChatUser.id] && prev[activeChatUser.id].length > 0) return prev;
          const partnerFirst = activeChatUser.name.split(' ')[0];
          const myFirst = (user.name || 'Aditya').split(' ')[0];
          const roundName = user.state || 'Delhi NCR';

          return {
            ...prev,
            [activeChatUser.id]: [
              { 
                id: 'dialogue_1', 
                sender: 'them', 
                text: `Hey ${myFirst}! We matched on Cupid's ${roundName} round`, 
                time: '4:24 PM' 
              },
              {
                id: 'dialogue_2',
                sender: 'them',
                text: "Love your vibe! What are you studying on campus?",
                time: '4:24 PM'
              },
              {
                id: 'dialogue_3',
                sender: 'me',
                text: "Hii",
                time: '4:23 PM'
              },
              {
                id: 'dialogue_4',
                sender: 'them',
                text: "Aww that made my day! Check out my Instagram too!",
                time: '4:24 PM'
              },
              {
                id: 'dialogue_5',
                sender: 'me',
                text: "Thanks a lot",
                time: '4:23 PM'
              },
              {
                id: 'dialogue_6',
                sender: 'them',
                text: "Haha totally! Let's definitely grab coffee around campus ☕",
                time: '4:24 PM'
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

  // Photo sharing handler
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatUser || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = {
        id: `img_${Date.now()}`,
        sender: 'me',
        text: '',
        image: dataUrl,
        time: timeStr
      };

      setMessages(prev => ({
        ...prev,
        [activeChatUser.id]: [...(prev[activeChatUser.id] || []), newMsg]
      }));

      showToast('Photo sent');
      setShowActionSheet(false);

      // Sweet partner reaction
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [activeChatUser.id]: [
            ...(prev[activeChatUser.id] || []),
            {
              id: `reply_photo_${Date.now()}`,
              sender: 'them',
              text: "Omg this is such a great picture! 😍",
              time: 'Just now'
            }
          ]
        }));
      }, 1500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sticker sending handler
  const handleSendSticker = (sticker) => {
    if (!activeChatUser || !user) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `stk_${Date.now()}`,
      sender: 'me',
      type: 'sticker',
      emoji: sticker.emoji,
      label: sticker.label,
      time: timeStr
    };

    setMessages(prev => ({
      ...prev,
      [activeChatUser.id]: [...(prev[activeChatUser.id] || []), newMsg]
    }));

    setShowEmojiPicker(false);
    setShowActionSheet(false);

    // Partner reaction
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeChatUser.id]: [
          ...(prev[activeChatUser.id] || []),
          {
            id: `reply_stk_${Date.now()}`,
            sender: 'them',
            text: `Aww, total vibe! 🥰`,
            time: 'Just now'
          }
        ]
      }));
    }, 1200);
  };

  // Quick emoji insertion
  const handleEmojiClick = (emoji) => {
    setInputMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Toggle heart reaction on partner message
  const toggleMessageLike = (msgId) => {
    setLikedMessages(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
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
        className="fixed md:absolute inset-0 z-50 flex flex-col bg-[#FFF5F8] overflow-hidden select-none md:rounded-[44px] animate-slide-in-right"
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

        {/* Top Header (Glassmorphic, Sticky, Luxury Dating App Style) */}
        <div className="pt-[max(0.75rem,env(safe-area-inset-top))] px-3 pb-2.5 bg-white/95 backdrop-blur-xl border-b border-pink-100/60 flex items-center justify-between z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveChatUser(null);
                if (onActiveChatChange) onActiveChatChange(null);
              }}
              className="w-9 h-9 rounded-full bg-white shadow-xs border border-pink-100/70 flex items-center justify-center text-slate-800 hover:bg-pink-50 active:scale-95 transition-all cursor-pointer saas-tap"
              title="Back to Matches"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div 
              onClick={() => onOpenMatchProfile && onOpenMatchProfile(activeChatUser)}
              className="relative cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="View Profile"
            >
              <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#FF2E79] to-[#FFA0BF]">
                <img 
                  src={activeChatUser.avatar} 
                  alt={activeChatUser.name} 
                  className="w-full h-full object-cover rounded-full bg-slate-100" 
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>

            <div className="leading-tight text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[15px] text-slate-900 font-display">
                  {activeChatUser.name.split(' ')[0]}, {activeChatUser.age || 21}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#FFEBF2] text-[#FF2E79] px-2 py-0.5 rounded-full font-bold">
                  <Heart className="w-2.5 h-2.5 fill-current" />
                  Matched
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[140px]">{activeChatUser.university || 'Bennett University'}</span>
              </div>
            </div>
          </div>

          {/* Right Header Options (Voice Call & Kebab Menu) */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowCallModal(true)}
              className="w-9 h-9 rounded-full bg-white shadow-xs border border-pink-100/70 flex items-center justify-center text-slate-800 hover:bg-pink-50 hover:text-[#FF2E79] active:scale-95 transition-all cursor-pointer saas-tap"
              title="Voice Call"
            >
              <Phone className="w-4 h-4 fill-current stroke-[1.5]" />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full bg-white shadow-xs border border-pink-100/70 flex items-center justify-center text-slate-800 hover:bg-pink-50 active:scale-95 transition-all cursor-pointer saas-tap"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl shadow-2xl border border-pink-100 py-1.5 z-50 text-left animate-scale-in">
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

        {/* Message Stream (Contained Scrolling, Luxury Bubbles & Reactions) */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 min-h-0 p-3.5 space-y-3.5 overflow-y-auto overscroll-contain no-scrollbar"
        >
          {/* Centered Date Badge */}
          <div className="flex justify-center my-1">
            <span className="px-3.5 py-1 rounded-full bg-[#FFEBF2] text-[#FF2E79] text-[10.5px] font-bold shadow-2xs">
              Today
            </span>
          </div>

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
                className="animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                {msg.sender === 'them' ? (
                  /* Partner message (Left aligned with avatar and heart reaction) */
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <img 
                      src={activeChatUser.avatar} 
                      alt={activeChatUser.name} 
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 shadow-xs border border-pink-100" 
                    />
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 group">
                        <div className="bg-white text-slate-800 text-[13px] font-medium leading-relaxed px-4 py-2.5 rounded-[22px] rounded-tl-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-pink-100/70 text-left">
                          {msg.text}
                        </div>

                        {/* Heart Reaction Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleMessageLike(msg.id)}
                          className="p-1 rounded-full hover:bg-pink-50 active:scale-125 transition-transform cursor-pointer saas-tap shrink-0"
                          title="Heart reaction"
                        >
                          <Heart 
                            className={`w-4 h-4 transition-colors ${
                              likedMessages[msg.id] 
                                ? 'fill-[#FF2E79] text-[#FF2E79]' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`} 
                          />
                        </button>
                      </div>

                      <span className="text-[9.5px] text-slate-400 font-semibold ml-1.5 mt-0.5">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* User message (Right aligned with pink gradient, photo or sticker support) */
                  <div className="flex flex-col items-end max-w-[85%] ml-auto">
                    {msg.image ? (
                      <div 
                        onClick={() => setPreviewImage(msg.image)}
                        className="rounded-[22px] rounded-tr-[6px] overflow-hidden max-w-[240px] shadow-[0_4px_14px_rgba(255,46,121,0.2)] border-2 border-[#FF2E79] cursor-pointer group relative bg-black/5"
                      >
                        <img 
                          src={msg.image} 
                          alt="Shared attachment" 
                          className="w-full h-auto object-cover max-h-60 group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="text-[10px] font-bold bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">Tap to view</span>
                        </div>
                      </div>
                    ) : msg.type === 'sticker' ? (
                      <div className="bg-gradient-to-tr from-pink-50 via-white to-rose-50 border border-pink-200/80 px-4 py-2.5 rounded-[22px] rounded-tr-[6px] shadow-sm flex items-center gap-2.5">
                        <span className="text-3xl animate-bounce">{msg.emoji}</span>
                        <div className="text-left">
                          <div className="text-xs font-bold text-[#FF2E79]">{msg.label}</div>
                          <div className="text-[9px] text-slate-400 font-semibold">Cupid Sticker</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-[#FF2E79] to-[#FF4B8B] text-white text-[13px] font-medium leading-relaxed px-4 py-2.5 rounded-[22px] rounded-tr-[6px] shadow-[0_4px_12px_rgba(255,46,121,0.22)] text-left">
                        {msg.text}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mr-1 mt-0.5">
                      <span className="text-[9.5px] text-slate-400 font-semibold">{msg.time}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#FF2E79]" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Icebreakers Carousel (Exact Chips from Screenshot) */}
        <div className="px-3.5 py-1.5 bg-transparent overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          {ICEBREAKERS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                handleSendMessage(prompt.text);
              }}
              onClick={() => handleSendMessage(prompt.text)}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-pink-50 active:scale-95 text-[#FF2E79] text-xs font-semibold shrink-0 transition-all border border-pink-100/90 shadow-[0_2px_6px_rgba(255,46,121,0.06)] flex items-center gap-1.5 cursor-pointer saas-tap"
            >
              <span>{prompt.emoji}</span>
              <span>{prompt.text}</span>
            </button>
          ))}
        </div>

        {/* Bottom Message Input Bar (Minimal, Elegant, Fits All Screens) */}
        <div className={`w-full max-w-full px-3 py-2 ${isKeyboardOpen ? 'pb-2' : 'pb-[max(0.6rem,env(safe-area-inset-bottom))]'} bg-white/95 backdrop-blur-xl border-t border-pink-100/60 flex items-center gap-2 shrink-0 z-20 shadow-md box-border relative`}>
          
          {/* Plus button on left (for photo, stickers, campus spot) */}
          <button
            type="button"
            onClick={() => {
              setShowActionSheet(!showActionSheet);
              setShowEmojiPicker(false);
            }}
            className={`w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 active:scale-90 transition-all shrink-0 cursor-pointer saas-tap ${
              showActionSheet ? 'rotate-45 text-[#FF2E79] border-[#FF2E79]' : ''
            }`}
            title="More Options"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Center Pill Input Bar */}
          <div className="flex-1 min-w-0 h-10 px-3.5 bg-slate-50/90 border border-slate-200/90 rounded-full flex items-center gap-1.5 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:shadow-[0_0_0_2px_rgba(255,46,121,0.12)] transition-all">
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
              className="flex-1 min-w-0 bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 font-medium outline-none"
            />

            {/* Smile Emoji / Stickers Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowActionSheet(false);
              }}
              className="p-1 text-slate-400 hover:text-[#FF2E79] transition-colors cursor-pointer saas-tap shrink-0"
              title="Stickers & Emojis"
            >
              <Smile className={`w-5 h-5 ${showEmojiPicker ? 'text-[#FF2E79]' : ''}`} />
            </button>
          </div>

          {/* Send Button on Right (Hot Pink Circle, Guaranteed to Fit) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF2E79] to-[#FF4B8B] text-white flex items-center justify-center shadow-md shadow-pink-300 active:scale-90 transition-all shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed saas-tap"
            title="Send"
          >
            <Send className="w-4 h-4 -rotate-12 translate-x-0.5 fill-white" />
          </button>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* ─── EMOJI & STICKER DRAWER (Minimal, Elegant, No AI Symbols) ─── */}
        {showEmojiPicker && (
          <div className="absolute bottom-[64px] left-3 right-3 bg-white rounded-[24px] shadow-2xl border border-pink-100 p-3 z-30 animate-scale-up">
            <div className="flex items-center justify-between border-b border-pink-100/70 pb-2 mb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setEmojiTab('stickers')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    emojiTab === 'stickers'
                      ? 'bg-[#FF2E79] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  Stickers
                </button>
                <button
                  onClick={() => setEmojiTab('emojis')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    emojiTab === 'emojis'
                      ? 'bg-[#FF2E79] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  Emojis
                </button>
              </div>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emojiTab === 'stickers' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto no-scrollbar p-1">
                {CUTE_STICKERS.map((stk, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendSticker(stk)}
                    className="p-2.5 rounded-2xl bg-pink-50/60 hover:bg-pink-100/80 border border-pink-100 flex flex-col items-center gap-1 active:scale-95 transition-all text-center cursor-pointer saas-tap"
                  >
                    <span className="text-2xl">{stk.emoji}</span>
                    <span className="text-[10.5px] font-bold text-slate-700 leading-tight">{stk.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-52 overflow-y-auto no-scrollbar p-1">
                {QUICK_EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-10 h-10 rounded-xl hover:bg-pink-50 flex items-center justify-center text-2xl active:scale-125 transition-all cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ACTION SHEET POPUP (Clean & Human Icons, No Sparkles) ─── */}
        {showActionSheet && (
          <div className="absolute bottom-[64px] left-3 w-56 bg-white rounded-[24px] shadow-2xl border border-pink-100 p-2 z-30 animate-scale-up space-y-1">
            <button
              onClick={handlePhotoClick}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-pink-50 flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer saas-tap"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 text-[#FF2E79] flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div>Share Photo</div>
                <div className="text-[10px] text-slate-400 font-normal">From gallery</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowActionSheet(false);
                setShowEmojiPicker(true);
                setEmojiTab('stickers');
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-pink-50 flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer saas-tap"
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#FF2E79] flex items-center justify-center shrink-0">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <div>Stickers & Emojis</div>
                <div className="text-[10px] text-slate-400 font-normal">Express your vibe</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowActionSheet(false);
                handleSendMessage("📍 How about meeting at Blue Tokai or the campus lawn?");
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-pink-50 flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer saas-tap"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div>Campus Hangout</div>
                <div className="text-[10px] text-slate-400 font-normal">Suggest coffee spot</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowActionSheet(false);
                handleSendMessage("🎵 Currently on loop: 'Kasoor' by Prateek Kuhad. What's your jam?");
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-pink-50 flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer saas-tap"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div>Share Music</div>
                <div className="text-[10px] text-slate-400 font-normal">Spotify anthem</div>
              </div>
            </button>
          </div>
        )}

        {/* ─── VOICE CALL SIMULATOR MODAL ─── */}
        {showCallModal && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col justify-between p-6 text-white animate-fade-in">
            {/* Top Security Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF2E79]" />
                <span className="text-[11px] font-bold text-slate-300">Cupid Encrypted Voice</span>
              </div>
              <button
                onClick={() => setShowCallModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Center Caller Info & Soundwaves */}
            <div className="flex flex-col items-center justify-center space-y-4 my-auto">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#FF2E79]/20 animate-ping"></div>
                <div className="absolute -inset-8 rounded-full bg-[#FF2E79]/10 animate-pulse"></div>
                
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#FF2E79] to-[#FF80A6] shadow-2xl">
                  <img 
                    src={activeChatUser.avatar} 
                    alt={activeChatUser.name} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-black font-display">{activeChatUser.name.split(' ')[0]}, {activeChatUser.age || 21}</h2>
                <p className="text-xs text-slate-400 font-medium">{activeChatUser.university || 'Bennett University'}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{callDuration > 2 ? `Connected • ${formatCallTime(callDuration - 2)}` : 'Connecting...'}</span>
                </div>
              </div>

              {/* Dynamic Audio Visualizer */}
              {callDuration > 2 && (
                <div className="flex items-center gap-1.5 h-6 mt-4">
                  {[40, 75, 50, 90, 60, 80, 45, 100, 70, 50, 85].map((h, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-[#FF2E79] rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.4 + (idx % 4) * 0.2}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-around max-w-xs mx-auto w-full pt-6">
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer saas-tap ${
                  isCallMuted ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={isCallMuted ? "Unmute" : "Mute"}
              >
                <Volume2 className={`w-6 h-6 ${isCallMuted ? 'opacity-40' : ''}`} />
              </button>

              <button
                onClick={() => setShowCallModal(false)}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 active:scale-90 transition-all cursor-pointer saas-tap"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7 stroke-[2.2]" />
              </button>

              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer saas-tap ${
                  isSpeakerOn ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title="Speaker"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* ─── FULLSCREEN IMAGE VIEWER MODAL ─── */}
        {previewImage && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-between p-4 animate-fade-in">
            <div className="flex items-center justify-between text-white pt-2">
              <span className="text-xs font-bold text-slate-300">Shared Photo</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Enlarged preview"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <div className="flex justify-center pb-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md cursor-pointer saas-tap"
              >
                Close
              </button>
            </div>
          </div>
        )}

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
    <div className="flex-1 flex flex-col h-full bg-[#FFF5F8] relative select-none p-4 pb-24 overflow-y-auto overscroll-contain animate-screen-enter">
      
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
              className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E79] to-rose-500 text-white font-extrabold text-xs shadow-md shadow-pink-300 saas-tap transition-all cursor-pointer"
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
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group saas-tap"
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
                  className="p-3 bg-white hover:bg-pink-50/60 rounded-2xl border border-pink-100/70 shadow-2xs flex items-center justify-between cursor-pointer transition-all saas-tap"
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
