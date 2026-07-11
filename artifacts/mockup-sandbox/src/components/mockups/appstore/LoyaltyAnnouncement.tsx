export function LoyaltyAnnouncement() {
  const BG = "#020D1E";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const GOLD = "#F59E0B";
  const PURPLE = "#7C3AED";
  const CARD = "#0A1628";
  const BORDER = "rgba(255,255,255,0.08)";
  const MUTED = "rgba(255,255,255,0.45)";

  return (
    <div style={{
      width: 1200, height: 675,
      background: BG,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 64px",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow orbs */}
      <div style={{ position: "absolute", top: -100, left: 200, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${CYAN}18 0%, transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}28 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 60, right: 60, width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${PURPLE}22 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Subtle grid lines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* Left: text content */}
      <div style={{ flex: 1, paddingRight: 56, zIndex: 1 }}>
        {/* Brand + badge row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: CYAN, letterSpacing: -1 }}>RewLo</span>
          <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: "5px 14px" }}>
            <span style={{ fontSize: 12 }}>⭐</span>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>Loyalty Rewards</span>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ fontSize: 38, fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: -0.8, marginBottom: 16 }}>
          Your Points.<br />
          Your Rules.<br />
          <span style={{ color: CYAN }}>They Never Expire.</span>
        </div>

        {/* Sub text */}
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 28, maxWidth: 380 }}>
          Pay with Rewlo Wallet at the stadium, earn loyalty points on every dollar spent, and keep them forever — no blackout dates, no resets.
        </div>

        {/* Key benefits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {[
            { icon: "♾️", text: "Points never expire — ever" },
            { icon: "🏟️", text: "Earn at every game & stadium purchase" },
            { icon: "🎁", text: "Redeem for VIP access, merch & more" },
          ].map((b) => (
            <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500 }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${CYAN}18`, border: `1px solid ${CYAN}40`, borderRadius: 24, padding: "8px 18px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CYAN }} />
            <span style={{ color: CYAN, fontSize: 13, fontWeight: 600 }}>Joining the founding fan community</span>
          </div>
          <span style={{ color: MUTED, fontSize: 13 }}>rewlo.io</span>
        </div>
      </div>

      {/* Right: Phone mockup */}
      <div style={{ flexShrink: 0, zIndex: 1, position: "relative" }}>
        <div style={{
          width: 248,
          height: 530,
          background: "#0D1F3C",
          borderRadius: 38,
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: `0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${CYAN}20`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Status bar */}
          <div style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>9:41</span>
            <div style={{ width: 56, height: 16, background: "#0A1628", borderRadius: 8 }} />
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <svg width="10" height="7" viewBox="0 0 10 7"><rect x="0" y="2" width="2" height="5" rx="0.5" fill="white"/><rect x="2.7" y="1" width="2" height="6" rx="0.5" fill="white"/><rect x="5.4" y="0" width="2" height="7" rx="0.5" fill="white"/></svg>
              <div style={{ width: 12, height: 6, border: "1px solid white", borderRadius: 2, padding: 1, display: "flex" }}>
                <div style={{ width: "75%", height: "100%", background: "white", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* Screen */}
          <div style={{ flex: 1, background: BG, overflowY: "hidden", padding: "8px 12px 0" }}>
            {/* Header */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>Rewards</div>
              <div style={{ color: MUTED, fontSize: 8 }}>Earn points every time you pay</div>
            </div>

            {/* Points hero card */}
            <div style={{ background: `linear-gradient(135deg, #1D4ED8, ${PURPLE})`, borderRadius: 14, padding: "14px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Your Rewlo Points</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: "white", letterSpacing: -1, lineHeight: 1 }}>10,000</span>
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>pts</span>
              </div>
              {/* Never expire badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${CYAN}22`, border: `1px solid ${CYAN}44`, borderRadius: 10, padding: "3px 8px", marginBottom: 8 }}>
                <span style={{ fontSize: 9 }}>♾️</span>
                <span style={{ color: CYAN, fontSize: 8, fontWeight: 700 }}>Points never expire</span>
              </div>
              {/* Full progress bar — Legend tier reached */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${CYAN})`, borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "2px 7px" }}>
                  <span style={{ fontSize: 9 }}>👑</span>
                  <span style={{ color: GOLD, fontSize: 8, fontWeight: 600 }}>Legend Tier</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 7 }}>Max tier reached 🎉</span>
              </div>
            </div>

            {/* Club Loyalty */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>Club Loyalty</span>
              <span style={{ color: BLUE, fontSize: 7 }}>View all</span>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              {[
                { name: "Warriors", code: "gs", logoBase: "nba", accent: "#1D428A", bar: CYAN,      pts: "6,500", barPct: "65%" },
                { name: "49ers",    code: "sf", logoBase: "nfl", accent: "#AA0000", bar: "#EF4444", pts: "3,500", barPct: "35%" },
              ].map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderBottom: i === 0 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    <img src={`https://a.espncdn.com/i/teamlogos/${c.logoBase}/500/${c.code}.png`} style={{ width: 20, height: 20, objectFit: "contain" }} alt={c.name} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: "white", fontSize: 8, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ color: c.bar, fontSize: 8, fontWeight: 700 }}>{c.pts} pts</span>
                    </div>
                    <div style={{ height: 3, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: c.barPct, height: "100%", background: c.bar, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div style={{ color: "white", fontSize: 9, fontWeight: 700, marginBottom: 6 }}>Loyalty Milestones</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "Fan",       pts: "0",   icon: "🌱", done: true,  active: false },
                { label: "Supporter", pts: "500", icon: "⚡", done: true,  active: false },
                { label: "Loyal",     pts: "2K",  icon: "🏆", done: true,  active: false },
                { label: "Legend",    pts: "10K", icon: "👑", done: false, active: true  },
              ].map((m) => (
                <div key={m.label} style={{ flex: 1, background: m.active ? `${GOLD}22` : m.done ? `${CYAN}0F` : CARD, border: `1px solid ${m.active ? GOLD + "66" : m.done ? CYAN + "33" : BORDER}`, borderRadius: 8, padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{m.icon}</div>
                  <div style={{ color: m.active ? GOLD : m.done ? CYAN : "rgba(255,255,255,0.5)", fontSize: 7, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: MUTED, fontSize: 6, marginTop: 1 }}>{m.pts} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Glow under phone */}
        <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", width: 170, height: 28, background: `${CYAN}35`, filter: "blur(22px)", borderRadius: "50%" }} />
      </div>
    </div>
  );
}
