/**
 * KitchenFlow Optimized Prompt Templates
 * 基于原 promptTemplates.ts，针对 KitchenFlow 理念调整
 */

import { FreshItem } from '../../../kitchenflow-types';

// ==================== KitchenFlow 冰箱快照 Prompt ====================

export function generateKitchenFlowPrompt(imageCount: number = 1): string {
  const multiImageNote = imageCount > 1 
    ? `\n⚠️ ${imageCount} photos of SAME fridge - count each item ONCE only!` 
    : '';

  return `
# KitchenFlow - Smart Fridge Scanner

## Philosophy: "不记账，只决策"
Identify TOP 5-10 CORE ingredients only. Ignore trivial items.

## Task${multiImageNote}
1. Focus on MAIN ingredients (vegetables, proteins, dairy, staples)
2. IGNORE: condiment bottles, sauce jars, small packets (unless obviously empty)
3. Assess freshness VISUALLY (not by dates)

## Freshness Assessment Rules
- **fresh** (🟢): Vibrant color, firm texture, no spots
  - Example: "Bright red tomatoes, firm texture"
- **use-soon** (🟡): Slight wilting, minor spots, 3-5 days left
  - Example: "Baby spinach with edges slightly wilted"
- **priority** (🔴): Significant browning, must use TODAY
  - Example: "Banana heavily spotted, very soft"

## What to Count
✅ Vegetables, fruits, proteins, dairy, eggs
✅ Leftovers in containers (estimate contents)
✅ Large staples (rice bags, flour)
❌ Condiments (ketchup, soy sauce, etc.)
❌ Small packets/jars
❌ Drinks (unless specifically asked)

## Output Format (JSON only, no markdown)
{
  "items": [
    {
      "name": "Baby Spinach",
      "quantity": 1,
      "unit": "bag",
      "freshness": "use-soon",
      "confidence": 0.9,
      "visualNotes": "leaves slightly wilted at edges"
    }
  ],
  "scanQuality": "good"
}

## Quality Guidelines
- scanQuality: "good" (clear, well-lit), "medium" (some blur), "poor" (very dark/blurry)
- confidence: 0.9+ (certain), 0.7-0.9 (likely), <0.7 (uncertain)

Analyze the image(s) now:`.trim();
}

/**
 * 解析 KitchenFlow 扫描结果
 */
export function validateKitchenFlowResult(raw: string): {
  items: FreshItem[];
  scanQuality: 'good' | 'medium' | 'poor';
} | null {
  try {
    // 清理 Markdown 包装
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // 提取 JSON 对象
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const data = JSON.parse(cleaned);
    
    if (!data.items || !Array.isArray(data.items)) {
      console.error('Invalid response: missing items array');
      return null;
    }

    const items: FreshItem[] = data.items
      .filter((i: any) => i.name && i.quantity > 0)
      .map((i: any) => ({
        name: i.name.trim(),
        quantity: Number(i.quantity),
        unit: (i.unit || 'pcs').trim(),
        freshness: i.freshness || 'fresh',
        confidence: Number(i.confidence) || 0.7,
        visualNotes: i.visualNotes
      }));

    return {
      items,
      scanQuality: data.scanQuality || 'medium'
    };
  } catch (e) {
    console.error('Failed to parse KitchenFlow result:', e);
    return null;
  }
}

// ==================== Craving 菜谱解析 Prompt ====================

export function generateCravingAnalysisPrompt(dishName: string): string {
  return `
# Analyze Dish Ingredients

## Dish: "${dishName}"

## Task
Extract the essential ingredients needed to cook this dish.
- List CORE ingredients only (ignore garnishes, optional toppings)
- Use simple, generic names (not brand names)
- Estimate typical quantities for 2-3 servings

## Output Format (JSON only)
{
  "dishName": "${dishName}",
  "cuisine": "Chinese/Western/Japanese/etc",
  "difficulty": "easy/medium/hard",
  "ingredients": [
    {"name": "Ingredient name", "quantity": 2, "unit": "pcs/kg/L/etc", "essential": true}
  ],
  "estimatedTime": "30 minutes"
}

Analyze now:`.trim();
}

export interface CravingAnalysisResult {
  dishName: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    essential: boolean;
  }>;
  estimatedTime: string;
}

export function validateCravingAnalysisResult(raw: string): CravingAnalysisResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const data = JSON.parse(cleaned);
    
    return {
      dishName: data.dishName,
      cuisine: data.cuisine || 'Unknown',
      difficulty: data.difficulty || 'medium',
      ingredients: (data.ingredients || []).map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
        essential: i.essential !== false
      })),
      estimatedTime: data.estimatedTime || '30 minutes'
    };
  } catch (e) {
    console.error('Failed to parse craving analysis:', e);
    return null;
  }
}

// ==================== 购物清单生成 Prompt ====================

export interface ShoppingListPromptData {
  currentInventory: FreshItem[];
  cravings: Array<{ dishName: string; ingredients: string[] }>;
  pantryStaples: Array<{ name: string; usageScore: number }>;
  expiringItems: FreshItem[];
}

export function generateShoppingListPrompt(data: ShoppingListPromptData): string {
  const { currentInventory, cravings, pantryStaples, expiringItems } = data;

  const inventoryList = currentInventory
    .map(i => `${i.name} (${i.quantity} ${i.unit}, ${i.freshness})`)
    .join('\n');

  const cravingsList = cravings
    .map(c => `${c.dishName}: needs [${c.ingredients.join(', ')}]`)
    .join('\n');

  const staplesList = pantryStaples
    .filter(s => s.usageScore < 30)
    .map(s => `${s.name} (score: ${s.usageScore}/100)`)
    .join('\n');

  const expiringList = expiringItems
    .map(i => `${i.name} (${i.freshness})`)
    .join('\n');

  return `
# Generate Smart Shopping List

## Current Inventory (Fresh Stock)
${inventoryList || '(empty)'}

## Active Cravings (User wants to cook)
${cravingsList || '(none)'}

## Low Pantry Staples (< 30 score)
${staplesList || '(all good)'}

## Expiring Soon (use-soon or priority)
${expiringList || '(none)'}

## Task
Generate a shopping list using this formula:
**Shopping List = Cravings需求 + Staples补货 - Current Inventory**

## Rules
1. For each craving, list MISSING ingredients only
2. Suggest recipes to use expiring items (if any)
3. Ask about low staples (don't auto-add)
4. Group by category (fresh/frozen/dry/dairy/meat)
5. Add "reason" field explaining WHY each item is needed

## Output Format (JSON only)
{
  "items": [
    {
      "name": "Item name",
      "quantity": 2,
      "unit": "kg",
      "category": "fresh",
      "reason": "为了做清蒸鱼",
      "priority": "high"
    }
  ],
  "stapleSuggestions": [
    {"name": "盐", "currentScore": 25, "question": "盐还够吗？"}
  ],
  "expirationRecipes": [
    {"recipe": "Recipe name", "uses": ["expiring item 1", "expiring item 2"]}
  ],
  "totalEstimatedCost": 50.00
}

Generate shopping list now:`.trim();
}

export interface ShoppingListResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    reason: string;
    priority: string;
  }>;
  stapleSuggestions: Array<{
    name: string;
    currentScore: number;
    question: string;
  }>;
  expirationRecipes: Array<{
    recipe: string;
    uses: string[];
  }>;
  totalEstimatedCost?: number;
}

export function validateShoppingListResult(raw: string): ShoppingListResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const data = JSON.parse(cleaned);
    
    return {
      items: data.items || [],
      stapleSuggestions: data.stapleSuggestions || [],
      expirationRecipes: data.expirationRecipes || [],
      totalEstimatedCost: data.totalEstimatedCost
    };
  } catch (e) {
    console.error('Failed to parse shopping list:', e);
    return null;
  }
}

// ==================== Receipt 价格学习 Prompt ====================

export function generateReceiptPricePrompt(): string {
  return `
# Receipt Price Learning Scanner

## Task
Extract items and prices from this receipt for price tracking ONLY.
DO NOT update inventory - this is for learning usual prices.

## Output Format (JSON only)
{
  "shopName": "Shop name",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "Item name",
      "quantity": 2,
      "unit": "kg",
      "unitPrice": 5.99,
      "totalPrice": 11.98
    }
  ],
  "totalAmount": 50.00,
  "scanQuality": "good"
}

Scan receipt now:`.trim();
}

export interface ReceiptPriceResult {
  shopName: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  scanQuality: 'good' | 'medium' | 'poor';
}

export function validateReceiptPriceResult(raw: string): ReceiptPriceResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const data = JSON.parse(cleaned);
    
    return {
      shopName: data.shopName || 'Unknown',
      date: data.date,
      items: (data.items || []).map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice)
      })),
      totalAmount: Number(data.totalAmount) || 0,
      scanQuality: data.scanQuality || 'medium'
    };
  } catch (e) {
    console.error('Failed to parse receipt:', e);
    return null;
  }
}

// ==================== AR 反向查菜谱 Prompt ====================

export function generateARRecipePrompt(
  scannedItem: string,
  currentInventory: FreshItem[]
): string {
  const inventoryList = currentInventory
    .map(i => i.name)
    .join(', ');

  return `
# AR Shopping Assistant - Reverse Recipe Lookup

## Scanned Item in Store
"${scannedItem}"

## User's Current Inventory at Home
${inventoryList || '(empty fridge)'}

## Task
Suggest 2-3 quick recipes that can be made if user buys this scanned item.
Prioritize recipes that USE existing inventory items.

## Output Format (JSON only)
{
  "scannedItem": "${scannedItem}",
  "recommendations": [
    {
      "recipe": "Recipe name",
      "matchScore": 85,
      "reason": "家里有牛排，买芦笋正好",
      "additionalNeeds": ["butter", "garlic"],
      "estimatedTime": "20 minutes"
    }
  ]
}

Suggest recipes now:`.trim();
}

export interface ARRecipeResult {
  scannedItem: string;
  recommendations: Array<{
    recipe: string;
    matchScore: number;
    reason: string;
    additionalNeeds: string[];
    estimatedTime: string;
  }>;
}

export function validateARRecipeResult(raw: string): ARRecipeResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AR recipe result:', e);
    return null;
  }
}

// ==================== 语音指令解析 Prompt ====================

export function generateVoiceParsePrompt(transcript: string): string {
  return `
# Parse Voice Command

## User said:
"${transcript}"

## Task
Determine intent and extract data.

## Supported Intents
1. "add-craving": User wants to eat something
   - Examples: "记一下想吃红烧肉", "周末想做冬阴功"
2. "add-staple": Reporting a staple is running low
   - Examples: "酱油没了", "盐快用完了"
3. "remove-item": Delete a craving
   - Examples: "删掉红烧肉", "不想吃冬阴功了"

## Output Format (JSON only)
{
  "intent": "add-craving/add-staple/remove-item/unknown",
  "confidence": 0.95,
  "extractedData": {
    "dishName": "红烧肉",
    "itemName": "酱油",
    "action": "remove"
  }
}

Parse now:`.trim();
}

export interface VoiceParseResult {
  intent: 'add-craving' | 'add-staple' | 'remove-item' | 'unknown';
  confidence: number;
  extractedData: {
    dishName?: string;
    itemName?: string;
    action?: string;
  };
}

export function validateVoiceParseResult(raw: string): VoiceParseResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse voice command:', e);
    return null;
  }
}
