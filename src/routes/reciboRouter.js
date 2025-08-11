// routes/reciboRouter.js
const express = require("express");
const router = express.Router();
const path = require("path");

// ⚠️ Este 'const' es crucial. Asegúrate de que no se haya borrado.
const fs = require("fs").promises;

const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const pdfMerger = require("pdf-merger-js");

// 🔧 Importamos todas las funciones necesarias desde los módulos
const dailyReceiptsManager = require("../dailyReceiptsManager");
const {
  generateTenantReceiptPDF,
  generateOwnerReceiptPDF,
} = require("../receiptPDFGenerator");

// 🆕 Importamos las funciones de la base de datos
const recibo_prop = require("../recibosPropietarios");
const propiedades = require("../propiedades");
const funcion_letras = require("../funcion_letras");
const recibo_form = require("../recibosFormulario");

/**
 * 📂 Función auxiliar para obtener las rutas de los archivos PDF
 * basadas en el tipo de recibo.
 * @param {string} tipoRecibo - "propietario" o "formulario".
 * @returns {object} - Un objeto con las rutas de las carpetas.
 */
function getReceiptPaths(tipoRecibo) {
  const baseReceiptsDir = path.join(__dirname, "..", "receipts");
  const baseDailyDir = path.join(__dirname, "..", "daily");

  if (tipoRecibo === "propietario") {
    return {
      receiptsDir: path.join(baseReceiptsDir, "propietarios"),
      dailyDir: path.join(baseDailyDir, "propietarios"),
    };
  } else if (tipoRecibo === "formulario") {
    return {
      receiptsDir: path.join(baseReceiptsDir, "formulario"),
      dailyDir: path.join(baseDailyDir, "formulario"),
    };
  } else {
    throw new Error("Tipo de recibo no válido.");
  }
}

/**
 * 🆕 Función auxiliar para obtener y formatear todos los datos del recibo
 * desde la base de datos, ahora con soporte para ambos tipos.
 * @param {string} numrecibo - El número del recibo a buscar.
 * @param {string} tipoRecibo - "propietario" o "formulario".
 * @returns {Promise<object | null>} - Un objeto con todos los datos o null si no se encuentra.
 */
async function fetchCompleteReceiptData(numrecibo, tipoRecibo) {
  try {
    let resultado;
    if (tipoRecibo === "propietario") {
      resultado = await recibo_prop.recibosPropietarios(numrecibo);
    } else if (tipoRecibo === "formulario") {
      resultado = await recibo_form.recibosFormulario(numrecibo);
    } else {
      console.error("Tipo de recibo no válido en fetchCompleteReceiptData.");
      return null;
    }

    if (!Array.isArray(resultado) || resultado.length === 0) {
      console.warn(`No se encontró recibo con numrecibo = ${numrecibo}`);
      return null;
    }
    const reciboData = resultado[0];

    const propiedadId = parseInt(reciboData.id_propiedad, 10);
    const datosPropiedades = await propiedades.obtenerPropiedadesPorId(
      propiedadId
    );

    let propiedadParaVista = {};
    if (
      datosPropiedades &&
      typeof datosPropiedades === "object" &&
      Object.keys(datosPropiedades).length > 0
    ) {
      propiedadParaVista = datosPropiedades;
    }

    const fechaDelRecibo = new Date(reciboData.fecha);
    const fechaActual = fechaDelRecibo.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const mesContrato = fechaDelRecibo
      .toLocaleDateString("es-AR", { month: "long" })
      .toUpperCase();

    const ultimoDiaDelMes = (fecha) =>
      new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    const vencimiento = ultimoDiaDelMes(fechaDelRecibo);

    const letra = funcion_letras.numeroALetras(reciboData.total);

    return {
      ...reciboData,
      ...propiedadParaVista,
      letra,
      mes: mesContrato,
      vencimiento,
      fechaActual,
    };
  } catch (err) {
    console.error("Error al obtener los datos del recibo:", err);
    return null;
  }
}

// Lógica para generar y descargar un recibo individual
async function handleGenerateIndividualPdfLogic(req, res) {
  try {
    const tipoRecibo = req.params.tipoRecibo || req.body.tipoRecibo;
    const numrecibo = req.params.numrecibo || req.body.numrecibo;

    // ⚠️ Esta validación es la que dispara el error 400
    if (!tipoRecibo || !numrecibo) {
      return res
        .status(400)
        .json({ message: "Tipo o número de recibo no proporcionado." });
    }

    const { receiptsDir } = getReceiptPaths(tipoRecibo);
    await fs.mkdir(receiptsDir, { recursive: true });

    const receiptPath = path.join(receiptsDir, `receipt_${numrecibo}.pdf`);

    try {
      await fs.access(receiptPath);
      res.download(receiptPath, `recibo_${tipoRecibo}_${numrecibo}.pdf`);
    } catch (err) {
      const receiptData = await fetchCompleteReceiptData(numrecibo, tipoRecibo);
      if (!receiptData) {
        return res.status(404).json({
          message: "Datos del recibo no encontrados para generar el PDF.",
        });
      }

      // Se usa la función de generación de PDF adecuada según el tipo de recibo
      const pdfBytes =
        tipoRecibo === "propietario"
          ? await generateOwnerReceiptPDF(receiptData)
          : await generateTenantReceiptPDF(receiptData);

      await fs.writeFile(receiptPath, pdfBytes);
      res.download(receiptPath, `recibo_${tipoRecibo}_${numrecibo}.pdf`);
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
    const tipoRecibo = req.params.tipoRecibo || req.query.tipoRecibo;
    const date = req.query.fecha || new Date().toISOString().split("T")[0];

    if (!tipoRecibo) {
      return res
        .status(400)
        .json({ message: "Tipo de recibo no proporcionado." });
    }

    const { dailyDir } = getReceiptPaths(tipoRecibo);
    await fs.mkdir(dailyDir, { recursive: true });

    const dailyPdfPath = path.join(dailyDir, `${date}.pdf`);

    try {
      await fs.access(dailyPdfPath);
    } catch (err) {
      let receiptNumbers;
      if (tipoRecibo === "propietario") {
        receiptNumbers = await recibo_prop.getRecibosPorFecha(date);
      } else if (tipoRecibo === "formulario") {
        receiptNumbers = await recibo_form.getRecibosPorFecha(date);
      }

      if (!receiptNumbers || receiptNumbers.length === 0) {
        return res.status(404).json({
          message: `No se encontraron recibos para la fecha ${date}.`,
        });
      }

      const merger = new pdfMerger();
      for (const numrecibo of receiptNumbers) {
        const receiptData = await fetchCompleteReceiptData(
          numrecibo,
          tipoRecibo
        );
        if (receiptData) {
          const pdfBytes =
            tipoRecibo === "propietario"
              ? await generateOwnerReceiptPDF(receiptData)
              : await generateTenantReceiptPDF(receiptData);
          merger.add(pdfBytes);
        }
      }

      await merger.save(dailyPdfPath);
    }

    res.download(dailyPdfPath, `recibos_diarios_${tipoRecibo}_${date}.pdf`);
  } catch (error) {
    console.error("Error al obtener o generar los recibos diarios:", error);
    res.status(500).json({
      message: "Error al obtener o generar los recibos diarios",
      details: error.message,
    });
  }
}

/**
 * 🆕 Función para manejar la lógica de guardar un nuevo recibo.
 * @param {object} req - Objeto de la solicitud HTTP.
 * @param {object} res - Objeto de la respuesta HTTP.
 */
async function handleSaveReceiptLogic(req, res) {
  try {
    const { tipoRecibo, ...receiptData } = req.body;

    // ⚠️ Esta validación es la que causa el error 400 que viste en el log.
    if (!tipoRecibo) {
      return res
        .status(400)
        .json({ message: "Tipo de recibo no proporcionado." });
    }

    console.log(`Guardando nuevo recibo de tipo: ${tipoRecibo}`);
    console.log("Datos recibidos:", receiptData);

    let newReceiptId;

    // ⚠️ ATENCIÓN: Aquí debes implementar la lógica para guardar en la base de datos.
    // El nombre de la función y las tablas pueden variar.
    if (tipoRecibo === "propietario") {
      newReceiptId = await recibo_prop.saveRecibo(receiptData);
    } else if (tipoRecibo === "formulario") {
      // Asumiendo que tu archivo 'recibosFormulario' tiene una función para guardar.
      newReceiptId = await recibo_form.saveRecibo(receiptData);
    } else {
      return res
        .status(400)
        .json({ message: "Tipo de recibo no válido para guardar." });
    }

    res.status(200).json({
      message: "Recibo guardado exitosamente.",
      receiptId: newReceiptId,
    });
  } catch (error) {
    console.error("Error al guardar el recibo:", error);
    res.status(500).json({
      message: "Error al guardar el recibo",
      details: error.message,
    });
  }
}

// --- Definición de Rutas y Aliases ---
// Rutas de descarga de PDF individuales y diarios
// La ruta espera un tipo de recibo y un número de recibo
router.get(
  "/generar_pdf/:tipoRecibo/:numrecibo",
  handleGenerateIndividualPdfLogic
);
router.post("/imprimir-recibo", handleGenerateIndividualPdfLogic);
router.get("/generar_pdfs_dia/:tipoRecibo", handleGenerateDailyPdfsLogic);
router.get(
  "/imprimir-recibos-diarios/:tipoRecibo",
  handleGenerateDailyPdfsLogic
);

// Rutas de guardado
// La ruta espera un cuerpo de solicitud con el tipo de recibo y los datos
router.post("/save-receipt", handleSaveReceiptLogic);
router.post("/guardar-recibo", handleSaveReceiptLogic);

module.exports = router;
