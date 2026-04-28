# PWA Icons Setup

You need to create the following icon files and place them in `/frontend/public/`:

## Required Files

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels  
3. **favicon.ico** - 32x32 pixels (optional but recommended)

## How to Create Icons

### Option 1: Use an Online Tool
- Go to https://realfavicongenerator.net/
- Upload your logo/icon image
- Download the generated icons
- Place in `/frontend/public/`

### Option 2: Create Manually
Use any image editor (Photoshop, Figma, Canva, etc.):

1. Create a square image (recommended: 512x512)
2. Design your logo/icon with these specs:
   - Background: Dark blue (#1a1a2e) or transparent
   - Logo: White or gold (#ffd700)
   - Keep important elements in center 80% (safe zone)
   - Use simple, recognizable design

3. Export three sizes:
   - 512x512 → save as `icon-512.png`
   - 192x192 → save as `icon-192.png`
   - 32x32 → save as `favicon.ico`

### Quick Design Idea

Simple text-based icon:
- Background: Gradient from dark blue to electric blue
- Text: "FG" in bold white font (Clash Display)
- Add subtle shadow or glow effect

## Where to Place Files

```
frontend/
  public/
    ├── icon-192.png    ← Place here
    ├── icon-512.png    ← Place here
    ├── favicon.ico     ← Place here
    └── manifest.json   ← Already created
```

## Testing

After adding icons:
1. Restart frontend dev server
2. Open app in browser
3. Check browser dev tools → Application → Manifest
4. Install PWA and check if icon appears correctly

## Note

The app will work without custom icons, but will use default browser icons. For best user experience, create branded icons before deployment!
