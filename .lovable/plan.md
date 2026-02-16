

# Fix: Historical Data, Insights, and Analytics

## Problems Found

### 1. Deep Stats / 30-Day Analytics Broken
The `getDetailedStats` message handler returns raw `[{date, data: {...}}]` array from storage, but `loadDeepStats()` in the dashboard expects `{days: [...], peakWindows: [...]}` where each day object has flat properties like `totalActive`, `score`, and `focusSessions` (as a count, not an array). This causes the 30-day chart, total hours, total sessions, best/avg scores, and peak windows to all fail silently.

### 2. Domain Sparklines Broken
`getDomainHistory` returns `[{date, time}]` objects, but `drawSparkline()` treats the array as plain numbers (`Math.max(1, ...data)` and `v / maxVal`). This means all sparklines in the domains table render nothing.

### 3. Insights Require Sufficient Data
The Insights engine itself works correctly, but it depends on having enough tracked browsing data. The real blocker is that all the analytical views (deep stats, sparklines, reports) that aggregate historical data are broken due to issues 1 and 2 above.

---

## Technical Changes

### File: `extension/background.js`

**Fix `getDetailedStats` handler** (line ~1207):
- Transform the raw `[{date, data}]` array into the expected format
- Map each day to flat properties: `{ date, totalActive, focusTime, distractedTime, score, focusSessions (count) }`
- Calculate `peakWindows` by aggregating hourly activity across all 30 days and finding the top 2-hour windows with highest average productive time

**Fix `getDomainHistory` handler** (line ~1213):
- Return plain number array `[time1, time2, ...]` instead of objects, since `drawSparkline` expects numbers

### File: `extension/dashboard/dashboard.js`

**Fix `loadDeepStats()`** (line ~579):
- Update to handle the corrected response format properly
- Access `detailedStats.days` for the day array and `detailedStats.peakWindows` for peak data

**Add "yearly" and "overall" range support to Reports tab**:
- Add new range buttons for "year" (365 days) and "all" in the reports section
- For "all", fetch all stored date keys from chrome.storage

### File: `extension/background.js` (new message handler)

**Add `getAllUsage` handler**:
- Scan all keys in `chrome.storage.local` that match the date format `YYYY-MM-DD`
- Return all historical data for "overall" view in reports

---

## Summary of Changes

1. **`background.js` - `getDetailedStats`**: Transform raw storage data into `{days: [...flat day objects], peakWindows: [...]}` with calculated peak productivity windows
2. **`background.js` - `getDomainHistory`**: Return `[number]` array instead of `[{date, time}]`
3. **`background.js` - New `getAllUsage` handler**: Scan all date keys for "all time" reports
4. **`dashboard.js` - `loadDeepStats`**: Properly consume the fixed response
5. **`dashboard.js` - Reports tab**: Add "Year" and "All" range buttons, wire up data fetching for longer periods
6. **`dashboard.html`**: Add the new range buttons to the Reports section UI

