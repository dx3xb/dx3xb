# dx3xb.com

> 后 Web3 · AI 时代的网络趣味工具铺 — a toy shop of fun web tools.

**dx3xb** 是一张噘嘴的小脸（`d`/`b` 是耳朵，`x`/`x` 是闭眼，`3` 是噘嘴），也是一个收集好玩、有点幽默感的网络小工具/小玩具的站点。主功能区是 **玩具墙 (Toy Wall)**。

## 仓库结构
```
app/            主页（玩具墙）的 Next.js 应用
lib/            Supabase 服务端客户端
public/         静态资源（含子集像素中文字体）
scaffold-toy/   自建玩具的脚手架模板（复制它来做新玩具）
docs/           工程文档（开始前必读）
```

## 📚 工程文档（开始前请先读）
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — 整体架构、玩具墙目录设计、故障隔离原则
- **[docs/BUILD-A-TOY.md](docs/BUILD-A-TOY.md)** — 如何从零做一个玩具并上架到玩具墙（给开发者 / agent）

## 技术栈
| 层 | 用什么 |
|---|---|
| 主页 | Next.js（App Router）→ Vercel 项目 `dx3xb` → 域名 `dx3xb.com` |
| 数据 | Supabase 项目 `xxlab`（ref `lesowftrotytmlvdyilc`）：`dx3xb_subscribers`(订阅) / `dx3xb_guestbook`(留言) / `dx3xb_toys`(玩具目录) |
| DNS/CDN | Cloudflare（域名 dx3xb.com 托管于此） |

## 本地开发
```bash
npm install
npm run dev     # http://localhost:3000
```
需要环境变量 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`（仅服务端，已配在 Vercel）。

## 部署
主页通过 Vercel CLI 部署：`vercel deploy --prod`（项目 `dx3xb`）。

---
🤖 工程化协作：本仓库是 dx3xb.com 的单一事实源。新玩具请按 `docs/BUILD-A-TOY.md` 的流程做。
