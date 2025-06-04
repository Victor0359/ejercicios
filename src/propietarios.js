const database = require("./datadb");

async function obtenerPropietarios(datos) {
  let conn;
  try {
    conn = await database.conectar();
    if (datos && datos.trim() !== "") {
      // Filtra por apellido
      return await conn.query(
        "SELECT * FROM propietarios WHERE apellido LIKE ? ORDER BY apellido ASC",[`%${datos}%`]);
    } return resultado;
    }
   catch (err) {
    console.error("Error al buscar propietarios:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

async function agregarPropietarios(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "INSERT INTO propietarios (nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"; 
    const resultado= await conn.query (sql,[datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuil,
        datos.direccion,
        datos.telefono,
        datos.celular,
        datos.correo_elec]);
    return resultado;
  } catch (err) {
    console.error("Error al insertar propietario:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}

async function eliminarPropietarios({ id_propietarios }) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "DELETE FROM propietarios WHERE id_propietarios = ?";
    const resultado = await conn.query(sql, [id_propietarios]);
    return resultado;
  } catch (err) {
    console.error("Error al eliminar propietario:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function modificarPropietarios(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = 'UPDATE propietarios SET nombre = ?,apellido = ?,dni = ?,cuil = ?,direccion = ?,telefono = ?,celular = ?,correo_elec = ? WHERE id_propietarios = ?'; 
    const resultado= await conn.query (sql,[datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuil,
        datos.direccion,
        datos.telefono,
        datos.celular,
        datos.correo_elec,
        datos.id_propietarios]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar propietario:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerPropietariosPorId(id_propietarios) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM propietarios WHERE id_propietarios = ?", [id_propietarios]);
    return resultado[0];
  } catch (err) {
    console.error("Error al obtener el propietario por ID:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerPropietariosPorDni(dni) {
  let conn;
  try {
    conn = await database.conectar();
    return await conn.query("SELECT * FROM propietarios WHERE dni = ?", [dni]);
  } catch (err) {
    console.error("Error al buscar propietario por DNI:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

module.exports = {
   obtenerPropietarios,
  agregarPropietarios,
  eliminarPropietarios,
  modificarPropietarios,
  obtenerPropietariosPorId,
  obtenerPropietariosPorDni
};