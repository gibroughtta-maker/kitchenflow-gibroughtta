
// Core entities for the scanner module

export interface InventoryItem {
    id: string;
    name: string;
    quantity: string;
    quantityValue?: number;
    quantityUnit?: string;
    unitCost?: number;
    category: string;
    location: string;
    expiryDate: string;
    addedDate: string;
    minStockLevel?: number;
    supplier?: string;
    notes?: string;
    containerId?: string;
    containerName?: string;
    fillLevel?: FillLevel;
}

export type FillLevel = 'full' | 'medium' | 'low' | 'empty';

export type ScanMode = "receipt" | "fridge" | "sales";

export interface DictionaryItem {
    id: string;
    name: string;
    unit: string;
    category?: string;
}

export interface FridgeAuditResult {
    found: Array<{
        name: string;
        quantity: number;
        unit: string;
        confidence: number;
        notes?: string;
        label_weight?: string;
        brand?: string;
        expiry?: string;
    }>;
    notFound: string[];
    newItems: Array<{
        name: string;
        quantity: number;
        unit: string;
        confidence: number;
        label_weight?: string;
        brand?: string;
    }>;
    scanQuality: 'good' | 'medium' | 'poor';
}

export interface SalesReceipt {
    id: string;
    date: string;
    time: string;
    totalAmount: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}
