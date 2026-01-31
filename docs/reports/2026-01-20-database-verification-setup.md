# Database Verification Test Setup
> **Date**: 2026-01-20
> **Status**: ✅ Test Suite Created
> **Next**: Run tests in app

---

## 🎯 What Was Created

### 1. Database Verification Test Suite
**File**: `kitchenflow-app/src/tests/database-verification.ts`

Comprehensive test suite covering:
- ✅ Device Management (create, retrieve, update)
- ✅ Cravings CRUD (create, read, archive)
- ✅ Shopping List Operations (create, add items, toggle)
- ✅ Realtime Subscriptions (channel, events, cleanup)
- ✅ RLS Policies (read, insert, update permissions)

### 2. Database Test Screen
**File**: `kitchenflow-app/src/screens/DatabaseTestScreen.tsx`

Interactive UI for running tests:
- Run all tests with one button
- See real-time results
- View test summary
- Check detailed error messages

### 3. Integration with Settings
- Added "Developer Tools" section in Settings
- "Run Database Tests" button navigates to test screen
- Easy access for verification

---

## 📱 How to Run Tests

### Method 1: Via App UI (Recommended)

1. Open KitchenFlow app
2. Navigate to **Settings** ⚙️
3. Scroll to **Developer Tools** section
4. Tap **🧪 Run Database Tests**
5. Tap **Run All Tests** button
6. Wait for tests to complete (~10 seconds)
7. Review results

### Method 2: Programmatic

```typescript
import { runAllTests } from './src/tests/database-verification';

// Run all tests
const results = await runAllTests();

// Check console for detailed output
console.log(results);
```

---

## 📊 Test Coverage

| Test Suite | Tests | What It Verifies |
|------------|-------|------------------|
| **Device Management** | 3 | Device ID creation, storage, nickname updates |
| **Cravings CRUD** | 4 | Create, list, archive cravings |
| **Shopping Lists** | 5 | Create list, add items, toggle checked, verify checked_by |
| **Realtime** | 3 | Subscribe, receive events, unsubscribe |
| **RLS Policies** | 3 | Read, insert, update permissions |
| **Total** | **18** | Full backend integration |

---

## ✅ Expected Results

### All Tests Passing Means:

1. **Supabase Connection**: ✅ Working
2. **Environment Variables**: ✅ Correct
3. **Database Tables**: ✅ Accessible
4. **RLS Policies**: ✅ Configured properly
5. **Realtime**: ✅ Enabled and working
6. **CRUD Operations**: ✅ All functional

### If Any Tests Fail:

Check the error details in the test screen:
- **Permission errors**: RLS policies may need adjustment
- **Connection errors**: Check `.env` file
- **Timeout errors**: Check internet connection
- **Type errors**: Database schema may have changed

---

## 🧪 Test Details

### Suite 1: Device Management

```
✅ 1.1 Create/Get Device ID
✅ 1.2 Device exists in DB
✅ 1.3 Update device nickname
```

**What it tests:**
- Device ID is created on first launch
- Device ID is stored in AsyncStorage
- Device can be updated in database

### Suite 2: Cravings CRUD

```
✅ 2.1 Get cravings
✅ 2.2 Add craving
✅ 2.3 Verify craving in list
✅ 2.4 Archive craving
```

**What it tests:**
- Fetch all cravings for device
- Create new craving
- Craving appears in list
- Archive (soft delete) works

### Suite 3: Shopping List Operations

```
✅ 3.1 Create/Get shopping list
✅ 3.2 Add shopping item
✅ 3.3 Get shopping items
✅ 3.4 Toggle item checked
✅ 3.5 Verify checked_by field
```

**What it tests:**
- Default list creation
- Adding items to list
- Retrieving items
- Checking/unchecking items
- Tracking who checked items

### Suite 4: Realtime Subscriptions

```
✅ 4.1 Subscribe to channel
✅ 4.2 Receive realtime event
✅ 4.3 Unsubscribe cleanup
```

**What it tests:**
- Channel subscription works
- Events are received in < 2 seconds
- Proper cleanup on unsubscribe

### Suite 5: RLS Policies

```
✅ 5.1 Read own cravings
✅ 5.2 Insert own cravings
✅ 5.3 Update own cravings
```

**What it tests:**
- Device can read its own data
- Device can insert new data
- Device can update its own data
- RLS doesn't block legitimate operations

---

## 🚀 Next Steps

### Immediate
1. **Run tests** to verify integration
2. **Fix any failures** before proceeding
3. **Document results** for team

### After Tests Pass
Continue with **Task 1.2**: Create Unified Types File
- Centralize all type definitions
- Remove duplicates
- Add missing fields

---

## 📁 Files Modified

```
kitchenflow-app/
├── src/
│   ├── tests/
│   │   └── database-verification.ts     ← NEW
│   └── screens/
│       ├── DatabaseTestScreen.tsx       ← NEW
│       └── SettingsScreen.tsx           ← UPDATED
└── App.tsx                              ← UPDATED
```

---

**Status**: ✅ Ready for testing
**Estimated Runtime**: ~10 seconds
**Requires**: Active internet connection, valid Supabase credentials
