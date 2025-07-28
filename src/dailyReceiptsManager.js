// src/dailyReceiptsManager.js
// pdfService.js (antes agruparPdf.js)

// Importaciones CommonJS
const fs = require("fs").promises; // Usar .promises para funciones asíncronas de fs
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { generateReceiptPDF } = require("./receiptPDFGenerator");
const printer = require("./printer"); // Asegúrate de que este módulo sea CommonJS o maneja ESM

// Función para obtener el módulo PDFMerger de forma asíncrona
// Esto es necesario porque 'pdf-merger-js' es un ES Module
async function getPDFMerger() {
  const { default: PDFMerger } = await import("pdf-merger-js");
  return PDFMerger;
}

// Configuración
const A5_WIDTH = 148 * 2.83465;
const A5_HEIGHT = 210 * 2.83465;
// __dirname está disponible en módulos CommonJS
const receiptsFolder = path.join(__dirname, "receipts");
const dailyFolder = path.join(__dirname, "daily");
const tempFolder = path.join(__dirname, "temp");

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

async function printPDF(pathToFile, printerName) {
  // Nota: El error "Sistema operativo no compatible" para la impresión
  // podría persistir si 'pdf-to-printer' no es compatible con el entorno de Render.
  // Esta función solo se ha adaptado a la sintaxis, no a la compatibilidad del SO.
  await printer.print(pathToFile, {
    printer: printerName,
    paperSize: "A5",
  });
}

// Generar PDF (esta función parece incompleta, pero la mantengo como está)
async function dailyReceiptsManager(receiptData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH, A5_HEIGHT]);

  return await pdfDoc.save();
}

// Guardar recibo individual y agregar al PDF diario
async function saveReceipt(receiptData) {
  try {
    await ensureFoldersExist();

    const pdfBytes = await generateReceiptPDF(receiptData);
    if (!receiptData.numrecibo) {
      throw new Error("Falta el número de recibo");
    }
    const receiptPath = path.join(
      receiptsFolder,
      `receipt_${String(receiptData.numrecibo)}.pdf`
    );
    console.log("Datos recibidos en saveReceipt:", receiptData);
    await fs.writeFile(receiptPath, pdfBytes);

    const today = new Date().toISOString().split("T")[0];
    const dailyPath = path.join(dailyFolder, `${today}.pdf`);

    // Obtener la clase PDFMerger de forma asíncrona
    const MyPDFMerger = await getPDFMerger();
    const mergerInstance = new MyPDFMerger(); // Instancia el merger aquí

    try {
      // Intenta leer el PDF diario existente
      const existingPdf = await fs.readFile(dailyPath);
      await mergerInstance.add(existingPdf);
    } catch (err) {
      // Si el archivo no existe, no hay problema, simplemente no se añade
      // console.log("No existe PDF diario previo, creando uno nuevo.");
    }

    await mergerInstance.add(pdfBytes); // Añade el nuevo recibo
    await mergerInstance.save(dailyPath); // Guarda el PDF diario actualizado

    return { success: true, path: receiptPath };
  } catch (error) {
    console.error("Error al guardar recibo:", error);
    throw error;
  }
}

// Obtener recibos del día
async function getDailyReceipts(date) {
  const dateStr = date || new Date().toISOString().split("T")[0];
  const dailyPath = path.join(dailyFolder, `${dateStr}.pdf`);
  console.log("Ruta PDF diario:", dailyPath);

  try {
    await fs.access(dailyPath);
    return dailyPath;
  } catch (error) {
    return null;
  }
}

// Imprimir recibo
async function printReceipt(receiptData) {
  try {
    await ensureFoldersExist();

    const pdfBytes = await generateReceiptPDF(receiptData);
    const tempPath = path.join(tempFolder, `receipt_${Date.now()}.pdf`);

    await fs.writeFile(tempPath, pdfBytes);

    // Nota: Si getDefaultPrinter() usa 'printer.getPrinters()',
    // y 'printer' es 'pdf-to-printer', esto podría fallar en Render.
    const printerName = process.env.PRINTER_NAME || (await getDefaultPrinter());
    await printer.print(tempPath, {
      printer: printerName,
      paperSize: "A5",
    });
    console.log("Datos recibidos:", receiptData);
    console.log("Generando PDF...");
    console.log("Impresora:", printerName);
    console.log("Ruta temporal del archivo:", tempPath);
    console.log("Bytes generados:", pdfBytes.length);

    await fs.unlink(tempPath);
    return { success: true };
  } catch (error) {
    console.error("Error al imprimir:", error);
    throw error;
  }
}

// Obtener impresora por defecto
async function getDefaultPrinter() {
  // Esto dependerá de la compatibilidad de 'pdf-to-printer' con el SO de Render.
  // Si falla, es posible que necesites un enfoque diferente para la impresión en la nube.
  const printers = await printer.getPrinters();
  return printers.find((p) => p.isDefault)?.name || "Microsoft Print to PDF";
}

// Exporta las funciones que se usarán en otros módulos CommonJS
module.exports = {
  generateReceiptPDF,
  saveReceipt,
  getDailyReceipts,
  printReceipt,
  printPDF,
  getDefaultPrinter,
  limpiarRecibosDelDia,
};
