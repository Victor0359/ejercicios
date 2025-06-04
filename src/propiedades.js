const database = require("./datadb");

async function obtenerPropiedad(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM propiedades_1 WHERE direccion LIKE ? ORDER BY direccion ASC",
      [datos + '%']);
    return resultado;
  } catch (err) {
    console.error("Error al obtener propiedades:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerPropiedadOrdenados() {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM propiedades_1 ORDER BY direccion ASC");
    return resultado;
  } catch (err) {
    console.error("Error al obtener propiedades:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

async function agregarPropiedades(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "INSERT INTO propiedades_1 (direccion, localidad, propietario, impuesto) VALUES (?, ?, ?, ?)"; 
    const resultado= await conn.query (sql,[datos.direccion,
        datos.localidad,
        datos.propietario,
        datos.impuesto]);
       
    return resultado;
  } catch (err) {
    console.error("Error al insertar propiedad:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}

async function eliminarPropiedad({ id_propiedades }) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "DELETE FROM propiedades_1 WHERE id_propiedades = ?";
    const resultado = await conn.query(sql, [id_propiedades]);
    return resultado;
  } catch (err) {
    console.error("Error al eliminar la propiedad:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function modificarPropiedades(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = 'UPDATE propiedades_1 SET direccion = ?,localidad = ?,propietario = ?,impuesto = ? WHERE id_propiedades = ?'; 
    const resultado= await conn.query (sql,[datos.direccion,
        datos.localidad,
        datos.propietario,
        datos.impuesto,
        datos.id_propiedades]);
       
    return resultado;
  } catch (err) {
    console.error("Error al modificar la propiedad:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerPropiedadesPorId(id_propiedades) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM propiedades_1 WHERE id_propiedades = ? ORDER BY direccion ASC", [id_propiedades]);
    return resultado[0];
  } catch (err) {
    console.error("Error al obtener la propiedad por ID:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerPropietarioSql() {
  let conn;
  try {
    conn = await database.conectar();
    if (!conn) throw new Error("No se pudo obtener la conexión a la base de datos");
    const resultado = await conn.query("SELECT id_propietarios, apellido, nombre FROM propietarios ORDER BY apellido ASC");
    // Siempre devuelve un array, aunque solo haya un propietario
    //return Array.isArray(rows) ? rows : [rows];
    return resultado;
  } catch (err) {
    console.error("Error al obtener propietario sql:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
module.exports = {
 obtenerPropiedad,
 agregarPropiedades,
 eliminarPropiedad,
 modificarPropiedades,
 obtenerPropiedadesPorId,
 obtenerPropietarioSql,
  obtenerPropiedadOrdenados
};