# Backend Integration Plan - KitchenFlow
> **Date**: 2026-01-20
> **Status**: Planning Phase
> **Backend Status**: ✅ Ready
> **Frontend Status**: Partial Integration Complete

---

## 🎯 Integration Goals

Integrate the completed Supabase backend with the React Native frontend.

---

## 📊 Current Status Analysis

### ✅ Already Integrated (Frontend)

| Feature | Status | Files |
|---------|--------|-------|
| Supabase Client | ✅ Working | `src/services/supabaseClient.ts` |
| Device Management | ✅ Working | `src/services/deviceService.ts`, `src/hooks/useDevice.ts` |
| Cravings CRUD | ✅ Working | `src/services/cravingsService.ts` |
| Shopping List CRUD | ✅ Working | `src/services/shoppingService.ts` |
| Realtime Subscription | ✅ Working | `src/hooks/useRealtimeList.ts` |
| Environment Variables | ✅ Configured | `.env` |

### ⚠️ Gaps & Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| Missing `pantry_staples` support | Can't manage pantry items | Medium |
| Type definitions scattered | Hard to maintain | Medium |
| Missing `is_online` status | No collaborative presence | Low |
| No share link joining flow | Can't join shared lists | High |
| Missing comprehensive types file | Type inconsistencies | Medium |

---

## 📋 Integration Tasks

### Phase 1: Verification & Cleanup

#### Task 1.1: Verify Database Connection
**Goal**: Ensure all tables are accessible and RLS policies work correctly

**Steps**:
1. Test device creation and retrieval
2. Test cravings CRUD operations
3. Test shopping list operations
4. Verify realtime subscriptions work
5. Check RLS policies allow expected operations

**Success Criteria**:
- All existing features work without errors
- Realtime updates appear within 1 second
- No permission errors in console

---

#### Task 1.2: Create Unified Types File
**Goal**: Centralize all type definitions matching backend schema

**Steps**:
1. Create `src/types/supabase.ts` with all database types
2. Update existing services to import from centralized types
3. Remove duplicate type definitions
4. Add missing fields (e.g., `is_online`, `image_url`)

**File**: `src/types/supabase.ts`
```typescript
// Device
export interface Device {
  id: string;
  nickname?: string;
  last_seen: string;
  created_at: string;
}

// Craving
export interface Craving {
  id: string;
  device_id: string;
  name: string;
  image_url?: string;
  source: 'voice' | 'share' | 'manual';
  note?: string;
  is_archived: boolean;
  created_at: string;
}

// Shopping List
export interface ShoppingList {
  id: string;
  owner_device_id: string;
  name: string;
  share_token?: string;
  expires_at?: string;
  created_at: string;
}

// Shopping Item
export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string;
  category: 'fresh' | 'pantry' | 'other';
  reason?: string;
  checked: boolean;
  checked_by?: string;
  checked_at?: string;
  sort_order: number;
  created_at: string;
}

// Shopping List Member
export interface ShoppingListMember {
  id: string;
  list_id: string;
  device_id: string;
  is_online: boolean;
  joined_at: string;
}

// Pantry Staple
export interface PantryStaple {
  id: string;
  device_id: string;
  name: string;
  score: number; // 0-100
  created_at: string;
  updated_at: string;
}
```

**Success Criteria**:
- All services use centralized types
- No TypeScript errors
- All database fields represented

---

### Phase 2: New Features

#### Task 2.1: Add Share Link Joining Flow
**Goal**: Allow users to join shopping lists via share links

**Steps**:
1. Create `joinShoppingList(shareToken, deviceId)` function
2. Add deep linking handler for `kitchenflow://join/:token`
3. Create JoinListScreen UI
4. Test joining flow between two devices

**Files**:
- `src/services/shoppingService.ts` (add function)
- `src/screens/JoinListScreen.tsx` (new)
- `App.tsx` (add deep link handler)

**Success Criteria**:
- User can scan/click share link
- User joins the list successfully
- User sees shared list items in realtime

---

#### Task 2.2: Add Pantry Staples Feature
**Goal**: Implement pantry inventory management

**Steps**:
1. Create `src/services/pantryService.ts`
2. Create `src/screens/PantryScreen.tsx`
3. Add pantry navigation option
4. Implement CRUD operations

**Files**:
- `src/services/pantryService.ts` (new)
- `src/screens/PantryScreen.tsx` (new)
- `src/components/PantryItemCard.tsx` (new)

**Success Criteria**:
- User can add/remove pantry items
- User can adjust stock scores (0-100)
- Pantry items persist across sessions

---

#### Task 2.3: Add Online Presence Indicators
**Goal**: Show which users are actively viewing shared lists

**Steps**:
1. Update `useRealtimeList` to track online status
2. Update presence on list enter/exit
3. Display online indicators in UI
4. Handle cleanup on app background/close

**Files**:
- `src/hooks/useRealtimeList.ts` (update)
- `src/components/ShoppingItemCard.tsx` (add indicator)

**Success Criteria**:
- Green dot shows when collaborator is online
- Status updates in real-time
- Proper cleanup when leaving

---

### Phase 3: Testing & Documentation

#### Task 3.1: Integration Testing
**Goal**: Verify all features work end-to-end

**Test Cases**:
1. **Single Device**:
   - Create device, add cravings, create shopping list
   - Add items, check/uncheck
   - Verify data persists after app restart

2. **Multi-Device**:
   - Device A creates and shares list
   - Device B joins via link
   - Both devices add/check items
   - Verify realtime sync
   - Verify presence indicators

3. **Error Handling**:
   - Test with invalid share tokens
   - Test with no internet connection
   - Test with expired share links

**Success Criteria**:
- All test cases pass
- No console errors
- Graceful error handling

---

#### Task 3.2: Update Documentation
**Goal**: Document integration for future maintenance

**Steps**:
1. Update API documentation with actual usage
2. Create troubleshooting guide
3. Document environment setup
4. Add code comments for complex logic

**Files**:
- `docs/API_USAGE.md` (new)
- `docs/TROUBLESHOOTING.md` (new)
- `README.md` (update)

**Success Criteria**:
- Clear setup instructions
- Common issues documented
- API examples provided

---

## 🔄 Implementation Order

### Sprint 1: Verification (Day 1)
1. Task 1.1: Verify Database Connection ✅
2. Task 1.2: Create Unified Types File

### Sprint 2: Critical Features (Day 2)
3. Task 2.1: Share Link Joining Flow (HIGH PRIORITY)

### Sprint 3: Additional Features (Day 3)
4. Task 2.2: Pantry Staples
5. Task 2.3: Online Presence

### Sprint 4: Quality (Day 4)
6. Task 3.1: Integration Testing
7. Task 3.2: Documentation

---

## 🎯 Success Metrics

- [ ] All database tables accessible
- [ ] All CRUD operations working
- [ ] Realtime sync < 1s latency
- [ ] Multi-device collaboration works
- [ ] Zero permission errors
- [ ] All TypeScript errors resolved
- [ ] Test coverage > 80%

---

## 🚨 Known Risks

| Risk | Mitigation |
|------|------------|
| RLS policy blocks legitimate operations | Test with multiple devices early |
| Realtime events delayed | Monitor latency, optimize queries |
| Type mismatches cause runtime errors | Create comprehensive type tests |
| Share link expiration confusing | Add clear UI indicators |

---

## 📞 Next Steps

1. **Immediate**: Run Task 1.1 (Database Verification)
2. **Today**: Complete Task 1.2 (Unified Types)
3. **Tomorrow**: Start Task 2.1 (Share Link Flow)

---

**Plan Owner**: Frontend Team
**Backend Contact**: Backend Team (via docs)
**Est. Completion**: 4 days
