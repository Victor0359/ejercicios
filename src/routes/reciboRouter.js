// routes/reciboRouter.js
// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises; // Usar .promises para funciones asíncronas de fs

// Importa las funciones de tu dailyReceiptsManager.js
const dailyReceiptsManager = require("../dailyReceiptsManager");

// --- Funciones de Lógica Central ---

// Lógica para guardar un recibo
async function handleSaveReceiptLogic(req, res) {
  try {
    const receiptData = req.body;
    if (!receiptData) {
      return res
        .status(400)
        .json({ message: "Datos del recibo no proporcionados." });
    }
    console.log("Datos recibidos para guardar recibo:", receiptData);

    const result = await dailyReceiptsManager.saveReceipt(receiptData);
    res.status(200).json({
      success: true,
      message: "Recibo guardado con éxito",
      path: result.path,
    });
  } catch (error) {
    console.error("Error al guardar recibo:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar el recibo",
      details: error.message,
    });
  }
}

// Lógica para generar y descargar un recibo individual
async function handleGenerateIndividualPdfLogic(req, res) {
  try {
    const numrecibo = req.params.numrecibo || req.body.numrecibo; // Puede venir de params (GET) o body (POST)
    if (!numrecibo) {
      return res
        .status(400)
        .json({ message: "Número de recibo no proporcionado." });
    }

    const receiptPath = path.join(
      __dirname,
      "../src/receipts",
      `receipt_${numrecibo}.pdf`
    );

    try {
      await fs.access(receiptPath); // Verifica si el archivo existe
      res.download(receiptPath, `recibo_${numrecibo}.pdf`, (err) => {
        if (err) {
          console.error("Error al descargar el recibo individual:", err);
          res.status(500).json({
            message: "Error al descargar el recibo",
            details: err.message,
          });
        }
      });
    } catch (err) {
      console.warn(
        `PDF para recibo ${numrecibo} no encontrado en ${receiptPath}. Intentando generar al vuelo.`
      );
      // Si el PDF no existe, intenta generarlo al vuelo si tienes los datos
      // Aquí necesitarías una forma de obtener los 'receiptData' completos por 'numrecibo'
      // desde tu base de datos o donde los almacenes.
      // Por ejemplo: const receiptData = await yourDbFunction.getReceiptDataByNum(numrecibo);
      // if (receiptData) {
      //     const pdfBytes = await dailyReceiptsManager.generateReceiptPDF(receiptData);
      //     const tempFilePath = path.join("/tmp", `recibo_${numrecibo}_${Date.now()}.pdf`);
      //     await fs.writeFile(tempFilePath, pdfBytes);
      //     res.download(tempFilePath, `recibo_${numrecibo}.pdf`, async (downloadErr) => {
      //         if (downloadErr) console.error("Error al descargar PDF generado al vuelo:", downloadErr);
      //         try { await fs.unlink(tempFilePath); } catch (unlinkErr) { console.warn("Error al eliminar temp file:", unlinkErr); }
      //     });
      // } else {
      return res.status(404).json({
        message:
          "PDF del recibo individual no encontrado o no se pudo generar (datos no disponibles).",
      });
      // }
    }
  } catch (error) {
    console.error("Error al procesar el recibo individual:", error);
    res.status(500).json({
      message: "Error al procesar el recibo individual",
      details: error.message,
    });
  }
}

// Lógica para generar y descargar todos los recibos del día
async function handleGenerateDailyPdfsLogic(req, res) {
  try {
    const date = req.query.fecha || new Date().toISOString().split("T")[0]; // Obtener la fecha de la query string o la actual
    const dailyPdfPath = await dailyReceiptsManager.getDailyReceipts(date);

    if (dailyPdfPath) {
      res.download(dailyPdfPath, `recibos_diarios_${date}.pdf`, (err) => {
        if (err) {
          console.error("Error al descargar el PDF diario:", err);
          res.status(500).json({
            message: "Error al descargar el PDF",
            details: err.message,
          });
        }
      });
    } else {
      res.status(404).json({
        message: "No se encontró PDF diario para la fecha especificada.",
      });
    }
  } catch (error) {
    console.error("Error al obtener los recibos diarios:", error);
    res.status(500).json({
      message: "Error al obtener los recibos diarios",
      details: error.message,
    });
  }
}

// --- Definición de Rutas y Aliases ---

// Ruta principal para guardar un recibo (POST)
router.post("/save-receipt", handleSaveReceiptLogic);
// Alias para la ruta de guardar recibo (si el frontend aún llama a /guardar-recibo)
router.post("/guardar-recibo", handleSaveReceiptLogic);

// Ruta principal para generar y descargar un recibo individual (GET)
router.get("/generar_pdf/:numrecibo", handleGenerateIndividualPdfLogic);
// Alias para la ruta de imprimir recibo individual (si el frontend aún llama a /imprimir recibo con POST)
// Nota: Este alias maneja POST y generará el PDF al vuelo si no existe previamente.
router.post("/imprimir-recibo", handleGenerateIndividualPdfLogic);

// Ruta principal para generar y descargar todos los recibos del día (GET)
router.get("/generar_pdfs_dia", handleGenerateDailyPdfsLogic);
// Alias para la ruta de imprimir todos los recibos del día (si el frontend aún llama a /imprimir-recibos-diarios)
router.get("/imprimir-recibos-diarios", handleGenerateDailyPdfsLogic);

module.exports = router;
