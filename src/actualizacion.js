import pool from "./datadb.js";

async function obtenerActualizaciones() {
  try {
    const sql =
      "SELECT con.id_contratos, con.id_propiedades, con.fecha_inicio,con.frecuencia, prop.direccion FROM contratos as con INNER JOIN propiedades as prop ON con.id_propiedades = prop.id_propiedades";
    const resultado = await pool.query(sql);

    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
    return [];
  }
}
export default { obtenerActualizaciones };
