# 色差猎人 / Color Hunter

dx3xb.com 的第一个自建玩具：60 秒辨别色差小游戏。

## 功能

- 关卡晋级：3x3 起步，逐步提高到 7x7。
- 难度递增：估算色差 ΔE 随关卡降低。
- 计分：速度、关卡、combo、失误共同影响总分。
- 报告：输出总分、到达关卡、最小识别色差、平均反应、最高连击、失误。
- 分享：URL 带 seed，可让好友挑战同一套题。

## 本地运行

```bash
npm install
npm run dev
```

## 部署

独立 Vercel 项目，目标子域：

```text
https://color-hunter.dx3xb.com
```
