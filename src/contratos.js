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

async function obtenerContratoPorId(id_contratos) {
  try {
    const query = `SELECT * FROM contratos WHERE id_contratos = $1`;
    const resultado = await database.query(query, [id_contratos]);
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contrato por ID:", err);
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
    
    const sql = "INSERT INTO contratos (id_propietarios,id_inquilinos,id_propiedades,fecha_inicio,precioinicial,precioactual,honorarios,duracion_contrato,cuota) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)"; 
    const resultado= await database.query (sql,[datos.id_propietarios,
        datos.id_inquilinos,
        datos.id_propiedades,
        datos.fecha_inicio,
        datos.precioinicial,
        datos.precioactual,
        datos.honorarios,
       datos.duracion_contrato,
      datos.cuota]);
               
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
        cuota=$9
        
      WHERE id_contratos = $10
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
       datos.cuota,
      datos.id_contratos
    ]);
    return resultado;
  } catch (err) {
    console.error("Error al modificar contrato:", err);
    return null;
  } 
}

async function obtenerContratosPorIdPropiedad(id_propiedad) {
  try {
    const resultado = await database.query(
      `SELECT *,
        ((DATE_PART('year', CURRENT_DATE) - DATE_PART('year', fecha_inicio)) * 12 +
         (DATE_PART('month', CURRENT_DATE) - DATE_PART('month', fecha_inicio))) AS cuota
       FROM contratos
       WHERE id_propiedades = $1
       ORDER BY fecha_inicio DESC`,
      [id_propiedad]
    );
    return resultado.rows;
  } catch (err) {
    console.error("❌ Error al obtener contratos por propiedad:", err);
    return [];
  }
}



module.exports = { obtenerContratos,
    agregarContratos,
    modificarContrato,
   obtenerContratoPorId,
    obtenerPropiedadOrdenados,
    obtenerContratosPorIdPropiedad
};