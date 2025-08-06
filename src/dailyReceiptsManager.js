// src/dailyReceiptsManager.js
// Importaciones CommonJS
const fs = require("fs").promises;
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// 🔧 CORREGIDO: Importar generateTenantReceiptPDF (o generateOwnerReceiptPDF si es el caso)
const {
  generateTenantReceiptPDF,
  generateOwnerReceiptPDF,
} = require("./receiptPDFGenerator");

// Función para obtener el módulo PDFMerger de forma asíncrona
async function getPDFMerger() {
  const { default: PDFMerger } = await import("pdf-merger-js");
  return PDFMerger;
}

// Configuración de carpetas
const receiptsFolder = path.join(__dirname, "receipts"); // src/receipts
const dailyFolder = path.join(__dirname, "daily"); // src/daily
const tempFolder = path.join(__dirname, "temp"); // src/temp

async function limpiarRecibosDelDia() {
  const hoy = new Date().toISOString().split("T")[0];

  // 🧼 1. Limpiar recibos individuales
  try {
    const recibos = await fs.readdir(receiptsFolder);
    for (const archivo of recibos) {
      if (archivo.endsWith(".pdf")) {
        const ruta = path.join(receiptsFolder, archivo);
        await fs.unlink(ruta);
        console.log("🗑️ Recibo individual eliminado:", archivo);
      }
    }
  } catch (err) {
    console.error("Error al limpiar recibos individuales:", err.message);
  }

  // 🧼 2. Limpiar PDFs diarios anteriores
  try {
    const diarios = await fs.readdir(dailyFolder);
    for (const archivo of diarios) {
      if (archivo.endsWith(".pdf") && archivo !== `${hoy}.pdf`) {
        const ruta = path.join(dailyFolder, archivo);
        await fs.unlink(ruta);
        console.log("🧹 PDF diario eliminado:", archivo);
      }
    }
  } catch (err) {
    console.error("Error al limpiar PDFs del día:", err.message);
  }
}

// Crear carpetas si no existen
async function ensureFoldersExist() {
  await fs.mkdir(receiptsFolder, { recursive: true });
  await fs.mkdir(dailyFolder, { recursive: true });
  await fs.mkdir(tempFolder, { recursive: true });
}

// Guardar recibo individual y agregar al PDF diario
async function saveReceipt(receiptData) {
  try {
    await ensureFoldersExist();

    // 🔧 CORREGIDO: Usar la función de generación de PDF correcta (Tenant o Owner)
    // Asumiendo que esta función es para recibos de inquilinos.
    const pdfBytes = await generateTenantReceiptPDF(receiptData);

    if (!receiptData.numrecibo) {
      throw new Error("Falta el número de recibo");
    }
    const receiptPath = path.join(
      receiptsFolder,
      `receipt_${String(receiptData.numrecibo)}.pdf`
    );
    console.log("Datos recibidos en saveReceipt:", receiptData);
    await fs.writeFile(receiptPath, pdfBytes); // Guarda el PDF individual

    const today = new Date().toISOString().split("T")[0];
    const dailyPath = path.join(dailyFolder, `${today}.pdf`); // Ruta del PDF diario

    const MyPDFMerger = await getPDFMerger();
    const mergerInstance = new MyPDFMerger();

    try {
      // Intenta leer el PDF diario existente para añadirle el nuevo
      const existingPdf = await fs.readFile(dailyPath);
      await mergerInstance.add(existingPdf);
    } catch (err) {
      // Si el archivo diario no existe, no hay problema, se creará uno nuevo al guardar
      console.log(
        `No existe PDF diario previo para ${today}, se creará uno nuevo.`
      );
    }

    await mergerInstance.add(pdfBytes); // Añade el PDF individual al PDF diario
    await mergerInstance.save(dailyPath); // Guarda el PDF diario actualizado

    console.log(`PDF diario para ${today} actualizado en: ${dailyPath}`);

    return { success: true, path: receiptPath };
  } catch (error) {
    console.error("Error al guardar recibo:", error);
    throw error;
  }
}

// Obtener recibos del día (solo devuelve la ruta al PDF diario si existe)
async function getDailyReceipts(date) {
  const dateStr = date || new Date().toISOString().split("T")[0];
  const dailyPath = path.join(dailyFolder, `${dateStr}.pdf`);
  console.log("Ruta PDF diario solicitada:", dailyPath);

  try {
    await fs.access(dailyPath); // Verifica si el archivo existe
    return dailyPath; // Si existe, devuelve la ruta
  } catch (error) {
    console.log(
      `PDF diario para la fecha ${dateStr} no encontrado en ${dailyPath}.`
    );
    return null; // Si no existe, devuelve null
  }
}

// Exporta las funciones que se usarán en otros módulos CommonJS
module.exports = {
  saveReceipt,
  getDailyReceipts,
  // Puedes exportar otras funciones si las necesitas en otros lugares
  // generateTenantReceiptPDF, // No es necesario exportar desde aquí si ya se importa
  limpiarRecibosDelDia,
};
