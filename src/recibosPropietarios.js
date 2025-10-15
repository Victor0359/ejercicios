// db/recibosPropietarios.js
import pool from "./datadb.js";

/**
 * Obtiene los números de recibo para una fecha específica.
 * @param {string} date - La fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array<number>>} - Un array de números de recibo.
 */
async function getRecibosPorFecha(date) {
  const query = `
    SELECT numrecibo
    FROM recibo_propietario
    WHERE fecha::date = $1;
  `;
  try {
    const result = await pool.query(query, [date]);
    const rows = result.rows;
    return rows.map((row) => row.numrecibo);
  } catch (error) {
    console.error("Error al obtener los recibos por fecha:", error);
    throw error;
  }
}

/**
 * Función para obtener un recibo de propietario por su número.
 * @param {number} numrecibo - El número de recibo.
 * @returns {Promise<Array<Object>>} - El resultado de la consulta.
 */
async function recibosPropietarios(numrecibo) {
  const query = `
    SELECT *
    FROM recibo_propietario
    WHERE numrecibo = $1;
  `;
  try {
    // 🔧 CORREGIDO: Se usa desestructuración de objetos para obtener la propiedad 'rows'
    // en lugar de intentar desestructurar el resultado como un array.
    const result = await pool.query(query, [numrecibo]);
    const rows = result.rows;
    return rows;
  } catch (error) {
    console.error("Error al obtener el recibo por número:", error);
    throw error;
  }
}

async function deleteRecibosPropietarios(numrecibo) {
  const query = "DELETE FROM recibo_propietario WHERE numrecibo = $1";
  try {
    const result = await pool.query(query, [numrecibo]);
    return result.rowCount; // ✅ Esto es lo que necesitás
  } catch (error) {
    console.error("Error al eliminar el recibo propietario:", error);
    throw error;
  }
}

export default {
  getRecibosPorFecha,
  recibosPropietarios,
  deleteRecibosPropietarios,
};
