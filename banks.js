// ---------------------------------------------------------------------------
// banks.js – Chilean banks available for electronic transfers (SBIF codes)
// ---------------------------------------------------------------------------

/**
 * Each entry: { code, name, aliases }
 *   code    – SBIF numeric code (string to preserve leading zeros)
 *   name    – Official / common transfer name
 *   aliases – Alternative spellings people use when sharing bank details
 */
const BANKS = [
  { code: "001", name: "Banco de Chile",            aliases: ["chile", "bch"] },
  { code: "009", name: "Banco Internacional",        aliases: ["internacional"] },
  { code: "012", name: "Banco Estado",               aliases: ["bancoestado", "banco del estado", "estado"] },
  { code: "014", name: "Scotiabank",                 aliases: ["scotiabank chile", "scotia"] },
  { code: "016", name: "Banco BCI - Mach",           aliases: ["bci", "mach", "banco bci"] },
  { code: "028", name: "Banco BICE",                 aliases: ["bice"] },
  { code: "031", name: "Banco HSBC",                 aliases: ["hsbc"] },
  { code: "037", name: "Banco Santander",            aliases: ["santander", "santander chile"] },
  { code: "039", name: "Banco Itaú",                 aliases: ["itau", "itaú", "itaú corpbanca", "itau corpbanca", "corpbanca"] },
  { code: "049", name: "Banco Security",             aliases: ["security"] },
  { code: "051", name: "Banco Falabella",            aliases: ["falabella"] },
  { code: "053", name: "Banco Ripley",               aliases: ["ripley"] },
  { code: "055", name: "Banco Consorcio",            aliases: ["consorcio"] },
  { code: "059", name: "Banco BTG Pactual Chile",    aliases: ["btg", "btg pactual"] },
  { code: "672", name: "Coopeuch",                   aliases: [] },
  { code: "729", name: "Prepago Los Héroes",         aliases: ["los heroes", "los héroes", "prepago los heroes"] },
  { code: "730", name: "Tenpo",                      aliases: [] },
  { code: "732", name: "Prepago Los Andes (Tapp)",   aliases: ["tapp", "los andes", "prepago los andes"] },
  { code: "738", name: "Global 66",                  aliases: ["global66"] },
  { code: "875", name: "Mercado Pago",               aliases: ["mercadopago"] },
];

/**
 * Try to match a string to a known bank.
 * Returns the bank entry or undefined.
 */
function findBank(text) {
  if (!text) return undefined;
  const lower = text.toLowerCase().trim();
  for (const bank of BANKS) {
    if (bank.name.toLowerCase() === lower) return bank;
    for (const alias of bank.aliases) {
      if (alias.toLowerCase() === lower) return bank;
    }
  }
  return undefined;
}

/**
 * Check whether a line of text matches a known bank name (exact or alias).
 * Returns the bank entry or undefined.
 */
function matchBankLine(line) {
  if (!line) return undefined;
  // Direct match
  const direct = findBank(line);
  if (direct) return direct;
  // Try stripping a leading "Banco " or "Banco de " prefix
  const stripped = line.replace(/^banco\s+(de\s+)?/i, "").trim();
  if (stripped !== line) {
    const m = findBank(stripped);
    if (m) return m;
  }
  return undefined;
}

// Export for Node.js testing (no-op in browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { BANKS, findBank, matchBankLine };
}
