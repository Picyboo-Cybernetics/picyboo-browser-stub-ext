const VAULT_KEY = 'picybooVault';

const elements = {
  form: document.getElementById('captureForm'),
  tags: document.getElementById('tags'),
  note: document.getElementById('note'),
  confidence: document.getElementById('confidence'),
  confidenceValue: document.getElementById('confidenceValue'),
  confidenceDescriptor: document.getElementById('confidenceDescriptor'),
  statusPanel: document.getElementById('statusPanel'),
  statusMessage: document.getElementById('statusMessage'),
  statusPreview: document.getElementById('statusPreview'),
  pageTitle: document.getElementById('pageTitle'),
  pageUrl: document.getElementById('pageUrl'),
  pageHash: document.getElementById('pageHash'),
  exportButton: document.getElementById('exportVault'),
  vaultCount: document.getElementById('vaultCount')
};

let activeTab = null;

const CONFIDENCE_LABELS = {
  1: 'Speculative lead',
  2: 'Emerging pattern',
  3: 'Balanced signal',
  4: 'Strong conviction',
  5: 'Validated insight'
};

document.addEventListener('DOMContentLoaded', () => {
  elements.form.addEventListener('submit', handleSubmit);
  elements.confidence.addEventListener('input', handleConfidenceChange);
  elements.exportButton.addEventListener('click', handleExportClick);
  initialise();
});

async function initialise() {
  handleConfidenceChange();
  setStatus('info', 'Preparing capture context…');
  await hydrateActiveTab();
  await refreshVaultSummary();
}

async function hydrateActiveTab() {
  try {
    const [tab] = await queryActiveTab();
    if (!tab) {
      setStatus('error', 'Unable to detect an active tab.');
      return;
    }

    activeTab = tab;
    const normalizedUrl = tab.url || 'about:blank';
    const hash = await digest(normalizedUrl);

    elements.pageTitle.textContent = tab.title || 'Untitled page';
    elements.pageUrl.textContent = normalizedUrl;
    elements.pageUrl.href = normalizedUrl;
    elements.pageHash.textContent = `SHA-256 · ${hash.slice(0, 12)}…`;

    setStatus('info', 'Context ready. Add your annotations to sync.');
  } catch (error) {
    console.error(error);
    setStatus('error', `Failed to prepare capture context: ${error.message}`);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!activeTab) {
    setStatus('error', 'No active tab context available.');
    return;
  }

  const formData = new FormData(elements.form);
  const tags = parseTags(formData.get('tags'));
  const note = (formData.get('note') || '').trim();
  const confidence = Number(formData.get('confidence') || 3);

  const timestamp = new Date().toISOString();
  const url = activeTab.url || 'about:blank';
  const hash = await digest(url);

  const entry = {
    id: `popup-${timestamp}`,
    createdAt: timestamp,
    url,
    title: activeTab.title || 'Untitled page',
    favIconUrl: activeTab.favIconUrl || null,
    tags,
    note,
    confidence,
    hash,
    source: 'popup'
  };

  try {
    setStatus('info', 'Saving to vault…');
    const vault = await readVault();
    vault.unshift(entry);
    await writeVault(vault);
    elements.form.reset();
    elements.confidence.value = '3';
    handleConfidenceChange();
    await refreshVaultSummary();
    setStatus('success', 'Capture stored locally.', entry);
  } catch (error) {
    console.error(error);
    setStatus('error', `Unable to store capture: ${error.message}`);
  }
}

function parseTags(input) {
  return (input || '')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);
}

async function refreshVaultSummary() {
  const vault = await readVault();
  elements.vaultCount.textContent = vault.length;
  if (vault.length === 0) {
    elements.statusPreview.textContent = 'Awaiting first capture.';
    return;
  }

  const [latest] = vault;
  elements.statusPreview.textContent = JSON.stringify(
    {
      title: latest.title,
      url: latest.url,
      tags: latest.tags,
      confidence: latest.confidence,
      createdAt: latest.createdAt,
      hash: `${latest.hash.slice(0, 10)}…`
    },
    null,
    2
  );
}

async function handleExportClick() {
  try {
    const vault = await readVault();
    if (vault.length === 0) {
      setStatus('info', 'Nothing to export yet. Add your first capture.');
      return;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      total: vault.length,
      items: vault
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `picyboo-vault-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    setStatus('success', 'Vault exported as JSON. Check your downloads.');
  } catch (error) {
    console.error(error);
    setStatus('error', `Export failed: ${error.message}`);
  }
}

function handleConfidenceChange() {
  const value = Number(elements.confidence.value);
  elements.confidenceValue.textContent = value;
  elements.confidenceDescriptor.textContent = CONFIDENCE_LABELS[value] || 'Balanced signal';
}

function setStatus(type, message, entry) {
  elements.statusPanel.classList.remove('success', 'error', 'info');
  if (type) {
    elements.statusPanel.classList.add(type);
  }
  elements.statusMessage.textContent = message;
  if (entry) {
    elements.statusPreview.textContent = JSON.stringify(entry, null, 2);
  }
}

async function readVault() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ [VAULT_KEY]: [] }, result => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(result[VAULT_KEY] || []);
    });
  });
}

async function writeVault(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [VAULT_KEY]: data }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function queryActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(tabs);
    });
  });
}

async function digest(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
