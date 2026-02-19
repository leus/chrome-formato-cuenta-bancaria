// ---------------------------------------------------------------------------
// parser.js – Robust extraction of Chilean bank-account fields from text
// ---------------------------------------------------------------------------

/**
 * Known field labels and their canonical key.
 * Order matters only for readability; matching is position-based.
 */
const FIELD_PATTERNS = [
  {
    key: "nombre",
    pattern:
      /(?:titular|nombre(?:\s+(?:del?\s+)?titular)?|beneficiario|destinatario)\s*:/i,
  },
  {
    key: "rut",
    pattern: /(?:rut|r\.u\.t\.?)\s*:/i,
  },
  {
    key: "banco",
    pattern:
      /(?:banco(?:\s+(?:de\s+)?destino)?|instituci[oó]n(?:\s+financiera)?)\s*:/i,
  },
  {
    key: "tipoCuenta",
    pattern: /(?:tipo\s+(?:de\s+)?cuenta)\s*:/i,
  },
  {
    key: "numeroCuenta",
    pattern:
      /(?:n[º°#]?\s*(?:de\s+)?cuenta|cuenta\s*n[º°#]?|n[uú]mero\s*(?:de\s+)?cuenta)\s*:/i,
  },
  {
    key: "email",
    pattern: /(?:e-?mail|correo(?:\s+electr[oó]nico)?)\s*:/i,
  },
];

/**
 * Parse free-form text (single-line or multi-line) and extract bank fields.
 * Returns an object like:
 *   { nombre, rut, banco, tipoCuenta, numeroCuenta, email }
 * Missing fields will be undefined.
 */
function parseBankData(text) {
  if (!text) return {};

  // Normalise whitespace but keep newlines to aid splitting
  const normalised = text.replace(/\r\n/g, "\n").trim();

  // Find every field label's position
  const found = [];
  for (const fp of FIELD_PATTERNS) {
    const match = fp.pattern.exec(normalised);
    if (match) {
      found.push({
        key: fp.key,
        start: match.index,
        labelEnd: match.index + match[0].length,
      });
    }
  }

  // Sort by their appearance in the text
  found.sort((a, b) => a.start - b.start);

  // Extract the value between each label and the next label (or end of text)
  const result = {};
  for (let i = 0; i < found.length; i++) {
    const valueStart = found[i].labelEnd;
    const valueEnd =
      i + 1 < found.length ? found[i + 1].start : normalised.length;
    const raw = normalised.substring(valueStart, valueEnd);
    // Keep only the first line – prevents a value from absorbing
    // unrelated lines when few labels are present (compact format).
    result[found[i].key] = raw.split("\n")[0].trim();
  }

  // ---- Pass 2: compact / label-less format heuristics ----
  const lines = normalised.split("\n").map((l) => l.trim()).filter(Boolean);

  // Known account-type keywords (used for bare-line detection)
  const ACCOUNT_TYPE_RE =
    /^(?:cuenta\s+(?:corriente|vista|rut|ahorro)|chequera\s+electr[oó]nica)$/i;

  // Combined account line: "Cuenta Corriente Nº 4014593894"
  if (!result.tipoCuenta || !result.numeroCuenta) {
    const acctMatch = normalised.match(
      /(cuenta\s+(?:corriente|vista|rut|ahorro)|chequera\s+electr[oó]nica)\s+n[\xba\xb0#]?\s*(\d+)/i
    );
    if (acctMatch) {
      if (!result.tipoCuenta) result.tipoCuenta = acctMatch[1];
      if (!result.numeroCuenta) result.numeroCuenta = acctMatch[2];
    }
  }

  // Bare RUT line: formatted RUT without a label (e.g. "12.345.678-9")
  if (!result.rut) {
    for (const line of lines) {
      if (/^\d{1,3}(\.\d{3})+-[\dkK]$/.test(line)) {
        result.rut = line;
        break;
      }
    }
  }

  // Account type: bare line matching known types
  if (!result.tipoCuenta) {
    for (const line of lines) {
      if (ACCOUNT_TYPE_RE.test(line)) {
        result.tipoCuenta = line;
        break;
      }
    }
  }

  // Account number: bare line of pure digits (not matched as anything else)
  if (!result.numeroCuenta) {
    for (const line of lines) {
      if (/^\d{4,}$/.test(line)) {
        result.numeroCuenta = line;
        break;
      }
    }
  }

  // Email: bare line that looks like an email address
  if (!result.email) {
    for (const line of lines) {
      if (/^[^\s:]+@[^\s]+\.[^\s]+$/.test(line)) {
        result.email = line;
        break;
      }
    }
  }

  // Bank: match against known bank list, or fallback to "Banco ..." prefix
  if (!result.banco) {
    for (const line of lines) {
      if (/:/.test(line)) continue; // skip labeled lines
      // Check against the known bank list (if available)
      if (typeof matchBankLine === "function") {
        const bank = matchBankLine(line);
        if (bank) {
          result.banco = bank.name;
          break;
        }
      }
      // Fallback: line starting with "Banco "
      if (/^banco\s+\S/i.test(line)) {
        result.banco = line;
        break;
      }
    }
  }

  // Name: first line that isn't claimed by another pattern
  if (!result.nombre && lines.length > 0) {
    for (const line of lines) {
      if (/^rut\s*:/i.test(line)) continue;
      if (/^r\.u\.t/i.test(line)) continue;
      if (/@/.test(line)) continue;
      if (/^banco\s/i.test(line)) continue;
      // Skip lines that match a known bank name
      if (typeof matchBankLine === "function" && matchBankLine(line)) continue;
      if (/^cuenta\s/i.test(line)) continue;
      if (ACCOUNT_TYPE_RE.test(line)) continue;
      if (/^\d+$/.test(line)) continue; // skip pure-digit lines (account numbers)
      if (/^\d{1,3}(\.\d{3})+-[\dkK]$/.test(line)) continue; // skip bare RUT
      if (/^(?:nombre|titular|beneficiario|destinatario)\s*:/i.test(line)) continue;
      if (/^(?:tipo\s+de\s+cuenta|numero|n[º°#]|email|e-?mail|correo|instituci[oó]n)\s*:/i.test(line)) continue;
      if (/:\s*$/.test(line)) continue; // skip section headers
      result.nombre = line;
      break;
    }
  }

  // ---- Normalize bank name to official name ----
  if (result.banco && typeof matchBankLine === "function") {
    const bank = matchBankLine(result.banco);
    if (bank) result.banco = bank.name;
  }

  return result;
}

/**
 * Format a Chilean RUT string.
 * Input examples: "143835294", "14383529-4", "14.383.529-4"
 * Output: "14.383.529-4"
 */
function formatRut(rut) {
  if (!rut) return "";
  let clean = rut.replace(/[\.\-\s]/g, "").toUpperCase();
  if (clean.length < 2) return rut;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1); // dígito verificador

  // Insert dots every 3 digits from right
  let formatted = "";
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) formatted = "." + formatted;
    formatted = body[i] + formatted;
  }

  return formatted + "-" + dv;
}

/**
 * Build the final output string in the compact transfer format.
 *   12.345.678-9
 *   Nombre
 *   Banco
 *   Tipo de Cuenta
 *   NumeroCuenta
 *   email@example.com
 *
 * Only non-empty fields are included. The output is also a valid input
 * for parseBankData().
 */
function buildOutput(data) {
  const lines = [];
  if (data.rut) lines.push(formatRut(data.rut));
  if (data.nombre) lines.push(data.nombre);
  if (data.banco) lines.push(data.banco);
  if (data.tipoCuenta) lines.push(data.tipoCuenta);
  if (data.numeroCuenta) lines.push(data.numeroCuenta);
  if (data.email) lines.push(data.email);
  return lines.join("\n");
}

// Export for Node.js testing (no-op in browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseBankData, formatRut, buildOutput, FIELD_PATTERNS };
}
