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
  ChevronRight
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
  "List FY2027 CASA (Cultural After-School Adventure) awards sponsored by Abreu.",
  "What capital projects did Council Member Restler sponsor in FY2026?",
  "Which fiscal years have EIN-level award data available?"
];

// One tool-call row in the expandable "data lookups" trace under an answer.
function ToolCallTrace({ calls }: { calls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (!calls.length) return null;
  return (
    <div className="mt-3 border border-[#1A1A1A]/15 bg-[#F0EEE6] rounded-none" id="agent-tool-trace">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#003B71] hover:bg-[#F0EEE6]/60 cursor-pointer"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Database className="w-3.5 h-3.5 text-[#F27D26]" />
        <span>
          {calls.length} live MCP data {calls.length === 1 ? "lookup" : "lookups"} · BetaNYC NYC-Budget
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          {calls.map((c, i) => (
            <div key={i} className="border-l-2 border-[#F27D26] pl-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#1A1A1A]">
                <Wrench className="w-3 h-3 text-[#003B71]" />
                {c.name}
                <span className="text-[#777] font-normal">
                  ({Object.entries(c.args)
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join(", ") || "no args"})
                </span>
              </div>
              <pre className="mt-1 text-[10px] leading-relaxed bg-[#1A1A1A] text-[#E5E3DB] p-2 overflow-auto max-h-40 whitespace-pre-wrap break-words font-mono">
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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
        {
          role: "assistant",
          content: `⚠️ ${detail}`,
          error: true
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="space-y-6" id="budget-agent-section">
      {/* Header */}
      <div className="bg-[#1A1A1A] text-[#F9F8F3] p-6 rounded-none border-4 border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="budget-agent-header">
        <div className="flex items-start gap-3">
          <div className="bg-[#F27D26] p-2 rounded-none shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold bg-[#F27D26] text-white px-2 py-0.5 uppercase tracking-widest">Live Data Agent</span>
            <h3 className="text-2xl font-serif font-black italic text-white mt-1.5">Budget Agent</h3>
            <p className="text-xs text-[#E5E3DB] leading-relaxed max-w-xl mt-1">
              Ask anything about NYC Council discretionary funding. The agent answers by calling
              BetaNYC's official <span className="font-bold text-[#F27D26]">NYC-Budget MCP</span> tools
              live — real Schedule C awards (FY2015–FY2027), §254 capital projects, Transparency
              Resolutions, and Terms &amp; Conditions — so every figure is traced to the source.
            </p>
          </div>
        </div>
      </div>

      {/* Chat surface */}
      <div className="bg-[#F9F8F3] border border-[#1A1A1A] rounded-none flex flex-col" id="budget-agent-chat" style={{ height: "min(70vh, 640px)" }}>
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5" id="agent-messages">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6" id="agent-empty-state">
              <Sparkles className="w-10 h-10 text-[#F27D26] mb-3" />
              <h4 className="font-serif font-black text-lg text-[#1A1A1A]">Ask the Budget Agent</h4>
              <p className="text-xs text-[#555] max-w-md leading-relaxed mt-1.5 mb-5">
                It looks up real records through BetaNYC's MCP before answering. Try one of these:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="text-left text-[11px] leading-snug bg-[#F0EEE6] hover:bg-white border border-[#1A1A1A]/20 hover:border-[#F27D26] px-3 py-2.5 rounded-none transition-colors cursor-pointer text-[#1A1A1A]"
                    id={`agent-suggestion-${i}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`} id={`agent-msg-${i}`}>
              <div
                className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border-2 border-[#1A1A1A] ${
                  m.role === "user" ? "bg-[#003B71]" : m.error ? "bg-red-600" : "bg-[#F27D26]"
                }`}
              >
                {m.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : m.error ? (
                  <AlertCircle className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-4 py-3 rounded-none border text-sm leading-relaxed whitespace-pre-wrap ${
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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#999] mt-1.5">
                    via {m.provider} + BetaNYC MCP
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3" id="agent-loading">
              <div className="w-8 h-8 rounded-none flex items-center justify-center shrink-0 border-2 border-[#1A1A1A] bg-[#F27D26]">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-none border border-[#1A1A1A]/20 bg-white flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#F27D26] animate-spin" />
                <span className="text-xs text-[#555] font-mono">Querying BetaNYC budget data…</span>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="border-t border-[#1A1A1A] p-3 flex items-end gap-2" id="agent-composer">
          <textarea
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
            placeholder="Ask about an org, EIN, council member, initiative, or fiscal year…"
            className="flex-1 resize-none text-sm px-3.5 py-2.5 rounded-none border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] transition-all bg-[#F9F8F3] text-[#1A1A1A] max-h-32"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="py-2.5 px-4 bg-[#1A1A1A] hover:bg-[#F27D26] disabled:opacity-40 text-white rounded-none font-bold uppercase tracking-widest border-2 border-[#1A1A1A] transition-all cursor-pointer flex items-center gap-2 shrink-0"
            id="agent-send-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <p className="text-[10px] text-[#777] font-mono leading-relaxed" id="agent-footnote">
        The Budget Agent runs an agentic tool-use loop server-side (Google Gemini primary, Anthropic
        Claude fallback) over the 7 tools published by
        <a href="https://github.com/BetaNYC/New-York-City-Budget/tree/main/mcp" target="_blank" rel="noopener noreferrer" className="underline text-[#003B71] mx-1">@betanyc/nyc-budget-mcp</a>.
        Expand "MCP data lookups" under any answer to see the exact tool calls and raw records used.
      </p>
    </div>
  );
}
