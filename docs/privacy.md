# Privacy & Data Handling Notes

The PICYBOO Browser Stub Extension (MV3) is a closed-loop demo designed to prove core capture flows without transmitting browsing history. The following principles govern this public stub:

## What we store
- **Vault entries:** Title, URL, favicon URL (if available), tags, qualitative notes, confidence rating, and a SHA-256 hash of the URL. Entries are persisted inside `chrome.storage.local` only.
- **Active snapshot:** The background service worker keeps a lightweight snapshot (`url`, `title`, `favIconUrl`, `lastSeenAt`) of the most recent active tab to pre-fill the popup. This snapshot is also stored locally.

## What we never store
- Page content, screenshots, credentials, or form data.
- Network requests, cookies, or browsing history outside of the tab you explicitly capture.
- Any identifiers tying captures to a person or account.

## Data residency
All information resides within the browser’s local storage area. Removing the extension or clearing extension data deletes the vault irrevocably.

## Exports
Using the **Export JSON** action generates a JSON file directly in your browser. No network calls are performed. The accompanying [`examples/sync_mock.js`](../examples/sync_mock.js) script illustrates how a secure pipeline could ingest that export for further processing.

## Compliance posture
- **Proof-of-use:** SHA-256 hashes enable third parties to verify that a capture occurred at a specific URL without revealing protected content.
- **Least privilege:** The extension only requests `activeTab`, `tabs`, `storage`, `contextMenus`, and `scripting` permissions to support the demo workflow.
- **Transparency:** This document and the public repository are meant to communicate intent without exposing proprietary algorithms or datasets.

For questions about the private production deployment, contact the PICYBOO security desk at `security@picyboo.com`.
