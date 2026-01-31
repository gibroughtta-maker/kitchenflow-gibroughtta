# 🎤 语音输入集成指南

> **状态**: 待实现  
> **优先级**: 中等（Phase 2 功能）  
> **平台**: iOS (Siri) + Android (Google Assistant)

---

## 📋 概述

根据产品文档，Cravings 功能应该支持**系统级语音入口**，用户无需打开 App 即可录入馋念。

**场景示例**：
> 用户在开车时说："Hey Siri, 记一下想吃冬阴功"  
> → 后台静默加入 Cravings 列表

---

## 🛠️ 技术方案

### iOS - Siri Shortcuts / App Intents

#### 1. 安装依赖
```bash
npx expo install expo-intent-launcher
```

#### 2. 配置 App Intents
在 `app.json` 中添加：
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserActivityTypes": ["AddCravingIntent"],
        "NSSiriUsageDescription": "Add dishes to your craving list"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "14.0"
          }
        }
      ]
    ]
  }
}
```

#### 3. 创建 Siri Intent 文件
在项目根目录创建 `AddCravingIntent.intentdefinition`:
```xml
<!-- Intent 配置 -->
- Intent Name: Add Craving
- Parameter: dishName (String)
- Shortcut Types: "Add {dishName} to cravings"
```

#### 4. 实现 Intent Handler
```typescript
// src/services/voiceIntentService.ts
import * as IntentLauncher from 'expo-intent-launcher';
import { addCraving } from './cravingsService';
import { getOrCreateDeviceId } from './deviceService';

export async function handleSiriIntent(dishName: string) {
  const deviceId = await getOrCreateDeviceId();
  await addCraving(deviceId, dishName, 'voice');
}

// 注册 Siri Shortcut
export async function registerSiriShortcut() {
  // iOS 实现
  // 需要原生模块支持
}
```

---

### Android - Google Assistant Actions

#### 1. 配置 App Actions
在 `app.json` 中添加：
```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "android.intent.action.VIEW",
          "category": ["android.intent.category.DEFAULT"],
          "data": {
            "scheme": "kitchenflow",
            "host": "craving"
          }
        }
      ]
    }
  }
}
```

#### 2. 创建 actions.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<actions>
  <action intentName="actions.intent.CREATE_THING">
    <fulfillment urlTemplate="kitchenflow://craving/add?dish={dishName}">
      <parameter-mapping
        intentParameter="thing.name"
        urlParameter="dishName" />
    </fulfillment>
  </action>
</actions>
```

#### 3. 处理 Deep Link
```typescript
// App.tsx
import * as Linking from 'expo-linking';

useEffect(() => {
  const handleDeepLink = async (event: { url: string }) => {
    const url = event.url;
    const { path, queryParams } = Linking.parse(url);
    
    if (path === 'craving/add' && queryParams?.dish) {
      const deviceId = await getOrCreateDeviceId();
      await addCraving(deviceId, queryParams.dish, 'voice');
      Alert.alert('Added', `"${queryParams.dish}" added to cravings`);
    }
  };

  Linking.addEventListener('url', handleDeepLink);
  return () => Linking.removeEventListener('url', handleDeepLink);
}, []);
```

---

## 📱 用户配置步骤

### iOS (Siri Shortcuts)

1. 用户打开 KitchenFlow App
2. 导航到 Settings → Voice Setup
3. 点击 "Add Siri Shortcut"
4. 录制语音指令："记一下想吃麻婆豆腐"
5. 完成配置

**使用**：
```
"Hey Siri, 记一下想吃麻婆豆腐"
→ App 自动添加到 Cravings
```

### Android (Google Assistant)

1. 用户打开 Google Assistant 设置
2. 搜索 "KitchenFlow"
3. 启用 App Actions
4. 配置触发短语

**使用**：
```
"Ok Google, add 麻婆豆腐 to KitchenFlow cravings"
→ App 自动添加到 Cravings
```

---

## 🧪 测试方案

### 模拟语音输入测试
```typescript
// 在 CravingsScreen 添加测试按钮
<TouchableOpacity onPress={async () => {
  await handleSiriIntent("Test Dish from Voice");
}}>
  <Text>🎤 Test Voice Input</Text>
</TouchableOpacity>
```

### Deep Link 测试
```bash
# iOS
xcrun simctl openurl booted "kitchenflow://craving/add?dish=Test%20Dish"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "kitchenflow://craving/add?dish=Test%20Dish"
```

---

## 📦 需要的原生模块

### iOS
- 需要创建 Swift Intent Extension
- 文件位置：`ios/IntentExtension/IntentHandler.swift`

```swift
import Intents

class IntentHandler: INExtension {
    override func handler(for intent: INIntent) -> Any {
        if intent is AddCravingIntent {
            return AddCravingIntentHandler()
        }
        return self
    }
}

class AddCravingIntentHandler: NSObject, AddCravingIntentHandling {
    func handle(intent: AddCravingIntent, completion: @escaping (AddCravingIntentResponse) -> Void) {
        let dishName = intent.dishName ?? ""
        
        // Call API to add craving
        // Use URLSession to POST to backend
        
        completion(AddCravingIntentResponse.success(dish: dishName))
    }
}
```

### Android
- 需要修改 `MainActivity.java`
- 添加 Intent Filter 处理

---

## 🚧 实现步骤

### Phase 1: Deep Link 支持（简单）
✅ 当前可实现
- [x] 配置 Deep Link scheme
- [ ] 在 App.tsx 中处理链接
- [ ] 测试手动触发

### Phase 2: Siri Shortcuts（中等）
⚠️ 需要原生开发
- [ ] 创建 Intent Extension (Swift)
- [ ] 配置 Siri Shortcut
- [ ] 测试 Siri 触发

### Phase 3: Google Assistant（中等）
⚠️ 需要 Google Cloud 配置
- [ ] 上传 actions.xml
- [ ] 配置 App Actions
- [ ] 测试 Assistant 触发

---

## 🎯 当前建议

由于语音功能需要：
1. 原生模块开发（iOS/Android）
2. App Store/Google Play 配置
3. 用户手动设置

**建议**：
- ✅ **Phase 1 完成**：Deep Link 支持（已可用）
- ⏸️ **Phase 2-3 推迟**：等待原生开发资源

**临时方案**：
用户可以使用：
1. 手动输入菜名
2. 粘贴食谱链接（已实现）
3. 使用第三方快捷指令（用户自行配置）

---

## 📚 参考资源

### iOS Siri
- [Apple SiriKit Documentation](https://developer.apple.com/documentation/sirikit)
- [Expo Custom Native Modules](https://docs.expo.dev/modules/overview/)

### Android Assistant
- [Google App Actions](https://developers.google.com/assistant/app/)
- [Android Intent Filters](https://developer.android.com/guide/components/intents-filters)

---

## 🔄 更新记录

- **2026-01-21**: 创建指南文档
- **待定**: 实现 Phase 1 (Deep Link)
- **待定**: 实现 Phase 2-3 (Native Intents)

---

**当前状态**: 📋 规划完成，待排期实现  
**优先级**: 🟡 中等（非阻塞功能）
