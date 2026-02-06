export interface FreshItem {
  name: string;
  quantity: number;
  unit: string;
  freshness: 'fresh' | 'use-soon' | 'priority';
  confidence: number;
  visualNotes?: string;
  storageLocation?: 'fridge' | 'freezer' | 'pantry' | 'other';
}

export interface FridgeSnapshotResult {
  items: FreshItem[];
  scanQuality: 'good' | 'medium' | 'poor';
}

export interface CravingAnalysisResult {
  dishName: string;
  requiredIngredients: string[];
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: string;
  servings?: number;
}

/** 新 API：食谱详情（与 AI Studio getRecipeDetails 一致） */
export interface RecipeDetails {
  dishName: string;
  cuisine: string;
  cookingTime: string;
  ingredients: { name: string; icon?: string }[];
  steps: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  addedAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  freshness: FreshItem['freshness'];
  location: 'fridge' | 'freezer' | 'pantry';
  addedAt: number;
}
