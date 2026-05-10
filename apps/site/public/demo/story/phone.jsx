// phone.jsx — phone frame + 5 screens (Home, Pair, Inbox, Agents, Activity)
// Loaded after ui.jsx + nodes.jsx.

const PHONE_W = 420;
const PHONE_H = 870;

// ── Frame ────────────────────────────────────────────────────────────────
function PhoneFrame({
  x, y, scale = 1,
  statusPill = 'Guarded', statusColor = T.mint, statusDot = true,
  activeTab = 'home',
  inboxBadge = false,
  children,
  raised = true,
}) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: PHONE_W, height: PHONE_H,
      transform: `scale(${scale})`, transformOrigin: 'top left',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: '#000',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 50,
        padding: 9,
        boxShadow: raised
          ? '0 50px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 30px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: '100%', height: '100%',
          background: T.deep,
          border: `1px solid ${T.border}`,
          borderRadius: 42,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Notch / status area */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 20px 6px 20px',
            color: T.muted, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0,
          }}>
            <span>9:41</span>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ width: 14, height: 8, border: `1px solid ${T.muted}`, borderRadius: 2, position: 'relative' }}>
                <span style={{ position: 'absolute', inset: '1px 1px 1px 1px', background: T.mint, borderRadius: 1 }} />
              </span>
            </span>
          </div>
          {/* App header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 18px 12px 18px',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldIcon size={26} color={T.mint} />
              <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>SkillGuard</div>
            </div>
            {statusPill && (
              <div style={{
                padding: '5px 10px', borderRadius: 999,
                border: `1px solid ${statusColor}55`,
                background: `${statusColor}14`,
                color: statusColor, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
                letterSpacing: 0,
              }}>
                {statusDot && <span style={{
                  width: 7, height: 7, borderRadius: 4, background: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`,
                }} />}
                {statusPill}
              </div>
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden', padding: 16 }}>
            {children}
          </div>
          {/* Tabs */}
          <PhoneTabs active={activeTab} inboxBadge={inboxBadge} />
        </div>
      </div>
    </div>
  );
}

function PhoneTabs({ active, inboxBadge }) {
  const tabs = ['Home', 'Inbox', 'Agents', 'Pair', 'Activity'];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
      padding: '8px 10px 12px',
      borderTop: `1px solid ${T.border}`,
      background: T.bg,
    }}>
      {tabs.map(t => {
        const k = t.toLowerCase();
        const on = active === k;
        return (
          <div key={t} style={{
            position: 'relative',
            textAlign: 'center', padding: '12px 4px',
            borderRadius: 8,
            background: on ? T.active : 'transparent',
            color: on ? T.text : T.muted,
            fontSize: 11, fontWeight: 800, letterSpacing: 0,
          }}>
            {t}
            {t === 'Inbox' && inboxBadge && (
              <span style={{
                position: 'absolute', right: 12, top: 8,
                width: 7, height: 7, borderRadius: 4, background: T.mint,
                boxShadow: `0 0 6px ${T.mint}`,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <div style={{
    color: T.text, fontSize: 22, fontWeight: 800, lineHeight: 1.2,
    fontFamily: FONTS.display, letterSpacing: 0,
  }}>{children}</div>
);
const RowTitle = ({ children, color = T.muted }) => (
  <div style={{
    color, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0,
    textTransform: 'uppercase', fontWeight: 700,
  }}>{children}</div>
);

// ── Phone HOME ──────────────────────────────────────────────────────────
function PhoneHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: 14,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <Tag color={T.blue}>Devnet</Tag>
          <Tag color={T.blue}>Live API</Tag>
        </div>
        <SectionTitle>1 agent request needs review.</SectionTitle>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { n: 1, l: 'Pending', c: T.amber },
          { n: 1, l: 'Agents',  c: T.mint },
          { n: 0, l: 'Blocked', c: T.red },
          { n: 0, l: 'History', c: T.blue },
        ].map(m => (
          <div key={m.l} style={{
            padding: 12, borderRadius: 10,
            border: `1px solid ${m.c}40`,
            background: `${m.c}10`,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{m.n}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text2, marginTop: 2 }}>{m.l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
        <RowTitle>Wallet</RowTitle>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: T.text, fontFamily: FONTS.mono }}>13hF…op4Q</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          padding: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Review</div>
          <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>Open pending request</div>
        </div>
        <div style={{
          padding: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Pair</div>
          <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>Scan QR or paste</div>
        </div>
      </div>
    </div>
  );
}

// ── Phone PAIR ──────────────────────────────────────────────────────────
function PhonePair({ stage = 'scanning' }) {
  // stage: 'scanning' | 'imported'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <SectionTitle>Pair agent</SectionTitle>
        <div style={{ marginTop: 6, color: T.text2, fontSize: 13, lineHeight: 1.5 }}>
          Scan a trusted agent QR. Importing creates a wallet-scoped permission, not a private-key handoff.
        </div>
      </div>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          padding: 10, background: '#fff', borderRadius: 12,
          boxShadow: stage === 'scanning' ? `0 0 0 2px ${T.mint}, 0 0 30px ${T.mint}40` : 'none',
        }}>
          <FauxQR size={150} />
        </div>
        <div style={{ fontSize: 11, fontFamily: FONTS.mono, color: T.muted, letterSpacing: 0, textTransform: 'uppercase' }}>
          {stage === 'scanning' ? 'Scanning agent QR…' : 'QR verified'}
        </div>
      </div>
      {stage === 'imported' && (
        <div style={{
          background: T.card, border: `1px solid ${T.mint}55`,
          borderRadius: 12, padding: 14,
          boxShadow: `0 0 0 1px ${T.mint}20, 0 0 30px ${T.mint}20`,
        }}>
          <RowTitle>Loaded agent</RowTitle>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>A</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Demo Agent</div>
              <div style={{ color: T.muted, fontSize: 11, fontFamily: FONTS.mono }}>policy template loaded</div>
            </div>
          </div>
        </div>
      )}
      <div style={{
        marginTop: 'auto', padding: 14, borderRadius: 12,
        background: stage === 'imported' ? T.mint : T.active,
        color: stage === 'imported' ? T.bg : T.muted,
        fontWeight: 800, fontSize: 14, textAlign: 'center',
        border: `1px solid ${stage === 'imported' ? T.mint : T.border}`,
      }}>
        {stage === 'imported' ? 'Sign & import agent' : 'Scan pairing QR'}
      </div>
    </div>
  );
}

// ── Phone INBOX (paid approval) ─────────────────────────────────────────
function PhoneInbox({ approving = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <RowTitle color={T.amber}>Agent request · 1 of 1</RowTitle>
        <SectionTitle>Generate wallet risk report</SectionTitle>
      </div>
      <div style={{
        background: T.card, border: `1px solid ${T.amber}40`,
        borderRadius: 14, padding: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RowTitle>Spend</RowTitle>
          <div style={{ color: T.amber, fontFamily: FONTS.mono, fontWeight: 800, fontSize: 18 }}>
            0.001 SOL
          </div>
        </div>
        <div style={{ marginTop: 8, color: T.text2, fontSize: 12, lineHeight: 1.5 }}>
          Demo Agent requests <b style={{ color: T.text }}>0.001 SOL</b> for a wallet-risk report. SkillGuard asks before any signature.
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
        <RowTitle>Policy checks</RowTitle>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            'Network allowed: solana-devnet',
            'Spend under 0.01 SOL per-action cap',
            'SOL movement requires wallet approval',
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text2 }}>
              <CheckIcon size={14} color={T.mint} /> {c}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto' }}>
        <div style={{
          padding: 14, borderRadius: 12, textAlign: 'center',
          background: T.card, border: `1px solid ${T.border}`,
          color: T.text2, fontWeight: 700, fontSize: 13,
        }}>Reject</div>
        <div style={{
          padding: 14, borderRadius: 12, textAlign: 'center',
          background: approving ? T.mint : `${T.mint}30`,
          border: `1px solid ${T.mint}`,
          color: approving ? T.bg : T.mint, fontWeight: 800, fontSize: 13,
          boxShadow: approving ? `0 0 0 2px ${T.mint}40, 0 0 20px ${T.mint}40` : 'none',
          transition: 'all 200ms',
        }}>{approving ? 'Approving…' : 'Approve in wallet'}</div>
      </div>
    </div>
  );
}

// ── Phone AGENTS ────────────────────────────────────────────────────────
function PhoneAgents({ revoking = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <RowTitle>Connected agents</RowTitle>
        <SectionTitle>1 agent paired</SectionTitle>
      </div>
      <div style={{
        background: T.card,
        border: `1px solid ${revoking ? T.violet + '70' : T.border}`,
        borderRadius: 14, padding: 14,
        boxShadow: revoking ? `0 0 0 1px ${T.violet}40, 0 0 30px ${T.violet}30` : 'none',
        transition: 'all 250ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: revoking ? T.violet + '30' : `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15,
            opacity: revoking ? 0.5 : 1,
          }}>A</div>
          <div style={{ lineHeight: 1.2, flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Demo Agent</div>
            <div style={{ color: T.muted, fontSize: 11 }}>Wallet risk checks</div>
          </div>
          <Tag color={revoking ? T.violet : T.mint}>{revoking ? 'Revoking' : 'Active'}</Tag>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
        <RowTitle>Mode</RowTitle>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          {['Ask', 'Allow under limits', 'Block'].map((m, i) => (
            <div key={m} style={{
              flex: 1, padding: '8px 4px', textAlign: 'center', borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              background: i === 1 ? T.mint + '18' : T.deep,
              color: i === 1 ? T.mint : T.text2,
              border: `1px solid ${i === 1 ? T.mint + '50' : T.border}`,
            }}>{m}</div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
        <RowTitle>Limits</RowTitle>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONTS.mono, textTransform: 'uppercase' }}>Max</div>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, color: T.text, fontSize: 14 }}>0.01 SOL</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, fontFamily: FONTS.mono, textTransform: 'uppercase' }}>Daily cap</div>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, color: T.text, fontSize: 14 }}>0.05 SOL</div>
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 'auto', padding: 14, borderRadius: 12, textAlign: 'center',
        background: revoking ? T.violet : T.violet + '20',
        color: revoking ? '#fff' : T.violet,
        fontWeight: 800, fontSize: 14,
        border: `1px solid ${T.violet}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: revoking ? `0 0 0 2px ${T.violet}50, 0 0 30px ${T.violet}50` : 'none',
        transition: 'all 250ms',
      }}>
        <RevokeIcon size={16} color={revoking ? '#fff' : T.violet} />
        {revoking ? 'Agent revoked' : 'Revoke agent'}
      </div>
    </div>
  );
}

// ── Phone ACTIVITY ──────────────────────────────────────────────────────
function PhoneActivity({ rows }) {
  // rows: array of { mode: 'allow'|'ask'|'block'|'revoke', title, sub, spend }
  const palette = {
    allow:  { color: T.mint,   label: 'Auto-approved' },
    ask:    { color: T.green,  label: 'Approved' },
    block:  { color: T.red,    label: 'Blocked' },
    revoke: { color: T.violet, label: 'Revoked' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <RowTitle>Activity</RowTitle>
        <SectionTitle>Decision log</SectionTitle>
      </div>
      {rows.map((r, i) => {
        const p = palette[r.mode];
        return (
          <div key={i} style={{
            background: T.card, border: `1px solid ${p.color}40`,
            borderRadius: 12, padding: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700,
                color: p.color, letterSpacing: 0, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                {p.label}
              </div>
              {r.spend && <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: T.text2 }}>{r.spend}</div>}
            </div>
            <div style={{ marginTop: 6, color: T.text, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{r.title}</div>
            {r.sub && <div style={{ marginTop: 3, color: T.text2, fontSize: 11 }}>{r.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  PHONE_W, PHONE_H,
  PhoneFrame,
  PhoneHome, PhonePair, PhoneInbox, PhoneAgents, PhoneActivity,
});
