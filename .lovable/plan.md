

# Fix: Allowed Sites Breaking and Blocked Page Refresh

## Problem 1: Allowed websites not working (videos won't play, pages broken)

**Root cause:** The declarativeNetRequest block-all rules block ALL resource types -- `script`, `image`, `media`, `xmlhttprequest`, `websocket`, `stylesheet`, etc. When you allow `youtube.com`, videos still break because YouTube loads content from CDN domains like `googlevideo.com`, `ytimg.com`, `googleapis.com`, and `gstatic.com`. These CDN domains are NOT in your allow list, so all sub-resources get blocked.

**Fix:** Change the block-all rules to ONLY block `main_frame` (page navigation). This prevents the user from navigating to non-allowed sites, but lets all sub-resources (scripts, images, videos, API calls) load freely from any domain. The webNavigation listeners already handle the navigation blocking with the nice blocked page UI.

### Changes in `background.js` (`applyFocusBlockingRules`):
- Change `resourceTypes` in the two block-all rules from the full list to just `["main_frame"]`
- Keep the allow exception rules with `main_frame` only as well (for consistency)
- This means: you can only NAVIGATE to allowed sites, but those sites can freely load their CDN resources

---

## Problem 2: F5 refresh still shows blocked page after unblocking

**Root cause:** When a site is blocked, the tab URL becomes `chrome-extension://...blocked.html?domain=youtube.com`. If the user unblocks from the popup (not from the blocked page's own unblock button), the tab still shows the blocked page URL. Pressing F5 just reloads `blocked.html`.

**Fix:** Add auto-redirect logic to `blocked.js`. On page load, check with the background script whether the domain is still actually blocked. If it's no longer blocked, automatically redirect to the real site. Also re-check periodically (every 2 seconds) so if the user unblocks from the popup, the blocked page auto-redirects.

### Changes in `blocked.js`:
- Add `checkIfStillBlocked(domain)` function that sends a message to background to verify block status
- Call it on page load and every 2 seconds via `setInterval`
- If domain is no longer blocked, do `window.location.replace("https://" + domain)`

### Changes in `background.js`:
- Add a `checkDomainBlocked` message handler that checks if a domain is currently blocked (by checking focus state allowlist/blocklist, system blocks, and user blocks)
- Returns `{ blocked: true/false }`

---

## Technical Details

### Files Modified:
1. **`extension/background.js`**
   - `applyFocusBlockingRules`: Change block-all `resourceTypes` to `["main_frame"]` only
   - Add `checkDomainBlocked` message handler
2. **`extension/blocked/blocked.js`**
   - Add auto-redirect check on load and periodic re-check

### Why This Works:
- Blocking only `main_frame` means the user cannot navigate to non-allowed sites (they see the blocked page)
- But allowed sites like YouTube can load all their resources from any CDN domain (googlevideo.com, ytimg.com, etc.)
- The webNavigation listeners (`onBeforeNavigate`, `onCommitted`) still catch navigation attempts and show the blocked page
- The auto-redirect check on the blocked page means F5 or unblocking from popup works seamlessly

