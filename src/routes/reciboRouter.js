// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises; // Usar .promises para funciones asíncronas de fs

// Importa las funciones de tu dailyReceiptsManager.js
const dailyReceiptsManager = require("../dailyReceiptsManager");

// --- Rutas para la gestión de recibos ---

// Ruta POST para guardar un recibo (llamada desde btnGuardar en el EJS y alias para /guardar-recibo)
router.post("/save-receipt", async (req, res) => {
  try {
    const receiptData = req.body;
    if (!receiptData) {
      return res
        .status(400)
        .json({ message: "Datos del recibo no proporcionados." });
    }
    console.log("Datos recibidos en POST /save-receipt:", receiptData);

    const result = await dailyReceiptsManager.saveReceipt(receiptData);
    res.status(200).json({
      success: true,
      message: "Recibo guardado con éxito",
      path: result.path,
    });
  } catch (error) {
    console.error("Error en POST /save-receipt:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar el recibo",
      details: error.message,
    });
  }
});

// ALIAS para la ruta de guardar recibo (si alguna parte del frontend aún llama a /guardar-recibo)
router.post("/guardar-recibo", async (req, res) => {
  console.log(
    "Alias POST /guardar-recibo llamado. Redirigiendo a /save-receipt logic."
  );
  // Reutiliza la lógica de /save-receipt
  return await router.handle(req, res, () => {
    /* no next() */
  }); // Llama al manejador de /save-receipt
});

// Ruta GET para generar y descargar un recibo individual (llamada desde btnImprimir en el EJS)
router.get("/generar_pdf/:numrecibo", async (req, res) => {
  try {
    const numrecibo = req.params.numrecibo;
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
        `PDF para recibo ${numrecibo} no encontrado en ${receiptPath}.`
      );
      return res.status(404).json({
        message:
          "PDF del recibo individual no encontrado o no se pudo generar.",
      });
    }
  } catch (error) {
    console.error("Error en GET /generar_pdf/:numrecibo:", error);
    res.status(500).json({
      message: "Error al procesar el recibo individual",
      details: error.message,
    });
  }
});

// ALIAS para la ruta de imprimir recibo individual (si alguna parte del frontend aún llama a /imprimir recibo con POST)
// Nota: Tu EJS llama a /generar_pdf/:numrecibo con GET. Este alias es para llamadas POST.
router.post("/imprimir-recibo", async (req, res) => {
  console.log(
    "Alias POST /imprimir-recibo llamado. Intentando generar y descargar PDF."
  );
  try {
    // Asumo que los datos del recibo vienen en el cuerpo de la solicitud (req.body)
    const receiptData = req.body;
    if (!receiptData || !receiptData.numrecibo) {
      return res.status(400).json({
        message: "Datos del recibo o número de recibo no proporcionados.",
      });
    }

    // Generar el PDF individual al vuelo (ya que no se encontró en la ruta GET)
    const pdfBytes = await dailyReceiptsManager.generateReceiptPDF(receiptData);
    const tempFilePath = path.join(
      "/tmp",
      `recibo_individual_${receiptData.numrecibo}_${Date.now()}.pdf`
    );
    await fs.writeFile(tempFilePath, pdfBytes);

    res.download(
      tempFilePath,
      `recibo_${receiptData.numrecibo}.pdf`,
      async (err) => {
        if (err) {
          console.error("Error al descargar PDF generado al vuelo:", err);
          res.status(500).json({
            message: "Error al descargar el recibo",
            details: err.message,
          });
        }
        try {
          await fs.unlink(tempFilePath);
        } catch (unlinkErr) {
          console.warn("Error al eliminar temp file:", unlinkErr);
        }
      }
    );
  } catch (error) {
    console.error("Error en ALIAS POST /imprimir-recibo:", error);
    res.status(500).json({
      message: "Error al procesar el recibo para impresión/descarga",
      details: error.message,
    });
  }
});

// Ruta GET para generar y descargar todos los recibos del día (llamada desde btnImprimirDia en el EJS)
router.get("/generar_pdfs_dia", async (req, res) => {
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
    console.error("Error en GET /generar_pdfs_dia:", error);
    res.status(500).json({
      message: "Error al obtener los recibos diarios",
      details: error.message,
    });
  }
});

// ALIAS para la ruta de imprimir todos los recibos del día (si alguna parte del frontend aún llama a /imprimir-recibos-diarios)
router.get("/imprimir-recibos-diarios", async (req, res) => {
  console.log(
    "Alias GET /imprimir-recibos-diarios llamado. Redirigiendo a /generar_pdfs_dia logic."
  );
  // Reutiliza la lógica de /generar_pdfs_dia
  return await router.handle(req, res, () => {
    /* no next() */
  }); // Llama al manejador de /generar_pdfs_dia
});

module.exports = router;
