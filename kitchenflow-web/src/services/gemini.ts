import type { FreshItem, FridgeSnapshotResult, CravingAnalysisResult } from '../types';

const GEMINI_MODEL = 'gemini-2.0-flash';

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('请设置 .env 中的 VITE_GEMINI_API_KEY');
  return key;
}

async function callGemini(prompt: string, images?: { base64: string; mimeType: string }[]): Promise<string> {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [{ text: prompt }];
  if (images?.length) {
    for (const img of images) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini 未返回文本');
  return text;
}

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
      .filter((i: any) => i.name && i.quantity > 0)
      .map((i: any) => ({
        name: String(i.name).trim(),
        quantity: Number(i.quantity),
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
  const text = await callGemini(FRIDGE_PROMPT, images);
  const result = parseFridgeResult(text);
  if (!result) throw new Error('解析扫描结果失败');
  return result;
}

function cravingPrompt(dishName: string): string {
  return `# Analyze Dish Ingredients
Dish: "${dishName}"
Extract essential ingredients for 2-3 servings. Output JSON only:
{
  "dishName": "${dishName}",
  "cuisine": "string",
  "difficulty": "easy/medium/hard",
  "requiredIngredients": ["Ingredient 1", "Ingredient 2"],
  "estimatedTime": "30 minutes",
  "servings": 3
}
Analyze now:`;
}

function parseCravingResult(raw: string): CravingAnalysisResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    const data = JSON.parse(cleaned);
    if (!data.dishName || !Array.isArray(data.requiredIngredients)) return null;
    return {
      dishName: data.dishName,
      requiredIngredients: data.requiredIngredients,
      cuisine: data.cuisine,
      difficulty: data.difficulty,
      estimatedTime: data.estimatedTime,
      servings: data.servings,
    };
  } catch {
    return null;
  }
}

export async function analyzeCraving(dishName: string): Promise<CravingAnalysisResult> {
  const text = await callGemini(cravingPrompt(dishName.trim()));
  const result = parseCravingResult(text);
  if (!result) throw new Error('解析菜谱结果失败');
  return result;
}
