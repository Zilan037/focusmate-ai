// theme-loader.js — FocusGuard theme detection (CSP-safe external script)
(async () => {
  try {
    const { focusguard_theme: t } = await chrome.storage.local.get("focusguard_theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
