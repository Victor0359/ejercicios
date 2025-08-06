// src/dailyOwnerReceiptsManager.js
const fs = require("fs").promises;
const path = require("path");
const { generateOwnerReceiptPDF } = require("./receiptPDFGenerator");

// This function now uses the pdf-lib PDF generator
async function saveReceipt(receiptData) {
  try {
    console.log(
      `Iniciando la generación y guardado del PDF para el recibo de propietario: ${receiptData.numrecibo}`
    );

    // Define the path and file name for the PDF to be saved
    const receiptsDir = path.join(__dirname, "receipts");
    const pdfFilePath = path.join(
      receiptsDir,
      `receipt_owner_${receiptData.numrecibo}.pdf`
    );

    // Create the folder if it doesn't exist
    await fs.mkdir(receiptsDir, { recursive: true });

    // Call the function from your receiptPDFGenerator.js file to get the PDF bytes
    const pdfBytes = await generateOwnerReceiptPDF(receiptData);

    // Save the PDF bytes to the file
    await fs.writeFile(pdfFilePath, pdfBytes);

    console.log(
      `PDF para recibo de propietario ${receiptData.numrecibo} generado y guardado en: ${pdfFilePath}`
    );
    return { success: true, path: pdfFilePath };
  } catch (error) {
    console.error(
      "Error al generar o guardar el PDF para el propietario:",
      error
    );
    throw error;
  }
}

module.exports = {
  saveReceipt,
};
