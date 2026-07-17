import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, ChevronDown, Sprout } from "lucide-react";
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
    label: "Đăng nhập",
    targetPage: "auth",
    isAllowed: (user) => !user
  },
  {
    label: "Hồ sơ của tôi",
    targetPage: "customer-dashboard",
    isAllowed: (user, role) => !!user && role === "customer"
  },
  {
    label: "Đăng ký bán hàng",
    targetPage: "store-profile-setup",
    isAllowed: (user, role) => !!user && role === "customer" && !user.is_seller
  },
  {
    label: "Quản lý cửa hàng",
    targetPage: "store-dashboard",
    isAllowed: (user, role) => !!user && role === "store"
  }
];

const ACTION_TO_PAGE: Record<string, string> = {
  nav_home: "home",
  nav_shop: "shop",
  nav_ai_diagnosis: "ai-diagnosis",
  nav_booking: "booking",
  nav_blog: "blog",
  nav_auth: "auth",
  nav_customer_dashboard: "customer-dashboard",
  nav_store_register: "store-profile-setup",
  nav_store_dashboard: "store-dashboard"
};

const getAllowedTargetPage = (actionId: string, user: any, role: string): string | null => {
  const page = ACTION_TO_PAGE[actionId];
  if (!page) return null;

  // Guest checking authenticated actions
  const isAuthAction = [
    "customer-dashboard",
    "store-profile-setup",
    "store-dashboard"
  ].includes(page);
  
  if (isAuthAction && !user) {
    return "auth";
  }

  // Auth-only guest action should not be shown after auth
  if (page === "auth" && user) {
    return null;
  }

  // Customer-only action (store registration)
  if (page === "store-profile-setup") {
    if (role !== "customer" || user.is_seller) {
      return null;
    }
  }

  // Store-only action (dashboard)
  if (page === "store-dashboard") {
    if (role !== "store" && role !== "admin") {
      return null;
    }
  }

  return page;
};

const renderBoldText = (text: string, isUser: boolean) => {
  return text.split("**").map((part, index) => 
    index % 2 === 1 ? (
      <strong 
        key={index} 
        className={isUser ? "text-black font-extrabold" : "text-emerald-400 font-semibold"}
      >
        {part}
      </strong>
    ) : (
      part
    )
  );
};

const renderFormattedText = (text: string, isUser: boolean) => {
  if (isUser) return <span>{text}</span>;

  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const content = line.trim();
        
        if (content.startsWith("###")) {
          const headerText = content.replace(/^###\s*/, "");
          return (
            <h5 key={idx} className="text-xs font-bold text-emerald-400 mt-2 mb-1">
              {renderBoldText(headerText, isUser)}
            </h5>
          );
        }
        if (content.startsWith("##")) {
          const headerText = content.replace(/^##\s*/, "");
          return (
            <h4 key={idx} className="text-[13px] font-bold text-emerald-400 mt-2 mb-1 border-b border-stone-850 pb-0.5">
              {renderBoldText(headerText, isUser)}
            </h4>
          );
        }
        if (content.startsWith("#")) {
          const headerText = content.replace(/^#\s*/, "");
          return (
            <h3 key={idx} className="text-sm font-bold text-emerald-400 mt-3 mb-1 border-b border-stone-850 pb-1">
              {renderBoldText(headerText, isUser)}
            </h3>
          );
        }

        if (content.startsWith("*") || content.startsWith("-")) {
          const bulletText = content.replace(/^[\*\-]\s*/, "");
          return (
            <div key={idx} className="flex gap-1.5 pl-1.5 text-xs">
              <span className="text-emerald-500 shrink-0">•</span>
              <span className="flex-1 text-stone-250">{renderBoldText(bulletText, isUser)}</span>
            </div>
          );
        }

        if (content === "") {
          return <div key={idx} className="h-1" />;
        }

        return (
          <p key={idx} className="text-xs text-stone-250">
            {renderBoldText(content, isUser)}
          </p>
        );
      })}
    </div>
  );
};

export interface ChatResponse {
  answer: string;
  suggestedActions: SuggestedAction[];
}

export const Chatbot: React.FC = () => {
  const { currentPage, setCurrentPage, currentUser, userRole } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! Tôi là Trợ lý GreenLife. Tôi có thể hỗ trợ bạn tìm hiểu cách mua cây, đặt dịch vụ chăm sóc, chẩn đoán bệnh cây bằng AI hoặc điều hướng các tính năng trên website. Bạn cần trợ giúp gì nào?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      toast.error("Câu hỏi không được vượt quá 1000 ký tự.");
      return;
    }
    if (isTyping) return;

    setInputText("");

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      text: trimmed,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => {
      const combined = [...prev, userMsg];
      return combined.length > 50 ? [combined[0], ...combined.slice(combined.length - 49)] : combined;
    });

    setIsTyping(true);

    try {
      const response = await HttpClient.post<ChatResponse>("/api/ai/chat", {
        question: trimmed,
        currentRoute: currentPage
      });

      setIsTyping(false);

      if (response && response.answer) {
        const botMsg: Message = {
          id: `reply-${Date.now()}`,
          text: response.answer,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          suggestedActions: response.suggestedActions
        };
        setMessages((prev) => {
          const combined = [...prev, botMsg];
          return combined.length > 50 ? [combined[0], ...combined.slice(combined.length - 49)] : combined;
        });
      } else {
        throw new Error("Phản hồi trống từ dịch vụ AI.");
      }
    } catch (err: any) {
      setIsTyping(false);
      setInputText(trimmed);

      let errorText = "trợ lý tạm thời không khả dụng";
      const errMsg = err.message || "";
      if (errMsg.includes("Yêu cầu không hợp lệ")) {
        errorText = "câu hỏi trống/quá dài hoặc không hợp lệ";
      } else if (errMsg.includes("Phiên đăng nhập") || errMsg.includes("không có quyền")) {
        errorText = "yêu cầu đăng nhập/quyền phù hợp";
      } else if (errMsg.includes("Quá nhiều yêu cầu")) {
        errorText = "gửi quá nhiều câu hỏi, vui lòng chờ";
      } else if (errMsg.includes("phản hồi AI") || errMsg.includes("502")) {
        errorText = "phản hồi AI không hợp lệ";
      } else if (errMsg.includes("Máy chủ") || errMsg.includes("503")) {
        errorText = "trợ lý tạm thời không khả dụng";
      } else if (errMsg.includes("thời gian chờ") || errMsg.includes("504")) {
        errorText = "phản hồi quá thời gian";
      } else {
        errorText = errMsg || "trợ lý tạm thời không khả dụng";
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* CHAT WINDOW CONTAINER */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-stone-950 border border-stone-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Banner */}
          <div className="bg-[#5d4037]/90 px-4 py-3 border-b border-[#8d6e63]/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5d4037]/30 border border-[#8d6e63]/25 flex items-center justify-center">
                <Sprout className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-100 leading-none">Trợ lý GreenLife</h4>
                <span className="text-[9px] text-stone-400 font-medium flex items-center gap-1 mt-1">
                  Hướng dẫn website và chăm sóc cây
                </span>
              </div>
            </div>
            <button
              onClick={handleToggle}
              aria-label="Đóng cửa sổ chat"
              className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-900 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Viewport */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/15"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                  msg.sender === "bot" 
                    ? "bg-[#5d4037] border border-[#8d6e63]/30 text-emerald-400"
                    : msg.sender === "error"
                      ? "bg-rose-950 border border-rose-800 text-rose-400"
                      : "bg-stone-800 border border-stone-700 text-stone-300"
                }`}>
                  {msg.sender === "bot" ? (
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  ) : msg.sender === "error" ? (
                    <span className="font-bold text-xs">!</span>
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Bubble Text */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-full overflow-hidden break-words ${
                    msg.sender === "user"
                      ? "bg-emerald-500 text-black rounded-tr-none font-medium"
                      : msg.sender === "error"
                        ? "bg-stone-950 border border-rose-900 text-rose-300 rounded-tl-none font-semibold"
                        : "bg-stone-950 border border-stone-850 text-stone-200 rounded-tl-none"
                  }`}>
                    {renderFormattedText(msg.text, msg.sender === "user")}

                    {/* Suggested actions inside bubble */}
                    {msg.sender === "bot" && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-stone-850">
                        {msg.suggestedActions.map((action) => {
                          const targetPage = getAllowedTargetPage(action.actionId, currentUser, userRole);
                          if (!targetPage) return null;
                          return (
                            <button
                              key={action.actionId}
                              onClick={() => setCurrentPage(targetPage)}
                              className="px-2.5 py-1 text-[10px] bg-[#6d4c41] hover:bg-[#5d4037] text-stone-100 rounded-lg transition-colors cursor-pointer font-semibold shadow-md border border-[#8d6e63]/30"
                            >
                              {action.label || "Đi tới trang"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-stone-500 font-mono block px-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isTyping && (
              <div className="flex gap-2 max-w-[80%] animate-pulse">
                <div className="w-7 h-7 rounded-full bg-[#5d4037] border border-[#8d6e63]/30 text-emerald-400 flex items-center justify-center">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="bg-stone-950 border border-stone-850 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[8px] text-stone-500 font-mono block px-1">
                    Đang chuẩn bị câu trả lời…
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts Pills */}
          <div className="px-4 py-2 border-t border-stone-850 bg-stone-950/80 max-h-28 overflow-y-auto space-y-1.5">
            <span className="text-[8px] text-stone-500 font-mono block uppercase tracking-wider">Lối tắt nhanh:</span>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {SHORTCUTS.filter(s => s.isAllowed(currentUser, userRole)).map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => handleShortcutClick(shortcut)}
                  className="px-2.5 py-1 text-[9px] bg-stone-900 border border-stone-800 text-stone-300 hover:text-emerald-400 hover:border-emerald-500/30 rounded-lg text-left transition-all cursor-pointer font-medium"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat text Input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-stone-950 border-t border-stone-850 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              disabled={isTyping}
              aria-label="Nội dung câu hỏi"
              ref={inputRef}
              className="flex-1 bg-stone-900 border border-stone-800 focus:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              aria-label="Gửi câu hỏi"
              className="w-8 h-8 rounded-full bg-[#6d4c41] hover:bg-[#5d4037] text-white shrink-0 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>

        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <div className="relative group">
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-950 text-stone-200 text-[11px] font-semibold py-1.5 px-3 rounded-lg border border-stone-800 shadow-xl whitespace-nowrap pointer-events-none z-50 transition-all duration-200">
          Trợ lý GreenLife
        </div>

        <button
          onClick={handleToggle}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border relative transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-stone-950 border-stone-800 text-[#8d6e63] hover:text-[#a1887f]"
              : "bg-[#6d4c41] border-[#8d6e63]/40 text-emerald-400 hover:bg-[#5d4037]"
          }`}
          aria-label="Hỏi Trợ lý GreenLife"
        >
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-stone-400" />
          ) : (
            <Sprout className="h-5.5 w-5.5 text-emerald-400" />
          )}
          
          {/* Unread indicator */}
          {!isOpen && hasUnread && (
            <span className="absolute top-0 right-0 flex h-4.5 w-4.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-rose-500 text-[8px] text-white font-bold font-mono items-center justify-center border border-white">
                !
              </span>
            </span>
          )}
        </button>
      </div>

    </div>
  );
};
