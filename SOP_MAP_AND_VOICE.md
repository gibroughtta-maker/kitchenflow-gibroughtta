# KitchenFlow Standard Operating Procedures (SOP)

## 🗺️ Map Integration SOP (地图功能流程)

**现状**: 目前依托 `react-native-maps` 和硬编码的超市坐标实现了基础导航。
**目标**: 维护现有地图功能或升级为动态 Google Places API。

### 1. 核心文件位置
*   **UI 组件**: `src/screens/ShoppingRouteScreen.tsx` (地图显示、路径规划)
*   **数据逻辑**: `src/services/storeLocationService.ts` (坐标数据、距离计算)
*   **导航逻辑**: `src/services/routeService.ts` (生成 Apple/Google Maps 跳转链接)

### 2. 标准开发流程 (Workflow)

#### 场景 A: 添加新的超市支持
1.  **修改数据源**: 打开 `src/services/storeLocationService.ts`.
2.  **更新类型**: 确保 `UKSupermarket` 类型 (在 `types/supabase.ts`) 包含新超市 ID。
3.  **添加坐标**: 在 `STORE_LOCATIONS` 对象中添加新超市的经纬度列表。
    ```typescript
    new_market: [
      { name: "New Market London", address: "...", coordinates: { latitude: 51.5, longitude: -0.1 } },
      // ...
    ]
    ```

#### 场景 B: 升级为 Google Places API (动态搜索)
1.  **申请 API Key**: 在 Google Cloud Console 启用 **Places API (New)**。
2.  **替换逻辑**: 修改 `findNearestStore` 函数。
    *   **移除**: `STORE_LOCATIONS` 硬编码查找。
    *   **新增**: `fetch` 请求 Google Places API `/v1/places:searchNearby`。
3.  **配置 Env**: 将 `EXPO_PUBLIC_GOOGLE_PLACES_KEY` 添加到 `.env`。

#### 场景 C: 调试地图不显示
1.  检查 `app.json` 或 `app.config.js` 中是否配置了 Google Maps API Key (Android 必需)。
2.  iOS 模拟器默认使用 Apple Maps，检查 Scheme 调用是否正确。

---

## 🗣️ Voice Function Implementation SOP (语音功能落地流程)

**现状**: 拥有顶级 AI 大脑 (Gemini NLU)，缺失听觉器官 (ASR/STT)。
**目标**: 补全“录音转文字”模块，闭环语音交互。

### 1. 核心架构设计 (The Missing Piece)
*   **输入 (Missing)**: 用户按住按钮 -> 录音 -> 生成音频文件。
*   **转录 (Missing)**: 音频文件 -> STT API (如 OpenAI Whisper / Google Speech-to-Text) -> 文本。
*   **理解 (Ready)**: 文本 -> `scannerService.ts` (`parseVoiceCommand`) -> 意图 (JSON)。
*   **执行 (Ready)**: 意图 -> 添加 Cravings / 删除物品。

### 2. 标准实施步骤 (Implementation Steps)

#### 阶段 I: 引入听觉 (Audio Recording)
1.  **安装库**: `npx expo install expo-av`
2.  **创建组件**: 新建 `src/components/VoiceInput.tsx`。
3.  **实现录音**:
    *   使用 `Audio.Recording` API。
    *   配置录音质量 (建议 `AndroidOutputFormat.MPEG_4` / `IOSOutputFormat.MPEG4AAC`)。

#### 阶段 II: 声音转文字 (Speech-to-Text)
由于 React Native 本地 STT 效果一般，建议使用 API：
1.  **选择服务**:
    *   **方案 A (推荐)**: Reuse `Gemini 1.5 Pro` (它原生支持音频输入！)。
    *   **方案 B**: OpenAI Whisper API。
2.  **连接 Gemini (方案 A 流程)**:
    *   将音频文件转为 `base64`.
    *   直接调用 `callGemini`，传入音频数据 (MimeType: `audio/mp3` 等)。
    *   **Prompt**: "Listen to this audio and extract the user's intent..." (复用 `parseVoiceCommand` 的逻辑，直接省去 STT 这一步！)。

#### 阶段 III: 整合 (Integration)
1.  在 `HomeScreen` 或 `CravingsScreen` 添加 `VoiceInput` 悬浮按钮。
2.  录音结束 -> 调用 Gemini Audio 接口 -> 获取 JSON -> 更新 UI。

### 3. Gemini Audio Mode 代码示例 (伪代码)

```typescript
// src/services/scannerService.ts
export const processVoiceCommandAudio = async (base64Audio: string) => {
    // Gemini 原生支持听音频，不需要单独的 Whisper STT！
    return await callGemini({
        prompt: `Listen to this command. ${VOICE_PARSE_PROMPT}`,
        inlineData: {
            mimeType: 'audio/mp4',
            data: base64Audio
        },
        responseSchema: VOICE_PARSE_SCHEMA
    });
}
```

> **First Principles Insight**: 既然 Gemini 是多模态模型 (Multimodal)，它天生就能"听"懂音频。**不要**因为惯性思维去加一个中间商 (Whisper STT)。直接把音频扔给 Gemini，既省钱又快，还能理解语气！
