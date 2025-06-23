const database = require("./datadb");
const express = require("express");
const router = express.Router();


async function obtenerInquilinos(datos) {
  try {
    if (datos && datos.trim() !== "") {
      const resultado = await database.query(
        "SELECT * FROM inquilinos WHERE apellido ILIKE '%' || $1 || '%'",
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

async function agregarInquilinos(datos) {
  try {
    const sql = `INSERT INTO inquilinos (nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
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
    
    console.log("✅ inquilino agregado correctamente.");
    return resultado;
  } catch (err) {
    console.error("❌ Error al insertar inquilino:", err);
    return null;
  }
}

async function eliminarInquilinos({ id }) {
    try {
        const sql = "DELETE FROM inquilinos WHERE id_inquilinos = $1 RETURNING *";
        const resultado = await database.query(sql, [id]);

        console.log("🔍 SQL DELETE resultado:", resultado);

        // Nos aseguramos de retornar un array vacío si no hay coincidencia
        return resultado?.rows || [];
    } catch (err) {
        console.error("❌ Error en eliminarInquilinos:", err);
        throw err;
    }
}

async function modificarInquilinos(datos) {
  try {
    // Asegurar que el ID sea tipo número
  const id = parseInt(datos.id_inquilinos);
    const dni = parseInt(datos.dni); // 👈 lo que faltaba

    if (isNaN(id) || isNaN(dni)) {
      throw new Error("ID o DNI inválido: deben ser enteros.");
    }

    const sql = `
      UPDATE inquilinos
      SET nombre = $1,
          apellido = $2,
          dni = $3,
          cuil = $4,
          direccion = $5,
          telefono = $6,
          celular = $7,
          correo_elec = $8
      WHERE id_inquilinos = $9
    `;
     
  const valores = [
      datos.nombre,
      datos.apellido,
      dni,
      datos.cuil,
      datos.direccion,
      datos.telefono,
      datos.celular,
      datos.correo_elec,
      id,
         ];
   
    
  const resultado = await database.query(sql, valores);

    console.log(`✅ Inquilino ID ${id} — Filas afectadas:`, resultado.rowCount);

    return {
      rowCount: resultado.rowCount,
      rows: resultado.rows
    };
  } catch (err) {
    console.error("❌ Error al modificar inquilino:", err);
    throw err; // Lo dejamos rebotar para que el route lo capture y maneje
  }
}

async function obtenerInquilinosPorId(id_inquilinos) {
    try {
    const resultado = await database.query("SELECT * FROM inquilinos WHERE id_inquilinos = $1", [id_inquilinos]);
    return resultado.rows[0];
  } catch (err) {
    console.error("Error al obtener el inquilino por ID:", err);
    return null;
  }
}

async function obtenerInquilinosPorDni(dni) {
   try {
 const resultado= await database.query("SELECT * FROM inquilinos WHERE dni = $1", [dni]);
 return resultado[0]; // Devuelve los registros encontrados
} catch (err) {
    console.error("Error al buscar inquilinos por DNI:", err);
    return [];
  } 
}

async function obtenerTodosLosInquilinos() {
  try {
    const resultado = await database.query("SELECT * FROM inquilinos ORDER BY apellido");
    return resultado.rows; // Devuelve todos los registros encontrados
    

  } catch (err) {
    console.error("❌ Error al obtener todos los propietarios:", err);
    return [];
  }
}


module.exports = {
obtenerInquilinos,
agregarInquilinos,
eliminarInquilinos,
modificarInquilinos,
obtenerInquilinosPorId,
obtenerInquilinosPorDni,
obtenerTodosLosInquilinos

};