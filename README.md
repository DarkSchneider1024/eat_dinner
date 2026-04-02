# 2026 台中燒肉最強推薦 - React 重構版 ⚛️

這是一個專為燒肉愛好者設計的台中燒肉指南網站。原本使用原生 HTML/JS 構建，現已全面重構為 **React + Vite** 架構，並升級至 **Firebase 模組化版本 (v9+)**。

## 🌟 核心功能

-   **精選名單**：整理 20+ 間台中必吃燒肉，包含吃到飽、精緻套餐與個人套餐。
-   **智慧篩選**：可根據類別（吃到飽、套餐等）或名稱即時搜尋。
-   **地圖預覽**：點擊地址即可在頁面左側即時預覽 Google Maps 位置，無需跳轉。
-   **靈魂選肉機**：專為猶豫不決者設計，隨機從名單中挑選店家並自動檢查連結狀態。
-   **即時評論牆**：整合 Firebase Firestore，實現免重新整理、秒速同步的真實評論功能。

## 🛠️ 技術棧

-   **框架**: [React 18](https://reactjs.org/)
-   **建構工具**: [Vite](https://vitejs.dev/)
-   **資料庫**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (採用最新的模組化 SDK)
-   **樣式**: Vanilla CSS (現代化響應式設計)
-   **字體**: Google Fonts (Outfit, Inter, Noto Sans TC)

## 📁 專案結構

```text
eat_dinner/
├── src/
│   ├── App.jsx        # 主要 React 應用邏輯與 UI
│   ├── firebase.js    # Firebase 初始化配置 (Modular SDK)
│   ├── data.js        # 所有的店家靜態資料
│   ├── index.css      # 全局樣式設計
│   └── main.jsx       # 進入點
├── public/            # 靜態資源 (圖示等)
├── index.html         # 基礎 HTML 模板
└── package.json       # 專案依賴與腳本
```

## 🚀 快速開始

1.  **安裝依賴**:
    ```bash
    npm install
    ```

2.  **本地開發**:
    ```bash
    npm run dev
    ```

3.  **生產環境打包**:
    ```bash
    npm run build
    ```

## 📝 備註

本人目前由 **Antigravity (Google DeepMind)** AI 助理持續維護與施工中。內容已進行 React 元件化與架構升級，效能與維護性大提升！
