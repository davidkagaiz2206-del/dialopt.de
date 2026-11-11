import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
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
const FONT = "Geist, 'Helvetica Neue', Arial, sans-serif";

// Musik: 120 BPM, ein Schlag = 15 Frames. Alle Schnitte liegen auf Schlägen.
const BEAT = 15;
export const DESIGN_DURATION = 750;
const S = {
  hook: 0,
  editor: 45,
  show: 180,
  grid: 450,
  outro: 570,
};
const CARD = 45; // 3 Schläge pro Branche

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const io = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const k = (f: number, inp: number[], outp: number[], easing = io) => interpolate(f, inp, outp, { ...clamp, easing });

const BRAND = { blue: "#0057B8", blueLight: "#1A6FD4", blueGlow: "#60a5fa", navy: "#060E1A", navy2: "#0A1628", ink: "#0A1628" };

// ---------- Themes: nur Dinge, die das echte Widget kann ----------
// Farbe, Hell/Dunkel, Logo, Name, Begrüßung, Position.
type IconName = "house" | "scissors" | "tooth" | "wrench" | "utensils" | "bag" | "dumbbell" | "chat";
type Theme = {
  label: string;
  color: string;
  colorName: string;
  dark: boolean;
  icon: IconName;
  title: string;
  hello: string;
  q: string;
  a: string;
  left?: boolean;
};

const THEMES: Theme[] = [
  {
    label: "Friseursalon",
    color: "#db2777",
    colorName: "Pink",
    dark: false,
    icon: "scissors",
    title: "Friseursalon Assistent",
    hello: "Hi! Lust auf einen neuen Look?",
    q: "Habt ihr Samstag noch einen Termin frei?",
    a: "Ja! Samstag um 10:30 und 14:00 Uhr ist noch frei. Soll ich einen reservieren?",
  },
  {
    label: "Zahnarztpraxis",
    color: "#0d9488",
    colorName: "Petrol",
    dark: false,
    icon: "tooth",
    title: "Praxis Assistent",
    hello: "Guten Tag! Wie können wir Ihnen helfen?",
    q: "Ich habe starke Zahnschmerzen. Was soll ich tun?",
    a: "Das tut uns leid! Heute gibt es noch Akuttermine. Rufen Sie uns direkt an.",
    left: true,
  },
  {
    label: "Autowerkstatt",
    color: "#f97316",
    colorName: "Orange",
    dark: true,
    icon: "wrench",
    title: "Werkstatt Assistent",
    hello: "Servus! Was ist mit Ihrem Auto?",
    q: "Was kostet ein Reifenwechsel?",
    a: "Der Reifenwechsel kostet 39 € inklusive Auswuchten. Wann passt es Ihnen?",
  },
  {
    label: "Restaurant",
    color: "#d4a017",
    colorName: "Gold",
    dark: true,
    icon: "utensils",
    title: "Restaurant Assistent",
    hello: "Willkommen! Hunger?",
    q: "Habt ihr heute Abend einen Tisch für 4?",
    a: "Um 19:30 Uhr ist ein Tisch für 4 Personen frei. Soll ich ihn reservieren?",
    left: true,
  },
  {
    label: "Online-Shop",
    color: "#7c3aed",
    colorName: "Violett",
    dark: false,
    icon: "bag",
    title: "Shop Assistent",
    hello: "Hallo! Fragen zu Ihrer Bestellung?",
    q: "Wo ist meine Bestellung?",
    a: "Ihr Paket ist unterwegs und kommt voraussichtlich morgen bei Ihnen an.",
  },
  {
    label: "Fitnessstudio",
    color: "#22c55e",
    colorName: "Grün",
    dark: true,
    icon: "dumbbell",
    title: "Studio Assistent",
    hello: "Hey! Bereit fürs Training?",
    q: "Kann ich ein Probetraining machen?",
    a: "Klar! Das Probetraining ist kostenlos. Wann möchten Sie vorbeikommen?",
    left: true,
  },
];

const EXTRA: Theme[] = [
  { label: "Immobilien", color: "#0e7490", colorName: "Blau", dark: false, icon: "house", title: "Immobilien Assistent", hello: "Hallo! Suchen Sie ein neues Zuhause?", q: "Ist die Wohnung noch frei?", a: "Ja! Möchten Sie einen Besichtigungstermin?" },
  { label: "Bäckerei", color: "#b45309", colorName: "Braun", dark: false, icon: "chat", title: "Bäckerei Assistent", hello: "Guten Morgen!", q: "Kann ich eine Torte bestellen?", a: "Gerne! Für welches Datum?" },
  { label: "Kanzlei", color: "#64748b", colorName: "Grau", dark: true, icon: "chat", title: "Kanzlei Assistent", hello: "Guten Tag.", q: "Wann haben Sie Sprechzeiten?", a: "Montag bis Freitag von 9 bis 17 Uhr." },
];

const BASE: Theme = {
  label: "Standard",
  color: BRAND.blue,
  colorName: "Blau",
  dark: false,
  icon: "house",
  title: "Ihr Assistent",
  hello: "Hallo! Wie kann ich Ihnen helfen?",
  q: "Habt ihr heute geöffnet?",
  a: "Ja, heute sind wir bis 18 Uhr für Sie da!",
};

// =====================================================================
export const DesignAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: BRAND.navy, overflow: "hidden" }}>
      <Sequence from={S.hook} durationInFrames={S.editor - S.hook + 6} layout="absolute-fill">
        <Hook />
      </Sequence>
      <Sequence from={S.editor} durationInFrames={S.show - S.editor + 8} layout="absolute-fill">
        <Editor />
      </Sequence>
      {THEMES.map((th, i) => (
        <Sequence key={th.label} from={S.show + i * CARD} durationInFrames={CARD + 10} layout="absolute-fill">
          <Showcase theme={th} index={i} />
        </Sequence>
      ))}
      <Sequence from={S.grid} durationInFrames={S.outro - S.grid + 4} layout="absolute-fill">
        <Grid />
      </Sequence>
      <Sequence from={S.outro} layout="absolute-fill">
        <Outro />
      </Sequence>
      <Flash at={S.outro} />
      <Sounds />
    </AbsoluteFill>
  );
};

// ---------- Chat-Widget ----------
const W = { w: 720, h: 1080 };

const mix = (c: string, pct: number, base: string) => `color-mix(in srgb, ${c} ${pct}%, ${base})`;

const Widget: React.FC<{
  theme: Theme;
  // lokale Frames für die Nachrichten (vorher unsichtbar)
  qAt?: number;
  aAt?: number;
  f?: number;
  showTyping?: boolean;
  h?: number;
}> = ({ theme, qAt = -999, aAt = -999, f = 999, showTyping = true, h = W.h }) => {
  const d = theme.dark;
  const bg = d ? "#0f172a" : "#ffffff";
  const headBg = d ? mix(theme.color, 18, "#0f172a") : mix(theme.color, 12, "#ffffff");
  const botBg = d ? "#1e293b" : mix(theme.color, 10, "#ffffff");
  const text = d ? "#e2e8f0" : BRAND.ink;
  const sub = d ? "#94a3b8" : "#64748b";
  const border = d ? "#1e293b" : mix(theme.color, 22, "#ffffff");
  const pop = (at: number) => interpolate(f, [at, at + 7], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const qIn = pop(qAt);
  const aIn = pop(aAt);
  const typing = showTyping && f >= qAt + 4 && f < aAt;

  const bubble: React.CSSProperties = { maxWidth: "84%", padding: "20px 26px", borderRadius: 28, fontSize: 32, lineHeight: 1.35 };

  return (
    <div
      style={{
        width: W.w,
        height: h,
        borderRadius: 40,
        overflow: "hidden",
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: `0 50px 120px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.04)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
      }}
    >
      <div style={{ background: headBg, padding: "30px 32px", display: "flex", alignItems: "center", gap: 22, borderBottom: `2px solid ${border}` }}>
        <div style={{ width: 88, height: 88, borderRadius: 44, background: theme.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={theme.icon} size={48} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 600, color: text, letterSpacing: -0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{theme.title}</div>
          <div style={{ fontSize: 24, color: sub, display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <div style={{ width: 13, height: 13, borderRadius: 7, background: "#22c55e" }} />
            Online · antwortet sofort
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 18 }}>
        <div style={{ ...bubble, background: botBg, color: text, borderBottomLeftRadius: 8 }}>{theme.hello}</div>
        {qIn > 0 && (
          <div style={{ ...bubble, alignSelf: "flex-end", background: theme.color, color: "#fff", borderBottomRightRadius: 8, scale: String(0.6 + 0.4 * qIn), opacity: Math.min(1, qIn * 1.5), transformOrigin: "100% 100%" }}>
            {theme.q}
          </div>
        )}
        {typing && (
          <div style={{ ...bubble, background: botBg, display: "flex", gap: 10, padding: "28px 30px" }}>
            {[0, 1, 2].map((i) => {
              const v = (Math.sin((f - i * 4) / 2.6) + 1) / 2;
              return <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: theme.color, opacity: 0.35 + 0.65 * v, translate: `0px ${-7 * v}px` }} />;
            })}
          </div>
        )}
        {aIn > 0 && (
          <div style={{ ...bubble, background: botBg, color: text, borderBottomLeftRadius: 8, scale: String(0.6 + 0.4 * aIn), opacity: Math.min(1, aIn * 1.5), transformOrigin: "0% 100%" }}>
            {theme.a}
          </div>
        )}
      </div>

      <div style={{ padding: "18px 24px 28px", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1, height: 84, borderRadius: 28, border: `2px solid ${border}`, display: "flex", alignItems: "center", padding: "0 26px", fontSize: 30, color: sub }}>
          Nachricht schreiben …
        </div>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: theme.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="send" size={40} color="#fff" />
        </div>
      </div>
    </div>
  );
};

// ---------- 1) Hook: sofort Bewegung, Farben wechseln im Takt ----------
const HOOK_THEMES = [BASE, ...THEMES, ...EXTRA];
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.floor(frame / 4) % HOOK_THEMES.length;
  const th = HOOK_THEMES[idx];
  const punch = 1 + 0.035 * Math.exp(-(frame % 4) * 0.9);
  const enter = spring({ frame: frame + 6, fps, config: { damping: 14, stiffness: 180 } });
  const line2 = spring({ frame: frame - 14, fps, config: { damping: 12, stiffness: 200 } });
  const exit = k(frame, [40, 51], [0, 1], Easing.bezier(0.7, 0, 0.84, 0));

  return (
    <AbsoluteFill style={{ background: `radial-gradient(1100px 900px at 540px 1100px, ${th.color} 0%, ${BRAND.navy} 72%)` }}>
      <BgGrid />
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -4, lineHeight: 1, scale: String(0.6 + 0.4 * enter), opacity: enter }}>Ihr Chatbot.</div>
        <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -4, lineHeight: 1.05, marginTop: 10, color: th.color, filter: "brightness(1.35)", scale: String(1.6 - 0.6 * line2), opacity: line2 }}>
          Ihr Design.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: (1080 - W.w * 0.78) / 2,
          width: W.w * 0.78,
          top: 600,
          transformOrigin: "50% 0%",
          scale: String(punch * (0.7 + 0.3 * enter)),
          translate: `0px ${(1 - enter) * 300 + exit * 1400}px`,
          rotate: `${(1 - enter) * -8}deg`,
        }}
      >
        <div style={{ transformOrigin: "0 0", scale: "0.78", width: W.w, height: 900 }}>
          <Widget theme={th} qAt={-99} aAt={-99} f={999} showTyping={false} h={900} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2) Editor: live einrichten ----------
const SWATCHES = ["#0057B8", "#db2777", "#22c55e", "#7c3aed", "#f97316", "#0d9488"];
const LOGOS: IconName[] = ["house", "scissors", "utensils", "bag"];
const NAME = "Friseursalon";
// lokale Frames (ab S.editor)
const E = { in: 0, c1: 22, c2: 36, c3: 50, dark: 66, logo: 82, field: 98, typeStart: 102, end: 135 };
const PANEL = { x: 70, y: 1180, w: 940, h: 660 };
const swatchPos = (i: number) => ({ x: PANEL.x + 90 + i * 128, y: PANEL.y + 190 });
const SEG = { hell: { x: PANEL.x + 150, y: PANEL.y + 360 }, dunkel: { x: PANEL.x + 370, y: PANEL.y + 360 } };
const logoPos = (i: number) => ({ x: PANEL.x + 96 + i * 124, y: PANEL.y + 545 });
const FIELD = { x: PANEL.x + 520, y: PANEL.y + 310, w: 370, h: 100 };

const Editor: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const color = f >= E.c3 ? SWATCHES[3] : f >= E.c2 ? SWATCHES[2] : f >= E.c1 ? SWATCHES[1] : SWATCHES[0];
  const colorIdx = SWATCHES.indexOf(color);
  const dark = f >= E.dark;
  const logo: IconName = f >= E.logo ? "scissors" : "house";
  const typed = Math.max(0, Math.min(NAME.length, Math.floor((f - E.typeStart) / 1.6)));
  const title = typed > 0 ? `${NAME.slice(0, typed)} Assistent` : "Ihr Assistent";
  const theme: Theme = { ...BASE, color, dark, icon: logo, title };

  const enter = spring({ frame: f, fps, config: { damping: 16, stiffness: 150 } });
  const panelIn = spring({ frame: f - 4, fps, config: { damping: 16, stiffness: 130 } });
  const lastChange = Math.max(...[E.c1, E.c2, E.c3, E.dark, E.logo].filter((c) => c <= f), -99);
  const bump = 1 + 0.05 * Math.exp(-(f - lastChange) * 0.35) * (f - lastChange < 20 ? 1 : 0);
  const exit = k(f, [E.end, E.end + 10], [0, 1], Easing.bezier(0.7, 0, 0.84, 0));

  // Mauszeiger-Route
  const pts = [
    { f: 0, x: 900, y: 1900 },
    { f: E.c1 - 4, ...swatchPos(1) },
    { f: E.c2 - 4, ...swatchPos(2) },
    { f: E.c3 - 4, ...swatchPos(3) },
    { f: E.dark - 5, ...SEG.dunkel },
    { f: E.logo - 5, ...logoPos(1) },
    { f: E.field - 5, x: FIELD.x + 60, y: FIELD.y + 50 },
  ];
  const cx = k(f, pts.map((p) => p.f), pts.map((p) => p.x), Easing.bezier(0.45, 0, 0.2, 1));
  const cy = k(f, pts.map((p) => p.f), pts.map((p) => p.y), Easing.bezier(0.45, 0, 0.2, 1));
  const clicks = [E.c1, E.c2, E.c3, E.dark, E.logo, E.field];
  const lastClick = Math.max(...clicks.filter((c) => c <= f), -99);
  const press = f - lastClick < 6 ? Math.sin(((f - lastClick) / 6) * Math.PI) : 0;

  return (
    <AbsoluteFill
      style={{
        background: dark
          ? `radial-gradient(1000px 900px at 540px 700px, ${mix(color, 45, "#060E1A")} 0%, #060E1A 75%)`
          : `radial-gradient(1000px 900px at 540px 700px, ${mix(color, 30, "#ffffff")} 0%, #eef2f8 75%)`,
        translate: `${-exit * 1080}px 0px`,
        filter: `blur(${exit * 18}px)`,
      }}
    >
      <BgGrid light={!dark} />
      <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center", opacity: enter, translate: `0px ${(1 - enter) * -40}px` }}>
        <Kicker color={color} dark={dark}>Selbst einrichten</Kicker>
        <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: -2.5, color: dark ? "#fff" : BRAND.ink, marginTop: 14 }}>So, wie Sie wollen.</div>
      </div>

      <div style={{ position: "absolute", left: (1080 - W.w * 0.66) / 2, top: 450, width: W.w * 0.66, height: 900 * 0.66, transformOrigin: "50% 50%", scale: String(enter * bump) }}>
        <div style={{ transformOrigin: "0 0", scale: "0.66", width: W.w, height: 900 }}>
          <Widget theme={theme} f={999} showTyping={false} h={900} />
        </div>
      </div>

      {/* Einstellungen */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 40,
          background: dark ? "#0f172a" : "#fff",
          border: `2px solid ${dark ? "#1e293b" : "#e2e8f0"}`,
          boxShadow: "0 40px 100px rgba(0,0,0,.25)",
          translate: `0px ${(1 - panelIn) * 700}px`,
          color: dark ? "#e2e8f0" : BRAND.ink,
        }}
      >
        <Label x={50} y={52}>Farbe</Label>
        {SWATCHES.map((c, i) => {
          const p = swatchPos(i);
          const sel = i === colorIdx;
          return (
            <div
              key={c}
              style={{
                position: "absolute",
                left: p.x - PANEL.x - 46,
                top: p.y - PANEL.y - 46,
                width: 92,
                height: 92,
                borderRadius: 46,
                background: c,
                boxShadow: sel ? `0 0 0 6px ${dark ? "#0f172a" : "#fff"}, 0 0 0 11px ${c}` : "none",
                scale: sel ? "1.08" : "1",
              }}
            />
          );
        })}
        <Label x={50} y={262}>Design</Label>
        <div style={{ position: "absolute", left: 40, top: 310, width: 440, height: 100, borderRadius: 50, background: dark ? "#1e293b" : "#f1f5f9", display: "flex", padding: 8 }}>
          <div style={{ position: "absolute", top: 8, left: dark ? 228 : 8, width: 204, height: 84, borderRadius: 42, background: color, transition: "none" }} />
          {["Hell", "Dunkel"].map((t, i) => (
            <div key={t} style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 600, color: (i === 1) === dark ? "#fff" : dark ? "#94a3b8" : "#64748b" }}>
              {t}
            </div>
          ))}
        </div>
        <Label x={520} y={262}>Name</Label>
        <div
          style={{
            position: "absolute",
            left: FIELD.x - PANEL.x,
            top: FIELD.y - PANEL.y,
            width: FIELD.w,
            height: FIELD.h,
            borderRadius: 26,
            border: `3px solid ${f >= E.field ? color : dark ? "#334155" : "#e2e8f0"}`,
            display: "flex",
            alignItems: "center",
            padding: "0 26px",
            fontSize: 32,
            fontWeight: 500,
            color: typed ? (dark ? "#fff" : BRAND.ink) : "#94a3b8",
          }}
        >
          {typed ? NAME.slice(0, typed) : "Ihr Name"}
          {f >= E.field && <span style={{ width: 3, height: 38, background: color, marginLeft: 3, opacity: Math.floor(f / 8) % 2 || typed < NAME.length ? 1 : 0 }} />}
        </div>
        <Label x={50} y={448}>Logo</Label>
        {LOGOS.map((l, i) => {
          const p = logoPos(i);
          const sel = l === logo;
          return (
            <div
              key={l}
              style={{
                position: "absolute",
                left: p.x - PANEL.x - 50,
                top: p.y - PANEL.y - 50,
                width: 100,
                height: 100,
                borderRadius: 26,
                background: sel ? color : dark ? "#1e293b" : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={l} size={50} color={sel ? "#fff" : dark ? "#94a3b8" : "#64748b"} />
            </div>
          );
        })}
        <Label x={600} y={448}>Position</Label>
        <div style={{ position: "absolute", left: 590, top: 495, width: 300, height: 100, borderRadius: 26, border: `3px solid ${dark ? "#334155" : "#e2e8f0"}` }}>
          <div style={{ position: "absolute", right: 16, bottom: 14, width: 40, height: 40, borderRadius: 20, background: color }} />
          <div style={{ position: "absolute", left: 20, top: 26, fontSize: 28, color: dark ? "#94a3b8" : "#64748b" }}>rechts</div>
        </div>
      </div>

      <Pointer x={cx} y={cy} press={press} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div style={{ position: "absolute", left: x, top: y, fontSize: 30, fontWeight: 600, opacity: 0.6, letterSpacing: 0.5 }}>{children}</div>
);

// ---------- 3) Branchen-Showcase ----------
const Showcase: React.FC<{ theme: Theme; index: number }> = ({ theme, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const type = index % 4;
  const e = k(f, [0, 9], [0, 1], Easing.bezier(0.2, 0.8, 0.2, 1));
  const bgDrift = f * 4;

  // Eingänge
  let wrap: React.CSSProperties = {};
  if (type === 0) wrap = { translate: `${(1 - e) * 1080}px 0px`, filter: `blur(${(1 - e) * 24}px)` };
  if (type === 1) wrap = { scale: String(1.5 - 0.5 * e), filter: `blur(${(1 - e) * 30}px)`, opacity: e };
  if (type === 2) wrap = { transform: `perspective(1600px) rotateY(${(1 - e) * -100}deg)`, transformOrigin: "0% 50%" };
  if (type === 3) wrap = { translate: `0px ${(1 - e) * 1920}px`, filter: `blur(${(1 - e) * 24}px)` };

  const widgetIn = spring({ frame: f - 3, fps, config: { damping: 13, stiffness: 160 } });
  const exit = k(f, [CARD, CARD + 10], [0, 1], Easing.bezier(0.7, 0, 0.84, 0));
  const fg = theme.dark ? "#fff" : BRAND.ink;
  const bg = theme.dark
    ? `radial-gradient(1000px 1100px at 540px 1050px, ${mix(theme.color, 55, "#060E1A")} 0%, #060E1A 78%)`
    : `radial-gradient(1000px 1100px at 540px 1050px, ${mix(theme.color, 35, "#ffffff")} 0%, ${mix(theme.color, 8, "#ffffff")} 78%)`;
  const side = theme.left ? -1 : 1;

  return (
    <AbsoluteFill style={{ ...wrap, background: bg, overflow: "hidden", scale: String(1 - exit * 0.08), opacity: 1 - exit * 0.6 }}>
      <BgGrid light={!theme.dark} />
      {/* Riesiges Wort im Hintergrund */}
      <div
        style={{
          position: "absolute",
          top: 1450,
          left: 0,
          whiteSpace: "nowrap",
          fontSize: 300,
          fontWeight: 600,
          letterSpacing: -12,
          color: theme.color,
          opacity: theme.dark ? 0.16 : 0.12,
          translate: `${-bgDrift - 100}px 0px`,
        }}
      >
        {theme.label.toUpperCase()} {theme.label.toUpperCase()}
      </div>

      <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center" }}>
        <Kicker color={theme.color} dark={theme.dark}>
          {String(index + 1).padStart(2, "0")} / {String(THEMES.length).padStart(2, "0")}
        </Kicker>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -3, color: fg, marginTop: 14, lineHeight: 1 }}>
          {theme.label.split("").map((ch, i) => {
            const v = k(f, [3 + i * 0.8, 10 + i * 0.8], [0, 1], out);
            return (
              <span key={i} style={{ display: "inline-block", opacity: v, translate: `0px ${(1 - v) * 50}px` }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: (1080 - W.w) / 2,
          top: 380,
          transformOrigin: "50% 50%",
          scale: String(0.85 + 0.15 * widgetIn),
          rotate: `${(1 - widgetIn) * side * 6}deg`,
        }}
      >
        <Widget theme={theme} qAt={8} aAt={24} f={f} h={900} />
      </div>

      {/* Was hier eingestellt ist */}
      <div style={{ position: "absolute", top: 1330, width: "100%", display: "flex", justifyContent: "center", gap: 14 }}>
        {[theme.colorName, theme.dark ? "Dunkel" : "Hell", "Eigenes Logo"].map((t, i) => {
          const v = spring({ frame: f - 14 - i * 3, fps, config: { damping: 14 } });
          return (
            <div
              key={t}
              style={{
                fontSize: 32,
                fontWeight: 600,
                padding: "12px 26px",
                borderRadius: 999,
                background: theme.dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.85)",
                color: fg,
                border: `2px solid ${mix(theme.color, 50, theme.dark ? "#060E1A" : "#ffffff")}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                scale: String(v),
              }}
            >
              {i === 0 && <div style={{ width: 22, height: 22, borderRadius: 11, background: theme.color }} />}
              {t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4) Raster: alle auf einen Blick ----------
const GRID_THEMES = [THEMES[0], THEMES[2], THEMES[4], THEMES[1], BASE, THEMES[3], EXTRA[0], THEMES[5], EXTRA[2]];
const Grid: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = 0.38;
  const tw = W.w * sc;
  const th = W.h * sc;
  const gap = 34;
  const gw = tw * 3 + gap * 2;
  const gh = th * 3 + gap * 2;
  const x0 = (1080 - gw) / 2;
  const y0 = 1120 - gh / 2;
  const zoomOut = k(f, [0, 28], [3.2, 1], Easing.bezier(0.16, 1, 0.3, 1));
  const zoomIn = k(f, [100, 120], [1, 4], Easing.bezier(0.7, 0, 0.84, 0));
  const z = zoomOut * zoomIn;
  const cap = spring({ frame: f - 22, fps, config: { damping: 14, stiffness: 140 } });
  const rot = k(f, [0, 110], [-4, 2], Easing.linear);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1200px at 540px 1100px, #10243f 0%, ${BRAND.navy} 75%)` }}>
      <BgGrid />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 1120px",
          scale: String(z),
          rotate: `${rot}deg`,
          filter: `blur(${Math.max(0, (zoomOut - 1) * 4) + (zoomIn - 1) * 6}px)`,
        }}
      >
        {GRID_THEMES.map((t, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const dist = Math.abs(col - 1) + Math.abs(row - 1);
          const v = spring({ frame: f - dist * 3, fps, config: { damping: 13, stiffness: 150 } });
          const float = Math.sin((f + i * 11) / 14) * 8;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x0 + col * (tw + gap),
                top: y0 + row * (th + gap) + float,
                width: tw,
                height: th,
                scale: String(v),
              }}
            >
              <div style={{ transformOrigin: "0 0", scale: String(sc) }}>
                <Widget theme={t} qAt={-99} aAt={-99} f={999} showTyping={false} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", color: "#fff", scale: String(0.7 + 0.3 * cap), opacity: Math.min(1, cap) * (1 - k(f, [100, 112], [0, 1])) }}>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02 }}>
          Passt zu
          <br />
          <span style={{ color: BRAND.blueGlow }}>jeder Marke.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 5) Outro ----------
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 }, durationInFrames: 18 });
  const logo = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 120 } });
  const item = (d: number): React.CSSProperties => ({ opacity: sp(d), translate: `0px ${(1 - sp(d)) * 40}px` });
  const hue = HOOK_THEMES[Math.floor(frame / BEAT) % HOOK_THEMES.length].color;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 700px at 540px 600px, rgba(26,111,212,.5) 0%, transparent 70%), linear-gradient(180deg, ${BRAND.navy} 0%, ${BRAND.navy2} 100%)`,
        color: "#fff",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
      <BgGrid />
      <div style={{ display: "flex", alignItems: "center", gap: 26, scale: String(logo) }}>
        <DialoptMark size={130} />
        <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: -3 }}>Dialopt</div>
      </div>
      <div style={{ ...item(14), fontSize: 84, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.06, marginTop: 70 }}>
        Ihr KI-Chatbot.
        <br />
        <span style={{ color: hue, filter: "brightness(1.3)" }}>In Ihrem Design.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56, alignItems: "flex-start" }}>
        {["Ihre Farben, Ihr Logo, Ihr Name", "Rund um die Uhr erreichbar", "Persönlich eingerichtet"].map((t, i) => (
          <div key={t} style={{ ...item(26 + i * 6), display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 500 }}>
            <Check />
            {t}
          </div>
        ))}
      </div>
      <div style={{ ...item(50), marginTop: 70, background: BRAND.blue, padding: "22px 46px", borderRadius: 999, fontSize: 50, fontWeight: 600, boxShadow: "0 20px 50px rgba(0,87,184,.45)" }}>
        ab 49 € / Monat
      </div>
      <div style={{ ...item(58), marginTop: 36, fontSize: 48, fontWeight: 500, color: BRAND.blueGlow }}>dialopt.de</div>
    </AbsoluteFill>
  );
};

// ---------- Kleinteile ----------
const Flash: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const v = k(f, [at - 2, at, at + 8], [0, 1, 0], Easing.linear);
  if (v <= 0) return null;
  return <AbsoluteFill style={{ background: "#fff", opacity: v }} />;
};

const BgGrid: React.FC<{ light?: boolean }> = ({ light }) => {
  const f = useCurrentFrame();
  const c = light ? "rgba(10,22,40,.05)" : "rgba(255,255,255,.05)";
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${c} 2px, transparent 2px), linear-gradient(90deg, ${c} 2px, transparent 2px)`,
        backgroundSize: "90px 90px",
        backgroundPosition: `0px ${f * 1.5}px`,
        maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 80%)",
      }}
    />
  );
};

const Kicker: React.FC<{ color: string; dark?: boolean; children: React.ReactNode }> = ({ color, dark, children }) => (
  <div
    style={{
      display: "inline-block",
      fontSize: 34,
      fontWeight: 600,
      color: dark ? "#fff" : color,
      background: dark ? mix(color, 35, "#060E1A") : "rgba(255,255,255,.9)",
      border: `2px solid ${mix(color, 45, dark ? "#060E1A" : "#ffffff")}`,
      padding: "8px 24px",
      borderRadius: 999,
    }}
  >
    {children}
  </div>
);

const Pointer: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <div style={{ position: "absolute", left: x - 6, top: y - 4 }}>
    {press > 0 && <div style={{ position: "absolute", left: -44, top: -44, width: 100, height: 100, borderRadius: 50, background: "rgba(255,255,255,.35)", scale: String(0.4 + press * 0.8) }} />}
    <svg width={60} height={70} viewBox="0 0 22 26" style={{ scale: String(1 - press * 0.15), transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.35))" }}>
      <path d="M2 1.5 L2 20 L7 15.5 L10.5 23.5 L13.8 22 L10.4 14.3 L17 14 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  </div>
);

// ---------- Sounds ----------
const Sfx: React.FC<{ at: number; src: string; volume?: number; rate?: number }> = ({ at, src, volume = 1, rate = 1 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={90} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} playbackRate={rate} />
  </Sequence>
);

const Sounds: React.FC = () => {
  const ed = (n: number) => S.editor + n;
  return (
    <>
      <Audio src={staticFile("sfx/beat.wav")} volume={0.55} />
      {/* Hook */}
      <Sfx at={0} src="impact" volume={0.7} />
      {Array.from({ length: 10 }, (_, i) => (
        <Sfx key={`t${i}`} at={i * 4} src="tick" volume={0.25} rate={1 + (i % 3) * 0.15} />
      ))}
      <Sfx at={18} src="whoosh" volume={0.6} />
      <Sfx at={S.editor - 4} src="whip" volume={0.55} />
      {/* Editor */}
      {[E.c1, E.c2, E.c3, E.logo, E.field].map((c) => (
        <Sfx key={`c${c}`} at={ed(c) - 1} src="mouse-click" volume={0.6} />
      ))}
      {[E.c1, E.c2, E.c3, E.logo].map((c) => (
        <Sfx key={`p${c}`} at={ed(c)} src="pop" volume={0.35} />
      ))}
      <Sfx at={ed(E.dark) - 1} src="switch" volume={0.6} />
      {Array.from({ length: NAME.length }, (_, i) => (
        <Sfx key={`k${i}`} at={ed(E.typeStart) + i * 1.6} src="mouse-click" volume={0.18} rate={1.6 + (i % 4) * 0.12} />
      ))}
      {/* Showcase */}
      {THEMES.map((_, i) => {
        const s = S.show + i * CARD;
        return (
          <React.Fragment key={`s${i}`}>
            <Sfx at={s - 3} src={i % 2 === 0 ? "whip" : "whoosh"} volume={0.6} />
            <Sfx at={s + 8} src="pop" volume={0.3} />
            <Sfx at={s + 24} src="snapchat-notification" volume={0.35} />
          </React.Fragment>
        );
      })}
      {/* Raster */}
      <Sfx at={S.grid} src="whoosh" volume={0.7} rate={0.7} />
      <Sfx at={S.grid + 2} src="impact" volume={0.45} />
      <Sfx at={S.grid + 22} src="shutter-modern" volume={0.3} />
      <Sfx at={S.outro - 45} src="riser" volume={0.55} />
      {/* Outro */}
      <Sfx at={S.outro} src="impact" volume={0.9} />
      <Sfx at={S.outro + 50} src="ding" volume={0.35} />
    </>
  );
};

// ---------- Icons ----------
const Icon: React.FC<{ name: IconName | "send"; size: number; color: string }> = ({ name, size, color }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "house":
      return (
        <svg {...p}>
          <path d="M3 10.5 12 3l9 7.5V21H3z" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
        </svg>
      );
    case "tooth":
      return (
        <svg {...p}>
          <path d="M7 3C4.5 3 3 5 3 7.5c0 3 1.5 4.5 2 7.5.4 2.6 1 6 2.5 6s1.8-4 2.5-6c.3-.9 1.7-.9 2 0 .7 2 1 6 2.5 6s2.1-3.4 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...p}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...p}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "bag":
      return (
        <svg {...p}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...p}>
          <path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" />
        </svg>
      );
    case "send":
      return (
        <svg {...p}>
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
};

const DialoptMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect width="40" height="40" rx="9" fill={BRAND.blueLight} />
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

const Check: React.FC = () => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="11" fill={BRAND.blue} />
    <path d="m7 12.5 3.2 3.2L17 9" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
