import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, ChevronDown, ChevronLeft, ChevronRight, Sprout } from "lucide-react";
import { logger } from "../../utils/logger";
import { HttpClient } from "../../services/httpClient";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

interface SuggestedAction {
  actionId: string;
  label: string;
  route: string;
}

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user" | "error";
  timestamp: string;
  suggestedActions?: SuggestedAction[];
}

interface Shortcut {
  label: string;
  targetPage: string;
  isAllowed: (user: any, role: string) => boolean;
}

const SHORTCUTS: Shortcut[] = [
  {
    label: "Cửa hàng cây",
    targetPage: "shop",
    isAllowed: () => true
  },
  {
    label: "Bác Sĩ Cây AI",
    targetPage: "ai-diagnosis",
    isAllowed: () => true
  },
  {
    label: "Đặt dịch vụ",
    targetPage: "booking",
    isAllowed: () => true
  },
  {
    label: "Cẩm nang xanh",
    targetPage: "blog",
    isAllowed: () => true
  },
  {
    label: "Hồ sơ cá nhân",
    targetPage: "customer-dashboard",
    isAllowed: (u) => !!u
  },
  {
    label: "Kênh người bán",
    targetPage: "store-dashboard",
    isAllowed: (u, role) => !!u && (u.is_seller || role === "store")
  },
  {
    label: "Trang quản trị",
    targetPage: "admin-dashboard",
    isAllowed: (u, role) => role === "admin"
  },
  {
    label: "Đăng nhập",
    targetPage: "auth",
    isAllowed: (u) => !u
  }
];

const getAllowedTargetPage = (actionId: string, user: any, role: string): string | null => {
  if (actionId === "shop") return "shop";
  if (actionId === "ai-diagnosis") return "ai-diagnosis";
  if (actionId === "booking") return "booking";
  if (actionId === "blog") return "blog";
  if (actionId === "customer-dashboard" && user) return "customer-dashboard";
  if (actionId === "store-dashboard" && user && (user.is_seller || role === "store")) return "store-dashboard";
  if (actionId === "admin-dashboard" && role === "admin") return "admin-dashboard";
  if (actionId === "auth" && !user) return "auth";
  return null;
};

export const Chatbot: React.FC = () => {
  const { setCurrentPage, currentUser, userRole } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      text: "Xin chào! Tôi là Trợ lý GreenLife 🌿\n\nTôi có thể giúp bạn tìm kiếm cây trồng, giải đáp thắc mắc dịch vụ hoặc hướng dẫn chẩn đoán bệnh cây bằng AI.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        { actionId: "shop", label: "Ghé cửa hàng", route: "/shop" },
        { actionId: "ai-diagnosis", label: "Chẩn đoán bệnh cây", route: "/ai-diagnosis" }
      ]
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const shortcutScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const chatbotRef = useRef<HTMLDivElement>(null);

  // Click outside & Escape key handler to close chatbot
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const checkShortcutScroll = () => {
    const el = shortcutScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(checkShortcutScroll, 100);
      window.addEventListener("resize", checkShortcutScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkShortcutScroll);
      };
    }
  }, [isOpen, currentUser, userRole]);

  const scrollShortcutsLeft = () => {
    shortcutScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" });
  };

  const scrollShortcutsRight = () => {
    shortcutScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" });
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    if (messages.length === 1) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
      }
    } else if (messages.length > prevMessagesCountRef.current) {
      scrollToBottom();
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages, isOpen]);

  const renderFormattedText = (text: string, isUserMessage: boolean) => {
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const boldContent = part.slice(2, -2);
              return (
                <strong
                  key={pIdx}
                  className={isUserMessage ? "font-bold text-white" : "font-semibold text-[var(--gl-accent)]"}
                >
                  {boldContent}
                </strong>
              );
            }
            return part;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => {
      const combined = [...prev, userMsg];
      return combined.length > 50 ? [combined[0], ...combined.slice(combined.length - 49)] : combined;
    });

    setInputText("");
    setIsTyping(true);

    try {
      const response = await HttpClient.post("/api/ai/chat", {
        message: text.trim(),
        history: messages.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        }))
      });

      const data = response.data;
      if (data && data.reply) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          text: data.reply,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          suggestedActions: data.suggestedActions || []
        };
        setMessages((prev) => {
          const combined = [...prev, botMsg];
          return combined.length > 50 ? [combined[0], ...combined.slice(combined.length - 49)] : combined;
        });

        if (!isOpen) {
          setHasUnread(true);
        }
      } else {
        throw new Error("Phản hồi không hợp lệ từ máy chủ.");
      }
    } catch (err: any) {
      logger.error("Chatbot API Error:", err);

      let errorText = "Hệ thống đang bận. Vui lòng thử lại sau giây lát.";
      const errMsg = err?.data?.message || err?.message || "";

      if (errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
        errorText = "Hệ thống đang xử lý nhiều yêu cầu. Bạn vui lòng đợi 30 giây rồi hỏi lại nhé.";
      } else if (errMsg.includes("503") || errMsg.toLowerCase().includes("unavailable")) {
        errorText = "Dịch vụ AI đang bảo trì ngắn hạn. Vui lòng quay lại sau ít phút.";
      } else if (errMsg) {
        errorText = `Không thể kết nối AI: ${errMsg}`;
      }

      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        text: errorText,
        sender: "error",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => {
        const combined = [...prev, errorMsg];
        return combined.length > 50 ? [combined[0], ...combined.slice(combined.length - 49)] : combined;
      });

      if (!isOpen) setHasUnread(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleShortcutClick = (shortcut: Shortcut) => {
    setCurrentPage(shortcut.targetPage);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  // ── DRAGGABLE LAUNCHER ──────────────────────────────────────────────────
  type LauncherSide = "left" | "right";

  const LAUNCHER_SIZE = 56; // w-14 h-14 = 56px

  const getGutter = () => (window.innerWidth >= 768 ? 24 : 14);
  const getBottomGutter = () => (window.innerWidth >= 768 ? 24 : 18);
  const getMinY = () => (window.innerWidth >= 768 ? 140 : 116);

  const getDefaultPos = () => {
    const g = getGutter();
    const bg = getBottomGutter();
    return {
      x: window.innerWidth - LAUNCHER_SIZE - g,
      y: window.innerHeight - LAUNCHER_SIZE - bg,
      side: "right" as LauncherSide,
    };
  };

  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number; side: LauncherSide }>(() => getDefaultPos());
  const [isDragging, setIsDragging] = useState(false);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<{ px: number; py: number; lx: number; ly: number } | null>(null);
  const didDragRef = useRef(false);

  // Clamp helpers
  const clampPos = (x: number, y: number): { x: number; y: number } => {
    const g = getGutter();
    const bg = getBottomGutter();
    const minY = getMinY();
    const maxX = window.innerWidth - LAUNCHER_SIZE - g;
    const maxY = window.innerHeight - LAUNCHER_SIZE - bg;
    return {
      x: Math.max(g, Math.min(x, maxX > g ? maxX : g)),
      y: Math.max(minY, Math.min(y, maxY > minY ? maxY : minY)),
    };
  };

  const snapX = (side: LauncherSide): number => {
    const g = getGutter();
    return side === "left" ? g : window.innerWidth - LAUNCHER_SIZE - g;
  };

  // Pointer event handlers
  const handleLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary pointer
    if (e.button !== 0 && e.pointerType === "mouse") return;
    didDragRef.current = false;
    dragStartRef.current = {
      px: e.clientX,
      py: e.clientY,
      lx: launcherPos.x,
      ly: launcherPos.y,
    };
    launcherRef.current?.setPointerCapture(e.pointerId);
  };

  const handleLauncherPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.px;
    const dy = e.clientY - dragStartRef.current.py;
    if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < 6) return;

    if (!didDragRef.current) {
      didDragRef.current = true;
      setIsDragging(true);
    }

    e.preventDefault();
    const { x, y } = clampPos(dragStartRef.current.lx + dx, dragStartRef.current.ly + dy);
    setLauncherPos((prev) => ({ ...prev, x, y }));
  };

  const handleLauncherPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;
    launcherRef.current?.releasePointerCapture(e.pointerId);
    dragStartRef.current = null;

    if (!didDragRef.current) {
      // It was a click — toggle chatbot
      setIsDragging(false);
      return;
    }

    // Snap to nearest side
    const center = launcherPos.x + LAUNCHER_SIZE / 2;
    const newSide: LauncherSide = center < window.innerWidth / 2 ? "left" : "right";
    const snappedX = snapX(newSide);
    setLauncherPos((prev) => ({ ...prev, x: snappedX, side: newSide }));
    setIsDragging(false);
    didDragRef.current = false;
  };

  const handleLauncherPointerCancel = () => {
    dragStartRef.current = null;
    setIsDragging(false);
    didDragRef.current = false;
  };

  const handleLauncherClick = () => {
    // Only act if this was a clean click (not a drag release)
    if (didDragRef.current) return;
    handleToggle();
  };

  // Resize: re-clamp and re-snap
  useEffect(() => {
    const handleResize = () => {
      setLauncherPos((prev) => {
        const { y } = clampPos(prev.x, prev.y);
        const snappedX = snapX(prev.side);
        return { x: snappedX, y, side: prev.side };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Panel position follows side
  const panelStyle: React.CSSProperties = launcherPos.side === "left"
    ? { left: window.innerWidth >= 768 ? "24px" : "12px", right: "auto" }
    : { right: window.innerWidth >= 768 ? "24px" : "12px", left: "auto" };

  // Launcher button style (position driven by JS, not Tailwind classes)
  const launcherStyle: React.CSSProperties = {
    position: "fixed",
    left: launcherPos.x,
    top: launcherPos.y,
    transition: isDragging
      ? "none"
      : "left 240ms cubic-bezier(0.22,1,0.36,1), top 80ms linear, transform 180ms ease, box-shadow 180ms ease",
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div ref={chatbotRef}>
      {/* ── CHAT WINDOW (Open State) ─────────────────────────────────── */}
      {isOpen && (
        <div
          className="gl-chatbot-window bg-[var(--gl-bg-surface)] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ border: "1px solid var(--gl-chat-border)", ...panelStyle }}
          role="dialog"
          aria-modal="true"
          aria-label="Trợ lý GreenLife"
        >
          {/* ── Chatbot Header (flex-none) ───────────────────────────── */}
          <div
            className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 flex-none"
            style={{
              background: "linear-gradient(135deg, var(--gl-chat-header-start) 0%, var(--gl-chat-header-end) 100%)"
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-white leading-none">Trợ lý GreenLife</h4>
                <span className="text-[11px] text-emerald-100/80 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />
                  Hướng dẫn website và chăm sóc cây
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggle}
                aria-label="Thu gọn cửa sổ chat"
                className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/15 cursor-pointer transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={handleToggle}
                aria-label="Đóng cửa sổ chat"
                className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/15 cursor-pointer transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Messages Viewport (flex-1 min-h-0 overflow-y-auto) ────── */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[var(--gl-bg-page)]"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 gl-chat-message-enter ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse max-w-[88%]" : "max-w-[90%]"
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] mt-0.5 ${
                  msg.sender === "bot"
                    ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500/30 text-white"
                    : msg.sender === "error"
                      ? "bg-red-950/60 border border-red-800/50 text-[var(--gl-danger)]"
                      : "bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-secondary)]"
                }`}>
                  {msg.sender === "bot" ? (
                    <Sprout className="w-4 h-4 text-white" />
                  ) : msg.sender === "error" ? (
                    <span className="font-bold text-xs">!</span>
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-[1.5] break-words overflow-hidden ${
                    msg.sender === "user"
                      ? "bg-[var(--gl-chat-primary)] text-white rounded-tr-none font-medium"
                      : msg.sender === "error"
                        ? "bg-[var(--gl-bg-surface)] border border-[var(--gl-danger)]/40 text-[var(--gl-danger)] rounded-tl-none font-medium"
                        : "bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] rounded-tl-none"
                  }`}>
                    {renderFormattedText(msg.text, msg.sender === "user")}

                    {/* Suggested actions inside bubble */}
                    {msg.sender === "bot" && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[var(--gl-border)]">
                        {msg.suggestedActions.map((action) => {
                          const targetPage = getAllowedTargetPage(action.actionId, currentUser, userRole);
                          if (!targetPage) return null;
                          return (
                            <button
                              key={action.actionId}
                              onClick={() => setCurrentPage(targetPage)}
                              className="px-2.5 py-1 text-xs bg-[var(--gl-accent-soft)] hover:bg-[var(--gl-accent)]/20 text-[var(--gl-accent)] rounded-lg transition-colors cursor-pointer font-medium border border-[var(--gl-accent)]/25 hover:border-[var(--gl-accent)]/50"
                            >
                              {action.label || "Đi tới trang"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-[var(--gl-text-muted)] block px-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--gl-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--gl-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--gl-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] text-[var(--gl-text-muted)] block px-1">
                    Đang chuẩn bị câu trả lời…
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Shortcuts (flex-none, horizontal row with desktop < and > buttons) ── */}
          <div className="px-3 py-2 border-t border-[var(--gl-border)] bg-[var(--gl-bg-elevated)] shrink-0 flex-none relative">
            <span className="text-[10px] text-[var(--gl-text-muted)] block uppercase tracking-wider mb-1 font-semibold">Lối tắt nhanh:</span>

            <div className="relative flex items-center px-1">
              {/* Left Scroll Button (Desktop) */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={scrollShortcutsLeft}
                  aria-label="Xem lối tắt trước"
                  className="hidden md:flex absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] shadow-md text-[var(--gl-text-secondary)] hover:text-[var(--gl-accent)] hover:border-[var(--gl-accent)]/50 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Scrollable Shortcut Row */}
              <div
                ref={shortcutScrollRef}
                onScroll={checkShortcutScroll}
                className="flex flex-nowrap overflow-x-auto gl-nav-scroll gap-2 py-0.5 w-full scroll-smooth px-1"
              >
                {SHORTCUTS.filter((s) => s.isAllowed(currentUser, userRole)).map((shortcut) => (
                  <button
                    key={shortcut.label}
                    onClick={() => handleShortcutClick(shortcut)}
                    className="px-3 h-8 text-[12px] bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-accent)] hover:border-[var(--gl-accent)]/40 hover:bg-[var(--gl-accent-soft)] rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] active:scale-95"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>

              {/* Right Scroll Button (Desktop) */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={scrollShortcutsRight}
                  aria-label="Xem thêm lối tắt"
                  className="hidden md:flex absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 items-center justify-center rounded-full bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] shadow-md text-[var(--gl-text-secondary)] hover:text-[var(--gl-accent)] hover:border-[var(--gl-accent)]/50 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Composer (flex-none) ─────────────────────────────────── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isTyping || !inputText.trim()) return;
              handleSendMessage(inputText);
            }}
            className="p-3 bg-[var(--gl-bg-surface)] border-t border-[var(--gl-border)] flex gap-2 items-end shrink-0 flex-none pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isTyping && inputText.trim()) {
                    handleSendMessage(inputText);
                  }
                }
              }}
              placeholder="Nhập nội dung tin nhắn..."
              disabled={isTyping}
              aria-label="Nội dung câu hỏi"
              ref={inputRef}
              rows={1}
              className="flex-1 bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)]/60 focus:ring-2 focus:ring-[var(--gl-focus-ring)] rounded-xl px-3 py-2 text-[14px] text-[var(--gl-text-primary)] placeholder:text-[var(--gl-text-muted)] focus:outline-none disabled:opacity-50 resize-none max-h-24 overflow-y-auto leading-relaxed transition-colors"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              aria-label="Gửi câu hỏi"
              className="w-9 h-9 rounded-full bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white shrink-0 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── LAUNCHER BUBBLE (always rendered, position driven by JS) ───── */}
      {/* Tooltip wrapper — use a span so the button itself is what receives pointer events */}
      <div
        className="group"
        style={{ position: "fixed", left: launcherPos.x, top: launcherPos.y, zIndex: 60, width: LAUNCHER_SIZE, height: LAUNCHER_SIZE }}
      >
        {/* Tooltip */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:block bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] text-[12px] font-semibold py-1.5 px-3 rounded-lg border border-[var(--gl-border)] shadow-xl whitespace-nowrap pointer-events-none z-50 ${
            launcherPos.side === "left" ? "left-full ml-3" : "right-full mr-3"
          }`}
        >
          Trợ lý GreenLife
        </div>

        <button
          ref={launcherRef}
          onClick={handleLauncherClick}
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={handleLauncherPointerUp}
          onPointerCancel={handleLauncherPointerCancel}
          style={launcherStyle}
          className={`gl-chat-launcher w-14 h-14 rounded-full flex items-center justify-center border-0 focus:outline-none focus:ring-2 focus:ring-[var(--gl-focus-ring)] focus:ring-offset-2${isDragging ? " is-dragging" : ""}`}
          aria-label="Mở Trợ lý GreenLife"
          title="Trợ lý GreenLife"
        >
          <Sprout className="gl-chat-launcher-icon h-6 w-6 text-white" />

          {/* Unread indicator */}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] text-white font-bold items-center justify-center border border-white">
                !
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
