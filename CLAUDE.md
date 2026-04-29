# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個部署在 Cloudflare Workers 的 IP 查詢服務，使用 TypeScript 撰寫。

- 線上網址：https://myip.leeyihua.workers.dev
- GitHub：https://github.com/leeyihua/myip

## 常用指令

```bash
npm run dev       # 本機開發（wrangler dev，監聽 http://localhost:8787）
npm run deploy    # 手動部署至 Cloudflare Workers
npm run cf-typegen  # 重新產生 Cloudflare Workers 型別定義
```

本機測試 JSON API（`CF-Connecting-IP` 在本機為空，需手動模擬）：
```bash
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:8787/api
```

## 架構

唯一的入口點是 `src/worker.ts`，包含三個主要函式：

- `extractIpInfo(request)` — 從 HTTP headers 與 `request.cf` 取出 IP 與地理資訊，header 優先順序：`CF-Connecting-IP` > `True-Client-IP` > `X-Real-IP` > `X-Forwarded-For`
- `htmlResponse(info)` — 回傳暗色主題 HTML 頁面；若偵測到 IPv6，會在前端用 `fetch("https://api4.ipify.org")` 額外查詢 IPv4
- `jsonResponse(info)` — 回傳 JSON；路徑為 `/api` 或帶有 `Accept: application/json` header 時觸發

## CI/CD

push 到 `main` 分支會自動觸發 `.github/workflows/deploy.yml`，使用 GitHub Secret `CF_API_TOKEN` 部署。Token 需要 **Account > Workers Scripts > Edit** 與 **User > User Details > Read** 權限。
