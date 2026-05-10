// ui.jsx — design tokens, fonts, primitives for SkillGuard story
// Loaded after React and animations.jsx.

const T = {
  bg:     '#030712',
  deep:   '#070D18',
  card:   '#0B1220',
  active: '#111827',
  border: '#1F2937',
  text:   '#F8FAFC',
  text2:  '#A7B0C0',
  muted:  '#6B7280',
  mint:   '#00F0A8',
  green:  '#00C781',
  blue:   '#58A6FF',
  violet: '#7B3FF7',
  amber:  '#F5B84B',
  red:    '#FF5A68',
};

const FONTS = {
  display: '"Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif',
  body:    'Inter, ui-sans-serif, system-ui, sans-serif',
  mono:    '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, monospace',
};

// ── Background scaffolding ──────────────────────────────────────────────
function StageBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(31,41,55,.55) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(31,41,55,.55) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 45%, black 30%, transparent 80%)',
        maskImage: 'radial-gradient(ellipse 75% 60% at 50% 45%, black 30%, transparent 80%)',
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(ellipse 60% 40% at 70% 30%, rgba(88,166,255,0.06), transparent 60%),' +
          'radial-gradient(ellipse 50% 35% at 25% 80%, rgba(0,240,168,0.05), transparent 60%)',
      }} />
    </div>
  );
}

// ── Brand chrome that sits above every scene ─────────────────────────────
function Watermark() {
  return (
    <div style={{
      position: 'absolute', top: 36, left: 56,
      display: 'flex', alignItems: 'center', gap: 12,
      color: T.text2, zIndex: 2,
    }}>
      <ShieldIcon size={28} color={T.mint} />
      <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 18, color: T.text, letterSpacing: 0 }}>
        SkillGuard
      </span>
      <span style={{ width: 1, height: 16, background: T.border }} />
      <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: T.muted, letterSpacing: 0, textTransform: 'uppercase' }}>
        Wallet firewall for AI agents
      </span>
    </div>
  );
}

function ChapterMark({ index, total = 10, label }) {
  return (
    <div style={{
      position: 'absolute', top: 36, right: 56,
      display: 'flex', alignItems: 'center', gap: 14,
      color: T.muted, zIndex: 2,
      fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0, textTransform: 'uppercase',
    }}>
      <span>{label}</span>
      <span style={{ color: T.text }}>{String(index).padStart(2, '0')}</span>
      <span style={{ color: T.border }}>/</span>
      <span>{String(total).padStart(2, '0')}</span>
    </div>
  );
}

// ── Text primitives ──────────────────────────────────────────────────────
function Eyebrow({ children, color = T.mint, x, y, size = 16 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      color, fontSize: size, fontWeight: 700, letterSpacing: 0, textTransform: 'uppercase',
      fontFamily: FONTS.body,
    }}>{children}</div>
  );
}

function Display({ children, x, y, size = 84, color = T.text, weight = 700, width = 1100, align = 'left' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width, textAlign: align,
      color, fontSize: size, fontWeight: weight, lineHeight: 1.04,
      fontFamily: FONTS.display, letterSpacing: 0,
    }}>{children}</div>
  );
}

function Body({ children, x, y, size = 22, color = T.text2, width = 720, weight = 400 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      color, fontSize: size, fontWeight: weight, lineHeight: 1.5,
      fontFamily: FONTS.body,
    }}>{children}</div>
  );
}

function MicroCopy({ children, x, y, color = T.text2, size = 18 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      color, fontSize: size, fontWeight: 500, letterSpacing: 0,
      fontFamily: FONTS.body,
    }}>{children}</div>
  );
}

function Mono({ children, x, y, color = T.muted, size = 14 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      color, fontSize: size, fontWeight: 500, letterSpacing: 0,
      fontFamily: FONTS.mono, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function Pill({ children, color = T.mint, x, y, icon = null, size = 16, inline = false }) {
  const style = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 14px',
    border: `1px solid ${color}55`,
    background: `${color}1A`,
    color, borderRadius: 999,
    fontSize: size, fontWeight: 600,
    fontFamily: FONTS.body,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  };
  if (inline) return <span style={style}>{icon}{children}</span>;
  return <div style={{ position: 'absolute', left: x, top: y, ...style }}>{icon}{children}</div>;
}

function InfoNote({ children, color = T.blue, x, y, width = 760, icon = null }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      borderRadius: 14,
      border: `1px solid ${color}40`,
      background: `${color}10`,
      color: T.text,
      fontSize: 18,
      fontWeight: 650,
      lineHeight: 1.35,
      boxShadow: '0 14px 40px rgba(0,0,0,0.32)',
    }}>
      {icon && <span style={{ display: 'inline-flex', flex: '0 0 auto' }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

function Tag({ children, color = T.blue, size = 11 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 8px', borderRadius: 6,
      border: `1px solid ${color}55`, background: `${color}1A`,
      color, fontSize: size, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase',
      fontFamily: FONTS.body,
    }}>{children}</span>
  );
}

// ── Icons (hand-rolled, single-stroke) ───────────────────────────────────
function ShieldIcon({ size = 24, color = T.mint, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
        fill={filled ? color + '20' : 'none'} />
      <path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WalletIcon({ size = 22, color = T.text }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2.5" stroke={color} strokeWidth="2" />
      <path d="M3 10h18" stroke={color} strokeWidth="2" />
      <circle cx="17" cy="14.5" r="1.5" fill={color} />
    </svg>
  );
}
function AgentIcon({ size = 22, color = T.text }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="13" rx="3" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="12.5" r="1.5" fill={color} />
      <circle cx="15" cy="12.5" r="1.5" fill={color} />
      <path d="M12 6V3M9 22h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function KeyIcon({ size = 22, color = T.amber }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="15" r="4" stroke={color} strokeWidth="2" />
      <path d="M11 12l8-8M16 7l3 3M14 9l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ size = 18, color = T.mint }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m5 12 5 5L20 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon({ size = 18, color = T.red }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
function AlertIcon({ size = 18, color = T.amber }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 2 20h20L12 3z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4M12 17.5v.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
function BanIcon({ size = 18, color = T.red }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="m6 6 12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function RevokeIcon({ size = 18, color = T.violet }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M3 4v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function QrIcon({ size = 22, color = T.text }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <path d="M14 14h3v3M21 17v4M14 19h2M19 14v0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CodeIcon({ size = 18, color = T.blue }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FileIcon({ size = 18, color = T.text2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stylized QR (deterministic, QR-like modules) ─────────────────────────
function FauxQR({ size = 180, color = T.text }) {
  const bits = React.useMemo(() => {
    const cells = 29;
    const arr = Array.from({ length: cells }, () => Array(cells).fill(0));
    const reserved = Array.from({ length: cells }, () => Array(cells).fill(false));
    const reserve = (r, c) => {
      if (r >= 0 && r < cells && c >= 0 && c < cells) reserved[r][c] = true;
    };
    const stamp = (sr, sc) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        arr[sr + r][sc + c] = edge || inner ? 1 : 0;
        reserved[sr + r][sc + c] = true;
      }
      for (let r = sr - 1; r <= sr + 7; r++) for (let c = sc - 1; c <= sc + 7; c++) reserve(r, c);
    };
    stamp(0, 0); stamp(0, 22); stamp(22, 0);

    for (let i = 8; i < 21; i++) {
      arr[6][i] = i % 2 === 0 ? 1 : 0;
      arr[i][6] = i % 2 === 0 ? 1 : 0;
      reserved[6][i] = reserved[i][6] = true;
    }

    const alignment = (sr, sc) => {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const edge = r === 0 || r === 4 || c === 0 || c === 4;
        const center = r === 2 && c === 2;
        arr[sr + r][sc + c] = edge || center ? 1 : 0;
        reserved[sr + r][sc + c] = true;
      }
    };
    alignment(20, 20);

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (reserved[r][c]) continue;
        const v = (r * 17 + c * 31 + r * c * 7 + (r ^ c) * 13) % 19;
        arr[r][c] = v === 0 || v === 2 || v === 5 || v === 7 || v === 11 || v === 13 ? 1 : 0;
      }
    }
    return arr;
  }, []);
  const cells = bits.length;
  const padding = 10;
  const inner = size - padding * 2;
  return (
    <div style={{
      width: size, height: size, background: '#fff',
      padding, borderRadius: 10, boxSizing: 'border-box',
    }}>
      <svg width={inner} height={inner} viewBox={`0 0 ${cells} ${cells}`} shapeRendering="crispEdges">
        {bits.map((row, r) => row.map((b, c) => b ? (
          <rect key={`${r}-${c}`} x={c} y={r} width={0.86} height={0.86} fill="#0B1220" rx="0.08" />
        ) : null))}
      </svg>
    </div>
  );
}

Object.assign(window, {
  T, FONTS,
  StageBg, Watermark, ChapterMark,
  Eyebrow, Display, Body, MicroCopy, Mono, Pill, Tag,
  ShieldIcon, WalletIcon, AgentIcon, KeyIcon,
  CheckIcon, XIcon, AlertIcon, BanIcon, RevokeIcon, QrIcon, CodeIcon, FileIcon,
  FauxQR,
});
