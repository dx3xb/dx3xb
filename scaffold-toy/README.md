# dx3xb 玩具脚手架 / Toy Scaffold

一个最小的 Next.js 玩具模板，自带 dx3xb 像素主题和"返回主站"按钮。
A minimal Next.js toy template with the dx3xb pixel theme and a "back to dx3xb" button.

## 快速开始 / Quick start

```bash
# 1. 把这个文件夹复制成一个新项目（独立目录/独立仓库）
cp -r scaffold-toy my-cool-toy && cd my-cool-toy

# 2. 安装 & 本地预览
npm install
npm run dev   # http://localhost:3000

# 3. 把 app/page.tsx 换成你的玩具（保留顶部的 ← dx3xb 返回按钮）
```

## 上线 / Deploy（每个玩具一个独立 Vercel 项目，互不影响）

```bash
npm run build                 # 先本地构建确认没问题
vercel deploy --prod --yes    # 部署成一个新的 Vercel 项目
```

然后在 Vercel 给它绑一个子域，例如 `my-cool-toy.dx3xb.com`，并在 Cloudflare 加对应 DNS。

## 注册到玩具墙 / Register on the toy wall

在 Supabase 的 `dx3xb_toys` 表里加一行（或改一行已有占位）：

| 字段 | 值示例 |
|---|---|
| slug | `my-cool-toy` |
| title_zh / title_en | `我的玩具` / `my cool toy` |
| icon | 一个 emoji，如 `🎯` |
| type | `internal`（自建）/ `external`（外链） |
| url | `https://my-cool-toy.dx3xb.com` 或外链地址 |
| status | `live`（上架可玩） / `coming_soon` / `maintenance` / `hidden` |
| sort_order | 排序，数字越小越靠前 |

把 `status` 设为 `live` 后，主页玩具墙会自动出现一张可点击的卡片（新标签打开），**不需要改主页代码、不需要重新部署主页**。

## 规则 / Rules

- 每个玩具是**独立部署**，所以你的玩具崩了**不会影响主站和其它玩具**。
- 保留顶部 `← dx3xb` 返回按钮（链接 `https://dx3xb.com`）。
- 尽量复用 `app/theme.css` 里的像素主题，让风格统一。
- 出问题时，把该玩具在 `dx3xb_toys` 表里的 `status` 改成 `maintenance` 即可临时下架。

详见仓库根目录 `docs/BUILD-A-TOY.md`。
