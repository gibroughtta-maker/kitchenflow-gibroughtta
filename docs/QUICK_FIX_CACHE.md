# 快速修复缓存问题

## ⚡ 立即尝试（2 分钟）

在终端中运行：

```powershell
cd kitchenflow-app
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npx expo start --clear
```

如果还是不行，尝试：

```powershell
cd kitchenflow-app
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --clear
```

## ✅ 如果快速修复无效

可以继续实施其他功能，稍后回来解决。这个错误通常是缓存问题，不影响代码逻辑。

## 📝 继续实施的建议

1. **继续 Phase 4-6**：编辑功能、Craving 集成、WebView
2. **稍后回来解决**：当所有功能都实施完成后，再统一处理缓存问题
3. **或者**：完全重置项目（删除 node_modules，重新安装）
