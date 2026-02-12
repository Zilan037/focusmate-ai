

# FocusGuard Premium Dashboard Transformation

## Issues to Fix

### 1. Onboarding CSP Error (Critical)
The inline `<script>` tag in `onboarding.html` (line 7-9) and `dashboard.html` (line 7-9) violates Chrome Extension's Content Security Policy which blocks inline scripts.

**Fix:** Extract the theme-detection script into a separate file `extension/assets/theme-loader.js` and reference it with `<script src>` instead of inline code.

### 2. Dashboard White Space
The `.main-content` has `max-width: 1100px` which leaves empty space on the right. Remove the max-width constraint so content fills the available area.

### 3. Font Size & Contrast
Increase all font sizes across dashboard and popup. Boost text contrast by using stronger colors for primary/secondary text.

---

## Premium Design Transformation

Inspired by the reference code's aesthetic (Plus Jakarta Sans, premium-card with 28px radius, slate color system, uppercase tracking labels, large bold values), the following changes apply across **all dashboard sections and the popup**.

### Design System Overhaul (`styles-common.css`)

- **Font**: Import `Plus Jakarta Sans` alongside Inter. Set as primary font.
- **Card style**: New `.premium-card` class with `border-radius: 28px`, subtle shadow stack (3-layer), hover lift with shadow increase, light/dark aware backgrounds.
- **Colors**: Strengthen text contrast:
  - Dark: `--text-primary: #F8FAFC` (was `#E8ECF4`), `--text-secondary: #94A3B8` (was `#7A8BA7`)
  - Light: `--text-primary: #0F172A` (was `#1A1A2E`), `--text-secondary: #475569` (was `#5A6478`)
- **Shadows**: Multi-layer premium shadows matching the reference
- **Label style**: All labels use `text-[10px] font-extrabold uppercase tracking-[0.15em]` pattern
- **Value style**: Large values use `text-4xl font-extrabold tracking-tighter`

### Dashboard CSS (`dashboard.css`)

**Sidebar:**
- Background: Light theme uses `#F1F5F9`, dark uses `rgba(15,23,42,0.5)`
- Logo section: Inverted color icon block (dark bg in light mode, white bg in dark)
- Nav items: `font-size: 14px`, `font-weight: 600`, rounded-xl, active state gets white/dark card with shadow + left dot indicator
- Section group labels: `10px font-bold uppercase tracking-[0.15em]`
- Bottom: Weekly goal progress card with progress bar
- Width: 260px (was 240px)

**Top Navbar (new):**
- Sticky glassmorphic top bar with page title, status indicator ("Neural Monitoring Active" badge with pulsing green dot), dark mode toggle, and user area
- Height: 80px

**Main Content:**
- Remove `max-width: 1100px`, add `max-width: 1440px` and center with `mx-auto`
- Padding: `40px` all around
- Page titles: `text-4xl font-black tracking-tight`
- Section subtitles: `10px font-black uppercase tracking-[0.25em]` in accent color

**Stat/Metric Cards:**
- Use `.premium-card` style with `border-radius: 28px`, padding `28px`
- Labels: `10px font-extrabold uppercase tracking-[0.15em]` in muted color
- Values: `text-4xl font-extrabold tracking-tighter`
- Trend badges: colored pill with up/down arrow
- Each card gets a mini sparkline area (opacity 30%, full on hover)
- Subtext: dot indicator + small text at bottom

**Chart Cards:**
- `border-radius: 36px`, padding `40px`
- Chart titles: `text-xl font-black tracking-tight`
- Chart subtitles: `13px font-bold` muted
- Tab selectors: pill buttons in a rounded container

**Streak Card (dark highlight):**
- Full dark card (`bg-slate-900` / `bg-slate-800` in dark mode)
- Large number `text-5xl font-black`
- Badge: "Top 3% Globally"
- Quote at bottom with arrow link
- Decorative blur orb in background

**Domain/Category Section:**
- Progress bars for categories: thin `h-1.5` bars
- Category names: `12px font-black uppercase`
- Percentage values: `13px font-black`

**All Other Tabs (Deep Stats, Daily, Domains, Sessions, Blocklist, Insights, Settings):**
- Same premium-card styling applied consistently
- All stat values enlarged
- All labels use the uppercase tracking pattern
- Table text size increased to `13-14px`
- Settings cards get `28px` radius
- Toggle switches enlarged

### Dashboard HTML (`dashboard.html`)

- Add top navbar bar between sidebar and main content
- Update class names to use new premium styles
- Add status indicators and action buttons in header

### Dashboard JS (`dashboard.js`)

- No major logic changes, just update any hardcoded font references in canvas drawing to use `'Plus Jakarta Sans'`
- Increase canvas font sizes (labels from 9-10px to 11-12px)

### Popup CSS (`popup.css`) & HTML

- Apply same Plus Jakarta Sans font
- Increase all font sizes by ~2px
- Stat values: larger and bolder
- Cards: larger radius, more padding
- Better contrast on all text elements

### Onboarding Files

- Move inline script to external `theme-loader.js`
- Apply Plus Jakarta Sans
- Increase font sizes and contrast

---

## Files Modified

1. `extension/assets/theme-loader.js` -- **NEW** (extracted theme detection script)
2. `extension/assets/styles-common.css` -- Font, colors, premium-card, contrast boost
3. `extension/dashboard/dashboard.html` -- Remove inline script, add navbar, update classes
4. `extension/dashboard/dashboard.css` -- Complete visual overhaul matching reference
5. `extension/dashboard/dashboard.js` -- Update canvas font references and sizes
6. `extension/popup/popup.html` -- Remove inline script, reference theme-loader.js
7. `extension/popup/popup.css` -- Font sizes, contrast, premium styling
8. `extension/onboarding/onboarding.html` -- Remove inline script, reference theme-loader.js
9. `extension/onboarding/onboarding.css` -- Font sizes, contrast
10. `extension/blocked/blocked.html` -- Remove inline script, reference theme-loader.js

## Implementation Order

1. Create `theme-loader.js` (fixes CSP)
2. Update all HTML files to use external script (fixes onboarding)
3. Overhaul `styles-common.css` (new design tokens)
4. Rewrite `dashboard.css` (premium transformation)
5. Update `dashboard.html` (navbar + structure)
6. Update `dashboard.js` (canvas fonts)
7. Update popup files (consistency)
8. Update onboarding/blocked files (consistency)

