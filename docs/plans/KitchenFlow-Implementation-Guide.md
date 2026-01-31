# KitchenFlow Complete Implementation Guide

**Version**: 2.0  
**Date**: 2026-01-22  
**Language**: English Only  
**AI Engine**: Google Gemini 1.5 Pro + Flash  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema (Complete)](#2-database-schema-complete)
3. [Data Models (TypeScript)](#3-data-models-typescript)
4. [Gemini Service Implementation](#4-gemini-service-implementation)
5. [Core Features Logic](#5-core-features-logic)
6. [Missing Features Implementation](#6-missing-features-implementation)
7. [Complete API Call Matrix](#7-complete-api-call-matrix)
8. [Development Checklist](#8-development-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    KitchenFlow Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   📱 React Native App                                        │
│      │                                                       │
│      ├─ 📸 Camera Scan → Gemini Pro Vision                  │
│      │                   (Receipt/Fridge Analysis)           │
│      │                                                       │
│      ├─ 🎤 Voice Input → Gemini Flash                       │
│      │                   (Craving Generation)                │
│      │                                                       │
│      └─ 🧠 Shopping AI → Gemini Pro                         │
│                          (Smart Planning)                    │
│                                                              │
│   ☁️ Supabase Backend                                        │
│      ├─ PostgreSQL (Data Storage)                           │
│      ├─ Realtime (Live Sync)                                │
│      └─ Presence (Online Status)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Frontend-First AI**: All Gemini API calls happen in React Native
2. **Structured Output**: Use JSON Schema to enforce response format
3. **English Only**: No translation layer, simplify data model
4. **Offline-Ready**: Local storage + background sync

---

## 2. Database Schema (Complete)

### 2.1 Updated Tables

```sql
-- ============================================
-- Devices Table (User/Device Management)
-- ============================================
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nickname TEXT,                    -- e.g., "Dad", "Mom"
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  push_token TEXT                   -- For notifications (optional)
);

-- ============================================
-- Ingredients Table (Inventory)
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,               -- English only: "Milk"
  quantity TEXT,                    -- "1 gallon", "500g"
  
  -- AI-Generated Metadata
  expiration_date TIMESTAMPTZ,      -- Inferred by Gemini
  storage_place TEXT,               -- "Fridge", "Freezer", "Pantry"
  confidence FLOAT,                 -- 0.0-1.0 (AI confidence)
  
  -- Frontend-Calculated Fields
  freshness TEXT,                   -- "fresh", "warning", "urgent", "neutral"
  days_left INTEGER,                -- Calculated from expiration_date
  freshness_note TEXT,              -- "Fresh | 5 days left"
  category TEXT,                    -- "fresh", "pantry", "other"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_device ON ingredients(device_id);
CREATE INDEX idx_ingredients_freshness ON ingredients(freshness);

-- ============================================
-- Cravings Table (Dish Wishlist)
-- ============================================
CREATE TABLE cravings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,               -- Dish name: "Tom Yum Soup"
  source TEXT DEFAULT 'manual',     -- "voice", "share", "manual"
  note TEXT,                        -- User's original input
  
  -- AI-Generated Data
  ingredients JSONB,                -- ["Shrimp 500g", "Lemongrass 2 stalks"]
  visual_meta JSONB,                -- { emoji, theme_color, tags }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_cravings_device ON cravings(device_id);

-- ============================================
-- Shopping Lists Table
-- ============================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  
  name TEXT DEFAULT 'Shopping List',
  share_token TEXT UNIQUE,          -- For family sharing
  expires_at TIMESTAMPTZ,           -- Link expiration
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lists_share_token ON shopping_lists(share_token);

-- ============================================
-- Shopping Items Table
-- ============================================
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT DEFAULT 'other',    -- "fresh", "pantry", "other"
  reason TEXT,                      -- "For making Tom Yum Soup"
  
  checked BOOLEAN DEFAULT FALSE,
  checked_by UUID REFERENCES devices(id),
  checked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_items_list ON shopping_items(list_id);

-- ============================================
-- Shopping List Members Table
-- ============================================
CREATE TABLE shopping_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  
  UNIQUE(list_id, device_id)
);

-- ============================================
-- Pantry Staples Table
-- ============================================
CREATE TABLE pantry_staples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  category TEXT DEFAULT 'condiment', -- "condiment", "grain", "oil"
  score INTEGER DEFAULT 100,         -- 0-100, triggers restock at <20
  last_used TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staples_device ON pantry_staples(device_id);

-- ============================================
-- NEW: User Preferences Table
-- ============================================
CREATE TABLE user_preferences (
  device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  
  preferred_stores TEXT[],          -- ["Costco", "Whole Foods"]
  dietary_restrictions TEXT[],      -- ["vegetarian", "gluten-free"]
  default_list_name TEXT DEFAULT 'My Shopping List',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Devices: Anyone can read, only owner can update
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devices are viewable by everyone"
  ON devices FOR SELECT
  USING (true);

-- Ingredients: Only owner can see/edit
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ingredients"
  ON ingredients FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

CREATE POLICY "Users can modify own ingredients"
  ON ingredients FOR ALL
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- Cravings: Only owner can see/edit
ALTER TABLE cravings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cravings"
  ON cravings FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

CREATE POLICY "Users can modify own cravings"
  ON cravings FOR ALL
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- Shopping Items: List members can view/edit
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "List members can view items"
  ON shopping_items FOR SELECT
  USING (
    list_id IN (
      SELECT list_id FROM shopping_list_members 
      WHERE device_id = current_setting('app.device_id', true)::uuid
    )
  );

CREATE POLICY "List members can modify items"
  ON shopping_items FOR ALL
  USING (
    list_id IN (
      SELECT list_id FROM shopping_list_members 
      WHERE device_id = current_setting('app.device_id', true)::uuid
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_members;
ALTER PUBLICATION supabase_realtime ADD TABLE ingredients;
```

---

## 3. Data Models (TypeScript)

```typescript
// types/index.ts

export type FreshnessLevel = 'fresh' | 'warning' | 'urgent' | 'neutral';
export type IngredientCategory = 'fresh' | 'pantry' | 'other';
export type CravingSource = 'voice' | 'share' | 'manual';
export type StoragePlace = 'Fridge' | 'Freezer' | 'Pantry';

// Device
export interface Device {
  id: string;
  created_at: string;
  nickname?: string;
  last_seen: string;
  push_token?: string;
}

// Ingredient (Database Model)
export interface Ingredient {
  id: string;
  device_id: string;
  name: string;
  quantity?: string;
  
  // AI-generated
  expiration_date?: string;
  storage_place?: StoragePlace;
  confidence?: number;
  
  // Frontend-calculated
  freshness: FreshnessLevel;
  days_left?: number;
  freshness_note: string;
  category: IngredientCategory;
  
  created_at: string;
  scanned_at: string;
}

// Gemini Vision Output
export interface GeminiReceiptItem {
  item_name: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  storage_place: StoragePlace;
  confidence: number;
}

export interface GeminiReceiptAnalysis {
  merchant_name: string;
  items: GeminiReceiptItem[];
}

// Craving
export interface VisualMeta {
  emoji: string;
  theme_color: string;
  tags: string[];
}

export interface Craving {
  id: string;
  device_id: string;
  name: string;
  source: CravingSource;
  note?: string;
  ingredients?: string[];
  visual_meta?: VisualMeta;
  created_at: string;
  is_archived: boolean;
}

// Gemini Craving Output
export interface GeminiDishRecommendation {
  dish_name: string;
  rationale: string;
  visual_meta: VisualMeta;
  missing_ingredients: string[];
}

export interface GeminiCravingsResponse {
  recommendations: GeminiDishRecommendation[];
}

// Shopping List
export interface ShoppingList {
  id: string;
  owner_device_id: string;
  name: string;
  share_token?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string;
  category: IngredientCategory;
  reason?: string;
  checked: boolean;
  checked_by?: string;
  checked_at?: string;
  created_at: string;
  sort_order: number;
}

export interface ShoppingListMember {
  id: string;
  list_id: string;
  device_id: string;
  joined_at: string;
  is_online: boolean;
}

// Gemini Shopping Plan Output
export interface GeminiShoppingPlan {
  online_items: string[];
  offline_items: string[];
  suggested_store: string;
  route_tip: string;
}

// Pantry Staple
export interface PantryStaple {
  id: string;
  device_id: string;
  name: string;
  category: 'condiment' | 'grain' | 'oil';
  score: number;
  last_used?: string;
  created_at: string;
}

// User Preferences
export interface UserPreferences {
  device_id: string;
  preferred_stores: string[];
  dietary_restrictions: string[];
  default_list_name: string;
  updated_at: string;
}
```

---

## 4. Gemini Service Implementation

```typescript
// services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GeminiReceiptAnalysis,
  GeminiCravingsResponse,
  GeminiShoppingPlan,
  Ingredient,
  Craving,
  UserPreferences
} from '@/types';

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY!
);

const SYSTEM_PROMPT = `You are a smart home kitchen assistant powered by Google Gemini. 
Your goal is to reduce food waste and simplify shopping.
- Always be objective and data-driven
- When inferring expiration dates, be conservative
- Current date: ${new Date().toISOString().split('T')[0]}
- All responses must be in English only`;

/**
 * Analyze receipt or fridge photo
 */
export async function analyzeReceiptImage(
  imageBase64: string
): Promise<GeminiReceiptAnalysis> {
  const prompt = `${SYSTEM_PROMPT}

You are analyzing a grocery receipt or fridge photo.
Extract all food items. For each item:
1. Identify the standard English name (e.g., "Milk" not "Whole Milk 2%")
2. Extract quantity and unit
3. Infer expiration date based on item type:
   - Fresh produce: 3-5 days
   - Dairy: 7 days
   - Eggs: 14 days
   - Frozen items: 90 days
   - Pantry items: 365 days
4. Infer storage place: Fridge, Freezer, or Pantry
5. Provide confidence score (0.0-1.0)

If this is a receipt, also extract the merchant name.
Return ONLY valid JSON, no markdown formatting.`;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          merchant_name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_name: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                expiration_date: { type: 'string' },
                storage_place: { 
                  type: 'string',
                  enum: ['Fridge', 'Freezer', 'Pantry']
                },
                confidence: { type: 'number' }
              },
              required: ['item_name', 'quantity', 'unit', 'expiration_date', 'storage_place']
            }
          }
        },
        required: ['merchant_name', 'items']
      }
    }
  });

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
  ]);

  return JSON.parse(result.response.text());
}

/**
 * Generate dish recommendations based on voice input
 */
export async function generateCravingsMenu(
  userInput: string,
  currentInventory: Ingredient[]
): Promise<GeminiCravingsResponse> {
  const inventoryList = currentInventory
    .map(i => `${i.name} (${i.quantity}, expires ${i.expiration_date})`)
    .join(', ');

  const prompt = `${SYSTEM_PROMPT}

User request: "${userInput}"
Current inventory: ${inventoryList}

Task:
1. Recommend 1-3 dishes that match the user's request
2. Prioritize using existing inventory to reduce waste
3. Calculate missing ingredients (difference between recipe needs and current stock)
4. Generate UI metadata:
   - emoji: A single representative emoji
   - theme_color: HEX color matching the dish vibe
   - tags: 3 short tags like ["Quick", "Healthy", "Comfort"]

Return ONLY valid JSON, no markdown formatting.`;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dish_name: { type: 'string' },
                rationale: { type: 'string' },
                visual_meta: {
                  type: 'object',
                  properties: {
                    emoji: { type: 'string' },
                    theme_color: { type: 'string' },
                    tags: { 
                      type: 'array', 
                      items: { type: 'string' },
                      maxItems: 3
                    }
                  },
                  required: ['emoji', 'theme_color', 'tags']
                },
                missing_ingredients: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['dish_name', 'rationale', 'visual_meta', 'missing_ingredients']
            }
          }
        },
        required: ['recommendations']
      }
    }
  });

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

/**
 * Generate smart shopping plan
 */
export async function planShoppingTrip(
  cravings: Craving[],
  currentInventory: Ingredient[],
  userPreferences: UserPreferences
): Promise<GeminiShoppingPlan> {
  const neededItems = cravings.flatMap(c => c.ingredients || []);
  const inventoryNames = currentInventory.map(i => i.name);
  
  const prompt = `${SYSTEM_PROMPT}

Items needed for dishes: ${neededItems.join(', ')}
Current inventory: ${inventoryNames.join(', ')}
User's preferred stores: ${userPreferences.preferred_stores.join(', ')}
Dietary restrictions: ${userPreferences.dietary_restrictions.join(', ')}

Task:
1. Calculate what needs to be purchased (needed - inventory)
2. Split items into:
   - online_items: Heavy/bulk/shelf-stable items
   - offline_items: Fresh produce, meat, dairy
3. Recommend the best store from user's preferences
4. Provide a brief route tip

Return ONLY valid JSON, no markdown formatting.`;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          online_items: { type: 'array', items: { type: 'string' } },
          offline_items: { type: 'array', items: { type: 'string' } },
          suggested_store: { type: 'string' },
          route_tip: { type: 'string' }
        },
        required: ['online_items', 'offline_items', 'suggested_store', 'route_tip']
      }
    }
  });

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

---

## 5. Core Features Logic

### 5.1 Freshness Calculation

```typescript
// utils/freshnessCalculator.ts

import { FreshnessLevel, IngredientCategory } from '@/types';

export function calculateDaysLeft(expirationDate: string): number {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateFreshness(expirationDate: string | undefined): FreshnessLevel {
  if (!expirationDate) return 'neutral';
  
  const daysLeft = calculateDaysLeft(expirationDate);
  
  if (daysLeft < 0) return 'urgent';
  if (daysLeft <= 1) return 'urgent';
  if (daysLeft <= 3) return 'warning';
  return 'fresh';
}

export function generateFreshnessNote(expirationDate: string | undefined): string {
  if (!expirationDate) return 'No expiration tracking';
  
  const daysLeft = calculateDaysLeft(expirationDate);
  
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  if (daysLeft === 1) return 'Expires tomorrow';
  if (daysLeft <= 3) return `${daysLeft} days left`;
  
  return `Fresh | ${daysLeft} days`;
}

export function mapStorageToCategory(storagePlace: string | undefined): IngredientCategory {
  switch (storagePlace) {
    case 'Fridge':
    case 'Freezer':
      return 'fresh';
    case 'Pantry':
      return 'pantry';
    default:
      return 'other';
  }
}
```

### 5.2 Receipt Processing

```typescript
// services/inventoryService.ts

import { supabase } from '@/lib/supabase';
import { analyzeReceiptImage } from './geminiService';
import {
  calculateFreshness,
  calculateDaysLeft,
  generateFreshnessNote,
  mapStorageToCategory
} from '@/utils/freshnessCalculator';
import { v4 as uuidv4 } from 'uuid';

export async function processReceiptImage(
  imageBase64: string,
  deviceId: string
) {
  const analysis = await analyzeReceiptImage(imageBase64);
  
  const ingredients = analysis.items.map(item => ({
    id: uuidv4(),
    device_id: deviceId,
    name: item.item_name,
    quantity: `${item.quantity} ${item.unit}`,
    expiration_date: item.expiration_date,
    storage_place: item.storage_place,
    confidence: item.confidence,
    freshness: calculateFreshness(item.expiration_date),
    days_left: calculateDaysLeft(item.expiration_date),
    freshness_note: generateFreshnessNote(item.expiration_date),
    category: mapStorageToCategory(item.storage_place),
    created_at: new Date().toISOString(),
    scanned_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredients)
    .select();
  
  if (error) throw error;
  
  if (analysis.merchant_name) {
    await updatePreferredStores(deviceId, analysis.merchant_name);
  }
  
  return data;
}

async function updatePreferredStores(deviceId: string, storeName: string) {
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('preferred_stores')
    .eq('device_id', deviceId)
    .single();
  
  const currentStores = prefs?.preferred_stores || [];
  
  if (!currentStores.includes(storeName)) {
    await supabase
      .from('user_preferences')
      .upsert({
        device_id: deviceId,
        preferred_stores: [...currentStores, storeName],
        updated_at: new Date().toISOString()
      });
  }
}
```

### 5.3 Craving Creation

```typescript
// services/cravingService.ts

import { supabase } from '@/lib/supabase';
import { generateCravingsMenu } from './geminiService';
import { Ingredient } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createCravingFromVoice(
  voiceText: string,
  deviceId: string
) {
  const { data: inventory } = await supabase
    .from('ingredients')
    .select('*')
    .eq('device_id', deviceId);
  
  const response = await generateCravingsMenu(
    voiceText,
    inventory as Ingredient[]
  );
  
  const cravings = response.recommendations.map(dish => ({
    id: uuidv4(),
    device_id: deviceId,
    name: dish.dish_name,
    source: 'voice',
    note: voiceText,
    ingredients: dish.missing_ingredients,
    visual_meta: dish.visual_meta,
    created_at: new Date().toISOString(),
    is_archived: false
  }));
  
  const { data, error } = await supabase
    .from('cravings')
    .insert(cravings)
    .select();
  
  if (error) throw error;
  return data;
}
```

### 5.4 Shopping List Generation

```typescript
// services/shoppingService.ts

import { supabase } from '@/lib/supabase';
import { planShoppingTrip } from './geminiService';
import { Craving, Ingredient, UserPreferences } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function generateShoppingList(deviceId: string) {
  const { data: cravings } = await supabase
    .from('cravings')
    .select('*')
    .eq('device_id', deviceId)
    .eq('is_archived', false);
  
  const { data: inventory } = await supabase
    .from('ingredients')
    .select('*')
    .eq('device_id', deviceId);
  
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  const userPreferences: UserPreferences = prefs || {
    device_id: deviceId,
    preferred_stores: [],
    dietary_restrictions: [],
    default_list_name: 'Shopping List',
    updated_at: new Date().toISOString()
  };
  
  const plan = await planShoppingTrip(
    cravings as Craving[],
    inventory as Ingredient[],
    userPreferences
  );
  
  const listId = uuidv4();
  await supabase.from('shopping_lists').insert({
    id: listId,
    owner_device_id: deviceId,
    name: `${new Date().toLocaleDateString()} Shopping`,
    created_at: new Date().toISOString()
  });
  
  const items = [
    ...plan.online_items.map((item, i) => ({
      id: uuidv4(),
      list_id: listId,
      name: item,
      category: 'pantry',
      reason: 'Buy online (heavy/bulk)',
      sort_order: i,
      checked: false
    })),
    ...plan.offline_items.map((item, i) => ({
      id: uuidv4(),
      list_id: listId,
      name: item,
      category: 'fresh',
      reason: findReasonForItem(item, cravings as Craving[]),
      sort_order: 100 + i,
      checked: false
    }))
  ];
  
  await supabase.from('shopping_items').insert(items);
  
  await supabase.from('shopping_list_members').insert({
    id: uuidv4(),
    list_id: listId,
    device_id: deviceId,
    joined_at: new Date().toISOString(),
    is_online: false
  });
  
  return { listId, plan, itemCount: items.length };
}

function findReasonForItem(itemName: string, cravings: Craving[]): string {
  const itemKeyword = itemName.split(' ')[0].toLowerCase();
  
  const relatedCravings = cravings.filter(c =>
    c.ingredients?.some(ing => ing.toLowerCase().includes(itemKeyword))
  );
  
  if (relatedCravings.length === 0) return 'Stock up';
  if (relatedCravings.length === 1) return `For making ${relatedCravings[0].name}`;
  
  return `For ${relatedCravings.map(c => c.name).join(' & ')}`;
}
```

---

## 6. Missing Features Implementation

### 6.1 Device Management

```typescript
// services/deviceService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'kitchenflow_device_id';

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    
    await supabase.from('devices').insert({
      id: deviceId,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    });
  }
  
  return deviceId;
}

export async function setDeviceNickname(deviceId: string, nickname: string) {
  await supabase
    .from('devices')
    .update({ nickname })
    .eq('id', deviceId);
  
  await AsyncStorage.setItem('device_nickname', nickname);
}

export async function getDeviceNickname(): Promise<string | null> {
  return await AsyncStorage.getItem('device_nickname');
}

export async function updateLastSeen(deviceId: string) {
  await supabase
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', deviceId);
}
```

### 6.2 Sharing System

```typescript
// services/sharingService.ts

import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { Alert, Share } from 'react-native';

export async function createShareLink(listId: string) {
  const shareToken = nanoid(10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await supabase
    .from('shopping_lists')
    .update({
      share_token: shareToken,
      expires_at: expiresAt.toISOString()
    })
    .eq('id', listId);
  
  const shareLink = `kitchenflow://join/${shareToken}`;
  
  await Share.share({
    message: `Join my shopping list! ${shareLink}`,
    title: 'KitchenFlow Shopping List'
  });
  
  return shareLink;
}

export async function joinListByToken(
  shareToken: string,
  deviceId: string,
  nickname?: string
) {
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_token', shareToken)
    .gt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .single();
  
  if (error || !list) {
    Alert.alert('Invalid Link', 'This link has expired');
    throw new Error('Invalid share token');
  }
  
  const { data: existing } = await supabase
    .from('shopping_list_members')
    .select('*')
    .eq('list_id', list.id)
    .eq('device_id', deviceId)
    .single();
  
  if (existing) return list;
  
  if (nickname) {
    await supabase
      .from('devices')
      .update({ nickname })
      .eq('id', deviceId);
  }
  
  await supabase.from('shopping_list_members').insert({
    id: uuidv4(),
    list_id: list.id,
    device_id: deviceId,
    joined_at: new Date().toISOString(),
    is_online: false
  });
  
  return list;
}
```

### 6.3 Realtime Sync Hook

```typescript
// hooks/useShoppingListSync.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingItem, ShoppingListMember } from '@/types';

export function useShoppingListSync(
  listId: string,
  deviceId: string,
  nickname: string
) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [members, setMembers] = useState<ShoppingListMember[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
  
  useEffect(() => {
    loadItems();
    loadMembers();
    
    const channel = supabase.channel(`list:${listId}`);
    
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'shopping_items',
      filter: `list_id=eq.${listId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems(prev => [...prev, payload.new as ShoppingItem]);
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(item =>
          item.id === payload.new.id ? payload.new as ShoppingItem : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineMembers(Object.values(state).flat());
    });
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          device_id: deviceId,
          nickname: nickname,
          online_at: new Date().toISOString()
        });
      }
    });
    
    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, [listId, deviceId, nickname]);
  
  async function loadItems() {
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', listId)
      .order('sort_order');
    
    if (data) setItems(data);
  }
  
  async function loadMembers() {
    const { data } = await supabase
      .from('shopping_list_members')
      .select('*, devices(*)')
      .eq('list_id', listId);
    
    if (data) setMembers(data);
  }
  
  async function checkItem(itemId: string, checked: boolean) {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked } : item
    ));
    
    const { error } = await supabase
      .from('shopping_items')
      .update({
        checked,
        checked_by: deviceId,
        checked_at: new Date().toISOString()
      })
      .eq('id', itemId);
    
    if (error) {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, checked: !checked } : item
      ));
    }
  }
  
  return {
    items,
    members,
    onlineMembers,
    checkItem,
    refreshItems: loadItems
  };
}
```

### 6.4 Pantry Staples System

```typescript
// services/pantryService.ts

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function usePantryStaple(
  deviceId: string,
  stapleName: string,
  scoreDecrease: number = 20
) {
  const { data: staple } = await supabase
    .from('pantry_staples')
    .select('*')
    .eq('device_id', deviceId)
    .eq('name', stapleName)
    .single();
  
  if (!staple) {
    await supabase.from('pantry_staples').insert({
      id: uuidv4(),
      device_id: deviceId,
      name: stapleName,
      score: 100 - scoreDecrease,
      last_used: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    return;
  }
  
  const newScore = Math.max(0, staple.score - scoreDecrease);
  
  await supabase
    .from('pantry_staples')
    .update({
      score: newScore,
      last_used: new Date().toISOString()
    })
    .eq('id', staple.id);
  
  if (newScore < 20) {
    await addStapleToShoppingList(deviceId, stapleName);
  }
}

async function addStapleToShoppingList(deviceId: string, stapleName: string) {
  let { data: list } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('owner_device_id', deviceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!list) {
    const listId = uuidv4();
    await supabase.from('shopping_lists').insert({
      id: listId,
      owner_device_id: deviceId,
      name: 'Auto Shopping List',
      created_at: new Date().toISOString()
    });
    list = { id: listId } as any;
  }
  
  const { data: existing } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', list.id)
    .eq('name', stapleName)
    .single();
  
  if (!existing) {
    await supabase.from('shopping_items').insert({
      id: uuidv4(),
      list_id: list.id,
      name: stapleName,
      category: 'pantry',
      reason: 'Running low (auto-added)',
      checked: false,
      sort_order: 999
    });
  }
}

export async function getLowStockStaples(deviceId: string) {
  const { data } = await supabase
    .from('pantry_staples')
    .select('*')
    .eq('device_id', deviceId)
    .lt('score', 20)
    .order('score');
  
  return data || [];
}
```

---

## 7. Complete API Call Matrix

| Feature | API Call | Model | Input | Output | Frequency |
|---------|----------|-------|-------|--------|-----------|
| Scan Fridge | `analyzeReceiptImage()` | Pro Vision | Base64 image | Receipt JSON | 1-2x/day |
| Voice Craving | `generateCravingsMenu()` | Flash | Text + inventory | Recommendations | 2-3x/day |
| Shopping Plan | `planShoppingTrip()` | Pro | Cravings + inventory | Shopping plan | 1-2x/week |
| Share Link | Supabase | - | List ID | Token | Occasional |
| Join List | Supabase | - | Token | List data | Occasional |
| Realtime Sync | Supabase | - | List ID | Live updates | Continuous |
| Check Item | Supabase | - | Item ID | Success | Multiple |
| Presence | Supabase | - | Device info | Online list | Continuous |
| Pantry Use | Supabase | - | Staple name | New score | Variable |

---

## 8. Development Checklist

### Week 1: Foundation
- [ ] Create Supabase project
- [ ] Run database migration
- [ ] Enable Realtime & RLS
- [ ] Initialize React Native project
- [ ] Install dependencies
- [ ] Create TypeScript types
- [ ] Implement Gemini service
- [ ] Implement device service

### Week 2: Core Features
- [ ] Build camera screen
- [ ] Implement receipt processing
- [ ] Build scan results screen
- [ ] Build cravings screen
- [ ] Implement voice input
- [ ] Build shopping list screen
- [ ] Implement list generation

### Week 3: Collaboration
- [ ] Implement share link creation
- [ ] Set up deep linking
- [ ] Implement join flow
- [ ] Add realtime sync hook
- [ ] Add presence tracking
- [ ] Test multi-device sync

### Week 4: Polish
- [ ] Implement pantry staples
- [ ] Add offline support
- [ ] Handle error states
- [ ] Performance testing
- [ ] Security audit

---

## Appendix: Environment Setup

```env
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
EXPO_PUBLIC_DEEP_LINK_SCHEME=kitchenflow
```

---

**Document Generated**: 2026-01-22  
**Implementation Time**: 4 weeks  
**Status**: Ready for development
