// receiptGenerator.js
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const A5_WIDTH = 148 * 2.83465;
const A5_HEIGHT = 210 * 2.83465;

const express = require("express");
const router = express.Router();

// tu ruta
router.post("/print-receipt", async (req, res) => {
  try {
    const pdfBytes = await generateReceiptPDF(req.body);
    console.log("Datos recibidos en /print-receipt:", req.body);

    // lógica para guardar o imprimir
    res.status(200).json({ message: "Recibo impreso correctamente" });
  } catch (err) {
    console.error("Error en /print-receipt:", err);
    res.status(500).json({ message: "Error interno en impresión" });
  }
});

async function generateReceiptPDF(receiptData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH, A5_HEIGHT]);
  const { width, height } = page.getSize();
  const fontSize = 10;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Margen izquierdo para mejor legibilidad
  const marginLeft = 30;

  // Encabezado
  page.drawText("RECIBO DE COBRO", {
    x: marginLeft,
    y: height - 40,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  // Fecha y número de recibo
  page.drawText(`Fecha: ${receiptData.fechaActual}`, {
    x: width - 150,
    y: height - 40,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText(`La suma de pesos: ${receiptData.letra || "----"}`, {
    x: marginLeft,
    y: yPosition,
  });

  page.drawText(`Recibo Nº: ${receiptData.numrecibo}`, {
    x: marginLeft,
    y: height - 70,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Cuerpo del recibo
  let yPosition = height - 100;

  page.drawText(`Recibí de: ${receiptData.apellidoinquilino}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  page.drawText(`La suma de pesos: ${receiptData.letra}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize,
    font,
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
      font,
      color: rgb(0, 0, 0),
    }
  );

  yPosition -= 30;

  // Detalles de los conceptos
  const concepts = [
    { label: "Mensualidad", value: receiptData.importemensual },
    { label: "ABL", value: receiptData.abl },
    { label: "AYSA", value: receiptData.aysa },
    { label: "EXPENSAS COMUNES", value: receiptData.expcomunes },
    { label: "SEGURO", value: receiptData.seguro },
    { label: "VARIOS", value: receiptData.varios },
  ];

  concepts.forEach((concept) => {
    if (concept.value > 0) {
      page.drawText(
        `${concept.label}: $${concept.value.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`,
        {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        }
      );
      yPosition -= 20;
    }
  });

  // Total
  yPosition -= 20;
  page.drawText(
    `TOTAL: $${receiptData.total.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    })}`,
    {
      x: marginLeft,
      y: yPosition,
      size: fontSize + 2,
      font,
      color: rgb(0, 0, 0),
    }
  );

  // Firma
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
    font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}
module.exports = router;
