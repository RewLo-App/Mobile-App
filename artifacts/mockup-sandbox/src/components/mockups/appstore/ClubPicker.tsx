export function ClubPicker() {
  const BG = "#020D1E";
  const CARD = "#0A1628";
  const CYAN = "#00E5CC";
  const BLUE = "#2563EB";
  const MUTED = "rgba(255,255,255,0.5)";

  const teams = [
    { name: "Giants", code: "nyg", league: "NFL" },
    { name: "Rams", code: "lar", league: "NFL" },
    { name: "Ravens", code: "bal", league: "NFL" },
    { name: "Broncos", code: "den", league: "NFL" },
    { name: "Raiders", code: "lv", league: "NFL" },
    { name: "Vikings", code: "min", league: "NFL" },
    { name: "Buccaneers", code: "tb", league: "NFL" },
    { name: "Cardinals", code: "ari", league: "NFL" },
    { name: "Falcons", code: "atl", league: "NFL" },
    { name: "Chiefs", code: "kc", league: "NFL" },
    { name: "Cowboys", code: "dal", league: "NFL" },
    { name: "Packers", code: "gb", league: "NFL" },
  ];

  const leagues = ["NFL", "NBA", "MLB", "NHL", "MLS"];

  return (
    <div style={{ width: 428, height: 926, background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif", position: "relative" }}>
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

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 6, padding: "0 24px 20px", flexShrink: 0 }}>
        {[1,0,0].map((active, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: active ? CYAN : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "0 24px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: CYAN, letterSpacing: -1, marginBottom: 6 }}>RewLo</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 6 }}>Pick your team</div>
        <div style={{ fontSize: 14, color: MUTED, marginBottom: 14 }}>Select the club you root for most</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,229,204,0.12)", border: `1px solid rgba(0,229,204,0.35)`, borderRadius: 20, padding: "6px 14px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: CYAN }} />
          <span style={{ color: CYAN, fontSize: 12, fontWeight: 600 }}>Coming Soon · For representation purposes only</span>
        </div>
      </div>

      {/* League tabs */}
      <div style={{ display: "flex", gap: 8, padding: "0 24px 16px", overflowX: "auto", flexShrink: 0 }}>
        {leagues.map((l) => (
          <div key={l} style={{ padding: "7px 16px", borderRadius: 20, background: l === "NFL" ? BLUE : "rgba(255,255,255,0.08)", border: `1px solid ${l === "NFL" ? BLUE : "rgba(255,255,255,0.15)"}`, color: "white", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer" }}>{l}</div>
        ))}
      </div>

      {/* Team grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px 8px" }}>
          {teams.map((t) => (
            <div key={t.code} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${t.code}.png`} style={{ width: 58, height: 58, objectFit: "contain" }} alt={t.name} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 500, textAlign: "center" }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div style={{ padding: "16px 24px 40px", flexShrink: 0 }}>
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "17px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 16, fontWeight: 600 }}>Continue</div>
      </div>
    </div>
  );
}
