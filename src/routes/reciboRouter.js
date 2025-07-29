// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises; // Usar .promises para funciones asíncronas de fs

// Importa las funciones de tu dailyReceiptsManager.js
// Asegúrate de que la ruta sea correcta según la ubicación de este archivo
const dailyReceiptsManager = require("../dailyReceiptsManager");

// Middleware para parsear el cuerpo de las solicitudes POST como JSON
// Asegúrate de que esto también esté en tu index.js para que funcione globalmente
// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));

// --- Rutas para la gestión de recibos ---

// Ruta POST para guardar un recibo
router.post("/guardar-recibo", async (req, res) => {
  try {
    // Asumo que los datos del recibo vienen en el cuerpo de la solicitud (req.body)
    const receiptData = req.body;
    if (!receiptData) {
      return res
        .status(400)
        .json({ message: "Datos del recibo no proporcionados." });
    }
    console.log("Datos recibidos en POST /guardar-recibo:", receiptData);

    const result = await dailyReceiptsManager.saveReceipt(receiptData);
    res
      .status(200)
      .json({ message: "Recibo guardado con éxito", path: result.path });
  } catch (error) {
    console.error("Error en POST /guardar-recibo:", error);
    res
      .status(500)
      .json({ message: "Error al guardar el recibo", details: error.message });
  }
});

// Ruta GET para generar y descargar un recibo individual (llamada desde btnImprimirUno)
router.get("/generar_pdf/:numrecibo", async (req, res) => {
  try {
    const numrecibo = req.params.numrecibo;
    // Aquí necesitas obtener los datos del recibo por su número para generar el PDF.
    // Esto es una suposición, tu lógica real podría ser diferente.
    // Por ejemplo, podrías tener una función en dailyReceiptsManager para obtener datos por numrecibo.
    // const receiptData = await dailyReceiptsManager.getReceiptDataByNum(numrecibo);
    // if (!receiptData) {
    //     return res.status(404).json({ message: "Datos del recibo no encontrados." });
    // }

    // Si el PDF ya está guardado y quieres servirlo directamente:
    const receiptPath = path.join(
      __dirname,
      "../src/receipts",
      `receipt_${numrecibo}.pdf`
    ); // Ajusta la ruta si es diferente

    // Asegúrate de que el archivo exista antes de intentar descargarlo
    try {
      await fs.access(receiptPath);
    } catch (err) {
      console.error(`Archivo de recibo no encontrado en ${receiptPath}:`, err);
      // Si el archivo no existe, puedes intentar generarlo al vuelo si tienes los datos
      // Por ahora, si no existe, devolvemos 404
      return res
        .status(404)
        .json({ message: "PDF del recibo individual no encontrado." });
    }

    res.download(receiptPath, `recibo_${numrecibo}.pdf`, (err) => {
      if (err) {
        console.error("Error al descargar el recibo individual:", err);
        res.status(500).json({
          message: "Error al descargar el recibo",
          details: err.message,
        });
      }
    });
  } catch (error) {
    console.error("Error en GET /generar_pdf/:numrecibo:", error);
    res.status(500).json({
      message: "Error al procesar el recibo individual",
      details: error.message,
    });
  }
});

// Ruta GET para generar y descargar todos los recibos del día (llamada desde btnImprimirTodos)
router.get("/generar_pdfs_dia", async (req, res) => {
  try {
    const date = req.query.fecha || new Date().toISOString().split("T")[0]; // Obtener la fecha de la query string o la actual
    const dailyPdfPath = await dailyReceiptsManager.getDailyReceipts(date); // Obtiene la ruta del PDF diario

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

// Nota: La ruta POST /imprimir recibo que aparece en tus logs no está definida aquí,
// ya que el script EJS que proporcionaste hace llamadas GET.
// Si esa ruta POST es utilizada por otra parte de tu frontend, deberás definirla.

module.exports = router;
