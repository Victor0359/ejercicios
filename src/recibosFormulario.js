// db/recibosFormulario.js
const pool = require("./datadb.js");

/**
 * Obtiene los números de recibo para una fecha específica desde la tabla de recibos de formulario.
 * @param {string} date - La fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<Array<number>>} - Un array de números de recibo.
 */
async function getRecibosPorFecha(date) {
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

/**
 * Obtiene un recibo de formulario por su número.
 * @param {number} numrecibo - El número de recibo.
 * @returns {Promise<Array<Object>>} - El resultado de la consulta.
 */
async function recibosFormulario(numrecibo) {
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

module.exports = {
  getRecibosPorFecha,
  recibosFormulario,
};
