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

// ---------- Schrift & Farben (aus dialopt.de) ----------
for (const w of ["400", "500", "600"]) {
  loadFont({ family: "Geist", url: staticFile(`geist-${w}.woff2`), weight: w });
}

const C = {
  blue: "#0057B8",
  blueLight: "#1A6FD4",
  blueGlow: "#60a5fa",
  navy: "#060E1A",
  navy2: "#0A1628",
  ink: "#0A1628",
  ink2: "#475569",
  ink3: "#64748b",
  paper: "#f8fafc",
  paper2: "#f1f5f9",
  rule: "#d9e1ea",
  tint: "#e6eef8", // Markenblau 10 % auf Weiß (wie im echten Chatfenster)
  tintBorder: "#ccdcf1",
  // Fiktiver Kunde: Muster Hausverwaltung (Platzhalternamen, .example-Domain nach RFC 2606, Rufnummern aus dem BNetzA-Bereich fuer Film/Werbung)
  green: "#1f4d3a",
  greenSoft: "#e8f0eb",
};

const FONT = "Geist, 'Helvetica Neue', Arial, sans-serif";

// ---------- Zeitplan (Frames bei 30 fps) ----------
export const AD_DURATION = 640;
const T = {
  chatPop: 16,
  zoomIn: [45, 75] as const,
  typeStart: 84,
  send: 200,
  zoomOut: [204, 236] as const,
  typingDots: [212, 254] as const,
  reply: 254,
  cursorIn: 322,
  click: 350,
  collapse: [356, 376] as const,
  camBack: [354, 386] as const,
  scroll: [366, 418] as const,
  highlight: 424,
  zoomCard: [428, 460] as const,
  outro: 528,
};

const QUESTION =
  "Hallo, bei mir ist seit heute Abend die Heizung ausgefallen. Wo muss ich mich melden?";

const io = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const k = (f: number, inp: readonly number[], outp: number[], easing = io) =>
  interpolate(f, inp as number[], outp, { ...clamp, easing });

// Tippzeiten pro Zeichen (leicht unregelmäßig, deterministisch)
const CHAR_TIMES: number[] = (() => {
  const t: number[] = [];
  let acc = T.typeStart;
  for (let i = 0; i < QUESTION.length; i++) {
    t.push(acc);
    const ch = QUESTION[i];
    acc += 1.05 + random(`c${i}`) * 0.75 + (ch === "," || ch === "." ? 3 : 0);
  }
  return t;
})();
const TYPE_END = CHAR_TIMES[CHAR_TIMES.length - 1];

// ---------- Kamera ----------
// Pro Keyframe: Zoomfaktor s und Punkt (px, py), der in die Bildmitte rückt.
const CAM = {
  f: [0, T.zoomIn[0], T.zoomIn[1], T.zoomOut[0], T.zoomOut[1], T.camBack[0], T.camBack[1], T.zoomCard[0], T.zoomCard[1]],
  s: [1, 1, 1.75, 1.75, 1.45, 1.45, 1, 1, 1.1],
  x: [540, 540, 696, 696, 696, 696, 540, 540, 540],
  y: [960, 960, 1370, 1370, 1342, 1342, 960, 960, 948],
};

// ---------- Layout der "Website" ----------
const STAGE = { left: 60, top: 400, w: 960, h: 1440, chrome: 60 };
const VIEW_H = STAGE.h - STAGE.chrome; // 1420
const CHAT = { w: 600, h: 860, right: 24, bottom: 24 };
const SCROLL_TO = 1250;

// =====================================================================
export const ChatbotAd: React.FC = () => {
  const frame = useCurrentFrame();

  const s = k(frame, CAM.f, CAM.s);
  const px = k(frame, CAM.f, CAM.x);
  const py = k(frame, CAM.f, CAM.y);

  const outroP = k(frame, [T.outro, T.outro + 22], [0, 1], Easing.bezier(0.76, 0, 0.24, 1));

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.paper, overflow: "hidden" }}>
      <Background />

      {/* Kamera */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${540 - s * px}px, ${960 - s * py}px) scale(${s})`,
        }}
      >
        <Browser />
      </div>

      {/* Weicher Verlauf oben, damit die Texte beim Zoomen ruhig stehen */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 520,
          background: "linear-gradient(180deg, rgba(240,245,252,1) 0%, rgba(240,245,252,1) 45%, rgba(240,245,252,0) 100%)",
          opacity: interpolate(s, [1, 1.3], [0, 1], clamp),
        }}
      />

      <Captions />

      {/* Outro wischt von unten herein */}
      {frame >= T.outro && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(${(1 - outroP) * 100}% 0 0 0)`,
          }}
        >
          <Outro />
        </div>
      )}

      <Sounds />
    </AbsoluteFill>
  );
};

// ---------- Hintergrund ----------
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 30;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 700px at ${200 + drift}px 200px, #dbe8f8 0%, transparent 70%),
          radial-gradient(800px 800px at ${900 - drift}px 1700px, #d6e4f6 0%, transparent 70%),
          linear-gradient(180deg, #f4f8fd 0%, #eaf1fa 100%)`,
      }}
    />
  );
};

// ---------- Browserfenster mit Website ----------
const Browser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const scroll = k(frame, T.scroll, [0, SCROLL_TO], Easing.bezier(0.7, 0, 0.2, 1));

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top: STAGE.top,
        width: STAGE.w,
        height: STAGE.h,
        borderRadius: 28,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 40px 90px rgba(10,22,40,.18), 0 8px 24px rgba(10,22,40,.08)",
        opacity: enter,
        translate: `0px ${(1 - enter) * 80}px`,
      }}
    >
      {/* Browserleiste */}
      <div
        style={{
          height: STAGE.chrome,
          background: C.paper2,
          borderBottom: `1px solid ${C.rule}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 10,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 24,
            flex: 1,
            height: 36,
            borderRadius: 18,
            background: "#fff",
            border: `1px solid ${C.rule}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
            fontSize: 20,
            color: C.ink3,
          }}
        >
          <LockIcon />
          musterverwaltung.example
        </div>
      </div>

      {/* Sichtbereich */}
      <div style={{ position: "relative", height: VIEW_H, overflow: "hidden" }}>
        <div style={{ translate: `0px ${-scroll}px` }}>
          <Page />
        </div>
        <ChatWidget />
      </div>
    </div>
  );
};

// ---------- Fiktive Kundenwebsite ----------
const Page: React.FC = () => {
  return (
    <div style={{ width: STAGE.w, background: "#fff", color: C.ink }}>
      {/* Navigation */}
      <div
        style={{
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 44px",
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <HouseMark size={48} />
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>Muster</div>
            <div style={{ fontSize: 16, color: C.ink3 }}>Hausverwaltung</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 30, fontSize: 20, color: C.ink2, fontWeight: 500 }}>
          <span>Leistungen</span>
          <span>Team</span>
          <span>Kontakt</span>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          height: 620,
          position: "relative",
          background: `linear-gradient(160deg, ${C.green} 0%, #2d6a50 55%, #3f8566 100%)`,
          color: "#fff",
          padding: "70px 44px",
          overflow: "hidden",
        }}
      >
        <Skyline />
        <div style={{ position: "relative", fontSize: 20, fontWeight: 500, opacity: 0.8, letterSpacing: 1 }}>
          SEIT 1998 FÜR IHRE IMMOBILIE DA
        </div>
        <div style={{ position: "relative", fontSize: 58, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 18, maxWidth: 560 }}>
          Ihre Hausverwaltung im Schwarzwald
        </div>
        <div style={{ position: "relative", marginTop: 34, display: "inline-block", background: "#fff", color: C.green, fontWeight: 600, fontSize: 22, padding: "16px 28px", borderRadius: 999 }}>
          Schaden melden
        </div>
      </div>

      {/* Leistungen */}
      <div style={{ height: 520, padding: "60px 44px", background: C.paper }}>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Unsere Leistungen</div>
        <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
          {["Mietverwaltung", "WEG-Verwaltung", "Haustechnik"].map((t) => (
            <div key={t} style={{ flex: 1, height: 260, background: "#fff", borderRadius: 20, border: `1px solid ${C.rule}`, padding: 26 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: C.greenSoft }} />
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 22 }}>{t}</div>
              <div style={{ height: 12, width: "90%", background: C.paper2, borderRadius: 6, marginTop: 18 }} />
              <div style={{ height: 12, width: "70%", background: C.paper2, borderRadius: 6, marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ padding: "56px 30px 60px", background: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.green, letterSpacing: 1, paddingLeft: 14 }}>KONTAKT</div>
        <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: -1.2, marginTop: 8, paddingLeft: 14 }}>Ihre Ansprechpartner</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 34 }}>
          <PersonCard
            initials="EM"
            name="Erika Mustermann"
            role="Mietangelegenheiten & Verträge"
            phone="030 23125 412"
            mail="mieter@musterverwaltung.example"
            hours="Mo bis Fr, 9 bis 16 Uhr"
          />
          <PersonCard
            highlight
            initials="MM"
            name="Max Mustermann"
            role="Haustechnik & Notfälle"
            phone="030 23125 456"
            mail="technik@musterverwaltung.example"
            hours="Notdienst rund um die Uhr"
          />
          <PersonCard
            initials="TA"
            name="Team Abrechnung"
            role="Nebenkosten & Abrechnung"
            phone="030 23125 431"
            mail="abrechnung@musterverwaltung.example"
            hours="Mo bis Do, 8 bis 15 Uhr"
          />
        </div>
      </div>
      <div style={{ height: 400, background: C.green }} />
    </div>
  );
};

const PersonCard: React.FC<{
  initials: string;
  name: string;
  role: string;
  phone: string;
  mail: string;
  hours: string;
  highlight?: boolean;
}> = ({ initials, name, role, phone, mail, hours, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = highlight
    ? spring({ frame: frame - T.highlight, fps, config: { damping: 14, stiffness: 160 } })
    : 0;
  const glow = highlight ? k(frame, [T.highlight, T.highlight + 10], [0, 1], out) : 0;
  const pulse = highlight && frame > T.highlight ? (Math.sin((frame - T.highlight) / 7) + 1) / 2 : 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 28,
        alignItems: "center",
        padding: "28px 30px",
        borderRadius: 24,
        background: "#fff",
        border: `2px solid ${glow > 0 ? `rgba(0,87,184,${glow})` : C.rule}`,
        boxShadow: glow
          ? `0 0 0 ${8 + pulse * 6}px rgba(0,87,184,${0.12 * glow}), 0 24px 50px rgba(0,87,184,${0.18 * glow})`
          : "0 2px 8px rgba(10,22,40,.04)",
        scale: String(1 + h * 0.035),
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          flexShrink: 0,
          background: highlight ? `linear-gradient(135deg, ${C.green}, #3f8566)` : C.greenSoft,
          color: highlight ? "#fff" : C.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          fontWeight: 600,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>{name}</div>
        <div style={{ fontSize: 21, color: C.ink3, marginTop: 2 }}>{role}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, fontSize: 22, color: C.ink2 }}>
          <Row icon={<PhoneIcon color={C.green} />} text={phone} />
          <Row icon={<MailIcon color={C.green} />} text={mail} />
          <Row icon={<ClockIcon color={C.green} />} text={hours} />
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ icon: React.ReactNode; text: string; color?: string; weight?: number }> = ({ icon, text, color, weight }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color, fontWeight: weight }}>
    <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
    <span>{text}</span>
  </div>
);

// ---------- Chatfenster (Look wie das echte Dialopt-Widget) ----------
const ChatWidget: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame: frame - T.chatPop, fps, config: { damping: 15, stiffness: 140 } });
  const collapse = k(frame, T.collapse, [0, 1], Easing.bezier(0.7, 0, 0.84, 0));
  const scale = pop * (1 - collapse * 0.92);
  const fabIn = spring({ frame: frame - T.collapse[1] + 4, fps, config: { damping: 12 } });

  return (
    <>
      {frame >= T.collapse[1] - 4 && (
        <div
          style={{
            position: "absolute",
            right: CHAT.right + 6,
            bottom: CHAT.bottom + 6,
            width: 104,
            height: 104,
            borderRadius: 52,
            background: C.blue,
            boxShadow: "0 16px 36px rgba(0,87,184,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(fabIn),
          }}
        >
          <ChatIcon />
        </div>
      )}
      {collapse < 1 && (
        <div
          style={{
            position: "absolute",
            right: CHAT.right,
            bottom: CHAT.bottom,
            width: CHAT.w,
            height: CHAT.h,
            borderRadius: 26,
            overflow: "hidden",
            background: "#fff",
            border: `1px solid ${C.tintBorder}`,
            boxShadow: "0 30px 80px rgba(10,22,40,.22), 0 6px 18px rgba(10,22,40,.08)",
            transformOrigin: "100% 100%",
            scale: String(Math.max(scale, 0.0001)),
            opacity: 1 - collapse,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ChatHeader />
          <ChatMessages />
          <ChatInput />
          <Cursor />
        </div>
      )}
    </>
  );
};

const ChatHeader: React.FC = () => (
  <div
    style={{
      background: C.tint,
      borderBottom: `1px solid ${C.tintBorder}`,
      padding: "22px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}
  >
    <div style={{ width: 62, height: 62, borderRadius: 31, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <HouseMark size={40} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: -0.4 }}>Hausverwaltung Assistent</div>
      <div style={{ fontSize: 18, color: C.ink3, display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: "#22c55e" }} />
        Online · antwortet sofort
      </div>
    </div>
    <div style={{ width: 44, height: 44, borderRadius: 22, background: "#fff", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
      ×
    </div>
  </div>
);

const bubbleBase: React.CSSProperties = {
  maxWidth: "84%",
  padding: "16px 20px",
  borderRadius: 22,
  fontSize: 24,
  lineHeight: 1.4,
};

const REPLY_WORDS =
  "Oh nein, das tut mir leid! Bei einem Heizungsausfall hilft Ihnen direkt unser Haustechniker Max Mustermann weiter:".split(
    " ",
  );

const ChatMessages: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const userIn = spring({ frame: frame - T.send, fps, config: { damping: 16, stiffness: 180 } });
  const replyIn = spring({ frame: frame - T.reply, fps, config: { damping: 16, stiffness: 180 } });
  const wordsShown = Math.floor(k(frame, [T.reply, T.reply + 30], [0, REPLY_WORDS.length], Easing.linear));
  const part = (start: number) => k(frame, [start, start + 8], [0, 1], out);
  const showDots = frame >= T.typingDots[0] && frame < T.typingDots[1];

  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ ...bubbleBase, background: C.tint, color: C.ink, borderBottomLeftRadius: 6 }}>
        Hallo! Ich bin der digitale Assistent der Muster Hausverwaltung. Wie kann ich Ihnen helfen?
      </div>

      {frame < T.send && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["Schaden melden", "Nebenkosten", "Wohnung kündigen", "Ansprechpartner"].map((t, i) => {
            const v = k(frame, [T.chatPop + 10 + i * 4, T.chatPop + 22 + i * 4], [0, 1], out);
            return (
              <div
                key={t}
                style={{
                  fontSize: 21,
                  fontWeight: 500,
                  color: C.blue,
                  border: `1.5px solid ${C.tintBorder}`,
                  borderRadius: 999,
                  padding: "9px 18px",
                  opacity: v,
                  translate: `0px ${(1 - v) * 10}px`,
                }}
              >
                {t}
              </div>
            );
          })}
        </div>
      )}

      {frame >= T.send && (
        <div
          style={{
            ...bubbleBase,
            alignSelf: "flex-end",
            background: C.blue,
            color: "#fff",
            borderBottomRightRadius: 6,
            transformOrigin: "100% 100%",
            scale: String(0.85 + 0.15 * userIn),
            opacity: userIn,
          }}
        >
          {QUESTION}
        </div>
      )}

      {showDots && (
        <div style={{ ...bubbleBase, background: C.tint, borderBottomLeftRadius: 6, display: "flex", gap: 8, padding: "22px 24px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: C.blue,
                opacity: 0.35 + 0.65 * ((Math.sin((frame - i * 4) / 3.2) + 1) / 2),
                translate: `0px ${-6 * ((Math.sin((frame - i * 4) / 3.2) + 1) / 2)}px`,
              }}
            />
          ))}
        </div>
      )}

      {frame >= T.reply && (
        <div
          style={{
            ...bubbleBase,
            maxWidth: "90%",
            background: C.tint,
            color: C.ink,
            borderBottomLeftRadius: 6,
            transformOrigin: "0% 100%",
            scale: String(0.85 + 0.15 * replyIn),
            opacity: replyIn,
          }}
        >
          <div>
            {REPLY_WORDS.map((w, i) => (
              <span key={i} style={{ opacity: i < wordsShown ? 1 : 0 }}>
                {w}{" "}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ opacity: part(286), translate: `0px ${(1 - part(286)) * 10}px` }}>
              <Row icon={<PhoneIcon color={C.blue} />} text="030 23125 456" weight={600} />
            </div>
            <div style={{ opacity: part(293), translate: `0px ${(1 - part(293)) * 10}px` }}>
              <Row icon={<MailIcon color={C.blue} />} text="technik@musterverwaltung.example" weight={600} />
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              opacity: part(302),
              translate: `0px ${(1 - part(302)) * 10}px`,
            }}
          >
            <LinkChip />
          </div>
        </div>
      )}
    </div>
  );
};

const LinkChip: React.FC = () => {
  const frame = useCurrentFrame();
  const press = k(frame, [T.click - 2, T.click + 2, T.click + 8], [0, 1, 0], Easing.linear);
  const hover = k(frame, [T.click - 12, T.click - 4], [0, 1], out);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 20px",
        borderRadius: 14,
        background: hover > 0 ? `rgba(0,87,184,${0.08 + hover * 0.9})` : "#fff",
        color: hover > 0.5 ? "#fff" : C.blue,
        border: `2px solid ${C.blue}`,
        fontWeight: 600,
        fontSize: 23,
        scale: String(1 - press * 0.06),
      }}
    >
      Zum Ansprechpartner
      <ArrowIcon color={hover > 0.5 ? "#fff" : C.blue} />
    </div>
  );
};

const ChatInput: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = frame >= T.send ? 0 : CHAR_TIMES.filter((t) => t <= frame).length;
  const text = QUESTION.slice(0, typed);
  const typingNow = frame >= T.typeStart && frame <= TYPE_END + 4;
  const caretOn = typingNow || Math.floor(frame / 15) % 2 === 0;
  const focused = frame >= T.zoomIn[0] + 10 && frame < T.send + 4;
  const sendPress = k(frame, [T.send - 3, T.send, T.send + 6], [0, 1, 0], Easing.linear);
  const sendActive = typed > 0;

  return (
    <div style={{ background: "#fff", padding: "14px 18px 20px", display: "flex", alignItems: "flex-end", gap: 12 }}>
      <div
        style={{
          flex: 1,
          minHeight: 64,
          borderRadius: 22,
          border: `2px solid ${focused ? C.blue : C.tintBorder}`,
          boxShadow: focused ? "0 0 0 4px rgba(0,87,184,.12)" : "none",
          padding: "14px 20px",
          fontSize: 24,
          lineHeight: 1.4,
          color: typed ? C.ink : C.ink3,
        }}
      >
        {typed ? text : focused ? "" : "Nachricht schreiben …"}
        {focused && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 28,
              background: C.blue,
              marginLeft: 2,
              verticalAlign: "-5px",
              opacity: caretOn ? 1 : 0,
            }}
          />
        )}
      </div>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: sendActive ? C.blue : C.tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          scale: String(1 - sendPress * 0.15),
        }}
      >
        <SendIcon color={sendActive ? "#fff" : C.blue} />
      </div>
    </div>
  );
};

// Mauszeiger, fährt zum Link und klickt
const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.cursorIn || frame > T.collapse[0] + 4) return null;
  const p = k(frame, [T.cursorIn, T.click - 6], [0, 1], Easing.bezier(0.33, 0, 0.15, 1));
  const x = interpolate(p, [0, 1], [520, 300]);
  const y = interpolate(p, [0, 1], [CHAT.h - 300, CHAT.h - CURSOR_FROM_BOTTOM]);
  const fade = k(frame, [T.cursorIn, T.cursorIn + 6], [0, 1], out);
  const press = k(frame, [T.click - 2, T.click + 2, T.click + 8], [0, 1, 0], Easing.linear);
  const ripple = k(frame, [T.click, T.click + 16], [0, 1], out);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: fade, pointerEvents: "none" }}>
      {frame >= T.click && (
        <div
          style={{
            position: "absolute",
            left: -40,
            top: -40,
            width: 80,
            height: 80,
            borderRadius: 40,
            border: `4px solid ${C.blue}`,
            opacity: 1 - ripple,
            scale: String(0.3 + ripple),
          }}
        />
      )}
      <svg width={44} height={52} viewBox="0 0 22 26" style={{ scale: String(1 - press * 0.15), transformOrigin: "0 0", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.3))" }}>
        <path d="M2 1.5 L2 20 L7 15.5 L10.5 23.5 L13.8 22 L10.4 14.3 L17 14 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
// Abstand des Links vom unteren Rand des Chatfensters (am gerenderten Bild gemessen)
const CURSOR_FROM_BOTTOM = 200;

// ---------- Texte oben ----------
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const elapsed = Math.min(Math.max(frame - T.send, 0), T.reply - T.send) / 30;
  return (
    <>
      <Caption from={6} to={196} kicker="Sonntag, 22:47 Uhr">
        Die Heizung ist ausgefallen.
      </Caption>
      <Caption from={206} to={350} kicker="KI-Chatbot von Dialopt">
        Antwort nach{" "}
        <span style={{ color: C.blue, fontVariantNumeric: "tabular-nums" }}>
          {elapsed.toFixed(1).replace(".", ",")} s
        </span>
      </Caption>
      <Caption from={362} to={T.outro + 4} kicker="Direkt verbunden">
        Zur richtigen Person.
      </Caption>
    </>
  );
};

const Caption: React.FC<{ from: number; to: number; kicker: string; children: React.ReactNode }> = ({ from, to, kicker, children }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to + 12) return null;
  const inP = k(frame, [from, from + 14], [0, 1], out);
  const outP = k(frame, [to, to + 10], [0, 1], io);
  const v = inP * (1 - outP);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: v,
        translate: `0px ${(1 - inP) * 30 - outP * 20}px`,
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 500,
          color: C.blue,
          background: "rgba(255,255,255,.92)",
          border: `1px solid ${C.tintBorder}`,
          padding: "8px 22px",
          borderRadius: 999,
          marginBottom: 16,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 600,
          letterSpacing: -2.5,
          lineHeight: 1.05,
          color: C.ink,
          background: "rgba(255,255,255,.92)",
          padding: "10px 28px 16px",
          borderRadius: 26,
          boxShadow: "0 12px 40px rgba(10,22,40,.10)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------- Outro ----------
const Outro: React.FC = () => {
  const frame = useCurrentFrame() - T.outro;
  const { fps } = useVideoConfig();
  const sp = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 }, durationInFrames: 20 });
  const logo = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 120 } });
  const item = (d: number): React.CSSProperties => ({ opacity: sp(d), translate: `0px ${(1 - sp(d)) * 40}px` });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 700px at 540px 640px, rgba(26,111,212,.45) 0%, transparent 70%), linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
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

      <div style={{ ...item(22), fontSize: 84, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.06, marginTop: 70 }}>
        Ihr KI-Chatbot
        <br />
        für die Website.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56, alignItems: "flex-start" }}>
        {["Antwortet in Sekunden", "Rund um die Uhr erreichbar", "Persönlich eingerichtet"].map((t, i) => (
          <div key={t} style={{ ...item(34 + i * 6), display: "flex", alignItems: "center", gap: 20, fontSize: 46, fontWeight: 500 }}>
            <CheckIcon />
            {t}
          </div>
        ))}
      </div>

      <div
        style={{
          ...item(58),
          marginTop: 70,
          background: C.blue,
          padding: "22px 46px",
          borderRadius: 999,
          fontSize: 50,
          fontWeight: 600,
          boxShadow: "0 20px 50px rgba(0,87,184,.45)",
        }}
      >
        ab 49 € / Monat
      </div>
      <div style={{ ...item(66), marginTop: 36, fontSize: 48, fontWeight: 500, color: C.blueGlow }}>dialopt.de</div>
    </AbsoluteFill>
  );
};

// ---------- Sounds ----------
const Sfx: React.FC<{ at: number; src: string; volume?: number; rate?: number }> = ({ at, src, volume = 1, rate = 1 }) => (
  <Sequence from={Math.round(at)} durationInFrames={60} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} playbackRate={rate} />
  </Sequence>
);

const Sounds: React.FC = () => (
  <>
    <Sfx at={T.chatPop} src="switch" volume={0.5} />
    <Sfx at={T.zoomIn[0] + 2} src="whoosh" volume={0.7} />
    {CHAR_TIMES.map((t, i) =>
      QUESTION[i] === " " ? null : (
        <Sfx key={i} at={t} src="mouse-click" volume={0.16 + random(`v${i}`) * 0.08} rate={1.5 + random(`r${i}`) * 0.5} />
      ),
    )}
    <Sfx at={T.send - 2} src="mouse-click" volume={0.7} />
    <Sfx at={T.send} src="whip" volume={0.45} />
    <Sfx at={T.zoomOut[0] + 2} src="whoosh" volume={0.55} />
    <Sfx at={T.reply} src="snapchat-notification" volume={0.75} />
    <Sfx at={T.click - 1} src="mouse-click" volume={0.85} />
    <Sfx at={T.collapse[0]} src="whip" volume={0.4} />
    <Sfx at={T.scroll[0]} src="whoosh" volume={0.8} rate={0.8} />
    <Sfx at={T.scroll[0] + 6} src="page-turn" volume={0.3} />
    <Sfx at={T.highlight} src="ding" volume={0.4} />
    <Sfx at={T.outro} src="whip" volume={0.6} />
    <Sfx at={T.outro + 10} src="whoosh" volume={0.6} />
    <Sfx at={T.outro + 58} src="switch" volume={0.45} />
    <Sfx at={T.outro + 66} src="ding" volume={0.35} />
  </>
);

// ---------- Icons ----------
const HouseMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect width="40" height="40" rx="10" fill={C.green} />
    <path d="M9 21 L20 11 L31 21 V30 H9 Z" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" />
    <rect x="17" y="23" width="6" height="7" fill="#fff" />
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

const Skyline: React.FC = () => (
  <svg width={960} height={320} viewBox="0 0 960 320" style={{ position: "absolute", right: -40, bottom: 0, opacity: 0.22 }}>
    <path d="M0 320 L0 200 L120 120 L240 200 L240 320 Z" fill="#fff" />
    <path d="M260 320 L260 150 L400 60 L540 150 L540 320 Z" fill="#fff" />
    <path d="M560 320 L560 210 L660 140 L760 210 L760 320 Z" fill="#fff" />
    <path d="M780 320 L780 170 L880 100 L980 170 L980 320 Z" fill="#fff" />
  </svg>
);

const iconProps = (color: string) => ({ width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

const PhoneIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg {...iconProps(color)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const MailIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg {...iconProps(color)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const ClockIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg {...iconProps(color)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const ArrowIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg {...iconProps(color)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const SendIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg {...iconProps(color)} width={30} height={30}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);
const LockIcon: React.FC = () => (
  <svg {...iconProps(C.ink3)} width={18} height={18}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const ChatIcon: React.FC = () => (
  <svg {...iconProps("#fff")} width={48} height={48}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CheckIcon: React.FC = () => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={C.blue} />
    <path d="m7 12.5 3.2 3.2L17 9" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
