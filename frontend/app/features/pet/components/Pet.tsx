export type Accessory = "cap" | "bow" | "crown" | "glass";
type Props = {
  mood?: "happy" | "sad";
  accessories?: Accessory[];
  size?: number;
  bob?: boolean;
};

const has = (a: Accessory[], k: Accessory) => a.includes(k);
const S = "#2b2118";

export function Pet({ mood = "happy", accessories = [], size = 200, bob }: Props) {
  return (
    <div className={`pet ${bob ? "bob" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" role="img" aria-label="ペット">
        <ellipse cx="100" cy="172" rx="52" ry="28" fill="#f6b26b" stroke={S} strokeWidth="5" />
        <ellipse cx="72" cy="188" rx="16" ry="9" fill="#fff4dc" stroke={S} strokeWidth="4" />
        <ellipse cx="128" cy="188" rx="16" ry="9" fill="#fff4dc" stroke={S} strokeWidth="4" />
        <path d="M44 78L38 26l48 32z" fill="#f6b26b" stroke={S} strokeWidth="5" strokeLinejoin="round" />
        <path d="M156 78l6-52-48 32z" fill="#f6b26b" stroke={S} strokeWidth="5" strokeLinejoin="round" />
        <path d="M50 66l-3-26 22 15z" fill="#ffb3a7" />
        <path d="M150 66l3-26-22 15z" fill="#ffb3a7" />
        <ellipse cx="100" cy="112" rx="72" ry="60" fill="#f6b26b" stroke={S} strokeWidth="5" />
        <path d="M92 56v14M100 54v16M108 56v14" stroke="#c97f2e" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="62" cy="128" rx="13" ry="9" fill="#ffb3a7" />
        <ellipse cx="138" cy="128" rx="13" ry="9" fill="#ffb3a7" />
        {mood === "happy" ? (
          <g>
            <circle cx="76" cy="106" r="8" fill={S} />
            <circle cx="124" cy="106" r="8" fill={S} />
            <circle cx="79" cy="103" r="3" fill="#fff" />
            <circle cx="127" cy="103" r="3" fill="#fff" />
            <path d="M88 130q6 8 12 0q6 8 12 0" fill="none" stroke={S} strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M66 108q10-8 20 0M114 108q10-8 20 0" fill="none" stroke={S} strokeWidth="5" strokeLinecap="round" />
            <path d="M88 138q12-10 24 0" fill="none" stroke={S} strokeWidth="4" strokeLinecap="round" />
            <path d="M146 112q6 10 0 16q-6-6 0-16z" fill="#7cc7e8" stroke={S} strokeWidth="2" />
          </g>
        )}
        <path d="M95 120h10l-5 6z" fill="#e2573d" stroke={S} strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 118l-22-4M36 128l-22 6M164 118l22-4M164 128l22 6" stroke={S} strokeWidth="3" strokeLinecap="round" />
        {has(accessories, "cap") && (
          <g>
            <path d="M52 66q48-52 96 0z" fill="#f2542d" stroke={S} strokeWidth="5" strokeLinejoin="round" />
            <path d="M120 62q40-6 42 6q-30 4-42-6z" fill="#f2542d" stroke={S} strokeWidth="5" strokeLinejoin="round" />
          </g>
        )}
        {has(accessories, "bow") && (
          <g>
            <path d="M150 52l24-14v32z" fill="#ff6fa0" stroke={S} strokeWidth="4" strokeLinejoin="round" />
            <path d="M150 52l-24-14v32z" fill="#ff6fa0" stroke={S} strokeWidth="4" strokeLinejoin="round" />
            <circle cx="150" cy="52" r="8" fill="#ffc93c" stroke={S} strokeWidth="4" />
          </g>
        )}
        {has(accessories, "crown") && (
          <path d="M70 62l-6-34 22 18 14-24 14 24 22-18-6 34z" fill="#ffc93c" stroke={S} strokeWidth="5" strokeLinejoin="round" />
        )}
        {has(accessories, "glass") && (
          <g>
            <circle cx="76" cy="106" r="17" fill="rgba(255,255,255,.4)" stroke={S} strokeWidth="5" />
            <circle cx="124" cy="106" r="17" fill="rgba(255,255,255,.4)" stroke={S} strokeWidth="5" />
            <path d="M93 106h14" stroke={S} strokeWidth="5" />
          </g>
        )}
      </svg>
    </div>
  );
}
