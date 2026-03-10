"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export default function AgentPage() {
  const [inCall, setInCall] = useState(false);
  const [status, setStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [timer, setTimer] = useState(0);
  const [typing, setTyping] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const sessionRef = useRef(null);
  const timerRef = useRef(null);
  const recogRef = useRef(null);
  const silenceRef = useRef(null);
  const actxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const scrollRef = useRef(null);
  const inCallRef = useRef(false);
  const statusRef = useRef("idle");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (inCall) {
      setTimer(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [inCall]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Canvas waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 300, H = 300, CX = W / 2, CY = H / 2, R = 108;
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      const a = analyserRef.current;
      if (!a || !inCall) return;
      const buf = new Uint8Array(a.frequencyBinCount);
      a.getByteFrequencyData(buf);
      const segs = 64;
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2 - Math.PI / 2;
        const fi = Math.floor((i / segs) * buf.length);
        const amp = (buf[fi] || 0) / 255;
        const r = R + amp * 28;
        const x = CX + Math.cos(angle) * r, y = CY + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = status === "listening" ? "rgba(22,163,74,0.4)" : "rgba(196,162,101,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [inCall, status]);

  const initMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      actxRef.current = actx;
      const src = actx.createMediaStreamSource(stream);
      const an = actx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      analyserRef.current = an;
    } catch (e) { console.warn("Mic denied:", e); }
  };

  const stopMic = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (actxRef.current) { actxRef.current.close(); actxRef.current = null; }
    analyserRef.current = null;
  };

  // Speech recognition with auto-restart
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recogRef.current) try { recogRef.current.abort(); } catch (e) {}

    const r = new SR();
    r.lang = "es-ES"; r.continuous = true; r.interimResults = true;
    recogRef.current = r;
    let final = "";
    let intentionalStop = false;

    r.onresult = (ev) => {
      final = "";
      for (let i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
      }
      clearTimeout(silenceRef.current);
      if (final) {
        silenceRef.current = setTimeout(() => {
          const t = final.trim();
          if (t) { intentionalStop = true; try { r.stop(); } catch (e) {} send(t); }
          final = "";
        }, 150);
      }
    };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") console.error("SR error:", e.error); };
    r.onend = () => {
      if (inCallRef.current && !intentionalStop && statusRef.current === "listening") {
        setTimeout(() => {
          if (inCallRef.current && statusRef.current === "listening") startListening();
        }, 50);
      }
    };
    try { r.start(); setStatus("listening"); statusRef.current = "listening"; } catch (e) {}
  }, []);

  // Fetch TTS for a sentence and return as Blob
  const fetchSentenceTTS = (sentence) =>
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentence }),
    }).then(r => r.ok ? r.blob() : null).catch(() => null);

  // Play a single audio Blob, returns promise that resolves when done
  const playBlob = (blob) =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; URL.revokeObjectURL(url); resolve(); } };
      audio.onended = done;
      audio.onerror = done;
      setTimeout(done, 15000);
      audio.play().catch(done);
    });

  // Send message (streaming SSE + overlapped sentence-level TTS)
  const send = async (text) => {
    const time = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text, time }]);
    setStatus("processing"); statusRef.current = "processing";
    setTyping(true);

    // Stop recognition immediately to prevent re-triggers
    if (recogRef.current) try { recogRef.current.abort(); } catch (e) {}

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionRef.current }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", fullText = "", meta = null;
      let sentenceBuf = "";
      const sentenceAudios = []; // Promise<Blob>[]
      let streamDone = false;

      // Queue a sentence for TTS immediately (parallel fetch)
      const queueSentenceTTS = (sentence) => {
        sentenceAudios.push(fetchSentenceTTS(sentence));
      };

      // Playback loop — runs concurrently with stream reading
      // Plays each sentence's audio as soon as its TTS blob resolves
      const playbackPromise = (async () => {
        let i = 0;
        while (true) {
          if (i < sentenceAudios.length) {
            if (i === 0) { setStatus("speaking"); statusRef.current = "speaking"; }
            const blob = await sentenceAudios[i];
            if (blob && inCallRef.current) await playBlob(blob);
            i++;
          } else if (streamDone) {
            break;
          } else {
            await new Promise(r => setTimeout(r, 30));
          }
        }
      })();

      // Read SSE stream and detect sentence boundaries in real-time
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.d) {
              fullText += ev.d;
              sentenceBuf += ev.d;
              // Sentence boundary: ends with . ! ? and has enough content
              if (/[.!?]\s*$/.test(sentenceBuf) && sentenceBuf.trim().length > 5) {
                queueSentenceTTS(sentenceBuf.trim());
                sentenceBuf = "";
              }
            }
            if (ev.done) meta = ev;
          } catch (e) {}
        }
      }

      // Flush remaining text as final sentence
      if (sentenceBuf.trim()) queueSentenceTTS(sentenceBuf.trim());
      streamDone = true;

      setTyping(false);
      if (!meta || !fullText) {
        addAgent("Disculpe, ha habido un problema. ¿Puede repetir?");
        setStatus("listening"); statusRef.current = "listening"; startListening();
        return;
      }

      addAgent(fullText, meta.keywords, meta.intent);

      // Wait for all audio playback to finish
      await playbackPromise;

      // Auto hang up ONLY on clear farewell phrases (not partial matches)
      const lower = fullText.toLowerCase();
      if (/les esperamos|os esperamos|hasta luego|adiós|que vaya bien/.test(lower)) {
        setTimeout(() => endCall(), 1500);
        return;
      }

      setStatus("listening"); statusRef.current = "listening";
      startListening();
    } catch (e) {
      console.error(e);
      setTyping(false);
      addAgent("Disculpe, problema técnico.");
      setStatus("listening"); statusRef.current = "listening";
      startListening();
    }
  };

  const addAgent = (text, kws, intent) => {
    const time = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "agent", text, time, keywords: kws, intent }]);
  };

  // Audio element ref for OpenAI TTS playback
  const audioRef = useRef(null);

  // Play TTS via OpenAI API (high-quality voice, works on all browsers)
  const playTTS = (text) => {
    if (recogRef.current) try { recogRef.current.abort(); } catch (e) {}
    setStatus("speaking"); statusRef.current = "speaking";

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return new Promise((resolve) => {
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
      audioRef.current = audio;

      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; resolve(); } };

      audio.onended = done;
      audio.onerror = () => {
        console.warn("TTS API error, falling back to browser speech");
        // Fallback to browser TTS if API fails
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = "es-ES";
        utt.rate = 1.0;
        utt.onend = done;
        utt.onerror = done;
        setTimeout(done, 15000);
        window.speechSynthesis.speak(utt);
      };

      // Safety timeout: max 30 seconds
      setTimeout(done, 30000);

      audio.play().catch(() => {
        // Autoplay blocked — fallback
        done();
      });
    });
  };

  // Pre-cache greeting TTS blob so call start is instant
  const greetingBlobRef = useRef(null);
  const GREETING = "Hola, buenas, le atiende Elena desde Fonda Alcalá. ¿En qué puedo ayudarle?";

  // Pre-warm: fetch greeting TTS + establish OpenAI connection on mount
  useEffect(() => {
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: GREETING }),
    }).then(r => r.ok ? r.blob() : null).then(blob => {
      greetingBlobRef.current = blob;
    }).catch(() => {});
  }, []);

  // Unlock audio context on first user interaction (needed for autoplay policies)
  const unlockAudio = () => {
    const audio = new Audio();
    audio.play().catch(() => {});
  };

  // Start call — uses /api/init-call to sync conversation with hardcoded greeting
  const startCall = async () => {
    unlockAudio();
    sessionRef.current = "call_" + Date.now();
    setInCall(true); inCallRef.current = true;
    setMessages([]); setShowTranscript(true);
    setStatus("processing"); statusRef.current = "processing";
    await initMic();

    addAgent(GREETING);

    // Register session with the EXACT greeting (keeps conversation in sync)
    fetch("/api/init-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionRef.current }),
    }).catch(() => {});

    // Use pre-cached greeting blob if available (instant), otherwise fetch
    if (greetingBlobRef.current) {
      if (recogRef.current) try { recogRef.current.abort(); } catch (e) {}
      setStatus("speaking"); statusRef.current = "speaking";
      await playBlob(greetingBlobRef.current);
    } else {
      await playTTS(GREETING);
    }
    setStatus("listening"); statusRef.current = "listening";
    startListening();
  };

  const endCall = () => {
    inCallRef.current = false;
    clearTimeout(silenceRef.current);
    if (recogRef.current) try { recogRef.current.abort(); } catch (e) {}
    recogRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    stopMic();
    setInCall(false);
    setStatus("idle"); statusRef.current = "idle";
    fetch("/api/end-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionRef.current, duration: timer }),
    }).catch(() => {});
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(silenceRef.current);
      if (recogRef.current) try { recogRef.current.stop(); } catch (e) {}
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      window.speechSynthesis?.cancel();
      stopMic();
    };
  }, []);

  const statusColor = { idle: "text-stone-400", listening: "text-emerald-600", speaking: "text-gold", processing: "text-stone-500" };
  const statusLabel = { idle: "PULSA PARA LLAMAR", listening: "ESCUCHANDO", speaking: "HABLANDO", processing: "PROCESANDO" };
  const intentLabels = { reserva: "Reserva", cancelación: "Cancelación", consulta_horario: "Horario", consulta_carta: "Carta", consulta_ubicación: "Ubicación", consulta_precio: "Precios", consulta_terraza: "Terraza", consulta_eventos: "Eventos", consulta_general: "Consulta", consulta_mascotas: "Mascotas" };
  const intentColors = { reserva: "bg-emerald-50 text-emerald-600", cancelación: "bg-red-50 text-red-500", default: "bg-stone-100 text-stone-500" };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Call Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-white to-cream min-h-[60vh] md:min-h-0 p-4">
        {/* Orb */}
        <div className="relative mb-5 md:mb-7 group cursor-pointer" onClick={inCall ? endCall : startCall}>
          <canvas ref={canvasRef} width={300} height={300} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 300, height: 300 }} />
          <div className={`absolute inset-[-6px] rounded-full border-2 transition-all duration-500 ${
            inCall ? (status === "speaking" ? "border-gold animate-pulse-gold" : "border-gold shadow-[0_0_0_8px_rgba(196,162,101,0.08)]") : "border-warm-border"
          }`} />
          <div className={`relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-300 ${
            inCall ? "shadow-lg shadow-gold/15" : "shadow-lg shadow-stone-200/60 group-hover:shadow-xl group-hover:scale-[1.02]"
          }`}>
            <img src="/logo.png" alt="Fonda Alcalá" className={`w-16 md:w-20 transition-opacity duration-300 ${!inCall ? "group-hover:opacity-25" : ""}`} />
            {!inCall && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            {inCall && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-red-50/60 transition-all rounded-full">
                <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-stone-800 tracking-tight mb-1 font-serif">Fonda Alcalá</h1>
        <p className={`text-[11px] font-semibold tracking-[2px] mb-2 md:mb-3 transition-colors ${statusColor[status]}`}>{statusLabel[status]}</p>
        {inCall && <p className="text-lg md:text-xl font-light text-stone-700 tracking-[3px] tabular-nums mb-3 md:mb-4">{fmt(timer)}</p>}

        {inCall && (
          <div className="flex gap-2">
            <button onClick={endCall} className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium shadow-lg shadow-red-200 transition-all hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Colgar
            </button>
            {/* Mobile: toggle transcript */}
            <button onClick={() => setShowTranscript(!showTranscript)} className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-full text-sm font-medium shadow transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat
            </button>
          </div>
        )}

        {!inCall && <p className="absolute bottom-4 md:bottom-8 text-xs text-stone-400 text-center max-w-xs px-4">Haz clic en el orbe para simular una llamada con el asistente de voz</p>}
      </div>

      {/* Transcript - slide up on mobile, side panel on desktop */}
      <div className={`bg-white border-t md:border-t-0 md:border-l border-warm-gray flex flex-col transition-all duration-500 ${
        inCall && showTranscript
          ? "h-[40vh] md:h-auto md:w-[400px] opacity-100"
          : "h-0 md:w-0 opacity-0 overflow-hidden"
      }`}>
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-stone-100 shrink-0">
          <h2 className="text-[13px] font-semibold text-stone-700">Transcripción en vivo</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-blink" />
              <span className="text-[10px] font-bold text-red-500 tracking-wider">REC</span>
            </div>
            <button onClick={() => setShowTranscript(false)} className="md:hidden p-1 text-stone-400 hover:text-stone-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-3 md:space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="flex gap-2 md:gap-2.5 animate-[fadeIn_0.3s_ease]">
              <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold shrink-0 ${
                m.role === "agent" ? "bg-gradient-to-br from-gold to-gold-dark text-white" : "bg-indigo-50 text-indigo-500 border border-indigo-100"
              }`}>{m.role === "agent" ? "FA" : "CL"}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-semibold mb-0.5 md:mb-1 ${m.role === "agent" ? "text-gold" : "text-indigo-500"}`}>
                  {m.role === "agent" ? "Elena — Fonda Alcalá" : "Cliente"}
                </p>
                <div className={`text-[12px] md:text-[13px] leading-relaxed p-2.5 md:p-3 rounded-xl ${
                  m.role === "agent" ? "bg-stone-50 text-stone-700 rounded-tl-sm" : "bg-indigo-50 text-stone-700 rounded-tr-sm"
                }`}>{m.text}</div>
                <div className="flex items-center gap-1 md:gap-1.5 mt-1 md:mt-1.5 flex-wrap">
                  <span className="text-[9px] md:text-[10px] text-stone-400">{m.time}</span>
                  {m.keywords?.map((k, j) => (
                    <span key={j} className="text-[8px] md:text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold-dark border border-gold/15">{k}</span>
                  ))}
                  {m.intent && (
                    <span className={`text-[8px] md:text-[9px] font-semibold px-1.5 py-0.5 rounded ${intentColors[m.intent] || intentColors.default}`}>
                      {intentLabels[m.intent] || m.intent}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2 md:gap-2.5">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold shrink-0">FA</div>
              <div>
                <p className="text-[10px] font-semibold text-gold mb-0.5 md:mb-1">Elena — Fonda Alcalá</p>
                <div className="bg-stone-50 rounded-xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="px-4 md:px-5 py-2 md:py-3 border-t border-stone-100 shrink-0">
          <p className="text-[10px] text-stone-400 text-center">{messages.length} mensajes · {fmt(timer)}</p>
        </div>
      </div>
    </div>
  );
}
