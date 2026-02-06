/**
 * Phase 5：统一数据入口
 * 按 VITE_USE_BACKEND + VITE_API_BASE_URL 选择直连 Gemini/storage 或后端 REST；对外接口不变，便于切换。
 */
import { isBackendConfigured } from './apiClient';
import * as gemini from './gemini';
import * as storage from './storage';
import * as backendApi from './backendApi';

function useBackend(): boolean {
  return isBackendConfigured();
}

// --- 想吃 / 食谱 / 扫描（与 gemini 同签名）---

export async function identifyCravingFromText(text: string): Promise<{ foodName: string } | null> {
  return useBackend() ? backendApi.identifyCravingFromText(text) : gemini.identifyCravingFromText(text);
}

export async function identifyCravingFromLink(url: string): Promise<{ foodName: string } | null> {
  return useBackend() ? backendApi.identifyCravingFromLink(url) : gemini.identifyCravingFromLink(url);
}

export async function getRecipeDetails(foodName: string) {
  return useBackend() ? backendApi.getRecipeDetails(foodName) : gemini.getRecipeDetails(foodName);
}

export async function scanFridge(images: { base64: string; mimeType: string }[]) {
  if (useBackend()) return backendApi.scanFridge(images);
  return gemini.scanFridge(images);
}

// --- 购物清单（统一为 Promise，无后端时用 storage 同步包一层）---

export async function getShoppingList(): Promise<import('../types').ShoppingItem[]> {
  return useBackend() ? backendApi.getShoppingList() : Promise.resolve(storage.getShoppingList());
}

export async function setShoppingList(items: import('../types').ShoppingItem[]): Promise<void> {
  if (useBackend()) return backendApi.setShoppingList(items);
  storage.setShoppingList(items);
}

// --- 库存（同上）---

export async function getInventory(): Promise<import('../types').InventoryItem[]> {
  return useBackend() ? backendApi.getInventory() : Promise.resolve(storage.getInventory());
}

export async function setInventory(items: import('../types').InventoryItem[]): Promise<void> {
  if (useBackend()) return backendApi.setInventory(items);
  storage.setInventory(items);
}
