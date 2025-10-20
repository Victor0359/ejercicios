import pool from "./datadb.js";

async function obtenerContratosConfiltro() {
  try {
    let query;
    let params = [];

    if (filtro === "") {
      query = `
        SELECT 
          con.id_contratos,
          prop.apellido AS apellido_propietario,
          inq.apellido AS apellido_inquilino,
          propi.direccion,
          con.fecha_inicio,
          con.precioinicial,
          con.precioactual,
          con.honorarios,
          con.duracion_contrato,
          con.fecha_finalcontrato,
          con.cuota,
          con.frecuencia
        FROM contratos AS con
        INNER JOIN propietarios AS prop ON con.id_propietarios = prop.id_propietarios
        INNER JOIN inquilinos AS inq ON con.id_inquilinos = inq.id_inquilinos
        INNER JOIN propiedades AS propi ON con.id_propiedades = propi.id_propiedades
        ORDER BY propi.direccion ASC
      `;
    } else {
      query = `
        SELECT 
          con.id_contratos,
          prop.apellido AS apellido_propietario,
          inq.apellido AS apellido_inquilino,
          propi.direccion,
          con.fecha_inicio,
          con.precioinicial,
          con.precioactual,
          con.honorarios,
          con.duracion_contrato,
          con.fecha_finalcontrato,
          con.cuota,
          con.frecuencia
        FROM contratos AS con
        INNER JOIN propietarios AS prop ON con.id_propietarios = prop.id_propietarios
        INNER JOIN inquilinos AS inq ON con.id_inquilinos = inq.id_inquilinos
        INNER JOIN propiedades AS propi ON con.id_propiedades = propi.id_propiedades
        WHERE propi.direccion ILIKE '%' || $1 || '%'
        ORDER BY propi.direccion ASC
      `;
      params = [filtro];
    }

    const resultado = await pool.query(query, params);
    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar contratos:", err);
    return [];
  }
}
async function obtenerContratos(id_propiedades) {
  try {
    const query =
      "SELECT con.id_contratos, prop.apellido AS apellido_propietario,inq.apellido AS apellido_inquilino,propi.direccion as direccion, con.fecha_inicio, con.precioinicial, con.precioactual, con.honorarios,con.duracion_contrato,con.fecha_finalcontrato,con.cuota,con.frecuencia FROM contratos AS con INNER JOIN propietarios AS prop ON con.id_propietarios = prop.id_propietarios INNER JOIN inquilinos AS inq ON con.id_inquilinos = inq.id_inquilinos INNER JOIN propiedades AS propi ON con.id_propiedades = propi.id_propiedades where propi.id_propiedades= $1 oRDER BY propi.direccion ASC";

    const resultado = await pool.query(query, [id_propiedades]);
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
    return [];
  }
}

async function obtenerContratoPorId(id_contratos) {
  try {
    const query =
      "SELECT con.id_contratos, prop.apellido AS apellido_propietario,inq.apellido AS apellido_inquilino,propi.direccion,        con.fecha_inicio, con.precioinicial, con.precioactual, con.honorarios,con.duracion_contrato,con.fecha_finalcontrato,con.cuota,con.frecuencia FROM contratos AS con INNER JOIN propietarios AS prop ON con.id_propietarios = prop.id_propietarios INNER JOIN inquilinos AS inq ON con.id_inquilinos = inq.id_inquilinos INNER JOIN propiedades AS propi ON con.id_propiedades = propi.id_propiedades  WHERE id_contratos = $1 oRDER BY propi.direccion ASC";
    const resultado = await pool.query(query, [id_contratos]);
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
    return [];
  }
}

async function obtenerPropiedadOrdenados() {
  try {
    const resultado = await pool.query(
      "SELECT * FROM propiedades ORDER BY direccion ASC"
    );
    return resultado.rows; // Devuelve los registros correctamente
  } catch (err) {
    console.error("Error al obtener propiedad:", err);
    return [];
  }
}
async function eliminarContratos(id_contratos) {
  try {
    const sql = "DELETE FROM contratos WHERE id_contratos = $1";
    const resultado = await pool.query(sql, [id_contratos]);
    return resultado.rowCount; // Devuelve cuántos contratos se eliminaron
  } catch (err) {
    console.error("Error al eliminar contrato:", err);
    return 0; // 0 indica que no se eliminó nada
  }
}

async function agregarContratos(datos) {
  try {
    const sql =
      "INSERT INTO contratos (id_propietarios,id_inquilinos,id_propiedades,fecha_inicio,precioinicial,precioactual,honorarios,duracion_contrato,cuota,frecuencia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9,$10)";
    const resultado = await pool.query(sql, [
      datos.id_propietarios,
      datos.id_inquilinos,
      datos.id_propiedades,
      datos.fecha_inicio,
      datos.precioinicial,
      datos.precioactual,
      datos.honorarios,
      datos.duracion_contrato,
      datos.cuota,
      datos.frecuencia,
    ]);

    return resultado;
  } catch (err) {
    console.error("Error al insertar contrato:", err);
    return null;
  }
}

async function modificarContrato(datos) {
  try {
    const sql = `
      UPDATE contratos SET
        id_propietarios = $1,
        id_inquilinos = $2,
        id_propiedades = $3,
        fecha_inicio = $4,
        precioinicial = $5,
        precioactual = $6,
        honorarios = $7,
        duracion_contrato = $8,
        cuota=$9,
        frecuencia=$10
        
      WHERE id_contratos = $11
    `;
    const resultado = await pool.query(sql, [
      datos.id_propietarios,
      datos.id_inquilinos,
      datos.id_propiedades,
      datos.fecha_inicio,
      datos.precioinicial,
      datos.precioactual,
      datos.honorarios,
      datos.duracion_contrato,
      datos.cuota,
      datos.frecuencia,
      datos.id_contratos,
    ]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar contrato:", err);
    return null;
  }
}

async function obtenerContratosPorIdPropiedad(id_propiedad) {
  try {
    const resultado = await pool.query(
      `SELECT *,
       (DATE_PART('year', AGE(CURRENT_DATE, fecha_inicio)) * 12 +
        DATE_PART('month', AGE(CURRENT_DATE, fecha_inicio)) + 1) AS cuota,
       honorarios
FROM contratos
WHERE id_propiedades = $1
ORDER BY fecha_inicio DESC;
`,
      [id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("❌ Error al obtener contratos por propiedad:", err);
    return [];
  }
}
async function obtenerContratoDetalladoPorId(id_contratos) {
  const query = `
    SELECT 
      c.*,
      p.apellido AS propietario_apellido,
      i.apellido AS inquilino_apellido,
      pr.direccion AS propiedad_direccion
    FROM contratos c
    JOIN propietarios p ON c.id_propietarios = p.id_propietarios
    JOIN inquilinos i ON c.id_inquilinos = i.id_inquilinos
    JOIN propiedades pr ON c.id_propiedades = pr.id_propiedades
    WHERE c.id_contratos = $1
  `;
  const resultado = await pool.query(query, [id_contratos]);
  return resultado.rows[0];
}

export default {
  obtenerContratoDetalladoPorId,
  obtenerContratosConfiltro,
  obtenerContratos,
  agregarContratos,
  modificarContrato,
  obtenerContratoPorId,
  obtenerPropiedadOrdenados,
  obtenerContratosPorIdPropiedad,
  eliminarContratos,
};
