# 购物清单功能 - 测试指南

## 🚀 快速开始

### 步骤 1: 运行数据库迁移

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 运行 `docs/sql/shopping_list_migration.sql` 中的 SQL
5. 确认迁移成功（应该看到 "Success" 消息）

详细步骤请参考 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### 步骤 2: 启动应用

```bash
cd kitchenflow-app
npm start
```

### 步骤 3: 运行自动化测试

有两种方式运行测试：

#### 方式 A: 使用测试屏幕（推荐）

1. 在应用中导航到测试屏幕：
   - 从 HomeScreen 添加导航链接，或
   - 直接访问：`kitchenflow://dev/test-shopping`

2. 点击 "Run All Tests" 按钮
3. 查看测试结果

#### 方式 B: 在代码中调用

```typescript
import { runAllTests } from './src/utils/testShoppingList';
import { getOrCreateDefaultList } from './src/services/shoppingService';

// 在某个地方调用
const list = await getOrCreateDefaultList(deviceId);
await runAllTests(list.id);
```

## 📋 手动测试清单

### 1. 首次使用引导测试

- [ ] 打开购物清单页面
- [ ] 应该显示商店选择模态框
- [ ] 尝试不选择任何商店，继续按钮应该禁用
- [ ] 选择至少 1 个商店
- [ ] 点击继续，模态框应该消失
- [ ] 关闭并重新打开应用，模态框不应该再出现

### 2. 添加商品测试

- [ ] 使用 QuickAddBar 添加商品 "苹果"
- [ ] 商品应该出现在对应的商店分组下
- [ ] 商品应该显示商店图标
- [ ] 添加更多商品到不同商店
- [ ] 商品应该按商店正确分组

### 3. 商店分组显示测试

- [ ] 添加商品到 Sainsbury's
- [ ] 添加商品到 Asda
- [ ] 添加商品到 Morrisons
- [ ] 每个商店应该有独立的标题和图标
- [ ] 每个商店应该显示商品数量

### 4. 勾选和自动删除测试

- [ ] 勾选一个商品
- [ ] 商品应该显示为已勾选状态
- [ ] 3 秒后应该显示 "Undo" 提示栏
- [ ] 商品应该自动删除
- [ ] 点击 "Undo" 应该恢复商品
- [ ] 再次勾选，等待 3 秒，不点击 Undo，商品应该被删除

### 5. 商店偏好保存测试

- [ ] 选择多个商店
- [ ] 关闭应用
- [ ] 重新打开应用
- [ ] 商店偏好应该被保存
- [ ] 添加新商品应该使用上次使用的商店

### 6. 数据库字段测试

在 Supabase Dashboard 的 Table Editor 中检查：

- [ ] `shopping_items` 表应该有 `store_id` 列
- [ ] `shopping_items` 表应该有 `unit` 列
- [ ] `shopping_items` 表应该有 `source` 列
- [ ] `shopping_items` 表应该有 `source_craving_id` 列
- [ ] `shopping_items` 表应该有 `notes` 列
- [ ] 新添加的商品应该有正确的 `store_id` 值

## 🐛 常见问题排查

### 问题: 测试失败 - "column does not exist"

**原因**: 数据库迁移未运行或失败

**解决**:
1. 检查 Supabase Dashboard 中是否成功运行了迁移
2. 运行验证查询（见 MIGRATION_GUIDE.md）
3. 如果列不存在，重新运行迁移 SQL

### 问题: 首次使用引导不显示

**原因**: AsyncStorage 中已有旧的偏好数据

**解决**:
1. 清除应用数据（卸载重装，或清除 AsyncStorage）
2. 或手动删除：`@kitchenflow:store_preferences` key

### 问题: 商品不显示商店图标

**原因**: 商品没有 `store_id` 或 `store_id` 无效

**解决**:
1. 检查数据库中商品的 `store_id` 字段
2. 确保 `store_id` 是有效的 UKSupermarket 类型值
3. 重新添加商品

### 问题: 自动删除不工作

**原因**: 可能是定时器或状态管理问题

**解决**:
1. 检查控制台是否有错误
2. 确认 `deleteShoppingItem` 函数正常工作
3. 检查 `undoTimeoutRef` 是否正确设置

## 📊 测试结果示例

成功的测试输出应该类似：

```
🧪 Starting Shopping List Feature Tests...

✅ Schema test passed - new columns accessible
✅ Add item with store test passed
✅ Find duplicate test passed
✅ Merge items test passed
✅ Update store test passed
✅ Update quantity test passed

📊 Test Results: 6 passed, 0 failed
```

## 🔍 调试技巧

### 查看 AsyncStorage 数据

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 查看所有键
const keys = await AsyncStorage.getAllKeys();
console.log('All keys:', keys);

// 查看商店偏好
const prefs = await AsyncStorage.getItem('@kitchenflow:store_preferences');
console.log('Store preferences:', prefs);
```

### 查看数据库数据

在 Supabase Dashboard 的 Table Editor 中：
1. 选择 `shopping_items` 表
2. 查看最新添加的商品
3. 检查 `store_id`, `unit`, `source` 等字段

### 启用详细日志

在 `shoppingService.ts` 中添加：

```typescript
console.log('Adding item:', { listId, name, storeId, quantity, unit });
```

## ✅ 完成标准

所有测试通过后，你应该能够：

1. ✅ 首次使用时看到商店选择引导
2. ✅ 添加商品并自动分配到商店
3. ✅ 商品按商店分组显示
4. ✅ 勾选商品后 3 秒自动删除（带 Undo）
5. ✅ 商店偏好被正确保存和恢复
6. ✅ 所有数据库字段正常工作

## 📝 下一步

测试通过后，可以继续实施：

- Phase 4: 编辑功能（ItemEditModal）
- Phase 5: Craving 集成
- Phase 6: 在线购物 WebView

参考 [SHOPPING_LIST_IMPLEMENTATION.md](./SHOPPING_LIST_IMPLEMENTATION.md)
