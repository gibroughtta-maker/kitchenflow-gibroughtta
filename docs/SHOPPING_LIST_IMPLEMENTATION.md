# Shopping List Feature - Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Type Definitions](#type-definitions)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [API Reference](#api-reference)
7. [Testing Checklist](#testing-checklist)

---

## Overview

### Feature Goals

- **Smart Shopping List**: Auto-generate from Cravings minus Inventory
- **Store Categorization**: Group items by UK supermarkets (9 stores)
- **First-time Onboarding**: Store selection modal
- **Manual Editing**: Add, edit quantity, change store, delete
- **Online Shopping**: WebView with floating list overlay
- **Offline Shopping**: Google Maps route planning (Phase 7)

### Key Decisions

| Decision | Choice |
|---------|--------|
| Language | English (UK consumption habits) |
| Stores | 9 UK supermarkets (Sainsbury's, Asda, Morrisons, Lidl, Waitrose, Aldi, Co-op, Iceland, M&S) |
| First Use | Store selection modal (must select at least 1) |
| Default Store | Last used store |
| Craving Integration | Smart preview (AI recommends stores, user can modify, one-click add) |
| Layout | Grouped by store |
| Purchased Items | Auto-delete after 3 seconds (with undo) |
| Duplicate Items | Auto-merge (same name + same unit only) |
| Data Storage | Supabase (real-time sync) |
| Inventory Comparison | Name + Category matching |
| Online Shopping | WebView (read-only) + Floating list overlay |
| WebView Login | Not required (read-only browsing) |

---

## Database Schema

### 1. Update `shopping_items` Table

```sql
-- Add new columns to existing shopping_items table
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS source TEXT, -- 'manual' | 'craving' | 'ai'
ADD COLUMN IF NOT EXISTS source_craving_id UUID REFERENCES cravings(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for store filtering
CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store_id);

-- Create index for source tracking
CREATE INDEX IF NOT EXISTS idx_shopping_items_source ON shopping_items(source, source_craving_id);
```

### 2. Create `store_preferences` Table (Optional - or use AsyncStorage)

```sql
-- Store user's supermarket preferences
CREATE TABLE IF NOT EXISTS store_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id),
  selected_stores TEXT[] NOT NULL DEFAULT '{}',
  default_store TEXT,
  last_used_store TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

CREATE INDEX IF NOT EXISTS idx_store_preferences_device ON store_preferences(device_id);
```

**Note**: We'll use AsyncStorage for store preferences (simpler, no DB needed).

---

## Type Definitions

### Update `src/types/supabase.ts`

```typescript
// ============================================================================
// UK SUPERMARKET TYPES
// ============================================================================

export type UKSupermarket = 
  | 'sainsburys'
  | 'asda'
  | 'morrisons'
  | 'lidl'
  | 'waitrose'
  | 'aldi'
  | 'coop'
  | 'iceland'
  | 'marks';

export interface SupermarketInfo {
  id: UKSupermarket;
  name: string;
  icon: string;
  website: string;
  deepLink?: string;
}

export const UK_SUPERMARKETS: SupermarketInfo[] = [
  { id: 'sainsburys', name: "Sainsbury's", icon: '🟠', website: 'https://www.sainsburys.co.uk/gol-ui/groceries' },
  { id: 'asda', name: 'Asda', icon: '🟢', website: 'https://groceries.asda.com' },
  { id: 'morrisons', name: 'Morrisons', icon: '🟡', website: 'https://groceries.morrisons.com' },
  { id: 'lidl', name: 'Lidl', icon: '🔵', website: 'https://www.lidl.co.uk' },
  { id: 'waitrose', name: 'Waitrose', icon: '⚪', website: 'https://www.waitrose.com/ecom/shop/browse/groceries' },
  { id: 'aldi', name: 'Aldi', icon: '🟠', website: 'https://www.aldi.co.uk' },
  { id: 'coop', name: 'Co-op', icon: '🔵', website: 'https://www.coop.co.uk/products' },
  { id: 'iceland', name: 'Iceland', icon: '❄️', website: 'https://www.iceland.co.uk' },
  { id: 'marks', name: 'M&S', icon: '🟣', website: 'https://www.marksandspencer.com/c/food-and-wine' },
];

// ============================================================================
// SHOPPING ITEM TYPES (UPDATED)
// ============================================================================

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string; // Now supports units: "500g", "2L", "4 pcs"
  unit?: string; // Extracted unit: "g", "L", "pcs"
  category: ShoppingItemCategory;
  store_id?: UKSupermarket; // NEW: Which store to buy from
  reason?: string; // NEW: "For: Pasta Carbonara" or "Manual"
  source?: 'manual' | 'craving' | 'ai'; // NEW: How item was added
  source_craving_id?: string; // NEW: Link to craving if from craving
  notes?: string; // NEW: User notes
  checked: boolean;
  checked_by?: string;
  checked_at?: string;
  sort_order: number;
  created_at: string;
}

export interface ShoppingItemInsert {
  list_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: ShoppingItemCategory;
  store_id?: UKSupermarket;
  reason?: string;
  source?: 'manual' | 'craving' | 'ai';
  source_craving_id?: string;
  notes?: string;
}

// ============================================================================
// STORE PREFERENCES (AsyncStorage)
// ============================================================================

export interface StorePreferences {
  selectedStores: UKSupermarket[];
  defaultStore: UKSupermarket;
  lastUsedStore: UKSupermarket;
}

// ============================================================================
// MISSING INGREDIENT (for Craving integration)
// ============================================================================

export interface MissingIngredient {
  name: string;
  quantity: number;
  unit: string;
  reason: string; // "For: Pasta Carbonara"
  recommendedStore: UKSupermarket; // AI recommendation
}
```

---

## Implementation Phases

### Phase 1: Foundation & Database Setup

#### 1.1 Database Migration

**File**: `docs/sql/shopping_list_migration.sql`

```sql
-- Add new columns to shopping_items
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_craving_id UUID REFERENCES cravings(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_source ON shopping_items(source, source_craving_id);
```

**Action**: Run this SQL in Supabase Dashboard.

#### 1.2 Update Type Definitions

**File**: `src/types/supabase.ts`

- Add `UKSupermarket` type
- Add `SupermarketInfo` interface
- Add `UK_SUPERMARKETS` constant
- Update `ShoppingItem` interface
- Add `StorePreferences` interface
- Add `MissingIngredient` interface

**Estimated Time**: 30 minutes

#### 1.3 Create Store Preferences Hook

**File**: `src/hooks/useStorePreferences.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import type { StorePreferences, UKSupermarket } from '../types/supabase';
import { UK_SUPERMARKETS } from '../types/supabase';

const STORE_PREFS_KEY = '@kitchenflow:store_preferences';

export function useStorePreferences() {
  const [prefs, setPrefs] = useState<StorePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORE_PREFS_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load store preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPrefs: StorePreferences) => {
    try {
      await AsyncStorage.setItem(STORE_PREFS_KEY, JSON.stringify(newPrefs));
      setPrefs(newPrefs);
    } catch (error) {
      console.error('Failed to save store preferences:', error);
      throw error;
    }
  };

  const updateLastUsedStore = async (store: UKSupermarket) => {
    if (!prefs) return;
    const updated = { ...prefs, lastUsedStore: store };
    await savePreferences(updated);
  };

  const getDefaultStore = (): UKSupermarket => {
    return prefs?.defaultStore || UK_SUPERMARKETS[0].id;
  };

  const getLastUsedStore = (): UKSupermarket => {
    return prefs?.lastUsedStore || getDefaultStore();
  };

  return {
    preferences: prefs,
    loading,
    savePreferences,
    updateLastUsedStore,
    getDefaultStore,
    getLastUsedStore,
  };
}
```

**Estimated Time**: 30 minutes

#### 1.4 Extend Shopping Service

**File**: `src/services/shoppingService.ts`

Add new functions:

```typescript
import type { UKSupermarket, ShoppingItemInsert } from '../types/supabase';

/**
 * Add item with store assignment
 */
export async function addShoppingItemWithStore(
  listId: string,
  name: string,
  storeId: UKSupermarket,
  quantity?: string,
  unit?: string,
  reason?: string,
  source: 'manual' | 'craving' | 'ai' = 'manual',
  sourceCravingId?: string
): Promise<ShoppingItem> {
  const itemData: ShoppingItemInsert = {
    list_id: listId,
    name,
    store_id: storeId,
    quantity,
    unit,
    reason,
    source,
    source_craving_id: sourceCravingId,
  };

  const { data, error } = await supabase
    .from('shopping_items')
    .insert(itemData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check for duplicate items (same name + same unit)
 */
export async function findDuplicateItem(
  listId: string,
  name: string,
  unit?: string
): Promise<ShoppingItem | null> {
  const query = supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId)
    .eq('name', name)
    .eq('checked', false);

  if (unit) {
    query.eq('unit', unit);
  } else {
    query.is('unit', null);
  }

  const { data } = await query.limit(1).single();
  return data || null;
}

/**
 * Merge duplicate items (add quantities)
 */
export async function mergeShoppingItems(
  existingItemId: string,
  newQuantity: string,
  newUnit?: string
): Promise<ShoppingItem> {
  // Get existing item
  const { data: existing } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('id', existingItemId)
    .single();

  if (!existing) throw new Error('Item not found');

  // Parse quantities (simple: assume same unit)
  const existingQty = parseFloat(existing.quantity || '1');
  const newQty = parseFloat(newQuantity || '1');
  const mergedQty = existingQty + newQty;

  // Update
  const { data, error } = await supabase
    .from('shopping_items')
    .update({
      quantity: `${mergedQty}${newUnit || existing.unit || ''}`,
    })
    .eq('id', existingItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update item store
 */
export async function updateItemStore(
  itemId: string,
  storeId: UKSupermarket
): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ store_id: storeId })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Update item quantity
 */
export async function updateItemQuantity(
  itemId: string,
  quantity: string,
  unit?: string
): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ quantity, unit })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Delete item (after purchase)
 */
export async function deleteShoppingItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
```

**Estimated Time**: 1 hour

---

### Phase 2: First-Time Onboarding

#### 2.1 Create Store Onboarding Component

**File**: `src/components/StoreOnboarding.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { UK_SUPERMARKETS, UKSupermarket, StorePreferences } from '../types/supabase';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface StoreOnboardingProps {
  visible: boolean;
  onComplete: (prefs: StorePreferences) => void;
}

export const StoreOnboarding: React.FC<StoreOnboardingProps> = ({
  visible,
  onComplete,
}) => {
  const [selectedStores, setSelectedStores] = useState<Set<UKSupermarket>>(new Set());

  const toggleStore = (storeId: UKSupermarket) => {
    const newSet = new Set(selectedStores);
    if (newSet.has(storeId)) {
      newSet.delete(storeId);
    } else {
      newSet.add(storeId);
    }
    setSelectedStores(newSet);
  };

  const handleContinue = () => {
    if (selectedStores.size === 0) {
      // Show error: must select at least 1
      return;
    }

    const storesArray = Array.from(selectedStores);
    const prefs: StorePreferences = {
      selectedStores: storesArray,
      defaultStore: storesArray[0],
      lastUsedStore: storesArray[0],
    };

    onComplete(prefs);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, glassStyles.container]}>
          <Text style={styles.title}>Welcome to Shopping List!</Text>
          <Text style={styles.subtitle}>
            Select your regular supermarkets (at least 1):
          </Text>

          <ScrollView style={styles.storeList}>
            {UK_SUPERMARKETS.map(store => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeItem,
                  selectedStores.has(store.id) && styles.storeItemSelected,
                ]}
                onPress={() => toggleStore(store.id)}
              >
                <Text style={styles.storeIcon}>{store.icon}</Text>
                <Text style={styles.storeName}>{store.name}</Text>
                {selectedStores.has(store.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedStores.size === 0 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={selectedStores.size === 0}
          >
            <Text style={styles.continueButtonText}>
              Continue ({selectedStores.size} selected)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  storeList: {
    maxHeight: 400,
    marginBottom: spacing.lg,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storeItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  storeName: {
    ...typography.body,
    flex: 1,
  },
  checkmark: {
    ...typography.body,
    color: colors.primary,
    fontSize: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
```

**Estimated Time**: 1 hour

#### 2.2 Integrate into ShoppingListScreen

**File**: `src/screens/ShoppingListScreen.tsx`

Add onboarding check:

```typescript
import { useStorePreferences } from '../hooks/useStorePreferences';
import { StoreOnboarding } from '../components/StoreOnboarding';

export const ShoppingListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { preferences, loading, savePreferences } = useStorePreferences();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !preferences) {
      setShowOnboarding(true);
    }
  }, [loading, preferences]);

  const handleOnboardingComplete = async (prefs: StorePreferences) => {
    await savePreferences(prefs);
    setShowOnboarding(false);
  };

  // ... rest of component
};
```

**Estimated Time**: 15 minutes

---

### Phase 3: Main Shopping List UI (Grouped by Store)

#### 3.1 Refactor ShoppingListScreen

**File**: `src/screens/ShoppingListScreen.tsx`

Key changes:
- Group items by `store_id`
- Show store headers with item counts
- Filter by selected stores
- Show empty state per store

**Estimated Time**: 2 hours

#### 3.2 Create ShoppingItemCard Component

**File**: `src/components/ShoppingItemCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingItem, UK_SUPERMARKETS } from '../types/supabase';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onEdit?: () => void;
}

export const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  onToggle,
  onEdit,
}) => {
  const store = item.store_id
    ? UK_SUPERMARKETS.find(s => s.id === item.store_id)
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, glassStyles.container, item.checked && styles.checked]}
      onPress={onToggle}
      onLongPress={onEdit}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={[styles.name, item.checked && styles.nameChecked]}>
            {item.name}
          </Text>
          {item.quantity && (
            <Text style={styles.quantity}>
              {item.quantity} {item.unit || ''}
            </Text>
          )}
          {item.reason && (
            <Text style={styles.reason}>{item.reason}</Text>
          )}
        </View>
        <View style={styles.right}>
          {store && (
            <Text style={styles.storeIcon}>{store.icon}</Text>
          )}
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  checked: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  nameChecked: {
    textDecorationLine: 'line-through',
  },
  quantity: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reason: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeIcon: {
    fontSize: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

**Estimated Time**: 1 hour

#### 3.3 Create QuickAddBar Component

**File**: `src/components/QuickAddBar.tsx`

```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface QuickAddBarProps {
  onAdd: (name: string) => void;
  placeholder?: string;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onAdd,
  placeholder = 'Add item...',
}) => {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <View style={[styles.container, glassStyles.container]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
```

**Estimated Time**: 30 minutes

#### 3.4 Implement Check & Auto-Delete with Undo

**File**: `src/screens/ShoppingListScreen.tsx`

```typescript
const [undoItem, setUndoItem] = useState<string | null>(null);
const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleToggle = async (itemId: string, currentChecked: boolean) => {
  if (!deviceId) return;

  if (!currentChecked) {
    // Check item
    await toggleItemChecked(itemId, true, deviceId);
    
    // Set undo state
    setUndoItem(itemId);
    
    // Auto-delete after 3 seconds
    undoTimeoutRef.current = setTimeout(async () => {
      await deleteShoppingItem(itemId);
      setUndoItem(null);
    }, 3000);
  } else {
    // Uncheck item
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    await toggleItemChecked(itemId, false, deviceId);
    setUndoItem(null);
  }
};

const handleUndo = async () => {
  if (undoItem && undoTimeoutRef.current) {
    clearTimeout(undoTimeoutRef.current);
    await toggleItemChecked(undoItem, false, deviceId);
    setUndoItem(null);
  }
};

// In render:
{undoItem && (
  <View style={styles.undoBar}>
    <Text style={styles.undoText}>Item removed</Text>
    <TouchableOpacity onPress={handleUndo}>
      <Text style={styles.undoButton}>Undo</Text>
    </TouchableOpacity>
  </View>
)}
```

**Estimated Time**: 45 minutes

---

### Phase 4: Edit Functionality

#### 4.1 Create ItemEditModal Component

**File**: `src/components/ItemEditModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { ShoppingItem, UKSupermarket, UK_SUPERMARKETS } from '../types/supabase';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface ItemEditModalProps {
  visible: boolean;
  item: ShoppingItem | null;
  onSave: (updates: { quantity?: string; unit?: string; store_id?: UKSupermarket }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  visible,
  item,
  onSave,
  onDelete,
  onClose,
}) => {
  const [quantity, setQuantity] = useState(item?.quantity || '');
  const [unit, setUnit] = useState(item?.unit || '');
  const [selectedStore, setSelectedStore] = useState<UKSupermarket | undefined>(item?.store_id);

  if (!item) return null;

  const handleSave = () => {
    onSave({ quantity, unit, store_id: selectedStore });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, glassStyles.container]}>
          <Text style={styles.title}>{item.name}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const num = parseFloat(quantity) || 1;
                  if (num > 1) setQuantity(String(num - 1));
                }}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const num = parseFloat(quantity) || 1;
                  setQuantity(String(num + 1));
                }}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.unitInput}
              placeholder="Unit (g, L, pcs...)"
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Store</Text>
            <ScrollView horizontal style={styles.storeSelector}>
              {UK_SUPERMARKETS.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeOption,
                    selectedStore === store.id && styles.storeOptionSelected,
                  ]}
                  onPress={() => setSelectedStore(store.id)}
                >
                  <Text style={styles.storeIcon}>{store.icon}</Text>
                  <Text style={styles.storeName}>{store.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  quantityInput: {
    ...typography.body,
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    minWidth: 60,
    textAlign: 'center',
  },
  unitInput: {
    ...typography.body,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  storeSelector: {
    marginTop: spacing.sm,
  },
  storeOption: {
    padding: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  storeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  storeName: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  deleteButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.white,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
```

**Estimated Time**: 1 hour

#### 4.2 Implement Swipe to Delete

Use `react-native-gesture-handler` or simple long-press (already in ItemEditModal).

**Estimated Time**: 30 minutes

#### 4.3 Implement Duplicate Merging

**File**: `src/screens/ShoppingListScreen.tsx`

```typescript
const handleAddItem = async (name: string, storeId: UKSupermarket) => {
  // Check for duplicate
  const duplicate = await findDuplicateItem(list.id, name, unit);
  
  if (duplicate) {
    // Merge quantities
    await mergeShoppingItems(duplicate.id, quantity, unit);
    Toast.show({
      type: 'success',
      title: 'Item merged',
      message: `${name} quantity updated`,
    });
  } else {
    // Add new item
    await addShoppingItemWithStore(
      list.id,
      name,
      storeId,
      quantity,
      unit,
      'Manual',
      'manual'
    );
  }
};
```

**Estimated Time**: 30 minutes

---

### Phase 5: Craving Integration

#### 5.1 Create Ingredient Matcher Utility

**File**: `src/utils/ingredientMatcher.ts`

```typescript
import { CravingIngredient } from '../types/supabase';
import { InventoryItem } from '../types/kitchenflow-types';

/**
 * Normalize ingredient name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if two ingredient names match (fuzzy)
 */
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // One contains the other (e.g., "tomato" matches "cherry tomatoes")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Plural/singular (simple check)
  const singular1 = n1.replace(/s$/, '');
  const singular2 = n2.replace(/s$/, '');
  if (singular1 === singular2 || singular1 === n2 || singular2 === n1) return true;
  
  return false;
}

/**
 * Find missing ingredients from craving
 */
export function findMissingIngredients(
  requiredIngredients: CravingIngredient[],
  inventoryItems: InventoryItem[]
): {
  missing: CravingIngredient[];
  have: { ingredient: CravingIngredient; inventory: InventoryItem }[];
} {
  const missing: CravingIngredient[] = [];
  const have: { ingredient: CravingIngredient; inventory: InventoryItem }[] = [];

  for (const required of requiredIngredients) {
    const inStock = inventoryItems.find(item => 
      namesMatch(item.name, required.name)
    );

    if (!inStock) {
      // Not in inventory at all
      missing.push(required);
    } else {
      // Check quantity
      const requiredQty = required.quantity;
      const stockQty = inStock.quantity || 0;
      
      if (stockQty < requiredQty) {
        // Need more
        missing.push({
          ...required,
          quantity: requiredQty - stockQty,
        });
      } else {
        // Have enough
        have.push({ ingredient: required, inventory: inStock });
      }
    }
  }

  return { missing, have };
}
```

**Estimated Time**: 1.5 hours

#### 5.2 Create AI Store Recommender

**File**: `src/utils/storeRecommender.ts`

```typescript
import { UKSupermarket } from '../types/supabase';

/**
 * Simple rule-based store recommendation
 */
export function recommendStore(ingredientName: string): UKSupermarket {
  const name = ingredientName.toLowerCase();
  
  // Organic/premium → Waitrose, M&S
  if (name.includes('organic') || name.includes('premium') || name.includes('free-range')) {
    return Math.random() > 0.5 ? 'waitrose' : 'marks';
  }
  
  // Frozen → Iceland
  if (name.includes('frozen')) {
    return 'iceland';
  }
  
  // Budget items → Lidl, Aldi
  if (name.includes('value') || name.includes('basics')) {
    return Math.random() > 0.5 ? 'lidl' : 'aldi';
  }
  
  // Default → Sainsbury's (most common)
  return 'sainsburys';
}
```

**Estimated Time**: 30 minutes

#### 5.3 Create AddToShoppingModal Component

**File**: `src/components/AddToShoppingModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MissingIngredient, UKSupermarket, UK_SUPERMARKETS } from '../types/supabase';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';

interface AddToShoppingModalProps {
  visible: boolean;
  cravingName: string;
  missingIngredients: MissingIngredient[];
  alreadyHave: string[];
  onAdd: (items: { name: string; quantity: number; unit: string; store_id: UKSupermarket }[]) => void;
  onCancel: () => void;
}

export const AddToShoppingModal: React.FC<AddToShoppingModalProps> = ({
  visible,
  cravingName,
  missingIngredients,
  alreadyHave,
  onAdd,
  onCancel,
}) => {
  const [selectedStores, setSelectedStores] = useState<Map<string, UKSupermarket>>(
    new Map(missingIngredients.map((item, idx) => [String(idx), item.recommendedStore]))
  );

  const updateStore = (index: number, store: UKSupermarket) => {
    const newMap = new Map(selectedStores);
    newMap.set(String(index), store);
    setSelectedStores(newMap);
  };

  const handleAdd = () => {
    const items = missingIngredients.map((item, idx) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      store_id: selectedStores.get(String(idx)) || item.recommendedStore,
    }));
    onAdd(items);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, glassStyles.container]}>
          <Text style={styles.title}>Add to Shopping List</Text>
          <Text style={styles.cravingName}>{cravingName}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Missing Ingredients ({missingIngredients.length})
            </Text>
            <ScrollView style={styles.ingredientsList}>
              {missingIngredients.map((item, idx) => (
                <View key={idx} style={styles.ingredientItem}>
                  <View style={styles.ingredientLeft}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <Text style={styles.ingredientQty}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.storeSelector}
                    onPress={() => {
                      // Show store picker
                    }}
                  >
                    <Text style={styles.storeText}>
                      {UK_SUPERMARKETS.find(s => s.id === selectedStores.get(String(idx)))?.icon}
                      {' '}
                      {UK_SUPERMARKETS.find(s => s.id === selectedStores.get(String(idx)))?.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {alreadyHave.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Already Have ({alreadyHave.length})</Text>
              {alreadyHave.map((item, idx) => (
                <Text key={idx} style={styles.haveItem}>✓ {item}</Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>
                Add {missingIngredients.length} Items
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  cravingName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  ingredientsList: {
    maxHeight: 300,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassBackground,
  },
  ingredientLeft: {
    flex: 1,
  },
  ingredientName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ingredientQty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  storeSelector: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
  },
  storeText: {
    ...typography.caption,
    color: colors.primary,
  },
  haveItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  addButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  addButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
```

**Estimated Time**: 2 hours

#### 5.4 Integrate into CravingsScreen

**File**: `src/screens/CravingsScreen.tsx`

Add button to each craving card:

```typescript
import { AddToShoppingModal } from '../components/AddToShoppingModal';
import { findMissingIngredients } from '../utils/ingredientMatcher';
import { recommendStore } from '../utils/storeRecommender';

// In component:
const [showAddModal, setShowAddModal] = useState(false);
const [selectedCraving, setSelectedCraving] = useState<Craving | null>(null);

const handleAddToShopping = async (craving: Craving) => {
  if (!craving.required_ingredients || craving.required_ingredients.length === 0) {
    Toast.show({
      type: 'info',
      title: 'No ingredients',
      message: 'This craving has no ingredients yet.',
    });
    return;
  }

  // Load inventory
  const inventory = await loadInventory(); // Your inventory loading function
  
  // Find missing ingredients
  const { missing, have } = findMissingIngredients(
    craving.required_ingredients,
    inventory
  );

  if (missing.length === 0) {
    Toast.show({
      type: 'success',
      title: 'All ingredients available',
      message: 'You have everything you need!',
    });
    return;
  }

  // Add AI store recommendations
  const missingWithStores = missing.map(ing => ({
    ...ing,
    recommendedStore: recommendStore(ing.name),
  }));

  setSelectedCraving(craving);
  setMissingIngredients(missingWithStores);
  setAlreadyHave(have.map(h => h.ingredient.name));
  setShowAddModal(true);
};
```

**Estimated Time**: 30 minutes

#### 5.5 Add Inventory Freshness Warning

**File**: `src/components/AddToShoppingModal.tsx`

```typescript
interface AddToShoppingModalProps {
  // ... existing props
  inventoryLastUpdated?: Date; // NEW
}

// In component:
{inventoryLastUpdated && (
  (() => {
    const daysAgo = Math.floor(
      (Date.now() - inventoryLastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo > 3) {
      return (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Your inventory was last updated {daysAgo} days ago.
            It may be outdated.
          </Text>
        </View>
      );
    }
    return null;
  })()
)}
```

**Estimated Time**: 20 minutes

---

### Phase 6: Online Shopping (WebView + Floating List)

#### 6.1 Install Dependencies

```bash
npx expo install react-native-webview
npx expo install expo-clipboard
```

**Estimated Time**: 10 minutes

#### 6.2 Create ShoppingWebView Screen

**File**: `src/screens/ShoppingWebViewScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { FloatingShoppingList } from '../components/FloatingShoppingList';
import { ShoppingItem, UKSupermarket, UK_SUPERMARKETS } from '../types/supabase';
import { colors } from '../styles/theme';

interface ShoppingWebViewScreenProps {
  navigation: any;
  route: {
    params: {
      store: UKSupermarket;
      items: ShoppingItem[];
    };
  };
}

export const ShoppingWebViewScreen: React.FC<ShoppingWebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const { store, items } = route.params;
  const storeInfo = UK_SUPERMARKETS.find(s => s.id === store);
  const storeItems = items.filter(item => item.store_id === store && !item.checked);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: storeInfo?.website || '' }}
        style={styles.webview}
        startInLoadingState
      />
      <FloatingShoppingList items={storeItems} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
});
```

**Estimated Time**: 1 hour

#### 6.3 Create FloatingShoppingList Component

**File**: `src/components/FloatingShoppingList.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ShoppingItem } from '../types/supabase';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glassStyles } from '../styles/glassmorphism';
import { Ionicons } from '@expo/vector-icons';

interface FloatingShoppingListProps {
  items: ShoppingItem[];
  onItemCheck?: (itemId: string) => void;
}

export const FloatingShoppingList: React.FC<FloatingShoppingListProps> = ({
  items,
  onItemCheck,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [slideAnim] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = expanded ? 1 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const handleCopy = async (itemName: string) => {
    await Clipboard.setStringAsync(itemName);
    // Show toast
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -300], // Adjust based on list height
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
      >
        <Text style={styles.headerText}>
          📋 Your List ({items.length})
        </Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {items.map(item => (
            <View key={item.id} style={styles.item}>
              <TouchableOpacity
                style={styles.itemContent}
                onPress={() => onItemCheck?.(item.id)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity && (
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit || ''}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(item.name)}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => {
          // Navigate back
        }}
      >
        <Text style={styles.doneButtonText}>Done Shopping</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...glassStyles.container,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerText: {
    ...typography.body,
    fontWeight: '600',
  },
  list: {
    maxHeight: 300,
    padding: spacing.sm,
  },
  item: {
    marginBottom: spacing.xs,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glassBackground,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  copyButton: {
    padding: spacing.xs,
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  doneButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
```

**Estimated Time**: 1.5 hours

#### 6.4 Add Navigation to ShoppingWebView

**File**: `App.tsx`

```typescript
import { ShoppingWebViewScreen } from './src/screens/ShoppingWebViewScreen';

// In Stack.Navigator:
<Stack.Screen name="ShoppingWebView" component={ShoppingWebViewScreen} />
```

**File**: `src/screens/ShoppingListScreen.tsx`

Add "Shop Online" button per store group:

```typescript
<TouchableOpacity
  style={styles.shopOnlineButton}
  onPress={() => {
    navigation.navigate('ShoppingWebView', {
      store: storeId,
      items: storeItems,
    });
  }}
>
  <Text style={styles.shopOnlineText}>🛒 Shop Online</Text>
</TouchableOpacity>
```

**Estimated Time**: 15 minutes

---

### Phase 7: Offline Shopping (Google Maps) - Optional

**Note**: This phase is optional and can be implemented later.

#### 7.1 Install Dependencies

```bash
npx expo install expo-location react-native-maps
```

#### 7.2 Create Route Planning Screen

**File**: `src/screens/ShoppingRouteScreen.tsx`

- Get user location
- Find nearest stores using Google Places API
- Plan route using Google Directions API
- Display on map

**Estimated Time**: 3-4 hours

---

## File Structure

```
kitchenflow-app/src/
├── components/
│   ├── StoreOnboarding.tsx          # NEW: First-time store selection
│   ├── ShoppingItemCard.tsx         # UPDATED: Show store icon
│   ├── QuickAddBar.tsx              # NEW: Bottom add bar
│   ├── ItemEditModal.tsx            # NEW: Edit quantity/store
│   ├── AddToShoppingModal.tsx      # NEW: Craving → Shopping preview
│   ├── FloatingShoppingList.tsx    # NEW: WebView overlay
│   └── ShoppingItemCard.tsx         # EXISTING: Update for stores
├── screens/
│   ├── ShoppingListScreen.tsx       # UPDATED: Group by store
│   ├── ShoppingWebViewScreen.tsx    # NEW: WebView + floating list
│   ├── CravingsScreen.tsx           # UPDATED: Add "Add to Shopping" button
│   └── ShoppingRouteScreen.tsx      # NEW (Phase 7): Maps route
├── services/
│   └── shoppingService.ts           # UPDATED: Add store functions
├── hooks/
│   └── useStorePreferences.ts       # NEW: AsyncStorage preferences
├── utils/
│   ├── ingredientMatcher.ts         # NEW: Compare craving vs inventory
│   └── storeRecommender.ts           # NEW: AI store recommendation
└── types/
    └── supabase.ts                   # UPDATED: Add store types
```

---

## API Reference

### Shopping Service Functions

```typescript
// Add item with store
addShoppingItemWithStore(
  listId: string,
  name: string,
  storeId: UKSupermarket,
  quantity?: string,
  unit?: string,
  reason?: string,
  source?: 'manual' | 'craving' | 'ai',
  sourceCravingId?: string
): Promise<ShoppingItem>

// Find duplicate
findDuplicateItem(
  listId: string,
  name: string,
  unit?: string
): Promise<ShoppingItem | null>

// Merge duplicates
mergeShoppingItems(
  existingItemId: string,
  newQuantity: string,
  newUnit?: string
): Promise<ShoppingItem>

// Update store
updateItemStore(itemId: string, storeId: UKSupermarket): Promise<void>

// Update quantity
updateItemQuantity(itemId: string, quantity: string, unit?: string): Promise<void>

// Delete item
deleteShoppingItem(itemId: string): Promise<void>
```

### Utility Functions

```typescript
// Find missing ingredients
findMissingIngredients(
  requiredIngredients: CravingIngredient[],
  inventoryItems: InventoryItem[]
): { missing: CravingIngredient[]; have: {...}[] }

// Recommend store
recommendStore(ingredientName: string): UKSupermarket
```

---

## Testing Checklist

### Phase 1: Foundation
- [ ] Database migration runs successfully
- [ ] Types compile without errors
- [ ] Store preferences save/load from AsyncStorage
- [ ] Shopping service functions work

### Phase 2: Onboarding
- [ ] Modal appears on first use
- [ ] Must select at least 1 store
- [ ] Preferences saved correctly
- [ ] Modal doesn't show again after completion

### Phase 3: Main UI
- [ ] Items grouped by store
- [ ] Store headers show correct counts
- [ ] Quick add assigns to last used store
- [ ] Check item → auto-delete after 3s
- [ ] Undo works correctly

### Phase 4: Editing
- [ ] Edit modal opens on long-press
- [ ] Quantity +/- buttons work
- [ ] Store selector updates item
- [ ] Delete removes item
- [ ] Duplicate items merge correctly

### Phase 5: Craving Integration
- [ ] "Add to Shopping" button on cravings
- [ ] Missing ingredients calculated correctly
- [ ] AI store recommendations shown
- [ ] User can change store before adding
- [ ] Items added to correct stores
- [ ] Inventory freshness warning shows (>3 days)

### Phase 6: Online Shopping
- [ ] WebView opens correct store website
- [ ] Floating list shows items for that store
- [ ] Copy button copies item name
- [ ] List expands/collapses
- [ ] "Done Shopping" navigates back

### Phase 7: Offline Shopping (Optional)
- [ ] User location obtained
- [ ] Nearest stores found
- [ ] Route planned correctly
- [ ] Map displays route

---

## Estimated Total Time

| Phase | Time |
|-------|------|
| Phase 1: Foundation | 2.5 hours |
| Phase 2: Onboarding | 1.25 hours |
| Phase 3: Main UI | 4.25 hours |
| Phase 4: Editing | 2 hours |
| Phase 5: Craving Integration | 4.5 hours |
| Phase 6: Online Shopping | 2.75 hours |
| Phase 7: Offline Shopping | 3-4 hours (optional) |
| **Total** | **~17-18 hours** (without Phase 7) |

---

## Next Steps

1. **Start with Phase 1**: Database migration and type definitions
2. **Test incrementally**: After each phase, test thoroughly
3. **Iterate on UI**: Adjust spacing, colors, animations based on feedback
4. **Add Phase 7 later**: After core functionality is stable

---

**Ready to begin implementation!** 🚀
