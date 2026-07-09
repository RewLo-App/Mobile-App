export function LinkedInAnnouncement() {
  const BG = "#020D1E";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const CARD = "#0A1628";
  const BORDER = "rgba(255,255,255,0.08)";
  const MUTED = "rgba(255,255,255,0.45)";

  return (
    <div style={{
      width: 1200, height: 627,
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
      <div style={{ position: "absolute", top: -120, left: -80, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}33 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, right: 300, width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${CYAN}22 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 40, right: 80, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, #7C3AED22 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Left: announcement text */}
      <div style={{ flex: 1, paddingRight: 60, zIndex: 1 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: CYAN, letterSpacing: -1 }}>RewLo</div>
          <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${CYAN}18`, border: `1px solid ${CYAN}40`, borderRadius: 20, padding: "5px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CYAN }} />
            <span style={{ color: CYAN, fontSize: 12, fontWeight: 600 }}>Coming Soon</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 38, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 18 }}>
          The Digital Wallet<br />
          <span style={{ color: CYAN }}>Built for Sports Fans</span>
        </div>

        {/* Sub */}
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 32, maxWidth: 400 }}>
          Pay with USDC at the stadium, earn Rewlo Points on every transaction, and unlock exclusive fan rewards — all in one app.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          {[
            { icon: "⚡", text: "USDC Payments" },
            { icon: "⭐", text: "Loyalty Points" },
            { icon: "🏟️", text: "Stadium Pay" },
            { icon: "🏆", text: "Fan Rewards" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "7px 14px" }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA line */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ height: 2, width: 32, background: CYAN, borderRadius: 1 }} />
          <span style={{ color: MUTED, fontSize: 13 }}>Joining the founding fan community · rewlo.io</span>
        </div>
      </div>

      {/* Right: Phone mockup */}
      <div style={{ flexShrink: 0, zIndex: 1, position: "relative" }}>
        {/* Phone frame */}
        <div style={{
          width: 240,
          height: 500,
          background: "#0D1F3C",
          borderRadius: 36,
          border: "2px solid rgba(255,255,255,0.12)",
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 20px 40px ${BLUE}30`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Notch */}
          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
            <span style={{ color: "white", fontSize: 9, fontWeight: 600 }}>9:41</span>
            <div style={{ width: 60, height: 16, background: "#0A1628", borderRadius: 8 }} />
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <svg width="10" height="7" viewBox="0 0 10 7"><rect x="0" y="2" width="2" height="5" rx="0.5" fill="white"/><rect x="2.7" y="1" width="2" height="6" rx="0.5" fill="white"/><rect x="5.4" y="0" width="2" height="7" rx="0.5" fill="white"/></svg>
              <div style={{ width: 12, height: 6, border: "1px solid white", borderRadius: 2, padding: 1, display: "flex" }}>
                <div style={{ width: "75%", height: "100%", background: "white", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div style={{ flex: 1, overflowY: "hidden", padding: "6px 12px 0", background: BG }}>
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ color: MUTED, fontSize: 7 }}>Good evening,</div>
                <div style={{ color: "white", fontSize: 11, fontWeight: 700 }}>Alex Fan 👋</div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px solid rgba(0,229,204,0.7)`, background: "#1D428A", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src="https://a.espncdn.com/i/teamlogos/nba/500/gs.png" style={{ width: 20, height: 20, objectFit: "contain" }} alt="Warriors" />
              </div>
            </div>

            {/* Balance Card */}
            <div style={{ background: `linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ color: CYAN, fontSize: 11, fontWeight: 800 }}>RewLo</span>
                <div style={{ width: 18, height: 14, borderRadius: 3, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }} />
              </div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Total Balance</div>
              <div style={{ color: "white", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 1 }}>$0.00</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 7, marginBottom: 6 }}>USDC · Stablecoin</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "3px 7px" }}>
                <span style={{ fontSize: 8 }}>⭐</span>
                <span style={{ color: "#F59E0B", fontSize: 8, fontWeight: 600 }}>0 Rewlo Points</span>
              </div>
            </div>

            {/* Quick actions mini */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["↑ Send", "↓ Receive", "⊡ Pay", "+ Top Up"].map((a) => (
                <div key={a} style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 2px", textAlign: "center" }}>
                  <span style={{ color: CYAN, fontSize: 7, fontWeight: 600 }}>{a}</span>
                </div>
              ))}
            </div>

            {/* Club Loyalty section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>Club Loyalty</span>
              <span style={{ color: BLUE, fontSize: 7 }}>View all</span>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              {[
                { name: "Warriors", league: "NBA", code: "gs", logoBase: "nba", accent: "#1D428A", pct: 78 },
                { name: "49ers", league: "NFL", code: "sf", logoBase: "nfl", accent: "#AA0000", pct: 22 },
              ].map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", borderBottom: i === 0 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    <img src={`https://a.espncdn.com/i/teamlogos/${c.logoBase}/500/${c.code}.png`} style={{ width: 22, height: 22, objectFit: "contain" }} alt={c.name} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: "white", fontSize: 8, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ color: c.accent === "#1D428A" ? CYAN : "#F87171", fontSize: 8, fontWeight: 700 }}>0 pts</span>
                    </div>
                    <div style={{ height: 3, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${c.pct}%`, height: "100%", background: c.accent === "#1D428A" ? CYAN : "#EF4444", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Glow under phone */}
        <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 160, height: 30, background: `${BLUE}40`, filter: "blur(20px)", borderRadius: "50%" }} />
      </div>
    </div>
  );
}
