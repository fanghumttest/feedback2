# 方壺山道場 — 測試回饋系統

Phase 1 測試用的回饋收集系統，包含測試者端和管理儀表板。

## 路由

| 路徑 | 說明 |
|------|------|
| `/` | 測試者填寫頁面（有通行碼閘門） |
| `/admin` | 管理儀表板（題目編輯 + 通行碼設定 + 進度監控） |

## 本地開發

```bash
npm install
npm run dev
```

打開 http://localhost:5173 是測試者端，http://localhost:5173/admin 是管理端。

## 部署到 Vercel

1. 把這個資料夾 push 到 GitHub
2. 到 [vercel.com](https://vercel.com) → Import 這個 repo
3. Framework Preset 選 **Vite**
4. 按 Deploy，完成

部署後：
- `https://你的域名.vercel.app/` → 測試者端
- `https://你的域名.vercel.app/admin` → 管理端

## 首次使用

1. 打開 `/admin`，系統會自動初始化 136 題預設題目到 Firebase
2. 在「📝 編輯題目」tab 設定通行碼
3. 把 `/` 的連結 + 通行碼給測試者
4. 在「👥 測試者總覽」和「🔥 問題熱點」監控進度

## Firebase 設定

資料存在 Firebase Realtime Database 的 `/fhmt-feedback/` 路徑下：

```
/fhmt-feedback/
  questions/     → 題目資料（JSON）
  passcode       → 通行碼（字串）
  feedbacks/     → 測試者回饋（每人一筆）
    {userId}/
      nickname, device, browser, role
      answers/   → 每題的 status + comment
      freeform/  → 自由回饋
```

## 技術棧

- Vite + React 18
- React Router v6
- Firebase Realtime Database
- 純 inline styles（無 CSS 框架）
