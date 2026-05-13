import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { chatbotApi } from "../../api";

const welcome = {
  role: "bot",
  text: "Hi, I can help with login, signup, submitting complaints, tracking tickets, and attachments.",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([welcome]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((items) => [...items, { role: "user", text }]);
    setLoading(true);
    try {
      const { data } = await chatbotApi.ask(text);
      setMessages((items) => [...items, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((items) => [
        ...items,
        { role: "bot", text: "I could not reach the help service. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <section className="mb-3 w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
                <Bot size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Citizen Help</p>
                <p className="text-xs text-gray-500">AI assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close citizen help"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-5 ${
                    message.role === "user"
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {loading && <p className="text-xs text-gray-400">Thinking...</p>}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-100 p-3">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-3"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open citizen help"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
