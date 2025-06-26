const database= require('./datadb');

async function obtenerContratos_Id(id_propiedades) {
  try {
    const resultado = await database.query(
      ("SELECT con.id_contratos,con.cuota,propi.direccion,prop.apellido ||' '||prop.nombre AS apellidoPropietario,inq.apellido ||' '||inq.nombre AS apellidoInquilino,con.precioactual,con.fecha_inicio,con.duracion_contrato FROM contratos con INNER JOIN inquilinos inq ON con.id_inquilinos = inq.id_inquilinos INNER JOIN propietarios prop ON con.id_propietarios = prop.id_propietarios INNER JOIN propiedades propi ON con.id_propiedades = propi.id_propiedades WHERE con.id_propiedades= $1"), [id_propiedades]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  }
}

 

async function obtenerImpuestos(id_propiedades) {
  
  try {
    
    const resultado = await database.query ( "SELECT prop.direccion AS direccion, imp.abl AS abl,imp.aysa AS aysa, imp.exp_com AS exp_comunes,imp.exp_ext as exp_extraor, imp.seguro AS seguro,imp.varios AS varios, imp.fecha FROM impuestos AS imp INNER JOIN propiedades AS prop USING (id_propiedades) WHERE imp.fecha= (SELECT MAX(fecha) FROM impuestos WHERE id_propiedades=$1)",[id_propiedades] );
    return resultado.rows;
    
     } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  } 
}
async function insertarRecibosInquilinos(
  fecha, id_propiedad, apellidopropietario,apellidoinquilino, numrecibo, cuota, importemensual, abl, aysa, expcomunes,seguro, varios,total) {
  
  try {
    
   const resultado = await database.query(
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
    total
 
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
    
    const resultado = await database.query(
      "SELECT Max(numrecibo) as numrecibo FROM recibo_inquilinos");
        
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener num_recibo:", err);
    return [];
  } 
}
async function existeReciboPorPropiedad(id_propiedad) {
  
  try {
    
    const resultado = await database.query(
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
    
    const resultado = await database.query(
      "SELECT * FROM recibo_inquilinos WHERE id_propiedad = $1 order by numrecibo DESC limit 5",
      [id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
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
