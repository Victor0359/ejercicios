// src/routes/reciboRouter.js

// src/routes/reciboRouter.js

import { Router } from "express";
import path from "path";
import fs from "fs/promises";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import pdfMerger from "pdf-merger-js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORRECCIÓN: Importa el objeto completo con un nombre (recibo_prop)
// Ya no se necesita un alias para saveRecibo aquí.
import recibo_prop from "../recibosPropietarios.js";
import propiedades from "../propiedades.js";
import funcion_letras from "../funcion_letras.js";
// ✅ CORRECCIÓN: Importa el objeto completo con un nombre (recibo_contrato)
import * as recibo_contrato from "../recibo_contrato.js";
import {
  generateTenantReceiptPDF,
  generateOwnerReceiptPDF,
} from "../receiptPDFGenerator.js"; // Ajustá la ruta si está en otra carpeta
import { insertarReciboPropietario_Id } from "../recRecPropietario.js";

const reciboRouter = Router();
async function saveRecibo(data) {
  return await insertarReciboPropietario_Id(data);
}
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
      // ✅ CORRECCIÓN: Llama a la función a través del objeto recibo_contrato
      resultado = await recibo_contrato.obtenerRecibosPorNumrecibo(numrecibo);
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
        // ✅ CORRECCIÓN: Llama a la función a través del objeto recibo_contrato
        receiptNumbers = await recibo_contrato.getRecibosPorFecha(date);
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

    if (!tipoRecibo) {
      return res
        .status(400)
        .json({ message: "Tipo de recibo no proporcionado." });
    }

    console.log(`Guardando nuevo recibo de tipo: ${tipoRecibo}`);
    console.log("Datos recibidos:", receiptData);

    const pdfBytes =
      tipoRecibo === "propietario"
        ? await generateOwnerReceiptPDF(receiptData)
        : await generateTenantReceiptPDF(receiptData);

    const { dailyDir } = getReceiptPaths(tipoRecibo);
    await fs.mkdir(dailyDir, { recursive: true });

    const today = new Date().toISOString().split("T")[0];
    const dailyPdfPath = path.join(dailyDir, `${today}.pdf`);

    const merger = new pdfMerger();
    try {
      await fs.access(dailyPdfPath);
      await merger.add(dailyPdfPath);
    } catch {
      console.log(
        `📄 No existe PDF diario previo para ${tipoRecibo}, se creará uno nuevo.`
      );
    }
    await merger.add(pdfBytes);
    await merger.save(dailyPdfPath);

    res.status(200).json({
      message: "Recibo generado y agregado al PDF diario.",
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
reciboRouter.get(
  "/generar_pdf/:tipoRecibo/:numrecibo",
  handleGenerateIndividualPdfLogic
);
reciboRouter.post("/imprimir-recibo", handleGenerateIndividualPdfLogic);
reciboRouter.get("/generar_pdfs_dia/:tipoRecibo", handleGenerateDailyPdfsLogic);
reciboRouter.get(
  "/imprimir-recibos-diarios/:tipoRecibo",
  handleGenerateDailyPdfsLogic
);
reciboRouter.post("/save-receipt", handleSaveReceiptLogic);
reciboRouter.post("/guardar-recibo", handleSaveReceiptLogic);
async function limpiarPDFsAntiguos() {
  const tipos = ["propietarios", "formulario"];
  const hoy = new Date().toISOString().split("T")[0];

  for (const tipo of tipos) {
    const dir = path.join(__dirname, "..", "daily", tipo);
    try {
      const archivos = await fs.readdir(dir);
      for (const archivo of archivos) {
        if (archivo.endsWith(".pdf") && !archivo.includes(hoy)) {
          await fs.unlink(path.join(dir, archivo));
          console.log(`🧹 Eliminado PDF antiguo: ${archivo}`);
        }
      }
    } catch (err) {
      console.warn(`No se pudo limpiar la carpeta ${tipo}:`, err.message);
    }
  }
}

export default reciboRouter;
