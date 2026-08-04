import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dx3xb — 网络趣味工具铺",
    short_name: "dx3xb",
    description: "感官、反应、记忆挑战，以及玩家创作的趣味网络小玩具。",
    start_url: "/",
    display: "standalone",
    background_color: "#fff6e6",
    theme_color: "#fff6e6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
