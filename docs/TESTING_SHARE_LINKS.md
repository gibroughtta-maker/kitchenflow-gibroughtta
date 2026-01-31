# Share Link Testing Guide - Quick Start
> **Feature**: Share Link Joining Flow (Task 2.1)
> **Status**: Ready for Testing

---

## Prerequisites

### What You Need
1. **Two devices** (can be any combination):
   - Two physical phones
   - Two simulators/emulators
   - One phone + one simulator
   - One phone + Expo Go on another phone

2. **Both devices must have**:
   - Internet connection
   - KitchenFlow app installed
   - Access to the same Supabase backend

### Important: Deep Linking Requires Rebuild

Deep linking configuration requires a native rebuild, **not just a reload**:

```bash
cd kitchenflow-app

# Option 1: Using Expo Go (easiest for testing)
npx expo start

# Option 2: Development build (required for production testing)
npx expo prebuild
npx expo run:ios    # For iOS
npx expo run:android # For Android
```

**Note**: If using Expo Go, deep links will work but with the Expo Go URL scheme.

---

## Quick Test (5 minutes)

### Step 1: Start the App

The Expo server should be running. You should see a QR code in the terminal.

1. **On Device A** (the "creator"):
   - Scan the QR code with Expo Go (or use development build)
   - Wait for the app to load

2. **On Device B** (the "joiner"):
   - Scan the same QR code
   - Wait for the app to load

### Step 2: Generate a Share Link

On **Device A**:

1. Open the app
2. Navigate to **Shopping List** screen
3. **Currently**, there's no UI button yet to generate share links
4. We'll manually create a share link using the console

**Workaround for testing**: We need to temporarily add a share button or use the database test screen. Let me check if we can add a quick test function...

Actually, let's use a simpler approach for initial testing:

### Step 3: Manual Share Link Testing

Since we don't have a share button UI yet, let's test the deep link handling directly:

1. **Create a test share token in Supabase**:
   - Go to your Supabase dashboard
   - Open the SQL editor
   - Run this query:
   ```sql
   UPDATE shopping_lists
   SET share_token = 'TEST123456',
       expires_at = NOW() + INTERVAL '7 days'
   WHERE id = (SELECT id FROM shopping_lists LIMIT 1);
   ```

2. **Test the deep link**:
   - On **Device B**, open a note-taking app or browser
   - Create a link: `kitchenflow://join/TEST123456`
   - Tap the link

3. **Expected behavior**:
   - App should open
   - JoinListScreen should appear
   - Loading spinner shows
   - Success message appears
   - Auto-redirects to Shopping List screen

### Step 4: Verify It Worked

On **Device B**:
1. Navigate to Shopping List screen
2. You should see the items from Device A's list
3. Try adding a new item

On **Device A**:
1. The new item should appear in ~1-2 seconds (realtime sync!)

---

## Better Test (With Share Button)

### Quick Fix: Add Share Button to Shopping List

Let me add a share button to the ShoppingListScreen so you can test properly:

1. Open `src/screens/ShoppingListScreen.tsx`
2. Import the `createShareLink` function
3. Add a "Share" button to the header
4. When tapped, generate link and show to user

Would you like me to add this quick feature now so testing is easier?

---

## Test Scenarios to Verify

### ✅ Scenario 1: Successful Join
- [ ] Link opens the app
- [ ] Loading screen appears
- [ ] Success message shows
- [ ] Redirects to shopping list
- [ ] Can see shared items
- [ ] Realtime sync works

### ❌ Scenario 2: Invalid Link
- [ ] Link with invalid token shows error
- [ ] Error message is clear
- [ ] Retry button works
- [ ] Cancel button returns to home

### ❌ Scenario 3: Expired Link
- [ ] Expired link shows appropriate error
- [ ] Can't join with expired link

### ✅ Scenario 4: Already a Member
- [ ] Trying to join same list twice doesn't error
- [ ] Redirects to list normally

---

## Current Status

**What's Working**:
- ✅ Backend function `joinShoppingList()` implemented
- ✅ JoinListScreen UI created (loading/error/success states)
- ✅ Deep linking configured in App.tsx
- ✅ app.json configured with URI scheme
- ✅ TypeScript compilation passes

**What's Missing for Easy Testing**:
- ⚠️ No share button in ShoppingListScreen UI
- ⚠️ Can't easily generate share links from the app

**Quick Fixes Needed**:
1. Add share button to ShoppingListScreen (5 minutes)
2. Display generated link to user (5 minutes)
3. Add copy-to-clipboard functionality (5 minutes)

---

## Next Steps

### Option A: Test Now (Manual)
Use the SQL workaround above to test the join flow manually

### Option B: Add Share Button First (Recommended)
Let me add a share button to make testing easier, then test properly

**Which would you prefer?**

---

## Troubleshooting

### App doesn't open when tapping link
- Make sure you rebuilt the app (not just reloaded)
- Check that `app.json` has the scheme configured
- Try uninstalling and reinstalling the app

### Link shows "Invalid or expired"
- Verify the share token exists in database
- Check that `expires_at` is in the future
- Ensure you're using the exact token from the database

### Can't see other device's items
- Check realtime sync is working (run Database Test Screen)
- Verify both devices are members of the same list
- Check network connection

### App crashes when opening link
- Check terminal for error logs
- Verify `expo-linking` is installed
- Check navigation stack includes JoinList screen

---

## Quick Commands

```bash
# Start Expo server
cd kitchenflow-app
npx expo start

# Check for errors
npx tsc --noEmit

# Kill and restart server
# Press Ctrl+C, then:
npx expo start --clear

# View logs
# Logs appear in terminal where Expo is running
```
