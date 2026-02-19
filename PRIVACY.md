# Privacy Policy

**Formato Cuenta Bancaria** is a Chrome extension that formats Chilean bank account data for transfers. Your privacy is important — this policy explains how the extension handles your data.

## Data Collection

**We do not collect, store, transmit, or share any user data. Period.**

## How It Works

- The extension reads your clipboard **only** when you explicitly activate it (by clicking the extension icon or using the context menu).
- All processing happens **entirely in your browser**. No data is sent to any external server, API, or third-party service.
- The formatted output is written back to your clipboard. Nothing is saved, logged, or persisted anywhere.

## Permissions

The extension requests the following Chrome permissions:

| Permission | Why |
|---|---|
| `clipboardRead` | To read bank account data you've copied |
| `clipboardWrite` | To copy the formatted output back to your clipboard |
| `contextMenus` | To add a right-click menu option for quick access |

No other permissions are requested. The extension does not access your browsing history, tabs, cookies, or any other browser data.

## Network Access

The extension makes **zero network requests**. It has no remote dependencies, no analytics, no telemetry, and no update mechanism outside of the Chrome Web Store itself.

## Third-Party Services

None. The extension is entirely self-contained.

## Data Storage

The extension does not use `localStorage`, `chrome.storage`, cookies, or any other persistence mechanism. Once the popup closes, nothing remains.

## Changes to This Policy

If this policy changes, the update will be posted in this repository. Since the extension does not collect data, there is nothing to retroactively affect.

## Contact

If you have questions about this privacy policy, open an issue at:
https://github.com/leus/chrome-formato-cuenta-bancaria/issues
