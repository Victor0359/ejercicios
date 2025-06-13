const database = require("./datadb");

async function obtenerPropietarios(datos) {
  try {
    if (datos && datos.trim() !== "") {
      const resultado = await database.query(
        "SELECT * FROM propietarios WHERE apellido LIKE $1 ORDER BY apellido ASC", [`%${datos}%`]
      );
      return resultado.rows; // Devuelve los registros correctamente
    }
    return [];
  } catch (err) {
    console.error("Error al buscar propietarios:", err);
    return [];
  }
}


async function agregarPropietarios(datos) {
  try {
    const sql = "INSERT INTO propietarios (nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    const resultado = await database.query(sql, [
      datos.nombre,
      datos.apellido,
      datos.dni,
      datos.cuil,
      datos.direccion,
      datos.telefono,
      datos.celular,
      datos.correo_elec
    ]);
    
    console.log("✅ Propietario agregado correctamente.");
    return resultado.rows;
  } catch (err) {
    console.error("❌ Error al insertar propietario:", err);
    return null;
  }
}


async function eliminarPropietarios({ id_propietarios }) {
  try {
    
    const sql = "DELETE FROM propietarios WHERE id_propietarios = $1";
    const resultado = await database.query(sql, [id_propietarios]);
    return resultado.rows;
  } catch (err) {
    console.error("Error al eliminar propietario:", err);
    return null;
  } 
}
async function modificarPropietarios(datos) {
    try {
   
    const sql = 'UPDATE propietarios SET nombre = $1,apellido = $2,dni = $3,cuil = $4,direccion = $5,telefono = $6,celular = $7,correo_elec = $8 WHERE id_propietarios = $9'; 
    const resultado= await database.query (sql,[datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuil,
        datos.direccion,
        datos.telefono,
        datos.celular,
        datos.correo_elec,
        datos.id_propietarios]);
    return resultado.rows;
  } catch (err) {
    console.error("Error al modificar propietario:", err);
    return null;
  } 
}
async function obtenerPropietariosPorId(id_propietarios) {
  
  try {
   
    const resultado = await database.query("SELECT * FROM propietarios WHERE id_propietarios = $1", [id_propietarios]);
    return resultado[0];
  } catch (err) {
    console.error("Error al obtener el propietario por ID:", err);
    return null;
  }
}
async function obtenerPropietariosPorDni(dni) {
 
  try {
   
    return await database.query("SELECT * FROM propietarios WHERE dni = $1", [dni]);
  } catch (err) {
    console.error("Error al buscar propietario por DNI:", err);
    return [];
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