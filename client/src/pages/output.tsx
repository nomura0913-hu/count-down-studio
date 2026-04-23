import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useCountdownReceiver } from "@/hooks/use-countdown-broadcast";
import { CountdownDisplay } from "@/components/countdown-display";
import { EventInfoDisplay } from "@/components/event-info-display";

// ===== Concert End Summary =====
// Displayed on the sub-display when the director presses "End Show" in the main app.
// Shows TOTAL / MC / ENCORE elapsed times plus START / END wall-clock times,
// styled to feel like a curtain-call closing card (warm dark canvas + amber accent).
function formatHMS(ms: number): string {
  if (!ms || ms < 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ConcertSummaryDisplay({
  totalMs,
  mcSegments,
  encoreSegments,
  startTime,
  endTime,
  date,
}: {
  totalMs: number;
  mcSegments: number[];
  encoreSegments: number[];
  startTime: string;
  endTime: string;
  date: string;
}) {
  // Cinematic-theater typography.
  const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  const DISPLAY = "'Archivo', 'Inter', system-ui, sans-serif";

  const SegmentCard = ({
    title,
    label,
    segments,
  }: {
    title: string;
    label: string;
    segments: number[];
  }) => (
    <div
      className="flex flex-col items-stretch"
      style={{
        width: "26vw",
        minWidth: 280,
        padding: "2vh 2.4vw",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(232,176,74,0.12)",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          letterSpacing: "0.5em",
          fontSize: "min(16px, 1.1vw)",
          fontWeight: 500,
          color: "rgba(232,176,74,0.75)",
          marginBottom: "1.5vh",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {title}
      </div>
      {segments.length === 0 ? (
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "min(22px, 1.6vw)",
            fontWeight: 300,
            color: "rgba(168,168,160,0.35)",
            textAlign: "center",
            padding: "1vh 0",
          }}
        >
          — none —
        </div>
      ) : (
        <div className="flex flex-col w-full" style={{ gap: "0.8vh" }}>
          {segments.map((ms, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between w-full"
              style={{
                gap: 18,
                paddingBottom: "0.6vh",
                borderBottom: i === segments.length - 1 ? "none" : "1px solid rgba(168,168,160,0.08)",
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "min(16px, 1.15vw)",
                  fontWeight: 500,
                  letterSpacing: "0.28em",
                  color: "rgba(168,168,160,0.7)",
                  textTransform: "uppercase",
                }}
              >
                {label} {i + 1}
              </div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "min(36px, 2.6vw)",
                  fontWeight: 200,
                  lineHeight: 1,
                  color: "#e8e8e2",
                  letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatHMS(ms)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ClockStat = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col items-center" style={{ gap: 6 }}>
      <div
        style={{
          fontFamily: DISPLAY,
          letterSpacing: "0.5em",
          fontSize: "min(14px, 1vw)",
          fontWeight: 500,
          color: "rgba(168,168,160,0.65)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: "min(54px, 3.6vw)",
          fontWeight: 200,
          lineHeight: 1,
          color: "#e8e8e2",
          letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value || "--:--:--"}
      </div>
    </div>
  );

  // Single 16:9 frame, no scroll. Vertical flow:
  //   header (title + date + subtitle) ~20vh
  //   TOTAL TIME hero ~32vh
  //   MC / EN cards side by side ~32vh
  //   START / END footer ~16vh
  return (
    <div
      className="w-screen h-screen flex flex-col items-center overflow-hidden"
      style={{
        background: "#0c0b0a",
        backgroundImage:
          "radial-gradient(ellipse 55% 40% at 50% 22%, rgba(232,176,74,0.12), transparent 65%), radial-gradient(ellipse 85% 60% at 50% 100%, rgba(193,134,200,0.07), transparent 65%)",
        animation: "summaryFadeIn 1.6s ease-out forwards",
        padding: "3vh 3vw",
        justifyContent: "space-between",
      }}
      data-testid="concert-summary"
    >
      {/* ====== TOP: Title + Date ====== */}
      <div className="flex flex-col items-center shrink-0">
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "min(110px, 8.5vw)",
            fontWeight: 300,
            color: "rgba(232,176,74,0.95)",
            letterSpacing: "0.005em",
            lineHeight: 0.95,
            textShadow: "0 0 80px rgba(232,176,74,0.2)",
          }}
        >
          End of Show
        </div>
        {date ? (
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: "min(20px, 1.4vw)",
              fontWeight: 300,
              color: "rgba(232,176,74,0.6)",
              marginTop: "1.2vh",
              letterSpacing: "0.4em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {date}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: "min(22px, 1.6vw)",
            fontWeight: 300,
            color: "rgba(168,168,160,0.5)",
            marginTop: "0.6vh",
            letterSpacing: "0.18em",
          }}
        >
          ——  thank you for tonight  ——
        </div>
      </div>

      {/* ====== TOTAL TIME — hero, center-stage ====== */}
      <div
        className="flex flex-col items-center justify-center shrink-0"
        style={{
          padding: "2.4vh 5vw",
          background: "rgba(232,176,74,0.025)",
          border: "1px solid rgba(232,176,74,0.22)",
          borderRadius: 10,
          boxShadow: "0 0 120px rgba(232,176,74,0.08) inset",
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            letterSpacing: "0.55em",
            fontSize: "min(18px, 1.3vw)",
            fontWeight: 500,
            color: "rgba(232,176,74,0.9)",
            marginBottom: "1.5vh",
            textTransform: "uppercase",
          }}
        >
          Total Time
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: "min(170px, 14vw)",
            fontWeight: 100,
            lineHeight: 0.9,
            color: "#f0c77a",
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 80px rgba(232,176,74,0.35)",
          }}
        >
          {formatHMS(totalMs)}
        </div>
      </div>

      {/* ====== MC / ENCORE breakdown side-by-side — fixed width, not stretched ====== */}
      <div className="flex items-start justify-center shrink-0" style={{ gap: "3vw" }}>
        <SegmentCard title="MC Times" label="MC" segments={mcSegments} />
        <SegmentCard title="Encore Times" label="EN" segments={encoreSegments} />
      </div>

      {/* ====== BOTTOM: START / END wall clocks ====== */}
      <div className="flex items-center justify-center shrink-0" style={{ gap: "6vw" }}>
        <ClockStat label="Start" value={startTime} />
        <div
          style={{
            width: 1,
            height: "5vh",
            background: "linear-gradient(to bottom, transparent, rgba(232,176,74,0.3), transparent)",
          }}
        />
        <ClockStat label="End" value={endTime} />
      </div>

      <style>{`
        @keyframes summaryFadeIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function Output() {
  const [, setLocation] = useLocation();
  const isLegitOutput = typeof window !== "undefined" &&
    (window.opener !== null || new URLSearchParams(window.location.search).has("secondary"));

  useEffect(() => {
    if (!isLegitOutput) {
      setLocation("/");
    }
  }, [isLegitOutput, setLocation]);

  const state = useCountdownReceiver();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const secondaryRef = useRef<any>(null);

  useEffect(() => {
    document.title = "Output - COUNT DOWN STUDIO";
  }, []);

  useEffect(() => {
    if (!isLegitOutput) return;
    const tryAutoFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (_) {}
    };
    tryAutoFullscreen();
    const t = setTimeout(tryAutoFullscreen, 500);
    return () => clearTimeout(t);
  }, [isLegitOutput]);

  useEffect(() => {
    const cacheSecondary = async () => {
      try {
        if (!("getScreenDetails" in window)) return;
        const details = await (window as any).getScreenDetails();
        if (!details?.screens || details.screens.length < 2) return;
        const sec = details.screens.find((s: any) => !s.isPrimary);
        if (sec) secondaryRef.current = sec;
      } catch (_) {}
    };
    cacheSecondary();
  }, []);

  const goFullscreenOnSecondary = useCallback(async () => {
    try {
      if (secondaryRef.current) {
        await document.documentElement.requestFullscreen({ screen: secondaryRef.current } as any);
        return;
      }
      if ("getScreenDetails" in window) {
        const details = await (window as any).getScreenDetails();
        if (details?.screens) {
          const sec = details.screens.find((s: any) => !s.isPrimary);
          if (sec) {
            secondaryRef.current = sec;
            await document.documentElement.requestFullscreen({ screen: sec } as any);
            return;
          }
        }
      }
      await document.documentElement.requestFullscreen();
    } catch (_) {
      try { await document.documentElement.requestFullscreen(); } catch (_e) {}
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      await goFullscreenOnSecondary();
    }
  }, [goFullscreenOnSecondary]);

  const notifyFullscreenStatus = useCallback((fs: boolean) => {
    try {
      localStorage.setItem("countdown-output-fullscreen", JSON.stringify({ fullscreen: fs, _ts: Date.now() }));
    } catch (_) {}
    try {
      localStorage.setItem("countdown-ping", JSON.stringify({ type: "output-fullscreen", fullscreen: fs, _ts: Date.now() }));
    } catch (_) {}
    try {
      if (window.opener) {
        window.opener.postMessage({ type: "songcountdown-ping", action: "output-fullscreen", fullscreen: fs }, "*");
      }
    } catch (_) {}
    try {
      const bc = new BroadcastChannel("songcountdown-sync");
      bc.postMessage({ type: "output-fullscreen", fullscreen: fs });
      bc.close();
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) setShowHint(false);
      notifyFullscreenStatus(fs);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [notifyFullscreenStatus]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "songcountdown-request-fullscreen") {
        goFullscreenOnSecondary();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [goFullscreenOnSecondary]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F" || ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F"))) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  useEffect(() => {
    let lastClick = 0;
    const handler = () => {
      const now = Date.now();
      if (now - lastClick < 400) {
        toggleFullscreen();
      } else if (!isFullscreen) {
        goFullscreenOnSecondary();
      }
      lastClick = now;
    };
    window.addEventListener("click", handler);
    window.addEventListener("touchend", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchend", handler);
    };
  }, [toggleFullscreen, isFullscreen, goFullscreenOnSecondary]);

  useEffect(() => {
    if (showHint) {
      const t = setTimeout(() => setShowHint(false), 8000);
      return () => clearTimeout(t);
    }
  }, [showHint]);

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden cursor-none relative"
      data-testid="output-page"
    >
      {state.showConcertSummary ? (
        <ConcertSummaryDisplay
          totalMs={state.summaryTotalMs || 0}
          mcSegments={state.summaryMcSegments || []}
          encoreSegments={state.summaryEncoreSegments || []}
          startTime={state.summaryStartTime || ""}
          endTime={state.summaryEndTime || ""}
          date={state.summaryDate || ""}
        />
      ) : state.showEventInfo ? (
        <EventInfoDisplay
          concertTitle={state.eventConcertTitle || ""}
          doorOpen={state.eventDoorOpen || null}
          showTime={state.eventShowTime || null}
          rehearsal={state.eventRehearsal || null}
        />
      ) : (
        <CountdownDisplay
          formattedTime={state.formattedTime}
          status={state.status}
          progress={state.progress}
          songTitle={state.songTitle}
          nextSongTitle={state.nextSongTitle}
          remainingSeconds={state.remainingSeconds}
          isEvent={state.isEvent}
          xTime={state.xTime}
          isMC={state.isMC}
          isEncore={state.isEncore}
          isCountUp={state.isCountUp}
          elapsedSeconds={state.elapsedSeconds}
          mcTargetSeconds={state.mcTargetSeconds}
          subTimerFormatted={state.subTimerFormatted}
          subTimerRemaining={state.subTimerRemaining}
          subTimerSeconds={state.subTimerSeconds}
          subTimerActive={state.subTimerActive}
        />
      )}

      {!isFullscreen && showHint && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            animation: "fadeOut 8s ease-in forwards",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-full"
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(6,182,212,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-[11px] font-medium tracking-wider"
              style={{ color: "rgba(6,182,212,0.7)" }}
            >
              Click or press
            </span>
            <kbd
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{
                background: "rgba(6,182,212,0.15)",
                border: "1px solid rgba(6,182,212,0.3)",
                color: "#22d3ee",
              }}
            >
              F
            </kbd>
            <span
              className="text-[11px] font-medium tracking-wider"
              style={{ color: "rgba(6,182,212,0.7)" }}
            >
              for fullscreen
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeOut {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
