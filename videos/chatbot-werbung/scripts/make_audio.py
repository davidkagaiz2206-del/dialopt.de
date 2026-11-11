"""Erzeugt Musik und Effekt-Sounds fuer das Design-Video komplett per Code.

Keine fremden Samples, also keine Lizenzfragen.
Aufruf: python3 scripts/make_audio.py  (schreibt nach public/sfx/)
"""
import os
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM  # 0,5 s = 15 Frames bei 30 fps
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def save(name, x, peak=0.89):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    st = np.stack([data, data], axis=1)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(st.tobytes())


def t(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def kick():
    tt = t(0.45)
    f = 45 + 110 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7) + 0.3 * np.exp(-tt * 300) * rng.standard_normal(len(tt))


def hat():
    tt = t(0.06)
    n = rng.standard_normal(len(tt))
    n = np.diff(n, prepend=0)  # Hochpass
    return n * np.exp(-tt * 70) * 0.35


def clap():
    tt = t(0.22)
    n = rng.standard_normal(len(tt))
    n = n - lowpass(n, 900)
    env = np.exp(-tt * 18)
    for d in (0.0, 0.012, 0.024):
        env += 0.6 * np.exp(-np.clip(tt - d, 0, None) * 120) * (tt >= d)
    return n * env * 0.45


def tone(freq, sec, harm=(1.0,), attack=0.01, release=0.15):
    tt = t(sec)
    x = sum(a * np.sin(2 * np.pi * freq * (i + 1) * tt) for i, a in enumerate(harm))
    env = np.minimum(1, tt / attack) * np.minimum(1, (sec - tt) / release)
    return x * np.clip(env, 0, 1)


def place(buf, clip, at):
    i = int(at * SR)
    j = min(len(buf), i + len(clip))
    if i < len(buf):
        buf[i:j] += clip[: j - i]


def beat_track(seconds=25.0):
    n = int(seconds * SR)
    drums = np.zeros(n)
    bass = np.zeros(n)
    pad = np.zeros(n)
    beats = int(seconds / BEAT)
    # Am F C G
    roots = [55.0, 43.65, 65.41, 49.0]
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 261.63, 329.63], [196.0, 246.94, 293.66]]
    k, h, c = kick(), hat(), clap()
    for b in range(beats):
        tb = b * BEAT
        bar = (b // 4) % 4
        # Kurze Pause vor dem Drop ins Outro (Outro startet bei 19 s)
        breakdown = 17.5 <= tb < 19.0
        if not breakdown:
            place(drums, k, tb)
            place(drums, h, tb + BEAT / 2)
            if b % 2 == 1:
                place(drums, c, tb)
            place(bass, tone(roots[bar], BEAT * 0.45, (1.0, 0.35, 0.12), 0.005, 0.08), tb + BEAT / 2)
        if b % 4 == 0:
            ch = sum(tone(f * (1 + d), BEAT * 4, (1.0, 0.2), 0.25, 0.6) for f in chords[bar] for d in (-0.003, 0.003))
            place(pad, ch, tb)
    pad = lowpass(pad, 1400)
    mix = drums * 1.0 + bass * 0.55 + pad * 0.16
    tt = np.arange(n) / SR
    mix *= np.clip((seconds - tt) / 1.5, 0, 1)  # Ausblenden
    return mix


def impact():
    tt = t(1.4)
    f = 32 + 90 * np.exp(-tt * 12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2)
    noise = rng.standard_normal(len(tt))
    noise = lowpass(noise, 2500) * np.exp(-tt * 14) * 0.6
    return body + noise


def riser():
    sec = 1.5
    tt = t(sec)
    n = rng.standard_normal(len(tt))
    # Rauschen, das heller und lauter wird
    lo = lowpass(n, 600)
    hi = n - lowpass(n, 3000)
    mix = lo * (1 - tt / sec) + hi * (tt / sec)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / sec) ** 2) / SR) * 0.25
    return (mix * 0.5 + sweep) * (tt / sec) ** 2


def tick():
    tt = t(0.05)
    return np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt * 90)


def pop():
    tt = t(0.12)
    f = 300 + 900 * np.exp(-tt * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    save("beat.wav", beat_track())
    save("impact.wav", impact())
    save("riser.wav", riser())
    save("tick.wav", tick(), 0.6)
    save("pop.wav", pop(), 0.7)
    print("ok")
