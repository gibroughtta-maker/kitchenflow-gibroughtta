/**
 * Optimized Prompt Templates for Inventory Scanning
 */

import { DictionaryItem, FridgeAuditResult } from '../types';

export interface KnownItem {
    id?: string;
    name: string;
    unit: string;
    category?: string;
    typical_quantity?: string;
    typical_package_size?: string;
    visual_description?: string;
    aliases?: string[];
    container_id?: string;
    container_name?: string;
    container_capacity?: string;
}

export type ScanAreaType = 'storage' | 'prep' | 'fridge';
export type LanguageType = 'en' | 'zh';

export interface PromptOptions {
    imageCount: number;
    scanArea: ScanAreaType;
    knownItems: KnownItem[];
    language?: LanguageType;
}

const AREA_DESCRIPTIONS: Record<ScanAreaType, string> = {
    storage: 'dry storage with shelves',
    prep: 'prep station with containers',
    fridge: 'refrigerator/cold storage'
};

const ALLOWED_UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bag', 'bottle', 'pack', 'bunch'];

const FEW_SHOT_EXAMPLES = `
[Direct count]
{"items":[{"name":"Tofu","quantity":3,"unit":"box","confidence":0.95,"notes":"3 boxes visible"}],"scan_quality":"good"}

[Package calculation]
{"items":[{"name":"Rice","quantity":10,"unit":"kg","confidence":0.9,"notes":"2 bags × 5kg"}],"scan_quality":"good"}
`;

/**
 * Generate optimized scan prompt
 */
export function generateScanPrompt(options: PromptOptions): string {
    const { imageCount, scanArea, knownItems } = options;

    const knownItemsList = knownItems.length > 0
        ? knownItems.slice(0, 20).map(item => `${item.name}(${item.unit})`).join(', ')
        : 'identify all visible food items';

    const multiImageWarning = imageCount > 1
        ? `\n⚠️ ${imageCount} images of SAME area - count each item ONCE only!`
        : '';

    return `
# Restaurant Inventory Scanner
Count food items in ${AREA_DESCRIPTIONS[scanArea]}.${multiImageWarning}

## Known Items
${knownItemsList}

## Rules
1. COUNT visible items only - never guess hidden quantities
2. READ labels for weight/volume when visible
3. For stacks: count front row, note uncertainty
4. Confidence: 0.9+=clear, 0.7-0.9=partial, <0.7=uncertain

## Output (JSON only, no other text)
{"items":[{"name":"str","quantity":num,"unit":"${ALLOWED_UNITS.join('/')}","confidence":0-1,"notes":"how counted"}],"scan_quality":"good/medium/poor"}

## Examples
${FEW_SHOT_EXAMPLES}

Analyze now:`.trim();
}

/**
 * Detailed prompt for complex scenes
 */
export function generateDetailedScanPrompt(options: PromptOptions): string {
    const { imageCount, scanArea, knownItems } = options;

    const knownItemsList = knownItems.length > 0
        ? knownItems.map(item => `- ${item.name} (${item.unit})`).join('\n')
        : '- Identify all visible food items';

    return `
# Expert Restaurant Inventory Scanner

## Task
Analyze ${imageCount} image${imageCount > 1 ? 's' : ''} of ${AREA_DESCRIPTIONS[scanArea]} and count all food items.

## Known Items
${knownItemsList}

## Counting Method
1. Direct Count (visible items)
2. Label Reading (weight/volume)
3. Partial Visibility (estimate visibly only)

## Output Format
\`\`\`json
{
  "items": [
    {"name": "Item name", "quantity": number, "unit": "${ALLOWED_UNITS.join('/')}", "confidence": 0.0-1.0, "notes": "counting method"}
  ],
  "scan_quality": "good/medium/poor",
  "suggestions": ["optional improvements"]
}
\`\`\`

Analyze the image(s) now:`.trim();
}

/**
 * Generate Fridge Audit prompt
 */
export function generateFridgeAuditPrompt(options: {
    imageCount: number;
    dictionary: DictionaryItem[];
}): string {
    const { imageCount, dictionary } = options;

    const dictList = dictionary.length > 0
        ? dictionary.map(i => `${i.name}(${i.unit})`).join(', ')
        : '(no known items)';

    return `
# Fridge Inventory Audit with Label Reading

## Known Items (MATCH these names exactly):
${dictList}

## Task
1. Count ACTUAL visible quantities for each item
2. Use exact names from known items when matching
3. READ LABELS - extract weight, brand, and expiry if visible
4. Report NEW items not in the known list
5. Report items from known list that are NOT visible

## Output JSON (strict format)
{
  "found": [{
    "name": "exact name",
    "quantity": num,
    "unit": "can/bottle/box/pcs/kg/L",
    "confidence": 0-1,
    "label_weight": "330ml per can",
    "brand": "Brand",
    "expiry": "YYYY-MM-DD",
    "notes": "count notes"
  }],
  "not_found": ["names of known items not visible"],
  "new_items": [{
    "name": "descriptive name",
    "quantity": num,
    "unit": "unit",
    "confidence": 0-1,
    "label_weight": "label info",
    "brand": "brand"
  }],
  "scan_quality": "good/medium/poor"
}

Analyze:`.trim();
}

export interface ScanResultItem {
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
    notes?: string;
}

export interface ScanResult {
    items: ScanResultItem[];
    scan_quality: 'good' | 'medium' | 'poor';
    suggestions?: string[];
}

export function validateAndParseScanResult(raw: string): ScanResult | null {
    try {
        let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];

        const data = JSON.parse(cleaned);
        if (!data.items || !Array.isArray(data.items)) return null;

        const validItems: ScanResultItem[] = data.items
            .filter((item: any) => item.name && item.quantity > 0)
            .map((item: any) => ({
                name: item.name.trim(),
                quantity: Number(item.quantity),
                unit: (item.unit || 'pcs').trim().toLowerCase(),
                confidence: Number(item.confidence) || 0.7,
                notes: item.notes
            }));

        return {
            items: validItems,
            scan_quality: data.scan_quality || 'medium',
            suggestions: data.suggestions || []
        };
    } catch (e) {
        console.error('Failed to parse scan result:', e);
        return null;
    }
}

export function validateFridgeAuditResult(raw: string): FridgeAuditResult | null {
    try {
        let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];

        const data = JSON.parse(cleaned);

        const found = (data.found || []).map((i: any) => ({
            name: i.name,
            quantity: Number(i.quantity),
            unit: i.unit,
            confidence: Number(i.confidence) || 0.7,
            label_weight: i.label_weight,
            brand: i.brand,
            expiry: i.expiry,
            notes: i.notes
        }));

        const newItems = (data.new_items || []).map((i: any) => ({
            name: i.name,
            quantity: Number(i.quantity),
            unit: i.unit,
            confidence: Number(i.confidence) || 0.6,
            label_weight: i.label_weight,
            brand: i.brand
        }));

        return {
            found,
            notFound: data.not_found || [],
            newItems,
            scanQuality: data.scan_quality || 'medium'
        };
    } catch (e) {
        return null;
    }
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalPrice: number;
    confidence: number; // 0-1
    notes?: string;
}

export interface InvoiceScanResult {
    supplier?: string;
    invoiceNumber?: string;
    date?: string;
    items: InvoiceItem[];
    grandTotal?: number;
    scanQuality: 'good' | 'medium' | 'poor';
}

export function generateInvoiceScanPrompt(knownItems: string[] = []): string {
    const knownItemsList = knownItems.length > 0
        ? `Known items: ${knownItems.slice(0, 20).join(', ')}`
        : '';

    return `
  # Supplier Invoice/Delivery Note Scanner
  
  ## Task
  Extract:
  1. Supplier Name
  2. Invoice Number
  3. Date
  4. Line Items (Name, Qty, Unit, Unit Cost, Total Price)
  
  ${knownItemsList}
  
  ## Output Format (JSON only)
  {
    "supplier": "Supplier Name",
    "invoiceNumber": "INV-123",
    "date": "YYYY-MM-DD",
    "items": [
      {
        "name": "Item name",
        "quantity": 10,
        "unit": "kg",
        "unitCost": 5.99,
        "totalPrice": 59.90,
        "confidence": 0.9
      }
    ],
    "grandTotal": 100.00,
    "scanQuality": "good/medium/poor"
  }
  
  Analyze now:`.trim();
}

export function validateInvoiceScanResult(raw: string): InvoiceScanResult | null {
    try {
        let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];

        const data = JSON.parse(cleaned);

        const items = (data.items || []).map((i: any) => ({
            name: i.name,
            quantity: Number(i.quantity),
            unit: i.unit,
            unitCost: Number(i.unitCost) || 0,
            totalPrice: Number(i.totalPrice) || 0,
            confidence: Number(i.confidence) || 0.7,
            notes: i.notes
        }));

        return {
            supplier: data.supplier,
            invoiceNumber: data.invoiceNumber,
            date: data.date,
            items,
            grandTotal: data.grandTotal,
            scanQuality: data.scanQuality || 'medium'
        };
    } catch (e) {
        return null;
    }
}
