const database = require("./datadb");

async function obtenerInquilinosPorDni(dni) {
  let conn;
  try {
    conn = await database.connect();
    return await conn.query("SELECT * FROM inquilinos WHERE dni = ?", [dni]);
  } catch (err) {
    console.error("Error al buscar inquilinos por DNI:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerInquilinos(filtro) {
  let conn;
  try {
    conn = await database.connect();
    if (filtro) {
      return await conn.query("SELECT * FROM inquilinos WHERE apellido LIKE ?", [`%${filtro}%`]);
    } else {
      return await conn.query("SELECT * FROM inquilinos");
    }
  } catch (err) {
    return [];
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerInquilinosOrdenados() {
  let conn;
  try {
    conn = await database.connect();
    const resultado = await conn.query("SELECT * FROM inquilinos order by apellido asc");
    
    return resultado;
  } catch (err) {
    console.error("Error al obtener inquilinos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }

}
async function agregarInquilino(datos) {
  let conn;
  try {
    conn = await database.connect();
    const sql = "INSERT INTO inquilinos (nombre, apellido, dni, cuit, direccion, telefono, celular, correo_elec) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"; 
    const resultado= await conn.query (sql,[datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuit,
        datos.direccion,
        datos.telefono,
        datos.celular,
        datos.correo_elec]);
    return resultado;
  } catch (err) {
    console.error("Error al insertar inquilino:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}

async function eliminarInquilino({ id_inquilinos }) {
  let conn;
  try {
    conn = await database.connect();
    const sql = "DELETE FROM inquilinos WHERE id_inquilinos = ?";
    const resultado = await conn.query(sql, [id_inquilinos]);
    return resultado;
  } catch (err) {
    console.error("Error al eliminar inquilino:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function modificarInquilino(datos) {
  let conn;
  try {
    conn = await database.connect();
    const sql = 'UPDATE inquilinos SET nombre = ?,apellido = ?,dni = ?,cuit = ?,direccion = ?,telefono = ?,celular = ?,correo_elec = ? WHERE id_inquilinos = ?'; 
    const resultado= await conn.query (sql,[datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuit,
        datos.direccion,
        datos.telefono,
        datos.celular,
        datos.correo_elec,
        datos.id_inquilinos]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar inquilino:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerInquilinoPorId(id) {
  let conn;
  try {
    conn = await database.connect();
    const resultado = await conn.query("SELECT * FROM inquilinos WHERE id_inquilinos = ?", [id]);
    return resultado[0];
  } catch (err) {
    console.error("Error al obtener inquilino por ID:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
module.exports = {
  obtenerInquilinos,
  obtenerInquilinosPorDni,
  agregarInquilino,
  eliminarInquilino,
  modificarInquilino,
  obtenerInquilinoPorId,
  obtenerInquilinosOrdenados
};