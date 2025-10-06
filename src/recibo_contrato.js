// src/recibo_contrato.js

import pool from "./datadb.js";

async function obtenerContratos_Id(id_propiedades) {
  try {
    const resultado = await pool.query(
      "select* from vista_contratos as vis inner join propiedades as prop on vis.direccion=prop.direccion where prop.id_propiedades= $1",
      [id_propiedades]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  }
}

async function obtenerImpuestos(id_propiedades) {
  try {
    const resultado = await pool.query(
      "SELECT prop.direccion AS direccion, imp.abl AS abl,imp.aysa AS aysa, imp.exp_com AS exp_comunes,imp.exp_ext as exp_extraor, imp.seguro AS seguro,imp.varios AS varios, imp.fecha FROM impuestos AS imp INNER JOIN propiedades AS prop USING (id_propiedades) WHERE imp.fecha= (SELECT MAX(fecha) FROM impuestos WHERE id_propiedades=$1)",
      [id_propiedades]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  }
}
async function insertarRecibosInquilinos(
  fecha,
  id_propiedad,
  apellidopropietario,
  apellidoinquilino,
  numrecibo,
  cuota,
  importemensual,
  abl,
  aysa,
  expcomunes,
  seguro,
  varios,
  total
) {
  try {
    const resultado = await pool.query(
      "INSERT INTO recibo_inquilinos (fecha,id_propiedad,apellidopropietario,apellidoinquilino,numrecibo,cuota, importemensual,abl,aysa,expcomunes,seguro,varios,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      [
        fecha,
        id_propiedad,
        apellidopropietario,
        apellidoinquilino,
        numrecibo,
        cuota,
        importemensual,
        abl,
        aysa,
        expcomunes,
        seguro,
        varios,
        total,
      ]
    );
    console.log("Recibo insertado correctamente:", resultado);
    return resultado;
  } catch (err) {
    console.error("Error al cargar recibos_inquilinos:", err);
    return [];
  }
}

async function obtenernumeroRecibo() {
  try {
    const resultado = await pool.query(
      "SELECT Max(numrecibo) as numrecibo FROM recibo_inquilinos"
    );

    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener num_recibo:", err);
    return [];
  }
}
async function existeReciboPorPropiedad(id_propiedad) {
  try {
    const resultado = await pool.query(
      "SELECT * FROM recibo_inquilinos WHERE id_propiedad = $1",
      [id_propiedad]
    );
    return resultado.rows > 0 ? resultado[0] : null;
  } catch (err) {
    console.error("Error al buscar recibo:", err);
    return null;
  }
}
async function obtenerRecibosPorPropiedad(id_propiedad) {
  try {
    const resultado = await pool.query(
      "SELECT * FROM recibo_inquilinos WHERE id_propiedad = $1 order by numrecibo DESC limit 5",
      [id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
  }
}
async function obtenerRecibosPorNumrecibo(numrecibo) {
  try {
    const resultado = await pool.query(
      "select * from recibo_inquilinos where numrecibo=$1",
      [numrecibo]
    );

    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
  }
}

// 🆕 NUEVA FUNCIÓN: Obtiene todos los recibos para una fecha específica.
async function getRecibosPorFecha(date) {
  try {
    const resultado = await pool.query(
      "SELECT numrecibo FROM recibo_inquilinos WHERE DATE(fecha) = $1",
      [date]
    );
    return resultado.rows.map((row) => row.numrecibo);
  } catch (err) {
    console.error("Error al obtener recibos por fecha:", err);
    return [];
  }
}

// 🆕 NUEVA FUNCIÓN: Guarda un nuevo recibo.
// Se asume que los datos están en un objeto `receiptData`.
async function saveRecibo(receiptData) {
  const {
    fecha,
    id_propiedad,
    apellidopropietario,
    apellidoinquilino,
    numrecibo,
    cuota,
    importemensual,
    abl,
    aysa,
    expcomunes,
    seguro,
    varios,
    total,
  } = receiptData;
  try {
    const resultado = await pool.query(
      "INSERT INTO recibo_inquilinos (fecha,id_propiedad,apellidopropietario,apellidoinquilino,numrecibo,cuota, importemensual,abl,aysa,expcomunes,seguro,varios,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      [
        fecha,
        id_propiedad,
        apellidopropietario,
        apellidoinquilino,
        numrecibo,
        cuota,
        importemensual,
        abl,
        aysa,
        expcomunes,
        seguro,
        varios,
        total,
      ]
    );
    console.log("Recibo insertado correctamente:", resultado);
    return numrecibo;
  } catch (err) {
    console.error("Error al cargar recibos_inquilinos:", err);
    throw err;
  }
}
async function obtenerRecibosPorPropiedadLimit1(id_propiedad) {
  try {
    const resultado = await pool.query(
      "SELECT * FROM recibo_inquilinos WHERE id_propiedad = $1 order by numrecibo DESC limit 5",
      [id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
  }
}

// 🆕 CORRECCIÓN: El archivo exporta un objeto por defecto.
export default {
  obtenerContratos_Id,
  obtenerImpuestos,
  insertarRecibosInquilinos,
  obtenernumeroRecibo,
  existeReciboPorPropiedad,
  obtenerRecibosPorPropiedad,
  obtenerRecibosPorPropiedadLimit1,
  obtenerRecibosPorNumrecibo,
  getRecibosPorFecha, // ✅ Añadida la nueva función a la exportación
  saveRecibo, // ✅ Añadida la función saveRecibo para que esté disponible
};
