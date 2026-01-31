import { DictionaryItem, FridgeAuditResult, SalesReceipt } from '../types';
import {
    generateFridgeAuditPrompt,
    generateGraphPrompt, // Placeholder if needed, but not used here
    generateInvoiceScanPrompt,
    generateScanPrompt,
    validateAndParseScanResult,
    validateFridgeAuditResult,
    validateInvoiceScanResult
} from './promptTemplates';

export interface ScannerConfig {
    apiKey: string;
    model?: string; // e.g., 'gemini-1.5-flash-latest'
}

let globalConfig: ScannerConfig = {
    apiKey: '',
    model: 'gemini-1.5-flash',
};

export const configureScanner = (config: ScannerConfig) => {
    globalConfig = { ...globalConfig, ...config };
};

const callGeminiDirect = async (payload: {
    prompt: string;
    images?: Array<{ base64: string; mimeType: string }>;
}): Promise<string> => {
    if (!globalConfig.apiKey) {
        throw new Error("Gemini API Key is missing. Please call configureScanner({ apiKey: '...' }) first.");
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
            const err = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error("Gemini API Call Failed", error);
        throw error;
    }
};

/**
 * 1. Inventory Scan (Single Image)
 */
export const analyzeInventoryImage = async (
    base64Image: string,
    mimeType: string,
    dictionary: any[] = [] // Kept for compatibility, but raw strings preferred
): Promise<any[]> => {
    const prompt = generateScanPrompt({
        imageCount: 1,
        scanArea: 'storage',
        knownItems: dictionary.map(d => ({ name: d, unit: 'pcs' }))
    });

    const text = await callGeminiDirect({
        prompt,
        images: [{ base64: base64Image, mimeType }]
    });

    const result = validateAndParseScanResult(text);
    return result?.items || [];
};

/**
 * 2. Fridge Audit (Multi-Image + Dictionary)
 */
export const analyzeFridgeAudit = async (
    images: Array<{ base64: string; mimeType: string }>,
    dictionary: DictionaryItem[] = []
): Promise<FridgeAuditResult | null> => {
    const prompt = generateFridgeAuditPrompt({
        imageCount: images.length,
        dictionary
    });

    const text = await callGeminiDirect({
        prompt,
        images
    });

    return validateFridgeAuditResult(text);
};

/**
 * 3. Invoice / Receipt Scan
 */
export const analyzeInvoice = async (
    base64Image: string,
    mimeType: string,
    knownItems: string[] = []
) => {
    const prompt = generateInvoiceScanPrompt(knownItems);

    const text = await callGeminiDirect({
        prompt,
        images: [{ base64: base64Image, mimeType }]
    });

    return validateInvoiceScanResult(text);
};

/**
 * 4. Simple POS Receipt (Legacy support from original code)
 */
export const analyzePOSReceipt = async (base64Image: string, mimeType: string): Promise<Partial<SalesReceipt>> => {
    const prompt = `
      Analyze this restaurant POS receipt. 
      Extract total amount, date (yyyy-mm-dd), time, and items.
      Return JSON: { "date": "...", "time": "...", "totalAmount": 0, "items": [{"name": "...", "quantity": 1, "price": 0}] }
    `;

    const text = await callGeminiDirect({
        prompt,
        images: [{ base64: base64Image, mimeType }]
    });

    try {
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        return JSON.parse(cleaned);
    } catch (e) {
        return {};
    }
};
