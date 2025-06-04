const database= require('./datadb.js');

async function obtenerImpuestos() {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query("SELECT * FROM impuestos ORDER BY fecha DESC");
    return resultado;
  } catch (err) {
    console.error("Error al obtener impuestos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

async function insertarImpuestos(datos) {
  let conn;
  try {
    conn = await database.conectar();
    const sql = "INSERT INTO impuestos (id_propiedades,abl,aysa,exp_comunes,exp_extraordinarias,seguro,fecha) VALUES (?, ?, ?, ?, ?, ?,?)"; 
    const resultado= await conn.query (sql,[datos.id_propiedades ||0, 
        datos.abl || 0, 
        datos.aysa || 0,  
        datos.exp_comunes || 0,
        datos.exp_extraordinarias || 0,
        datos.seguro || 0,
        datos.fecha]);
       
    return resultado;
  } catch (err) {
    console.error("Error al insertar propiedad:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}

async function obtenerPropiedadSql() {
  let conn;
  try {
    conn = await database.conectar();
    if (!conn) throw new Error("No se pudo obtener la conexión a la base de datos");
    const resultado = await conn.query("SELECT id_propiedades, direccion, localidad FROM propiedades_1 ORDER BY direccion ASC");
    // Siempre devuelve un array, aunque solo haya un propietario
    //return Array.isArray(rows) ? rows : [rows];
    return resultado;
  } catch (err) {
    console.error("Error al obtener propiedad sql:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
module.exports = {
  obtenerImpuestos,
  insertarImpuestos,
  obtenerPropiedadSql
  
};
