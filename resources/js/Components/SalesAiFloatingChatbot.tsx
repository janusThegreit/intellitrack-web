import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Check,
  Copy,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  timestamp: string;
}

interface SalesAiFloatingChatbotProps {
  userRole?: string;
}

export const SalesAiFloatingChatbot: React.FC<SalesAiFloatingChatbotProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>('Google Gemini AI (Active)');

  // Floating Chat Head Draggable Position (Messenger Chat Head motion)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
  });

  // Initialize position and restore saved position from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('intellitrack_chathead_pos');
    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 76;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition({
            x: Math.min(Math.max(16, parsed.x), maxX),
            y: Math.min(Math.max(16, parsed.y), maxY),
          });
          return;
        }
      } catch (e) {}
    }
    // Default: bottom-right corner
    setPosition({
      x: Math.max(16, window.innerWidth - 76),
      y: Math.max(16, window.innerHeight - 80),
    });
  }, []);

  // Update on window resize so chat head stays within viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const isLeft = prev.x < window.innerWidth / 2;
        const buttonSize = 56;
        return {
          x: isLeft ? 16 : Math.max(16, window.innerWidth - buttonSize - 16),
          y: Math.min(Math.max(16, prev.y), window.innerHeight - buttonSize - 16),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      hasMoved: false,
    };

    setIsDragging(true);
    setIsSnapping(false);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;
      const dist = Math.hypot(deltaX, deltaY);

      if (dist > 6) {
        dragRef.current.hasMoved = true;
      }

      const buttonSize = 56;
      const newX = Math.max(8, Math.min(window.innerWidth - buttonSize - 8, dragRef.current.startPosX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - buttonSize - 8, dragRef.current.startPosY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      setIsDragging(false);

      if (dragRef.current.hasMoved) {
        // Snap to nearest edge like Messenger Chat Heads
        const buttonSize = 56;
        const middle = window.innerWidth / 2;
        const currentX = Math.max(8, Math.min(window.innerWidth - buttonSize - 8, dragRef.current.startPosX + (upEvent.clientX - dragRef.current.startX)));
        const currentY = Math.max(16, Math.min(window.innerHeight - buttonSize - 16, dragRef.current.startPosY + (upEvent.clientY - dragRef.current.startY)));

        const snapX = currentX < middle ? 16 : window.innerWidth - buttonSize - 16;
        
        setIsSnapping(true);
        setPosition({ x: snapX, y: currentY });

        try {
          localStorage.setItem('intellitrack_chathead_pos', JSON.stringify({ x: snapX, y: currentY }));
        } catch (err) {}

        setTimeout(() => setIsSnapping(false), 350);
      } else {
        // Just a tap/click -> toggle open/close
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: "Kumusta! 👋 Ako ang iyong **IntelliTrack Sales Intelligence Copilot**.\n\nHanda akong sumagot sa anumang katanungan mo sa negosyo, live fleet telemetry, o nakaraang taon:\n\n- 📈 **Ano ang improvement kumpara sa nakaraang taon?**\n- 🏗️ **Aling crane ang pinakamalakas ang demand?**\n- 📝 **Ilan ang quotations na naghihintay ng manager approval?**\n- 💰 **Magkano ang kabuuang pipeline at monthly forecast?**\n\nPumili ng prompt sa ibaba o mag-type ng iyong sariling tanong!",
        source: 'Google Gemini AI (gemini-3.6-flash)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Custom Event Listener to open chat from Dashboard buttons with pre-filled prompt
  useEffect(() => {
    const handleOpenAi = (e: CustomEvent<{ prompt?: string }>) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    };

    window.addEventListener('open-sales-ai' as any, handleOpenAi as any);
    return () => {
      window.removeEventListener('open-sales-ai' as any, handleOpenAi as any);
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await axios.post('/api/analytics/copilot', {
        prompt: promptText,
        user_role: userRole,
      });

      const assistantMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        sender: 'assistant',
        text: response.data.response || 'Paumanhin, walang tugon na natanggap.',
        source: response.data.source || 'Google Gemini AI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (response.data.source) {
        setAiSource(response.data.source);
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Copilot API error:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: "⚠️ **Paumanhin, nagkaroon ng error sa pagkonekta sa AI Server.**\n\nPakisubukang muli o i-verify ang koneksyon ng backend.",
        source: 'System Error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const quickPrompts = [
    { label: '📈 Improvement vs Last Year', prompt: 'ano yung improvement nong nakaraan taon' },
    { label: '🏗️ Crane Demand & Utilization', prompt: 'aling crane ang pinakamalakas ang demand' },
    { label: '📝 Pending Quotation Approvals', prompt: 'may pending quotation approval ba tayo ngayon?' },
    { label: '💰 Pipeline & Forecast', prompt: 'magkano ang kabuuang pipeline at monthly revenue forecast' },
  ];

  // Markdown Formatter helper for nice bullet points, bolding, headings
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headings
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="mt-2.5 mb-1.5 font-bold text-amber-400 text-sm tracking-wide">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="mt-2 mb-1 font-semibold text-amber-300/90 text-xs uppercase tracking-wider">
            {line.replace('#### ', '')}
          </h5>
        );
      }
      // Bullet list items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-neutral-200 pl-1">
            <span className="text-amber-400 mt-1 shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
          </div>
        );
      }
      // Numbered list items
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-neutral-200 pl-1">
            <span className="text-amber-400 font-bold shrink-0">{line.match(/^\d+\./)?.[0]}</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, '')) }} />
          </div>
        );
      }
      // Empty line spacer
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular paragraph
      return (
        <p key={idx} className="my-1 text-xs text-neutral-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    });
  };

  const formatInline = (str: string) => {
    // Bold: **text**
    let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-amber-300">$1</strong>');
    // Code / pills: `text`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-neutral-800 text-amber-400 text-[11px] font-mono border border-neutral-700">$1</code>');
    return formatted;
  };

  if (!isMounted) return null;

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isMobile = screenW < 640;
  const isLeft = position.x < screenW / 2;
  const buttonSize = 56;

  let winStyle: React.CSSProperties = {};
  if (isMobile) {
    winStyle = {
      position: 'fixed',
      left: '12px',
      right: '12px',
      bottom: `${Math.max(12, screenH - position.y + 12)}px`,
      maxHeight: 'calc(100vh - 100px)',
      zIndex: 50,
    };
  } else {
    const winWidth = isExpanded ? 580 : 440;
    const estHeight = isExpanded ? 720 : 560;

    let computedLeft = isLeft
      ? Math.max(16, Math.min(position.x, screenW - winWidth - 16))
      : Math.max(16, Math.min(position.x + buttonSize - winWidth, screenW - winWidth - 16));

    let computedTop = position.y - estHeight - 12;
    if (computedTop < 20) {
      if (position.y + buttonSize + estHeight + 20 <= screenH) {
        computedTop = position.y + buttonSize + 12;
      } else {
        computedTop = Math.max(20, screenH - estHeight - 20);
      }
    }

    winStyle = {
      position: 'fixed',
      left: `${computedLeft}px`,
      top: `${computedTop}px`,
      zIndex: 50,
    };
  }

  return (
    <>
      {/* Expanded Messenger Window */}
      {isOpen && (
        <div
          style={winStyle}
          className={clsx(
            'flex flex-col overflow-hidden rounded-2xl border border-neutral-700/70 bg-neutral-950/95 text-neutral-100 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 print:hidden',
            isExpanded
              ? 'w-[95vw] sm:w-[580px] h-[86vh] max-h-[780px]'
              : 'w-[92vw] sm:w-[440px] h-[75vh] max-h-[600px]'
          )}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-neutral-950 shadow-md shadow-amber-500/20">
                <Bot className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">IntelliTrack Sales AI Copilot</h3>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                    {userRole === 'sales_manager' ? 'Sales Manager DSS' : 'Live DSS'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  {aiSource || 'Google Gemini AI (gemini-3.6-flash)'}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 text-neutral-400">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore window size' : 'Expand window'}
                className="rounded-lg p-1.5 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel/Pills */}
          <div className="border-b border-neutral-800/80 bg-neutral-900/50 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-amber-500/80 shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Prompts:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                className="shrink-0 rounded-full border border-neutral-700/80 bg-neutral-800/60 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-300 text-[11px] text-neutral-300 px-2.5 py-1 transition disabled:opacity-50 cursor-pointer"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'flex flex-col',
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                )}
              >
                {/* Bubble Container */}
                <div
                  className={clsx(
                    'relative max-w-[88%] rounded-2xl p-3.5 shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 font-medium rounded-br-none shadow-amber-500/10'
                      : 'bg-neutral-900/90 border border-neutral-800 rounded-bl-none text-neutral-100 shadow-neutral-950/40'
                  )}
                >
                  {msg.sender === 'assistant' ? (
                    <div>
                      {renderFormattedText(msg.text)}

                      {/* Source & Actions footer */}
                      <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                          <Cpu className="h-3 w-3" />
                          {msg.source || 'AI Intelligence Engine'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            title="Copy response"
                            className="text-neutral-400 hover:text-white transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-neutral-950 whitespace-pre-wrap">{msg.text}</p>
                      <span className="block mt-1 text-right text-[10px] text-neutral-800/80 font-normal">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-neutral-400 text-xs pl-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-neutral-900 border border-neutral-800 px-3.5 py-2">
                  <span className="text-[11px] text-neutral-300 mr-1.5">Analyzing telemetry</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse delay-100"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-neutral-800 bg-neutral-900/80 p-3"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Tanungin ang AI (hal. improvement nong nakaraan taon)..."
                disabled={loading}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-4 py-2.5 pr-12 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="absolute right-1.5 rounded-lg bg-amber-500 p-2 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition font-bold cursor-pointer"
                title="Send Message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Messenger Draggable Trigger Button (Messenger Chat Head motion) */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 51,
        }}
        className={clsx(
          'print:hidden',
          isSnapping && 'transition-all duration-350 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]'
        )}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          className={clsx(
            'group relative flex items-center justify-center rounded-2xl backdrop-blur-xl select-none',
            isDragging
              ? 'cursor-grabbing scale-110 rotate-3 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-500/50'
              : 'cursor-grab hover:scale-105 active:scale-95 transition-transform duration-200 shadow-xl',
            isOpen
              ? 'h-14 w-14 bg-white border-2 border-amber-500 text-amber-600 shadow-amber-500/20 dark:bg-slate-900 dark:border-amber-500/60 dark:text-amber-400 dark:shadow-amber-500/10'
              : 'h-14 w-14 bg-white border border-slate-200 hover:border-amber-400 text-amber-600 hover:shadow-amber-500/10 dark:bg-slate-900/95 dark:border-white/10 dark:hover:border-amber-500/40 dark:text-amber-400 dark:shadow-2xl dark:hover:shadow-amber-500/15'
          )}
          title="Drag to reposition or click to toggle IntelliTrack AI Copilot"
        >
          {/* Subtle Ambient Glow */}
          <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 blur-sm transition duration-300 pointer-events-none" />

          {isOpen ? (
            <X className="relative h-5 w-5 text-slate-700 dark:text-slate-300 pointer-events-none" />
          ) : (
            <>
              <Bot className="relative h-6 w-6 transition-transform group-hover:scale-110 text-amber-500 dark:text-amber-400 pointer-events-none" />
              {/* Sparkle micro badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 ring-2 ring-white dark:ring-slate-950 pointer-events-none">
                <Sparkles className="h-2.5 w-2.5" />
              </span>
            </>
          )}

          {/* High-End Hover Tooltip - smart orientation based on position */}
          {!isOpen && !isDragging && (
            <div
              className={clsx(
                'absolute hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none',
                isLeft
                  ? 'left-16 translate-x-[-4px] group-hover:translate-x-0'
                  : 'right-16 translate-x-1 group-hover:translate-x-0',
                'dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>IntelliTrack Copilot</span>
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">AI</kbd>
            </div>
          )}
        </button>
      </div>
    </>
  );
};

export default SalesAiFloatingChatbot;
