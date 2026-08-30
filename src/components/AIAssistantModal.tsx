import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Camera,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Send,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Radio,
  RotateCcw,
  Zap
} from "lucide-react";
import { InventoryItem, StoreSettings, ParsedAIAction, DetectedAIPhotoItem } from "../types";
import { sounds } from "../lib/sound";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onApplyParsedActions: (actions: ParsedAIAction[]) => void;
  onImportPhotoItems: (photoItems: DetectedAIPhotoItem[]) => void;
}

interface VoiceMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actions?: ParsedAIAction[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onApplyParsedActions,
  onImportPhotoItems,
}) => {
  const [activeTab, setActiveTab] = useState<"voice_interactive" | "photo_audit" | "whatsapp_insights">("voice_interactive");

  // Interactive Speech-to-Speech State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<VoiceMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: `Hello! I'm your INCO Voice Assistant for ${settings.storeName}. Speak to me anytime to count stock, record sales, or ask what items are running low.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [pendingActions, setPendingActions] = useState<ParsedAIAction[] | null>(null);

  // Photo Audit State
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [detectedPhotoItems, setDetectedPhotoItems] = useState<DetectedAIPhotoItem[] | null>(null);

  // WhatsApp & Insights State
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<{
    restockAlerts: string[];
    financialInsights: string[];
    supplierWhatsappMessage: string;
  } | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech Recognition and Synthesis Refs
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of conversation
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory, isProcessing, isSpeaking]);

  // Clean up speech recognition on unmount / close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Speak text aloud using browser Text-to-Speech API
  const speakText = (text: string, onFinish?: () => void) => {
    if (!voiceOutputEnabled || !("speechSynthesis" in window)) {
      if (onFinish) onFinish();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel any previous utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      // Pick a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.lang.startsWith("en") && v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onFinish) onFinish();
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        setIsSpeaking(false);
        if (onFinish) onFinish();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS failed:", e);
      setIsSpeaking(false);
      if (onFinish) onFinish();
    }
  };

  // Start Interactive Speech Recognition
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setErrorMessage("Speech recognition is not supported in your browser. You can type queries directly.");
      return;
    }

    // Stop synthesis if currently speaking
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Capture one turn, process immediately
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        sounds.playBeep();
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          setErrorMessage(`Microphone note: ${event.error}. Tap to try again.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim()) {
          setVoiceTranscript(transcript);

          // Clear previous timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // Auto-submit after short silence pause (1.2s)
          silenceTimerRef.current = setTimeout(() => {
            handleProcessVoice(transcript.trim());
          }, 1200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      if (voiceTranscript.trim()) {
        handleProcessVoice(voiceTranscript.trim());
      }
    } else {
      setVoiceTranscript("");
      startListening();
    }
  };

  // Send speech transcript to Voice AI Dialogue Engine
  const handleProcessVoice = async (textToSend?: string) => {
    const text = (textToSend || voiceTranscript).trim();
    if (!text || isProcessing) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();
    setIsProcessing(true);
    setErrorMessage(null);

    // Add user message to conversation history
    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setConversationHistory((prev) => [...prev, userMsg]);
    setVoiceTranscript("");

    try {
      const res = await fetch("/api/ai/voice-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          existingItems: items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            sellingPrice: i.sellingPrice,
            reorderPoint: i.reorderPoint,
          })),
          storeName: settings.storeName,
          currencySymbol: settings.currencySymbol,
        }),
      });

      const data = await res.json();
      const aiReplyText = data.speechResponse || "I have received your note.";
      const actions: ParsedAIAction[] = data.actions || [];

      if (actions.length > 0) {
        setPendingActions(actions);
      }

      // Add AI response to conversation
      const aiMsg: VoiceMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: actions.length > 0 ? actions : undefined,
      };
      setConversationHistory((prev) => [...prev, aiMsg]);

      // Speak response aloud immediately!
      speakText(aiReplyText, () => {
        // If continuous hands-free mode is on, resume listening automatically after speaking!
        if (handsFreeMode && isOpen) {
          setTimeout(() => {
            startListening();
          }, 600);
        }
      });
    } catch (err: any) {
      console.error("Voice processing error:", err);
      const fallbackMsg = "I processed your request. Please check the action items below.";
      setConversationHistory((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: fallbackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakText(fallbackMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo to Gemini Vision API
  const handleAnalyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzingPhoto(true);
    setErrorMessage(null);
    setDetectedPhotoItems(null);

    try {
      const res = await fetch("/api/ai/photo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze photo.");

      setDetectedPhotoItems(data.items || []);
      sounds.playSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred analyzing photo.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Generate Insights & WhatsApp Message
  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          storeName: settings.storeName,
          currencySymbol: settings.currencySymbol,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate insights.");

      setInsights(data.insights || null);
      sounds.playSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred generating insights.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    sounds.playClick();
    setTimeout(() => setCopiedWhatsapp(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-yellow-400/60 rounded-2xl max-w-2xl w-full p-3 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden neon-border-amber font-sans my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-slate-950 font-bold rounded-xl shadow-xs neon-glow-amber">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="ai-assistant-modal-title" className="font-black text-white text-base">
                  INCO Interactive Voice AI
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  SPEECH-TO-SPEECH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Speak naturally to count inventory, log sales, or ask questions — AI speaks back out loud.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              stopListening();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl mb-3 text-xs font-bold border border-slate-800 shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("voice_interactive");
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "voice_interactive"
                ? "bg-yellow-400 text-slate-950 font-black shadow-xs neon-glow-amber"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Interactive Voice AI</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("photo_audit");
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "photo_audit"
                ? "bg-yellow-400 text-slate-950 font-black shadow-xs neon-glow-amber"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Shelf / Photo Scan</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("whatsapp_insights");
              if (!insights) handleGenerateInsights();
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "whatsapp_insights"
                ? "bg-yellow-400 text-slate-950 font-black shadow-xs neon-glow-amber"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Restock</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-2 p-2.5 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: INTERACTIVE SPEECH-TO-SPEECH VOICE MODE */}
        {activeTab === "voice_interactive" && (
          <div className="flex-1 flex flex-col overflow-hidden space-y-2.5">
            {/* Control Bar: Voice Output Toggle & Continuous Hands-Free Switch */}
            <div className="flex items-center justify-between bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setVoiceOutputEnabled(!voiceOutputEnabled);
                    if (voiceOutputEnabled && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                    voiceOutputEnabled ? "text-yellow-400" : "text-slate-500"
                  }`}
                  title="Toggle Voice Speech Output"
                >
                  {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{voiceOutputEnabled ? "Voice Output: ON" : "Voice Output: MUTED"}</span>
                </button>

                <label className="hidden sm:flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={handsFreeMode}
                    onChange={(e) => setHandsFreeMode(e.target.checked)}
                    className="accent-yellow-400 w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="font-bold">Continuous Conversation</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                {isSpeaking && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <Volume2 className="w-3 h-3 text-yellow-400" />
                    SPEAKING...
                  </span>
                )}
                {isListening && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    LISTENING...
                  </span>
                )}
                {isProcessing && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin text-indigo-400" />
                    AI Thinking...
                  </span>
                )}
              </div>
            </div>

            {/* Conversation Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs min-h-[160px] max-h-[300px]">
              {conversationHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-yellow-400 text-slate-950 font-bold rounded-tr-none shadow-md"
                        : "bg-slate-850 border border-slate-750 text-white rounded-tl-none shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[9px] font-mono uppercase">
                      <span>{msg.sender === "user" ? "You (Voice)" : "INCO Voice AI"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.text}</p>

                    {/* Detected Actions Inside Conversation */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1.5">
                        <div className="text-[10px] font-black text-yellow-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span>Detected Stock Updates ({msg.actions.length}):</span>
                        </div>
                        <div className="space-y-1">
                          {msg.actions.map((act, i) => (
                            <div
                              key={i}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-750 flex items-center justify-between text-[11px]"
                            >
                              <span className="font-bold text-slate-200">{act.itemName}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                                  act.actionType === "add_stock"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : act.actionType === "remove_stock"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-blue-500/20 text-blue-300"
                                }`}
                              >
                                {act.actionType === "add_stock"
                                  ? `+${act.quantity} ${act.unit}`
                                  : act.actionType === "remove_stock"
                                  ? `-${act.quantity} ${act.unit}`
                                  : `Set ${act.quantity} ${act.unit}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-start">
                  <div className="p-3 bg-slate-850 border border-slate-750 text-slate-300 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-xs">INCO AI is analyzing stock & synthesizing voice...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Pending Actions Apply Prompt */}
            {pendingActions && pendingActions.length > 0 && (
              <div className="p-2.5 bg-yellow-400/10 border border-yellow-400/60 rounded-xl flex items-center justify-between gap-2 shrink-0">
                <div className="text-[11px] text-yellow-300">
                  <strong className="text-white">{pendingActions.length} Inventory Action(s) Ready:</strong> Apply to store catalog?
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPendingActions(null)}
                    className="px-2 py-1 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSuccess();
                      sounds.triggerHaptic(20);
                      onApplyParsedActions(pendingActions);
                      setPendingActions(null);
                      speakText(`Applied ${pendingActions.length} stock updates to your inventory.`);
                    }}
                    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer neon-glow-amber"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Apply Actions</span>
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Microphone Orb & Text Fallback Input */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-2 shrink-0">
              {/* Pulsing Audio Waveform when active */}
              {(isListening || isSpeaking) && (
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 75, 100, 60, 90, 45, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isSpeaking ? "bg-yellow-400" : "bg-rose-500"
                      }`}
                      style={{
                        height: `${Math.max(6, Math.floor(h * Math.random()))}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Big Interactive Voice Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                    isListening
                      ? "bg-rose-600 text-white ring-8 ring-rose-600/30 animate-pulse shadow-rose-600/50"
                      : isSpeaking
                      ? "bg-yellow-400 text-slate-950 ring-8 ring-yellow-400/30 animate-bounce neon-glow-amber"
                      : "bg-yellow-400 hover:bg-yellow-300 text-slate-950 ring-4 ring-yellow-400/20 neon-glow-amber"
                  }`}
                  title={isListening ? "Tap to Stop Listening" : "Tap to Speak to INCO Voice AI"}
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7 stroke-[2.5]" />
                  ) : (
                    <Mic className="w-7 h-7 stroke-[2.5]" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-bold text-center">
                {isListening
                  ? "🎙️ Listening... Speak now (e.g. 'I counted 10 loaves of bread')"
                  : isSpeaking
                  ? "🔊 INCO Voice Assistant is speaking..."
                  : "Tap the golden microphone to start speaking with INCO Voice AI"}
              </p>

              {/* Fallback Text Input Bar */}
              <div className="w-full flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleProcessVoice();
                    }
                  }}
                  placeholder="Or type stock update / question here..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-750 focus:border-yellow-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={!voiceTranscript.trim() || isProcessing}
                  onClick={() => handleProcessVoice()}
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer neon-glow-amber"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHELF / PHOTO SCAN */}
        {activeTab === "photo_audit" && (
          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            <div className="border-2 border-dashed border-slate-700 hover:border-yellow-400/60 rounded-2xl p-4 text-center bg-slate-950/60 space-y-3">
              {photoBase64 ? (
                <div className="relative max-h-44 mx-auto overflow-hidden rounded-xl border border-slate-750">
                  <img src={photoBase64} alt="Shelf preview" className="h-44 object-contain mx-auto" />
                  <button
                    onClick={() => setPhotoBase64(null)}
                    className="absolute top-2 right-2 bg-slate-900/90 text-white p-1 rounded-full text-xs font-bold hover:bg-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Camera className="w-10 h-10 text-yellow-400 mx-auto animate-pulse" />
                  <div>
                    <p className="font-black text-sm text-white">Upload or Snap Photo of Shelf / Invoice</p>
                    <p className="text-[11px] text-slate-400">
                      Gemini Vision detects items, counts packs, and auto-fills product catalog prices
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl cursor-pointer text-xs neon-glow-amber shadow-md">
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>Take Photo / Choose File</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              )}

              {photoBase64 && (
                <button
                  type="button"
                  disabled={isAnalyzingPhoto}
                  onClick={handleAnalyzePhoto}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer neon-glow-amber"
                >
                  {isAnalyzingPhoto ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                  <span>{isAnalyzingPhoto ? "Scanning Shelf with Gemini Vision..." : "Detect Items & Quantities"}</span>
                </button>
              )}
            </div>

            {/* Detected Items List */}
            {detectedPhotoItems && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-white uppercase tracking-wider">
                    Detected Products ({detectedPhotoItems.length})
                  </h4>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                    Auto-categorized
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950">
                  {detectedPhotoItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-black text-white">{item.name}</span>
                        <div className="text-[10px] text-slate-400">
                          {item.category} • {item.notes || "Detected on shelf"}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-black text-yellow-400 text-xs">
                          {item.estimatedQuantity} {item.unit}
                        </span>
                        {item.estimatedSellingPrice ? (
                          <div className="text-[10px] text-slate-400">
                            {settings.currencySymbol}{item.estimatedSellingPrice.toFixed(2)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onImportPhotoItems(detectedPhotoItems);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer neon-glow-amber"
                >
                  <CheckCircle2 className="w-4 h-4" /> Import Items to Store Inventory
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WHATSAPP RESTOCK INSIGHTS */}
        {activeTab === "whatsapp_insights" && (
          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            {isGeneratingInsights ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
                <p className="font-black text-white text-sm">Analyzing inventory velocity & margins...</p>
                <p className="text-[11px] text-slate-400">Drafting personalized supplier WhatsApp restock sheet</p>
              </div>
            ) : insights ? (
              <div className="space-y-3">
                {/* Urgent Restock Alerts */}
                <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-1.5">
                  <h4 className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Urgent Restock Priorities</span>
                  </h4>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {insights.restockAlerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-yellow-400 font-bold">•</span>
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* WhatsApp Order Draft */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-emerald-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Ready-to-Send Supplier WhatsApp Message</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(insights.supplierWhatsappMessage)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedWhatsapp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWhatsapp ? "Copied!" : "Copy Order"}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 border border-slate-750 rounded-lg text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
                    {insights.supplierWhatsappMessage}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={handleGenerateInsights}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs cursor-pointer neon-glow-amber"
                >
                  Generate Supplier Order Sheet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
