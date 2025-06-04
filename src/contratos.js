const database = require("./datadb.js");

async function obtenerContratos() {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "SELECT * FROM contratos ORDER BY fecha_inicio DESC"
    );
    return resultado;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

async function agregarContratos(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "INSERT INTO contratos (id_propietarios, id_inquilinos,id_propiedades,fecha_inicio,duracion_cont, precio_inicial,precio_actual,honorarios,fecha_final) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
    const resultado= await conn.query (sql,[datos.id_propietarios,
        datos.id_inquilinos,
        datos.id_propiedades,
        datos.fecha_inicio,
        datos.duracion_cont,
        datos.precio_inicial,
        datos.precio_actual,
        datos.honorarios,
        datos.fecha_final]);
               
    return resultado;
  } catch (err) {
    console.error("Error al insertar contrato:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}

async function modificarContrato(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = `
      UPDATE contratos SET
        id_propietarios = ?,
        id_inquilinos = ?,
        id_propiedades = ?,
        fecha_inicio = ?,
        duracion_cont = ?,
        precio_inicial = ?,
        precio_actual = ?,
        honorarios = ?
      WHERE id_contratos = ?
    `;
    const resultado = await conn.query(sql, [
      datos.id_propietarios,
      datos.id_inquilinos,
      datos.id_propiedades,
      datos.fecha_inicio,
      datos.duracion_cont,
      datos.precio_inicial,
      datos.precio_actual,
      datos.honorarios,
      datos.id_contratos
    ]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar contrato:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerContratoPorId(id) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM contratos WHERE id_contratos = ?", [id]);
    return resultado;

  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}



module.exports = {obtenerContratos,
    agregarContratos,
    modificarContrato,
    obtenerContratoPorId
};