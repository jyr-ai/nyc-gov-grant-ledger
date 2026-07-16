import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Loader2,
  User,
  Wrench,
  Database,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Minus
} from "lucide-react";
import { fetchApi } from "../lib/apiError";

interface ToolCall {
  name: string;
  args: Record<string, any>;
  resultPreview: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  provider?: string;
  error?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How much did the Doe Fund (EIN 13-3412540) receive across FY2015–FY2027?",
  "List FY2027 CASA awards sponsored by Abreu.",
  "What capital projects did Council Member Restler sponsor in FY2026?",
  "Which fiscal years have EIN-level award data?"
];

// One tool-call row in the expandable "data lookups" trace under an answer.
function ToolCallTrace({ calls }: { calls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (!calls.length) return null;
  return (
    <div className="mt-2 border border-[#1A1A1A]/15 bg-[#F0EEE6] rounded-none" id="agent-tool-trace">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#003B71] hover:bg-[#F0EEE6]/60 cursor-pointer"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Database className="w-3.5 h-3.5 text-[#F27D26]" />
        <span>
          {calls.length} live MCP {calls.length === 1 ? "lookup" : "lookups"}
        </span>
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-2.5">
          {calls.map((c, i) => (
            <div key={i} className="border-l-2 border-[#F27D26] pl-2.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-[#1A1A1A] flex-wrap">
                <Wrench className="w-3 h-3 text-[#003B71] shrink-0" />
                {c.name}
                <span className="text-[#777] font-normal break-all">
                  ({Object.entries(c.args)
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join(", ") || "no args"})
                </span>
              </div>
              <pre className="mt-1 text-[9.5px] leading-relaxed bg-[#1A1A1A] text-[#E5E3DB] p-2 overflow-auto max-h-36 whitespace-pre-wrap break-words font-mono">
                {c.resultPreview}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BudgetAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, open]);

  // Focus the composer when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    const { ok, data, report } = await fetchApi("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, history })
    });

    setLoading(false);

    if (ok && data?.answer !== undefined) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "(no answer returned)",
          toolCalls: data.toolCalls || [],
          provider: data.provider
        }
      ]);
    } else {
      const detail =
        data?.details || data?.error || report?.explanation || "The Budget Agent request failed.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${detail}`, error: true }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end" id="budget-agent-widget">
      {/* Chat panel */}
      {open && (
        <div
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] bg-[#F9F8F3] border-2 border-[#1A1A1A] shadow-[6px_6px_0px_0px_#1A1A1A] rounded-none flex flex-col overflow-hidden"
          style={{ height: "min(78vh, 620px)" }}
          id="budget-agent-panel"
          role="dialog"
          aria-label="Budget Agent chat"
        >
          {/* Header */}
          <div className="bg-[#1A1A1A] text-[#F9F8F3] px-4 py-3 flex items-center justify-between shrink-0" id="agent-panel-header">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#F27D26] p-1.5 rounded-none shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-serif font-black italic text-base text-white">Budget Agent</div>
                <div className="text-[8.5px] font-mono uppercase tracking-widest text-[#F27D26]">
                  Live BetaNYC NYC-Budget MCP
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-none transition-colors cursor-pointer"
                title="Minimize"
                aria-label="Minimize chat"
                id="agent-minimize-btn"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" id="agent-messages">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-2" id="agent-empty-state">
                <Sparkles className="w-8 h-8 text-[#F27D26] mb-2.5" />
                <h4 className="font-serif font-black text-base text-[#1A1A1A]">Ask about NYC funding</h4>
                <p className="text-[11px] text-[#555] leading-relaxed mt-1 mb-4">
                  Every answer is looked up live through BetaNYC's MCP — real Schedule C awards,
                  capital projects, and more. Try:
                </p>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="text-left text-[11px] leading-snug bg-[#F0EEE6] hover:bg-white border border-[#1A1A1A]/20 hover:border-[#F27D26] px-3 py-2 rounded-none transition-colors cursor-pointer text-[#1A1A1A]"
                      id={`agent-suggestion-${i}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`} id={`agent-msg-${i}`}>
                <div
                  className={`w-7 h-7 rounded-none flex items-center justify-center shrink-0 border-2 border-[#1A1A1A] ${
                    m.role === "user" ? "bg-[#003B71]" : m.error ? "bg-red-600" : "bg-[#F27D26]"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : m.error ? (
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className={`max-w-[85%] flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-none border text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#003B71] text-white border-[#003B71]"
                        : m.error
                        ? "bg-[#F0EEE6] text-[#1A1A1A] border-red-600"
                        : "bg-white text-[#1A1A1A] border-[#1A1A1A]/20"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && !m.error && m.toolCalls && m.toolCalls.length > 0 && (
                    <ToolCallTrace calls={m.toolCalls} />
                  )}
                  {m.role === "assistant" && !m.error && m.provider && (
                    <span className="text-[8.5px] font-mono uppercase tracking-wider text-[#999] mt-1">
                      via {m.provider} + BetaNYC MCP
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5" id="agent-loading">
                <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 border-2 border-[#1A1A1A] bg-[#F27D26]">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3 py-2 rounded-none border border-[#1A1A1A]/20 bg-white flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#F27D26] animate-spin" />
                  <span className="text-[11px] text-[#555] font-mono">Querying budget data…</span>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="border-t-2 border-[#1A1A1A] p-2.5 flex items-end gap-2 shrink-0" id="agent-composer">
            <textarea
              ref={inputRef}
              id="agent-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about an org, EIN, member, or year…"
              className="flex-1 resize-none text-[13px] px-3 py-2 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-white text-[#1A1A1A] max-h-28"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="py-2 px-3.5 bg-[#1A1A1A] hover:bg-[#F27D26] disabled:opacity-40 text-white rounded-none border-2 border-[#1A1A1A] transition-all cursor-pointer flex items-center gap-2 shrink-0"
              id="agent-send-btn"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      {/* Launcher pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-full border-2 border-[#1A1A1A] font-bold uppercase tracking-widest text-xs transition-all cursor-pointer shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-[1px_1px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] ${
          open ? "bg-[#1A1A1A] text-white" : "bg-[#F27D26] text-white"
        }`}
        id="agent-launcher"
        aria-expanded={open}
        aria-controls="budget-agent-panel"
      >
        {open ? (
          <>
            <X className="w-4 h-4 shrink-0" />
            <span>Close</span>
          </>
        ) : (
          <>
            <Bot className="w-4 h-4 shrink-0" />
            <span className="font-serif italic font-bold normal-case tracking-normal text-sm">Budget Agent</span>
          </>
        )}
      </button>
    </div>
  );
}
