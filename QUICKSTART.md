# Quick Start Guide

## 🚀 Easiest Way to Run the App

### Option 1: Double-Click Script (Recommended)

1. Open Finder
2. Navigate to this folder (`pwa/`)
3. **Double-click** `start.sh`
4. Your browser will open automatically at http://localhost:8000

### Option 2: Terminal Command

```bash
cd "/Users/nurfurlong/Desktop/smart-projects/ikhlas/strategy-roadmap-v2/docs/1_growth_and_engagement/DX Growth Content/Names of Allah/pwa"

./start.sh
```

### Option 3: Manual Server Start

```bash
# Navigate to pwa folder
cd "/Users/nurfurlong/Desktop/smart-projects/ikhlas/strategy-roadmap-v2/docs/1_growth_and_engagement/DX Growth Content/Names of Allah/pwa"

# Start Python server
python3 -m http.server 8000

# Then open browser to:
# http://localhost:8000
```

---

## ✅ What You Should See

1. **Welcome Screen** with:
   - Arabic text at the top (Bismillah)
   - "Learn and memorize the 99 Beautiful Names of Allah"
   - 4 feature cards (Authentic Sources, Spaced Repetition, Bilingual, Offline)
   - "Get Started" button

2. **Menu** (click ☰ icon):
   - Browse All
   - Memorize
   - My Progress
   - Favorites

3. **Browser Console** (F12 or Cmd+Option+I):
   - Should see: "Service Worker registered"
   - Should see: "Names of Allah PWA initialized"
   - **No red errors**

---

## ❌ Troubleshooting

### Problem: "Connection Refused" or page doesn't load

**Solution**: Make sure the server is running
```bash
# Check if server is running
lsof -i :8000

# If nothing shows, start the server again
./start.sh
```

### Problem: Page shows but looks broken (no styles)

**Solution**: Hard refresh the page
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

### Problem: Service Worker errors in console

**Solution**: Unregister old service workers
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" on any old workers
5. Refresh page (Cmd+R)

### Problem: "localhost:8000 shows nothing"

**Check these:**
1. ✅ Are you in the correct folder? (should have `index.html`)
   ```bash
   ls -la
   # Should see: index.html, manifest.json, sw.js, css/, js/
   ```

2. ✅ Is the server actually running?
   ```bash
   # You should see this message:
   # "Serving HTTP on 0.0.0.0 port 8000..."
   ```

3. ✅ Try a different browser
   - Chrome/Edge (best PWA support)
   - Safari (good for iOS testing)
   - Firefox (good for debugging)

4. ✅ Check the exact URL
   - Should be: `http://localhost:8000`
   - NOT: `https://localhost:8000` (no SSL locally)
   - NOT: `http://localhost:8000/pwa` (already in the folder)

---

## 📱 Test on Your Phone

### Step 1: Find Your Computer's Local IP
```bash
# On Mac
ipconfig getifaddr en0

# You'll get something like: 192.168.1.100
```

### Step 2: Visit from Phone
1. Make sure phone is on **same WiFi** as computer
2. Open phone browser
3. Go to: `http://192.168.1.100:8000` (use your actual IP)
4. The welcome screen should appear

### Step 3: Install PWA
- **iOS**: Tap Share → Add to Home Screen
- **Android**: Install prompt should appear automatically

---

## 🛑 Stop the Server

In the terminal where the server is running:
- Press `Ctrl + C`

---

## Next Steps

Once you see the welcome screen working:
1. ✅ Click "Get Started" (should show "All 99 Names" with "Loading names...")
2. ✅ Open the menu (☰) and try clicking different sections
3. ✅ Test the install prompt (if it appears)
4. ✅ Check browser console for any errors

**Ready for Stage 2**: Once canonical data arrives, we'll populate the names list!
