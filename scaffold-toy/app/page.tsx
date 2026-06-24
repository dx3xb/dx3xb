"use client";

import { useState } from "react";

// ===== 这是一个 demo 玩具，把它换成你自己的就行 =====
const ROLLS = ["🎲 6", "✨ nice", "🌈 maybe", "🔮 ask again", "🧸 cute", "⛏️ soon", "🪄 magic", "🍀 lucky"];

export default function Toy() {
  const [out, setOut] = useState("tap ROLL");

  return (
    <main className="wrap">
      {/* 返回主站按钮：每个玩具都保留它，方便用户回家 */}
      <div className="backbar">
        <a className="backbtn" href="https://dx3xb.com">← dx3xb</a>
      </div>

      <h1 className="pixel" style={{ fontSize: 22 }}>Demo Toy</h1>
      <p>把这个 demo 换成你的玩具。 / Replace this demo with your own toy.</p>

      <div className="panel" style={{ textAlign: "center" }}>
        <div className="pixel" style={{ fontSize: 28, margin: "10px 0 18px" }}>{out}</div>
        <button className="btn teal" onClick={() => setOut(ROLLS[Math.floor(Math.random() * ROLLS.length)])}>
          ROLL
        </button>
      </div>
    </main>
  );
}
