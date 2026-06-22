import { useState, useRef, useCallback } from "react";
import {
  BookOpen, Brain, BarChart3, User, Upload, Link2,
  ChevronRight, Zap, Target, Clock, TrendingUp,
  CheckCircle, XCircle, Menu, X, Flame, Calendar,
  Award, RefreshCw, Send, Globe, FileUp, AlignLeft,
  Sparkles, ArrowLeft, ArrowRight, Star, Eye,
  Mail, LogOut, Play
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Page = "hero" | "email" | "upload" | "home" | "explain" | "quiz" | "progress" | "profile";
type Level = "beginner" | "exam" | "analogy";
type InputMode = "text" | "url" | "upload";
type QuizPhase = "setup" | "active" | "done";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ExplainResult {
  title: string;
  hook: string;
  concepts: { name: string; desc: string }[];
  body: string[];
  example: string;
  practice: string[];
}

interface StudySession {
  date: string;
  type: "explain" | "quiz";
  topic: string;
  score?: number;
}

interface Profile {
  name: string;
  email: string;
  goal: string;
  subjects: string[];
}

// ─── Storage helpers ────────────────────────────────────────────────────────────

function loadProfile(email: string, name: string): Profile {
  try {
    const raw = localStorage.getItem("scribemind_profile");
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return { name, email, goal: "Master complex topics through simple explanations", subjects: ["Computer Science", "Biology"] };
}

function saveProfile(p: Profile) {
  localStorage.setItem("scribemind_profile", JSON.stringify(p));
}

function loadSessions(): StudySession[] {
  try { return JSON.parse(localStorage.getItem("scribemind_sessions") ?? "[]"); } catch { return []; }
}

function saveSessions(s: StudySession[]) {
  localStorage.setItem("scribemind_sessions", JSON.stringify(s));
}

function addSession(session: StudySession) {
  const s = loadSessions();
  s.unshift(session);
  saveSessions(s.slice(0, 50));
}

// ─── AI mock helpers ────────────────────────────────────────────────────────────

function getTopic(text: string) {
  return text.replace(/https?:\/\/[^\s]+/g, "").trim().split(/\s+/).slice(0, 5).join(" ") || "this concept";
}

function generateExplanation(text: string, level: Level): ExplainResult {
  const topic = getTopic(text);
  const t = topic.charAt(0).toUpperCase() + topic.slice(1);

  if (level === "beginner") return {
    title: `${t} — Explained Simply`,
    hook: `Imagine you just walked into a room and someone mentioned "${topic}" — you nod politely but have no idea what it means. Let's fix that right now, starting from zero.`,
    concepts: [
      { name: "The Core Idea", desc: `${t} is fundamentally about a process that helps achieve a specific outcome. Think of it like a recipe — every ingredient has a purpose.` },
      { name: "Why It Matters", desc: `Without understanding ${topic}, you might miss how the whole system fits together. It's the missing puzzle piece.` },
      { name: "The Key Parts", desc: `There are usually 3 main parts: the input (what goes in), the process (what happens), and the output (what comes out).` },
      { name: "Common Mistakes", desc: `Most beginners confuse ${topic} with something more complicated. It's actually simpler once you see the pattern.` },
    ],
    body: [
      `Let's break ${topic} down into something you can picture. Imagine a simple machine: raw materials go in, get transformed, and useful products come out. That's the essence.`,
      `The same core principle applies across many different situations. Once you truly understand it at this level, applying it to harder problems becomes almost automatic.`,
    ],
    example: `Real-world scenario: When you organize a school library — categorizing books, creating a lookup system, retrieving them efficiently — that whole workflow mirrors exactly how ${topic} works.`,
    practice: [
      `What is the main purpose of ${topic} in your own words?`,
      `Can you think of one example where ${topic} appears in daily life?`,
      `What would happen if the key component of ${topic} was missing?`,
    ],
  };

  if (level === "exam") return {
    title: `${t} — Exam-Ready Deep Dive`,
    hook: `For examination purposes, ${topic} must be understood at both a conceptual and applied level. This breakdown covers definition, mechanisms, edge cases, and likely exam angles.`,
    concepts: [
      { name: "Formal Definition", desc: `${t} refers to the systematic process by which a defined input undergoes structured transformation according to a set of rules to produce a deterministic output.` },
      { name: "Underlying Mechanism", desc: `The mechanism operates through three sequential phases: initialization, iterative processing, and termination condition evaluation.` },
      { name: "Critical Properties", desc: `Key properties include idempotency (repeated application yields same result), commutativity, and associativity under defined operations.` },
      { name: "Edge Cases", desc: `Boundary conditions: null/empty inputs, maximum capacity, concurrent access patterns, and error propagation through nested structures.` },
    ],
    body: [
      `${t} operates within a formal framework expressible as f(x) → y where x is the input domain and y the output range, subject to constraints C = {c₁, c₂, ..., cₙ}.`,
      `Computational complexity is typically O(n log n) average case. Space complexity O(n) auxiliary. These bounds derive from recursive decomposition into sub-problems.`,
    ],
    example: `Exam application: You may be asked to "Analyze the time complexity of ${topic} on sorted vs. unsorted data." The expected answer traces the algorithm, states T(n) = 2T(n/2) + O(n), applies the Master Theorem, concludes O(n log n).`,
    practice: [
      `Derive the recurrence relation for ${topic} and solve using the Master Theorem.`,
      `Compare ${topic} with two alternative approaches, discussing trade-offs.`,
      `Trace ${topic} step-by-step showing all intermediate states for a given input.`,
    ],
  };

  return {
    title: `${t} — Through Real-Life Analogies`,
    hook: `Forget textbooks. Let's understand ${topic} through things you already know — because the best understanding is the kind that actually sticks.`,
    concepts: [
      { name: "The GPS Analogy", desc: `${t} works like GPS navigation: starting point, destination, and the system finds the optimal path — recalculating when conditions change.` },
      { name: "The Chef's Kitchen", desc: `Like a professional kitchen: mise en place (preparation), cooking sequence (process), and plating (output). Each step must happen in order.` },
      { name: "The Orchestra", desc: `Like a conductor directing an orchestra, ${topic} coordinates multiple independent elements to produce a unified result.` },
      { name: "The Postal System", desc: `Messages are packaged, addressed, routed through intermediaries, and delivered — with error correction when something goes wrong.` },
    ],
    body: [
      `You've been using the mental model for ${topic} for years — you just didn't have a name for it. Every time you planned a road trip or sorted your playlist, you were applying the same underlying logic.`,
      `The power of ${topic} comes from reducing complexity. Instead of one giant decision, you break it into smaller choices. Each choice is easy. The combination is powerful.`,
    ],
    example: `Picture a barista during morning rush. Orders come rapidly (input stream), prioritized by complexity (processing logic), drinks delivered to maximize throughput (output optimization). That's ${topic} in real life, every morning.`,
    practice: [
      `Create your own analogy for ${topic} using something from your daily routine.`,
      `Where have you encountered ${topic} without knowing it? Identify two real examples.`,
      `Explain ${topic} to an imaginary 10-year-old in under 4 sentences.`,
    ],
  };
}

const QUIZ_BANK: QuizQuestion[] = [
  { question: "Which best describes the primary purpose of TOPIC?", options: ["Increase system complexity", "Transform inputs into useful outputs through a defined process", "Eliminate structured thinking", "Replace human judgment"], correct: 1, explanation: "The core purpose is transformation — taking raw state and processing it into something useful." },
  { question: "What is the first step when applying TOPIC to a new problem?", options: ["Immediately implement the solution", "Identify and define the input and desired output", "Choose the fastest algorithm", "Ignore edge cases"], correct: 1, explanation: "Before anything else, understand what you're starting with and what you want to achieve." },
  { question: "Why do edge cases matter when working with TOPIC?", options: ["They don't — edge cases are rare", "They represent the majority of cases", "Unhandled edge cases cause production failures", "Only matter academically"], correct: 2, explanation: "Edge cases are where systems break. Handling them proactively separates demos from production-ready systems." },
  { question: "Which analogy best captures TOPIC?", options: ["A locked door with no key", "A recipe transforming raw ingredients into a finished dish", "Random noise with no pattern", "A photograph that never changes"], correct: 1, explanation: "The recipe analogy captures defined inputs, a step-by-step process, and a consistent output." },
  { question: "What does 'time complexity' measure in TOPIC?", options: ["How long it takes to learn", "How operations grow relative to input size", "Clock time elapsed", "Topic difficulty rating"], correct: 1, explanation: "Time complexity measures how an algorithm's performance scales with input size, expressed in Big O notation." },
  { question: "Which statement about iterative vs. recursive approaches is most accurate?", options: ["Iterative is always faster", "Recursive always uses less memory", "Both have trade-offs depending on problem structure", "Recursion is only academic"], correct: 2, explanation: "Neither is universally better. Recursive is elegant but can stack overflow; iterative has predictable memory." },
  { question: "When would you prioritize space over time complexity?", options: ["When memory is the limiting resource", "Always — space is more important", "Never — speed always wins", "Only with sorted data"], correct: 0, explanation: "In memory-constrained environments (IoT, real-time), trading speed for lower memory is the right call." },
  { question: "What does 'idempotent' mean in TOPIC context?", options: ["Operation fails on first attempt", "Applying multiple times equals applying once", "Process runs faster each call", "Function with no inputs or outputs"], correct: 1, explanation: "Idempotency is critical in distributed systems — repeating an operation doesn't cause unintended side effects." },
  { question: "What is the best practice when documenting TOPIC for a team?", options: ["Avoid documentation for agility", "Write dense mathematical proofs only", "Provide clear examples alongside the formal definition", "Use only diagrams"], correct: 2, explanation: "Effective documentation combines formal precision with concrete examples for readers at different levels." },
  { question: "What is the relationship between abstraction and TOPIC?", options: ["Abstraction makes it harder", "Abstraction hides unnecessary details, making it easier to apply", "They are unrelated", "Abstraction is only for OOP"], correct: 1, explanation: "Abstraction lets you work at a high level without getting lost in implementation details." },
];

function generateQuiz(text: string): QuizQuestion[] {
  const topic = `"${getTopic(text)}"`;
  return QUIZ_BANK.map((q) => ({ ...q, question: q.question.replace("TOPIC", topic) }));
}

function getProgressData(sessions: StudySession[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const day = sessions.filter((s) => s.date === dateStr);
    const scores = day.filter((s) => s.score != null).map((s) => s.score as number);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      activity: day.length,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  });
}

// ─── Shared: Video Background ───────────────────────────────────────────────────

function VideoBg({ shade = 0.55 }: { shade?: number }) {
  return (
    <>
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `rgba(0, 18, 30, ${shade})` }} />
    </>
  );
}

// ─── Hero Page ──────────────────────────────────────────────────────────────────

function HeroPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBg shade={0.3} />
      <nav className="relative z-10 max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <span className="text-3xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
          SCRIBEMIND
        </span>
        <div className="hidden md:flex items-center gap-8">
          {["Home", "Features", "About", "Pricing"].map((item, i) => (
            <a key={item} href="#" className={`text-sm transition-colors ${i === 0 ? "text-white" : "text-white/50 hover:text-white"}`}>{item}</a>
          ))}
        </div>
        <button onClick={onStart} className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform cursor-pointer">
          Begin Journey
        </button>
      </nav>

      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-40">
        <div className="animate-fade-rise inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(178,80%,65%)" }} />
          <span className="text-xs text-white/70 tracking-wide uppercase">Explain Like I&apos;m New</span>
        </div>

        <h1
          className="animate-fade-rise text-5xl sm:text-7xl md:text-[5.5rem] leading-[0.92] tracking-[-2.5px] max-w-5xl font-normal text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where confusion becomes{" "}
          <em className="not-italic" style={{ color: "rgba(255,255,255,0.4)" }}>deep understanding.</em>
        </h1>

        <p className="animate-fade-rise-delay text-white/55 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed">
          SCRIBEMIND transforms your notes, PDFs, and links into clear explanations and sharp quizzes — for minds that refuse to stop at memorizing.
        </p>

        <div className="animate-fade-rise-delay-2 flex flex-col sm:flex-row items-center gap-4 mt-12">
          <button
            onClick={onStart}
            className="liquid-glass rounded-full px-14 py-5 text-base text-white hover:scale-[1.03] transition-transform cursor-pointer"
          >
            Start Learning
          </button>
          <button className="flex items-center gap-2 text-white/45 text-sm hover:text-white/70 transition-colors">
            <Eye className="w-4 h-4" /> Watch demo
          </button>
        </div>

        <div className="animate-fade-rise-delay-3 flex flex-wrap justify-center gap-3 mt-16">
          {["Notes → Explanations", "PDF Parsing", "URL Summaries", "Smart Quizzes", "Progress Tracking"].map((f) => (
            <span key={f} className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/55">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Email Onboarding ───────────────────────────────────────────────────────────

function EmailPage({ onNext }: { onNext: (name: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const valid = name.trim().length > 1 && email.includes("@");

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <VideoBg shade={0.65} />
      <div className="relative z-10 w-full max-w-md animate-fade-rise">
        <div className="text-center mb-10">
          <span className="text-2xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            SCRIBEMIND
          </span>
          <h2
            className="mt-6 text-4xl sm:text-5xl leading-tight font-normal text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Welcome, curious<br />
            <em className="not-italic" style={{ color: "hsl(178,80%,60%)" }}>learner.</em>
          </h2>
          <p className="mt-3 text-white/45 text-sm">Tell us a bit about yourself to get started.</p>
        </div>

        <div
          className="rounded-3xl p-8 space-y-5"
          style={{
            background: "rgba(0,30,50,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wide">Your Name</label>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <User className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wide">Email Address</label>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@student.edu"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
                onKeyDown={(e) => e.key === "Enter" && valid && onNext(name.trim(), email.trim())}
              />
            </div>
          </div>

          <button
            onClick={() => valid && onNext(name.trim(), email.trim())}
            disabled={!valid}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-35 hover:opacity-90 active:scale-[0.98] mt-2"
            style={{ background: "hsl(178,80%,40%)", color: "hsl(201,100%,6%)" }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(178,80%,50%)" }} />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ─── Upload / Input Onboarding ──────────────────────────────────────────────────

function UploadPage({ onNext }: { onNext: (material: string) => void }) {
  const [mode, setMode] = useState<"text" | "url" | "file">("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const getMaterial = () => mode === "url" ? url : text;
  const valid = getMaterial().trim().length > 5;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <VideoBg shade={0.65} />
      <div className="relative z-10 w-full max-w-lg animate-fade-rise">
        <div className="text-center mb-8">
          <span className="text-2xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>SCRIBEMIND</span>
          <h2
            className="mt-5 text-4xl sm:text-5xl leading-tight font-normal text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Load your<br />
            <em className="not-italic" style={{ color: "hsl(250,70%,70%)" }}>study material.</em>
          </h2>
          <p className="mt-3 text-white/45 text-sm">Paste notes, a URL, or upload a file — we&apos;ll do the rest.</p>
        </div>

        <div
          className="rounded-3xl p-6 space-y-5"
          style={{
            background: "rgba(0,30,50,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {[
              { id: "text" as const, label: "Paste Text", icon: AlignLeft },
              { id: "url" as const, label: "URL", icon: Globe },
              { id: "file" as const, label: "Upload File", icon: FileUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${mode === id ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {mode === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes, a paragraph from a textbook, lecture content..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white/85 leading-relaxed resize-none outline-none placeholder:text-white/25 min-h-[180px]"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          )}

          {mode === "url" && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Link2 className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
              />
            </div>
          )}

          {mode === "file" && (
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors hover:bg-white/06"
              style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.12)" }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,106,245,0.2)" }}>
                <Upload className="w-6 h-6" style={{ color: "hsl(250,70%,70%)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/65">{fileName || "Drop a PDF, TXT, or MD file"}</p>
                <p className="text-xs text-white/30 mt-0.5">Click to browse your files</p>
              </div>
              <input ref={fileRef} type="file" accept=".txt,.pdf,.md" className="hidden" onChange={handleFile} />
            </div>
          )}

          <button
            onClick={() => valid && onNext(getMaterial())}
            disabled={!valid}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-35 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "hsl(250,70%,55%)", color: "white" }}
          >
            <Sparkles className="w-4 h-4" /> Start Learning
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(250,70%,65%)" }} />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ─── Home Dashboard ─────────────────────────────────────────────────────────────

const FEATURE_CARDS = [
  {
    id: "explain" as Page,
    label: "Explain It",
    tagline: "Turn any material into crystal-clear understanding",
    icon: BookOpen,
    accent: "hsl(178,80%,48%)",
    glow: "rgba(0,217,197,0.18)",
    grad: "linear-gradient(135deg, rgba(0,217,197,0.12) 0%, rgba(0,40,60,0.7) 100%)",
    border: "rgba(0,217,197,0.25)",
    tag: "AI Explanations",
  },
  {
    id: "quiz" as Page,
    label: "Quiz Me",
    tagline: "Test yourself with smart adaptive questions",
    icon: Brain,
    accent: "hsl(250,70%,65%)",
    glow: "rgba(124,106,245,0.18)",
    grad: "linear-gradient(135deg, rgba(124,106,245,0.12) 0%, rgba(20,10,50,0.7) 100%)",
    border: "rgba(124,106,245,0.25)",
    tag: "10 Questions",
  },
  {
    id: "progress" as Page,
    label: "My Progress",
    tagline: "Track your learning journey and study streak",
    icon: BarChart3,
    accent: "hsl(40,90%,60%)",
    glow: "rgba(245,185,50,0.18)",
    grad: "linear-gradient(135deg, rgba(245,185,50,0.12) 0%, rgba(40,25,0,0.7) 100%)",
    border: "rgba(245,185,50,0.25)",
    tag: "Analytics",
  },
  {
    id: "profile" as Page,
    label: "My Profile",
    tagline: "Manage goals, subjects, and your achievements",
    icon: User,
    accent: "hsl(320,70%,65%)",
    glow: "rgba(220,80,180,0.18)",
    grad: "linear-gradient(135deg, rgba(220,80,180,0.12) 0%, rgba(40,5,30,0.7) 100%)",
    border: "rgba(220,80,180,0.25)",
    tag: "Profile",
  },
];

function HomePage({ name, studyMaterial, onNav }: { name: string; studyMaterial: string; onNav: (p: Page) => void }) {
  const topic = getTopic(studyMaterial);
  const sessions = loadSessions();
  const quizSessions = sessions.filter((s) => s.type === "quiz" && s.score != null);
  const avgScore = quizSessions.length ? Math.round(quizSessions.reduce((a, s) => a + (s.score ?? 0), 0) / quizSessions.length) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative min-h-screen overflow-auto">
      <VideoBg shade={0.7} />

      {/* Top bar */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>SCRIBEMIND</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNav("profile")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105"
            style={{ background: "hsl(178,80%,30%)", color: "white", fontFamily: "'Instrument Serif', serif" }}
          >
            {name.charAt(0).toUpperCase()}
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-10 space-y-10">
        {/* Greeting */}
        <div className="space-y-2 animate-fade-rise">
          <h1 className="text-4xl sm:text-5xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {greeting}, <em className="not-italic shimmer-text">{name.split(" ")[0]}.</em>
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(178,80%,55%)" }} />
            <p className="text-sm text-white/45">
              Material loaded: <span className="text-white/70 italic">&ldquo;{topic}&rdquo;</span>
            </p>
          </div>
        </div>

        {/* Stats strip */}
        {sessions.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-1 animate-fade-rise-delay">
            {[
              { label: "Sessions", value: sessions.length, color: "hsl(178,80%,55%)" },
              { label: "Explanations", value: sessions.filter((s) => s.type === "explain").length, color: "hsl(250,70%,70%)" },
              { label: "Quizzes", value: quizSessions.length, color: "hsl(40,90%,65%)" },
              ...(avgScore != null ? [{ label: "Avg Score", value: `${avgScore}%`, color: "hsl(320,70%,65%)" }] : []),
            ].map((s) => (
              <div
                key={s.label}
                className="flex-shrink-0 px-5 py-3 rounded-2xl flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <span className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-white/35">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-rise-delay-2">
          {FEATURE_CARDS.map(({ id, label, tagline, icon: Icon, accent, glow, grad, border, tag }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className="group relative p-6 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: grad,
                border: `1px solid ${border}`,
                boxShadow: `0 0 0 rgba(0,0,0,0)`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 60px ${glow}`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 rgba(0,0,0,0)`; }}
            >
              {/* Tag */}
              <span
                className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-5"
                style={{ background: `${accent}20`, color: accent }}
              >
                {tag}
              </span>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
              >
                <Icon className="w-6 h-6" style={{ color: accent }} />
              </div>

              {/* Text */}
              <h3 className="text-xl font-normal text-white mb-1.5" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {label}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">{tagline}</p>

              {/* Arrow */}
              <div
                className="absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <ArrowRight className="w-4 h-4 text-white/60" />
              </div>

              {/* Subtle dot grid decoration */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-3xl opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(${accent} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
            </button>
          ))}
        </div>

        {/* Recent activity */}
        {sessions.length > 0 && (
          <div className="space-y-3 animate-fade-rise-delay-3">
            <p className="text-xs text-white/30 uppercase tracking-wider">Recent Activity</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {sessions.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: s.type === "quiz" ? "rgba(124,106,245,0.2)" : "rgba(0,217,197,0.15)" }}
                  >
                    {s.type === "quiz"
                      ? <Brain className="w-3.5 h-3.5" style={{ color: "hsl(250,70%,70%)" }} />
                      : <BookOpen className="w-3.5 h-3.5" style={{ color: "hsl(178,80%,55%)" }} />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/65 truncate">{s.topic}</p>
                    <p className="text-xs text-white/25">{s.date}</p>
                  </div>
                  {s.score != null && (
                    <span className="text-xs font-semibold" style={{ color: s.score >= 75 ? "hsl(178,80%,55%)" : "hsl(40,90%,60%)" }}>
                      {s.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────────

function SectionShell({
  children, accent, onBack, title,
}: {
  children: React.ReactNode;
  accent: string;
  onBack: () => void;
  title: string;
}) {
  return (
    <div className="relative min-h-screen overflow-auto">
      <VideoBg shade={0.75} />
      <div className="relative z-10">
        {/* Section nav */}
        <div
          className="flex items-center gap-4 px-6 sm:px-10 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <div className="w-px h-4 bg-white/15" />
          <span
            className="text-sm font-semibold"
            style={{ color: accent }}
          >
            {title}
          </span>
          <div className="flex-1" />
          <span className="text-lg tracking-tight text-white/60" style={{ fontFamily: "'Instrument Serif', serif" }}>
            SCRIBEMIND
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Explain Section ───────────────────────────────────────────────────────────

function ExplainSection({ studyMaterial, onBack }: { studyMaterial: string; onBack: () => void }) {
  const [text, setText] = useState(studyMaterial);
  const [level, setLevel] = useState<Level>("beginner");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);

  const ACCENT = "hsl(178,80%,48%)";
  const LEVELS: { id: Level; label: string; desc: string; color: string }[] = [
    { id: "beginner", label: "Beginner", desc: "Simple & clear", color: "hsl(178,80%,48%)" },
    { id: "exam", label: "Exam-Ready", desc: "Technical depth", color: "hsl(250,70%,65%)" },
    { id: "analogy", label: "By Analogy", desc: "Real-life stories", color: "hsl(40,90%,60%)" },
  ];

  const handle = useCallback(() => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(generateExplanation(text, level));
      addSession({ date: new Date().toISOString().split("T")[0], type: "explain", topic: getTopic(text) });
      setLoading(false);
    }, 1800);
  }, [text, level]);

  return (
    <SectionShell title="Explain It" accent={ACCENT} onBack={onBack}>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-rise">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold uppercase tracking-wide" style={{ background: `${ACCENT}18`, color: ACCENT }}>
            <BookOpen className="w-3.5 h-3.5" /> AI Explanation Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Turn your notes into<br /><em className="not-italic" style={{ color: ACCENT }}>understanding.</em>
          </h2>
        </div>

        {/* Input */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(0,217,197,0.04)", border: "1px solid rgba(0,217,197,0.15)" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your study material is loaded here — edit or replace it..."
            className="w-full bg-transparent text-white/80 text-sm leading-relaxed resize-none outline-none placeholder:text-white/25 min-h-[140px]"
          />
        </div>

        {/* Level */}
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map(({ id, label, desc, color }) => (
            <button
              key={id}
              onClick={() => setLevel(id)}
              className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: level === id ? `${color}12` : "rgba(255,255,255,0.04)",
                border: `1px solid ${level === id ? `${color}40` : "rgba(255,255,255,0.08)"}`,
                boxShadow: level === id ? `0 0 20px ${color}15` : "none",
              }}
            >
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: level === id ? color : "rgba(255,255,255,0.35)" }}>{desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handle}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all disabled:opacity-35 hover:opacity-90 active:scale-[0.99]"
          style={{ background: `linear-gradient(135deg, hsl(178,80%,38%), hsl(178,80%,28%))`, color: "hsl(201,100%,5%)", boxShadow: loading ? "none" : "0 4px 30px rgba(0,217,197,0.3)" }}
        >
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate Explanation</>}
        </button>

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-fade-rise">
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,217,197,0.2)" }}>
              {/* Result header */}
              <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, rgba(0,217,197,0.12), rgba(0,40,60,0.8))" }}>
                <h3 className="text-xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>{result.title}</h3>
                <p className="text-sm text-white/50 mt-2 leading-relaxed italic">{result.hook}</p>
              </div>
              <div className="p-6 space-y-5" style={{ background: "rgba(0,20,35,0.6)" }}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.concepts.map((c) => (
                    <div key={c.name} className="p-4 rounded-xl" style={{ background: "rgba(0,217,197,0.05)", border: "1px solid rgba(0,217,197,0.1)" }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: ACCENT }}>{c.name}</p>
                      <p className="text-sm text-white/65 leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>
                {result.body.map((p, i) => (
                  <p key={i} className="text-sm text-white/65 leading-relaxed">{p}</p>
                ))}
                <div className="p-4 rounded-xl" style={{ background: "rgba(245,185,50,0.07)", border: "1px solid rgba(245,185,50,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "hsl(40,90%,65%)" }}>Example</p>
                  <p className="text-sm text-white/65 leading-relaxed">{result.example}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/25 uppercase tracking-wide mb-3">Practice Questions</p>
                  <ul className="space-y-2">
                    {result.practice.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5" style={{ background: "rgba(0,217,197,0.15)", color: ACCENT }}>{i + 1}</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ─── Quiz Section ──────────────────────────────────────────────────────────────

function QuizSection({ studyMaterial, onBack }: { studyMaterial: string; onBack: () => void }) {
  const ACCENT = "hsl(250,70%,65%)";
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [input, setInput] = useState(studyMaterial);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const startQuiz = () => {
    setLoading(true);
    setTimeout(() => {
      setQuestions(generateQuiz(input));
      setCurrent(0); setAnswers([]); setSelected(null); setRevealed(false);
      setPhase("active"); setLoading(false);
    }, 1200);
  };

  const answer = (idx: number) => { if (!revealed) { setSelected(idx); setRevealed(true); } };

  const next = () => {
    if (selected === null) return;
    const na = [...answers, selected];
    if (current + 1 >= questions.length) {
      setAnswers(na);
      const sc = Math.round((na.filter((a, i) => a === questions[i].correct).length / questions.length) * 100);
      addSession({ date: new Date().toISOString().split("T")[0], type: "quiz", topic: getTopic(input), score: sc });
      setPhase("done");
    } else {
      setAnswers(na); setCurrent((c) => c + 1); setSelected(null); setRevealed(false);
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const grade = pct >= 90 ? "Excellent!" : pct >= 75 ? "Great Work!" : pct >= 60 ? "Good Effort" : "Keep Practicing";
  const gradeColor = pct >= 90 ? "hsl(178,80%,55%)" : pct >= 75 ? "hsl(250,70%,70%)" : pct >= 60 ? "hsl(40,90%,60%)" : "hsl(0,65%,60%)";

  return (
    <SectionShell title="Quiz Me" accent={ACCENT} onBack={onBack}>
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-6">

        {phase === "setup" && (
          <>
            <div className="animate-fade-rise">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold uppercase tracking-wide" style={{ background: "rgba(124,106,245,0.15)", color: ACCENT }}>
                <Brain className="w-3.5 h-3.5" /> Smart Quiz Generator
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Test your<br /><em className="not-italic" style={{ color: ACCENT }}>understanding.</em>
              </h2>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-2xl px-5 py-4 text-sm text-white/80 leading-relaxed resize-none outline-none placeholder:text-white/25 min-h-[160px]"
              style={{ background: "rgba(124,106,245,0.06)", border: "1px solid rgba(124,106,245,0.2)" }}
              placeholder="Your study material (edit if needed)..."
            />

            <div className="grid grid-cols-3 gap-3">
              {[{ n: "10", l: "Questions" }, { n: "MCQ", l: "Format" }, { n: "Full", l: "Explanations" }].map((f) => (
                <div key={f.n} className="p-3 rounded-xl text-center" style={{ background: "rgba(124,106,245,0.08)", border: "1px solid rgba(124,106,245,0.15)" }}>
                  <p className="text-lg font-semibold" style={{ color: ACCENT }}>{f.n}</p>
                  <p className="text-xs text-white/35 mt-0.5">{f.l}</p>
                </div>
              ))}
            </div>

            <button
              onClick={startQuiz}
              disabled={loading || !input.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all disabled:opacity-35 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(250,70%,50%), hsl(270,70%,40%))", color: "white", boxShadow: "0 4px 30px rgba(124,106,245,0.3)" }}
            >
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Building quiz…</> : <><Brain className="w-4 h-4" />Generate Quiz</>}
            </button>
          </>
        )}

        {phase === "active" && (() => {
          const q = questions[current];
          return (
            <div className="space-y-5 animate-fade-rise">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Q {current + 1} / {questions.length}</span>
                <span className="text-sm font-semibold" style={{ color: ACCENT }}>{score} correct</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(current / questions.length) * 100}%`, background: `linear-gradient(90deg, hsl(250,70%,50%), hsl(270,70%,65%))` }} />
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(124,106,245,0.08)", border: "1px solid rgba(124,106,245,0.2)" }}>
                <p className="text-base text-white font-medium leading-relaxed">{q.question}</p>
              </div>
              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isCorrect = revealed && i === q.correct;
                  const isWrong = revealed && i === selected && i !== q.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => answer(i)}
                      disabled={revealed}
                      className="w-full flex items-start gap-3 p-4 rounded-xl text-left text-sm transition-all"
                      style={{
                        background: isCorrect ? "rgba(0,217,197,0.12)" : isWrong ? "rgba(220,50,50,0.12)" : selected === i ? "rgba(124,106,245,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isCorrect ? "rgba(0,217,197,0.4)" : isWrong ? "rgba(220,50,50,0.4)" : selected === i ? "rgba(124,106,245,0.3)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-white/75 leading-relaxed flex-1">{opt}</span>
                      {isCorrect && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(178,80%,55%)" }} />}
                      {isWrong && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              {revealed && (
                <>
                  <div className="p-4 rounded-xl text-sm text-white/60 leading-relaxed animate-fade-rise" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs font-bold text-white/25 uppercase tracking-wide mb-1">Why?</p>
                    {q.explanation}
                  </div>
                  <button onClick={next} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, hsl(250,70%,50%), hsl(270,70%,40%))", color: "white" }}>
                    {current + 1 >= questions.length ? "See Results" : "Next"} <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {phase === "done" && (
          <div className="space-y-6 animate-fade-rise">
            <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(124,106,245,0.15), rgba(0,20,35,0.8))", border: `1px solid rgba(124,106,245,0.25)` }}>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto text-4xl font-bold mb-4"
                style={{ background: `${gradeColor}20`, border: `2px solid ${gradeColor}50`, color: gradeColor, fontFamily: "'Instrument Serif', serif" }}
              >
                {pct}%
              </div>
              <h3 className="text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif", color: gradeColor }}>{grade}</h3>
              <p className="text-white/45 text-sm mt-2">{score} out of {questions.length} correct</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ l: "Correct", v: score, c: "hsl(178,80%,55%)" }, { l: "Incorrect", v: questions.length - score, c: "hsl(0,65%,60%)" }, { l: "Score", v: `${pct}%`, c: gradeColor }].map((s) => (
                <div key={s.l} className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xl font-semibold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs text-white/35 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {answers[i] === q.correct ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(178,80%,55%)" }} /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <p className="text-white/55 leading-relaxed">{q.question}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setPhase("setup"); }} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, hsl(250,70%,50%), hsl(270,70%,40%))", color: "white" }}>
              <RefreshCw className="w-4 h-4" /> Try Another Quiz
            </button>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ─── Progress Section ──────────────────────────────────────────────────────────

function ProgressSection({ onBack }: { onBack: () => void }) {
  const ACCENT = "hsl(40,90%,60%)";
  const sessions = loadSessions();
  const chartData = getProgressData(sessions);
  const quizSessions = sessions.filter((s) => s.type === "quiz" && s.score != null);
  const avgScore = quizSessions.length ? Math.round(quizSessions.reduce((a, s) => a + (s.score ?? 0), 0) / quizSessions.length) : 0;
  const uniqueDays = new Set(sessions.map((s) => s.date)).size;
  const conceptsExplained = sessions.filter((s) => s.type === "explain").length;

  const STATS = [
    { label: "Study Streak", value: `${Math.min(uniqueDays, 7)}d`, icon: Flame, color: "hsl(40,90%,60%)" },
    { label: "Total Sessions", value: sessions.length, icon: Calendar, color: "hsl(178,80%,48%)" },
    { label: "Explained", value: conceptsExplained, icon: BookOpen, color: "hsl(250,70%,65%)" },
    { label: "Avg Quiz Score", value: avgScore ? `${avgScore}%` : "—", icon: Target, color: "hsl(320,70%,65%)" },
  ];

  return (
    <SectionShell title="My Progress" accent={ACCENT} onBack={onBack}>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="animate-fade-rise">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold uppercase tracking-wide" style={{ background: "rgba(245,185,50,0.15)", color: ACCENT }}>
            <BarChart3 className="w-3.5 h-3.5" /> Learning Analytics
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Your learning<br /><em className="not-italic" style={{ color: ACCENT }}>journey.</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl space-y-3" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="text-xs text-white/35 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl" style={{ background: "rgba(245,185,50,0.05)", border: "1px solid rgba(245,185,50,0.15)" }}>
          <p className="text-sm font-medium text-white mb-4">Activity — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(40,90%,60%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(40,90%,60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tealGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(250,70%,65%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(250,70%,65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(201,90%,8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 12 }} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
              <Area type="monotone" dataKey="activity" stroke="hsl(40,90%,60%)" strokeWidth={2} fill="url(#amberGrad)" name="Sessions" />
              <Area type="monotone" dataKey="score" stroke="hsl(250,70%,65%)" strokeWidth={2} fill="url(#tealGrad2)" name="Quiz %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Recent Activity</p>
          {sessions.length === 0 ? (
            <div className="p-10 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <TrendingUp className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30">No activity yet. Explain something or take a quiz!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.type === "quiz" ? "rgba(124,106,245,0.2)" : "rgba(0,217,197,0.15)" }}>
                    {s.type === "quiz" ? <Brain className="w-3.5 h-3.5" style={{ color: "hsl(250,70%,65%)" }} /> : <BookOpen className="w-3.5 h-3.5" style={{ color: "hsl(178,80%,55%)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{s.type === "quiz" ? "Quizzed:" : "Explained:"} {s.topic}</p>
                    <p className="text-xs text-white/30">{s.date}</p>
                  </div>
                  {s.score != null && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: s.score >= 75 ? "rgba(0,217,197,0.15)" : "rgba(245,185,50,0.15)", color: s.score >= 75 ? "hsl(178,80%,60%)" : "hsl(40,90%,65%)" }}>
                      {s.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

// ─── Profile Section ───────────────────────────────────────────────────────────

function ProfileSection({ userName, userEmail, onBack }: { userName: string; userEmail: string; onBack: () => void }) {
  const ACCENT = "hsl(320,70%,65%)";
  const [profile, setProfile] = useState<Profile>(() => loadProfile(userEmail, userName));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [subInput, setSubInput] = useState("");
  const sessions = loadSessions();
  const quizSessions = sessions.filter((s) => s.type === "quiz" && s.score != null);
  const avgScore = quizSessions.length ? Math.round(quizSessions.reduce((a, s) => a + (s.score ?? 0), 0) / quizSessions.length) : 0;

  const BADGES = [
    { icon: Star, label: "First Explanation", earned: sessions.some((s) => s.type === "explain"), color: "hsl(40,90%,60%)" },
    { icon: Brain, label: "First Quiz", earned: sessions.some((s) => s.type === "quiz"), color: "hsl(250,70%,65%)" },
    { icon: Flame, label: "3-Day Streak", earned: new Set(sessions.map((s) => s.date)).size >= 3, color: "hsl(15,90%,60%)" },
    { icon: Award, label: "Quiz Master", earned: avgScore >= 80, color: "hsl(178,80%,48%)" },
    { icon: Zap, label: "Speed Learner", earned: sessions.length >= 10, color: "hsl(60,90%,55%)" },
    { icon: Target, label: "Perfect Score", earned: quizSessions.some((s) => s.score === 100), color: "hsl(320,70%,65%)" },
  ];

  const save = () => { saveProfile(draft); setProfile(draft); setEditing(false); };

  return (
    <SectionShell title="My Profile" accent={ACCENT} onBack={onBack}>
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="animate-fade-rise">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold uppercase tracking-wide" style={{ background: "rgba(220,80,180,0.15)", color: ACCENT }}>
            <User className="w-3.5 h-3.5" /> Learner Profile
          </div>
        </div>

        {/* Avatar card */}
        <div
          className="rounded-2xl p-6 flex items-center gap-5"
          style={{ background: "linear-gradient(135deg, rgba(220,80,180,0.1), rgba(0,20,35,0.7))", border: "1px solid rgba(220,80,180,0.2)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-semibold flex-shrink-0"
            style={{ background: "hsl(320,60%,30%)", color: "white", fontFamily: "'Instrument Serif', serif", boxShadow: "0 0 30px rgba(220,80,180,0.3)" }}
          >
            {(editing ? draft.name : profile.name).charAt(0)}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <>
                <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-sm text-white outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
                <input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-sm text-white outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-white">{profile.name}</p>
                <p className="text-sm text-white/40">{profile.email}</p>
              </>
            )}
          </div>
          {!editing && (
            <button onClick={() => { setDraft(profile); setEditing(true); }} className="text-xs text-white/35 hover:text-white px-3 py-1.5 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>Edit</button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[{ l: "Sessions", v: sessions.length, c: "hsl(178,80%,55%)" }, { l: "Explained", v: sessions.filter((s) => s.type === "explain").length, c: "hsl(250,70%,65%)" }, { l: "Avg Score", v: avgScore ? `${avgScore}%` : "—", c: "hsl(320,70%,65%)" }].map((s) => (
            <div key={s.l} className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xl font-semibold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-xs text-white/35 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Goal */}
        <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/30 uppercase tracking-wide">Learning Goal</p>
          {editing ? (
            <input value={draft.goal} onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-sm text-white outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
          ) : (
            <p className="text-sm text-white/60 leading-relaxed">{profile.goal}</p>
          )}
        </div>

        {/* Subjects */}
        <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/30 uppercase tracking-wide">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {(editing ? draft : profile).subjects.map((s) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white/70" style={{ background: "rgba(220,80,180,0.1)", border: "1px solid rgba(220,80,180,0.2)" }}>
                {s}
                {editing && <button onClick={() => setDraft((d) => ({ ...d, subjects: d.subjects.filter((x) => x !== s) }))} className="text-white/30 hover:text-white/70"><X className="w-3 h-3" /></button>}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input value={subInput} onChange={(e) => setSubInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && subInput.trim()) { setDraft((d) => ({ ...d, subjects: [...d.subjects, subInput.trim()] })); setSubInput(""); } }} placeholder="Add subject…" className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/25" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              <button onClick={() => { if (subInput.trim()) { setDraft((d) => ({ ...d, subjects: [...d.subjects, subInput.trim()] })); setSubInput(""); } }} className="px-4 py-1.5 rounded-lg text-sm text-white/80" style={{ background: "rgba(220,80,180,0.2)" }}>Add</button>
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3">
            <button onClick={save} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: "hsl(320,60%,45%)", color: "white" }}>Save Changes</button>
            <button onClick={() => setEditing(false)} className="px-5 py-3 rounded-xl text-sm text-white/40 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>Cancel</button>
          </div>
        )}

        {/* Badges */}
        <div>
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Achievements</p>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map(({ icon: Icon, label, earned, color }) => (
              <div key={label} className={`p-3 rounded-xl text-center space-y-2 transition-all ${!earned ? "opacity-25" : ""}`} style={{ background: earned ? `${color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${earned ? `${color}30` : "rgba(255,255,255,0.06)"}`, boxShadow: earned ? `0 0 20px ${color}12` : "none" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto" style={{ background: earned ? `${color}20` : "rgba(255,255,255,0.05)" }}>
                  <Icon className="w-4 h-4" style={{ color: earned ? color : "rgba(255,255,255,0.25)" }} />
                </div>
                <p className="text-xs text-white/50 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("hero");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [studyMaterial, setStudyMaterial] = useState("");

  if (page === "hero") return <HeroPage onStart={() => setPage("email")} />;

  if (page === "email") return (
    <EmailPage onNext={(name, email) => { setUserName(name); setUserEmail(email); setPage("upload"); }} />
  );

  if (page === "upload") return (
    <UploadPage onNext={(material) => { setStudyMaterial(material); setPage("home"); }} />
  );

  if (page === "home") return (
    <HomePage name={userName} studyMaterial={studyMaterial} onNav={(p) => setPage(p)} />
  );

  if (page === "explain") return (
    <ExplainSection studyMaterial={studyMaterial} onBack={() => setPage("home")} />
  );

  if (page === "quiz") return (
    <QuizSection studyMaterial={studyMaterial} onBack={() => setPage("home")} />
  );

  if (page === "progress") return (
    <ProgressSection onBack={() => setPage("home")} />
  );

  if (page === "profile") return (
    <ProfileSection userName={userName} userEmail={userEmail} onBack={() => setPage("home")} />
  );

  return null;
}
