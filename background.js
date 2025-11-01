const VAULT_KEY = 'picybooVault';
const SNAPSHOT_KEY = 'picybooActiveSnapshot';
const CONTEXT_MENU_ID = 'picyboo-context-capture';

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await setupContextMenu();
  } catch (error) {
    console.error('Failed to initialise context menu', error);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab) {
    return;
  }

  try {
    const entry = await buildEntryFromTab(tab, 'context-menu');
    await appendToVault(entry);
    await chrome.notifications?.create?.(entry.id, {
      type: 'basic',
      iconUrl: tab.favIconUrl || 'icon48.png',
      title: 'PICYBOO Capture stored',
      message: tab.title ? tab.title.slice(0, 80) : tab.url,
      silent: true
    });
  } catch (error) {
    console.error('Context menu capture failed', error);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await getTab(tabId);
    if (tab) {
      await persistSnapshot(tab);
    }
  } catch (error) {
    console.debug('Snapshot update skipped', error.message);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.active || changeInfo.status !== 'complete') {
    return;
  }
  try {
    await persistSnapshot(tab);
  } catch (error) {
    console.debug('Snapshot refresh skipped', error.message);
  }
});

async function setupContextMenu() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Capture to PICYBOO Vault',
    contexts: ['page', 'selection', 'link']
  });
}

async function persistSnapshot(tab) {
  if (!isHttpUrl(tab.url)) {
    return;
  }
  const snapshot = {
    url: tab.url,
    title: tab.title || 'Untitled page',
    favIconUrl: tab.favIconUrl || null,
    lastSeenAt: new Date().toISOString()
  };
  await storageSet(SNAPSHOT_KEY, snapshot);
}

async function buildEntryFromTab(tab, source) {
  const url = tab.url || 'about:blank';
  const hash = await digest(url);
  return {
    id: `${source}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    url,
    title: tab.title || 'Untitled page',
    favIconUrl: tab.favIconUrl || null,
    tags: ['quick-capture'],
    note: source === 'context-menu' ? 'Captured via context menu shortcut.' : '',
    confidence: 3,
    hash,
    source
  };
}

async function appendToVault(entry) {
  const vault = await storageGet(VAULT_KEY, []);
  vault.unshift(entry);
  await storageSet(VAULT_KEY, vault);
}

async function storageGet(key, fallback) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ [key]: fallback }, result => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(result[key]);
    });
  });
}

async function storageSet(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function getTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, tab => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(tab);
    });
  });
}

async function digest(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(url || '');
}
