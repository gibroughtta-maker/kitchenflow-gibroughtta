# KitchenFlow 参赛用 Web 展示页

静态单页，用于黑客松/路演时在浏览器中展示产品概念与 Demo 示意。

## 内容

- **Hero**：产品名、一句话介绍、查看 Demo / 核心功能
- **核心功能**：冰箱扫描、想吃清单、购物清单、库存管理（四张卡片）
- **Demo · 扫描结果**：模拟「扫描结果」页（新鲜食材 + 需尽快使用 + 推荐食谱/生成购物清单按钮）
- **Demo · 购物清单**：模拟清单条目与勾选
- **CTA**：引导完整体验使用 App（Expo Web / 原生）

## 本地查看

```bash
# 在仓库根目录
cd C:\Users\gibro\Documents\kitchenflow\web
# 用浏览器直接打开 index.html，或起一个简单静态服务：
npx serve .
# 然后访问 http://localhost:3000
```

## 部署

- 将 `web` 目录部署到任意静态托管（Vercel、Netlify、GitHub Pages 等），根目录设为 `web` 或把 `index.html` 放在根目录。
- 单文件无后端依赖，仅使用 Tailwind CDN 与本地内联样式。

## 与 App 的对应关系

- 设计风格与 `stitch_fridge_scan_results` 设计稿一致（液态玻璃卡片、状态标签等）。
- 功能说明与 `kitchenflow-app` 实际路由对应，详见仓库内 `docs/FEATURE_STATUS.md`。
