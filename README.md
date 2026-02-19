# Formato Cuenta Bancaria 🇨🇱

A Chrome extension that parses Chilean bank account data from your clipboard and formats it into a clean, standard layout ready for bank transfers.

## What it does

Copy messy bank details from a chat message, email, or document — the extension reads your clipboard, detects the fields, and outputs a clean format:

```
12.345.678-9
Juan Pérez
Banco Estado
Cuenta Vista
123456789
juan@example.com
```

It handles a wide variety of input formats:

- **Labeled fields** — `Nombre: Juan`, `RUT: 12345678-9`, `Banco: BCI`, etc.
- **Alternative labels** — `Titular`, `Beneficiario`, `Destinatario`, `R.U.T.`, `Institución financiera`, `Correo electrónico`, …
- **Compact / label-less formats** — bare lines with RUT, name, bank, account type, account number, and email
- **Combined account lines** — `Cuenta Corriente Nº 1234567890`
- **Mixed and messy formatting** — extra whitespace, Windows line endings, section headers, etc.

### Supported banks

The extension recognises all 20 institutions on the official SBIF transfer list, including aliases like `BCI`, `Scotiabank`, `Coopeuch`, `Tenpo`, `Mercado Pago`, `Global 66`, etc. Bank names are normalised to their official names in the output.

### Supported account types

Cuenta Corriente · Cuenta Vista · Cuenta RUT · Cuenta Ahorro · Chequera Electrónica

## Installation

### From source (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/leus/chrome-formato-cuenta-bancaria.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the cloned folder
5. The extension icon will appear in your toolbar

## Usage

1. Copy bank account details to your clipboard (from WhatsApp, email, a website, etc.)
2. Click the extension icon — or right-click anywhere and choose **"Convertir datos bancarios del portapapeles"**
3. Review the parsed fields in the popup (edit if needed)
4. Click **Copiar al portapapeles** — the formatted output is copied and ready to paste

## Project structure

```
├── manifest.json        # Chrome Extension manifest (MV3)
├── background.js        # Service worker – context menu + popup
├── converter.html       # Popup UI
├── converter.css        # Popup styles
├── converter.js         # UI logic – clipboard ↔ form ↔ output
├── parser.js            # Core parser, RUT formatter, output builder
├── banks.js             # SBIF bank list with aliases
├── parser.test.js       # 96 tests (zero dependencies)
├── build.js             # Packages extension into .zip
├── package.json
├── LICENSE              # MIT
├── PRIVACY.md           # Privacy policy
└── icons/               # Extension icons
```

## Testing

Tests use Node's built-in `assert` module — no dependencies required.

```bash
npm test
```

```
Results: 96 passed, 0 failed
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and add tests
4. Run `npm test` to make sure everything passes
5. Commit and push your branch
6. Open a Pull Request

## License

[MIT](LICENSE) © leus

## Privacy

This extension does not collect, store, or transmit any user data. All processing happens entirely in your browser. See the full [Privacy Policy](PRIVACY.md).
