import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Headphones,
  ShieldCheck,
  CheckCheck,
  Image as ImageIcon,
  Smile,
  Bell,
  Sparkles,
  Bot,
  User as UserIcon,
  Search,
  Paperclip,
  Check,
  Radio,
  Clock,
  MessageSquare,
  Users
} from "lucide-react";
import { ChatMessage, UserProfile } from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  allMessages: ChatMessage[];
  onSendMessage: (msg: Omit<ChatMessage, "id" | "timestamp" | "status">) => void;
  isAdmin?: boolean;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  allMessages,
  onSendMessage,
  isAdmin = false,
}) => {
  const [activeChannel, setActiveChannel] = useState<"support" | "community">("support");
  const [inputContent, setInputContent] = useState("");
  const [replyAsAdmin, setReplyAsAdmin] = useState(isAdmin);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter messages by channel
  const filteredMessages = allMessages.filter((m) => {
    const channelMatch = activeChannel === "support" ? m.channelId === "support" : m.channelId === "community";
    if (!searchQuery.trim()) return channelMatch;
    return (
      channelMatch &&
      (m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, allMessages, activeChannel]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() && !selectedImage) return;

    sounds.playClick();
    sounds.triggerHaptic(15);

    const senderRole = replyAsAdmin ? "admin" : currentUserProfile.role === "admin" ? "admin" : "user";
    const senderName = replyAsAdmin ? "INCO Support Admin" : currentUserProfile.displayName;
    const senderAvatar = replyAsAdmin
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
      : currentUserProfile.avatarUrl;

    onSendMessage({
      channelId: activeChannel,
      senderId: replyAsAdmin ? "admin-sys" : currentUserProfile.id,
      senderName,
      senderAvatar,
      senderRole,
      isVerified: replyAsAdmin ? true : currentUserProfile.isVerified,
      content: inputContent.trim(),
      imageUrl: selectedImage || undefined,
    });

    setInputContent("");
    setSelectedImage(null);

    // Auto simulated response if on support channel and not sent by admin
    if (activeChannel === "support" && !replyAsAdmin) {
      setTimeout(() => {
        sounds.playBeep();
        onSendMessage({
          channelId: "support",
          senderId: "inco-support-agent",
          senderName: "INCO Customer Desk",
          senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          senderRole: "admin",
          isVerified: true,
          content: `Hello ${currentUserProfile.displayName}! The INCO customer service desk has received your note regarding "${inputContent.slice(0, 30)}...". An official support representative or automated assistant is reviewing your request in real-time.`,
        });
      }, 1200);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <div className="bg-slate-900 border border-yellow-400/60 dark:border-yellow-500/50 rounded-2xl w-full max-w-2xl h-[92vh] sm:h-[80vh] flex flex-col shadow-2xl overflow-hidden neon-border-amber font-sans animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Headphone Support Badge */}
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black neon-glow-amber shadow-xs shrink-0">
              <Headphones className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="chat-modal-title" className="text-sm sm:text-base font-black text-white">
                  Customer Service & Community
                </h2>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live 24/7
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Direct audio & message line to INCO Smart Shop Customer Service and fellow store owners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channel Switcher & Search Bar */}
        <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 p-0.5 bg-slate-850 rounded-lg border border-slate-750">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveChannel("support");
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === "support"
                  ? "bg-yellow-400 text-slate-950 shadow-xs neon-glow-amber"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>Headphone Support</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveChannel("community");
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === "community"
                  ? "bg-emerald-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Store Community</span>
            </button>
          </div>

          {/* Admin Role Toggle if user has admin privileges */}
          {currentUserProfile.role === "admin" && (
            <label className="flex items-center gap-1.5 text-[10px] text-yellow-300 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/30 cursor-pointer">
              <input
                type="checkbox"
                checked={replyAsAdmin}
                onChange={(e) => setReplyAsAdmin(e.target.checked)}
                className="accent-yellow-400 rounded"
              />
              <span>Reply as Official Admin</span>
            </label>
          )}
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-900/60">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 text-yellow-400">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {activeChannel === "support" ? "Customer Support Channel" : "Community Chat"}
              </h3>
              <p className="text-xs max-w-xs text-slate-400">
                {activeChannel === "support"
                  ? "Ask questions about subscriptions, payment verification, barcode scanners, or inventory counting."
                  : "Share stock tips, supplier connections, and best practices with other merchants."}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === currentUserProfile.id;
              const isAdminMsg = msg.senderRole === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 max-w-[88%] sm:max-w-[78%] ${
                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar with Verified Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        msg.senderAvatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={msg.senderName}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border ${
                        isAdminMsg
                          ? "border-yellow-400 ring-2 ring-yellow-400/30"
                          : "border-slate-700"
                      }`}
                    />
                    {msg.isVerified && (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-yellow-400 text-slate-950 rounded-full flex items-center justify-center border border-slate-900 shadow-xs"
                        title="Verified Viora AI User"
                      >
                        <Check className="w-2 h-2 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-2.5 sm:p-3 text-xs leading-relaxed ${
                      isMe
                        ? "bg-yellow-400 text-slate-950 font-medium rounded-tr-xs shadow-md"
                        : isAdminMsg
                        ? "bg-slate-800 border border-yellow-400/50 text-white rounded-tl-xs shadow-md neon-border-amber"
                        : "bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-black text-[11px] ${
                            isMe ? "text-slate-900" : isAdminMsg ? "text-yellow-400" : "text-slate-200"
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        {isAdminMsg && (
                          <span className="text-[8px] uppercase font-black px-1 rounded bg-yellow-400 text-slate-950">
                            OFFICIAL SUPPORT
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] ${
                          isMe ? "text-slate-800" : "text-slate-400"
                        } font-mono`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="mt-2 rounded-lg max-h-48 w-full object-cover border border-slate-700"
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-2 sm:p-3 bg-slate-950 border-t border-slate-800 shrink-0">
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img
                src={selectedImage}
                alt="preview"
                className="w-16 h-16 object-cover rounded-lg border border-yellow-400"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 transition-colors shrink-0"
              title="Attach screenshot or receipt"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                activeChannel === "support"
                  ? "Type message to live customer service..."
                  : "Share a note with community merchants..."
              }
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-yellow-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
            />

            <button
              type="submit"
              disabled={!inputContent.trim() && !selectedImage}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all shrink-0 ${
                inputContent.trim() || selectedImage
                  ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300 active:scale-95 cursor-pointer neon-glow-amber"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
              aria-label="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
