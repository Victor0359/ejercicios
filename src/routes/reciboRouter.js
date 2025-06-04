// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const dailyReceiptsManager = require("../dailyReceiptsManager"); // Asegúrate de que la ruta sea correcta

// Ruta para guardar un recibo
router.post("/guardar-recibo", async (req, res) => {
  try {
    // Asumo que los datos del recibo vienen en el cuerpo de la solicitud (req.body)
    const receiptData = req.body;
    const result = await dailyReceiptsManager.saveReceipt(receiptData);
    res
      .status(200)
      .json({ message: "Recibo guardado con éxito", path: result.path });
  } catch (error) {
    console.error("Error en /guardar-recibo:", error);
    res
      .status(500)
      .json({ message: "Error al guardar el recibo", details: error.message });
  }
});

// Ruta para obtener/imprimir recibos diarios (ahora para descarga)
router.get("/imprimir-recibos-diarios", async (req, res) => {
  try {
    const date = req.query.fecha; // Obtener la fecha de la query string
    const dailyPdfPath = await dailyReceiptsManager.getDailyReceipts(date);

    if (dailyPdfPath) {
      // En lugar de imprimir, ofrecer el PDF para descarga
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
    console.error("Error en /imprimir-recibos-diarios:", error);
    res.status(500).json({
      message: "Error al obtener los recibos diarios",
      details: error.message,
    });
  }
});

// Ruta para imprimir un recibo individual (ahora para descarga)
router.post("/imprimir-recibo", async (req, res) => {
  try {
    // Asumo que los datos del recibo vienen en el cuerpo de la solicitud (req.body)
    const receiptData = req.body;
    // Generar el PDF individual sin intentar imprimirlo directamente
    const pdfBytes = await dailyReceiptsManager.generateReceiptPDF(receiptData);

    // Guardar temporalmente el PDF para la descarga
    const tempPath = path.join("/tmp", `recibo_individual_${Date.now()}.pdf`);
    await fs.writeFile(tempPath, pdfBytes);

    // Ofrecer el PDF para descarga
    res.download(
      tempPath,
      `recibo_${receiptData.numrecibo || "individual"}.pdf`,
      async (err) => {
        if (err) {
          console.error("Error al descargar el recibo individual:", err);
          res.status(500).json({
            message: "Error al descargar el recibo",
            details: err.message,
          });
        }
        // Limpiar el archivo temporal después de la descarga
        try {
          await fs.unlink(tempPath);
        } catch (unlinkErr) {
          console.warn("Error al eliminar archivo temporal:", unlinkErr);
        }
      }
    );
  } catch (error) {
    console.error("Error en /imprimir-recibo:", error);
    res.status(500).json({
      message: "Error al procesar el recibo para impresión/descarga",
      details: error.message,
    });
  }
});

module.exports = router;
