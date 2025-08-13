import database from "./datadb.js";
import express from "express";

export async function obtenerImpuestosPorDireccion(idPropiedad) {
  try {
    const resultado = await database.query(
      `SELECT i.*, p.direccion 
       FROM impuestos i 
       JOIN propiedades p ON i.id_propiedades = p.id_propiedades 
       WHERE i.id_propiedades = $1 
       ORDER BY i.fecha DESC LIMIT 1`,
      [idPropiedad]
    );
    return resultado;
  } catch (err) {
    console.error("Error al obtener impuestos por dirección:", err);
    return { rows: [] };
  }
}

export async function obtenerImpuestos() {
  try {
    const resultado = await database.query(
      "SELECT * FROM impuestos ORDER BY fecha DESC "
    );
    return resultado;
  } catch (err) {
    console.error("Error al obtener impuestos:", err);
    return [];
  }
}

async function insertarImpuestos(datos) {
  try {
    const sql =
      "INSERT INTO impuestos (abl,aysa,exp_com,exp_ext,seguro,varios,id_propiedades) VALUES ($1, $2, $3, $4, $5, $6,$7)";
    const resultado = await database.query(sql, [
      datos.abl || 0,
      datos.aysa || 0,
      datos.exp_com || 0,
      datos.exp_ext || 0,
      datos.seguro || 0,
      datos.varios || 0,
      datos.id_propiedades || 0,
    ]);

    return resultado;
  } catch (err) {
    console.error("Error al insertar impuestos:", err);
    return null;
  }
}

export default {
  obtenerImpuestos,
  insertarImpuestos,
  obtenerImpuestosPorDireccion,
};
