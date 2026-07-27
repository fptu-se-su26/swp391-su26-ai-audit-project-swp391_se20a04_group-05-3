# GreenLife Frontend — Bundle Analysis

**Analysis Date**: 2026-06-22
**Vite Version**: 6.4.2
**Build Tool**: Vite + Rollup
**Analysis Type**: Production bundle post `npm run build` with `manualChunks`

---

## Build Output Summary

| Chunk | Raw Size | Gzip Size | Category |
|---|---|---|---|
| `index.js` (main vendor) | 388.70 KB | 117.0 KB | Core app + React |
| `recharts.js` | 347.88 KB | 105.3 KB | Charting library |
| `AdminDashboardView.js` | 75.27 KB | 16.4 KB | Lazy view |
| `icons.js` | 41.89 KB | 10.6 KB | Lucide icons |
| `StoreDashboardView.js` | 56.67 KB | 13.8 KB | Lazy view |
| `StoreProfileSetupView.js` | 36.41 KB | 8.45 KB | Lazy view |
| `ProductDetailView.js` | 19.57 KB | 5.45 KB | Lazy view |
| `CustomerDashboardView.js` | 21.94 KB | 6.01 KB | Lazy view |
| `ShopView.js` | 15.42 KB | 4.85 KB | Lazy view |
| `AIDiagnosisView.js` | 13.21 KB | 4.48 KB | Lazy view |
| `index.css` | 119.96 KB | 16.71 KB | Tailwind CSS |
| `react-vendor.js` | 0 KB | — | Empty (React already in index.js) |

**Total JS (raw)**: ~1,017 KB  
**Total JS (gzip)**: ~309 KB  
**Initial load (gzip, no lazy)**: index.js + CSS = **~134 KB** ✅ under 150 KB target

---

## manualChunks Configuration Applied

```ts
manualChunks: {
  'recharts': ['recharts'],       // ✅ 347 KB isolated — dashboards only
  'react-vendor': ['react', 'react-dom'],  // ⚠️ Vite already bundles React in index
  'icons': ['lucide-react'],      // ✅ 41 KB isolated
}
```

**Result**: `recharts` (347 KB) is now successfully isolated into its own lazy chunk. Users who never visit a dashboard page will never download the charting library.

**Note on `react-vendor`**: Vite 6 with React plugin pre-bundles React internally via its dependency optimization pipeline. The `react-vendor` manual chunk produces an empty file. This is harmless and can be removed from `vite.config.ts` if desired.

---

## Optimization Analysis

### ✅ Already Optimized

| Optimization | Status |
|---|---|
| Route-level code splitting (lazy views) | ✅ Applied — all 7 heavy views are lazy |
| recharts isolated | ✅ Applied via manualChunks |
| DOMPurify (XSS sanitizer) | Tree-shaken into main bundle — acceptable |
| Tailwind CSS | Purged to 119 KB — acceptable |
| react-hot-toast | Lightweight, stays in main bundle |

### ⚠️ Remaining Opportunities

| Opportunity | Est. Saving | Effort |
|---|---|---|
| Remove `react-vendor` empty chunk entry | 0 KB (cleanup only) | Low |
| Move `motion` (Framer Motion) to lazy load | ~50–80 KB if heavy | Medium |
| Optimize recharts usage — import only used components | ~30–50 KB | High |
| Use `@emotion/react` or smaller charting library | Potential 200+ KB | High (breaking change) |
| Compress images via Vite plugin (`vite-imagetools`) | Variable | Low |

### ❌ Not Applicable

- **react-router-dom**: Not used (state-based routing)
- **D3 full bundle**: Only recharts depends on it — already isolated

---

## Dependency Risk Matrix

| Dependency | Version | Size Impact | Update Risk |
|---|---|---|---|
| `recharts` | ^3.8.1 | 347 KB | LOW |
| `react` + `react-dom` | ^19.0.1 | In main bundle | LOW |
| `lucide-react` | ^0.546.0 | 41 KB (isolated) | LOW |
| `dompurify` | ^3.4.11 | ~30 KB (tree-shaken) | LOW |
| `motion` (Framer) | ^12.23.24 | In main bundle | LOW |
| `@react-oauth/google` | ^0.13.5 | In main bundle | MEDIUM |
| `d3` | ^7.9.0 | Tree-shaken via recharts | LOW |

---

## Lighthouse Performance Forecast

Based on bundle sizes and lazy loading strategy:

| Metric | Estimate |
|---|---|
| First Contentful Paint | < 1.5s (index.js 117 KB gzip) |
| Time to Interactive | < 3.0s on 4G |
| Largest Contentful Paint | Depends on hero image loading |
| Total Bundle (initial) | ~134 KB gzip — excellent |

---

## Recommendations for Future Sprints

1. **Remove empty `react-vendor` chunk** from `vite.config.ts` (cosmetic cleanup)
2. **Import recharts components individually** (`import { AreaChart } from 'recharts/es'`) to tree-shake unused chart types
3. **Add `vite-bundle-visualizer`** to generate interactive treemap: `npm install -D rollup-plugin-visualizer`
4. **Set chunk size warning limit** in `vite.config.ts`: `build: { chunkSizeWarningLimit: 400 }`
