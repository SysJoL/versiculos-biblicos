import { useMemo } from "react";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";

/** Id del nodo cuadrado que se captura para exportar el versículo como PNG. */
export const SQUARE_CAPTURE_ID = "refugio-verse-square-capture";

/** Tamaño del lienzo cuadrado (ideal para compartir en redes/estados). */
export const SQUARE_SIZE = 1080;

/** PRNG determinista: los destellos no cambian entre renders del mismo versículo. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = {
  text: string;
  refLabel: string;
  seedKey: string;
  sanctuary?: SanctuaryTheme;
  footerText?: string;
};

export function VerseSquareImage({
  text,
  refLabel,
  seedKey,
  sanctuary = "celestial",
  footerText = "Refugio Celestial",
}: Props) {
  const isNature = sanctuary === "nature";

  const sparkles = useMemo(() => {
    let seed = 0;
    for (const ch of seedKey) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    const rand = mulberry32(seed);
    return Array.from({ length: 80 }, (_, i) => {
      const size = 2 + rand() * 4;
      const gold = rand() > 0.35;
      return {
        id: i,
        left: rand() * 100,
        top: rand() * 100,
        size,
        opacity: 0.25 + rand() * 0.75,
        color: gold ? "#f5d97e" : "#ffffff",
      };
    });
  }, [seedKey]);

  const stars = useMemo(() => {
    let seed = 7;
    for (const ch of seedKey) seed = (seed * 17 + ch.charCodeAt(0)) | 0;
    const rand = mulberry32(seed);
    return Array.from({ length: 7 }, (_, i) => ({
      id: i,
      left: 6 + rand() * 88,
      top: 6 + rand() * 88,
      size: 18 + rand() * 22,
      opacity: 0.5 + rand() * 0.5,
    }));
  }, [seedKey]);

  const fontSize = text.length > 320 ? 42 : text.length > 190 ? 50 : 58;

  const baseBg = isNature ? "#08120a" : "#0b0f24";
  const glowA = isNature
    ? "radial-gradient(circle at 18% 12%, rgba(52,211,153,0.28), transparent 55%)"
    : "radial-gradient(circle at 18% 12%, rgba(232,197,71,0.22), transparent 55%)";
  const glowB = isNature
    ? "radial-gradient(circle at 85% 88%, rgba(16,185,129,0.20), transparent 55%)"
    : "radial-gradient(circle at 85% 88%, rgba(99,102,241,0.30), transparent 55%)";
  const accent = isNature ? "#6ee7b7" : "#f5d97e";
  const accentSoft = isNature
    ? "rgba(52,211,153,0.55)"
    : "rgba(232,197,71,0.55)";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: -12000,
        top: 0,
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        id={SQUARE_CAPTURE_ID}
        style={{
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          position: "relative",
          backgroundColor: baseBg,
          backgroundImage: `${glowA}, ${glowB}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Destellos de luz */}
        {sparkles.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: 999,
              backgroundColor: s.color,
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            }}
          />
        ))}
        {stars.map((s) => (
          <div
            key={`star-${s.id}`}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              fontSize: s.size,
              lineHeight: 1,
              color: accent,
              opacity: s.opacity,
              textShadow: `0 0 ${s.size}px ${accentSoft}`,
            }}
          >
            ✦
          </div>
        ))}

        {/* Marco interior */}
        <div
          style={{
            position: "absolute",
            inset: 44,
            border: `2px solid ${accentSoft}`,
            borderRadius: 28,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 58,
            border: `1px solid ${accentSoft}`,
            borderRadius: 20,
            opacity: 0.55,
          }}
        />

        {/* Contenido centrado */}
        <div
          style={{
            position: "relative",
            width: SQUARE_SIZE - 340,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <img
            src="/img/logo-refugio-celestial-best.png"
            alt=""
            width={116}
            height={116}
            style={{
              width: 116,
              height: 116,
              borderRadius: 999,
              objectFit: "cover",
              marginBottom: 36,
            }}
          />
          <p
            style={{
              margin: 0,
              color: "#fdf6e3",
              fontSize,
              lineHeight: 1.55,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
            }}
          >
            “{text}”
          </p>
          <p
            style={{
              margin: "36px 0 0",
              color: accent,
              fontSize: 40,
              letterSpacing: 4,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
            }}
          >
            {refLabel}
          </p>
          <div
            style={{
              marginTop: 34,
              height: 2,
              width: 180,
              backgroundImage: `linear-gradient(to right, transparent, ${accent}, transparent)`,
            }}
          />
          <p
            style={{
              margin: "22px 0 0",
              color: "rgba(253,246,227,0.6)",
              fontSize: 28,
              letterSpacing: 6,
              fontFamily: "Georgia, serif",
            }}
          >
            {footerText}
          </p>
        </div>
      </div>
    </div>
  );
}
