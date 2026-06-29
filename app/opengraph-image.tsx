import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "dx3xb — playful web toys";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff6e6",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 26, background: "#ff6b6b" }} />
        <div style={{ fontSize: 210, fontWeight: 900, color: "#2b2233", letterSpacing: 6 }}>dx3xb</div>
        <div style={{ fontSize: 38, color: "#5a4f63", marginTop: 6 }}>playful web toys · post-Web3 / AI era</div>
        <div
          style={{
            fontSize: 30,
            color: "#2b2233",
            marginTop: 42,
            border: "4px solid #2b2233",
            padding: "12px 24px",
            background: "#ffd23f",
          }}
        >
          Sensory &amp; Brainpower Trio · make your own toys
        </div>
        <div style={{ position: "absolute", bottom: 30, fontSize: 26, color: "#5a4f63" }}>dx3xb.com</div>
      </div>
    ),
    size,
  );
}
