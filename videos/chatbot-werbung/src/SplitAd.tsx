import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";

for (const w of ["400", "500", "600"]) {
  loadFont({ family: "Geist", url: staticFile(`geist-${w}.woff2`), weight: w });
}
// Hintergrundmusik: null = nur Soundeffekte. Fuer einen Song z.B. "music/song.mp3" (Datei in public/music/).
const MUSIC: string | null = null;
const FONT = "Geist, 'Helvetica Neue', Arial, sans-serif";

const C = {
  blue: "#0057B8",
  blueLight: "#1A6FD4",
  blueGlow: "#60a5fa",
  navy: "#060E1A",
  navy2: "#0A1628",
  ink: "#0A1628",
  ink3: "#64748b",
  tint: "#e6eef8",
  tintBorder: "#ccdcf1",
  red: "#ef4444",
  green: "#16a34a",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const k = (f: number, inp: number[], outp: number[], easing = io) => interpolate(f, inp, outp, { ...clamp, easing });

// ---------- Zeitplan (30 fps, Musik 120 BPM = 15 Frames pro Schlag) ----------
export const SPLIT_DURATION = 780;
const T = {
  typeStart: 60,
  send: 135,
  race: [150, 390] as const, // linke Uhr rast von So 22:47 bis Mo 10:12
  dots: [142, 192] as const,
  botAnswer: 192,
  type2: [228, 258] as const,
  send2: 262,
  badge: 285,
  rightMinute: 230,
  notify: 390,
  openMail: 408,
  customerReply: 432,
  stamp: 460,
  score: 480,
  outro: 570,
};

const Q = "Was kostet bei euch ein Reifenwechsel?";
const Q2 = "Super, dann komme ich morgen früh vorbei!";
const BOT = "Der Reifenwechsel kostet 39 €. Ohne Termin: Mo bis Fr, 8 bis 17 Uhr. Einfach vorbeikommen!";

const typeTimes = (text: string, start: number, step: number) => {
  const t: number[] = [];
  let acc = start;
  for (let i = 0; i < text.length; i++) {
    t.push(acc);
    acc += step * (0.7 + random(`${text}${i}`) * 0.6);
  }
  return t;
};
const Q_TIMES = typeTimes(Q, T.typeStart, 1.75);
const Q2_TIMES = typeTimes(Q2, T.type2[0], 0.72);
const typedCount = (times: number[], f: number) => times.filter((t) => t <= f).length;

// Geschichte in Minuten ab So 00:00
const START_MIN = 22 * 60 + 47;
const END_MIN = 24 * 60 + 10 * 60 + 12; // Mo 10:12
const leftMinutes = (f: number) =>
  f < T.race[0] ? START_MIN : Math.round(k(f, [T.race[0], T.race[1]], [START_MIN, END_MIN], Easing.bezier(0.55, 0, 0.45, 1))) + (f >= T.customerReply ? 2 : 0);
const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const dayOf = (m: number) => (m >= 24 * 60 ? "Montag" : "Sonntag");

// Layout
const PHONE = { w: 492, h: 1160, top: 450, status: 64 };
const LX = 36;
const RX = 1080 - 36 - PHONE.w;

// =====================================================================
export const SplitAd: React.FC = () => {
  const frame = useCurrentFrame();
  const outroP = k(frame, [T.outro, T.outro + 18], [0, 1], Easing.bezier(0.76, 0, 0.24, 1));
  const enter = k(frame, [-8, 10], [0, 1], out);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.navy, overflow: "hidden" }}>
      <Bg />
      <Headlines />

      <SideLabel x={LX} label="Per E-Mail" icon={<MailIcon color="#cbd5e1" size={30} />} tone="gray" />
      <SideLabel x={RX} label="Mit Dialopt" icon={<DialoptMark size={34} />} tone="blue" />

      <div style={{ opacity: enter, translate: `${(1 - enter) * -200}px 0px` }}>
        <Phone x={LX} time={fmt(leftMinutes(frame))} dark={nightness(frame) > 0.5} screenBg={leftScreenBg(frame)}>
          <EmailSide />
        </Phone>
      </div>
      <div style={{ opacity: enter, translate: `${(1 - enter) * 200}px 0px` }}>
        <Phone x={RX} time={frame >= T.rightMinute ? "22:48" : "22:47"} dark={false} screenBg="#fff" glow={k(frame, [T.badge, T.badge + 10], [0, 1])}>
          <ChatSide />
        </Phone>
      </div>

      <Versus />
      <Stamp />
      <Badge />
      <Scoreboard />

      {frame >= T.outro && (
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${outroP * 75}% at 75% 55%)` }}>
          <Outro />
        </div>
      )}
      <Sounds />
    </AbsoluteFill>
  );
};

// Nacht -> Tag auf der linken Seite (nach der Geschichtszeit)
const nightness = (f: number) => {
  const m = leftMinutes(f);
  if (f < T.send) return 0; // beim Schreiben noch helle App
  return interpolate(m, [START_MIN, START_MIN + 20, 24 * 60 + 6 * 60, 24 * 60 + 7.5 * 60], [0, 1, 1, 0], clamp);
};
const leftScreenBg = (f: number) => {
  const n = nightness(f);
  return n > 0 ? `color-mix(in srgb, #0b1324 ${Math.round(n * 100)}%, #f8fafc)` : "#f8fafc";
};

// ---------- Hintergrund ----------
const Bg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(700px 900px at 20% 60%, rgba(239,68,68,${0.1 + 0.08 * k(f, [T.stamp, T.stamp + 10], [0, 1])}) 0%, transparent 70%),
          radial-gradient(700px 900px at 80% 60%, rgba(26,111,212,.32) 0%, transparent 70%),
          linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
      }}
    />
  );
};

// ---------- Texte oben ----------
const Headlines: React.FC = () => (
  <>
    <Headline from={0} to={130} kicker="Sonntag, 22:47 Uhr">
      Ein Kunde hat eine Frage.
    </Headline>
    <Headline from={138} to={384} kicker="Gleiche Frage, zwei Wege">
      Wer antwortet zuerst?
    </Headline>
    <Headline from={392} to={474} kicker="Montag, 10:12 Uhr">
      Die Antwort kommt.
    </Headline>
    <Headline from={482} to={T.outro} kicker="Der Unterschied">
      Antwort nach …
    </Headline>
  </>
);

const Headline: React.FC<{ from: number; to: number; kicker: string; children: React.ReactNode }> = ({ from, to, kicker, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < from || f > to + 8) return null;
  const inP = from === 0 ? spring({ frame: f + 8, fps, config: { damping: 14, stiffness: 170 } }) : spring({ frame: f - from, fps, config: { damping: 14, stiffness: 170 } });
  const outP = k(f, [to, to + 8], [0, 1]);
  return (
    <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", color: "#fff", opacity: Math.min(1, inP) * (1 - outP) }}>
      <div style={{ display: "inline-block", fontSize: 34, fontWeight: 600, color: C.blueGlow, border: "2px solid rgba(96,165,250,.4)", background: "rgba(96,165,250,.1)", padding: "8px 24px", borderRadius: 999 }}>{kicker}</div>
      <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -2.5, marginTop: 16, scale: String(0.8 + 0.2 * inP), translate: `0px ${(1 - inP) * 30}px` }}>{children}</div>
    </div>
  );
};

const SideLabel: React.FC<{ x: number; label: string; icon: React.ReactNode; tone: "gray" | "blue" }> = ({ x, label, icon, tone }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = spring({ frame: f + (tone === "gray" ? 8 : 5), fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", left: x, top: 365, width: PHONE.w, display: "flex", justifyContent: "center", scale: String(v) }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 34,
          fontWeight: 600,
          color: "#fff",
          padding: "10px 26px",
          borderRadius: 999,
          background: tone === "blue" ? C.blue : "rgba(255,255,255,.1)",
          border: tone === "blue" ? "none" : "2px solid rgba(255,255,255,.15)",
        }}
      >
        {icon}
        {label}
      </div>
    </div>
  );
};

const Versus: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = spring({ frame: f - 10, fps, config: { damping: 10, stiffness: 160 } });
  const hide = k(f, [T.score - 4, T.score + 4], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 46,
        top: PHONE.top + PHONE.h / 2 - 46,
        width: 92,
        height: 92,
        borderRadius: 46,
        background: "#fff",
        color: C.ink,
        fontSize: 34,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,.5)",
        scale: String(v * (1 - hide)),
        zIndex: 5,
      }}
    >
      VS
    </div>
  );
};

// ---------- Handy-Rahmen ----------
const Phone: React.FC<{ x: number; time: string; dark: boolean; screenBg: string; glow?: number; children: React.ReactNode }> = ({ x, time, dark, screenBg, glow = 0, children }) => {
  const f = useCurrentFrame();
  const dim = k(f, [T.score, T.score + 10], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: PHONE.top,
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: 60,
        padding: 12,
        background: "#111827",
        boxShadow: `0 40px 90px rgba(0,0,0,.55), 0 0 0 2px #2a3446${glow ? `, 0 0 0 ${6 * glow}px rgba(34,197,94,.55), 0 0 ${80 * glow}px rgba(34,197,94,.45)` : ""}`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", background: screenBg }}>
        <div
          style={{
            height: PHONE.status,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 34px",
            fontSize: 26,
            fontWeight: 600,
            color: dark ? "#fff" : C.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{time}</span>
          <div style={{ width: 110, height: 30, borderRadius: 15, background: "#000" }} />
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 34, height: 16, borderRadius: 4, border: `2px solid ${dark ? "#fff" : C.ink}`, display: "inline-block" }} />
          </span>
        </div>
        <div style={{ position: "absolute", top: PHONE.status, left: 0, right: 0, bottom: 0 }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,14,26,.93)", opacity: dim }} />
      </div>
    </div>
  );
};

// ---------- Linke Seite: E-Mail ----------
const EmailSide: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.send + 6) return <Compose />;
  if (f < T.openMail) return <Waiting />;
  return <Thread />;
};

const mailText = (dark: boolean) => (dark ? "#e2e8f0" : C.ink);

const Compose: React.FC = () => {
  const f = useCurrentFrame();
  const n = typedCount(Q_TIMES, f);
  const press = k(f, [T.send - 3, T.send, T.send + 5], [0, 1, 0], Easing.linear);
  const fly = k(f, [T.send, T.send + 6], [0, 1], Easing.bezier(0.7, 0, 0.84, 0));
  const row: React.CSSProperties = { padding: "18px 26px", borderBottom: "1px solid #e2e8f0", fontSize: 24, color: C.ink3 };
  return (
    <div style={{ height: "100%", background: "#fff", translate: `0px ${-fly * 1200}px`, opacity: 1 - fly }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px 20px" }}>
        <span style={{ fontSize: 22, color: C.ink3 }}>Abbrechen</span>
        <span style={{ fontSize: 26, fontWeight: 600, color: C.ink }}>Neue E-Mail</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", background: n === Q.length ? "#475569" : "#94a3b8", padding: "8px 18px", borderRadius: 999, scale: String(1 - press * 0.15) }}>Senden</span>
      </div>
      <div style={row}>
        An: <span style={{ color: C.ink }}>info@werkstatt.example</span>
      </div>
      <div style={row}>
        Betreff: <span style={{ color: C.ink }}>Reifenwechsel</span>
      </div>
      <div style={{ padding: "22px 26px", fontSize: 28, lineHeight: 1.4, color: C.ink }}>
        Hallo,
        <br />
        {Q.slice(0, n)}
        <Caret on={f >= T.typeStart - 6} f={f} color="#475569" />
      </div>
    </div>
  );
};

const Waiting: React.FC = () => {
  const f = useCurrentFrame();
  const m = leftMinutes(f);
  const n = nightness(f);
  const dark = n > 0.5;
  const sent = k(f, [T.send + 6, T.send + 14, T.send + 50, T.send + 60], [0, 1, 1, 0], out);
  const spin = (f * 12) % 360;
  const racing = f >= T.race[0] && f < T.race[1];
  const shake = racing ? Math.sin(f * 2.3) * 2 * k(f, [T.race[0], T.race[0] + 60], [0, 1]) : 0;
  const notif = k(f, [T.notify, T.notify + 8], [0, 1], Easing.bezier(0.34, 1.56, 0.64, 1));
  return (
    <div style={{ height: "100%", color: mailText(dark), position: "relative" }}>
      <div style={{ padding: "20px 28px", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Posteingang</div>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: sent }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#334155", color: "#fff", fontSize: 24, fontWeight: 500, padding: "12px 22px", borderRadius: 999 }}>
          <CheckSmall color="#fff" /> Gesendet
        </div>
      </div>

      <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", translate: `${shake}px 0px` }}>
        {dark ? <MoonIcon /> : <SunIcon />}
        <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -4, fontVariantNumeric: "tabular-nums", marginTop: 20, lineHeight: 1 }}>{fmt(m)}</div>
        <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.7, marginTop: 10 }}>{dayOf(m)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 60, fontSize: 26, opacity: 0.75 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" style={{ rotate: `${spin}deg` }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" fill="none" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          Keine neue E-Mail
        </div>
      </div>

      {f >= T.notify && (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 10,
            background: "rgba(255,255,255,.96)",
            borderRadius: 26,
            padding: "18px 22px",
            boxShadow: "0 12px 30px rgba(0,0,0,.25)",
            translate: `0px ${(1 - notif) * -160}px`,
            color: C.ink,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, color: C.ink3 }}>
            <MailIcon color={C.ink3} size={22} /> Mail · jetzt
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>Werkstatt</div>
          <div style={{ fontSize: 22, color: C.ink3 }}>Re: Reifenwechsel</div>
        </div>
      )}
    </div>
  );
};

const Thread: React.FC = () => {
  const f = useCurrentFrame();
  const a = k(f, [T.openMail, T.openMail + 8], [0, 1], out);
  const b = k(f, [T.customerReply, T.customerReply + 8], [0, 1], out);
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: "20px 22px", fontSize: 25, lineHeight: 1.4, color: C.ink, boxShadow: "0 4px 14px rgba(10,22,40,.06)" };
  return (
    <div style={{ height: "100%", background: "#f1f5f9", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 30, fontWeight: 600, color: C.ink, padding: "4px 8px" }}>Re: Reifenwechsel</div>
      <div style={{ ...card, opacity: a, translate: `0px ${(1 - a) * 30}px` }}>
        <div style={{ fontSize: 20, color: C.ink3, marginBottom: 8 }}>Werkstatt · Mo, 10:12</div>
        Hallo, der Reifenwechsel kostet 39 €. Viele Grüße
      </div>
      {f >= T.customerReply && (
        <div style={{ ...card, background: "#eef2f7", opacity: b, translate: `0px ${(1 - b) * 30}px` }}>
          <div style={{ fontSize: 20, color: C.ink3, marginBottom: 8 }}>Kunde · Mo, 10:14</div>
          Danke, ich war heute früh schon bei einer anderen Werkstatt.
        </div>
      )}
    </div>
  );
};

// ---------- Rechte Seite: Dialopt Chatbot ----------
const ChatSide: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sent1 = f >= T.send;
  const sent2 = f >= T.send2;
  const n1 = sent1 ? 0 : typedCount(Q_TIMES, f);
  const n2 = sent2 ? 0 : typedCount(Q2_TIMES, f);
  const inputText = f < T.send ? Q.slice(0, n1) : f >= T.type2[0] && !sent2 ? Q2.slice(0, n2) : "";
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 15, stiffness: 200 } });
  const bubble: React.CSSProperties = { maxWidth: "86%", padding: "14px 18px", borderRadius: 22, fontSize: 25, lineHeight: 1.38 };
  const showDots = f >= T.dots[0] && f < T.dots[1];
  const pressAt = f < T.send + 10 ? T.send : T.send2;
  const press = k(f, [pressAt - 3, pressAt, pressAt + 5], [0, 1, 0], Easing.linear);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ background: C.tint, borderBottom: `1px solid ${C.tintBorder}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: 29, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WrenchIcon />
        </div>
        <div>
          <div style={{ fontSize: 25, fontWeight: 600, color: C.ink }}>Werkstatt Assistent</div>
          <div style={{ fontSize: 19, color: C.ink3, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: "#22c55e", display: "inline-block" }} /> Online
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12, overflow: "hidden" }}>
        <div style={{ ...bubble, background: C.tint, color: C.ink, borderBottomLeftRadius: 6 }}>Hallo! Wie kann ich Ihnen helfen?</div>
        {sent1 && (
          <div style={{ ...bubble, alignSelf: "flex-end", background: C.blue, color: "#fff", borderBottomRightRadius: 6, scale: String(0.7 + 0.3 * pop(T.send)), transformOrigin: "100% 100%" }}>{Q}</div>
        )}
        {showDots && (
          <div style={{ ...bubble, background: C.tint, display: "flex", gap: 8, padding: "20px 22px", alignSelf: "flex-start" }}>
            {[0, 1, 2].map((i) => {
              const v = (Math.sin((f - i * 4) / 2.6) + 1) / 2;
              return <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: C.blue, opacity: 0.35 + 0.65 * v, translate: `0px ${-5 * v}px` }} />;
            })}
          </div>
        )}
        {f >= T.botAnswer && (
          <div style={{ ...bubble, background: C.tint, color: C.ink, borderBottomLeftRadius: 6, scale: String(0.7 + 0.3 * pop(T.botAnswer)), transformOrigin: "0% 100%" }}>{BOT}</div>
        )}
        {sent2 && (
          <div style={{ ...bubble, alignSelf: "flex-end", background: C.blue, color: "#fff", borderBottomRightRadius: 6, scale: String(0.7 + 0.3 * pop(T.send2)), transformOrigin: "100% 100%" }}>{Q2}</div>
        )}
      </div>

      <div style={{ padding: "10px 14px 22px", display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1, minHeight: 60, borderRadius: 22, border: `2px solid ${inputText ? C.blue : C.tintBorder}`, padding: "12px 18px", fontSize: 23, lineHeight: 1.35, color: inputText ? C.ink : C.ink3 }}>
          {inputText || "Nachricht …"}
          {inputText && <Caret on f={f} color={C.blue} />}
        </div>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 - press * 0.18), flexShrink: 0 }}>
          <SendIcon />
        </div>
      </div>
    </div>
  );
};

const Caret: React.FC<{ on: boolean; f: number; color: string }> = ({ on, f, color }) =>
  on ? <span style={{ display: "inline-block", width: 2, height: 26, background: color, marginLeft: 2, verticalAlign: "-4px", opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0.2 }} /> : null;

// ---------- Ergebnis-Stempel ----------
const Stamp: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.stamp || f >= T.score) return null;
  const s = k(f, [T.stamp, T.stamp + 6], [2.4, 1], Easing.bezier(0.5, 0, 0.75, 0));
  const o = k(f, [T.stamp, T.stamp + 4], [0, 1], Easing.linear);
  const shake = f < T.stamp + 12 ? Math.sin(f * 3) * 6 * (1 - (f - T.stamp) / 12) : 0;
  return (
    <div style={{ position: "absolute", left: LX, top: PHONE.top + 640, width: PHONE.w, display: "flex", justifyContent: "center", opacity: o, translate: `${shake}px 0px` }}>
      <div
        style={{
          rotate: "-10deg",
          scale: String(s),
          border: `8px solid ${C.red}`,
          color: C.red,
          background: "rgba(255,255,255,.92)",
          fontSize: 54,
          fontWeight: 600,
          letterSpacing: 1,
          padding: "10px 26px",
          borderRadius: 18,
          lineHeight: 1.05,
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(239,68,68,.35)",
        }}
      >
        KUNDE
        <br />
        VERLOREN
      </div>
    </div>
  );
};

const Badge: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < T.badge || f >= T.score) return null;
  const v = spring({ frame: f - T.badge, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: RX, top: PHONE.top + 150, width: PHONE.w, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: C.green,
          color: "#fff",
          fontSize: 34,
          fontWeight: 600,
          padding: "16px 28px",
          borderRadius: 999,
          scale: String(v),
          boxShadow: "0 20px 50px rgba(22,163,74,.5)",
        }}
      >
        <CheckSmall color="#fff" size={34} />
        Kunde kommt vorbei
      </div>
    </div>
  );
};

// ---------- Vergleich ----------
const Scoreboard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < T.score || f >= T.outro + 20) return null;
  const l = spring({ frame: f - T.score - 4, fps, config: { damping: 11, stiffness: 160 } });
  const r = spring({ frame: f - T.score - 19, fps, config: { damping: 11, stiffness: 160 } });
  const big = (v: number): React.CSSProperties => ({ scale: String(v), opacity: Math.min(1, v * 1.5) });
  return (
    <>
      <div style={{ position: "absolute", left: LX, top: PHONE.top, width: PHONE.w, height: PHONE.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", ...big(l) }}>
        <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -5, color: C.red, lineHeight: 1 }}>11 Std.</div>
        <div style={{ fontSize: 56, fontWeight: 600, color: C.red, opacity: 0.85 }}>25 Min.</div>
        <div style={{ fontSize: 34, marginTop: 40, opacity: 0.8 }}>Kunde weg</div>
      </div>
      <div style={{ position: "absolute", left: RX, top: PHONE.top, width: PHONE.w, height: PHONE.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", ...big(r) }}>
        <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -5, color: C.blueGlow, lineHeight: 1 }}>2 Sek.</div>
        <div style={{ fontSize: 56, fontWeight: 600, color: C.blueGlow, opacity: 0, height: 67 }}>.</div>
        <div style={{ fontSize: 34, marginTop: 40, opacity: 0.8 }}>Kunde gewonnen</div>
      </div>
    </>
  );
};

// ---------- Outro ----------
const Outro: React.FC = () => {
  const frame = useCurrentFrame() - T.outro;
  const { fps } = useVideoConfig();
  const sp = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 }, durationInFrames: 18 });
  const logo = spring({ frame: frame - 6, fps, config: { damping: 11, stiffness: 120 } });
  const item = (d: number): React.CSSProperties => ({ opacity: sp(d), translate: `0px ${(1 - sp(d)) * 40}px` });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 700px at 540px 600px, rgba(26,111,212,.5) 0%, transparent 70%), linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
        color: "#fff",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 26, scale: String(logo) }}>
        <DialoptMark size={130} />
        <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: -3 }}>Dialopt</div>
      </div>
      <div style={{ ...item(16), fontSize: 84, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.06, marginTop: 70 }}>
        Antworten, bevor
        <br />
        <span style={{ color: C.blueGlow }}>der Kunde weg ist.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56, alignItems: "flex-start" }}>
        {["Antwortet in Sekunden", "Auch sonntags um 22:47", "Persönlich eingerichtet"].map((t, i) => (
          <div key={t} style={{ ...item(28 + i * 6), display: "flex", alignItems: "center", gap: 20, fontSize: 46, fontWeight: 500 }}>
            <Check />
            {t}
          </div>
        ))}
      </div>
      <div style={{ ...item(52), marginTop: 70, background: C.blue, padding: "22px 46px", borderRadius: 999, fontSize: 50, fontWeight: 600, boxShadow: "0 20px 50px rgba(0,87,184,.45)" }}>
        ab 49 € / Monat
      </div>
      <div style={{ ...item(60), marginTop: 36, fontSize: 48, fontWeight: 500, color: C.blueGlow }}>dialopt.de</div>
    </AbsoluteFill>
  );
};

// ---------- Sounds ----------
const Sfx: React.FC<{ at: number; src: string; volume?: number; rate?: number }> = ({ at, src, volume = 1, rate = 1 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={90} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} playbackRate={rate} />
  </Sequence>
);

// Uhr-Ticks werden schneller, während die Zeit links rast
const CLOCK_TICKS: number[] = (() => {
  const out: number[] = [];
  let t = T.race[0];
  while (t < T.race[1]) {
    out.push(t);
    const p = (t - T.race[0]) / (T.race[1] - T.race[0]);
    t += p < 0.5 ? 9 - 12 * p : 3 + 10 * (p - 0.5);
  }
  return out;
})();

const Sounds: React.FC = () => (
  <>
    {MUSIC && <Audio src={staticFile(MUSIC)} volume={0.5} />}
    <Sfx at={0} src="impact" volume={0.6} />
    <Sfx at={4} src="whoosh" volume={0.5} />
    <Sfx at={10} src="pop" volume={0.4} />
    {Q_TIMES.map((t, i) => (Q[i] === " " ? null : <Sfx key={`q${i}`} at={t} src="mouse-click" volume={0.14} rate={1.6 + (i % 4) * 0.12} />))}
    <Sfx at={T.send - 1} src="mouse-click" volume={0.6} />
    <Sfx at={T.send} src="whoosh" volume={0.6} />
    <Sfx at={T.botAnswer} src="snapchat-notification" volume={0.7} />
    {Q2_TIMES.map((t, i) => (i % 2 === 1 || Q2[i] === " " ? null : <Sfx key={`r${i}`} at={t} src="mouse-click" volume={0.12} rate={1.8} />))}
    <Sfx at={T.send2} src="whip" volume={0.45} />
    <Sfx at={T.badge} src="ding" volume={0.45} />
    <Sfx at={T.badge} src="pop" volume={0.4} />
    {CLOCK_TICKS.map((t, i) => (
      <Sfx key={`c${i}`} at={t} src="clock" volume={0.35} rate={i % 2 === 0 ? 1 : 0.85} />
    ))}
    <Sfx at={T.notify} src="snapchat-notification" volume={0.45} rate={0.8} />
    <Sfx at={T.customerReply} src="whoosh" volume={0.35} />
    <Sfx at={T.stamp + 5} src="impact" volume={0.85} />
    <Sfx at={T.score + 4} src="impact" volume={0.6} />
    <Sfx at={T.score + 19} src="impact" volume={0.6} />
    <Sfx at={T.score + 19} src="ding" volume={0.35} />
    <Sfx at={T.outro - 45} src="riser" volume={0.5} />
    <Sfx at={T.outro} src="impact" volume={0.85} />
    <Sfx at={T.outro} src="whoosh" volume={0.6} rate={0.7} />
    <Sfx at={T.outro + 52} src="ding" volume={0.35} />
  </>
);

// ---------- Icons ----------
const MailIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const WrenchIcon: React.FC = () => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
  </svg>
);
const SendIcon: React.FC = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);
const MoonIcon: React.FC = () => (
  <svg width={90} height={90} viewBox="0 0 24 24" fill="#fde68a" stroke="none">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
const SunIcon: React.FC = () => (
  <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="12" r="4.5" fill="#fbbf24" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const CheckSmall: React.FC<{ color: string; size?: number }> = ({ color, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const Check: React.FC = () => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="11" fill={C.blue} />
    <path d="m7 12.5 3.2 3.2L17 9" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DialoptMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill={C.blueLight} />
    <path d="M11 11h18M11 29h18M11 11l18 18M29 11L11 29" stroke="#fff" strokeOpacity=".5" strokeWidth={1.6} fill="none" />
    <g fill="#fff" fillOpacity=".88">
      <circle cx="11" cy="11" r="3.3" />
      <circle cx="29" cy="11" r="3.3" />
      <circle cx="11" cy="29" r="3.3" />
      <circle cx="29" cy="29" r="3.3" />
    </g>
    <circle cx="20" cy="20" r="5.2" fill="#fff" />
  </svg>
);
