// nodes.jsx — story-graph nodes: Agent, Wallet, Firewall, cards
// Loaded after ui.jsx.

// ── Agent node ───────────────────────────────────────────────────────────
function AgentNode({ x, y, status = 'Signed manifest', statusColor = T.amber, glow = false, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 280,
      transform: `scale(${scale})`, transformOrigin: 'top left',
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: 18,
        boxShadow: glow
          ? `0 0 0 1px ${T.blue}55, 0 18px 60px ${T.blue}25`
          : '0 14px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.blue} 0%, ${T.violet} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, color: '#fff',
            boxShadow: `0 0 18px ${T.blue}50`,
          }}>A</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: T.text, fontSize: 16, fontWeight: 700 }}>Demo Agent</div>
            <div style={{ color: T.muted, fontSize: 12, fontFamily: FONTS.mono }}>agent.demo</div>
          </div>
        </div>
        <div style={{
          marginTop: 14, padding: '10px 12px',
          border: `1px solid ${T.border}`, borderRadius: 10,
          background: T.deep,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: T.text2,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }} />
          {status}
        </div>
      </div>
    </div>
  );
}

// ── Wallet node ──────────────────────────────────────────────────────────
function WalletNode({ x, y, locked = true, glow = false, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 280,
      transform: `scale(${scale})`, transformOrigin: 'top left',
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: 18,
        boxShadow: glow
          ? `0 0 0 1px ${T.mint}55, 0 18px 60px ${T.mint}20`
          : '0 14px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: T.deep,
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WalletIcon size={22} color={T.text} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: T.text, fontSize: 16, fontWeight: 700 }}>Owner wallet</div>
            <div style={{ color: T.muted, fontSize: 12, fontFamily: FONTS.mono }}>13hF…op4Q</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <Tag color={T.blue}>Devnet</Tag>
          <Tag color={locked ? T.mint : T.amber}>{locked ? 'Funds protected' : 'Unlocked'}</Tag>
        </div>
      </div>
    </div>
  );
}

// ── Firewall block (vertical stack) ──────────────────────────────────────
function FirewallBlock({ x, y, active = null, scale = 1, label = 'Wallet firewall' }) {
  const lanes = [
    { key: 'allow',  label: 'Allow',  sub: 'Low-risk passes',     color: T.mint },
    { key: 'ask',    label: 'Ask',    sub: 'Spending → approval', color: T.amber },
    { key: 'block',  label: 'Block',  sub: 'Out-of-policy denied',color: T.red },
    { key: 'revoke', label: 'Revoke', sub: 'Identity cut off',    color: T.violet },
  ];
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 320,
      transform: `scale(${scale})`, transformOrigin: 'top center',
    }}>
      <div style={{
        background: T.deep, border: `1px solid ${T.border}`,
        borderRadius: 22, padding: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldIcon size={26} color={T.mint} />
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>SkillGuard</div>
          </div>
          <span style={{
            fontFamily: FONTS.mono, fontSize: 10, color: T.muted,
            letterSpacing: 0, textTransform: 'uppercase',
          }}>{label}</span>
        </div>
        {lanes.map((l) => {
          const on = active === l.key;
          return (
            <div key={l.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 8,
              background: on ? `${l.color}14` : T.card,
              border: `1px solid ${on ? l.color + '70' : T.border}`,
              borderRadius: 12,
              transition: 'all 220ms ease',
              boxShadow: on ? `0 0 0 1px ${l.color}40, 0 0 24px ${l.color}25` : 'none',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: 5, background: l.color,
                boxShadow: on ? `0 0 14px ${l.color}` : 'none',
              }} />
              <div style={{ flex: 1, lineHeight: 1.25 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: on ? l.color : T.text,
                  letterSpacing: 0,
                }}>{l.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{l.sub}</div>
              </div>
              {on && (
                <span style={{
                  fontFamily: FONTS.mono, fontSize: 10, color: l.color,
                  letterSpacing: 0, textTransform: 'uppercase',
                }}>ACTIVE</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Action card (used inline + on phone) ────────────────────────────────
function ActionCard({ x, y, title, spend, status, mode = 'allow', detail, width = 360 }) {
  const palette = {
    allow:  { color: T.mint,   icon: <CheckIcon color={T.mint} />,   label: 'Auto-approved' },
    ask:    { color: T.amber,  icon: <AlertIcon color={T.amber} />,  label: 'Needs approval' },
    block:  { color: T.red,    icon: <BanIcon color={T.red} />,      label: 'Blocked' },
    revoke: { color: T.violet, icon: <RevokeIcon color={T.violet} />,label: 'Revoked' },
  }[mode];
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      background: T.card, border: `1px solid ${palette.color}40`,
      borderRadius: 14, padding: 18,
      boxShadow: `0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px ${palette.color}10`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${palette.color}50`, background: `${palette.color}1A`,
          fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700,
          color: palette.color, letterSpacing: 0, textTransform: 'uppercase',
        }}>
          {palette.icon}{palette.label}
        </div>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700,
          color: spend === '0 SOL' ? T.text2 : palette.color,
        }}>{spend}</div>
      </div>
      <div style={{ marginTop: 12, color: T.text, fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>
        {title}
      </div>
      {detail && (
        <div style={{ marginTop: 8, color: T.text2, fontSize: 13, lineHeight: 1.5 }}>{detail}</div>
      )}
      {status && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`,
          fontSize: 12, color: T.muted, fontFamily: FONTS.mono,
          letterSpacing: 0, textTransform: 'uppercase',
        }}>{status}</div>
      )}
    </div>
  );
}

// ── Policy card ──────────────────────────────────────────────────────────
function PolicyCard({ x, y, mode = 'Allow under limits', width = 420, highlight = null }) {
  const rows = [
    { k: 'Mode',         v: mode },
    { k: 'Network',      v: 'Solana devnet' },
    { k: 'Max per action', v: '0.01 SOL' },
    { k: 'Daily cap',    v: '0.05 SOL' },
    { k: 'Protocols',    v: 'Helius, Birdeye' },
  ];
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 20,
      boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 11, color: T.muted,
          letterSpacing: 0, textTransform: 'uppercase',
        }}>Policy · Demo Agent</div>
        <Tag color={T.mint}>Active</Tag>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.k} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px',
            background: highlight === r.k ? `${T.mint}10` : T.deep,
            border: `1px solid ${highlight === r.k ? T.mint + '50' : T.border}`,
            borderRadius: 10,
          }}>
            <span style={{ color: T.text2, fontSize: 13 }}>{r.k}</span>
            <span style={{
              color: highlight === r.k ? T.mint : T.text,
              fontFamily: r.k === 'Max per action' || r.k === 'Daily cap' ? FONTS.mono : FONTS.body,
              fontSize: 13, fontWeight: 600,
            }}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: `${T.amber}0F`, border: `1px solid ${T.amber}40`, borderRadius: 10,
        color: T.amber, fontSize: 12, lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <AlertIcon size={14} color={T.amber} />
        <span style={{ color: T.text2 }}>
          Auto-approval: zero-spend only. Spending still needs owner approval.
        </span>
      </div>
    </div>
  );
}

// ── Tech proof card ──────────────────────────────────────────────────────
function TechCard({ x, y, label, sub, mono, color = T.blue, width = 280 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      boxSizing: 'border-box',
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: 18,
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${color}1A`, border: `1px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4, background: color,
          boxShadow: `0 0 10px ${color}`,
        }} />
      </div>
      <div style={{ color: T.text, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
      <div style={{ marginTop: 6, color: T.text2, fontSize: 13, lineHeight: 1.4 }}>{sub}</div>
      {mono && (
        <div style={{
          marginTop: 12, fontFamily: FONTS.mono, fontSize: 11,
          color: T.muted, letterSpacing: 0,
        }}>{mono}</div>
      )}
    </div>
  );
}

// ── Bad-tradeoff card (used in Shot 2) ───────────────────────────────────
function TradeoffCard({ x, y, title, verdict, body, accent = T.red, icon, width = 360 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 22,
      boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${accent}14`, border: `1px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>{icon}</div>
      <div style={{ color: T.text, fontSize: 22, fontWeight: 700, lineHeight: 1.2, fontFamily: FONTS.display }}>
        {title}
      </div>
      <div style={{ marginTop: 10, color: T.text2, fontSize: 15, lineHeight: 1.55 }}>
        {body}
      </div>
      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        color: accent, fontFamily: FONTS.mono,
        fontSize: 12, fontWeight: 700, letterSpacing: 0, textTransform: 'uppercase',
      }}>
        <BanIcon size={14} color={accent} />{verdict}
      </div>
    </div>
  );
}

// ── Verb card (Allow / Ask / Block / Revoke) ────────────────────────────
function VerbCard({ x, y, color, label, line, sub, width = 300, highlight = false, glyph }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      boxSizing: 'border-box',
      background: T.card, border: `1px solid ${highlight ? color + '70' : T.border}`,
      borderRadius: 16, padding: 22,
      boxShadow: highlight ? `0 0 0 1px ${color}40, 0 18px 50px ${color}20` : '0 12px 30px rgba(0,0,0,0.4)',
      transition: 'all 280ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{glyph}</div>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 11, color, fontWeight: 700,
          letterSpacing: 0, textTransform: 'uppercase',
        }}>{label}</div>
      </div>
      <div style={{
        marginTop: 16, color: T.text, fontSize: 22, fontWeight: 700, lineHeight: 1.2,
        fontFamily: FONTS.display,
      }}>{line}</div>
      <div style={{ marginTop: 8, color: T.text2, fontSize: 14, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

// ── Animated request line + traveling dot ───────────────────────────────
function RequestLine({
  from,
  to,
  color = T.mint,
  progress = 0,
  width = 3,
  dashed = false,
  glow = true,
  label = null,
  labelOffsetX = 0,
  labelOffsetY = 0,
}) {
  // from / to: {x, y} on the stage (absolute coordinates)
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const dotX = from.x + dx * progress;
  const dotY = from.y + dy * progress;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const trail = 60;
  const baseOpacity = progress > 0 ? 0.25 : 0;
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} width="100%" height="100%">
        <line
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={color} strokeOpacity={baseOpacity}
          strokeWidth={width}
          strokeDasharray={dashed ? '8 8' : ''}
          strokeLinecap="round"
        />
        {progress > 0 && progress < 1.001 && (
          <>
            <line
              x1={from.x} y1={from.y}
              x2={dotX} y2={dotY}
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
              filter={glow ? `drop-shadow(0 0 8px ${color})` : undefined}
            />
            <circle cx={dotX} cy={dotY} r={9} fill={color} opacity="0.18" />
            <circle cx={dotX} cy={dotY} r={5} fill={color}
              style={{ filter: glow ? `drop-shadow(0 0 10px ${color})` : 'none' }} />
          </>
        )}
      </svg>
      {label && (
        <div style={{
          position: 'absolute',
          left: from.x + dx * 0.5 + labelOffsetX,
          top: from.y + dy * 0.5 + labelOffsetY,
          transform: 'translate(-50%, -130%)',
          padding: '4px 10px',
          background: `${color}1A`, border: `1px solid ${color}50`,
          borderRadius: 6,
          color, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: 0, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
    </>
  );
}

// ── Receipt chip (after wallet approval) ─────────────────────────────────
function ReceiptChip({ x, y, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `scale(${scale})`, transformOrigin: 'top left',
      background: T.card, border: `1px solid ${T.blue}55`,
      borderRadius: 14, padding: '14px 18px',
      boxShadow: `0 0 0 1px ${T.blue}20, 0 14px 40px ${T.blue}25`,
      display: 'flex', alignItems: 'center', gap: 14, width: 360,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${T.blue}14`, border: `1px solid ${T.blue}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileIcon size={20} color={T.blue} />
      </div>
      <div style={{ flex: 1, lineHeight: 1.25 }}>
        <div style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>Solana devnet receipt</div>
        <div style={{
          color: T.muted, fontFamily: FONTS.mono, fontSize: 11,
          letterSpacing: 0, marginTop: 4,
        }}>3z9k…Lq2P · manifest 0xa1…b7</div>
      </div>
      <Tag color={T.blue}>Onchain</Tag>
    </div>
  );
}

Object.assign(window, {
  AgentNode, WalletNode, FirewallBlock,
  ActionCard, PolicyCard, TechCard, TradeoffCard, VerbCard,
  RequestLine, ReceiptChip,
});
