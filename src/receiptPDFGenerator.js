// src/receiptPDFGenerator.js
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const A5_WIDTH = 148 * 2.83465; // Ancho de A5 en puntos (1mm = 2.83465 puntos)
const A5_HEIGHT = 210 * 2.83465; // Alto de A5 en puntos

// 🆕 MARGENES AJUSTADOS A 1.5 cm (aproximadamente 42.5 puntos)
const MARGIN_1_5_CM = 1.5 * 10 * 2.83465;

/**
 * Genera un PDF para el recibo de cobro del inquilino con los datos proporcionados.
 * @param {object} receiptData - Objeto con los datos del recibo.
 * @returns {Promise<Uint8Array>} - Los bytes del PDF generado.
 */
async function generateTenantReceiptPDF(receiptData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH, A5_HEIGHT]);
  const { width, height } = page.getSize();
  const fontSize = 10;

  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // 🔧 Se usan los nuevos márgenes de 1.5 cm
  const marginLeft = MARGIN_1_5_CM;
  const marginRight = MARGIN_1_5_CM;
  let currentY = height - 40;

  // 🔷 Encabezado y Fecha en la misma línea
  page.drawText("RECIBO DE COBRO", {
    x: marginLeft,
    y: currentY,
    size: 16,
    font: titleFont,
    color: rgb(0, 0.2, 0.6),
  });

  const fechaText = `Fecha: ${receiptData.fechaActual || "N/D"}`;
  const fechaWidth = bodyFont.widthOfTextAtSize(fechaText, fontSize);
  page.drawText(fechaText, {
    x: width - marginRight - fechaWidth,
    y: currentY,
    size: fontSize,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;
  page.drawLine({
    start: { x: marginLeft, y: currentY },
    end: { x: width - marginRight, y: currentY },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  // 🔹 Detalles del recibo: Nº y Mes Cont en la misma línea
  currentY -= 30;
  page.drawText(`Recibo Nº: ${receiptData.numrecibo || "N/D"}`, {
    x: marginLeft,
    y: currentY,
    size: fontSize + 1,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  const mesContText = `Mes Cont: ${receiptData.cuota || "N/D"}`;
  const mesContWidth = bodyFont.widthOfTextAtSize(mesContText, fontSize + 1);
  page.drawText(mesContText, {
    x: width - marginRight - mesContWidth,
    y: currentY,
    size: fontSize + 1,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  function justifyText(lines, font, size, maxWidth) {
    return lines.map((line) => {
      if (line.trim().length === 0 || line.split(" ").length <= 1) {
        return line;
      }

      const words = line.split(" ");
      const lineWidth = font.widthOfTextAtSize(line, size);
      const remainingSpace = maxWidth - lineWidth;
      const numSpaces = words.length - 1;

      if (numSpaces <= 0) {
        return line;
      }

      const spacePerWord = remainingSpace / numSpaces;
      return words.join(
        " ".repeat(
          Math.floor(spacePerWord / font.widthOfTextAtSize(" ", size)) + 1
        )
      );
    });
  }

  function wrapText(text, font, size, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + " " + word, size);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  const fullDescription =
    `Recibí de: ${receiptData.apellidoinquilino || "N/D"} ` +
    `, la suma de pesos ${receiptData.letra || "N/D"}, ` +
    `($${
      receiptData.total
        ? Number(receiptData.total).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })
        : "0.00"
    }) ` +
    `en concepto de pago de la locación correspondiente a la propiedad ubicada en la localidad de ` +
    `${receiptData.localidad || "N/D"}, con frente a la calle ${
      receiptData.direccion || "N/D"
    }, ` +
    `mes de ${receiptData.mes || "N/D"} con vencimiento el día ${
      receiptData.vencimiento || "N/D"
    } de ${receiptData.mes || "N/D"}.`;

  const maxWidth = width - marginLeft - marginRight;
  const wrappedLines = wrapText(fullDescription, bodyFont, fontSize, maxWidth);
  const justifiedLines = justifyText(
    wrappedLines,
    bodyFont,
    fontSize,
    maxWidth
  );

  justifiedLines.forEach((line) => {
    page.drawText(line, {
      x: marginLeft,
      y: currentY,
      size: fontSize,
      font: bodyFont,
      color: rgb(0, 0, 0),
      lineHeight: 14,
    });
    currentY -= 14;
  });

  // 🔸 Conceptos
  currentY -= 20;
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
        y: currentY,
        size: fontSize,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      // 🔧 CORREGIDO: Alineación de los valores a la derecha
      const valueText = `$${Number(value).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`;
      const valueWidth = bodyFont.widthOfTextAtSize(valueText, fontSize);
      page.drawText(valueText, {
        x: width - marginRight - valueWidth,
        y: currentY,
        size: fontSize,
        font: bodyFont,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
    }
  });

  // 🔻 Total
  currentY -= 20;
  page.drawLine({
    start: { x: marginLeft, y: currentY },
    end: { x: width - marginRight, y: currentY },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  currentY -= 20;
  const totalText = `TOTAL: $${Number(receiptData.total).toLocaleString(
    "es-AR",
    { minimumFractionDigits: 2 }
  )}`;
  const totalWidth = titleFont.widthOfTextAtSize(totalText, fontSize + 2);
  page.drawText(totalText, {
    x: width - marginRight - totalWidth,
    y: currentY,
    size: fontSize + 2,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // ✍️ Firma
  currentY -= 50;
  page.drawLine({
    start: { x: marginLeft, y: currentY },
    end: { x: marginLeft + 200, y: currentY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  currentY -= 15;
  page.drawText("Firma y Aclaración", {
    x: marginLeft,
    y: currentY,
    size: fontSize,
    font: bodyFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  return await pdfDoc.save();
}

/**
 * Generates a PDF for an owner's receipt with the provided data.
 * @param {object} receiptData - Object with the receipt data.
 * @returns {Promise<Uint8Array>} - The generated PDF bytes.
 */
async function generateOwnerReceiptPDF(receiptData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A5_WIDTH, A5_HEIGHT]);
  const { width, height } = page.getSize();
  const fontSize = 10;

  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const marginLeft = MARGIN_1_5_CM;
  const marginRight = MARGIN_1_5_CM;
  let yPosition = height - 40;

  // 🔷 Header con título y fecha en la misma línea
  page.drawText("RECIBO PROPIETARIO", {
    x: marginLeft,
    y: yPosition,
    size: 16,
    font: titleFont,
    color: rgb(0, 0.2, 0.6),
  });

  const fechaText = `Fecha: ${receiptData.fechaActual || "N/D"}`;
  const fechaWidth = bodyFont.widthOfTextAtSize(fechaText, fontSize);
  page.drawText(fechaText, {
    x: width - marginRight - fechaWidth,
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

  // 🔹 Detalles del recibo: Nº y Mes Cont en la misma línea
  yPosition -= 30;
  page.drawText(`Recibo Nº: ${receiptData.numrecibo || "N/D"}`, {
    x: marginLeft,
    y: yPosition,
    size: fontSize + 1,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  const mesContText = `Mes Cont: ${receiptData.cuota || "N/D"}`;
  const mesContWidth = bodyFont.widthOfTextAtSize(mesContText, fontSize + 1);
  page.drawText(mesContText, {
    x: width - marginRight - mesContWidth,
    y: yPosition,
    size: fontSize + 1,
    font: bodyFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText(
    `Fecha Rec Pago: ${
      new Date(receiptData.fecha).toLocaleDateString("es-AR") || "N/D"
    }`,
    {
      x: marginLeft,
      y: yPosition,
      size: fontSize,
      font: bodyFont,
      color: rgb(0, 0, 0),
    }
  );

  yPosition -= 20;

  function wrapText(text, font, size, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + " " + word, size);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  const fullDescription =
    `Recibí de GARROTE PROPIEDADES la suma de pesos ${
      receiptData.letra || "N/D"
    }, ` +
    `($${
      receiptData.total
        ? Number(receiptData.total).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })
        : "0.00"
    }) ` +
    `, en concepto de pago de la locación correspondiente a la propiedad ubicada en la localidad de ` +
    `${receiptData.localidad || "N/D"}, con frente a la calle ${
      receiptData.direccion || "N/D"
    }, ` +
    `, mes de ${receiptData.mes || "N/D"}, con vencimiento el dia ${
      receiptData.vencimiento || "N/D"
    } de ${receiptData.mes || "N/D"}.`;

  const descriptionLines = wrapText(
    fullDescription,
    bodyFont,
    fontSize,
    width - marginLeft - marginRight
  );

  descriptionLines.forEach((line) => {
    page.drawText(line, {
      x: marginLeft,
      y: yPosition,
      size: fontSize,
      font: bodyFont,
      color: rgb(0, 0, 0),
      lineHeight: 14,
    });
    yPosition -= 14;
  });

  // 🔸 Concepts
  yPosition -= 20;
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
    { label: "EXPENSAS EXTRAORDINARIAS", value: receiptData.exp_extraor },
    { label: "SEGURO", value: receiptData.seguro },
    { label: "VARIOS", value: receiptData.varios },
    { label: "HONORARIOS", value: receiptData.honorarios },
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

      // 🔧 CORREGIDO: Alineación de los valores a la derecha
      const valueText = `$${Number(value).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`;
      const valueWidth = bodyFont.widthOfTextAtSize(valueText, fontSize);
      page.drawText(valueText, {
        x: width - marginRight - valueWidth,
        y: yPosition,
        size: fontSize,
        font: bodyFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
  });

  // 🔻 Highlighted total
  yPosition -= 20;
  page.drawLine({
    start: { x: marginLeft, y: yPosition },
    end: { x: width - marginLeft, y: yPosition },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  yPosition -= 20;
  const totalText = `TOTAL: $${Number(receiptData.total).toLocaleString(
    "es-AR",
    { minimumFractionDigits: 2 }
  )}`;
  const totalWidth = titleFont.widthOfTextAtSize(totalText, fontSize + 2);
  page.drawText(totalText, {
    x: width - marginRight - totalWidth,
    y: yPosition,
    size: fontSize + 2,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1),
  });

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

// Exporta ambas funciones
module.exports = { generateTenantReceiptPDF, generateOwnerReceiptPDF };
