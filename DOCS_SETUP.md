# Documentation Setup

The Observa documentation is now available at `/docs` in the observa-app.

## Structure

- **Location**: `app/docs/[[...slug]]/page.tsx`
- **Content**: `public/docs-content/` (copied from `observa-api/docs/`)
- **Navigation**: Automatically generated from directory structure

## How It Works

1. Documentation markdown files are stored in `public/docs-content/`
2. The dynamic route `[[...slug]]` handles all documentation pages
3. Markdown is rendered using `react-markdown` with syntax highlighting
4. Navigation sidebar is automatically generated from the docs structure

## Adding New Documentation

1. Add markdown files to `observa-api/docs/`
2. Copy to `observa-app/public/docs-content/`:
   ```bash
   cp -r observa-api/docs/* observa-app/public/docs-content/
   ```
3. The page will automatically appear in navigation

## Access

- **Local**: http://localhost:3001/docs
- **Production**: https://observa-app.vercel.app/docs

## Features

- ✅ Responsive design (mobile-friendly)
- ✅ Syntax highlighting for code blocks
- ✅ Automatic navigation generation
- ✅ Search (can be added)
- ✅ Dark mode support (can be added)

## Future Enhancements

- [ ] Add search functionality
- [ ] Add dark mode
- [ ] Add table of contents
- [ ] Add edit links to GitHub
- [ ] Add versioning

