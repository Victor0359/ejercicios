const database = require("./datadb");
const express = require("express");



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
    return resultado;
  } catch (err) {
    console.error("❌ Error al insertar propietario:", err);
    return null;
  }
}

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
    // Asegurar que el ID sea tipo número
    const id = Number(datos.id_propietarios);

    const sql = `
      UPDATE propietarios
      SET nombre = $1,
          apellido = $2,
          dni = $3,
          cuil = $4,
          direccion = $5,
          telefono = $6,
          celular = $7,
          correo_elec = $8
      WHERE id_propietarios = $9
    `;

    const valores = [
      datos.nombre,
      datos.apellido,
      datos.dni,
      datos.cuil,
      datos.direccion,
      datos.telefono,
      datos.celular,
      datos.correo_elec,
      id
    ];

    const resultado = await database.query(sql, valores);

    console.log(`✅ Propietario ID ${id} — Filas afectadas:`, resultado.rowCount);

    return {
      rowCount: resultado.rowCount,
      rows: resultado.rows
    };
  } catch (err) {
    console.error("❌ Error al modificar propietario:", err);
    throw err; // Lo dejamos rebotar para que el route lo capture y maneje
  }
}


async function obtenerPropietariosPorId(id_propietarios) {
    try {
    const resultado = await database.query("SELECT * FROM propietarios WHERE id_propietarios = $1", [id_propietarios]);
    return resultado.rows[0];
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
async function obtenerTodosLosPropietarios() {
  try {
    const resultado = await database.query("SELECT * FROM propietarios ORDER BY apellido");
    return resultado.rows; // Devuelve todos los registros encontrados
    

  } catch (err) {
    console.error("❌ Error al obtener todos los propietarios:", err);
    return [];
  }
}


module.exports = {
   obtenerPropietarios,
  agregarPropietarios,
  eliminarPropietarios,
  modificarPropietarios,
  obtenerPorId: obtenerPropietariosPorId,
  obtenerTodosLosPropietarios,
  obtenerPropietariosPorDni, 
 
};