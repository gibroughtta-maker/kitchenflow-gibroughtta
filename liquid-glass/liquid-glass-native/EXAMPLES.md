# Liquid Glass Native - 使用示例

## 🔐 登录表单

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import {
  GlassCard,
  GlassInput,
  GlassButton,
  Toast,
  spacing,
  typography,
} from '@/liquid-glass-native';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.error('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      // 登录逻辑
      await loginAPI(email, password);
      Toast.success('登录成功！');
    } catch (error) {
      Toast.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      <GlassCard style={{ padding: spacing.l }}>
        <Text style={[typography.h2, { marginBottom: spacing.l }]}>
          欢迎回来
        </Text>

        <GlassInput
          label="邮箱"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <GlassInput
          label="密码"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          containerStyle={{ marginTop: spacing.m }}
        />

        <GlassButton
          onPress={handleLogin}
          loading={loading}
          disabled={!email || !password}
          style={{ marginTop: spacing.l }}
        >
          登录
        </GlassButton>

        <GlassButton
          variant="ghost"
          onPress={() => {}}
          style={{ marginTop: spacing.s }}
        >
          忘记密码？
        </GlassButton>
      </GlassCard>
    </View>
  );
}
```

---

## 🗂️ 食材卡片列表

```tsx
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  spacing,
  colors,
} from '@/liquid-glass-native';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  freshness: 'fresh' | 'warning' | 'expired';
}

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'fresh':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'expired':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Ingredient }) => (
    <GlassCard
      hoverable
      onPress={() => console.log('查看', item.name)}
      style={{ marginBottom: spacing.m }}
    >
      <GlassCardHeader>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <GlassCardTitle>{item.name}</GlassCardTitle>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: getFreshnessColor(item.freshness),
            }}
          />
        </View>
        <GlassCardDescription>{item.quantity}</GlassCardDescription>
      </GlassCardHeader>
    </GlassCard>
  );

  return (
    <FlatList
      data={ingredients}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.m }}
    />
  );
}
```

---

## 🛒 购物清单

```tsx
import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import {
  GlassCard,
  GlassCardContent,
  GlassInput,
  GlassButton,
  Toast,
  spacing,
} from '@/liquid-glass-native';

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;

    setItems([
      ...items,
      { id: Date.now().toString(), name: newItem, checked: false },
    ]);
    setNewItem('');
    Toast.success('已添加');
  };

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <View style={{ flex: 1, padding: spacing.m }}>
      {/* 添加新项目 */}
      <GlassCard style={{ padding: spacing.m, marginBottom: spacing.m }}>
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <View style={{ flex: 1 }}>
            <GlassInput
              placeholder="添加购物项..."
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
            />
          </View>
          <GlassButton onPress={addItem}>添加</GlassButton>
        </View>
      </GlassCard>

      {/* 购物清单 */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard
            hoverable
            onPress={() => toggleItem(item.id)}
            style={{
              marginBottom: spacing.s,
              opacity: item.checked ? 0.6 : 1,
            }}
          >
            <GlassCardContent>
              <Text
                style={{
                  textDecorationLine: item.checked ? 'line-through' : 'none',
                }}
              >
                {item.name}
              </Text>
            </GlassCardContent>
          </GlassCard>
        )}
      />
    </View>
  );
}
```

---

## 💬 确认对话框

```tsx
import React, { useState } from 'react';
import { Text } from 'react-native';
import { GlassButton, GlassDialog, Toast, spacing } from '@/liquid-glass-native';

export function DeleteConfirmation() {
  const [visible, setVisible] = useState(false);

  const handleDelete = () => {
    // 执行删除
    Toast.success('已删除');
    setVisible(false);
  };

  return (
    <>
      <GlassButton variant="outline" onPress={() => setVisible(true)}>
        删除项目
      </GlassButton>

      <GlassDialog
        visible={visible}
        onClose={() => setVisible(false)}
        title="确认删除"
        footer={
          <>
            <GlassButton
              variant="ghost"
              onPress={() => setVisible(false)}
            >
              取消
            </GlassButton>
            <GlassButton onPress={handleDelete}>确认</GlassButton>
          </>
        }
      >
        <Text>确定要删除这个项目吗？此操作无法撤销。</Text>
      </GlassDialog>
    </>
  );
}
```

---

## 🎨 设置页面

```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  spacing,
  typography,
  colors,
} from '@/liquid-glass-native';

export function SettingsScreen() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.m }}>
      {/* 账户设置 */}
      <GlassCard style={{ marginBottom: spacing.m }}>
        <GlassCardHeader>
          <GlassCardTitle>账户设置</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <SettingItem title="个人资料" onPress={() => {}} />
          <SettingItem title="修改密码" onPress={() => {}} />
          <SettingItem title="邮箱绑定" onPress={() => {}} />
        </GlassCardContent>
      </GlassCard>

      {/* 通知设置 */}
      <GlassCard style={{ marginBottom: spacing.m }}>
        <GlassCardHeader>
          <GlassCardTitle>通知设置</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <SettingItem title="推送通知" onPress={() => {}} />
          <SettingItem title="邮件通知" onPress={() => {}} />
        </GlassCardContent>
      </GlassCard>

      {/* 关于 */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>关于</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            版本 1.0.0
          </Text>
        </GlassCardContent>
      </GlassCard>

      {/* 退出登录 */}
      <GlassButton
        variant="outline"
        onPress={() => {}}
        style={{ marginTop: spacing.xl }}
      >
        退出登录
      </GlassButton>
    </ScrollView>
  );
}

function SettingItem({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <GlassButton
      variant="ghost"
      onPress={onPress}
      style={{
        justifyContent: 'flex-start',
        marginBottom: spacing.xs,
      }}
    >
      {title}
    </GlassButton>
  );
}
```

---

## 🍳 食谱详情

```tsx
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassButton,
  spacing,
  typography,
  colors,
} from '@/liquid-glass-native';

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  cookTime: string;
  difficulty: string;
}

export function RecipeDetailScreen({ recipe }: { recipe: Recipe }) {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.m }}>
      {/* 标题卡片 */}
      <GlassCard style={{ marginBottom: spacing.m }}>
        <GlassCardHeader>
          <GlassCardTitle>{recipe.title}</GlassCardTitle>
          <GlassCardDescription>{recipe.description}</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <View style={{ flexDirection: 'row', gap: spacing.m }}>
            <InfoChip label="烹饪时间" value={recipe.cookTime} />
            <InfoChip label="难度" value={recipe.difficulty} />
          </View>
        </GlassCardContent>
      </GlassCard>

      {/* 食材清单 */}
      <GlassCard style={{ marginBottom: spacing.m }}>
        <GlassCardHeader>
          <GlassCardTitle>所需食材</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={[typography.body, { marginBottom: spacing.xs }]}>
              • {ingredient}
            </Text>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* 步骤 */}
      <GlassCard style={{ marginBottom: spacing.m }}>
        <GlassCardHeader>
          <GlassCardTitle>制作步骤</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {recipe.steps.map((step, index) => (
            <View key={index} style={{ marginBottom: spacing.m }}>
              <Text style={[typography.h4, { color: colors.primary }]}>
                步骤 {index + 1}
              </Text>
              <Text style={[typography.body, { marginTop: spacing.xs }]}>
                {step}
              </Text>
            </View>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* 操作按钮 */}
      <GlassButton onPress={() => {}}>开始烹饪</GlassButton>
    </ScrollView>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[typography.bodySmall, { marginTop: spacing.xs }]}>
        {value}
      </Text>
    </View>
  );
}
```

---

## 🎯 完整 App 示例

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ToastContainer } from '@/liquid-glass-native';

// 导入你的屏幕
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Toast 容器 - 必须添加 */}
      <ToastContainer />
    </>
  );
}
```
