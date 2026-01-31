/**
 * KitchenFlow Scanner Service
 * 基于原 scannerService.ts，适配 KitchenFlow 需求
 */

import { FreshItem } from '../../../kitchenflow-types';
import {
  generateKitchenFlowPrompt,
  validateKitchenFlowResult,
  generateCravingAnalysisPrompt,
  validateCravingAnalysisResult,
  CravingAnalysisResult,
  generateShoppingListPrompt,
  validateShoppingListResult,
  ShoppingListPromptData,
  ShoppingListResult,
  generateReceiptPricePrompt,
  validateReceiptPriceResult,
  ReceiptPriceResult,
  generateARRecipePrompt,
  validateARRecipeResult,
  ARRecipeResult,
  generateVoiceParsePrompt,
  validateVoiceParseResult,
  VoiceParseResult
} from './kitchenflow-prompts';

// ==================== Configuration ====================

export interface KitchenFlowConfig {
  apiKey: string;
  model?: string;
}

let globalConfig: KitchenFlowConfig = {
  apiKey: '',
  model: 'gemini-1.5-flash',
};

export const configureKitchenFlow = (config: Partial<KitchenFlowConfig>) => {
  globalConfig = { ...globalConfig, ...config };
};

// ==================== Gemini API Caller ====================

interface GeminiPayload {
  prompt: string;
  images?: Array<{ base64: string; mimeType: string }>;
}

const callGemini = async (payload: GeminiPayload): Promise<string> => {
  if (!globalConfig.apiKey) {
    throw new Error(
      "Gemini API Key missing. Call configureKitchenFlow({ apiKey: '...' }) first."
    );
  }

  const model = globalConfig.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${globalConfig.apiKey}`;

  const contents = [
    {
      parts: [
        { text: payload.prompt },
        ...(payload.images || []).map(img => ({
          inline_data: {
            mime_type: img.mimeType,
            data: img.base64
          }
        }))
      ]
    }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    return text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
};

// ==================== KitchenFlow 核心功能 ====================

/**
 * 1. 冰箱快照扫描
 * 返回 Top 5-10 核心食材 + 新鲜度评估
 */
export const scanFridgeSnapshot = async (
  images: Array<{ base64: string; mimeType: string }>
): Promise<{
  items: FreshItem[];
  scanQuality: 'good' | 'medium' | 'poor';
} | null> => {
  const prompt = generateKitchenFlowPrompt(images.length);

  const text = await callGemini({
    prompt,
    images
  });

  return validateKitchenFlowResult(text);
};

/**
 * 2. Craving 菜谱分析
 * 解析用户想吃的菜需要哪些食材
 */
export const analyzeCraving = async (
  dishName: string
): Promise<CravingAnalysisResult | null> => {
  const prompt = generateCravingAnalysisPrompt(dishName);

  const text = await callGemini({ prompt });

  return validateCravingAnalysisResult(text);
};

/**
 * 3. 生成智能购物清单
 * 核心算法：Cravings需求 + Staples补货 - Current Inventory
 */
export const generateSmartShoppingList = async (
  data: ShoppingListPromptData
): Promise<ShoppingListResult | null> => {
  const prompt = generateShoppingListPrompt(data);

  const text = await callGemini({ prompt });

  return validateShoppingListResult(text);
};

/**
 * 4. Receipt 价格学习扫描
 * 仅用于价格追踪，不更新库存
 */
export const scanReceiptForPrices = async (
  base64Image: string,
  mimeType: string
): Promise<ReceiptPriceResult | null> => {
  const prompt = generateReceiptPricePrompt();

  const text = await callGemini({
    prompt,
    images: [{ base64: base64Image, mimeType }]
  });

  return validateReceiptPriceResult(text);
};

/**
 * 5. AR 反向查菜谱
 * 在超市扫描食材，推荐可以做的菜
 */
export const scanItemForRecipes = async (
  scannedItem: string,
  currentInventory: FreshItem[]
): Promise<ARRecipeResult | null> => {
  const prompt = generateARRecipePrompt(scannedItem, currentInventory);

  const text = await callGemini({ prompt });

  return validateARRecipeResult(text);
};

/**
 * 6. 语音指令解析
 * 解析 Siri/Google Assistant 语音输入
 */
export const parseVoiceCommand = async (
  transcript: string
): Promise<VoiceParseResult | null> => {
  const prompt = generateVoiceParsePrompt(transcript);

  const text = await callGemini({ prompt });

  return validateVoiceParseResult(text);
};

// ==================== 辅助函数 ====================

/**
 * 批量分析多个 Cravings
 */
export const analyzeCravingsBatch = async (
  dishNames: string[]
): Promise<CravingAnalysisResult[]> => {
  const results = await Promise.allSettled(
    dishNames.map(dish => analyzeCraving(dish))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<CravingAnalysisResult | null> => 
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value!);
};

/**
 * 检查食材新鲜度并排序
 */
export const sortByFreshness = (items: FreshItem[]): {
  fresh: FreshItem[];
  useSoon: FreshItem[];
  priority: FreshItem[];
} => {
  return {
    fresh: items.filter(i => i.freshness === 'fresh'),
    useSoon: items.filter(i => i.freshness === 'use-soon'),
    priority: items.filter(i => i.freshness === 'priority')
  };
};

/**
 * 计算库存匹配度
 */
export const calculateMatchScore = (
  requiredIngredients: string[],
  currentInventory: FreshItem[]
): number => {
  if (requiredIngredients.length === 0) return 0;

  const inventoryNames = currentInventory.map(i => i.name.toLowerCase());
  
  const matches = requiredIngredients.filter(req =>
    inventoryNames.some(inv => 
      inv.includes(req.toLowerCase()) || req.toLowerCase().includes(inv)
    )
  );

  return Math.round((matches.length / requiredIngredients.length) * 100);
};

/**
 * 提取缺失食材
 */
export const findMissingIngredients = (
  requiredIngredients: string[],
  currentInventory: FreshItem[]
): string[] => {
  const inventoryNames = currentInventory.map(i => i.name.toLowerCase());
  
  return requiredIngredients.filter(req =>
    !inventoryNames.some(inv => 
      inv.includes(req.toLowerCase()) || req.toLowerCase().includes(inv)
    )
  );
};

// ==================== 错误处理包装 ====================

export class KitchenFlowError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'PARSE_ERROR' | 'CONFIG_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'KitchenFlowError';
  }
}

/**
 * 带错误处理的扫描包装
 */
export const safeScanFridgeSnapshot = async (
  images: Array<{ base64: string; mimeType: string }>
): Promise<{
  success: boolean;
  data?: { items: FreshItem[]; scanQuality: string };
  error?: string;
}> => {
  try {
    const result = await scanFridgeSnapshot(images);
    
    if (!result) {
      return {
        success: false,
        error: 'Failed to parse scan result'
      };
    }

    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Scan failed'
    };
  }
};
