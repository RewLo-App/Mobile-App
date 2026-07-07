export function SendMoney() {
  const BG = "#020D1E";
  const CARD = "#0A1628";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const BORDER = "rgba(255,255,255,0.08)";
  const MUTED = "rgba(255,255,255,0.45)";

  const contacts = [
    { name: "Jordan", emoji: "🏀", color: "#DC2626" },
    { name: "Marcus", emoji: "⚽", color: "#7C3AED" },
    { name: "Priya", emoji: "🎾", color: "#059669" },
    { name: "Tyler", emoji: "🏈", color: "#D97706" },
  ];

  const keys = ["1","2","3","4","5","6","7","8","9",".", "0", "⌫"];

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

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px 20px", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: 16 }}>←</span>
        </div>
        <span style={{ color: "white", fontSize: 17, fontWeight: 700 }}>Send USDC</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Balance pill */}
      <div style={{ textAlign: "center", marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${BLUE}22`, border: `1px solid ${BLUE}44`, borderRadius: 20, padding: "6px 16px" }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Available:</span>
          <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>$0.00 USDC</span>
        </div>
      </div>

      {/* Send to */}
      <div style={{ padding: "0 24px 20px", flexShrink: 0 }}>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Send to</div>
        <div style={{ display: "flex", gap: 14 }}>
          {contacts.map((c) => (
            <div key={c.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: `${c.color}33`, border: `2px solid ${c.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.emoji}</div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Amount display */}
      <div style={{ textAlign: "center", padding: "10px 24px 24px", flexShrink: 0 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: -2 }}>
          $25
        </div>
        <div style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>≈ 25 USDC</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: `${CYAN}15`, border: `1px solid ${CYAN}33`, borderRadius: 20, padding: "5px 14px" }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: CYAN, fontSize: 13, fontWeight: 600 }}>Earn 25 Rewlo Points</span>
        </div>
      </div>

      {/* Note field */}
      <div style={{ margin: "0 24px 20px", flexShrink: 0 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ color: MUTED, fontSize: 14 }}>Add a note (optional)</span>
        </div>
      </div>

      {/* Keypad */}
      <div style={{ flex: 1, padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {keys.map((k) => (
          <div key={k} style={{ height: 60, borderRadius: 14, background: k === "⌫" ? `${BLUE}22` : CARD, border: `1px solid ${k === "⌫" ? BLUE + "44" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ color: k === "⌫" ? CYAN : "white", fontSize: k === "⌫" ? 20 : 22, fontWeight: 600 }}>{k}</span>
          </div>
        ))}
      </div>

      {/* Send button */}
      <div style={{ padding: "16px 24px 40px", flexShrink: 0 }}>
        <div style={{ background: `linear-gradient(135deg, ${BLUE}, #3B82F6)`, borderRadius: 16, padding: "18px", textAlign: "center" }}>
          <span style={{ color: "white", fontSize: 17, fontWeight: 700 }}>Send $25.00</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, color: MUTED, fontSize: 11 }}>* For illustration only · Demo mode</div>
      </div>
    </div>
  );
}
