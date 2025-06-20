const database = require("./datadb");
const express = require("express");
const router = express.Router();
async function obtenerPropiedad(datos) {
  
  try {
   if (datos && datos.trim() !== "") {
      const resultado = await database.query(
        "SELECT * FROM propiedades WHERE direccion ILIKE '%' || $1 || '%'",
        [datos]
      );
      return resultado.rows; // Devuelve los registros correctamente
    }
    return [];
  } catch (err) {
    console.error("Error al buscar propiedad:", err);
    return [];
  }
}

  async function obtenerPropiedadOrdenados() {
  
  try {
    if (datos && datos.trim() !== "") {
      const resultado = await database.query("SELECT * FROM propiedades ORDER BY direccion ASC");
     return resultado.rows; // Devuelve los registros correctamente
    }
    return [];
  } catch (err) {
    console.error("Error al obtener propiedad:", err);
    return [];
  }
}

async function agregarPropiedades(datos) {
  try {
    const direccion = typeof datos.direccion === 'string' ? datos.direccion.trim() : '';
    const localidad = typeof datos.localidad === 'string' ? datos.localidad.trim() : '';
    const id_propietario = parseInt(datos.id_propietario) || null;
    const id_impuestos = parseInt(datos.id_impuestos) || 0;

    const resultado = await database.query(
      "INSERT INTO propiedades (direccion, localidad, id_propietario, id_impuestos) VALUES ($1, $2, $3, $4)",
      [direccion, localidad, id_propietario, id_impuestos]
    );

    return resultado;
  } catch (err) {
    console.error("Error al insertar propiedad:", err);
    throw err;
  }
}


async function eliminarPropiedad({ id }) {
 
     try {
    const sql = "DELETE FROM propiedades WHERE id_propiedades = $1 RETURNING *";
        const resultado = await database.query(sql, [id]);

        console.log("🔍 SQL DELETE resultado:", resultado);

        // Nos aseguramos de retornar un array vacío si no hay coincidencia
        return resultado;
    } catch (err) {
        console.error("❌ Error en eliminarInquilinos:", err);
        throw err;
};
}


async function modificarPropiedades(datos) {
  
  try {
   
    const sql = 'UPDATE propiedades SET direccion = $1,localidad = $2,id_propietario = $3,id_impuestos = $4 WHERE id_propiedades = $5'; 
    const resultado= await database.query (sql,[datos.direccion,
        datos.localidad,
        parseInt(datos.id_propietario),
        parseInt(datos.id_impuestos),
        parseInt(datos.id_propiedades)]);
       
    console.log(`✅ Propiedad ID ${datos.id_propiedades} — Filas afectadas:`, resultado.rowCount);

    return {
      rowCount: resultado.rowCount,
      rows: resultado.rows
    };
  } catch (err) {
    console.error("❌ Error al modificar propiedad:", err);
    throw err; // Lo dejamos rebotar para que el route lo capture y maneje
  }
}

async function obtenerPropiedadesPorId(id_propiedades) {
 
  try {
const sql = "SELECT * FROM propiedades WHERE id_propiedades = $1";
    const resultado = await database.query (sql,[id_propiedades]);
    return resultado.rows[0];
  } catch (err) {
    console.error("Error al obtener la propiedad por ID:", err);
    return null;
  } 
}
async function obtenerPropietarioSql() {
  try {
    const resultado = await database.query(
      "SELECT id_propietarios, TRIM(apellido) AS apellido, TRIM(nombre) AS nombre FROM propietarios ORDER BY apellido ASC"
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener propietario sql:", err);
    return [];
  }
}
async function obtenerImpuestosSql() {
  const sql = "SELECT * FROM impuestos";
  const resultado = await database.query(sql);
  return resultado.rows;
}

module.exports = {
obtenerImpuestosSql,
 obtenerPropiedad,
 agregarPropiedades,
 eliminarPropiedad,
 modificarPropiedades,
 obtenerPropiedadesPorId,
 obtenerPropietarioSql,
 obtenerPropiedadOrdenados
}