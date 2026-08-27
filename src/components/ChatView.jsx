import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  GraduationCap, 
  Phone, 
  Heart,
  Smile,
  ShieldCheck,
  Search
} from 'lucide-react';

const ICEBREAKERS = [
  "Coffee date this weekend? ☕",
  "What's your major? 📚",
  "Favorite late-night food spot in NCR? 🍕",
  "What's your current Spotify anthem? 🎵",
  "Are you more introvert or extrovert? ✨"
];

export default function ChatView({ user, matchedUsers = [], onOpenMatchProfile }) {
  const [activeChatUser, setActiveChatUser] = useState(matchedUsers[0] || null);
  const [messages, setMessages] = useState({
    [matchedUsers[0]?.id || 'default']: [
      { id: 1, sender: 'them', text: "Hey! We matched on Cupid's round 🎉", time: 'Just now' },
      { id: 2, sender: 'them', text: "Love your vibe! What are you studying?", time: 'Just now' }
    ]
  });
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentMessages = activeChatUser ? (messages[activeChatUser.id] || [
    { id: 1, sender: 'them', text: `Hey ${user.name.split(' ')[0]}! Cupid matched us ✨`, time: 'Just now' }
  ]) : [];

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !activeChatUser) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: text.trim(),
      time: 'Just now'
    };

    const updated = {
      ...messages,
      [activeChatUser.id]: [...(messages[activeChatUser.id] || []), newMsg]
    };
    setMessages(updated);
    setInputMessage('');

    // Simulated cute response after 1 second
    setTimeout(() => {
      const cuteReplies = [
        "Haha totally agree! ☕ Let's connect soon!",
        "That's awesome! I'm around campus too.",
        "Aww that's so sweet! Check my Insta in the bio ✨",
        "Omg yes! Murthal drives or Blue Tokai coffee anytime 🚙"
      ];
      const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
      setMessages(prev => ({
        ...prev,
        [activeChatUser.id]: [...(prev[activeChatUser.id] || []), {
          id: Date.now() + 1,
          sender: 'them',
          text: reply,
          time: 'Just now'
        }]
      }));
    }, 1200);
  };

  const filteredMatches = matchedUsers.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.university?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If viewing an active direct chat conversation
  if (activeChatUser) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative select-none animate-slide-up">
        
        {/* Chat Top Header */}
        <div className="p-3 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveChatUser(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-rose-400">
              <img src={activeChatUser.avatar} alt={activeChatUser.name} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs text-slate-900 font-display">
                  {activeChatUser.name.split(' ')[0]}, {activeChatUser.age}
                </span>
                <span className="text-[8px] bg-rose-50 text-[#FF2D55] px-1.5 py-0.2 rounded-full font-bold">
                  Matched
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-medium truncate block max-w-[140px]">
                {activeChatUser.university || activeChatUser.state}
              </span>
            </div>
          </div>

          {/* Direct WhatsApp / Instagram Reveal Button */}
          {activeChatUser.contact && (
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* Contact Banner */}
        <div className="px-3 py-1.5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100/60 flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-600 truncate">
            Direct Link: <strong className="text-[#FF2D55]">{activeChatUser.contact || '@' + activeChatUser.name.toLowerCase().replace(' ', '_')}</strong>
          </span>
          <span className="text-[9px] font-bold text-rose-500 shrink-0">100% Mutual Yes</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto no-scrollbar">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                  msg.sender === 'me'
                    ? 'bg-[#FF2D55] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Icebreakers Carousel */}
        <div className="px-3 py-1.5 bg-white/80 border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          {ICEBREAKERS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-pink-50 hover:text-[#FF2D55] text-slate-600 text-[10px] font-bold shrink-0 transition-all border border-slate-200/60 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Message Input */}
        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Message ${activeChatUser.name.split(' ')[0]}...`}
            className="flex-1 h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-full font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#FF2D55] focus:bg-white transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="w-10 h-10 rounded-full bg-[#FF2D55] hover:bg-[#e02447] text-white flex items-center justify-center shadow-md shadow-rose-200 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    );
  }

  // Matches & Conversations Overview List
  return (
    <div className="flex-1 flex flex-col h-full bg-white relative select-none p-4 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 className="font-display text-base font-black text-slate-900">Matches & Messages</h2>
          <p className="text-[10px] text-slate-400">Mutual connections from active Cupid rounds</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#FF2D55] text-xs font-black border border-rose-100">
          {matchedUsers.length} Matches
        </span>
      </div>

      {/* Top Stories Row: New Matches */}
      {matchedUsers.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
            Mutual Matches
          </span>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {matchedUsers.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveChatUser(m)}
                className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
              >
                <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2D55] to-pink-500 shadow-md ring-2 ring-white hover:scale-105 transition-transform">
                  <img src={m.avatar} alt={m.name} className="w-full h-full rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[60px]">
                  {m.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
          All Conversations
        </span>

        {matchedUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-3xl my-4 space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-[#FF2D55] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Active Chats Yet</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[220px] mx-auto">
              Once you or another candidate match in the explore feed or campus radar, your direct chat opens here!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveChatUser(m)}
                className="p-3 bg-white hover:bg-pink-50/40 rounded-2xl border border-slate-200/80 hover:border-pink-200 shadow-xs flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-rose-300">
                  <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">
                      {m.name.split(' ')[0]}, {m.age}
                    </h4>
                    <span className="text-[9px] text-slate-400 font-medium">Just now</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    <GraduationCap className="w-3 h-3 text-[#FF2D55] shrink-0" />
                    <span>{m.university || m.state}</span>
                  </div>
                  <p className="text-[10.5px] text-[#FF2D55] font-bold truncate mt-0.5">
                    Mutual Match • Tap to chat ✨
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
