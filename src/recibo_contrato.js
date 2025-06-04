const database= require('./datadb');

async function obtenerContratos_Id(id_propiedades) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "SELECT con.id_contratos, propi.direccion, CONCAT(prop.apellido,' ',prop.nombre) AS apellidoPropietario, concat(inq.apellido,' ',inq.nombre) AS apellidoInquilino,con.precio_actual,con.fecha_inicio,con.duracion_cont  FROM contratos con INNER JOIN inquilinos inq USING (id_inquilinos) INNER JOIN propietarios prop USING (id_propietarios) INNER JOIN propiedades_1 propi USING (id_propiedades) WHERE con.id_propiedades = ?",
      [id_propiedades]
    );
    
    return resultado;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

 

async function obtenerImpuestos(id_propiedades) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query ( "SELECT prop.direccion AS direccion, imp.abl AS abl,imp.aysa AS aysa, imp.exp_comunes AS exp_comunes, imp.exp_extraordinarias as exp_extraor, imp.seguro AS seguro, imp.fecha FROM  impuestos AS imp INNER JOIN propiedades_1 AS prop USING (id_propiedades) WHERE imp.fecha= (SELECT MAX(fecha) FROM impuestos WHERE id_propiedades= ?)",[id_propiedades] );
    return resultado;
    
     } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
async function insertarRecibosInquilinos(
  num_recibo,  meses_transcurridos,fecha_actual, apellido_inquilino,id_propiedades,apellido_propietario, monto_mensual, abl, aysa, exp_comunes, seguro, total
) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "INSERT INTO recibo_inquilino (num_recibo,meses_transcurridos,fecha_actual,apellido_inquilino,id_propiedades,apellido_propietario,monto_mensual,abl,aysa,exp_comunes,seguro,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        num_recibo,
        meses_transcurridos,
        fecha_actual,
         apellido_inquilino,
        id_propiedades,
        apellido_propietario,
        monto_mensual,
        abl,
        aysa,
        exp_comunes,
        seguro,
        total
      ]
    );
    console.log("Recibo insertado correctamente:", resultado);
    return resultado;
  } catch (err) {
    console.error("Error al cargar recibos_inquilinos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}

async function obtenernumeroRecibo() {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "SELECT Max(num_recibo) as numero_recibo FROM recibo_inquilino");
        
    return resultado;
  } catch (err) {
    console.error("Error al obtener num_recibo:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}
async function existeReciboPorPropiedad(id_propiedades) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "SELECT * FROM recibo_inquilino WHERE id_propiedades = ?",
      [id_propiedades]
    );
    return resultado.length > 0 ? resultado[0] : null;
  } catch (err) {
    console.error("Error al buscar recibo:", err);
    return null;
  } finally {
    if (conn) conn.end();
  }
}
async function obtenerRecibosPorPropiedad(id_propiedades) {
  let conn;
  try {
    conn = await database.conectar();
    const resultado = await conn.query(
      "SELECT * FROM recibo_inquilino WHERE id_propiedades = ?",
      [id_propiedades]
    );
    return resultado;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
  } finally {
    if (conn) conn.end();
  }
}


// async function obtenerRecibosPorInquilino(id_inquilino) {
//   let conn;
//   try {
//     conn = await database.conectar();
//     return await conn.query(
//       "SELECT * FROM recibo_inquilino WHERE id_inquilino = ?", [id_inquilino]
//     );
//   } catch (err) {
//     console.error("Error al buscar recibos por inquilino:", err);
//     return [];
//   } finally {
//     if (conn) conn.end();
//   }
// }
  module.exports = {
  obtenerContratos_Id,
  obtenerImpuestos,
  insertarRecibosInquilinos,
  obtenernumeroRecibo,
  existeReciboPorPropiedad,
  obtenerRecibosPorPropiedad
 
};
