# MyIP 專案狀態

## 目前完成項目

- [x] Cloudflare Workers + TypeScript 專案初始化
- [x] 核心 IP 查詢邏輯（`src/worker.ts`）
- [x] HTML 頁面（含地理資訊）
- [x] JSON API 端點（`GET /api` 或 `Accept: application/json`）
- [x] GitHub repo：https://github.com/leeyihua/myip
- [x] GitHub Actions 自動部署（push to main 觸發）
- [x] 部署上線：https://myip.leeyihua.workers.dev

## 專案架構

```
08-myip/
├── src/worker.ts              # 主要 Worker 邏輯
├── wrangler.toml              # Cloudflare Workers 設定
├── package.json
├── tsconfig.json
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions CI/CD
└── .gitignore
```

## 偵測的 IP Headers（可信度由高到低）

1. `CF-Connecting-IP` — Cloudflare 真實 IP（最可信）
2. `True-Client-IP` — Cloudflare Enterprise / Akamai
3. `X-Real-IP` — Nginx 反向代理
4. `X-Forwarded-For` — CDN 鏈路（取第一個）

## 注意事項

- Cloudflare API Token 需要：**Account > Workers Scripts > Edit** + **User > User Details > Read**
- 本機 `wrangler dev` 時 `CF-Connecting-IP` 為空，可用 `curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:8787/api` 模擬

## 待辦 / 可延伸方向

- [ ] 自訂網域（需在 Cloudflare 設定 Custom Domain）
- [ ] 顯示更多 `request.cf` 欄位（緯度、經度、時區等）
- [ ] 純文字輸出（`curl myip.leeyihua.workers.dev` 直接顯示 IP）
