const express = require("express");
const router = express.Router();
const manager = require("../dailyReceiptsManager");

router.post("/print-receipt", async (req, res) => {
  try {
    if (!req.body.numrecibo || !req.body.apellidoinquilino) {
      return res.status(400).json({ error: "Datos del recibo incompletos" });
    }

    const result = await manager.printReceipt(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error en /print-receipt:", error);
    res.status(500).json({
      error: "Error al imprimir recibo",
      details: error.message,
    });
  }
});

router.post("/save-receipt", async (req, res) => {
  try {
    const result = await manager.saveReceipt(req.body); // ✅ usar desde manager
    res.json(result);
  } catch (error) {
    console.error("Error en /save-receipt:", error);
    res.status(500).json({
      error: "Error al guardar recibo",
      details: error.message,
    });
  }
});

router.get("/print-daily-receipts", async (req, res) => {
  try {
    const filePath = await manager.getDailyReceipts(req.query.date);
    if (!filePath) {
      return res
        .status(404)
        .json({ message: "No hay recibos para esta fecha" });
    }

    const printerName =
      process.env.PRINTER_NAME || (await manager.getDefaultPrinter());
    await manager.printPDF(filePath, printerName); // ✅ Usa la nueva función

    res.json({ success: true });
  } catch (error) {
    console.error("Error en /print-daily-receipts:", error);
    res.status(500).json({
      error: "Error al imprimir recibos del día",
      details: error.message,
    });
  }
});

module.exports = router;
