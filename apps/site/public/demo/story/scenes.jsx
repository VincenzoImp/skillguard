// scenes.jsx — 11 scenes for the SkillGuard 3-minute story.
// Loaded after ui.jsx + nodes.jsx + phone.jsx + animations.jsx.

const W = 1920;
const H = 1080;

// Scene timing (seconds). Keep the full cut safely under the 3-minute limit.
const TIMING = {
  hook:        [0,    12],
  tradeoff:    [12,   31],
  reveal:      [31,   50],
  verbs:       [50,   68],
  pair:        [68,   84],
  allow:       [84,   101],
  ask:         [101,  122],
  block:       [122,  137],
  revoke:      [137,  151],
  proof:       [151,  166],
  close:       [166,  178],
};
const TOTAL_DURATION = 178;

// ── Helpers ──────────────────────────────────────────────────────────────
function FullStage({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <StageBg />
      {children}
    </div>
  );
}

function FadeIn({ at = 0, dur = 0.4, children, slide = 0 }) {
  const { localTime } = useSprite();
  const t = clamp((localTime - at) / dur, 0, 1);
  const e = Easing.easeOutCubic(t);
  return (
    <div style={{ opacity: e, transform: `translateY(${(1 - e) * slide}px)` }}>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 1 · HOOK (0-12s)
// "Useful agents need wallet access — wallet access means real fund risk"
// ────────────────────────────────────────────────────────────────────────
function SceneHook() {
  const [s, e] = TIMING.hook;
  return (
    <Sprite start={s} end={e}>
      {({ localTime, duration }) => {
        // dot crosses from agent (left) toward wallet (right), then a barrier slams in
        const dotProgress = clamp((localTime - 1.6) / 4.5, 0, 1);
        const barrierIn = clamp((localTime - 5.6) / 0.6, 0, 1);
        const wobble = barrierIn === 1 ? Math.sin(localTime * 18) * (1 - clamp((localTime - 6.4) / 1, 0, 1)) * 4 : 0;
        const headIn = clamp((localTime - 7.2) / 0.7, 0, 1);
        const subIn  = clamp((localTime - 8.0) / 0.7, 0, 1);

        const agent = { x: 280, y: 540 };
        const wallet = { x: 1640, y: 540 };
        const barrierX = 960;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={1} total={11} label="Hook" />

            {/* Eyebrow line at top */}
            <Eyebrow x={W / 2 - 240} y={140} color={T.mint} size={18}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <ShieldIcon size={18} color={T.mint} /> The wallet-firewall problem
              </span>
            </Eyebrow>

            {/* Agent + Wallet + traveling dot */}
            <div style={{ position: 'absolute', left: agent.x - 140, top: agent.y - 60 }}>
              <AgentNode x={0} y={0} status="Wants to act onchain" statusColor={T.blue} glow />
            </div>
            <div style={{ position: 'absolute', left: wallet.x - 140, top: wallet.y - 60, opacity: 1 - barrierIn * 0.15 }}>
              <WalletNode x={0} y={0} locked />
              <div style={{
                position: 'absolute', left: 18, top: 130,
                color: T.text2, fontSize: 12, fontFamily: FONTS.mono, letterSpacing: 0,
              }}>balance · 12.40 SOL</div>
            </div>

            {/* Line between them */}
            <RequestLine
              from={{ x: agent.x + 140, y: agent.y }}
              to={{ x: wallet.x - 140, y: wallet.y }}
              color={dotProgress < 1 ? T.blue : T.red}
              progress={Math.min(dotProgress, 0.45 + barrierIn * 0)}
              width={3}
              dashed={false}
              label={dotProgress > 0.05 && dotProgress < 0.6 ? 'sign tx' : null}
            />

            {/* Barrier */}
            {barrierIn > 0.01 && (
              <>
                <div style={{
                  position: 'absolute',
                  left: barrierX - 10 + wobble, top: 320,
                  width: 20, height: 440,
                  background: `linear-gradient(180deg, ${T.red}00 0%, ${T.red} 30%, ${T.red} 70%, ${T.red}00 100%)`,
                  borderRadius: 10,
                  opacity: barrierIn,
                  boxShadow: `0 0 30px ${T.red}, 0 0 80px ${T.red}80`,
                  transform: `scaleY(${barrierIn})`,
                  transformOrigin: 'center',
                }} />
                <div style={{
                  position: 'absolute', left: barrierX - 90, top: 280,
                  padding: '6px 12px', borderRadius: 999,
                  background: `${T.red}14`, border: `1px solid ${T.red}80`,
                  color: T.red, fontFamily: FONTS.mono, fontSize: 12, fontWeight: 800,
                  letterSpacing: 0, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: barrierIn,
                }}>
                  <BanIcon size={14} color={T.red} /> Real funds at risk
                </div>
              </>
            )}

            {/* Headline + sub */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', opacity: headIn }}>
              <Display x={W/2 - 700} y={0} width={1400} size={68} align="center" weight={700}>
                Useful AI agents need wallet access.
              </Display>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', opacity: subIn }}>
              <Display x={W/2 - 700} y={0} width={1400} size={42} align="center" weight={500} color={T.red}>
                Wallet access means real fund risk.
              </Display>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 2 · BAD TRADEOFF (12-31s)
// ────────────────────────────────────────────────────────────────────────
function SceneTradeoff() {
  const [s, e] = TIMING.tradeoff;
  return (
    <Sprite start={s} end={e}>
      {({ localTime, duration }) => {
        const headIn = clamp(localTime / 0.6, 0, 1);
        const c1 = clamp((localTime - 1.2) / 0.6, 0, 1);
        const c2 = clamp((localTime - 2.0) / 0.6, 0, 1);
        const c3 = clamp((localTime - 2.8) / 0.6, 0, 1);
        const stamp = clamp((localTime - 14) / 0.5, 0, 1);
        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={2} total={11} label="Bad tradeoff" />

            <div style={{ opacity: headIn, transform: `translateY(${(1 - headIn) * 12}px)` }}>
              <Eyebrow x={140} y={210}>The bad choices today</Eyebrow>
              <Display x={140} y={246} size={68} width={1640}>
                Three unsafe ways to give an agent wallet authority.
              </Display>
            </div>

            <div style={{ opacity: c1, transform: `translateY(${(1 - c1) * 16}px)` }}>
              <TradeoffCard
                x={140} y={520} width={500}
                title="Give agent my personal wallet"
                body="A signer or seed in the agent's hands turns one bad prompt, one bug, or one compromised model into total loss."
                verdict="Too risky"
                accent={T.red}
                icon={<KeyIcon size={26} color={T.red} />}
              />
            </div>
            <div style={{ opacity: c2, transform: `translateY(${(1 - c2) * 16}px)` }}>
              <TradeoffCard
                x={710} y={520} width={500}
                title="Fund a separate burner"
                body="The funded balance is still real. Every top-up rebuilds the same custody surface for the agent."
                verdict="Still risky"
                accent={T.amber}
                icon={<WalletIcon size={26} color={T.amber} />}
              />
            </div>
            <div style={{ opacity: c3, transform: `translateY(${(1 - c3) * 16}px)` }}>
              <TradeoffCard
                x={1280} y={520} width={500}
                title="Approve every transaction"
                body="Manually signing each step removes the agent's autonomy. The agent is no longer working — you are."
                verdict="Not autonomous"
                accent={T.violet}
                icon={<AlertIcon size={26} color={T.violet} />}
              />
            </div>

            {/* Closing stamp */}
            {stamp > 0 && (
              <div style={{
                position: 'absolute', left: W/2 - 360, top: 940,
                opacity: stamp, transform: `scale(${0.95 + stamp * 0.05})`,
                padding: '14px 26px',
                background: T.deep, border: `1px solid ${T.border}`,
                borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 14,
                fontFamily: FONTS.body, fontWeight: 700, fontSize: 22, color: T.text,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: T.amber }} />
                Custody, autonomy, or safety — pick one.
              </div>
            )}
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 3 · SOLUTION REVEAL (31-50s)
// Agent → SkillGuard → Wallet diagram
// ────────────────────────────────────────────────────────────────────────
function SceneReveal() {
  const [s, e] = TIMING.reveal;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.6, 0, 1);
        const fwIn    = clamp((localTime - 1.2) / 0.7, 0, 1);
        const lineL   = clamp((localTime - 2.4) / 1.4, 0, 1);
        const lineR   = clamp((localTime - 5.5) / 1.4, 0, 1);
        const subIn   = clamp((localTime - 7.5) / 0.6, 0, 1);
        const tagIn   = clamp((localTime - 9.5) / 0.6, 0, 1);

        const agentX = 200, agentY = 470;
        const fwX = 800;     // firewall left
        const fwCenterX = 800 + 160;
        const fwCenterY = 540;
        const walletX = 1440, walletY = 470;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={3} total={11} label="Solution" />

            <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 12}px)` }}>
              <Eyebrow x={140} y={180} color={T.mint}>The missing layer</Eyebrow>
              <Display x={140} y={216} size={62} width={1640}>
                A wallet-owned policy layer between agent intent and wallet signatures.
              </Display>
            </div>

            {/* Agent */}
            <div style={{ opacity: lineL > 0 ? 1 : titleIn }}>
              <AgentNode x={agentX} y={agentY} status="Signed manifest" statusColor={T.blue} glow />
            </div>

            {/* Firewall */}
            <div style={{ opacity: fwIn, transform: `translateY(${(1 - fwIn) * 14}px) scale(${0.95 + fwIn * 0.05})`, transformOrigin: 'center' }}>
              <FirewallBlock x={fwX} y={400} active={null} />
            </div>

            {/* Wallet */}
            <div style={{ opacity: lineR > 0 ? 1 : fwIn }}>
              <WalletNode x={walletX} y={agentY} locked glow={lineR > 0.5} />
            </div>

            {/* Lines */}
            <RequestLine
              from={{ x: agentX + 280, y: agentY + 50 }}
              to={{ x: fwX, y: fwCenterY }}
              color={T.blue}
              progress={lineL}
              label={lineL > 0.1 && lineL < 0.95 ? 'manifest' : null}
            />
            <RequestLine
              from={{ x: fwX + 320, y: fwCenterY }}
              to={{ x: walletX, y: walletY + 50 }}
              color={T.mint}
              progress={lineR}
              label={lineR > 0.1 && lineR < 0.95 ? 'decision' : null}
            />

            {/* Sub-message */}
            <div style={{ opacity: subIn, transform: `translateY(${(1 - subIn) * 10}px)` }}>
              <Display x={W/2 - 700} y={870} width={1400} size={36} align="center" weight={500} color={T.text}>
                The agent never receives the private key.
              </Display>
              <Display x={W/2 - 700} y={930} width={1400} size={36} align="center" weight={500} color={T.text2}>
                It waits for a wallet-owned decision.
              </Display>
            </div>

            <div style={{ opacity: tagIn }}>
              <Pill x={W/2 - 200} y={980} color={T.mint} size={18}
                icon={<ShieldIcon size={16} color={T.mint} />}>
                SkillGuard · wallet firewall for AI agents
              </Pill>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 4 · ALLOW / ASK / BLOCK / REVOKE (50-68s)
// ────────────────────────────────────────────────────────────────────────
function SceneVerbs() {
  const [s, e] = TIMING.verbs;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.6, 0, 1);
        const cards = [0, 1, 2, 3].map(i => clamp((localTime - 0.9 - i * 0.45) / 0.5, 0, 1));
        const focus = (() => {
          if (localTime < 6) return 0;
          if (localTime < 10) return 1;
          if (localTime < 14) return 2;
          if (localTime < 18) return 3;
          return -1;
        })();
        const lineCopy = clamp((localTime - 16) / 0.6, 0, 1);

        const verbs = [
          { color: T.mint,   label: 'Allow',  line: 'Low-risk work auto-passes', sub: 'Zero-spend reads can proceed without bothering the owner.', glyph: <CheckIcon size={20} color={T.mint} /> },
          { color: T.amber,  label: 'Ask',    line: 'Spending pings the phone',  sub: 'Any SOL movement routes to the mobile inbox for approval.',  glyph: <AlertIcon size={20} color={T.amber} /> },
          { color: T.red,    label: 'Block',  line: 'Out-of-policy is denied',   sub: 'Overspend, wrong network, or expired requests stop here.',   glyph: <BanIcon size={20} color={T.red} /> },
          { color: T.violet, label: 'Revoke', line: 'Identity cut off, anytime', sub: 'Future requests from a revoked agent never reach signing.',  glyph: <RevokeIcon size={20} color={T.violet} /> },
        ];

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={4} total={11} label="Product model" />

            <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 12}px)` }}>
              <Eyebrow x={140} y={200}>Allow · Ask · Block · Revoke</Eyebrow>
              <Display x={140} y={236} size={64} width={1640}>
                Four decisions. One policy the wallet owner controls.
              </Display>
            </div>

            {verbs.map((v, i) => (
              <div key={v.label} style={{ opacity: cards[i], transform: `translateY(${(1 - cards[i]) * 16}px)` }}>
                <VerbCard
                  x={180 + i * 390} y={500}
                  width={350}
                  color={v.color} label={v.label}
                  line={v.line} sub={v.sub}
                  glyph={v.glyph}
                  highlight={focus === i}
                />
              </div>
            ))}

            <div style={{ opacity: lineCopy }}>
              <Display x={W/2 - 760} y={920} width={1520} size={36} align="center" weight={500} color={T.text}>
                Low-risk work can proceed automatically.<br />
                <span style={{ color: T.mint }}>The moment money moves, the owner is back in the loop.</span>
              </Display>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 5 · PAIR (68-84s)
// ────────────────────────────────────────────────────────────────────────
function ScenePair() {
  const [s, e] = TIMING.pair;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.6, 0, 1);
        const phaseImported = localTime > 8;
        const importedFlash = clamp((localTime - 8) / 0.5, 0, 1);
        const callout1 = clamp((localTime - 2.0) / 0.5, 0, 1);
        const callout2 = clamp((localTime - 9.0) / 0.5, 0, 1);

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={5} total={11} label="Pair" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={180}>Step 1 · Pair</Eyebrow>
              <Display x={140} y={216} size={58} width={1040}>
                Scan the agent QR.<br />Import its identity, not a key.
              </Display>
            </div>

            {/* Phone on the right */}
            <div style={{ position: 'absolute', left: 1380, top: 110 }}>
              <PhoneFrame
                x={0} y={0}
                scale={0.85}
                statusPill={phaseImported ? 'Pairing' : 'Pair mode'}
                statusColor={phaseImported ? T.mint : T.amber}
                activeTab="pair"
              >
                <PhonePair stage={phaseImported ? 'imported' : 'scanning'} />
              </PhoneFrame>
            </div>

            {/* Callouts on the left */}
            <div style={{ opacity: callout1, transform: `translateY(${(1 - callout1) * 14}px)` }}>
              <div style={{
                position: 'absolute', left: 140, top: 380, width: 720,
                padding: 22, background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 16, boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
              }}>
                <RowTitleStatic>QR import is identity-only</RowTitleStatic>
                <div style={{ marginTop: 8, color: T.text, fontFamily: FONTS.display, fontSize: 26, lineHeight: 1.3 }}>
                  The QR carries the agent's public identity and a policy template — no wallet, no seed, no signer.
                </div>
              </div>
            </div>

            <div style={{ opacity: callout2, transform: `translateY(${(1 - callout2) * 14}px)` }}>
              <div style={{
                position: 'absolute', left: 140, top: 660, width: 720,
                padding: 22, background: T.card, border: `1px solid ${T.mint}40`,
                borderRadius: 16, boxShadow: `0 14px 40px ${T.mint}10`,
              }}>
                <RowTitleStatic color={T.mint}>One wallet-scoped grant</RowTitleStatic>
                <div style={{ marginTop: 8, color: T.text, fontFamily: FONTS.display, fontSize: 26, lineHeight: 1.3 }}>
                  The owner reviews the limits and signs <span style={{ color: T.mint }}>once</span> — granting policy-scoped permission.
                </div>
              </div>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// inline static row title (since RowTitle lives in phone.jsx)
function RowTitleStatic({ children, color = T.muted }) {
  return (
    <div style={{
      color, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0,
      textTransform: 'uppercase', fontWeight: 700,
    }}>{children}</div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 6 · ALLOW (auto-allow zero-spend) (84-101s)
// ────────────────────────────────────────────────────────────────────────
function SceneAllow() {
  const [s, e] = TIMING.allow;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.5, 0, 1);
        const policyIn = clamp((localTime - 1.0) / 0.5, 0, 1);
        const reqIn = clamp((localTime - 2.0) / 0.5, 0, 1);
        const lineP = clamp((localTime - 3.0) / 1.6, 0, 1);
        const phoneActiveP = clamp((localTime - 6.5) / 0.5, 0, 1);

        const agentX = 110, agentY = 280;
        const fwX = 750, fwY = 220;
        const phoneX = 1380, phoneY = 110;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={6} total={11} label="Allow" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={108}>Action 1 · Zero-spend read</Eyebrow>
              <Display x={140} y={144} size={40} width={720}>
                Zero-spend work auto-passes.<br />No funds move. No wallet prompt.
              </Display>
            </div>

            {/* Agent */}
            <AgentNode x={agentX} y={agentY} status="Submitting manifest" statusColor={T.blue} glow />

            {/* Firewall with allow lane glowing */}
            <FirewallBlock x={fwX} y={fwY} active={lineP > 0.6 ? 'allow' : null} />

            {/* Phone showing activity (auto-approved log) */}
            <div style={{ opacity: phoneActiveP, transform: `translateX(${(1 - phoneActiveP) * 30}px)` }}>
              <PhoneFrame
                x={phoneX} y={phoneY}
                scale={0.85}
                statusPill="Guarded" statusColor={T.mint}
                activeTab="activity"
              >
                <PhoneActivity rows={[
                  { mode: 'allow', title: 'Scan wallet for risky token approvals', sub: 'No wallet signature needed.', spend: '0 SOL' },
                ]} />
              </PhoneFrame>
            </div>

            {/* Action card */}
            <div style={{ opacity: reqIn, transform: `translateY(${(1 - reqIn) * 12}px)` }}>
              <ActionCard
                x={agentX + 30} y={500}
                width={420}
                title="Scan wallet for risky token approvals"
                spend="0 SOL"
                detail="Read-only audit of token approvals. No transaction is signed."
                status="No funds moved · No wallet prompt"
                mode="allow"
              />
            </div>

            {/* Policy card */}
            <div style={{ opacity: policyIn, transform: `translateY(${(1 - policyIn) * 12}px)` }}>
              <PolicyCard x={650} y={650} highlight="Mode" />
            </div>

            {/* Lines */}
            <RequestLine
              from={{ x: agentX + 280, y: agentY + 60 }}
              to={{ x: fwX, y: fwY + 110 }}
              color={T.blue}
              progress={Math.min(lineP * 1.5, 1)}
              label={lineP > 0.05 && lineP < 0.95 ? '0 SOL · read-only' : null}
            />
            <RequestLine
              from={{ x: fwX + 320, y: fwY + 110 }}
              to={{ x: phoneX - 12, y: phoneY + 245 }}
              color={T.mint}
              progress={clamp((lineP - 0.55) / 0.45, 0, 1)}
              label={lineP > 0.7 ? 'auto-approved' : null}
              labelOffsetY={-18}
            />

            <div style={{ opacity: clamp((localTime - 9) / 0.5, 0, 1) }}>
              <InfoNote x={140} y={720} width={420} color={T.mint}
                icon={<CheckIcon size={18} color={T.mint} />}>
                Auto-approval: zero-spend only.
              </InfoNote>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 7 · ASK (0.001 SOL paid approval) (101-122s)
// ────────────────────────────────────────────────────────────────────────
function SceneAsk() {
  const [s, e] = TIMING.ask;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.5, 0, 1);
        const reqIn = clamp((localTime - 1.0) / 0.5, 0, 1);
        const phoneIn = clamp((localTime - 1.6) / 0.5, 0, 1);
        const lineP = clamp((localTime - 3.5) / 1.6, 0, 1);
        const approving = localTime > 9 && localTime < 12;
        const approved = localTime >= 12;
        const receiptIn = clamp((localTime - 13) / 0.6, 0, 1);

        const agentX = 110, agentY = 280;
        const fwX = 750, fwY = 220;
        const phoneX = 1380, phoneY = 110;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={7} total={11} label="Ask" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={120} color={T.amber}>Action 2 · 0.001 SOL paid report</Eyebrow>
              <Display x={140} y={156} size={48} width={1640}>
                Money moves → the owner is back in the loop.
              </Display>
            </div>

            <AgentNode x={agentX} y={agentY} status="Spending request"
              statusColor={T.amber} glow />

            <FirewallBlock x={fwX} y={fwY} active={lineP > 0.5 ? 'ask' : null} />

            <div style={{ opacity: phoneIn, transform: `translateX(${(1 - phoneIn) * 30}px)` }}>
              <PhoneFrame
                x={phoneX} y={phoneY}
                scale={0.85}
                statusPill={approved ? 'Approved' : 'Needs approval'}
                statusColor={approved ? T.green : T.amber}
                activeTab="inbox"
                inboxBadge={!approved}
              >
                {approved ? (
                  <PhoneActivity rows={[
                    { mode: 'ask', title: 'Weekly wallet risk report', sub: 'Wallet-approved · receipt visible on Solana Explorer.', spend: '0.001 SOL' },
                    { mode: 'allow', title: 'Scan wallet for risky token approvals', sub: 'No wallet signature needed.', spend: '0 SOL' },
                  ]} />
                ) : (
                  <PhoneInbox approving={approving} />
                )}
              </PhoneFrame>
            </div>

            <div style={{ opacity: reqIn, transform: `translateY(${(1 - reqIn) * 12}px)` }}>
              <ActionCard
                x={agentX + 30} y={500}
                width={420}
                title="Generate weekly wallet risk PDF"
                spend="0.001 SOL"
                detail="Paid report. SOL movement requires owner consent."
                status="Routed to mobile inbox"
                mode="ask"
              />
            </div>

            <div style={{ opacity: clamp((localTime - 1.4) / 0.5, 0, 1) }}>
              <PolicyCard x={650} y={650} highlight="Max per action" />
            </div>

            <RequestLine
              from={{ x: agentX + 280, y: agentY + 60 }}
              to={{ x: fwX, y: fwY + 200 }}
              color={T.amber}
              progress={Math.min(lineP * 1.5, 1)}
              label={lineP > 0.05 && lineP < 0.95 ? '0.001 SOL · pay' : null}
            />
            <RequestLine
              from={{ x: fwX + 320, y: fwY + 200 }}
              to={{ x: phoneX - 12, y: phoneY + 245 }}
              color={T.amber}
              progress={clamp((lineP - 0.55) / 0.45, 0, 1)}
              label={lineP > 0.7 ? 'awaiting consent' : null}
              labelOffsetY={-18}
            />

            {/* Receipt after approval */}
            {receiptIn > 0 && (
              <div style={{ opacity: receiptIn, transform: `translateY(${(1 - receiptIn) * 12}px)` }}>
                <ReceiptChip x={120} y={900} />
              </div>
            )}
            <div style={{ opacity: clamp((localTime - 14) / 0.4, 0, 1) }}>
              <Body x={140} y={845} size={16} width={420} color={T.text2} weight={600}>
                Recorded on Solana devnet only after wallet approval.
              </Body>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 8 · BLOCK (122-137s)
// ────────────────────────────────────────────────────────────────────────
function SceneBlock() {
  const [s, e] = TIMING.block;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.5, 0, 1);
        const reqIn = clamp((localTime - 1.0) / 0.5, 0, 1);
        const lineP = clamp((localTime - 2.5) / 1.4, 0, 1);
        // line travels but stops at firewall
        const blockedP = clamp((localTime - 4.0) / 0.5, 0, 1);
        const stamp = clamp((localTime - 4.5) / 0.5, 0, 1);
        const shake = blockedP === 1 ? Math.sin(localTime * 28) * (1 - clamp((localTime - 5) / 0.6, 0, 1)) * 4 : 0;

        const agentX = 110, agentY = 280;
        const fwX = 750, fwY = 220;
        const phoneX = 1380, phoneY = 110;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={8} total={11} label="Block" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={108} color={T.red}>Action 3 · 0.05 SOL alerts upgrade</Eyebrow>
              <Display x={140} y={144} size={40} width={720}>
                Out-of-policy stops the request.<br />No wallet signature prompt.
              </Display>
            </div>

            <AgentNode x={agentX} y={agentY} status="Overspend request" statusColor={T.red} glow />

            <div style={{ transform: `translateX(${shake}px)` }}>
              <FirewallBlock x={fwX} y={fwY} active={blockedP > 0.5 ? 'block' : null} />
            </div>

            <div style={{ opacity: reqIn, transform: `translateY(${(1 - reqIn) * 12}px)` }}>
              <ActionCard
                x={agentX + 30} y={500}
                width={420}
                title="Subscribe to real-time risk alerts"
                spend="0.05 SOL"
                detail="Exceeds the 0.01 SOL per-action policy cap."
                status="Stopped before signing"
                mode="block"
              />
            </div>

            <div style={{ opacity: clamp((localTime - 1.0) / 0.5, 0, 1) }}>
              <PolicyCard x={650} y={650} highlight="Max per action" />
            </div>

            {/* Phone with blocked entry */}
            <div style={{ opacity: clamp((localTime - 5.5) / 0.5, 0, 1) }}>
              <PhoneFrame
                x={phoneX} y={phoneY}
                scale={0.85}
                statusPill="Blocked" statusColor={T.red}
                activeTab="activity"
              >
                <PhoneActivity rows={[
                  { mode: 'block', title: 'Subscribe to real-time risk alerts', sub: 'Exceeds 0.01 SOL per-action max.', spend: '0.05 SOL' },
                  { mode: 'ask',   title: 'Weekly wallet risk report',          sub: 'Wallet-approved · receipt onchain.', spend: '0.001 SOL' },
                  { mode: 'allow', title: 'Scan wallet for risky token approvals', sub: 'No wallet signature needed.',     spend: '0 SOL' },
                ]} />
              </PhoneFrame>
            </div>

            {/* Request line that stops at firewall */}
            <RequestLine
              from={{ x: agentX + 280, y: agentY + 60 }}
              to={{ x: fwX, y: fwY + 290 }}
              color={T.red}
              progress={lineP}
              label={lineP > 0.05 && lineP < 0.95 ? '0.05 SOL · over cap' : null}
            />

            {/* Bang stamp */}
            {stamp > 0 && (
              <div style={{
                position: 'absolute', left: fwX - 50, top: fwY + 240,
                opacity: stamp, transform: `translate(${shake}px, 0) scale(${0.8 + stamp * 0.2})`,
                padding: '8px 14px', borderRadius: 999,
                background: T.bg, border: `2px solid ${T.red}`,
                color: T.red, fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800,
                letterSpacing: 0, textTransform: 'uppercase',
                boxShadow: `0 0 0 6px ${T.red}20, 0 0 30px ${T.red}80`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <BanIcon size={16} color={T.red} /> Blocked
              </div>
            )}

            <div style={{ opacity: clamp((localTime - 7) / 0.5, 0, 1) }}>
              <Display x={140} y={715} size={24} width={420} weight={500} color={T.text2}>
                <span style={{ color: T.red, fontWeight: 700 }}>Exceeds 0.01 SOL max.</span>{' '}
                The wallet was never asked to sign.
              </Display>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 9 · REVOKE (137-151s)
// ────────────────────────────────────────────────────────────────────────
function SceneRevoke() {
  const [s, e] = TIMING.revoke;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.5, 0, 1);
        const phoneIn = clamp((localTime - 1.0) / 0.5, 0, 1);
        const revoking = localTime > 4 && localTime < 7;
        const revoked = localTime >= 7;
        const lineFade = revoked ? clamp((localTime - 7) / 0.6, 0, 1) : 0;

        const agentX = 140, agentY = 360;
        const fwX = 720, fwY = 280;
        const walletX = 1160, walletY = 360;

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={9} total={11} label="Revoke" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={140} color={T.violet}>Action 4 · Revoke</Eyebrow>
              <Display x={140} y={176} size={48} width={1160}>
                Cut off an agent identity.<br />Future requests stop reaching the wallet.
              </Display>
            </div>

            <div style={{ opacity: 1 - lineFade * 0.55 }}>
              <AgentNode x={agentX} y={agentY}
                status={revoked ? 'Access revoked' : 'Connected'}
                statusColor={revoked ? T.violet : T.blue}
                glow={!revoked}
              />
            </div>

            <FirewallBlock x={fwX} y={fwY} active={revoking || revoked ? 'revoke' : null} />

            <WalletNode x={walletX} y={agentY} locked />

            {/* Future request lines, fading out */}
            <RequestLine
              from={{ x: agentX + 280, y: agentY + 60 }}
              to={{ x: fwX, y: fwY + 285 }}
              color={revoked ? T.violet : T.blue}
              progress={revoked ? 0.55 : 0.7}
              dashed={revoked}
              width={2}
              glow={false}
              label={revoked ? 'denied' : 'next request'}
              labelOffsetY={-16}
            />

            {/* Phone showing revoke confirm */}
            <div style={{ opacity: phoneIn }}>
              <PhoneFrame
                x={1500} y={140}
                scale={0.78}
                statusPill={revoked ? 'Revoked' : 'Confirm revoke'}
                statusColor={T.violet}
                activeTab="agents"
              >
                <PhoneAgents revoking={revoking || revoked} />
              </PhoneFrame>
            </div>

            <div style={{ opacity: clamp((localTime - 8) / 0.5, 0, 1) }}>
              <Display x={140} y={920} size={32} width={1200} weight={500} color={T.text2}>
                The owner can revoke any agent at any time.{' '}
                <span style={{ color: T.violet, fontWeight: 700 }}>Identity cut off, instantly.</span>
              </Display>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 10 · TECHNICAL PROOF (151-166s)
// ────────────────────────────────────────────────────────────────────────
function SceneProof() {
  const [s, e] = TIMING.proof;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.5, 0, 1);
        const cards = Array.from({ length: 6 }, (_, i) => clamp((localTime - 0.8 - i * 0.18) / 0.45, 0, 1));
        const tags = clamp((localTime - 3.5) / 0.5, 0, 1);
        const cs = [
          { label: 'Android APK',           sub: 'Mobile Wallet Adapter sessions',   mono: 'apps/mobile',        color: T.green },
          { label: 'Mobile Wallet Adapter', sub: 'Real wallet signs spending',       mono: 'mwa://session',      color: T.mint },
          { label: 'Vercel API',            sub: 'Hosted policy + manifest engine',  mono: 'skillguard-sol.vercel.app', color: T.blue },
          { label: 'Demo Agent',            sub: 'Real agent submits manifests',     mono: 'apps/research-agent',color: T.violet },
          { label: 'Anchor receipt program',sub: 'Onchain proof of decisions',       mono: 'programs/skillguard',color: T.amber },
          { label: 'Solana devnet',         sub: 'Live receipts you can verify',     mono: 'cluster · devnet',   color: T.blue },
        ];
        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={10} total={11} label="Proof" />

            <div style={{ opacity: titleIn }}>
              <Eyebrow x={140} y={140} color={T.blue}>This is not a mockup</Eyebrow>
              <Display x={140} y={176} size={56} width={1640}>
                The pieces are real, deployed, and verifiable on devnet.
              </Display>
            </div>

            <div style={{ position: 'absolute', left: 170, top: 380 }}>
              {cs.map((c, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                return (
                  <div key={c.label} style={{
                    position: 'absolute',
                    left: col * 520, top: row * 220,
                    opacity: cards[i],
                    transform: `translateY(${(1 - cards[i]) * 14}px)`,
                  }}>
                    <TechCard
                      x={0} y={0} width={470}
                      label={c.label} sub={c.sub} mono={c.mono} color={c.color}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ opacity: tags }}>
              <InfoNote x={170} y={835} width={880} color={T.blue}
                icon={<CodeIcon size={18} color={T.blue} />}>
                Wallet-approved decisions are recorded as Solana devnet receipts.
              </InfoNote>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SCENE 11 · CLOSE (166-178s)
// ────────────────────────────────────────────────────────────────────────
function SceneClose() {
  const [s, e] = TIMING.close;
  return (
    <Sprite start={s} end={e}>
      {({ localTime }) => {
        const titleIn = clamp(localTime / 0.6, 0, 1);
        const subIn = clamp((localTime - 1.5) / 0.6, 0, 1);
        const tagIn = clamp((localTime - 3.5) / 0.6, 0, 1);

        return (
          <FullStage>
            <Watermark />
            <ChapterMark index={11} total={11} label="Close" />

            <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 16}px)` }}>
              <Display x={W/2 - 800} y={380} width={1600} size={88} align="center" weight={700}>
                Agents can act.
              </Display>
              <div style={{ marginTop: 12 }}>
                <Display x={W/2 - 800} y={490} width={1600} size={88} align="center" weight={700} color={T.mint}>
                  Users stay in control.
                </Display>
              </div>
            </div>

            <div style={{ opacity: subIn }}>
              <Display x={W/2 - 700} y={680} width={1400} size={28} align="center" weight={500} color={T.text2}>
                SkillGuard · the wallet firewall for AI agents
              </Display>
            </div>

            <div style={{ opacity: tagIn, position: 'absolute', left: 0, right: 0, top: 780, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Pill color={T.mint} size={14} inline icon={<ShieldIcon size={14} color={T.mint} />}>Allow</Pill>
              <Pill color={T.amber} size={14} inline icon={<AlertIcon size={14} color={T.amber} />}>Ask</Pill>
              <Pill color={T.red} size={14} inline icon={<BanIcon size={14} color={T.red} />}>Block</Pill>
              <Pill color={T.violet} size={14} inline icon={<RevokeIcon size={14} color={T.violet} />}>Revoke</Pill>
            </div>
          </FullStage>
        );
      }}
    </Sprite>
  );
}

// ── Mount everything together ───────────────────────────────────────────
function StoryDeck() {
  return (
    <>
      <SceneHook />
      <SceneTradeoff />
      <SceneReveal />
      <SceneVerbs />
      <ScenePair />
      <SceneAllow />
      <SceneAsk />
      <SceneBlock />
      <SceneRevoke />
      <SceneProof />
      <SceneClose />
    </>
  );
}

Object.assign(window, {
  W, H, TOTAL_DURATION, TIMING, StoryDeck,
});
