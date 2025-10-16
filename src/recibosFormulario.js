// db/recibosFormulario.js
import pool from "./datadb.js";

/**
 * Obtiene los números de recibo para una fecha específica desde la tabla de recibos de formulario.
 * @param {string} date - La fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array<number>>} - Un array de números de recibo.
 */
export async function getRecibosPorFecha(date) {
  const query = `
    SELECT numrecibo
    FROM recibo_inquilinos
    WHERE fecha::date = $1;
  `;
  try {
    const result = await pool.query(query, [date]);
    const rows = result.rows;
    return rows.map((row) => row.numrecibo);
  } catch (error) {
    console.error(
      "Error al obtener los recibos de formulario por fecha:",
      error
    );
    throw error;
  }
}
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * Genera el PDF para un recibo de inquilino (formulario).
 * @param {object} data - Datos completos del recibo.
 * @returns {Promise<Buffer>} - PDF en formato Buffer.
 */

/**
 * Obtiene un recibo de formulario por su número.
 * @param {number} numrecibo - El número de recibo.
 * @returns {Promise<Array<Object>>} - El resultado de la consulta.
 */
export async function recibosFormulario(numrecibo) {
  const query = `
    SELECT *
    FROM recibo_inquilinos
    WHERE numrecibo = $1;
  `;
  try {
    // 🔧 Nota: Se usa la desestructuración de objetos para obtener la propiedad 'rows'.
    const result = await pool.query(query, [numrecibo]);
    const rows = result.rows;
    return rows;
  } catch (error) {
    console.error(
      "Error al obtener el recibo de formulario por número:",
      error
    );
    throw error;
  }
}
export async function deleteRecibosInquilinos(numrecibo) {
  const query = "DELETE FROM recibo_inquilinos WHERE numrecibo = $1";
  try {
    const result = await pool.query(query, [numrecibo]);
    return result.rowCount; // ✅ Esto es lo que necesitás
  } catch (error) {
    console.error("Error al eliminar el recibo inquilino:", error);
    throw error;
  }
}

export default {
  getRecibosPorFecha,
  recibosFormulario,
  deleteRecibosInquilinos,
};
