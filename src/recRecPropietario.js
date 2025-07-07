const database= require('./datadb');


async function obtenerContratos_Id(id_propiedades) {
  try {
    const resultado = await database.query(
      ("SELECT a.id_reciboimpuestos, a.id_propiedad, a.numrecibo,a.cuota,a.importemensual,a.seguro,a.varios,b.honorarios, c.exp_ext, a.fecha FROM  recibo_inquilinos as a inner join contratos as b on a.id_propiedad=b.id_propiedades inner join impuestos as c on c.id_propiedades=a.id_propiedad where id_propiedad=$1 order by numrecibo desc limit 1"), [id_propiedades]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  }
}

async function obtenerPropietario_Id(id_propiedades) {
  try {
    const resultado = await database.query(
      ("SELECT trim(prop.apellido)|| ' ' || trim(prop.nombre) as apellido, honorarios as honorarios FROM contratos as cont inner join propietarios as prop on prop.id_propietarios = cont.id_propietarios where cont.id_propiedades=$1 "), [id_propiedades]
    );
    return resultado.rows;
  } catch (err) {
    console.error("Error al obtener propietario:", err);
    return [];
  }
}
async function insertarReciboPropietario_Id(datos) {
  try {
    const sql =
      ("insert into recibo_propietario (fecha,id_propiedad,apellidopropietario,apellidoinquilino,numrecibo,cuota,importemensual,seguro,varios,total,exp_extraor,honorarios,fecha_rec)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ")
    const resultado = await database.query(sql, [   
      datos.fecha || new Date().toISOString().slice(0, 10), // fecha
      datos.id_propiedad || 0, // id_propiedad
      datos.apellidopropietario || "",
      datos.apellidoinquilino, // apellidoinquilino
      datos.numrecibo || "0", // numrecibo
      datos.cuota || "0", // cuota
      datos.importemensual || "0", // importemensual
      datos.seguro || "0", // seguro
      datos.varios || "0", // varios
      datos.total || "0", // total
      datos.exp_extraor || "0", // exp_extraor
      datos.honorarios || "0",
       datos.fecha_rec?.trim() ? datos.fecha_rec : null
    ]);
    return resultado;
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    return [];
  }
}
async function recibosPropietarios(numrecibo) {
  
  try {
    
    const resultado = await database.query(
      "select * from recibo_propietario where numrecibo=$1",
      [numrecibo]
    );
       
    return resultado.rows;
  } catch (err) {
    console.error("Error al buscar recibos:", err);
    return [];
  } 
}

module.exports = {
  obtenerContratos_Id,
  insertarReciboPropietario_Id,
  obtenerPropietario_Id,
  recibosPropietarios
};