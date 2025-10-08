// bg.js v4.2 - strong check with regex (MV3 worker-safe)
function hasResultsFor(host, html, key) {
  try {
    const lower = html.toLowerCase();
    const keyLower = (key||'').toLowerCase();
    if (host.includes('qiaomi.cn')) {
      if (/(href=)["'][^"']*(\/play|vod\-detail|\/detail)[^"']*["']/i.test(html)) return true;
      if (/(class=)["'][^"']*(xing_vb|module-items|search\-list)[^"']*["']/i.test(html)) return true;
      if (/搜索结果|找到|条结果|资源/.test(html) && lower.includes(keyLower)) return true;
      return false;
    }
    if (host.includes('rrdynb.com')) {
      if (/(href=)["'][^"']*(m=vod-detail|\/voddetail|\/play\/)[^"']*["']/i.test(html)) return true;
      if (/(class=)["'][^"']*(module-items|search\-list)[^"']*["']/i.test(html)) return true;
      if (/搜索结果|找到|条结果|资源/.test(html) && lower.includes(keyLower)) return true;
      return false;
    }
    if (host.includes('yyets.click')) {
      if (/(href=)["'][^"']*(\/resource\/|\/detail\/)[^"']*["']/i.test(html)) return true;
      if (/(class=)["'][^"']*(search\-result|list)[^"']*["']/i.test(html)) return true;
      if (/搜索|结果|资源|字幕/.test(html) && lower.includes(keyLower)) return true;
      return false;
    }
    return lower.includes(keyLower) && html.length > 2000;
  } catch(e) {
    return false;
  }
}

async function tryFetch(url, key, timeoutMs=6000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { credentials: 'omit', signal: controller.signal });
    const html = await res.text();
    const ok = hasResultsFor(new URL(url).hostname, html, key);
    return { ok, url };
  } catch(e) {
    return { ok: null, url, error: String(e) };
  } finally {
    clearTimeout(to);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'strongCheckMany' && msg.urls && msg.keys) {
    (async () => {
      let hadUnknown = false;
      for (let i = 0; i < msg.urls.length; i++) {
        const u = msg.urls[i];
        const k = msg.keys[i] || msg.keys[0] || '';
        const res = await tryFetch(u, k);
        if (res.ok === true) { sendResponse({ ok: true, url: res.url }); return; }
        if (res.ok === null) hadUnknown = true;
      }
      if (hadUnknown) sendResponse({ ok: true, url: msg.urls[0], fallback: true });
      else sendResponse({ ok: false });
    })();
    return true;
  }
});
