export function WalletHome() {
  const BG = "#020D1E";
  const CARD = "#0A1628";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const BORDER = "rgba(255,255,255,0.08)";
  const MUTED = "rgba(255,255,255,0.45)";

  const txns = [
    { icon: "⚡", label: "Top Up · USDC", sub: "Wallet deposit", amt: "+$50.00", color: "#22C55E" },
    { icon: "🏟️", label: "Stadium Pay · SoFi", sub: "Rams vs 49ers", amt: "-$24.00", color: "#F87171" },
    { icon: "⭐", label: "Loyalty Reward", sub: "Match day bonus", amt: "+120 pts", color: CYAN },
  ];

  const actions = [
    { icon: "↑", label: "Send" },
    { icon: "↓", label: "Receive" },
    { icon: "⊡", label: "Pay" },
    { icon: "+", label: "Top Up" },
  ];

  return (
    <div style={{ width: 428, height: 926, background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <span style={{ color: "white", fontSize: 15, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="3" width="3" height="9" rx="1" fill="white"/><rect x="4.5" y="2" width="3" height="10" rx="1" fill="white"/><rect x="9" y="0" width="3" height="12" rx="1" fill="white"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill="white" opacity="0.3"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.4C10.7 2.4 13.1 3.5 14.8 5.3L16 4C13.9 1.5 10.9 0 8 0 5.1 0 2.1 1.5 0 4L1.2 5.3C2.9 3.5 5.3 2.4 8 2.4z" fill="white"/><path d="M8 5.6C9.9 5.6 11.6 6.4 12.8 7.7L14 6.5C12.4 4.9 10.3 4 8 4 5.7 4 3.6 4.9 2 6.5L3.2 7.7C4.4 6.4 6.1 5.6 8 5.6z" fill="white"/><circle cx="8" cy="11" r="1.5" fill="white"/></svg>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{ width: 22, height: 11, border: "1.5px solid white", borderRadius: 3, padding: 1.5, display: "flex" }}>
              <div style={{ width: "80%", height: "100%", background: "white", borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ color: MUTED, fontSize: 13 }}>Good evening,</div>
            <div style={{ color: "white", fontSize: 22, fontWeight: 700 }}>Alex Fan 👋</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid rgba(0,229,204,0.7)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#003370" }}>
              <img src="https://a.espncdn.com/i/teamlogos/nba/500/gs.png" style={{ width: 38, height: 38, objectFit: "contain" }} alt="Warriors" />
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: CARD, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>🔔</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{ background: `linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)`, borderRadius: 22, padding: 22, marginBottom: 18, position: "relative", overflow: "hidden" }}>
          {/* decorative circles */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -30, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, position: "relative" }}>
            <span style={{ color: CYAN, fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>RewLo</span>
            <span style={{ fontSize: 18, opacity: 0.7 }}>👁</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, position: "relative" }}>Total Balance</div>
          <div style={{ color: "white", fontSize: 42, fontWeight: 800, letterSpacing: -1, marginBottom: 2, position: "relative" }}>$0.00</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 4, position: "relative" }}>USDC · Stablecoin</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14, position: "relative" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>ℹ</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Demo mode — balances are for illustration only</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "5px 10px", position: "relative" }}>
            <span style={{ fontSize: 12 }}>⭐</span>
            <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 600 }}>0 Rewlo Points</span>
          </div>
          {/* Chip */}
          <div style={{ position: "absolute", bottom: 20, right: 22 }}>
            <div style={{ width: 36, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)" }} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {actions.map((a) => (
            <div key={a.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: CARD, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: CYAN, fontSize: 20, fontWeight: 700 }}>{a.icon}</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Recent Activity</span>
          <span style={{ color: BLUE, fontSize: 13 }}>See all</span>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 6 }}>
          {txns.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < txns.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                <div style={{ color: MUTED, fontSize: 12 }}>{t.sub}</div>
              </div>
              <span style={{ color: t.color, fontSize: 14, fontWeight: 700 }}>{t.amt}</span>
            </div>
          ))}
        </div>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 20, marginLeft: 2 }}>* For illustration only</div>

        {/* Club Loyalty */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Club Loyalty</span>
          <span style={{ color: BLUE, fontSize: 13 }}>View all</span>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
          {[{ team: "Golden State Warriors", league: "NBA", code: "gs", accent: "#1D428A", pts: 0 }].map((c) => (
            <div key={c.team} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={`https://a.espncdn.com/i/teamlogos/nba/500/${c.code}.png`} style={{ width: 42, height: 42, objectFit: "contain" }} alt={c.team} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>Warriors</span>
                  <span style={{ color: CYAN, fontSize: 14, fontWeight: 700 }}>0 pts</span>
                </div>
                <div style={{ height: 4, background: BORDER, borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
                  <div style={{ width: "0%", height: "100%", background: CYAN, borderRadius: 2 }} />
                </div>
                <div style={{ color: MUTED, fontSize: 11 }}>Golden State Warriors</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, display: "flex", padding: "10px 0 28px" }}>
        {[{ icon: "🏠", label: "Home", active: true }, { icon: "💳", label: "Wallet" }, { icon: "⭐", label: "Rewards" }, { icon: "👤", label: "Profile" }].map((n) => (
          <div key={n.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ color: n.active ? CYAN : MUTED, fontSize: 10, fontWeight: n.active ? 700 : 400 }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
