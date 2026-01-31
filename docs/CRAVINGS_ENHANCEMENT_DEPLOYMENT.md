# Cravings Enhancement Deployment Guide

## 🎯 Overview

This deployment adds **complete AI analysis** and **high-quality images** to the Cravings feature.

### ✨ New Features

1. **Complete Recipe Data Storage**
   - Cuisine type (Chinese, Italian, etc.)
   - Difficulty level (easy, medium, hard)
   - Required ingredients with quantities
   - Estimated cooking time
   - Instructions (optional)
   - Source URL

2. **High-Quality Image Fetching**
   - Strategy 1: Extract from recipe URL (web scraping)
   - Strategy 2: Unsplash API (high-quality food photography)
   - Strategy 3: Pexels API (alternative source)
   - Strategy 4: Placeholder fallback

3. **Enhanced Recipe Detail Screen**
   - Beautiful metadata display (cuisine, difficulty, time)
   - Color-coded difficulty badges
   - Formatted ingredient lists
   - Source link button

---

## 📋 Deployment Steps

### **Step 1: Run Database Migration**

Execute the SQL migration in your Supabase dashboard:

```bash
# File location
docs/database/migration-cravings-enhanced.sql
```

**What it does:**
- Adds 6 new columns to `cravings` table
- Creates indexes for better performance
- Updates RPC function `insert_craving`

**Verification:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cravings' 
ORDER BY ordinal_position;
```

Expected new columns:
- `cuisine` (TEXT)
- `difficulty` (TEXT with CHECK constraint)
- `required_ingredients` (JSONB)
- `estimated_time` (TEXT)
- `instructions` (TEXT)
- `source_url` (TEXT)

---

### **Step 2: Configure Image APIs (Optional)**

For better image quality, add API keys to your environment:

#### **Unsplash API** (Recommended)
1. Sign up at https://unsplash.com/developers
2. Create a new application
3. Copy your Access Key
4. Add to `imageService.ts`:
   ```typescript
   const UNSPLASH_ACCESS_KEY = 'YOUR_ACCESS_KEY_HERE';
   ```

**Free Tier:** 50 requests/hour

#### **Pexels API** (Optional)
1. Sign up at https://www.pexels.com/api/
2. Get your API key
3. Add to `imageService.ts`:
   ```typescript
   const PEXELS_API_KEY = 'YOUR_API_KEY_HERE';
   ```

**Free Tier:** 200 requests/hour

**Note:** Without API keys, the app will use Unsplash Source (no auth required) which provides random food images.

---

### **Step 3: Restart Metro Bundler**

```bash
cd kitchenflow-app
npx expo start --clear
```

---

## 🧪 Testing Checklist

### **Test 1: Add Craving from Dish Name**

1. Open Cravings screen
2. Type a dish name (e.g., "宫保鸡丁" or "Kung Pao Chicken")
3. Click "Add"
4. Wait for AI analysis (5-10 seconds)
5. **Expected:**
   - ✅ Success message appears
   - ✅ Craving card shows with image
   - ✅ Click card to view details
   - ✅ Details show: cuisine, difficulty, time, ingredients

### **Test 2: Add Craving from Recipe Link**

1. Copy a recipe URL (e.g., from YouTube, Instagram, or food blog)
2. Open Cravings screen
3. Click "📋 Paste" button
4. Confirm to analyze
5. **Expected:**
   - ✅ AI extracts dish name from URL
   - ✅ High-quality image extracted from URL (if available)
   - ✅ Full recipe analysis saved
   - ✅ Source URL stored and accessible

### **Test 3: View Recipe Details**

1. Click any craving card
2. **Expected:**
   - ✅ Cover image displays
   - ✅ Metadata chips show (cuisine, difficulty, time)
   - ✅ Difficulty badge color-coded:
     - Green (😊) for easy
     - Orange (🤔) for medium
     - Red (😰) for hard
   - ✅ Ingredients list formatted with quantities
   - ✅ "View Original Recipe" button works (if from URL)

### **Test 4: Image Quality**

Check image sources in console logs:

```javascript
// Look for these logs
console.log('Image source:', imageResult.source);
// Possible values:
// - 'url_extract' (best - from recipe URL)
// - 'unsplash' (high quality)
// - 'pexels' (high quality)
// - 'placeholder' (fallback)
```

**Goal:** Most images should be `url_extract` or `unsplash`/`pexels`.

### **Test 5: Database Verification**

Check Supabase dashboard:

```sql
SELECT 
  name,
  cuisine,
  difficulty,
  estimated_time,
  jsonb_array_length(required_ingredients) as ingredient_count,
  image_url IS NOT NULL as has_image,
  source_url IS NOT NULL as has_source
FROM cravings
WHERE is_archived = false
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ All new cravings have `cuisine`, `difficulty`, `estimated_time`
- ✅ `required_ingredients` is valid JSONB array
- ✅ Most have `image_url`
- ✅ Cravings from links have `source_url`

---

## 🐛 Troubleshooting

### **Issue: No images appear**

**Cause:** API keys not configured or rate limit exceeded

**Solution:**
1. Check console for errors
2. Verify API keys in `imageService.ts`
3. If rate limited, wait 1 hour or use alternative API
4. Fallback will use Unsplash Source (no auth needed)

### **Issue: Database insert fails**

**Error:** `column "cuisine" does not exist`

**Solution:**
1. Verify migration ran successfully
2. Check Supabase logs
3. Re-run migration script

### **Issue: TypeScript errors**

**Error:** `Property 'cuisine' does not exist on type 'Craving'`

**Solution:**
```bash
cd kitchenflow-app
npx tsc --noEmit
```

If errors persist, restart TypeScript server in your IDE.

### **Issue: Navigation doesn't work**

**Error:** Recipe detail screen doesn't open

**Solution:**
1. Check `CravingsScreen.tsx` has `handleViewRecipe` function
2. Verify `RecipeDetail` route exists in `App.tsx`
3. Check console for navigation errors

---

## 📊 Performance Considerations

### **Image Fetching**

- **URL extraction:** ~1-3 seconds (network dependent)
- **Unsplash/Pexels API:** ~0.5-1 second
- **Placeholder:** Instant

**Optimization:** Images are fetched in parallel with AI analysis.

### **AI Analysis**

- **Average time:** 3-5 seconds (Gemini 2.5 Flash)
- **Includes:** Dish name refinement + ingredient extraction

### **Database Storage**

- **JSONB ingredients:** Efficient storage and querying
- **Indexes:** Added for `cuisine` and `difficulty` for fast filtering

---

## 🚀 Future Enhancements

### **Phase 2 (Optional)**

1. **User-uploaded images**
   - Allow users to replace AI-fetched images
   - Camera integration

2. **Recipe instructions extraction**
   - Parse cooking steps from URLs
   - Store in `instructions` field

3. **Advanced filtering**
   - Filter by cuisine type
   - Filter by difficulty
   - Filter by cooking time

4. **Shopping list integration**
   - Auto-generate from multiple cravings
   - Smart ingredient merging

---

## ✅ Deployment Checklist

- [ ] Database migration executed
- [ ] TypeScript types updated (no errors)
- [ ] Image service configured (API keys optional)
- [ ] Metro Bundler restarted
- [ ] Test 1: Add from dish name ✅
- [ ] Test 2: Add from recipe link ✅
- [ ] Test 3: View recipe details ✅
- [ ] Test 4: Image quality verified ✅
- [ ] Test 5: Database data verified ✅
- [ ] No console errors
- [ ] App runs smoothly on device/simulator

---

## 📝 Rollback Procedure

If issues occur, rollback with:

```sql
-- Remove new columns (data will be lost)
ALTER TABLE cravings 
  DROP COLUMN IF EXISTS cuisine,
  DROP COLUMN IF EXISTS difficulty,
  DROP COLUMN IF EXISTS required_ingredients,
  DROP COLUMN IF EXISTS estimated_time,
  DROP COLUMN IF EXISTS instructions,
  DROP COLUMN IF EXISTS source_url;

-- Restore old RPC function
-- (Use previous version from git history)
```

Then revert code changes:
```bash
git checkout HEAD~1 -- kitchenflow-app/src/services/
git checkout HEAD~1 -- kitchenflow-app/src/types/supabase.ts
git checkout HEAD~1 -- kitchenflow-app/src/screens/CravingsScreen.tsx
git checkout HEAD~1 -- kitchenflow-app/src/screens/RecipeDetailScreen.tsx
```

---

## 📞 Support

If you encounter issues:

1. Check console logs for errors
2. Verify Supabase migration status
3. Test with simple dish names first
4. Review this guide's troubleshooting section

---

**Deployment Date:** 2026-01-25  
**Version:** 2.0 (Enhanced Cravings)  
**Status:** Ready for Testing
