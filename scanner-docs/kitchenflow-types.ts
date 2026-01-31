/**
 * KitchenFlow Type Definitions
 * 简化版类型，符合"不记账，只决策"理念
 */

// ==================== 核心数据类型 ====================

/**
 * 新鲜食材项（来自冰箱快照）
 */
export interface FreshItem {
  name: string;
  quantity: number;
  unit: string;
  freshness: 'fresh' | 'use-soon' | 'priority';  // RGB等价：绿/黄/红
  confidence: number;  // 0-1
  visualNotes?: string;  // "叶子有点蔫", "表面有斑点"
  imageRegion?: BoundingBox;  // 用于纠错UI (v1.1)
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 冰箱快照（动态库存）
 * 生命周期：24小时后自动失效
 */
export interface FridgeSnapshot {
  id: string;
  userId: string;
  timestamp: Date;
  expiresAt: Date;       // 默认 timestamp + 24h
  items: FreshItem[];
  scanQuality: 'good' | 'medium' | 'poor';
  imageUrls?: string[];  // 可选：保存原图用于纠错
}

/**
 * 馋念清单（即时需求池）
 */
export interface Craving {
  id: string;
  userId: string;
  dishName: string;
  source: 'voice' | 'link' | 'manual';  // 来源追踪
  createdAt: Date;
  fulfilled: boolean;  // 购买后标记为true
  requiredIngredients?: string[];  // 由Gemini解析菜谱得出
  cuisine?: string;  // 可选：菜系分类
  difficulty?: 'easy' | 'medium' | 'hard';  // 可选：难度
}

/**
 * 常备品库（耐用品管理）
 */
export interface PantryStaple {
  id: string;
  userId: string;
  name: string;
  category: 'oil' | 'sauce' | 'spice' | 'grain' | 'other';
  usageScore: number;    // 0-100，每次烹饪扣减
  alertThreshold: number; // 默认30，低于此值时询问
  lastUpdated: Date;
  typical_decay_rate?: number;  // 每次使用扣减多少分
}

// ==================== 购物清单相关 ====================

/**
 * 购物清单项
 */
export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: 'fresh' | 'frozen' | 'dry' | 'dairy' | 'meat';
  reason: string;  // "为了做清蒸鱼", "酱油快用完了"
  usualShop?: string;  // 从Receipt学习得来
  priority: 'high' | 'medium' | 'low';
  estimatedPrice?: number;
}

/**
 * 完整购物清单
 */
export interface ShoppingList {
  id: string;
  userId: string;
  createdAt: Date;
  items: ShoppingItem[];
  activatedCravings: string[];  // Craving IDs
  totalEstimatedCost?: number;
  status: 'draft' | 'confirmed' | 'shopping' | 'completed';
}

// ==================== 菜谱相关 ====================

/**
 * 智能菜谱推荐
 */
export interface RecipeRecommendation {
  recipeName: string;
  cuisine: string;
  matchScore: number;  // 0-100，库存匹配度
  requiredIngredients: string[];
  availableIngredients: string[];
  missingIngredients: string[];
  estimatedTime: string;  // "30分钟"
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;  // "家里有牛排，买芦笋正好"
}

/**
 * 过期食材启发菜单
 */
export interface ExpirationMenu {
  expiringItems: FreshItem[];
  suggestedRecipes: RecipeRecommendation[];
  urgency: 'today' | 'this-week' | 'next-week';
}

// ==================== 商店信息 ====================

/**
 * 商店信息（从Google Places API获取）
 */
export interface ShopInfo {
  name: string;
  placeId: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  openingHours?: {
    weekdayText: string[];
    isOpenNow: boolean;
  };
  categories: string[];  // ["supermarket", "grocery"]
  userNotes?: string;  // 用户备注："蔬菜最新鲜"
}

/**
 * 购物路线
 */
export interface ShoppingRoute {
  shops: ShopInfo[];
  totalDistance: number;  // 米
  totalDuration: number;  // 秒
  waypoints: Array<{
    shop: ShopInfo;
    items: ShoppingItem[];
    arrivalTime?: Date;
  }>;
  mapUrl: string;  // Google Maps URL
}

// ==================== Receipt 相关 ====================

/**
 * 收据扫描结果（仅用于学习）
 */
export interface ReceiptScanResult {
  id: string;
  userId: string;
  shopName: string;
  date: Date;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  scanQuality: 'good' | 'medium' | 'poor';
  createdAt: Date;
}

// ==================== 语音输入相关 ====================

/**
 * 语音指令解析结果
 */
export interface VoiceCommandResult {
  intent: 'add-craving' | 'add-staple' | 'remove-item' | 'unknown';
  confidence: number;
  extractedData: {
    dishName?: string;
    itemName?: string;
    action?: string;
  };
  rawTranscript: string;
}

// ==================== Supabase 数据库类型 ====================

/**
 * Database schema types for Supabase
 */
export interface Database {
  public: {
    Tables: {
      fridge_snapshots: {
        Row: {
          id: string;
          user_id: string;
          items: FreshItem[];
          scan_quality: 'good' | 'medium' | 'poor';
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fridge_snapshots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['fridge_snapshots']['Insert']>;
      };
      cravings: {
        Row: {
          id: string;
          user_id: string;
          dish_name: string;
          source: 'voice' | 'link' | 'manual';
          required_ingredients: string[] | null;
          fulfilled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cravings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cravings']['Insert']>;
      };
      pantry_staples: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          usage_score: number;
          alert_threshold: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pantry_staples']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pantry_staples']['Insert']>;
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          items: ShoppingItem[];
          activated_cravings: string[];
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopping_lists']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shopping_lists']['Insert']>;
      };
      receipt_scans: {
        Row: {
          id: string;
          user_id: string;
          shop_name: string;
          date: string;
          items: any[];
          total_amount: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['receipt_scans']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['receipt_scans']['Insert']>;
      };
    };
  };
}

// ==================== API Response 类型 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
