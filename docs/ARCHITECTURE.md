# dx3xb.com 架构与原则

## 核心原则：主页与玩具彻底解耦
> **主页（玩具墙）永远不包含任何玩具的代码。** 它只从目录里读出卡片列表并渲染。
> 只要玩具的代码不在主页的构建里，任何一个玩具崩了都不会拖垮主页。这是整套架构的地基。

## 三层结构

### ① 目录层 — Supabase 表 `dx3xb_toys`
玩具墙的每张卡片是一行数据，而不是写死在代码里。

| 字段 | 类型 | 说明 |
|---|---|---|
| `slug` | text, unique | 唯一标识，如 `pixel-game` |
| `title_zh` / `title_en` | text | 中 / 英标题 |
| `desc_zh` / `desc_en` | text | 可选的一句话描述 |
| `icon` | text | 一个 emoji，如 `🎲` |
| `type` | `internal` \| `external` | 自建玩具 / 外链 |
| `url` | text | 卡片点击去哪（自建子域 URL 或外链 URL） |
| `status` | `live` \| `coming_soon` \| `maintenance` \| `hidden` | 见下 |
| `sort_order` | int | 排序，越小越靠前 |

**status 含义**：
- `live` — 已上架，卡片可点击（**新标签打开** `url`）。
- `coming_soon` — 占位，显示 "COMING SOON"，不可点。
- `maintenance` — 临时下架，卡片变灰显示 "维护中 / MAINTENANCE"，不可点。
- `hidden` — 完全不显示（接口直接过滤掉）。

主页通过 `GET /api/toys` 读取（排除 hidden），按 `status` 渲染。
**改一行数据就能上架/下架/排序，无需改主页代码、无需重新部署主页。**

### ② 玩具层 — 每个玩具都只是一个 URL
对主页来说，自建和外链**都只是一张卡片 + 一个链接**，区别只在 `url` 指向：
- **外链玩具** (`type=external`)：`url` 指向别人的网页/小程序。天然隔离，对本站零风险。
- **自建玩具** (`type=internal`)：做成**独立的 Vercel 项目**，挂在子域名上（如 `pixel-game.dx3xb.com`），`url` 指向该子域。每个玩具有自己的代码库、构建、部署。

### ③ 故障隔离（为什么这样最稳）
- 自建玩具是**独立部署**：某玩具**构建失败**只是它自己发不出去，不影响主页和其它玩具；**运行崩溃**也只崩它自己那个子域页面。
- 主页对任何玩具**零代码依赖**，永远稳。
- `status` 字段可**秒级下架**问题玩具（改成 `maintenance` / `hidden`）。
- 玩具一律**新标签打开**，离开玩具不影响主页那个标签。
- 三重保险：独立部署（构建隔离）+ 独立子域（运行隔离）+ status 开关（人工兜底）。

## 后台管理
- 现阶段：直接用 **Supabase 表格编辑器** 管 `dx3xb_toys`（增删改、调 status、排序）。
- 玩具多于 3 个后：再做一个带密码的管理页（计划中）。

## 技术栈与域名
- 主页：Next.js（App Router）→ Vercel 项目 `dx3xb` → `dx3xb.com`（`www` 308 跳主域）。
- 数据：Supabase 项目 `xxlab`（ref `lesowftrotytmlvdyilc`），表 `dx3xb_*`，全部 RLS 开启、仅服务端 service_role 经 API 路由读写。
- DNS/CDN：Cloudflare（`dx3xb.com` 托管于此；`cdn.dx3xb.com` 是另一项无关服务，勿动）。
- 设计：像素风、暖纸+深绿+珊瑚配色；中文用子集像素字体（`public/fonts/fpx-cjk.woff2`），拉丁用 Press Start 2P / VT323。

## 数据表清单
- `dx3xb_subscribers(email, created_at)` — 邮箱订阅
- `dx3xb_guestbook(name, message, created_at)` — 留言板
- `dx3xb_toys(...)` — 玩具墙目录（见上）
