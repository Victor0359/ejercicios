// receiptPDFGenerator.js
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs").promises;

const A5_WIDTH = 148 * 2.83465;
const A5_HEIGHT = 210 * 2.83465;

async function generateReceiptPDF(receiptData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH, A5_HEIGHT]);
  const { width, height } = page.getSize();
  const fontSize = 10;
  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const marginLeft = 30;
  let yPosition = height - 40;

  // 🔷 Encabezado con título
  page.drawText("RECIBO DE COBRO", {
    x: marginLeft,
    y: yPosition,
    size: 16,
    font: titleFont,
    color: rgb(0, 0.2, 0.6),
  });

  // Fecha alineada derecha
  page.drawText(`Fecha: ${receiptData.fechaActual}`, {
    x: width - 150,
    y: yPosition,
    size: fontSize,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawLine({
    start: { x: marginLeft, y: yPosition },
    end: { x: width - marginLeft, y: yPosition },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  // 🔹 Datos del recibo
  yPosition -= 30;
  page.drawText(`Recibo Nº: ${receiptData.numrecibo}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize + 1,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText(`Recibí de: ${receiptData.apellidoinquilino}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText(`La suma de pesos: ${receiptData.letra}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText(
    `($${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })})`,
    {
      x: marginLeft,
      y: yPosition,
      size: fontSize,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    }
  );

  // 🔸 Conceptos
  yPosition -= 30;
  page.drawText("Conceptos:", {
    x: marginLeft,
    y: yPosition,
    size: fontSize + 1,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  yPosition -= 10;

  const concepts = [
    { label: "Mensualidad", value: receiptData.importemensual },
    { label: "ABL", value: receiptData.abl },
    { label: "AYSA", value: receiptData.aysa },
    { label: "EXPENSAS COMUNES", value: receiptData.expcomunes },
    { label: "SEGURO", value: receiptData.seguro },
    { label: "VARIOS", value: receiptData.varios },
  ];

  concepts.forEach(({ label, value }) => {
    if (value > 0) {
      page.drawText(`${label}:`, {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText(
        `$${value.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`,
        {
          x: width - 100,
          y: yPosition,
          size: fontSize,
          font: bodyFont,
          color: rgb(0, 0, 0),
        }
      );

      yPosition -= 15;
    }
  });

  // 🔻 Total destacado
  yPosition -= 20;
  page.drawLine({
    start: { x: marginLeft, y: yPosition },
    end: { x: width - marginLeft, y: yPosition },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  yPosition -= 20;
  page.drawText(
    `TOTAL: $${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })}`,
    {
      x: width - 180,
      y: yPosition,
      size: fontSize + 2,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    }
  );

  // ✍️ Firma
  yPosition -= 50;
  page.drawLine({
    start: { x: marginLeft, y: yPosition },
    end: { x: marginLeft + 200, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;
  page.drawText("Firma y Aclaración", {
    x: marginLeft,
    y: yPosition,
    size: fontSize,
    font: bodyFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  return await pdfDoc.save();
}

module.exports = { generateReceiptPDF };
