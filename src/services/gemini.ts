import { GoogleGenAI } from '@google/genai';
import type { FreshItem, FridgeSnapshotResult, RecipeDetails } from '../types';

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('请设置 .env 中的 VITE_GEMINI_API_KEY');
  return key;
}

let ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!ai) ai = new GoogleGenAI({ apiKey: getApiKey() });
  return ai;
}

// --- 与 AI Studio 完全一致的 API（想吃 / 食谱）---

export async function identifyCravingFromText(textInput: string): Promise<{ foodName: string } | null> {
  try {
    const response = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `The user typed: "${textInput}". Identify the specific food item or dish they are craving. If they typed 'I want a burger', extract 'Burger'. Return the result in JSON format: { "foodName": "Dish Name" }.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    if (data?.foodName && typeof data.foodName === 'string') return { foodName: data.foodName.trim() };
    return null;
  } catch (error) {
    console.error('Gemini Text Error:', error);
    return null;
  }
}

export async function identifyCravingFromLink(url: string): Promise<{ foodName: string } | null> {
  try {
    const response = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `The user provided this recipe or food link: "${url}". Identify the food item or dish name from the URL structure or likely content. Return the result in JSON format: { "foodName": "Dish Name" }.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    if (data?.foodName && typeof data.foodName === 'string') return { foodName: data.foodName.trim() };
    return null;
  } catch (error) {
    console.error('Gemini Link Error:', error);
    return null;
  }
}

export async function getRecipeDetails(foodName: string): Promise<RecipeDetails | null> {
  try {
    const response = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a recipe card for "${foodName}". Provide a short list of key ingredients (max 5) with a matching Material Symbol icon name for each. Provide 3 short, simplified cooking steps.
Return in JSON format matching this structure:
{
  "dishName": "String",
  "cuisine": "String (e.g. Thai Cuisine)",
  "cookingTime": "String (e.g. 25 mins)",
  "ingredients": [ {"name": "Ingredient Name", "icon": "icon_name"} ],
  "steps": ["Step 1...", "Step 2...", "Step 3..."]
}
`,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    if (!data?.dishName || !Array.isArray(data?.ingredients) || !Array.isArray(data?.steps)) return null;
    return {
      dishName: String(data.dishName).trim(),
      cuisine: String(data.cuisine ?? '').trim(),
      cookingTime: String(data.cookingTime ?? '').trim(),
      ingredients: (data.ingredients as any[]).map((i: any) => ({
        name: String(i?.name ?? '').trim(),
        icon: i?.icon ? String(i.icon) : undefined,
      })),
      steps: (data.steps as any[]).map((s: any) => String(s ?? '').trim()),
    };
  } catch (error) {
    console.error('Gemini Recipe Error:', error);
    return null;
  }
}

// --- 冰箱扫描：用 SDK 发图 + 结构化 JSON prompt，保留现有 FridgeSnapshotResult ---

const FRIDGE_PROMPT = `# KitchenFlow - Smart Fridge Scanner
Identify TOP 5-10 CORE ingredients only. Ignore trivial items.
Focus on MAIN ingredients (vegetables, proteins, dairy, staples). IGNORE condiment bottles, sauce jars, small packets.
Assess freshness: fresh (vibrant), use-soon (slight wilting), priority (use today).
Output JSON only, no markdown:
{
  "items": [
    {
      "name": "Baby Spinach",
      "quantity": 1,
      "unit": "bag",
      "freshness": "use-soon",
      "confidence": 0.9,
      "visualNotes": "optional"
    }
  ],
  "scanQuality": "good"
}
Analyze the image(s) now:`;

function parseFridgeResult(raw: string): FridgeSnapshotResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    const data = JSON.parse(cleaned);
    if (!data.items || !Array.isArray(data.items)) return null;
    const items: FreshItem[] = data.items
      .filter((i: any) => i.name && (i.quantity ?? 0) > 0)
      .map((i: any) => ({
        name: String(i.name).trim(),
        quantity: Number(i.quantity ?? 1),
        unit: (i.unit || 'pcs').trim(),
        freshness: i.freshness || 'fresh',
        confidence: Number(i.confidence) || 0.7,
        visualNotes: i.visualNotes,
      }));
    return { items, scanQuality: data.scanQuality || 'medium' };
  } catch {
    return null;
  }
}

export async function scanFridge(images: { base64: string; mimeType: string }[]): Promise<FridgeSnapshotResult> {
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 } as const,
    })),
    { text: FRIDGE_PROMPT },
  ];
  const response = await getClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: { responseMimeType: 'application/json' },
  });
  const text = response.text;
  if (!text) throw new Error('Gemini 未返回扫描结果');
  const result = parseFridgeResult(text);
  if (!result) throw new Error('解析扫描结果失败');
  return result;
}
