import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, ChevronDown, Sprout } from "lucide-react";
import { logger } from "../../utils/logger";
import { HttpClient } from "../../services/httpClient";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: string;
}

const QUICK_QUESTIONS = [
  "Tôi muốn mua cây thì làm sao?",
  "Cách đặt dịch vụ chăm sóc cây?",
  "AI chẩn đoán cây hoạt động thế nào?",
  "Làm sao tìm cửa hàng gần tôi?",
  "Tôi là chủ cửa hàng, đăng ký thế nào?"
];

const BOT_RESPONSES: Record<string, string> = {
  "Tôi muốn mua cây thì làm sao?": "Để mua cây, bạn vui lòng chuyển sang trang **Cửa Hàng** từ thanh menu chính. Chọn sản phẩm hữu cơ ưa thích để xem thông tin chi tiết và nhấn **Thêm vào giỏ hàng**. Sau đó, mở Giỏ hàng ở góc trên bên phải để kiểm tra và tiến hành thanh toán.",
  "Cách đặt dịch vụ chăm sóc cây?": "Để đặt lịch hẹn với kỹ sư sinh học, bạn vào trang **Đặt Lịch Chuyên Gia**. Chọn chuyên gia phù hợp, nhập ngày giờ và chọn hình thức: tư vấn Trực Tuyến qua Zoom hoặc Khảo Sát Tận Vườn (Offline). Nếu chọn Offline, hãy điền địa chỉ cụ thể để hệ thống điều phối nhà vườn gần bạn nhất cung ứng.",
  "AI chẩn đoán cây hoạt động thế nào?": "Tính năng **Bác Sĩ Cây AI** sử dụng trí tuệ nhân tạo để phân tích tình trạng lá bệnh. Bạn chỉ cần chụp/tải lên ảnh chụp lá bị đốm nấm hoặc sâu bệnh, AI sẽ ngay lập tức trả về tên bệnh, nguyên nhân sinh học và phác đồ hồi sinh sinh học khuyên dùng.",
  "Làm sao tìm cửa hàng gần tôi?": "Tại trang **Cửa Hàng** hoặc khi đặt lịch dịch vụ **Offline**, bạn sẽ thấy phần bản đồ sinh thái. Hãy nhập Tỉnh/Thành phố (mặc định là Đà Nẵng), Quận/Huyện và địa chỉ của bạn. Bản đồ sẽ tự động định vị và hiển thị các nhà vườn đối tác gần nhất trong khu vực giao hàng.",
  "Tôi là chủ cửa hàng, đăng ký thế nào?": "Bạn có thể vào trang tài khoản bằng cách click biểu tượng **Tài Khoản** (hình người) trên navbar, chuyển sang tab **Đăng Ký** và tích chọn **Chủ cửa hàng**. Điền thông tin đăng ký để có thể đăng bán sản phẩm và nhận lịch hẹn khảo sát thực địa."
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

  // Split by newlines
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const content = line.trim();
        
        // Handle headers
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

        // Handle Bullet Points
        if (content.startsWith("*") || content.startsWith("-")) {
          const bulletText = content.replace(/^[\*\-]\s*/, "");
          return (
            <div key={idx} className="flex gap-1.5 pl-1.5 text-xs">
              <span className="text-emerald-500 shrink-0">•</span>
              <span className="flex-1 text-stone-250">{renderBoldText(bulletText, isUser)}</span>
            </div>
          );
        }

        // Standard line
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

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! Tôi là Trợ lý Cây Trồng GreenLife. Tôi có thể hỗ trợ bạn chẩn đoán bệnh lá cây qua AI, tìm mua cây giống hữu cơ, hoặc đặt lịch kỹ sư chăm sóc vườn cảnh tận nơi. Bạn cần trợ giúp gì nào?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text: string, isUserText = true) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      text: text,
      sender: isUserText ? "user" : "bot",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    if (isUserText) {
      // Simulate typing state
      setIsTyping(true);
      
      // If it's a predefined static app tour question, respond locally instantly
      if (BOT_RESPONSES[text]) {
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `reply-${Date.now()}`,
              text: BOT_RESPONSES[text],
              sender: "bot",
              timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            }
          ]);
        }, 600);
      } else {
        // Otherwise, send a real API request to our tuned AI Doctor chat endpoint
        HttpClient.post("/api/ai/chat", { question: text })
          .then((data) => {
            setIsTyping(false);
            const replyText = data.success && data.answer
              ? data.answer
              : "Rất tiếc, bộ não AI đang bận xử lý hoặc gặp sự cố kết nối. Bạn vui lòng thử lại sau giây lát.";
            
            setMessages((prev) => [
              ...prev,
              {
                id: `reply-${Date.now()}`,
                text: replyText,
                sender: "bot",
                timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              }
            ]);
          })
          .catch((err) => {
            logger.error("Chatbot API error:", err);
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: `reply-${Date.now()}`,
                text: "Rất tiếc, kết nối mạng không ổn định hoặc có lỗi hệ thống xử lý chat. Bạn vui lòng thử lại sau.",
                sender: "bot",
                timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              }
            ]);
          });
      }
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const chatbotBackendSupported = false;
  if (!chatbotBackendSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* CHAT WINDOW CONTAINER */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-stone-950 border border-stone-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Banner */}
          <div className="bg-[#5d4037]/90 px-4 py-3 border-b border-[#8d6e63]/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Sprout className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-100 leading-none">Trợ lý Cây Trồng GreenLife</h4>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Đang trực tuyến
                </span>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-900 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/15">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                  msg.sender === "bot" 
                    ? "bg-[#5d4037] border border-[#8d6e63]/30 text-emerald-400"
                    : "bg-stone-800 border border-stone-700 text-stone-300"
                }`}>
                  {msg.sender === "bot" ? <Sprout className="w-3.5 h-3.5 text-emerald-400" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble Text */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-full overflow-hidden ${
                    msg.sender === "user"
                      ? "bg-emerald-500 text-black rounded-tr-none font-medium"
                      : "bg-stone-950 border border-stone-850 text-stone-200 rounded-tl-none"
                  }`}>
                    {renderFormattedText(msg.text, msg.sender === "user")}
                  </div>
                  <span className="text-[8px] text-stone-500 font-mono block px-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 max-w-[80%]">
                <div className="w-7 h-7 rounded-full bg-[#5d4037] border border-[#8d6e63]/30 text-emerald-400 flex items-center justify-center">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="bg-stone-950 border border-stone-850 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Pills */}
          <div className="px-4 py-2 border-t border-stone-850 bg-stone-950/80 max-h-28 overflow-y-auto space-y-1.5">
            <span className="text-[8px] text-stone-500 font-mono block uppercase tracking-wider">Gợi ý câu hỏi:</span>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  className="px-2.5 py-1 text-[9px] bg-stone-900 border border-stone-800 text-stone-300 hover:text-emerald-400 hover:border-emerald-500/30 rounded-lg text-left transition-all cursor-pointer font-medium"
                >
                  {question}
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
              className="flex-1 bg-stone-900 border border-stone-800 focus:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#6d4c41] hover:bg-[#5d4037] text-white shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>

        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <div className="relative group">
        {/* Hover Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-950 text-stone-200 text-[11px] font-semibold py-1.5 px-3 rounded-lg border border-stone-800 shadow-xl whitespace-nowrap pointer-events-none z-50 transition-all duration-200">
          Trợ lý Cây Trồng GreenLife
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
            <Sprout className="h-5.5 w-5.5 text-emerald-400 animate-pulse" />
          )}
          
          {/* Pulsing online badge */}
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
