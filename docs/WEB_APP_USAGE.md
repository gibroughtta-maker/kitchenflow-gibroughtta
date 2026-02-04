# KitchenFlow Web 端使用说明

App 功能已在 **Expo Web** 上实现，同一套代码在浏览器中运行，核心流程可用。

## 如何运行 Web 版

在 `kitchenflow-app` 目录下：

```bash
cd kitchenflow-app
npm run web
# 或
npx expo start --web
```

浏览器打开终端提示的地址（通常 `http://localhost:8081` 或类似），即可使用 Web 版。

## Web 与原生差异

| 功能 | 原生 (iOS/Android) | Web |
|------|--------------------|-----|
| 首页 | 相机取景 + 快门拍照 | **选择照片**：点击「选择照片」或「Upload」从本地上传图片 |
| 冰箱扫描 | 拍照 / 相册 → 上传到 Supabase → AI 扫描 | 相册选择 → **仅 AI 扫描**（不上传图片到 Supabase） |
| 扫描结果 | 同左 | 同左（推荐食谱、生成购物清单、保存到库存均可用） |
| 想吃清单 / 购物清单 / 库存 / 设置 | 一致 | 一致（依赖 Supabase 的均可使用） |
| 小票扫描 | 拍照 / 相册 | 相册选择 |
| 购物 WebView / 路线 | 同左 | 同左 |

## 实现要点

- **HomeScreen**：在 `Platform.OS === 'web'` 时不渲染相机，改为「Web 端 · 上传照片扫描冰箱」+ 选择照片按钮，选图后仍走「选择存储位置 → FridgeScan」流程。
- **FridgeScanScreen**：在 Web 上选图得到的是 `blob:` URL。扫描前用 `webImageUtils.blobUrisToBase64Images` 转为 base64，再调用 `scanFridgeSnapshotFromBase64`，不再使用 `expo-file-system`。
- **scanner**：新增 `scanFridgeSnapshotFromBase64(images)`，直接接收 base64 图片调用 Gemini，供 Web 使用。
- Web 上**不执行**图片上传到 Supabase Storage（避免依赖 FileSystem），保存快照时图片 URL 为空数组，其余逻辑不变。

## 环境变量

Web 版同样需要：

- `EXPO_PUBLIC_GEMINI_API_KEY`：Gemini API Key，用于冰箱扫描 / 想吃分析等。
- Supabase 相关环境变量（若使用购物清单、库存、保存快照等）：在项目配置中已配置即可。

## 部署 Web 版

可使用 Expo 的 Web 构建与托管，或自行导出静态资源后部署到任意静态站点：

```bash
npx expo export --platform web
```

输出在 `dist/`，将其中内容部署到 Vercel、Netlify、GitHub Pages 等即可。
