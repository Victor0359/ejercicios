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
        FROM contratos_wiew AS con
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
         con cuota,
          con.frecuencia
        FROM contratos_wiew AS con
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
      "SELECT con.id_contratos, prop.apellido AS apellido_propietario,inq.apellido AS apellido_inquilino,propi.direccion as direccion, con.fecha_inicio, con.precioinicial, con.precioactual, con.honorarios,con.duracion_contrato,con.fecha_finalcontrato,cuota,con.frecuencia FROM contratos_view AS con INNER JOIN propietarios AS prop ON con.id_propietarios = prop.id_propietarios INNER JOIN inquilinos AS inq ON con.id_inquilinos = inq.id_inquilinos INNER JOIN propiedades AS propi ON con.id_propiedades = propi.id_propiedades where propi.id_propiedades= $1 oRDER BY propi.direccion ASC";

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
      "SELECT c.id_contratos,c.id_propiedades,c.precioactual,c.cuota, i.apellido AS apellidoinquilino,p.apellido AS apellidopropietario FROM contratos_view AS c INNER JOIN inquilinos AS i ON c.id_inquilinos = i.id_inquilinos INNER JOIN propietarios AS p ON c.id_propietarios = p.id_propietarios WHERE c.id_propiedades = $1";

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
       cuota,
       honorarios
FROM contratos_wiew
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

async function frecuenciaContratos() {
  // Consulta SQL final verificada en PostgreSQL
  const sqlQuery = `
        SELECT
            a.*, 
            b.direccion AS direccion,
            (EXTRACT(YEAR FROM current_date) * 12 + EXTRACT(MONTH FROM current_date)) - 
            (EXTRACT(YEAR FROM a.fecha_inicio) * 12 + EXTRACT(MONTH FROM a.fecha_inicio)) AS meses_transcurridos,
            MOD((EXTRACT(YEAR FROM current_date) * 12 + EXTRACT(MONTH FROM current_date)) - 
            (EXTRACT(YEAR FROM a.fecha_inicio) * 12 + EXTRACT(MONTH FROM a.fecha_inicio)), a.frecuencia) AS para_actualizar
        FROM
            contratos AS a
        INNER JOIN
            propiedades AS b
            ON a.id_propiedades = b.id_propiedades
        WHERE
            a.frecuencia IS NOT NULL AND a.frecuencia > 0
            AND a.fecha_inicio <= current_date
            
            -- FILTRO CLAVE: (Meses Transcurridos + 1) % Frecuencia = 0
            AND MOD(
                ((EXTRACT(YEAR FROM current_date) * 12 + EXTRACT(MONTH FROM current_date)) - 
                (EXTRACT(YEAR FROM a.fecha_inicio) * 12 + EXTRACT(MONTH FROM a.fecha_inicio))) + 1,
                a.frecuencia
            ) = 0
        ORDER BY
            a.fecha_inicio;
    `;

  try {
    // --- SECCIÓN CRÍTICA CORREGIDA: Usamos 'pool.query' ---
    const resultado = await pool.query(sqlQuery);

    // ⚠️ LOGS DE DEPURACIÓN (Mantenemos estos para que confirmes el resultado en consola)
    console.log("Resultado crudo de la DB:", resultado);
    console.log(
      `Filas encontradas en DB (resultado.rows.length): ${resultado.rows.length}`
    );

    // Devolvemos el array de filas (.rows)
    return resultado.rows;

    // --- FIN DE LA SECCIÓN CRÍTICA ---
  } catch (error) {
    console.error("⛔ ERROR GRAVE al ejecutar frecuenciaContratos SQL:", error);
    // Devolver una lista vacía en caso de fallo para evitar que la aplicación se caiga.
    return [];
  }
}
async function obtenerContratosPorPropiedades(id_propiedades) {
  const query = `select * from contratos_view where id_propiedades= $1 `;

  const resultado = await pool.query(query, [id_propiedades]);
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
  frecuenciaContratos,
  obtenerContratosPorPropiedades,
};
