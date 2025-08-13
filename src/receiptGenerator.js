// src/receiptPDFGenerator.js
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * 🆕 Función auxiliar para crear un nuevo documento PDF con encabezado y pie de página.
 * @param {object} doc - La instancia del documento PDF.
 * @param {object} receiptData - Los datos del recibo.
 * @param {string} tipoRecibo - El tipo de recibo ("propietario" o "formulario").
 */
function createPDFHeader(doc, receiptData, tipoRecibo) {
  doc.fontSize(16).text("RECIBO DE COBRO", { align: "center" });
  doc
    .fontSize(10)
    .text(`Fecha: ${receiptData.fechaActual}`, { align: "right" });
  doc.moveDown();
  doc.text(`Recibo Nº: ${receiptData.numrecibo}`, { align: "left" });
  doc.text(`Tipo de Recibo: ${tipoRecibo.toUpperCase()}`, { align: "left" });
  doc.moveDown();
}

/**
 * 🆕 Genera un PDF para un recibo de inquilino.
 * @param {object} receiptData - Los datos del recibo.
 * @returns {Promise<Buffer>} - Un Buffer con los bytes del PDF.
 */
export async function generateTenantReceiptPDF(receiptData) {
  const doc = new PDFDocument({
    size: "A5",
    margins: {
      top: 40,
      bottom: 40,
      left: 30,
      right: 30,
    },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  createPDFHeader(doc, receiptData, "formulario");

  doc.fontSize(12).text(`Recibí de: ${receiptData.apellidoinquilino}`);
  doc.text(`La suma de pesos: ${receiptData.letra || "----"}`);
  doc.text(
    `($${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })})`
  );
  doc.moveDown();

  doc.fontSize(10).text("Conceptos:", { underline: true });
  const concepts = [
    { label: "Mensualidad", value: receiptData.importemensual },
    { label: "ABL", value: receiptData.abl },
    { label: "AYSA", value: receiptData.aysa },
    { label: "EXPENSAS COMUNES", value: receiptData.expcomunes },
    { label: "SEGURO", value: receiptData.seguro },
    { label: "VARIOS", value: receiptData.varios },
  ];

  concepts.forEach((concept) => {
    if (concept.value && concept.value > 0) {
      doc.text(
        `  ${concept.label}: $${concept.value.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
    }
  });

  doc.moveDown();
  doc.fontSize(12).text(
    `TOTAL: $${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })}`
  );

  doc.end();

  return new Promise((resolve) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * 🆕 Genera un PDF para un recibo de propietario.
 * @param {object} receiptData - Los datos del recibo.
 * @returns {Promise<Buffer>} - Un Buffer con los bytes del PDF.
 */
export async function generateOwnerReceiptPDF(receiptData) {
  const doc = new PDFDocument({
    size: "A5",
    margins: {
      top: 40,
      bottom: 40,
      left: 30,
      right: 30,
    },
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  createPDFHeader(doc, receiptData, "propietario");

  doc.fontSize(12).text(`PAGADO a: ${receiptData.apellido_propietario}`);
  doc.text(`La suma de pesos: ${receiptData.letra || "----"}`);
  doc.text(
    `($${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })})`
  );
  doc.moveDown();

  doc.fontSize(10).text("Detalle de liquidación:", { underline: true });
  // Asumiendo que los datos de propietario tienen un formato similar
  const concepts = [
    { label: "Total Recaudado", value: receiptData.total_recaudado },
    { label: "Gastos", value: receiptData.gastos },
    { label: "Comisión", value: receiptData.comision },
  ];

  concepts.forEach((concept) => {
    if (concept.value && concept.value > 0) {
      doc.text(
        `  ${concept.label}: $${concept.value.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`
      );
    }
  });

  doc.moveDown();
  doc.fontSize(12).text(
    `Total a pagar: $${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })}`
  );

  doc.end();

  return new Promise((resolve) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
