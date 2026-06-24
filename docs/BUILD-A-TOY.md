# 如何做一个玩具并上架到玩具墙

> 适用于开发者 / AI agent。先读 [ARCHITECTURE.md](ARCHITECTURE.md) 理解原则：**每个玩具独立部署、独立子域，主页只读目录、绝不包含玩具代码。**

有两种玩具：**外链** 和 **自建**。

---

## A. 外链玩具（最简单）
只是把一个现成网页/小程序挂到墙上。**不用写代码**，直接在 `dx3xb_toys` 表加一行：
- `type=external`，`url=` 外链地址，`status=live`，填好 `title_*`/`icon`/`sort_order`。
完成。

---

## B. 自建玩具（独立项目）

### 1. 用脚手架起项目
```bash
cp -r scaffold-toy my-cool-toy && cd my-cool-toy
npm install
npm run dev            # http://localhost:3000 预览
```
脚手架自带 dx3xb 像素主题（`app/theme.css`）和顶部 `← dx3xb` 返回按钮。

### 2. 写你的玩具
- 把 `app/page.tsx` 换成你的玩具逻辑。
- **保留** 顶部 `← dx3xb` 返回按钮（链接 `https://dx3xb.com`）。
- 尽量复用 `theme.css` 的 `.panel` / `.btn` / `.pixel` 等，保持像素风统一。
- 如果玩具要存数据，自己建独立的 Supabase 表（建议表名带前缀，如 `toy_mycooltoy_*`），不要碰主站的 `dx3xb_*` 表。

### 3. 独立部署（关键：每个玩具一个 Vercel 项目）
```bash
npm run build                  # 先本地构建确认 0 error
vercel deploy --prod --yes     # 部署成一个新的 Vercel 项目
```
然后给它一个子域：
- 在 Vercel 项目里 Add Domain：`my-cool-toy.dx3xb.com`
- 在 Cloudflare 给 `dx3xb.com` 加一条 CNAME：`my-cool-toy` → `cname.vercel-dns.com`（**灰色云朵 DNS-only**）
- 等 Vercel 签发证书（几分钟），访问 `https://my-cool-toy.dx3xb.com` 确认能开。

> ⚠️ 别动 `cdn.dx3xb.com`（橙云）那条记录，它是无关的另一个服务。

### 4. 注册到玩具墙
在 Supabase `dx3xb_toys` 表加一行（或改一个现有的 `coming_soon` 占位）：

| 字段 | 值 |
|---|---|
| slug | `my-cool-toy` |
| title_zh / title_en | 中 / 英标题 |
| icon | 一个 emoji |
| type | `internal` |
| url | `https://my-cool-toy.dx3xb.com` |
| status | `live` |
| sort_order | 排序数字 |

把 `status` 设 `live` 后，主页玩具墙**自动**出现一张可点卡片（新标签打开）。不用改主页、不用重新部署主页。

> 写表权限受控：如果你（agent）没有 Supabase 写权限，就把上面这行的字段值整理好交给管理员录入。

---

## 故障处理
- 某玩具出问题 → 把它在 `dx3xb_toys` 的 `status` 改成 `maintenance`（变灰不可点）或 `hidden`（消失），**主站不受任何影响**。
- 玩具的 bug 在它自己的独立项目里修、独立重新部署，和主站无关。

## 约定清单（Checklist）
- [ ] 用脚手架、保留 `← dx3xb` 返回按钮
- [ ] 复用像素主题，风格统一
- [ ] 独立 Vercel 项目 + 独立子域
- [ ] 自己的数据用自己的表，不碰 `dx3xb_*`
- [ ] 本地 `npm run build` 通过再部署
- [ ] 在 `dx3xb_toys` 注册，`status=live`
