# Flashcard App - Deployment Guide

## Overview
This is a client-side only Next.js application that uses browser IndexedDB for persistent storage. No backend server is required.

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager

## Building for Production

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Optimized Version
```bash
npm run build
```

The build process will:
- Optimize all pages and components
- Generate static pages where possible
- Create optimized JavaScript bundles
- Output to `.next` directory

### 3. Start Production Server
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Deployment Platforms

### Vercel (Recommended)
Vercel is the official Next.js hosting platform with zero-config deployment.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Benefits:**
- Automatic deployments on git push
- Global CDN
- Serverless functions (if needed later)
- Preview deployments for PRs
- Analytics included

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

Build settings:
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: Not needed for this app

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g next
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t flashcard-app .
docker run -p 3000:3000 flashcard-app
```

### AWS S3 + CloudFront
For a static export (if needed):

```bash
npm run build
npm run export  # Requires next.config.js changes for static export
```

Then upload to S3 and configure CloudFront.

## Environment Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update any necessary environment variables (currently none required for basic setup)

## Performance Optimization

The app includes several performance optimizations:

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Tailwind CSS purging unused styles
- **Caching**: Browser caching headers configured in Next.js
- **Client-Side Storage**: IndexedDB for efficient data persistence
- **Responsive Design**: Mobile-first CSS with Tailwind
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

## Monitoring & Logging

### Browser Console
Production errors are logged to browser console and can be viewed in error boundaries.

### IndexedDB
User data is stored locally in browser IndexedDB. To export:
1. Open browser DevTools
2. Go to Application > IndexedDB > flashcard-app
3. View/export database contents

## Browser Support

The app requires modern browser features:
- IndexedDB
- LocalStorage
- CSS Grid/Flexbox
- ES2015+ JavaScript

**Supported browsers:**
- Chrome/Chromium 51+
- Firefox 10+
- Safari 10+
- Edge 15+
- Mobile browsers (iOS Safari 10+, Chrome Android)

## Storage Considerations

- **Local Storage**: Used for session state (~1-10 KB)
- **IndexedDB**: Used for decks and cards (typically 100 KB - 10 MB per user)
- **Browser Quota**: Usually 50 MB per origin (varies by browser)

To clear stored data:
```javascript
// In browser console
localStorage.clear()
indexedDB.deleteDatabase('flashcard-app')
```

## Security

- **Client-Side Only**: All data stays on user's device
- **No Backend**: Reduces attack surface
- **Input Validation**: All user inputs validated
- **HTTPS Required**: Use HTTPS in production to protect session cookies

## Backup & Data Export

Users should periodically export their data:
```javascript
// Export as JSON
const decks = await getAllDecks()
const backup = JSON.stringify(decks, null, 2)
// Save to file or send to email
```

## Troubleshooting

### App won't load
- Clear browser cache and IndexedDB
- Try incognito/private mode
- Check browser console for errors

### Data disappeared
- Check if browser storage was cleared
- Restore from browser history if available
- IndexedDB data persists by domain

### Storage quota exceeded
- Clear old unused decks
- Export/backup important data
- Try different browser with larger quota

## Version History

Deployment versions are automatically tracked by git tags:
```bash
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0
```

## Rollback

To rollback to previous version:
```bash
git checkout v1.0.0
npm run build
npm start
```

## Support

For issues or feature requests, please:
1. Check browser console for errors
2. Clear cache and try again
3. Report issues with browser version and steps to reproduce
