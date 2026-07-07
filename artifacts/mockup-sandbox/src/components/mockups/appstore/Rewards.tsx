export function Rewards() {
  const BG = "#020D1E";
  const CARD = "#0A1628";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const GOLD = "#F59E0B";
  const BORDER = "rgba(255,255,255,0.08)";
  const MUTED = "rgba(255,255,255,0.45)";

  const clubs = [
    { name: "Warriors", fullName: "Golden State Warriors", league: "NBA", code: "gs", logoBase: "nba", accent: "#1D428A", pts: 0, pct: 78 },
    { name: "49ers", fullName: "San Francisco 49ers", league: "NFL", code: "sf", logoBase: "nfl", accent: "#AA0000", pts: 0, pct: 22 },
  ];

  const milestones = [
    { label: "Fan", pts: 0, icon: "🌱" },
    { label: "Supporter", pts: 500, icon: "⚡" },
    { label: "Loyal", pts: 2000, icon: "🏆" },
    { label: "Legend", pts: 10000, icon: "👑" },
  ];

  const offers = [
    { title: "10% off at Club Store", category: "Sports", pts: 500, emoji: "🛍️", accent: BLUE },
    { title: "Match Day VIP Access", category: "Stadium", pts: 2500, emoji: "🏟️", accent: "#7C3AED" },
    { title: "Exclusive Livestream", category: "Media", pts: 1000, emoji: "📺", accent: "#DC2626" },
    { title: "Fan Badge NFT", category: "Gaming", pts: 750, emoji: "🎮", accent: "#059669" },
  ];

  return (
    <div style={{ width: 428, height: 926, background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <span style={{ color: "white", fontSize: 15, fontWeight: 600 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="3" width="3" height="9" rx="1" fill="white"/><rect x="4.5" y="2" width="3" height="10" rx="1" fill="white"/><rect x="9" y="0" width="3" height="12" rx="1" fill="white"/></svg>
          <div style={{ width: 22, height: 11, border: "1.5px solid white", borderRadius: 3, padding: 1.5, display: "flex" }}>
            <div style={{ width: "80%", height: "100%", background: "white", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "4px 24px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Rewards</div>
        <div style={{ color: MUTED, fontSize: 14 }}>Earn points every time you pay</div>
      </div>

      {/* Points hero */}
      <div style={{ margin: "0 20px 18px", background: `linear-gradient(135deg, #1D4ED8, #7C3AED)`, borderRadius: 20, padding: "20px 22px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Your Rewlo Points</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: "white", letterSpacing: -1 }}>0</span>
          <span style={{ color: GOLD, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>pts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "2%", height: "100%", background: GOLD, borderRadius: 3 }} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>500 to Supporter</span>
        </div>
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "4px 10px" }}>
          <span style={{ color: GOLD, fontSize: 12 }}>🌱 Fan Tier</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {/* Club Loyalty */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Club Loyalty Points</div>
          <div style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>Your Rewlo points across all supported clubs</div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            {clubs.map((c, i) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderBottom: i < clubs.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  <img src={`https://a.espncdn.com/i/teamlogos/${c.logoBase}/500/${c.code}.png`} style={{ width: 42, height: 42, objectFit: "contain" }} alt={c.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ background: `${c.accent}33`, border: `1px solid ${c.accent}55`, color: c.accent, fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>{c.league}</span>
                    </div>
                    <span style={{ color: c.accent, fontSize: 14, fontWeight: 700 }}>0 pts</span>
                  </div>
                  <div style={{ height: 4, background: BORDER, borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
                    <div style={{ width: "0%", height: "100%", background: c.accent, borderRadius: 2 }} />
                  </div>
                  <div style={{ color: MUTED, fontSize: 11 }}>{c.fullName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Loyalty Milestones</div>
          <div style={{ display: "flex", gap: 10 }}>
            {milestones.map((m, i) => (
              <div key={m.label} style={{ flex: 1, background: i === 0 ? `${BLUE}22` : CARD, border: `1px solid ${i === 0 ? BLUE + "55" : BORDER}`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ color: i === 0 ? CYAN : "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>{m.label}</div>
                <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{m.pts.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Offers */}
        <div>
          <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Fan Offers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {offers.map((o) => (
              <div key={o.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${o.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{o.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{o.title}</div>
                  <div style={{ color: MUTED, fontSize: 12 }}>{o.category} · {o.pts.toLocaleString()} pts</div>
                </div>
                <div style={{ background: `${o.accent}22`, border: `1px solid ${o.accent}44`, borderRadius: 10, padding: "6px 12px", color: o.accent, fontSize: 12, fontWeight: 600 }}>Redeem</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, display: "flex", padding: "10px 0 28px", flexShrink: 0 }}>
        {[{ icon: "🏠", label: "Home" }, { icon: "💳", label: "Wallet" }, { icon: "⭐", label: "Rewards", active: true }, { icon: "👤", label: "Profile" }].map((n) => (
          <div key={n.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ color: n.active ? CYAN : MUTED, fontSize: 10, fontWeight: n.active ? 700 : 400 }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
