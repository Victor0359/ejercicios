const database = require("./datadb");
const express = require("express");
const router = express.Router();



async function obtenerPropietarios(datos) {
  try {
    if (datos && datos.trim() !== "") {
      const resultado = await database.query(
        "SELECT * FROM propietarios WHERE apellido ILIKE '%' || $1 || '%'",
        [datos]
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





// async function eliminarPropietarios(id) {
  
//   try {

//     const sql = "DELETE FROM propietarios WHERE id_propietarios = $1";
//     const resultado = await database.query(sql, [id]);
    
//     if (resultado.rowCount > 0) {
//       console.log("✅ Propietario eliminado correctamente.");
//       res.status(200).json({ message: "Propietario eliminado correctamente." });
//     } else {
//       console.log("❌ No se encontró el propietario con el ID proporcionado.");
//       res.status(404).json({ message: "No se encontró el propietario con el ID proporcionado." });
//     }
//   } catch (err) {
//     console.error("❌ Error al eliminar propietario:", err);
//     res.status(500).json({ error: "Error al eliminar propietario." });
//   }
// };

async function eliminarPropietarios({ id }) {
    try {
        const sql = "DELETE FROM propietarios WHERE id_propietarios = $1 RETURNING *";
        const resultado = await database.query(sql, [id]);

        console.log("🔍 SQL DELETE resultado:", resultado);

        // Nos aseguramos de retornar un array vacío si no hay coincidencia
        return resultado?.rows || [];
    } catch (err) {
        console.error("❌ Error en eliminarPropietarios:", err);
        throw err;
    }
}





async function modificarPropietarios(datos) {
    try {
   
    const sql = "UPDATE propietarios SET nombre = $1,apellido = $2,dni = $3,cuil = $4,direccion = $5,telefono = $6,celular = $7,correo_elec = $8 WHERE id_propietarios = $9"; 
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
 const resultado= await database.query("SELECT * FROM propietarios WHERE dni = $1", [dni]);
 return resultado[0]; // Devuelve los registros encontrados
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
  obtenerPropietariosPorDni,
  router
};