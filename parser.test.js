// ---------------------------------------------------------------------------
// parser.test.js – Tests for parseBankData, formatRut, buildOutput
// Zero-dependency: uses Node's built-in assert module
// Run with: node parser.test.js
// ---------------------------------------------------------------------------

const assert = require("assert");

// Load banks.js into global scope so parser.js can see matchBankLine
const banksModule = require("./banks");
global.matchBankLine = banksModule.matchBankLine;
const { BANKS, findBank } = banksModule;

const { parseBankData, formatRut, buildOutput } = require("./parser");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function describe(suite, fn) {
  console.log(`\n${suite}`);
  fn();
}

// ===========================
// parseBankData tests
// ===========================

describe("parseBankData – empty / null input", () => {
  test("returns empty object for null", () => {
    assert.deepStrictEqual(parseBankData(null), {});
  });

  test("returns empty object for undefined", () => {
    assert.deepStrictEqual(parseBankData(undefined), {});
  });

  test("returns empty object for empty string", () => {
    assert.deepStrictEqual(parseBankData(""), {});
  });

  test("returns empty object for whitespace-only string", () => {
    assert.deepStrictEqual(parseBankData("   \n\n  "), {});
  });
});

describe("parseBankData – multi-line format (standard)", () => {
  test("parses standard multi-line bank data", () => {
    const input = `Nombre: Juan Pérez
Rut: 14.383.529-4
Banco: Banco Estado
Tipo de cuenta: Cuenta Vista
Numero de cuenta: 123456789
Email: juan@example.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan Pérez");
    assert.strictEqual(result.rut, "14.383.529-4");
    assert.strictEqual(result.banco, "Banco Estado");
    assert.strictEqual(result.tipoCuenta, "Cuenta Vista");
    assert.strictEqual(result.numeroCuenta, "123456789");
    assert.strictEqual(result.email, "juan@example.com");
  });

  test("parses multi-line with different label casing", () => {
    const input = `NOMBRE: María López
RUT: 12345678-9
BANCO: Banco de Chile
TIPO DE CUENTA: Cuenta Corriente
NUMERO DE CUENTA: 987654321
EMAIL: maria@test.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "María López");
    assert.strictEqual(result.rut, "12345678-9");
    assert.strictEqual(result.banco, "Banco de Chile");
    assert.strictEqual(result.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(result.numeroCuenta, "987654321");
    assert.strictEqual(result.email, "maria@test.cl");
  });
});

describe("parseBankData – alternative label variations", () => {
  test("parses 'Titular' instead of 'Nombre'", () => {
    const input = `Titular: Pedro Soto
Rut: 11111111-1
Banco: Santander
Tipo de cuenta: Ahorro
N° cuenta: 55555
Email: pedro@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Pedro Soto");
  });

  test("parses 'Nombre del titular' label", () => {
    const input = `Nombre del titular: Ana García
Rut: 22222222-2
Banco: BCI
Tipo de cuenta: Vista
Numero de cuenta: 66666
Correo: ana@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Ana García");
  });

  test("parses 'Beneficiario' label", () => {
    const input = `Beneficiario: Luis Torres
Rut: 33333333-3
Banco: Scotiabank
Tipo de cuenta: Corriente
Cuenta N°: 77777
E-mail: luis@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Luis Torres");
  });

  test("parses 'Destinatario' label", () => {
    const input = `Destinatario: Carla Díaz
Rut: 44444444-4
Banco: Itaú
Tipo de cuenta: Vista
N° de cuenta: 88888
Correo electrónico: carla@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Carla Díaz");
  });
});

describe("parseBankData – RUT label variations", () => {
  test("parses 'R.U.T.' label", () => {
    const input = `Nombre: Test
R.U.T.: 12345678-K
Banco: Test Bank
Tipo de cuenta: Vista
Numero de cuenta: 111
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "12345678-K");
  });

  test("parses 'R.U.T' label (no trailing dot)", () => {
    const input = `Nombre: Test
R.U.T: 98765432-1
Banco: Test Bank
Tipo de cuenta: Vista
Numero de cuenta: 222
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "98765432-1");
  });
});

describe("parseBankData – banco label variations", () => {
  test("parses 'Banco de destino' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco de destino: Banco Falabella
Tipo de cuenta: Vista
Numero de cuenta: 333
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Banco Falabella");
  });

  test("parses 'Institución financiera' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Institución financiera: Banco Estado
Tipo de cuenta: Vista
Numero de cuenta: 444
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Banco Estado");
  });

  test("parses 'Institucion' (without accent) label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Institucion financiera: Banco Security
Tipo de cuenta: Vista
Numero de cuenta: 555
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Banco Security");
  });
});

describe("parseBankData – cuenta number label variations", () => {
  test("parses 'N° cuenta' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
N° cuenta: 999888
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "999888");
  });

  test("parses 'Nº de cuenta' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Nº de cuenta: 777666
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "777666");
  });

  test("parses 'Cuenta N°' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Cuenta N°: 555444
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "555444");
  });

  test("parses 'Número de Cuenta' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Número de Cuenta: 333222
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "333222");
  });

  test("parses 'Numero cuenta' (no accent, no de) label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Numero cuenta: 111000
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "111000");
  });

  test("parses 'N# cuenta' label (hash symbol)", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
N# cuenta: 444333
Email: test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.numeroCuenta, "444333");
  });
});

describe("parseBankData – email label variations", () => {
  test("parses 'Correo' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Numero de cuenta: 111
Correo: user@domain.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.email, "user@domain.cl");
  });

  test("parses 'Correo electrónico' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Numero de cuenta: 111
Correo electrónico: user@domain.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.email, "user@domain.cl");
  });

  test("parses 'Correo electronico' (no accent) label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Numero de cuenta: 111
Correo electronico: user@domain.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.email, "user@domain.cl");
  });

  test("parses 'E-mail' label", () => {
    const input = `Nombre: Test
Rut: 11111111-1
Banco: Test
Tipo de cuenta: Vista
Numero de cuenta: 111
E-mail: user@domain.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.email, "user@domain.cl");
  });
});

describe("parseBankData – single-line / inline formats", () => {
  test("parses all fields on one line separated by labels", () => {
    const input =
      "Nombre: Juan Pérez Rut: 14383529-4 Banco: Banco Estado Tipo de cuenta: Vista Numero de cuenta: 123456 Email: juan@mail.com";

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan Pérez");
    assert.strictEqual(result.rut, "14383529-4");
    assert.strictEqual(result.banco, "Banco Estado");
    assert.strictEqual(result.tipoCuenta, "Vista");
    assert.strictEqual(result.numeroCuenta, "123456");
    assert.strictEqual(result.email, "juan@mail.com");
  });
});

describe("parseBankData – partial data (missing fields)", () => {
  test("handles missing email", () => {
    const input = `Nombre: Juan
Rut: 11111111-1
Banco: BCI
Tipo de cuenta: Corriente
Numero de cuenta: 123`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan");
    assert.strictEqual(result.rut, "11111111-1");
    assert.strictEqual(result.email, undefined);
  });

  test("handles only name and RUT", () => {
    const input = `Nombre: Juan\nRut: 11111111-1`;
    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan");
    assert.strictEqual(result.rut, "11111111-1");
    assert.strictEqual(result.banco, undefined);
  });

  test("handles text with no recognizable labels", () => {
    const input = "Just some random text with no bank data";
    const result = parseBankData(input);
    // Pass 2 heuristic assigns the first unmatched line as nombre
    assert.strictEqual(result.nombre, "Just some random text with no bank data");
    assert.strictEqual(result.rut, undefined);
  });
});

describe("parseBankData – whitespace and formatting edge cases", () => {
  test("handles extra whitespace around colons", () => {
    const input = `Nombre :  Juan Pérez
Rut :  14383529-4
Banco :  Banco Estado
Tipo de cuenta :  Vista
Numero de cuenta :  123456
Email :  juan@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan Pérez");
    assert.strictEqual(result.rut, "14383529-4");
  });

  test("handles Windows-style line endings (\\r\\n)", () => {
    const input =
      "Nombre: Juan\r\nRut: 11111111-1\r\nBanco: BCI\r\nTipo de cuenta: Vista\r\nNumero de cuenta: 123\r\nEmail: j@m.com";

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan");
    assert.strictEqual(result.rut, "11111111-1");
    assert.strictEqual(result.banco, "Banco BCI - Mach");
    assert.strictEqual(result.email, "j@m.com");
  });

  test("handles leading/trailing whitespace in input", () => {
    const input = `
    Nombre: Juan Pérez
    Rut: 14383529-4
    Banco: Banco Estado
    Tipo de cuenta: Vista
    Numero de cuenta: 123456
    Email: juan@mail.com
    `;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan Pérez");
    assert.strictEqual(result.email, "juan@mail.com");
  });
});

describe("parseBankData – real-world copy-paste formats", () => {
  test("parses WhatsApp-style message with labels", () => {
    const input = `Datos para transferencia:
Titular: Francisca Muñoz
Rut: 16.789.012-3
Banco: Banco Santander
Tipo de cuenta: Cuenta Corriente
N° de cuenta: 0012345678
Correo: fran.munoz@gmail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Francisca Muñoz");
    assert.strictEqual(result.rut, "16.789.012-3");
    assert.strictEqual(result.banco, "Banco Santander");
    assert.strictEqual(result.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(result.numeroCuenta, "0012345678");
    assert.strictEqual(result.email, "fran.munoz@gmail.com");
  });

  test("parses format with 'Nombre Titular' label", () => {
    const input = `Nombre Titular: Roberto Vega
Rut: 9.876.543-2
Banco de destino: Banco Falabella
Tipo de cuenta: Cuenta Vista
Numero de cuenta: 9988776655
Email: rvega@empresa.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Roberto Vega");
    assert.strictEqual(result.banco, "Banco Falabella");
  });

  test("parses format with mixed label styles", () => {
    const input = `Beneficiario: Claudia Ríos
R.U.T.: 15.432.198-7
Institución financiera: BCI
Tipo de Cuenta: Cuenta RUT
Cuenta N°: 154321987
Correo electrónico: claudia.rios@outlook.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Claudia Ríos");
    assert.strictEqual(result.rut, "15.432.198-7");
    assert.strictEqual(result.banco, "Banco BCI - Mach");
    assert.strictEqual(result.tipoCuenta, "Cuenta RUT");
    assert.strictEqual(result.numeroCuenta, "154321987");
    assert.strictEqual(result.email, "claudia.rios@outlook.com");
  });
});

// ===========================
// formatRut tests
// ===========================

describe("formatRut – basic formatting", () => {
  test("formats RUT without separators", () => {
    assert.strictEqual(formatRut("143835294"), "14.383.529-4");
  });

  test("formats RUT with dash only", () => {
    assert.strictEqual(formatRut("14383529-4"), "14.383.529-4");
  });

  test("formats already-formatted RUT (idempotent)", () => {
    assert.strictEqual(formatRut("14.383.529-4"), "14.383.529-4");
  });

  test("formats RUT with K check digit", () => {
    assert.strictEqual(formatRut("12345678K"), "12.345.678-K");
  });

  test("formats RUT with lowercase k (uppercased)", () => {
    assert.strictEqual(formatRut("12345678k"), "12.345.678-K");
  });

  test("formats short RUT (< 8 digits)", () => {
    assert.strictEqual(formatRut("1234567-8"), "1.234.567-8");
  });

  test("formats very short RUT", () => {
    assert.strictEqual(formatRut("12345-6"), "12.345-6");
  });
});

describe("formatRut – edge cases", () => {
  test("returns empty string for null", () => {
    assert.strictEqual(formatRut(null), "");
  });

  test("returns empty string for undefined", () => {
    assert.strictEqual(formatRut(undefined), "");
  });

  test("returns empty string for empty string", () => {
    assert.strictEqual(formatRut(""), "");
  });

  test("returns original for single character", () => {
    assert.strictEqual(formatRut("5"), "5");
  });

  test("handles RUT with spaces", () => {
    assert.strictEqual(formatRut("14 383 529-4"), "14.383.529-4");
  });

  test("handles RUT with dots and spaces", () => {
    assert.strictEqual(formatRut("14. 383.529 - 4"), "14.383.529-4");
  });
});

// ===========================
// buildOutput tests
// ===========================

describe("buildOutput – complete data", () => {
  test("builds compact output with all fields", () => {
    const data = {
      nombre: "Juan Pérez",
      rut: "143835294",
      banco: "Banco Estado",
      tipoCuenta: "Cuenta Vista",
      numeroCuenta: "123456789",
      email: "juan@example.com",
    };

    const output = buildOutput(data);
    const lines = output.split("\n");
    assert.strictEqual(lines.length, 6);
    assert.strictEqual(lines[0], "14.383.529-4");
    assert.strictEqual(lines[1], "Juan Pérez");
    assert.strictEqual(lines[2], "Banco Estado");
    assert.strictEqual(lines[3], "Cuenta Vista");
    assert.strictEqual(lines[4], "123456789");
    assert.strictEqual(lines[5], "juan@example.com");
  });

  test("builds output with pre-formatted RUT", () => {
    const data = {
      nombre: "Test",
      rut: "14.383.529-4",
      banco: "BCI",
      tipoCuenta: "Vista",
      numeroCuenta: "111",
      email: "t@t.com",
    };

    const output = buildOutput(data);
    assert.ok(output.includes("14.383.529-4"));
    assert.ok(output.includes("Vista"));
    assert.ok(output.includes("111"));
  });
});

describe("buildOutput – partial data", () => {
  test("builds output omitting missing fields", () => {
    const data = {
      nombre: "Juan",
      rut: "111111111",
    };

    const output = buildOutput(data);
    const lines = output.split("\n");
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[0], "11.111.111-1");
    assert.strictEqual(lines[1], "Juan");
  });

  test("builds output with only numeroCuenta (no tipo)", () => {
    const output = buildOutput({ numeroCuenta: "123" });
    assert.strictEqual(output, "123");
  });

  test("builds output with only tipoCuenta (no numero)", () => {
    const output = buildOutput({ tipoCuenta: "Cuenta Corriente" });
    assert.strictEqual(output, "Cuenta Corriente");
  });

  test("builds empty string for empty data object", () => {
    const output = buildOutput({});
    assert.strictEqual(output, "");
  });
});

// ===========================
// Integration: parse → build round-trip
// ===========================

describe("Integration – parse then build", () => {
  test("round-trip from labeled text to compact output", () => {
    const input = `Nombre: Juan Pérez
Rut: 143835294
Banco: Banco Estado
Tipo de cuenta: Cuenta Vista
Numero de cuenta: 123456789
Email: juan@example.com`;

    const parsed = parseBankData(input);
    const output = buildOutput(parsed);
    const lines = output.split("\n");

    assert.strictEqual(lines[0], "14.383.529-4");
    assert.strictEqual(lines[1], "Juan Pérez");
    assert.strictEqual(lines[2], "Banco Estado");
    assert.strictEqual(lines[3], "Cuenta Vista");
    assert.strictEqual(lines[4], "123456789");
    assert.strictEqual(lines[5], "juan@example.com");
  });

  test("round-trip with alternative labels", () => {
    const input = `Beneficiario: Claudia Ríos
R.U.T.: 15432198-7
Institución financiera: BCI
Tipo de Cuenta: Cuenta RUT
Cuenta N°: 154321987
Correo electrónico: claudia@test.com`;

    const parsed = parseBankData(input);
    const output = buildOutput(parsed);
    const lines = output.split("\n");

    assert.strictEqual(lines[0], "15.432.198-7");
    assert.strictEqual(lines[1], "Claudia Ríos");
    assert.strictEqual(lines[2], "Banco BCI - Mach");
    assert.strictEqual(lines[3], "Cuenta RUT");
    assert.strictEqual(lines[4], "154321987");
    assert.strictEqual(lines[5], "claudia@test.com");
  });

  test("compact output is a valid input (round-trip)", () => {
    const original = {
      nombre: "JORGE ANDRES MIRANDA SOTO",
      rut: "176543210",
      banco: "Banco Ripley",
      tipoCuenta: "Cuenta Corriente",
      numeroCuenta: "7019876543",
      email: "jorge.miranda@example.com",
    };

    const output = buildOutput(original);
    // Output should look like the new compact format
    assert.strictEqual(
      output,
      "17.654.321-0\n" +
      "JORGE ANDRES MIRANDA SOTO\n" +
      "Banco Ripley\n" +
      "Cuenta Corriente\n" +
      "7019876543\n" +
      "jorge.miranda@example.com"
    );

    // Now parse the output back
    const reparsed = parseBankData(output);
    assert.strictEqual(reparsed.nombre, "JORGE ANDRES MIRANDA SOTO");
    assert.strictEqual(reparsed.rut, "17.654.321-0");
    assert.strictEqual(reparsed.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(reparsed.numeroCuenta, "7019876543");
    assert.strictEqual(reparsed.banco, "Banco Ripley");
    assert.strictEqual(reparsed.email, "jorge.miranda@example.com");
  });
});

// ===========================
// parseBankData – compact format (output as input)
// ===========================

describe("parseBankData – compact format (no labels)", () => {
  test("parses the exact compact output format", () => {
    const input = `JORGE ANDRES MIRANDA SOTO
RUT: 17.654.321-0
Cuenta Corriente Nº 7019876543
Banco Ripley
jorge.miranda@example.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "JORGE ANDRES MIRANDA SOTO");
    assert.strictEqual(result.rut, "17.654.321-0");
    assert.strictEqual(result.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(result.numeroCuenta, "7019876543");
    assert.strictEqual(result.banco, "Banco Ripley");
    assert.strictEqual(result.email, "jorge.miranda@example.com");
  });

  test("parses compact format with Cuenta Vista", () => {
    const input = `María López
RUT: 14.383.529-4
Cuenta Vista Nº 123456789
Banco Estado
maria@test.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "María López");
    assert.strictEqual(result.rut, "14.383.529-4");
    assert.strictEqual(result.tipoCuenta, "Cuenta Vista");
    assert.strictEqual(result.numeroCuenta, "123456789");
    assert.strictEqual(result.banco, "Banco Estado");
    assert.strictEqual(result.email, "maria@test.cl");
  });

  test("parses compact format with Cuenta RUT", () => {
    const input = `Pedro Soto
RUT: 11.111.111-1
Cuenta RUT Nº 111111111
Banco Estado
pedro@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.tipoCuenta, "Cuenta RUT");
    assert.strictEqual(result.numeroCuenta, "111111111");
  });

  test("parses compact format with Cuenta Ahorro", () => {
    const input = `Ana García
RUT: 22.222.222-2
Cuenta Ahorro Nº 5556667
Banco Santander
ana@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.tipoCuenta, "Cuenta Ahorro");
    assert.strictEqual(result.numeroCuenta, "5556667");
  });

  test("detects email without label in compact format", () => {
    const input = `Juan Pérez
RUT: 12.345.678-9
Cuenta Corriente Nº 999
Banco BCI
juan.perez@empresa.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.email, "juan.perez@empresa.cl");
  });

  test("detects bank name without colon in compact format", () => {
    const input = `Test User
RUT: 11.111.111-1
Cuenta Vista Nº 555
Banco Falabella
test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Banco Falabella");
  });

  test("detects name as first unmatched line", () => {
    const input = `Carlos Fuentes Meza
RUT: 99.999.999-9
Cuenta Corriente Nº 777
Banco de Chile
carlos@fuentes.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Carlos Fuentes Meza");
  });

  test("parses compact format with Windows line endings", () => {
    const input = "Test User\r\nRUT: 11.111.111-1\r\nCuenta Vista Nº 555\r\nBanco BCI\r\ntest@test.com";

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Test User");
    assert.strictEqual(result.rut, "11.111.111-1");
    assert.strictEqual(result.tipoCuenta, "Cuenta Vista");
    assert.strictEqual(result.numeroCuenta, "555");
    assert.strictEqual(result.banco, "Banco BCI - Mach");
    assert.strictEqual(result.email, "test@test.com");
  });

  test("ignores section headers ending with colon", () => {
    const input = `Datos bancarios:
Juan Pérez
RUT: 12.345.678-9
Cuenta Corriente Nº 999
Banco BCI
juan@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.nombre, "Juan Pérez");
  });
});

// ===========================
// findBank / matchBankLine tests
// ===========================

describe("findBank – exact name match", () => {
  test("finds bank by official name", () => {
    const bank = findBank("Banco de Chile");
    assert.ok(bank);
    assert.strictEqual(bank.code, "001");
  });

  test("finds bank case-insensitively", () => {
    const bank = findBank("banco estado");
    assert.ok(bank);
    assert.strictEqual(bank.code, "012");
  });

  test("finds bank by alias", () => {
    const bank = findBank("BCI");
    assert.ok(bank);
    assert.strictEqual(bank.code, "016");
  });

  test("finds Scotiabank by alias", () => {
    const bank = findBank("scotia");
    assert.ok(bank);
    assert.strictEqual(bank.code, "014");
  });

  test("returns undefined for unknown bank", () => {
    assert.strictEqual(findBank("Banco Inventado"), undefined);
  });

  test("returns undefined for null", () => {
    assert.strictEqual(findBank(null), undefined);
  });
});

describe("matchBankLine – line matching", () => {
  test("matches direct bank name", () => {
    const bank = banksModule.matchBankLine("Banco Ripley");
    assert.ok(bank);
    assert.strictEqual(bank.code, "053");
  });

  test("matches alias without Banco prefix", () => {
    const bank = banksModule.matchBankLine("Coopeuch");
    assert.ok(bank);
    assert.strictEqual(bank.code, "672");
  });

  test("matches after stripping Banco prefix", () => {
    const bank = banksModule.matchBankLine("Banco Santander");
    assert.ok(bank);
    assert.strictEqual(bank.code, "037");
  });

  test("matches Tenpo", () => {
    const bank = banksModule.matchBankLine("Tenpo");
    assert.ok(bank);
    assert.strictEqual(bank.code, "730");
  });

  test("matches Mercado Pago", () => {
    const bank = banksModule.matchBankLine("Mercado Pago");
    assert.ok(bank);
    assert.strictEqual(bank.code, "875");
  });

  test("matches Global 66", () => {
    const bank = banksModule.matchBankLine("Global 66");
    assert.ok(bank);
    assert.strictEqual(bank.code, "738");
  });
});

// ===========================
// parseBankData – bank detection from known list
// ===========================

describe("parseBankData – compact format with known banks (no Banco prefix)", () => {
  test("detects Scotiabank (no Banco prefix)", () => {
    const input = `Juan Pérez
RUT: 12.345.678-9
Cuenta Corriente Nº 999
Scotiabank
juan@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Scotiabank");
    assert.strictEqual(result.nombre, "Juan Pérez");
  });

  test("detects BCI as bank name on its own line", () => {
    const input = `María López
RUT: 11.111.111-1
Cuenta Vista Nº 555
BCI
maria@test.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Banco BCI - Mach");
    assert.strictEqual(result.nombre, "María López");
  });

  test("detects Coopeuch without Banco prefix", () => {
    const input = `Pedro Soto
RUT: 22.222.222-2
Cuenta Ahorro Nº 777
Coopeuch
pedro@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Coopeuch");
  });

  test("detects Tenpo without Banco prefix", () => {
    const input = `Ana García
RUT: 33.333.333-3
Cuenta Vista Nº 888
Tenpo
ana@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Tenpo");
  });

  test("detects Mercado Pago without Banco prefix", () => {
    const input = `Luis Torres
RUT: 44.444.444-4
Cuenta Vista Nº 999
Mercado Pago
luis@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Mercado Pago");
  });

  test("detects Global 66", () => {
    const input = `Carla Díaz
RUT: 55.555.555-5
Cuenta Vista Nº 111
Global 66
carla@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Global 66");
  });

  test("does not confuse bank name for person name", () => {
    const input = `Scotiabank
RUT: 12.345.678-9
Cuenta Corriente Nº 999
juan@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Scotiabank");
    // Name should not be Scotiabank
    assert.notStrictEqual(result.nombre, "Scotiabank");
  });

  test("detects Prepago Los Héroes", () => {
    const input = `Test User
RUT: 11.111.111-1
Cuenta Vista Nº 123
Prepago Los Héroes
test@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Prepago Los Héroes");
  });
});

// ===========================
// parseBankData – new bare-line format (output as input)
// ===========================

describe("parseBankData – bare-line format (no labels, no combined lines)", () => {
  test("parses 6-line bare format with all fields", () => {
    const input = `18.432.765-2
Camila Riquelme Soto
Banco Estado
Chequera Electrónica
83270561234
camila.riquelme@correo.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "18.432.765-2");
    assert.strictEqual(result.nombre, "Camila Riquelme Soto");
    assert.strictEqual(result.banco, "Banco Estado");
    assert.strictEqual(result.tipoCuenta, "Chequera Electrónica");
    assert.strictEqual(result.numeroCuenta, "83270561234");
    assert.strictEqual(result.email, "camila.riquelme@correo.cl");
  });

  test("parses bare format with Cuenta Corriente", () => {
    const input = `9.876.543-2
Roberto Vega Fuentes
Banco de Chile
Cuenta Corriente
5501234567
rvega@empresa.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "9.876.543-2");
    assert.strictEqual(result.nombre, "Roberto Vega Fuentes");
    assert.strictEqual(result.banco, "Banco de Chile");
    assert.strictEqual(result.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(result.numeroCuenta, "5501234567");
    assert.strictEqual(result.email, "rvega@empresa.cl");
  });

  test("parses bare format with Cuenta Vista", () => {
    const input = `15.678.901-K
Daniela Morales
Scotiabank
Cuenta Vista
8801234
dmorales@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "15.678.901-K");
    assert.strictEqual(result.nombre, "Daniela Morales");
    assert.strictEqual(result.banco, "Scotiabank");
    assert.strictEqual(result.tipoCuenta, "Cuenta Vista");
    assert.strictEqual(result.numeroCuenta, "8801234");
    assert.strictEqual(result.email, "dmorales@mail.com");
  });

  test("parses bare format with Cuenta RUT", () => {
    const input = `20.123.456-7
Felipe Araya
Banco Estado
Cuenta RUT
201234567
felipe.araya@gmail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "20.123.456-7");
    assert.strictEqual(result.nombre, "Felipe Araya");
    assert.strictEqual(result.banco, "Banco Estado");
    assert.strictEqual(result.tipoCuenta, "Cuenta RUT");
    assert.strictEqual(result.numeroCuenta, "201234567");
    assert.strictEqual(result.email, "felipe.araya@gmail.com");
  });

  test("parses bare format with Cuenta Ahorro", () => {
    const input = `12.987.654-3
Andrea Pizarro
Banco Santander
Cuenta Ahorro
6109988776
apizarro@outlook.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.tipoCuenta, "Cuenta Ahorro");
    assert.strictEqual(result.numeroCuenta, "6109988776");
  });

  test("parses bare format with Chequera Electrónica", () => {
    const input = `7.654.321-0
Gonzalo Sepúlveda
Banco Estado
Chequera Electrónica
44556677
gsepulveda@test.cl`;

    const result = parseBankData(input);
    assert.strictEqual(result.tipoCuenta, "Chequera Electrónica");
    assert.strictEqual(result.banco, "Banco Estado");
  });

  test("round-trip: build → parse → build produces same output", () => {
    const original = {
      nombre: "Valentina Muñoz Rojas",
      rut: "16789012-3",
      banco: "Banco Falabella",
      tipoCuenta: "Cuenta Vista",
      numeroCuenta: "9012345678",
      email: "vmunoz@mail.cl",
    };

    const output1 = buildOutput(original);
    const reparsed = parseBankData(output1);
    const output2 = buildOutput(reparsed);
    assert.strictEqual(output1, output2);
  });

  test("parses bare format with Windows line endings", () => {
    const input = "14.567.890-1\r\nIgnacio Vargas\r\nBanco BCI - Mach\r\nCuenta Corriente\r\n7890123456\r\nivargas@correo.cl";

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "14.567.890-1");
    assert.strictEqual(result.nombre, "Ignacio Vargas");
    assert.strictEqual(result.banco, "Banco BCI - Mach");
    assert.strictEqual(result.tipoCuenta, "Cuenta Corriente");
    assert.strictEqual(result.numeroCuenta, "7890123456");
    assert.strictEqual(result.email, "ivargas@correo.cl");
  });

  test("parses bare format with bank alias (no Banco prefix)", () => {
    const input = `11.222.333-4
Laura Figueroa
Coopeuch
Cuenta Vista
4455667788
lfigueroa@test.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.banco, "Coopeuch");
    assert.strictEqual(result.nombre, "Laura Figueroa");
  });

  test("does not confuse digit-only account number with RUT", () => {
    const input = `19.876.543-K
Tomás Bravo
Banco Ripley
Cuenta Vista
12345678901
tbravo@mail.com`;

    const result = parseBankData(input);
    assert.strictEqual(result.rut, "19.876.543-K");
    assert.strictEqual(result.numeroCuenta, "12345678901");
  });
});

// ===========================
// Summary
// ===========================

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
}
console.log("=".repeat(50));

process.exit(failed > 0 ? 1 : 0);
