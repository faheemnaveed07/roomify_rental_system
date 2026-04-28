# Roomify — UI Improvement Plan

**Audit by:** Senior UI Designer Review
**Project:** Roomify Rental System (MERN stack — React + Vite + TypeScript)
**Workspace:** `/Users/mc/Developer/fyp/roomify_rental_system`
**Date:** April 2026

---

## Executive Summary (3-line version)

1. **Design choice:** "Mtato" (Image 2 — clean blue/white) ko base banayen home page ke liye, aur "Homearia" (Image 3 — split map+cards) ko Search/Browse page ke liye implement karein. "Properties" (Image 1 — green) discard kar dein — woh maintenance business ke liye hai, rental ke liye nahi.
2. **Aap ka project already 70% wahan hai** — Mtato ka exact #2563EB blue aap ke design system mein already hai, aur backend mein `2dsphere` geo index aur coordinates field ready hain map ke liye.
3. **Critical missing piece:** Map integration on Search page — yahi aap ki user-stated requirement hai aur yahan focus rakhein.

---

## Part 1 — Design Recommendation (Detailed)

### Image 1 — "Properties" (Green/Yellow)

| Pros | Cons |
|------|------|
| Bold typography, clear CTAs | Targeted at lawn/property maintenance, not rentals |
| Eye-catching contact form section | Green palette evokes landscaping, not housing |
| Footer is well-organized | Wavy/grass illustrations don't match Roomify's tone |
| | Sections like "MYRTLE BEACH / GULF / FLAT" are vacation-rental, not student/urban rental |

**Verdict:** ❌ Not suitable. Skip this.

### Image 2 — "Mtato" (Blue/White)

| Pros | Cons |
|------|------|
| Clean, modern, minimalist | Hero image (house in hand) is creative but you'd need licensing |
| Search bar with **3 filters** (location, type, zip) — exactly aap ke use case ke liye | Plain — needs polish for property cards section |
| Trust signals (partner logos) | "comapny" typo in design (just an artifact) |
| Perfect blue palette — matches Roomify's `#2563EB` already configured | |
| Easy to implement in React + Tailwind | |

**Verdict:** ✅ **Use this as base for Home/Landing page.**

### Image 3 — "Homearia" (Purple, Split Map+Cards)

| Pros | Cons |
|------|------|
| **Split layout: cards on left + interactive map on right** | Purple is off-brand (you're blue) — change to your primary blue |
| Price markers on map with proper styling | Dashboard-only, not a landing page |
| Filter chips (Any price, Home Type, Beds, Pets, More) | |
| Sort + grid/list toggle | |
| Property cards with bed/bath/sqft icons | |

**Verdict:** ✅ **Use this layout for `/browse` (Search) page** — adapt purple → Roomify blue.

---

## Part 2 — Current Project Assessment

### What you already have (good news)

✅ **Solid architecture** — Atomic Design (atoms / molecules / organisms / templates) is professional
✅ **Modern stack** — React 18 + Vite + TypeScript + Tailwind + Zustand + React Query
✅ **Design tokens already in place** — `src/styles/theme/colors.ts`, `typography.ts`, `spacing.ts`, `breakpoints.ts`
✅ **Animation library** — Framer Motion already installed
✅ **Icon library** — Lucide React (good choice)
✅ **Form handling** — React Hook Form + Zod (industry standard)
✅ **Backend ready for maps** — `Property.ts` model has `location.coordinates` with `2dsphere` index
✅ **20+ pages already built** — Auth, Home, Search, PropertyDetail, Roommate flows, Admin, Landlord, Payments

### Current Home page (`pages/Home.tsx`) — assessment

**Strengths:**
- Hero section with Framer Motion animations ✓
- SearchBar component already integrated ✓
- StatPill, FeatureCard, Step, Testimonial sub-components ✓
- Verified marketplace badge ✓
- Big bold typography (text-7xl) ✓

**Weaknesses (compared to Mtato design):**
- ❌ No hero **image** — Mtato has a striking house-in-hand visual that draws the eye
- ❌ Hero is **center-aligned** — Mtato uses a left-text + right-image asymmetric layout (more modern, more conversion-focused)
- ❌ Trust strip (partner logos / "trusted by N+ universities") is missing — Mtato's logo carousel adds instant credibility
- ❌ Search bar is generic — Mtato has 3 distinct dropdowns (location, property type, zip code) which feels more "search engine"

### Current Search page (`pages/Search.tsx`) — assessment

**Strengths:**
- 3-column grid of PropertyCards ✓
- Sort dropdown (Newest, Best Match, Price asc/desc) ✓
- Skeleton loaders ✓
- Compatibility score integration (unique to Roomify, great differentiator) ✓
- Empty state with "Clear Filters" CTA ✓
- Pagination ("Load More") ✓

**Weaknesses (compared to Homearia design):**
- ❌ **NO MAP** — this is your stated #1 requirement
- ❌ Filters are minimal — only sort + "high match" toggle. Homearia has price/type/beds/pets/more chips
- ❌ No grid/list view toggle
- ❌ No "X of Y homes available" counter at top
- ❌ Cards take full width on mobile but no hover→map-marker sync exists

### Current PropertyCard component — assessment

**Strengths:**
- Inline styles using design tokens ✓
- Verification badge ✓
- Compatibility score with color-coded background ✓
- "Best Match" purple badge ✓
- Price formatting helper (12K, 1.2L) ✓
- Featured badge support ✓

**Weaknesses:**
- Uses inline `style={}` objects instead of Tailwind classes — inconsistent with rest of app and harder to maintain
- No favorite (heart) icon — Homearia has it on every card
- "Popular" / "New" / "Best price" status pills missing (Homearia uses these to differentiate cards)
- Bed/bath icons are text-only ("3 Bed", "2 Bath") — Homearia uses icons for visual scanning
- No `transition` on hover for subtle elevation

---

## Part 3 — Page-by-Page Improvement Plan

### 3.1 Home Page (`/` → `pages/Home.tsx`)

**Reference:** Mtato design (Image 2)

| Section | Current | Recommended Change |
|---------|---------|-------------------|
| Hero layout | Center-aligned, no image | Switch to **2-column grid**: left = headline + tagline + search, right = hero image (use a Pakistani neighborhood photo or 3D house illustration) |
| Headline | "Find your next home with confidence" | Keep, but make `confidence` blue-gradient (already done — good!) |
| Search position | Below hero, narrow (max-w-xl) | **Move below the fold as a pinned card** that overlaps hero image bottom edge (Mtato style) — wider with visible filter dropdowns |
| Search filters | Single text input | Add 3 visible inputs: Location dropdown, Property Type dropdown, City/Zip — exactly Mtato style |
| Trust strip | "Verified marketplace" pill | Add **logo carousel of 5 universities** (BZU, NUST, etc.) below search bar — instant credibility for student rentals |
| Featured properties | Existing | Keep as-is; the card grid is good |
| "How it works" | Existing | Keep; well-structured |
| Testimonials | Existing | Keep; minor: add real student photos (avatars) |
| Footer | Basic 3-col | Already good; consider adding social icons (Instagram/Facebook) |

### 3.2 Search/Browse Page (`/browse` → `pages/Search.tsx`)

**Reference:** Homearia design (Image 3) — but in Roomify blue, NOT purple

This is **the most important change**. Currently 3-column grid; needs to become a 2-column split.

| Section | Current | Recommended Change |
|---------|---------|-------------------|
| Layout | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (cards only) | **Split**: left half (60%) = property cards in 2-column grid, right half (40%) = sticky map |
| Top filter bar | Single sort dropdown | Replace with **5 filter chips**: Any price ▾, Home Type ▾, Beds ▾, Amenities ▾, More ▾ |
| Result count | Hidden | Show **"X of Y properties available in [City]"** prominently |
| View toggle | Missing | Add **grid / list / map-only toggles** in top-right |
| Search bar | Above grid | Move to top of page or into header |
| Cards on hover | Static | **Highlight corresponding map marker** (custom event sync) |
| Map markers | None | Implement clickable price pins (e.g., "PKR 25K") that open card preview |
| Mobile fallback | Cards-only | Stacked: filter chips → tabs (List / Map) → content |

**Required new dependencies (add to `package.json`):**
- `leaflet` + `react-leaflet` (free, no API key) — recommended for FYP
- OR `mapbox-gl` (need API key, prettier) — only if budget allows
- `@types/leaflet` (TypeScript types)

### 3.3 PropertyDetail Page (`/property/:id`)

**Reference:** Composite (Mtato detail style + Homearia card detail)

| Section | Recommended |
|---------|-------------|
| Image gallery | Sticky left side: large image + thumbnail strip (5 photos) |
| Right rail (sticky) | Price, "Book Now" CTA, landlord card with avatar + verification + chat button |
| Description | Below gallery, full width |
| Amenities grid | 4-column icon grid (WiFi, Parking, Furnished, etc.) |
| **Mini-map** | **Add this** — single marker showing property location with neighborhood overlay |
| Reviews | If exists, show; else "No reviews yet" with prompt |
| Similar properties | Bottom carousel of 3-4 nearby listings |

### 3.4 Auth Page (`/auth`)

**Reference:** Mtato simplicity

Currently 25KB file — likely already designed. Just check:
- Split-screen layout (left = form, right = brand image / quote)
- Inline tab switch (Login | Register) instead of separate routes
- Social login buttons (Google) prominently visible
- "Forgot password?" link visible

### 3.5 Dashboard pages (Landlord / Admin)

These have different visual language — they're tools, not marketing. Keep them functional. Just ensure:
- Sidebar uses primary-50 background (very light blue), not pure white
- Active nav item: primary-600 background, white text
- Stat cards use the same `StatCard` molecule (already exists)
- Charts/tables use `colors.primary[500]` for series

---

## Part 4 — Design System Tweaks

### 4.1 Colors — keep but extend

Current palette is good. Add these for Homearia-style elements:

```typescript
// Add to colors.ts
status: {
  new: '#10B981',         // green — "New" tag
  popular: '#F97316',     // orange — "Popular" tag
  bestPrice: '#0EA5E9',   // sky-blue — "Best price" tag
  featured: '#A855F7',    // purple — "Featured" tag (use sparingly)
},
mapMarker: {
  default: '#2563EB',     // primary
  hovered: '#1D4ED8',     // primary darker
  selected: '#F59E0B',    // amber accent
},
```

### 4.2 Typography

Current setup uses Inter (body) + Playfair Display (headings) — good combo. Verify it's loaded in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,700&display=swap" rel="stylesheet">
```

Mtato uses heavier weights (Black 900) for impact — make sure `font-weight: 900` is loaded.

### 4.3 Spacing & radius

Already using `spacing[4]`, `borderRadius.xl` — good. No changes.

### 4.4 Component refactor — PropertyCard

Recommended: rewrite `PropertyCard.tsx` using **Tailwind classes** instead of inline styles for consistency:

Pseudo-structure:
```tsx
<article className="group bg-white rounded-2xl shadow-sm hover:shadow-xl
                   transition-all duration-300 overflow-hidden cursor-pointer">
  <div className="relative aspect-[3/2]">
    <img className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
    <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full"><Heart /></button>
    <Badge className="absolute top-3 left-3" variant={statusTag} />
  </div>
  <div className="p-5">
    <div className="flex items-baseline justify-between mb-2">
      <span className="text-2xl font-black text-primary-600">PKR {price}/mo</span>
      <VerificationBadge />
    </div>
    <h3 className="font-bold text-slate-900 line-clamp-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-4">{area}, {city}</p>
    <div className="flex gap-4 text-sm text-slate-600">
      <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {beds}</span>
      <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {baths}</span>
      <span className="flex items-center gap-1"><Square className="w-4 h-4" /> {sqft}</span>
    </div>
  </div>
</article>
```

---

## Part 5 — Map Integration Plan (your stated priority)

### Step-by-step implementation

**Phase 1 — Setup (1-2 hours)**

```bash
cd frontend
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

Add Leaflet CSS to `src/main.tsx` or `src/styles/globals.css`:
```css
@import 'leaflet/dist/leaflet.css';
```

**Phase 2 — Build PropertyMap molecule (3-4 hours)**

Create `src/components/molecules/PropertyMap.tsx`:

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface MapProperty {
  id: string;
  lat: number;
  lng: number;
  price: number;
  title: string;
}

interface PropertyMapProps {
  properties: MapProperty[];
  hoveredId?: string;
  onMarkerClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  hoveredId,
  onMarkerClick,
  center = [30.1575, 71.5249], // Multan
  zoom = 13,
}) => {
  const createPriceIcon = (price: number, isHovered: boolean) =>
    L.divIcon({
      className: 'custom-price-marker',
      html: `<div class="${isHovered ? 'price-marker hovered' : 'price-marker'}">
               PKR ${price >= 1000 ? (price/1000).toFixed(0) + 'K' : price}
             </div>`,
      iconSize: [60, 30],
    });

  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-2xl">
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={createPriceIcon(p.price, hoveredId === p.id)}
          eventHandlers={{
            click: () => onMarkerClick?.(p.id),
          }}
        >
          <Popup>{p.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default PropertyMap;
```

Add to `src/styles/globals.css`:
```css
.price-marker {
  background: #2563EB;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.2s;
  white-space: nowrap;
}
.price-marker.hovered {
  background: #F59E0B;
  transform: scale(1.15);
  z-index: 1000;
}
```

**Phase 3 — Integrate into Search page (2-3 hours)**

Modify `pages/Search.tsx`:

```tsx
// Replace single grid with split layout
<div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 h-[calc(100vh-200px)]">
  {/* LEFT: Cards (scrollable) */}
  <div className="overflow-y-auto pr-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {displayProperties.map((p) => (
        <PropertyCard
          key={p._id}
          {...p}
          onMouseEnter={() => setHoveredId(p._id)}
          onMouseLeave={() => setHoveredId(null)}
        />
      ))}
    </div>
  </div>

  {/* RIGHT: Sticky map */}
  <div className="hidden lg:block sticky top-20 h-full">
    <PropertyMap
      properties={displayProperties.map(p => ({
        id: p._id,
        lat: p.location.coordinates.latitude,
        lng: p.location.coordinates.longitude,
        price: p.rent.amount,
        title: p.title,
      }))}
      hoveredId={hoveredId ?? undefined}
      onMarkerClick={(id) => navigate(`/property/${id}`)}
    />
  </div>
</div>
```

**Phase 4 — Mobile responsive (1-2 hours)**

Mobile mein map hidden hota hai. Add a tab switcher:
```tsx
<div className="lg:hidden flex gap-2 mb-4">
  <button onClick={() => setMobileView('list')} className={cn(...)}>List</button>
  <button onClick={() => setMobileView('map')} className={cn(...)}>Map</button>
</div>
{mobileView === 'list' ? <CardsGrid /> : <PropertyMap />}
```

**Phase 5 — Geocoding fallback (optional, 1 hour)**

Agar properties mein coordinates missing hain, OpenStreetMap Nominatim API se address → lat/lng convert kar sakte hain (free, no key):
```ts
const geocode = async (address: string) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
  const data = await res.json();
  return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
};
```

**Total estimated effort:** 8-12 hours for full map integration including testing.

---

## Part 6 — Prioritized Action Items

### Sprint 1 (this week — high priority, high impact)

1. **Add Leaflet map to Search page** — your stated #1 requirement (Phase 1-3 above)
2. **Refactor Home hero** — switch to 2-column with hero image
3. **Add 3-filter dropdown search bar** — Mtato-style
4. **Add favorite (heart) icon to PropertyCard** — Homearia parity
5. **Add status pills** (New / Popular / Best price) to PropertyCard

### Sprint 2 (next week — medium priority)

6. **Refactor PropertyCard from inline-styles to Tailwind classes** — consistency
7. **Add filter chips bar to Search page** (Any price, Type, Beds, Amenities)
8. **Add "X of Y properties" count + grid/list toggle** to Search
9. **Add mini-map to PropertyDetail** page
10. **Add university logo trust strip** to Home page

### Sprint 3 (polish — low priority but high quality bump)

11. **Loading skeletons** for map (subtle gray pulse)
12. **Empty state illustrations** (use Lucide icons large + text)
13. **Hover→marker sync animation** (smooth color transition)
14. **Mobile map/list tab switcher**
15. **Add OpenStreetMap geocoding fallback** for properties without coordinates

---

## Part 7 — Concrete Files You'll Need to Touch

| File | Action |
|------|--------|
| `frontend/src/pages/Home.tsx` | Refactor hero to 2-column + image |
| `frontend/src/pages/Search.tsx` | Split layout with map |
| `frontend/src/components/molecules/PropertyCard.tsx` | Rewrite with Tailwind, add heart + status pills |
| `frontend/src/components/molecules/SearchBar.tsx` | Add 3-dropdown variant |
| `frontend/src/components/molecules/PropertyMap.tsx` | **CREATE NEW** |
| `frontend/src/components/molecules/FilterChip.tsx` | Already exists — extend with dropdown variant |
| `frontend/src/styles/globals.css` | Add `.price-marker` + Leaflet import |
| `frontend/src/styles/theme/colors.ts` | Add `status` and `mapMarker` color tokens |
| `frontend/package.json` | Add leaflet + react-leaflet deps |

---

## Part 8 — Visual Comparison (Before vs After)

### Home Page

```
BEFORE                              AFTER (Mtato-inspired)
┌──────────────────────────┐       ┌──────────────────────────┐
│      [Centered hero]     │       │ Headline      │  [Hero  ] │
│      Big bold text       │       │ Tagline       │  [House ] │
│      Search bar          │       │               │  [Image ] │
│                          │       │ ┌─────────────────────────┐│
│   [Stats] [Stats] [Stats]│       │ │📍 Loc▾ 🏠Type▾ 🔍Search ││
│                          │       │ └─────────────────────────┘│
└──────────────────────────┘       │   [BZU] [NUST] [...] logos │
                                    └──────────────────────────┘
```

### Search Page

```
BEFORE                              AFTER (Homearia-inspired)
┌──────────────────────────┐       ┌──────────────────────────┐
│ [Search bar]             │       │ [Search] [Filter chips]  │
│ [Sort ▾]                 │       │ 62 of 300 properties     │
│                          │       ├────────────┬─────────────┤
│ [Card][Card][Card]       │       │ [Card]     │             │
│ [Card][Card][Card]       │       │ [Card]     │  🗺️  MAP    │
│ [Card][Card][Card]       │       │ [Card]     │ with prices │
│                          │       │ [Card]     │ as markers  │
│ [Load More]              │       │ [Card]     │             │
└──────────────────────────┘       └────────────┴─────────────┘
```

---

## Part 9 — FYP Defense Talking Points

Jab examiner poochay "design choices kaisi ki?", aap yeh bolain:

1. **"Mtato design ka clean approach utha kar Roomify ke trust-focused brand mein blend kiya — kyun ke rental market mein trust hi sab kuch hai."**
2. **"Search page ka split map+cards layout Homearia se inspired hai, lekin purple ki jagah Roomify ka primary blue use kiya — brand consistency ke liye."**
3. **"Backend mein already 2dsphere index aur GeoJSON coordinates field maujood thi, to map integration ek architectural natural fit thi — re-engineer nahi karna pari."**
4. **"Leaflet + OpenStreetMap chuna kyun ke open-source hai, FYP scope ke liye API key cost nahi, aur production scale par bhi battle-tested hai."**
5. **"Atomic Design pattern follow kiya — har feature add karte waqt atom→molecule→organism progression maintain ki, jaise PropertyMap molecule banaya jo Search organism mein use hota hai."**

---

## Final Verdict

| Question | Answer |
|----------|--------|
| **Kaunsa design use karain?** | Mtato (Image 2) for Home, Homearia (Image 3) for Search — both adapted to your blue theme |
| **Image 1 (green) discard karain?** | Yes — wrong industry vibe |
| **Map kahan integrate karain?** | Search/Browse page — split layout (cards left, sticky map right) |
| **Kya time lagega?** | Sprint 1 (must-have): ~20-25 hours. Sprint 2+3 (polish): another 15-20 hours |
| **Kaunsa map library?** | Leaflet + react-leaflet (free, FYP-friendly) |
| **Aap ka project current state mein FYP-ready hai?** | 70% — strong architecture, missing only the map and visual polish |

---

*This document was prepared after analyzing the entire `roomify_rental_system` codebase including App.tsx routing, Home/Search/PropertyDetail pages, PropertyCard component, design system tokens, and backend Property model. All recommendations are grounded in your existing code structure — no rewrites needed, only additions and refactors.*
