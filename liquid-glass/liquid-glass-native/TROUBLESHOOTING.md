# 🔧 Liquid Glass Native - 故障排除

## 常见问题及解决方案

---

## ❌ 问题 1: "Unable to resolve @/liquid-glass-native"

### 错误信息
```
Unable to resolve "@/liquid-glass-native" from "App.tsx"
```

### 原因
Expo/Metro bundler 不会自动读取 `tsconfig.json` 的路径别名配置。

### ✅ 解决方案: 使用相对路径

在导入时使用相对路径而不是别名:

```tsx
// ❌ 错误 - 别名在 Expo 中不工作
import { GlassButton } from '@/liquid-glass-native';

// ✅ 正确 - 使用相对路径
import { GlassButton } from '../liquid-glass/liquid-glass-native';
```

### 各文件的正确导入路径

#### App.tsx
```tsx
import { ToastContainer } from '../liquid-glass/liquid-glass-native';
```

#### src/screens/*.tsx
```tsx
import { 
  GlassButton, 
  colors, 
  spacing 
} from '../../../liquid-glass/liquid-glass-native';
```

#### src/components/*.tsx
```tsx
import { GlassCard } from '../../../liquid-glass/liquid-glass-native';
```

---

## ❌ 问题 2: Toast 不显示

### 原因
没有在 App 根组件中添加 `<ToastContainer />`

### ✅ 解决方案

确保在 `App.tsx` 中添加了 ToastContainer:

```tsx
import { ToastContainer } from '../liquid-glass/liquid-glass-native';

export default function App() {
  return (
    <>
      <NavigationContainer>
        {/* 你的路由 */}
      </NavigationContainer>
      
      {/* 必须添加这个 */}
      <ToastContainer />
    </>
  );
}
```

---

## ❌ 问题 3: TypeScript 类型错误

### 错误信息
```
Property 'xxx' does not exist on type 'xxx'
```

### ✅ 解决方案

1. 确保导入了正确的类型:

```tsx
import type { GlassButtonProps } from '../../../liquid-glass/liquid-glass-native';
```

2. 重启 TypeScript 服务器:
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

## ❌ 问题 4: 样式不生效

### 原因
可能使用了自定义样式覆盖了组件默认样式

### ✅ 解决方案

检查样式优先级:

```tsx
// 组件内置样式会被自定义样式覆盖
<GlassButton 
  style={{ backgroundColor: 'red' }} // 这会覆盖默认背景色
>
  按钮
</GlassButton>

// 如果要保留玻璃效果,使用其他属性
<GlassButton 
  style={{ marginTop: 16 }} // 只修改外边距
>
  按钮
</GlassButton>
```

---

## ❌ 问题 5: 动画卡顿

### 原因
可能是性能问题或设备问题

### ✅ 解决方案

1. 检查是否在开发模式下运行 (开发模式会较慢)
2. 构建生产版本测试:
   ```bash
   expo build:ios
   # 或
   expo build:android
   ```

3. 减少同时渲染的组件数量
4. 使用 `FlatList` 的 `removeClippedSubviews` 优化

---

## ❌ 问题 6: 组件在 Android 上显示异常

### 原因
Android 使用 `elevation` 而不是 `shadow*` 属性

### ✅ 解决方案

组件已自动处理平台差异,但如果使用自定义样式,确保使用:

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
```

---

## ❌ 问题 7: Metro bundler 缓存问题

### 症状
- 修改代码后没有生效
- 导入路径报错但实际存在

### ✅ 解决方案

清除缓存并重启:

```bash
# 清除缓存
cd kitchenflow-app
rm -rf node_modules/.cache
expo start -c

# 或 Windows PowerShell
Remove-Item -Recurse -Force node_modules\.cache
expo start -c
```

---

## ❌ 问题 8: 组件导入找不到

### 错误信息
```
Module not found: Can't resolve '../../../liquid-glass/liquid-glass-native'
```

### ✅ 解决方案

1. 检查文件路径是否正确
2. 确保 `liquid-glass/liquid-glass-native` 文件夹存在
3. 检查 `index.ts` 是否正确导出组件

验证路径:
```bash
# 从 kitchenflow-app 目录
ls ../liquid-glass/liquid-glass-native/index.ts
```

---

## 🆘 仍然有问题?

### 调试步骤

1. **查看完整错误信息**
   ```bash
   expo start --dev-client
   ```

2. **验证组件库完整性**
   ```bash
   cd liquid-glass/liquid-glass-native
   ls components/
   # 应该看到: GlassButton.tsx, GlassCard.tsx 等
   ```

3. **检查 Node 版本**
   ```bash
   node --version  # 应该 >= 18
   ```

4. **重新安装依赖**
   ```bash
   cd kitchenflow-app
   rm -rf node_modules
   npm install
   ```

5. **检查 Expo 版本**
   ```bash
   expo --version
   ```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **使用相对路径导入**
   ```tsx
   import { GlassButton } from '../../../liquid-glass/liquid-glass-native';
   ```

2. **按需导入**
   ```tsx
   // ✅ 好 - 按需导入
   import { GlassButton, GlassCard } from '../../../liquid-glass/liquid-glass-native';
   
   // ❌ 避免 - 全部导入
   import * as LiquidGlass from '../../../liquid-glass/liquid-glass-native';
   ```

3. **类型导入**
   ```tsx
   import type { GlassButtonProps } from '../../../liquid-glass/liquid-glass-native';
   ```

### ❌ 避免的做法

1. ❌ 修改组件库源代码 (除非你要贡献改进)
2. ❌ 直接复制组件到项目中 (失去统一更新的好处)
3. ❌ 在组件外部覆盖核心样式变量

---

## 📞 获取帮助

如果以上方案都无法解决你的问题:

1. 检查 [完整文档](./README.md)
2. 查看 [使用示例](./EXAMPLES.md)
3. 参考 [集成指南](./INTEGRATION_GUIDE.md)

---

## 🔄 版本兼容性

| 组件库版本 | React Native | Expo | 状态 |
|----------|--------------|------|------|
| 1.0.0    | >= 0.70      | >= 50 | ✅ 支持 |

---

最后更新: 2026-01-26
