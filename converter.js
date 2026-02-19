// ---------------------------------------------------------------------------
// converter.js – UI logic for the converter popup window
// ---------------------------------------------------------------------------

const $ = (sel) => document.querySelector(sel);

const FIELD_IDS = ["nombre", "rut", "banco", "tipoCuenta", "numeroCuenta", "email"];

/**
 * On load: read clipboard → parse → fill fields.
 */
document.addEventListener("DOMContentLoaded", async () => {
  let clipText = "";

  try {
    clipText = await navigator.clipboard.readText();
  } catch (err) {
    console.warn("Clipboard read failed:", err);
  }

  const data = parseBankData(clipText);
  const hasFields = FIELD_IDS.some((k) => k !== "email" && data[k]);

  if (!hasFields) {
    $("#no-data").classList.remove("hidden");
    // Still show editable fields so the user can fill manually
    $("#fields-grid").classList.remove("hidden");
    $("#btn-convert").disabled = false;
    populateFields(data);
    attachListeners();
    return;
  }

  // Format RUT for display
  if (data.rut) {
    data.rut = formatRut(data.rut);
  }

  $("#fields-grid").classList.remove("hidden");
  $("#btn-convert").disabled = false;
  populateFields(data);
  attachListeners();

  // Auto-focus the email field since it usually needs manual entry
  const emailInput = $("#f-email");
  if (!data.email) {
    emailInput.focus();
  }
});

/**
 * Fill each input from parsed data.
 */
function populateFields(data) {
  for (const key of FIELD_IDS) {
    const input = $(`#f-${key}`);
    if (input && data[key]) {
      input.value = data[key];
    }
  }
}

/**
 * Read current values from the form inputs.
 */
function readFields() {
  const data = {};
  for (const key of FIELD_IDS) {
    data[key] = $(`#f-${key}`).value.trim();
  }
  return data;
}

/**
 * Attach button listeners.
 */
function attachListeners() {
  $("#btn-convert").addEventListener("click", async () => {
    const data = readFields();
    const output = buildOutput(data);

    try {
      await navigator.clipboard.writeText(output);
      $("#success-msg").classList.remove("hidden");
      $("#btn-convert").textContent = "¡Copiado!";

      // Close window after a short delay
      setTimeout(() => window.close(), 1200);
    } catch (err) {
      console.error("Clipboard write failed:", err);
      alert("No se pudo escribir al portapapeles. Intenta de nuevo.");
    }
  });
}
