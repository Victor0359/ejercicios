// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// 🔧 CORREGIDO: Ruta de importación de dailyReceiptsManager
const dailyReceiptsManager = require("../dailyReceiptsManager");
const recibo_contrato = require("../recibo_contrato"); // Asegúrate de que esta ruta sea correcta

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
    const numrecibo = req.params.numrecibo || req.body.numrecibo;
    if (!numrecibo) {
      return res
        .status(400)
        .json({ message: "Número de recibo no proporcionado." });
    }

    // 🔧 CORREGIDO: Ruta para acceder a los recibos individuales
    const receiptPath = path.join(
      __dirname,
      "..",
      "receipts",
      `receipt_${numrecibo}.pdf`
    );
    console.log(`Buscando PDF individual en la ruta: ${receiptPath}`);

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
          "PDF del recibo individual no encontrado o no se pudo generar (datos no disponibles).",
      });
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
    const date = req.query.fecha || new Date().toISOString().split("T")[0];
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

/**
 * 📝 Función auxiliar para convertir el número del mes a su nombre en español.
 * @param {number} monthIndex - El índice del mes (0-11).
 * @returns {string} El nombre del mes.
 */
function obtenerNombreDelMes(monthIndex) {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  // Cuota 9 corresponde a Septiembre (índice 8)
  // Restamos 1 para ajustarlo a un array base 0
  return months[monthIndex - 1] || "Mes no definido";
}

// Ruta GET para renderizar la plantilla EJS con datos completos
// router.get("/recibo_inq_impreso/:numrecibo", async (req, res) => {
//   try {
//     const numrecibo = parseInt(req.params.numrecibo);

//     // 🔧 Obtener los datos del recibo desde la base de datos usando el número de recibo
//     const [reciboDB] = await recibo_contrato.obtenerRecibo(numrecibo);
//     if (!reciboDB) {
//       return res.status(404).json({ message: "Recibo no encontrado." });
//     }

//     // Obtener datos de la propiedad y el contrato
//     const [propiedadesDB] = await recibo_contrato.obtenerContratos_Id(
//       reciboDB.id_propiedad
//     );
//     if (!propiedadesDB) {
//       return res
//         .status(404)
//         .json({ message: "Datos de propiedad no encontrados para el recibo." });
//     }

//     // 🔧 Creando un objeto `recibo` con datos limpios y dinámicos
//     const recibo = {
//       numrecibo: reciboDB.numrecibo,
//       apellidoinquilino: reciboDB.apellidoinquilino,
//       apellidopropietario: reciboDB.apellidopropietario,
//       cuota: reciboDB.cuota,
//       importemensual: reciboDB.importemensual,
//       abl: reciboDB.abl,
//       aysa: reciboDB.aysa,
//       expcomunes: reciboDB.expcomunes,
//       seguro: reciboDB.seguro,
//       varios: reciboDB.varios,
//       total: reciboDB.total,
//     };

//     // 🔧 Creando un objeto `propiedades` con datos reales
//     const propiedades = {
//       localidad: propiedadesDB.localidad,
//       direccion: propiedadesDB.direccion,
//     };

//     const fechaRecibo = new Date(reciboDB.fecha);
//     const vencimiento = fechaRecibo.getDate(); // Extraer el día de vencimiento
//     const mesContratoNombre = obtenerNombreDelMes(recibo.cuota - 1); // El mes viene como 1-12
//     const anioContrato = fechaRecibo.getFullYear();
//     const fechaActual = `${fechaRecibo.getDate()} de ${obtenerNombreDelMes(
//       fechaRecibo.getMonth()
//     )} de ${fechaRecibo.getFullYear()}`;

//     // ⚠️ La función NumeroALetras no está implementada aquí. Debes crearla tú.
//     // Si no existe, se mostrará un placeholder.
//     const letra =
//       typeof NumeroALetras === "function"
//         ? NumeroALetras(recibo.total)
//         : "Monto en letras no disponible";

//     res.render("recibo_inq_impreso", {
//       recibo,
//       propiedades,
//       vencimiento,
//       fechaActual,
//       letra,
//       mostrarNavbar: false,
//       mesContratoNombre, // Nueva variable para el nombre del mes
//       anioContrato, // Nueva variable para el año
//     });
//   } catch (error) {
//     console.error("Error al renderizar recibo_inq_impreso:", error);
//     res.status(500).json({
//       message: "Error al obtener los datos del recibo para imprimir.",
//       details: error.message,
//     });
//   }
// });

// --- Definición de Rutas y Aliases ---

// Ruta principal para guardar un recibo (POST)
router.post("/save-receipt", handleSaveReceiptLogic);
// Alias para la ruta de guardar recibo (si el frontend aún llama a /guardar-recibo)
router.post("/guardar-recibo", handleSaveReceiptLogic);

// Ruta principal para generar y descargar un recibo individual (GET)
router.get("/generar_pdf/:numrecibo", handleGenerateIndividualPdfLogic);
// Alias para la ruta de imprimir recibo individual (si el frontend aún llama a /imprimir recibo con POST)
router.post("/imprimir-recibo", handleGenerateIndividualPdfLogic);

// Ruta principal para generar y descargar todos los recibos del día (GET)
router.get("/generar_pdfs_dia", handleGenerateDailyPdfsLogic);
// Alias para la ruta de imprimir todos los recibos del día (si el frontend aún llama a /imprimir-recibos-diarios)
router.get("/imprimir-recibos-diarios", handleGenerateDailyPdfsLogic);

module.exports = router;
