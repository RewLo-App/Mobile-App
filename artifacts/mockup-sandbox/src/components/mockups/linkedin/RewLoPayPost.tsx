import { Sparkles, Brain, ShieldCheck, Star } from "lucide-react";

export function RewLoPayPost() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020D1E",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Canvas */}
      <div
        style={{
          width: 1200,
          height: 1200,
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(1100px 700px at 78% 18%, rgba(0,229,204,0.16), transparent 60%), radial-gradient(900px 800px at 12% 92%, rgba(37,99,235,0.20), transparent 55%), linear-gradient(160deg, #041224 0%, #020A16 55%, #020813 100%)",
          color: "#fff",
        }}
      >
        {/* subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(900px 900px at 50% 40%, black, transparent 80%)",
          }}
        />

        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 84px",
            gap: 56,
          }}
        >
          {/* LEFT: copy */}
          <div style={{ flex: 1, maxWidth: 610 }}>
            {/* brand row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background:
                    "linear-gradient(135deg, #00E5CC 0%, #2563EB 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 26px rgba(0,229,204,0.35)",
                }}
              >
                <Star size={24} color="#020D1E" fill="#020D1E" />
              </div>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                Rew<span style={{ color: "#00E5CC" }}>Lo</span>
              </span>
            </div>

            {/* eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(0,229,204,0.10)",
                border: "1px solid rgba(0,229,204,0.30)",
                marginBottom: 28,
              }}
            >
              <Sparkles size={16} color="#00E5CC" />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "#7FF3E6",
                  textTransform: "uppercase",
                }}
              >
                Agentic Commerce
              </span>
            </div>

            {/* headline */}
            <h1
              style={{
                fontSize: 68,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: "0 0 24px",
              }}
            >
              Your points,
              <br />
              spent at the{" "}
              <span
                style={{
                  background:
                    "linear-gradient(120deg, #00E5CC 0%, #4FD1FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                perfect moment.
              </span>
            </h1>

            {/* subhead */}
            <p
              style={{
                fontSize: 21,
                lineHeight: 1.5,
                color: "rgba(237,246,255,0.92)",
                margin: "0 0 40px",
                maxWidth: 540,
              }}
            >
              Meet <strong style={{ color: "#fff" }}>RewLo Pay</strong> — an AI
              agent that evaluates every purchase in real time and redeems your
              loyalty points exactly when they're worth the most.
            </p>

            {/* feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  icon: <Brain size={22} color="#00E5CC" />,
                  title: "AI finds the optimal redemption",
                  sub: "Maximises point value on every transaction",
                },
                {
                  icon: <Sparkles size={22} color="#00E5CC" />,
                  title: "Transparent agent reasoning",
                  sub: "See exactly why each decision is made",
                },
                {
                  icon: <ShieldCheck size={22} color="#00E5CC" />,
                  title: "Stripe Agentic Commerce",
                  sub: "Secure, protocol-native settlement",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 16 }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: 12,
                      background: "rgba(0,229,204,0.10)",
                      border: "1px solid rgba(0,229,204,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        color: "rgba(226,240,255,0.78)",
                      }}
                    >
                      {f.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: phone */}
          <div
            style={{
              position: "relative",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* glow behind phone */}
            <div
              style={{
                position: "absolute",
                width: 460,
                height: 460,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(0,229,204,0.35), transparent 65%)",
                filter: "blur(20px)",
              }}
            />
            <img
              src="/__mockup/images/rewlo-pay.png"
              alt="RewLo Pay screen"
              style={{
                position: "relative",
                height: 1000,
                filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.6))",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
