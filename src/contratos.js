const database = require("./datadb.js");


async function obtenerContratos() {
  
  try {
   
    const resultado = await database.query(
      "SELECT * FROM contratos ORDER BY fecha_inicio DESC"
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
 
}
}

async function obtenerContratosPorIdPropiedad(id_propiedad) {
  
  try {
   
    const resultado = await database.query(
      "SELECT * FROM contratos where id_propiedades=$1 ORDER BY fecha_inicio DESC",[id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
 
}
}

async function obtenerPropiedadOrdenados() {
  
  try {
   
      const resultado = await database.query("SELECT * FROM propiedades ORDER BY direccion ASC");
     return resultado.rows; // Devuelve los registros correctamente
    
   
  } catch (err) {
    console.error("Error al obtener propiedad:", err);
    return [];
  }
}


async function agregarContratos(datos) {
  
  try {
    
    const sql = "INSERT INTO contratos (id_propietarios,id_inquilinos,id_propiedades,fecha_inicio,precioinicial,precioactual,honorarios,duracion_contrato) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"; 
    const resultado= await database.query (sql,[datos.id_propietarios,
        datos.id_inquilinos,
        datos.id_propiedades,
        datos.fecha_inicio,
        datos.precioinicial,
        datos.precioactual,
        datos.honorarios,
       datos.duracion_contrato]);
               
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
        duracion_contrato = $8
      WHERE id_contratos = $9
    `;
    const resultado = await database.query(sql, [
      datos.id_propietarios,
      datos.id_inquilinos,
      datos.id_propiedades,
      datos.fecha_inicio,
      datos.precioinicial,
      datos.precioactual,
      datos.honorarios,
       datos.duracion_contrato,
      datos.id_contratos
    ]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar contrato:", err);
    return null;
  } 
}

async function obtenerContratoPorId(id) {
  
  try {
    
    const resultado = await  database.query("SELECT * FROM contratos WHERE id_contratos = $1", [id]);
    return resultado;

  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
    return null;
  } 
}



module.exports = { obtenerContratos,
    agregarContratos,
    modificarContrato,
    obtenerContratoPorId,
    obtenerPropiedadOrdenados,
    obtenerContratosPorIdPropiedad
};