# Nextra Documentation Setup

I've set up Nextra (the beautiful documentation template from Vercel) for your Observa docs.

## What Was Done

1. ✅ **Nextra Configuration**: Updated `next.config.js` to use Nextra
2. ✅ **Theme Config**: Created `theme.config.tsx` with Observa branding
3. ✅ **Documentation Structure**: Copied all docs to `pages/docs/` and converted to `.mdx`
4. ✅ **Navigation**: Created `_meta.json` for sidebar navigation
5. ✅ **Dependencies**: Added `nextra` and `nextra-theme-docs` to `package.json`

## Next Steps

### 1. Install Dependencies

You may need to fix npm cache permissions first:

```bash
sudo chown -R $(whoami) ~/.npm
```

Then install:

```bash
cd observa-app
npm install
```

### 2. Test Locally

```bash
npm run dev
```

Visit: http://localhost:3001/docs

### 3. Access Documentation

- **Local**: http://localhost:3001/docs
- **Production**: https://observa-app.vercel.app/docs

## Features

✅ **Beautiful UI**: Professional Nextra theme (same as Vercel's docs)  
✅ **Search**: Built-in search functionality  
✅ **Dark Mode**: Automatic dark mode support  
✅ **Responsive**: Mobile-friendly design  
✅ **Syntax Highlighting**: Code blocks with proper formatting  
✅ **Table of Contents**: Auto-generated TOC for each page  
✅ **Edit Links**: Links to edit on GitHub  

## Structure

```
pages/docs/
├── _meta.json          # Navigation structure
├── README.mdx          # Homepage
├── getting-started/    # Getting started guides
├── sdk/                # SDK documentation
├── api/                # API reference
├── guides/             # Feature guides
├── development/        # Developer docs
├── troubleshooting/    # Help and support
└── reference/          # Technical reference
```

## Customization

Edit `theme.config.tsx` to customize:
- Logo
- Colors (primaryHue, primarySaturation)
- Footer text
- GitHub links
- Search placeholder

## Troubleshooting

If you see errors about Nextra not found:
1. Make sure `npm install` completed successfully
2. Check that `nextra` and `nextra-theme-docs` are in `package.json`
3. Restart the dev server

If pages don't load:
1. Make sure all `.md` files are converted to `.mdx`
2. Check that `_meta.json` matches your file structure
3. Verify file paths in `pages/docs/`

---

**The documentation now uses the same beautiful Nextra template as Vercel's documentation!** 🎉



