# KitchenFlow MVP Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core "scan fridge → identify ingredients → recommend recipes" loop with iOS glassmorphism UI.

**Architecture:** React Native mobile app with camera integration, connecting to AI vision API (Gemini) for ingredient recognition. Local state management for scanned inventory.

**Tech Stack:** React Native, Expo, TypeScript, Gemini Vision API, React Navigation

---

## Overview

This plan implements **Phase 1: 核心闭环 (The "Brain")** from the product spec:
- Home screen with camera viewfinder + floating action button
- AI-powered ingredient scanning
- Scan results display with freshness indicators
- Basic recipe recommendations

---

## Task 1: Project Setup

**Files:**
- Create: `kitchenflow-app/` (Expo project root)
- Create: `kitchenflow-app/src/`
- Create: `kitchenflow-app/src/styles/`

**Step 1: Initialize Expo project**

Run:
```bash
cd c:\Users\gibro\Documents\家用kitchen
npx create-expo-app@latest kitchenflow-app --template blank-typescript
```
Expected: New Expo project created

**Step 2: Install dependencies**

Run:
```bash
cd kitchenflow-app
npx expo install expo-camera expo-image-picker @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install @google/generative-ai
```
Expected: All dependencies installed successfully

**Step 3: Verify project runs**

Run:
```bash
npx expo start
```
Expected: Expo dev server starts, QR code displayed

**Step 4: Commit**

```bash
git add .
git commit -m "chore: initialize KitchenFlow Expo project with dependencies"
```

---

## Task 2: Glassmorphism Theme System

**Files:**
- Create: `kitchenflow-app/src/styles/theme.ts`
- Create: `kitchenflow-app/src/styles/glassmorphism.ts`

**Step 1: Create theme constants**

Create `kitchenflow-app/src/styles/theme.ts`:

```typescript
export const colors = {
  // Primary
  primary: '#007AFF',
  
  // Freshness indicators
  freshGreen: '#34C759',
  warningYellow: '#FFCC00',
  urgentRed: '#FF3B30',
  neutralGray: '#8E8E93',
  
  // Backgrounds
  background: '#F2F2F7',
  white: '#FFFFFF',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#6C6C70',
  
  // Glass effect
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassShadow: 'rgba(0, 0, 0, 0.1)',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export const borderRadius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 9999,
};
```

**Step 2: Create glassmorphism styles**

Create `kitchenflow-app/src/styles/glassmorphism.ts`:

```typescript
import { StyleSheet, Platform } from 'react-native';
import { colors, borderRadius } from './theme';

export const glassStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.l,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.glassShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  navBar: {
    backgroundColor: colors.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  
  floatingButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
```

**Step 3: Commit**

```bash
git add src/styles/
git commit -m "feat: add glassmorphism theme system"
```

---

## Task 3: Home Screen with Camera

**Files:**
- Create: `kitchenflow-app/src/screens/HomeScreen.tsx`
- Create: `kitchenflow-app/src/components/FloatingActionButton.tsx`
- Create: `kitchenflow-app/src/components/QuickAccessBar.tsx`
- Modify: `kitchenflow-app/App.tsx`

**Step 1: Create FloatingActionButton component**

Create `kitchenflow-app/src/components/FloatingActionButton.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { glassStyles } from '../styles/glassmorphism';
import { colors } from '../styles/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={[glassStyles.floatingButton, styles.button]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.innerCircle} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 4,
    borderColor: colors.white,
  },
  innerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.neutralGray,
  },
});
```

**Step 2: Create QuickAccessBar component**

Create `kitchenflow-app/src/components/QuickAccessBar.tsx`:

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { glassStyles } from '../styles/glassmorphism';
import { colors, spacing, typography } from '../styles/theme';

interface QuickAccessBarProps {
  onCravingsPress: () => void;
  onShoppingPress: () => void;
  onSettingsPress: () => void;
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  onCravingsPress,
  onShoppingPress,
  onSettingsPress,
}) => {
  return (
    <View style={[glassStyles.container, styles.container]}>
      <TouchableOpacity style={styles.item} onPress={onCravingsPress}>
        <Text style={styles.icon}>🍜</Text>
        <Text style={styles.label}>馋念</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.item} onPress={onShoppingPress}>
        <Text style={styles.icon}>🛒</Text>
        <Text style={styles.label}>购物单</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.item} onPress={onSettingsPress}>
        <Text style={styles.icon}>⚙️</Text>
        <Text style={styles.label}>设置</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    marginHorizontal: spacing.m,
  },
  item: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
```

**Step 3: Create HomeScreen**

Create `kitchenflow-app/src/screens/HomeScreen.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { QuickAccessBar } from '../components/QuickAccessBar';
import { colors, spacing, typography } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        if (photo) {
          navigation.navigate('ScanResults', { photo });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限来扫描冰箱</Text>
        <FloatingActionButton onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Header */}
        <View style={[glassStyles.navBar, styles.header]}>
          <Text style={styles.logo}>KitchenFlow</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <QuickAccessBar
            onCravingsPress={() => navigation.navigate('Cravings')}
            onShoppingPress={() => navigation.navigate('ShoppingList')}
            onSettingsPress={() => navigation.navigate('Settings')}
          />
          
          <View style={styles.shutterContainer}>
            <FloatingActionButton
              onPress={handleCapture}
              onLongPress={() => Alert.alert('录像模式', '长按录像功能即将推出')}
            />
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.m,
    alignItems: 'center',
  },
  logo: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxl,
  },
  shutterContainer: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },
});
```

**Step 4: Update App.tsx with navigation**

Replace content of `kitchenflow-app/App.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Step 5: Test on device**

Run:
```bash
npx expo start
```
Expected: 
- App opens with camera viewfinder
- Bottom bar shows 馋念/购物单/设置 icons
- Shutter button is visible at bottom center

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add HomeScreen with camera and glassmorphism UI"
```

---

## Task 4: AI Ingredient Recognition Service

**Files:**
- Create: `kitchenflow-app/src/services/geminiService.ts`
- Create: `kitchenflow-app/src/types/ingredient.ts`
- Create: `kitchenflow-app/.env`

**Step 1: Create ingredient types**

Create `kitchenflow-app/src/types/ingredient.ts`:

```typescript
export type FreshnessLevel = 'fresh' | 'warning' | 'urgent' | 'neutral';

export interface Ingredient {
  id: string;
  name: string;
  nameChinese: string;
  quantity?: string;
  freshness: FreshnessLevel;
  daysLeft?: number;
  freshnessNote: string;
  category: 'fresh' | 'pantry' | 'other';
}

export interface ScanResult {
  imageUri: string;
  ingredients: Ingredient[];
  scannedAt: Date;
}
```

**Step 2: Create Gemini service**

Create `kitchenflow-app/src/services/geminiService.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ingredient, FreshnessLevel } from '../types/ingredient';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

const SCAN_PROMPT = `You are a smart kitchen assistant analyzing a refrigerator photo.

Identify all visible food items and assess their freshness based on visual appearance.

Return a JSON array of objects with this exact structure:
{
  "ingredients": [
    {
      "id": "unique_id",
      "name": "English name",
      "nameChinese": "中文名称",
      "quantity": "estimated quantity (e.g., '6 eggs', '500ml')",
      "freshness": "fresh" | "warning" | "urgent" | "neutral",
      "daysLeft": number or null,
      "freshnessNote": "状态描述 in Chinese",
      "category": "fresh" | "pantry" | "other"
    }
  ]
}

Freshness rules:
- "fresh" (green): Looks new, no visible issues
- "warning" (yellow): Getting old, use soon
- "urgent" (red): Wilting, spots, should use immediately
- "neutral" (gray): Pantry item or no freshness concern

Only return valid JSON, no markdown or explanation.`;

export async function scanIngredients(base64Image: string): Promise<Ingredient[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      SCAN_PROMPT,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.ingredients || [];
  } catch (error) {
    console.error('Gemini scan error:', error);
    throw error;
  }
}
```

**Step 3: Create .env file**

Create `kitchenflow-app/.env`:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Gemini AI ingredient recognition service"
```

---

## Task 5: Scan Results Screen

**Files:**
- Create: `kitchenflow-app/src/screens/ScanResultsScreen.tsx`
- Create: `kitchenflow-app/src/components/IngredientCard.tsx`
- Modify: `kitchenflow-app/App.tsx`

**Step 1: Create IngredientCard component**

Create `kitchenflow-app/src/components/IngredientCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ingredient, FreshnessLevel } from '../types/ingredient';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress?: () => void;
  onDelete?: () => void;
}

const freshnessColors: Record<FreshnessLevel, string> = {
  fresh: colors.freshGreen,
  warning: colors.warningYellow,
  urgent: colors.urgentRed,
  neutral: colors.neutralGray,
};

const freshnessEmoji: Record<FreshnessLevel, string> = {
  fresh: '🟢',
  warning: '🟡',
  urgent: '🔴',
  neutral: '⚪',
};

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onPress,
  onDelete,
}) => {
  return (
    <TouchableOpacity
      style={[glassStyles.container, styles.container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Text style={styles.emoji}>{freshnessEmoji[ingredient.freshness]}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.name}>
            {ingredient.nameChinese}
            {ingredient.quantity && ` ${ingredient.quantity}`}
          </Text>
          <Text style={[styles.note, { color: freshnessColors[ingredient.freshness] }]}>
            {ingredient.freshnessNote}
          </Text>
        </View>
      </View>
      
      <View 
        style={[
          styles.freshnessBar, 
          { backgroundColor: freshnessColors[ingredient.freshness] }
        ]} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    marginHorizontal: spacing.m,
    marginVertical: spacing.xs,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
  },
  note: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  freshnessBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginLeft: spacing.m,
  },
});
```

**Step 2: Create ScanResultsScreen**

Create `kitchenflow-app/src/screens/ScanResultsScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { IngredientCard } from '../components/IngredientCard';
import { scanIngredients } from '../services/geminiService';
import { Ingredient } from '../types/ingredient';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface ScanResultsScreenProps {
  navigation: any;
  route: {
    params: {
      photo: {
        uri: string;
        base64?: string;
      };
    };
  };
}

export const ScanResultsScreen: React.FC<ScanResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const { photo } = route.params;
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzePhoto();
  }, []);

  const analyzePhoto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!photo.base64) {
        throw new Error('No image data');
      }
      
      const results = await scanIngredients(photo.base64);
      setIngredients(results);
    } catch (err) {
      setError('扫描失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const freshIngredients = ingredients.filter(i => i.category === 'fresh');
  const otherIngredients = ingredients.filter(i => i.category !== 'fresh');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[glassStyles.navBar, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>扫描结果</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>编辑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Photo Preview */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photo} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>AI 正在识别食材...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={analyzePhoto}>
              <Text style={styles.retryButton}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Fresh Ingredients Section */}
            {freshIngredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🥬 生鲜食材 ({freshIngredients.length})
                </Text>
                {freshIngredients.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id}
                    ingredient={ingredient}
                    onPress={() => Alert.alert(ingredient.nameChinese, ingredient.freshnessNote)}
                  />
                ))}
              </View>
            )}

            {/* Other Ingredients Section */}
            {otherIngredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🥫 其他 ({otherIngredients.length})
                </Text>
                {otherIngredients.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id}
                    ingredient={ingredient}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {!loading && !error && (
        <View style={[glassStyles.container, styles.bottomBar]}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>🍳 推荐菜谱</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
            <Text style={[styles.actionText, styles.primaryText]}>🛒 生成购物单</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  backButton: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  editButton: {
    ...typography.body,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    margin: spacing.m,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.m,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.urgentRed,
  },
  retryButton: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.m,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.m,
    marginHorizontal: spacing.m,
    marginBottom: spacing.l,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.m,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.m,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  primaryText: {
    color: colors.white,
  },
});
```

**Step 3: Update App.tsx navigation**

Add ScanResults screen to `kitchenflow-app/App.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanResultsScreen } from './src/screens/ScanResultsScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Step 4: Test scan flow**

Run:
```bash
npx expo start
```
Expected:
- Tap shutter button to take photo
- Navigate to ScanResults screen
- AI analyzes photo and shows ingredients
- Ingredients display with freshness indicators

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add ScanResultsScreen with AI ingredient recognition"
```

---

## Verification Plan

### Automated Tests

For MVP Phase 1, we will verify manually on device as React Native integration tests require device/simulator setup.

### Manual Verification

1. **Camera Permissions**
   - Open app fresh install → Should request camera permission
   - Grant permission → Camera viewfinder appears
   
2. **Home Screen UI**
   - Camera takes up most of screen
   - Bottom bar shows 3 icons: 馋念, 购物单, 设置
   - Shutter button is white, circular, centered
   - All elements have glassmorphism effect

3. **Photo Capture Flow**
   - Point camera at fridge
   - Tap shutter → Photo captured
   - Navigate to Scan Results screen
   - Photo thumbnail visible at top

4. **AI Recognition**
   - Loading indicator shows "AI 正在识别食材..."
   - After loading: ingredient list appears
   - Each item shows: emoji, Chinese name, freshness note
   - Colors match freshness: green/yellow/red/gray

5. **Freshness Display**
   - Fresh items (green): "新鲜 | X天内"
   - Warning items (yellow): "建议今天用" or "建议尽快食用"
   - Urgent items (red): "已不新鲜" or "优先消耗"

---

## Summary

This plan covers MVP Phase 1 & 2 with 8 tasks:

### Phase 1: 核心闭环 (The "Brain")
1. Project Setup ✅
2. Theme System ✅
3. Home Screen ✅
4. AI Service ✅
5. Scan Results ✅

### Phase 2: 数据连接 (The "Memory")
6. Supabase Integration (见下文)
7. Cravings Screen (见下文)
8. Shopping List Screen (见下文)

After completing these tasks, the full MVP loop will be functional.

---

## Task 6: Supabase Integration

> ⚠️ **前置条件**: 后端开发者需先完成 Supabase 项目创建并提供 credentials

**Files:**
- Create: `kitchenflow-app/src/services/supabaseClient.ts`
- Create: `kitchenflow-app/src/services/deviceService.ts`
- Create: `kitchenflow-app/src/hooks/useDevice.ts`
- Modify: `kitchenflow-app/.env`

**Step 1: Install Supabase SDK**

Run:
```bash
cd kitchenflow-app
npm install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
```

**Step 2: Create Supabase client**

Create `kitchenflow-app/src/services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 3: Create device service**

Create `kitchenflow-app/src/services/deviceService.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const DEVICE_ID_KEY = 'kitchenflow_device_id';

export async function getOrCreateDeviceId(): Promise<string> {
  // Check local storage first
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  
  if (deviceId) {
    // Update last_seen
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', deviceId);
    return deviceId;
  }
  
  // Create new device
  const { data, error } = await supabase
    .from('devices')
    .insert({})
    .select('id')
    .single();
  
  if (error) throw error;
  
  deviceId = data.id;
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  
  return deviceId;
}

export async function setDeviceNickname(deviceId: string, nickname: string): Promise<void> {
  await supabase
    .from('devices')
    .update({ nickname })
    .eq('id', deviceId);
}
```

**Step 4: Create useDevice hook**

Create `kitchenflow-app/src/hooks/useDevice.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getOrCreateDeviceId } from '../services/deviceService';

export function useDevice() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initDevice() {
      try {
        const id = await getOrCreateDeviceId();
        setDeviceId(id);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    initDevice();
  }, []);

  return { deviceId, loading, error };
}
```

**Step 5: Update .env**

Add to `kitchenflow-app/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Supabase integration with device management"
```

---

## Task 7: Cravings Screen (馋念清单)

**Files:**
- Create: `kitchenflow-app/src/screens/CravingsScreen.tsx`
- Create: `kitchenflow-app/src/components/CravingCard.tsx`
- Create: `kitchenflow-app/src/services/cravingsService.ts`
- Modify: `kitchenflow-app/App.tsx`

**Step 1: Create cravings service**

Create `kitchenflow-app/src/services/cravingsService.ts`:

```typescript
import { supabase } from './supabaseClient';

export interface Craving {
  id: string;
  device_id: string;
  name: string;
  image_url?: string;
  source: 'voice' | 'share' | 'manual';
  note?: string;
  created_at: string;
}

export async function getCravings(deviceId: string): Promise<Craving[]> {
  const { data, error } = await supabase
    .from('cravings')
    .select('*')
    .eq('device_id', deviceId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addCraving(
  deviceId: string, 
  name: string, 
  source: 'voice' | 'share' | 'manual',
  note?: string
): Promise<Craving> {
  const { data, error } = await supabase
    .from('cravings')
    .insert({ device_id: deviceId, name, source, note })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCraving(id: string): Promise<void> {
  await supabase
    .from('cravings')
    .update({ is_archived: true })
    .eq('id', id);
}
```

**Step 2: Create CravingCard component**

Create `kitchenflow-app/src/components/CravingCard.tsx`:

```typescript
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Craving } from '../services/cravingsService';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.m * 3) / 2;

interface CravingCardProps {
  craving: Craving;
  onPress?: () => void;
}

const sourceEmoji = {
  voice: '🎤',
  share: '📱',
  manual: '✍️',
};

export const CravingCard: React.FC<CravingCardProps> = ({ craving, onPress }) => {
  return (
    <TouchableOpacity 
      style={[glassStyles.container, styles.card]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {craving.image_url ? (
        <Image source={{ uri: craving.image_url }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.name}>{craving.name}</Text>
        <Text style={styles.source}>{sourceEmoji[craving.source]}</Text>
      </View>
      {craving.note && (
        <View style={styles.noteBubble}>
          <Text style={styles.noteText}>💬 {craving.note}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholderText: {
    fontSize: 48,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  name: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  source: {
    fontSize: 16,
  },
  noteBubble: {
    position: 'absolute',
    top: spacing.s,
    left: spacing.s,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.s,
  },
  noteText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
});
```

**Step 3: Create CravingsScreen**

Create `kitchenflow-app/src/screens/CravingsScreen.tsx`:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { CravingCard } from '../components/CravingCard';
import { getCravings, addCraving, deleteCraving, Craving } from '../services/cravingsService';
import { useDevice } from '../hooks/useDevice';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

export const CravingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { deviceId } = useDevice();
  const [cravings, setCravings] = useState<Craving[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newCraving, setNewCraving] = useState('');

  const loadCravings = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await getCravings(deviceId);
      setCravings(data);
    } catch (error) {
      Alert.alert('错误', '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadCravings();
  }, [loadCravings]);

  const handleAddCraving = async () => {
    if (!newCraving.trim() || !deviceId) return;
    try {
      await addCraving(deviceId, newCraving.trim(), 'manual');
      setNewCraving('');
      loadCravings();
    } catch (error) {
      Alert.alert('错误', '添加失败');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[glassStyles.navBar, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>我的馋念 🍜</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={cravings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadCravings();
          }} />
        }
        renderItem={({ item }) => (
          <CravingCard
            craving={item}
            onPress={() => Alert.alert(item.name, item.note || '没有备注')}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>还没有馋念，快添加一个吧！</Text>
        }
      />

      <View style={[glassStyles.container, styles.inputBar]}>
        <TextInput
          style={styles.input}
          placeholder="想吃什么..."
          value={newCraving}
          onChangeText={setNewCraving}
          onSubmitEditing={handleAddCraving}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCraving}>
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  backButton: { ...typography.body, color: colors.primary },
  title: { ...typography.h3, color: colors.textPrimary },
  list: { padding: spacing.m },
  row: { justifyContent: 'space-between' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  inputBar: {
    flexDirection: 'row',
    margin: spacing.m,
    padding: spacing.s,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingHorizontal: spacing.m,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.m,
  },
  addButtonText: { ...typography.body, color: colors.white },
});
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Cravings screen with Supabase integration"
```

---

## Task 8: Shopping List Screen (购物清单)

**Files:**
- Create: `kitchenflow-app/src/screens/ShoppingListScreen.tsx`
- Create: `kitchenflow-app/src/components/ShoppingItemCard.tsx`
- Create: `kitchenflow-app/src/services/shoppingService.ts`
- Create: `kitchenflow-app/src/hooks/useRealtimeList.ts`
- Modify: `kitchenflow-app/App.tsx`

**Step 1: Create shopping service**

Create `kitchenflow-app/src/services/shoppingService.ts`:

```typescript
import { supabase } from './supabaseClient';
import { nanoid } from 'nanoid';

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string;
  category: 'fresh' | 'pantry' | 'other';
  reason?: string;
  checked: boolean;
  checked_by?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  share_token?: string;
}

export async function getOrCreateDefaultList(deviceId: string): Promise<ShoppingList> {
  // Check for existing list
  const { data: existing } = await supabase
    .from('shopping_list_members')
    .select('list_id, shopping_lists(*)')
    .eq('device_id', deviceId)
    .limit(1)
    .single();

  if (existing?.shopping_lists) {
    return existing.shopping_lists as ShoppingList;
  }

  // Create new list
  const { data: list } = await supabase
    .from('shopping_lists')
    .insert({ owner_device_id: deviceId, name: '我的购物单' })
    .select()
    .single();

  // Add self as member
  await supabase.from('shopping_list_members').insert({
    list_id: list.id,
    device_id: deviceId,
  });

  return list;
}

export async function getShoppingItems(listId: string): Promise<ShoppingItem[]> {
  const { data } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order');
  return data || [];
}

export async function addShoppingItem(listId: string, name: string, category: string = 'other'): Promise<ShoppingItem> {
  const { data } = await supabase
    .from('shopping_items')
    .insert({ list_id: listId, name, category })
    .select()
    .single();
  return data;
}

export async function toggleItemChecked(itemId: string, checked: boolean, deviceId: string): Promise<void> {
  await supabase
    .from('shopping_items')
    .update({ 
      checked, 
      checked_by: checked ? deviceId : null,
      checked_at: checked ? new Date().toISOString() : null 
    })
    .eq('id', itemId);
}

export async function createShareLink(listId: string): Promise<string> {
  const shareToken = nanoid(10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await supabase
    .from('shopping_lists')
    .update({ share_token: shareToken, expires_at: expiresAt })
    .eq('id', listId);

  return `kitchenflow://join/${shareToken}`;
}
```

**Step 2: Create realtime hook**

Create `kitchenflow-app/src/hooks/useRealtimeList.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShoppingItem, getShoppingItems } from '../services/shoppingService';

export function useRealtimeList(listId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    const data = await getShoppingItems(listId);
    setItems(data);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    loadItems();

    if (!listId) return;

    const channel = supabase
      .channel(`list:${listId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `list_id=eq.${listId}`,
      }, () => {
        loadItems(); // Reload on any change
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [listId, loadItems]);

  return { items, loading, refresh: loadItems };
}
```

**Step 3: Create ShoppingItemCard**

Create `kitchenflow-app/src/components/ShoppingItemCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingItem } from '../services/shoppingService';
import { colors, spacing, typography } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface Props {
  item: ShoppingItem;
  onToggle: () => void;
}

export const ShoppingItemCard: React.FC<Props> = ({ item, onToggle }) => {
  return (
    <TouchableOpacity
      style={[glassStyles.container, styles.container, item.checked && styles.checked]}
      onPress={onToggle}
    >
      <Text style={styles.checkbox}>{item.checked ? '☑' : '☐'}</Text>
      <View style={styles.content}>
        <Text style={[styles.name, item.checked && styles.strikethrough]}>
          {item.name} {item.quantity}
        </Text>
        {item.reason && (
          <Text style={styles.reason}>📍 {item.reason}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.m,
  },
  checked: { opacity: 0.6 },
  checkbox: { fontSize: 24, marginRight: spacing.m },
  content: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary },
  strikethrough: { textDecorationLine: 'line-through', color: colors.textSecondary },
  reason: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
```

**Step 4: Create ShoppingListScreen**

Create `kitchenflow-app/src/screens/ShoppingListScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Share,
} from 'react-native';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { useDevice } from '../hooks/useDevice';
import { useRealtimeList } from '../hooks/useRealtimeList';
import {
  getOrCreateDefaultList, addShoppingItem, toggleItemChecked, createShareLink, ShoppingList,
} from '../services/shoppingService';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

export const ShoppingListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { deviceId } = useDevice();
  const [list, setList] = useState<ShoppingList | null>(null);
  const { items, loading, refresh } = useRealtimeList(list?.id || null);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (deviceId) {
      getOrCreateDefaultList(deviceId).then(setList);
    }
  }, [deviceId]);

  const handleAddItem = async () => {
    if (!newItem.trim() || !list) return;
    await addShoppingItem(list.id, newItem.trim());
    setNewItem('');
  };

  const handleToggle = async (itemId: string, currentChecked: boolean) => {
    if (!deviceId) return;
    await toggleItemChecked(itemId, !currentChecked, deviceId);
  };

  const handleShare = async () => {
    if (!list) return;
    try {
      const link = await createShareLink(list.id);
      await Share.share({ message: `加入我的购物清单: ${link}` });
    } catch (error) {
      Alert.alert('分享失败', String(error));
    }
  };

  const freshItems = items.filter(i => i.category === 'fresh' && !i.checked);
  const pantryItems = items.filter(i => i.category === 'pantry' && !i.checked);
  const checkedItems = items.filter(i => i.checked);

  return (
    <View style={styles.container}>
      <View style={[glassStyles.navBar, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>购物清单 🛒</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareButton}>📤 分享</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[
          { title: '🥬 生鲜', data: freshItems },
          { title: '🥫 干货', data: pantryItems },
          { title: '✅ 已完成', data: checkedItems },
        ]}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item: section }) => section.data.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>{section.title} ({section.data.length})</Text>
            {section.data.map(item => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item.id, item.checked)}
              />
            ))}
          </View>
        ) : null}
        ListEmptyComponent={<Text style={styles.emptyText}>购物清单是空的</Text>}
      />

      <View style={[glassStyles.container, styles.inputBar]}>
        <TextInput
          style={styles.input}
          placeholder="添加商品..."
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  backButton: { ...typography.body, color: colors.primary },
  title: { ...typography.h3, color: colors.textPrimary },
  shareButton: { ...typography.body, color: colors.primary },
  sectionTitle: { ...typography.h3, marginHorizontal: spacing.m, marginTop: spacing.l, marginBottom: spacing.s },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  inputBar: { flexDirection: 'row', margin: spacing.m, padding: spacing.s },
  input: { flex: 1, ...typography.body, paddingHorizontal: spacing.m },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderRadius: borderRadius.m },
  addButtonText: { ...typography.body, color: colors.white },
});
```

**Step 5: Update App.tsx navigation**

Add all screens to `kitchenflow-app/App.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanResultsScreen } from './src/screens/ScanResultsScreen';
import { CravingsScreen } from './src/screens/CravingsScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ScanResults" component={ScanResultsScreen} />
        <Stack.Screen name="Cravings" component={CravingsScreen} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Step 6: Install nanoid**

```bash
npm install nanoid
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add Shopping List screen with realtime sync"
```

---

## Updated Verification Plan

### Phase 1 验证 (Task 1-5)
- [ ] 相机权限和拍照
- [ ] AI 识别食材
- [ ] 新鲜度颜色显示

### Phase 2 验证 (Task 6-8)
- [ ] Supabase 连接成功
- [ ] 设备 ID 创建和存储
- [ ] 馋念添加和列表显示
- [ ] 购物项实时同步
- [ ] 分享链接生成

### 集成测试 (需后端配合)
- [ ] 设备 A 添加购物项，设备 B 实时看到
- [ ] 设备 B 勾选，设备 A 看到更新

---

**参考文档：**
- 后端设计：`docs/plans/2026-01-20-kitchenflow-backend-design.md`
- 前后端接口协议：`docs/plans/2026-01-20-integration-protocol.md`
