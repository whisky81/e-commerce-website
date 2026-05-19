import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import useShopContext from "../hooks/useShopContext";

const INITIAL_MESSAGE = {
  role: "model",
  text: "Xin chào! Mình là trợ lý ảo của shop. Mình có thể giúp gì cho bạn hôm nay? 😊",
};

/** Sanitize đơn giản: chỉ cho phép các tag an toàn từ AI của shop */
const ALLOWED_TAGS = /^(a|b|br|ul|ol|li|p|span|strong|em|div|h3|h4)$/i;
const sanitizeHtml = (html) => {
  // Strip script/style tags và các tag nguy hiểm
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")   // xóa event handlers
    .replace(/javascript:/gi, "");
};

/** Render tin nhắn: AI trả về HTML, user trả về plain text */
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-black text-white text-[13.5px] leading-relaxed shadow-sm">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className="chat-html-content max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-gray-100 text-gray-800 text-[13.5px] leading-relaxed shadow-sm"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }}
      />
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const Chatbot = () => {
  const { backendUrl } = useShopContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input khi mở chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      const newMessages = [...messages, { role: "user", text }];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      try {
        const { data } = await axios.post(`${backendUrl}/api/chat`, {
          messages: newMessages,
        });
        if (data.success) {
          setMessages((prev) => [...prev, data.data]);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau nhé! 🙏",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, backendUrl]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) sendMessage(e);
  };

  return (
    <>
      {/* CSS cho HTML content từ AI */}
      <style>{`
        .chat-html-content a.chat-link,
        .chat-html-content a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 500;
        }
        .chat-html-content a:hover { color: #1d4ed8; }
        .chat-html-content ul,
        .chat-html-content ol {
          padding-left: 1.1rem;
          margin: 0.35rem 0;
        }
        .chat-html-content li { margin-bottom: 0.2rem; }
        .chat-html-content b,
        .chat-html-content strong { font-weight: 600; }
        .chat-html-content p { margin: 0.25rem 0; }
        .chat-html-content h3,
        .chat-html-content h4 {
          font-weight: 600;
          margin: 0.4rem 0 0.2rem;
        }
        .chat-html-content br { line-height: 1.8; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Toggle button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Mở chatbot"
            className="bg-black text-white w-14 h-14 rounded-full shadow-2xl hover:bg-gray-800 transition-transform hover:scale-105 flex items-center justify-center border-2 border-white"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}

        {/* Chat window */}
        {isOpen && (
          <div className="bg-white w-[340px] sm:w-[380px] h-[520px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="font-semibold text-sm tracking-wide">Trợ lý AI</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chatbot"
                className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#f8fafc] flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} msg={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi trợ lý AI..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-full text-[13.5px] focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  aria-label="Gửi"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chatbot;