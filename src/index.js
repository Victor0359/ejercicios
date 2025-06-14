const express = require("express");
const morgan = require("morgan");
const database = require("./datadb");
const jdw = require("jsonwebtoken");
const expressEjsLayouts = require("express-ejs-layouts");
const inquilinos = require("./inquilinos");
const propietarios = require("./propietarios");
const propiedades = require("./propiedades");
const path = require("path");
const impuestos = require("./impuestos");
const contratos = require("./contratos");
const recibo_contrato = require("./recibo_contrato");
require("dotenv").config();
const cors = require('cors');
app.use(cors());


const app = express();
const PORT = process.env.PORT ||10000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.static (path.join(__dirname, 'public')));
app.use(expressEjsLayouts);
app.set("layout", "layout");

app.get("/", (req, res) => {
  res.render("inicio");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//nodem
app.use(morgan("dev"));

app.post('/api-test', async (req, res) => {
  try {
    const result = await testAPIIsWriting();
    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      hint: "Verifica COMMIT y SSL"
    });
  }
});
// ------------------  inquilinos ----------------------

app.get("/inquilinos", async (req, res) => {
  try {
    const lista = await inquilinos.obtenerInquilinos();
    res.render("inquilinos", { inquilinos: lista });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar inquilinos");
  }
});
app.post ("/inquilinos", async (req, res) => {
  try {
   
    const datos= req.body;
     const prop = await inquilinos.obtenerInquilinos(datos);
    console.log(prop);
    res.render("inquilinos", { inquilinos: prop }); // Puedes dejar el log si lo necesitas
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar inquilinos");
  }
});

app.post("/inquilinos/porId", async (req, res) => {
const inquilino = req.body.id_inquilinos;
const resultado = await inquilinos.obtenerInquilinoPorId(inquilino);
console.log ("Inquilino buscado por ID:", inquilino);
console.log(resultado);
if (resultado) {
  res.status(200).json(resultado);    
}else {
  res.status(404).json({ message: "Inquilino no encontrado" }); 
}
});
app.get("/inquilinos/editar/:id", async (req, res) => {
  const id = req.params.id;
  try { 
    const inquilino = await inquilinos.obtenerInquilinoPorId(id);
    if (inquilino) {
      // Si tu función devuelve un array, usa propietario[0]
      res.render("editarInquilino", { inquilino: Array.isArray(inquilino) ? inquilino[0] : inquilino });
    } else {
      res.status(404).send("Inquilino no encontrado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al buscar el inquilino");
  }
});
app.post("/inquilinos/modificar", async (req, res) => {
const {nombre,apellido,dni,cuit,direccion,telefono,celular,correo_elec,id_inquilinos} = req.body;
console.log (req.body);
try{
const resultado = await inquilinos.modificarInquilino({nombre,apellido,dni,cuit,direccion,telefono,celular,correo_elec,id_inquilinos});

if (resultado && resultado.affectedRows > 0) {
 res.redirect("/inquilinos");
} else {
  res.status(404).json({ message: "Inquilino no modificado" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al modificar inquilino");
}
});
app.post("/inquilinos/eliminar", async (req, res) => {
const {id_inquilinos} = req.body;
try{
const resultado = await inquilinos.eliminarInquilino({id_inquilinos});

if (resultado && resultado.affectedRows > 0) {
 
    res.redirect("/inquilinos");
  
} else {
  res.status(404).json({ message: "Inquilino no eliminado" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al eliminar inquilino");
}
});
app.post("/inquilinos/insertar", async (req, res) => {
  const {nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec} = req.body;
  try {
    // Verifica si ya existe un propietario con ese DNI
    const existentes = await inquilinos.obtenerInquilinosPorDni(dni);
    if (existentes && existentes.length > 0) {
      // Ya existe, muestra mensaje de alerta en el frontend
      const lista = await inquilinos.obtenerInquilinos();
      return res.render("inquilinos", { 
        inquilinos: lista,
        mensaje: "Ya existe un inquilino con ese DNI."
      });
    }

    // Si no existe, inserta normalmente
    const resultado = await inquilinos.agregarInquilino({nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec});
    if (resultado && resultado.affectedRows > 0) {
      res.redirect("/inquilinos");
    } else {
      res.status(404).send("Inquilino no insertado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar inquilino");
  }
});app.post('/inquilinos/buscar', async (req, res) => {
  const datos = req.body.datos; // o el campo que corresponda
 try{
  const resultado = await inquilinos.obtenerInquilinos(datos);
  res.render('inquilinos', { inquilinos: resultado });
  } catch (err) {
    console.error(err);
    res.render('inquilinos',{inquilinos:[]});;
  }
});


// ------------------  propietarios ----------------------


app.get("/propietarios", async (req, res) => {
  try {
    const prop = await propietarios.obtenerPropietarios(); // <--- sin 
    console.log("Propietarios obtenidos:", prop);
    res.render("propietarios", { propietarios: prop });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar propietarios");
  }
});


 
app.post('/propietarios/editar/:id', async (req, res) => {
  // console.log("🚀 Entrando a la ruta /propietarios/editar con ID:", req.params.id, "y datos:", req.body);

  const { nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec } = req.body;
  const { id_propietarios } = req.params;

  try {
    const resultado = await propietarios.modificarPropietarios({nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec });
    if (!resultado || resultado.affectedRows === 0) { 

    console.log("✅ Propietario actualizado:", resultado.rows);
    res.json(resultado.rows.length > 0 ? resultado.rows[0] : { error: "Propietario no encontrado" });}
  } catch (err) {
    console.error("❌ Error al editar propietario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post('/propietarios/porId', async (req, res) => {
  console.log("🚀 Entrando a la ruta /propietarios/porId con datos:", req.body);
  
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID no proporcionado" });
  }

  try {
    const resultado = await database.query(
      "SELECT * FROM propietarios WHERE id_propietarios = $1", [id]
    );
    console.log("✅ Resultado de la consulta:", resultado.rows);

    if (resultado.rows.length > 0) {
      res.json(resultado.rows[0]);
    } else {
      res.status(404).json({ error: "Propietario no encontrado" });
    }
  } catch (err) {
    console.error("❌ Error al obtener propietario por ID:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/propietarios/modificar", async (req, res) => {
const {nombre,apellido,dni,cuil,direccion,telefono,celular,correo_elec,id_propietarios} = req.body;
try{
const resultado = await propietarios.modificarPropietarios({nombre,apellido,dni,cuil,direccion,telefono,celular,correo_elec,id_propietarios});

if (resultado && resultado.affectedRows > 0) {
  
   res.redirect("/propietarios");
  
} else {
  res.status(404).json({ message: "Propietario no modificado" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al modificar propietario");
}
});
app.post('/propietarios/eliminar/:id', async (req, res) => {
  // console.log("🚀 Entrando a la ruta /propietarios/eliminar con ID:", req.params.id);

  const { id } = req.params;
  console.log("Recibiendo ID:", req.params);
  try {
    const resultado = await propietarios.eliminarPropietarios({ id });

    console.log("✅ Propietario eliminado:", resultado.rows);
    res.json(resultado.rows.length > 0 ? { mensaje: "Propietario eliminado correctamente" } : { error: "Propietario no encontrado" });
  } catch (err) {
    console.error("❌ Error al eliminar propietario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
app.post("/propietarios/insertar", async (req, res) => {
  const {nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec} = req.body;
  try {
    // Verifica si ya existe un propietario con ese DNI
    const existentes = await propietarios.obtenerPropietariosPorDni(dni);
    if (existentes && existentes.length > 0) {
      // Ya existe, muestra mensaje de alerta en el frontend
      const lista = await propietarios.obtenerPropietarios();
      return res.render("propietarios", { 
        propietarios: lista,
        mensaje: "Ya existe un propietario con ese DNI."
      });
    }
  // Si no existe, inserta normalmente
    const resultado = await propietarios.agregarPropietarios({nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec});
    if (resultado && resultado.affectedRows > 0) {
      res.redirect("/propietarios");
    } else {
      res.status(404).send("Propietario no insertado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar propietario");
  }
});
app.post('/propietarios/buscar', async (req, res) => {
  const prop = req.body.prop; // o el campo que corresponda
  console.log("Datos recibidos para buscar propietarios:", prop);
 try{
  const resultado = await propietarios.obtenerPropietarios(prop);
  
  res.render('propietarios', { propietarios: resultado });
  } catch (err) {
    console.error(err);
    res.render('propietarios',{propietarios:[]});;
  }
});
// ------------------  propiedades ----------------------

app.post("/propiedades", async (req, res) => {
  try {
    const {datos} = req.body;
    // console.log("Datos recibidos:", datos);
    const propiedadesLista = await propiedades.obtenerPropiedad(datos);
   const propietarios = await propiedades.obtenerPropietarioSql();
   console.log("propietarios para el dropdown", propietarios);
    res.render("propiedades", { 
      propiedades: propiedadesLista,
      propietarios: propietarios });
       // Puedes dejar el log si lo necesitas
  
    } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar propiedades");
  }
});
app.get("/propiedades", async (req, res) => {
  try {
    const propiedadesLista = await propiedades.obtenerPropiedad();
    const propietarios = await propiedades.obtenerPropietarioSql();
    res.render("propiedades", { 
      propiedades: propiedadesLista,
      propietarios: propietarios
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar propiedades");
  }
});
app.post("/propiedades/porId", async (req, res) => {
const propiedad = req.body.id_propiedades;
const resultado = await propiedades.obtenerPropiedadesPorId(propiedad);
if (resultado) {
  res.status(200).json(resultado);    
}else {
  res.status(404).json({ message: "Propiedad no encontrada" }); 
}
});
app.get("/propiedades/editar/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const propiedad = await propiedades.obtenerPropiedadesPorId(id);
    if (propiedad) {
      // Si tu función devuelve un array, usa propiedad[0]
      res.render("editarPropiedad", { propiedad: Array.isArray(propiedad) ? propiedad[0] : propiedad });
    } else {
      res.status(404)("Propiedad no encontrada");
    }
  } catch (err) {
    console.error(err);
    res.status(500)("Error al buscar la propiedad");
  }
});
app.post("/propiedades/modificar", async (req, res) => {
let {direccion,localidad,propietario,impuesto,id_propiedades} = req.body;
if (impuesto === '' || impuesto === undefined) {
    impuesto = 0;
  }

try{
const resultado = await propiedades.modificarPropiedades({direccion,localidad,propietario,impuesto,id_propiedades});

  res.redirect("/propiedades");


}catch (err) {
  console.error( err);
  res.status(500).send("Error al modificar propiedad");
}
});
app.post("/propiedades/eliminar", async (req, res) => {
const {id_propiedades} = req.body;
try{
const resultado = await propiedades.eliminarPropiedad({id_propiedades});

if (resultado && resultado.affectedRows > 0) {
  res.redirect("/propiedades");
} else {
  res.status(404).json({ message: "Propiedad no eliminada" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al eliminar propiedad");
}
});
app.post("/propiedades/insertar", async (req, res) => {
const {direccion, localidad, propietario,impuesto} = req.body;
try{
const resultado = await propiedades.agregarPropiedades({direccion, localidad, propietario,impuesto});

if (resultado && resultado.affectedRows > 0) {
  res.redirect("/propiedades");
  // Nota: res.redirect termina la respuesta, así que no deberías enviar también un JSON aquí.
  // Si quieres enviar JSON, elimina el res.redirect y usa solo res.json.
} else {
  res.status(404).json({ message: "Propiedad no insertada" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al insertar propiedad");
}
});

//----------------------- impúestos ----------------------

app.get("/impuestos", async (req, res) => {
  try {
    const impuestosLista = await impuestos.obtenerImpuestos();
   const propiedad = await impuestos.obtenerPropiedadSql();
   
   //console.log("propiedades para el dropdown", propiedades);
   //console.log("impuestosLista", impuestosLista);
    res.render("impuestos", { 
      impuestos: impuestosLista,
      propiedades: propiedad
    });
       // Puedes dejar el log si lo necesitas
  
    } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar impuestos");
  }
});
app.post("/impuestos/insertar", async (req, res) => {
const {id_propiedades,abl, aysa, exp_comunes,exp_extraordinarias,seguro,fecha} = req.body;
try{
const resultado = await impuestos.insertarImpuestos({id_propiedades,abl,aysa,exp_comunes,exp_extraordinarias,seguro,fecha});
console.log(req.body);

if (resultado && resultado.affectedRows > 0) {
  res.redirect("/impuestos");
  // Nota: res.redirect termina la respuesta, así que no deberías enviar también un JSON aquí.
  // Si quieres enviar JSON, elimina el res.redirect y usa solo res.json.
} else {
  res.status(404).json({ message: "impuesto no insertada" });
}

}catch (err) {
  console.error( err);
  res.status(500).send("Error al insertar impuesto");
}
});

// ----------------------  contratos ----------------------
app.get("/contratos", async (req, res) => {
  try {
    const contratosLista = await contratos.obtenerContratos();
    const propietariosLista = await propietarios.obtenerPropietarios();
    const inquilinosLista = await inquilinos.obtenerInquilinosOrdenados();
    const propiedadesLista = await propiedades.obtenerPropiedadOrdenados();
 
    res.render("contratos", { contratos: contratosLista,  propietarios:propietariosLista, inquilinos: inquilinosLista, propiedades: propiedadesLista });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar contratos");
  }
});

app.post("/contratos/insertar", async (req, res) => {
  try {
    let { id_propietarios, id_inquilinos, id_propiedades, fecha_inicio, duracion_cont, precio_inicial, precio_actual, honorarios, fecha_final } = req.body;

    // Convierte vacíos a 0
    if (precio_inicial === '' || precio_inicial === undefined) precio_inicial = 0;
    if (precio_actual === '' || precio_actual === undefined) precio_actual = 0;
    if (honorarios === '' || honorarios === undefined) honorarios = 0;
    if (duracion_cont === '' || duracion_cont === undefined) duracion_cont = 0;
    if (fecha_final === '' || fecha_final === undefined) fecha_final = null;

    const resultado = await contratos.agregarContratos({
      id_propietarios,
      id_inquilinos,
      id_propiedades,
      fecha_inicio,
      duracion_cont,
      precio_inicial,
      precio_actual,
      honorarios,
      fecha_final
    });

    if (resultado && resultado.affectedRows > 0) {
      res.redirect("/contratos");
    } else {
      res.status(404).json({ message: "contrato no insertado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar contrato");
  }
});
function toMysqlDate(fecha) {
  if (!fecha) return null;
  // Si ya viene en formato YYYY-MM-DD, la dejamos igual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  // Si viene como objeto Date o string largo, lo convertimos
  const d = new Date(fecha);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}
app.post("/contratos/modificar", async (req, res) => {
  try {
let { id_contratos, id_propietarios, id_inquilinos, id_propiedades, fecha_inicio, duracion_cont, precio_inicial, precio_actual, honorarios } = req.body;
    
    console.log("req.body")// Aquí tu lógica para actualizar el contrato en la base de datos
    fecha_inicio = toMysqlDate(fecha_inicio);

    await contratos.modificarContrato({
      id_contratos,
      id_propietarios,
      id_inquilinos,
      id_propiedades,
      fecha_inicio,
      duracion_cont,
      precio_inicial,
      precio_actual,
      honorarios
    });
    res.redirect("/contratos");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al modificar contrato");
  }

});
app.get("/contratos/modificar/:id", async (req, res) => {
  try {
    const id_contratos = req.params.id;
    const contrato = await contratos.obtenerContratoPorId(id_contratos);
    console.log("Contrato encontrado:", contrato);
    if (contrato) {
      res.render("editarContratos", { contrato: Array.isArray(contrato) ? contrato[0] : contrato });
    } else {
      res.status(404).send("Contrato no encontrado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al buscar el contrato");
  }
});


// ------------------- Recibo Inquilino ----------------------  
// Mostrar el buscador y la tabla
app.get("/recibo_alquiler/buscar", async (req, res) => {
  try {
    const inquilinolista = await inquilinos.obtenerInquilinosOrdenados();
    const propiedadesLista = await propiedades.obtenerPropiedadOrdenados(); // <-- agrega esto

    res.render("buscar_recibo_alquiler", {
      inquilinos: inquilinolista,
      propiedades: propiedadesLista, // <-- envía la variable
      recibos: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar el buscador de recibos");
  }
});

// Buscar recibos por propiedad (POST)
app.post("/recibo_alquiler/buscar", async (req, res) => {
  try {
    const { id_propiedades } = req.body;
    const propiedadesLista = await propiedades.obtenerPropiedadOrdenados();
       const recibos = await recibo_contrato.obtenerRecibosPorPropiedad(id_propiedades);
    const inquilinosLista = await inquilinos.obtenerInquilinosOrdenados();
    
    console.log(req.bopdy);

    res.render("buscar_recibo_alquiler", { propiedades: propiedadesLista,  inquilinos: inquilinosLista,recibos: recibos });
      
     
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al buscar recibos");
  }
});

app.get('/api/datos_propiedad', async (req, res) => {
  try {
    const id_propiedades = req.query.id_propiedades;
    const contrato = await recibo_contrato.obtenerContratos_Id(id_propiedades);
    const impuestosLista = await recibo_contrato.obtenerImpuestos(id_propiedades);
    const ultimoRecibo = await recibo_contrato.obtenernumeroRecibo();
    

    // Prepara los valores, aunque estén vacíos
    
    const apellidoInquilino = contrato[0]?.apellidoInquilino || "";
    const apellidoPropietario = contrato[0]?.apellidoPropietario || "";
    const fecha_inicio = contrato[0]?.fecha_inicio || "";
    const monto_mensual = contrato[0]?.precio_actual || "";
    const exp_comunes = impuestosLista[0]?.exp_comunes || "";
    const abl = impuestosLista[0]?.abl || "";
    const aysa = impuestosLista[0]?.aysa || "";
    const seguro = impuestosLista[0]?.seguro || "";
    const numero_recibo = (ultimoRecibo[0]?.numero_recibo || 0) + 1;

    // Calcula el total
    function calcularTotal({ monto_mensual, abl, aysa, exp_comunes, seguro }) {
      const aNum = v => Number(v) || 0;
      return (
        aNum(monto_mensual) +
        aNum(abl) +
        aNum(aysa) +
        aNum(exp_comunes) +
        aNum(seguro)
      );
    }
    const total = calcularTotal({ monto_mensual, abl, aysa, exp_comunes, seguro });

    // Envía la respuesta una sola vez
    res.json({
      numero_recibo,
      apellidoInquilino,
      apellidoPropietario,
      fecha_inicio,
      monto_mensual,
      exp_comunes,
      abl,
      aysa,
      seguro,
      total
    });

  } catch (err) {
    res.status(500).json({ error: "Error al obtener datos de la propiedad" });
  }
});
app.get("/recibo_inquilino", async (req, res) => {
  try {
    const listaDePropiedades = await propiedades.obtenerPropiedadOrdenados(); // <-- trae todas las propiedades
  
    const numero = await recibo_contrato.obtenernumeroRecibo();
const numero_recibo = (numero[0]?.numero_recibo|| 0) + 1;

    const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const hoy = new Date();
const fechaFormateada = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;
    res.render("recibo_inquilino", { 
      propiedades: listaDePropiedades,
     numero_recibo: numero_recibo,
      id_propiedad_seleccionada: null,
      apellidoInquilino: "",
      apellidoPropietario: "",
      fecha_actual: fechaFormateada,
      fecha_inicio: "",
      monto_mensual: "",
      exp_comunes: "",
      abl: "",
      aysa: "",
      seguro: ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar recibo de inquilino");
  }
});
 app.post("/recibo_inquilino", async (req, res) => {
  try {
    const id_propiedades = req.body.id_propiedades;
   
    const listaDePropiedades = await propiedades.obtenerPropiedadOrdenados(); // <-- trae todas las propiedades
    const contrato = await recibo_contrato.obtenerContratos_Id(id_propiedades);
    const impuestosLista= await recibo_contrato.obtenerImpuestos(id_propiedades);
      const numero= await recibo_contrato.obtenernumeroRecibo();
    const numero_recibo= (numero[0]?.numero_recibo|| 0) + 1;

    const apellidoInquilino = Array.isArray(contrato) && contrato.length > 0
  ? (contrato[0].apellidoInquilino)
  : "";
   const apellidoPropietario = Array.isArray(contrato) && contrato.length > 0
  ? (contrato[0].apellidoPropietario)
  : "";
  const fecha_inicial = Array.isArray(contrato) && contrato.length > 0
  ? (contrato[0].fecha_inicio)
  : "";
  const monto_mensuales = Array.isArray(contrato) && contrato.length > 0
  ? (contrato[0].precio_actual)
  : "";
  const exp_comunes = Array.isArray(impuestosLista) && impuestosLista.length > 0
  ? (impuestosLista[0].exp_comunes)
  : "";
  const abl = Array.isArray(impuestosLista) && impuestosLista.length > 0
  ? (impuestosLista[0].abl)
  : "";
  const aysa = Array.isArray(impuestosLista) && impuestosLista.length > 0
  ? (impuestosLista[0].aysa)
  : "";
  const seguro = Array.isArray(impuestosLista) && impuestosLista.length > 0
  ? (impuestosLista[0].seguro)
  : "";

  const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const hoy = new Date();
const fechaFormateada = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;

     
    res.render("recibo_inquilino", { 
      propiedades: listaDePropiedades,
      numero_recibo:numero_recibo,
      id_propiedad_seleccionada: id_propiedades,
      apellidoInquilino,
      apellidoPropietario,
      fecha_actual: fechaFormateada,
      fecha_inicio: fecha_inicial,
      monto_mensual: monto_mensuales,
      exp_comunes: exp_comunes,
      abl: abl,
      aysa: aysa,
      seguro: seguro
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar recibo de inquilino");
  }
});
app.post("/recibo_inquilino/insertar", async (req, res) => {
  try {
    let {
      numero_recibo, meses_transcurridos, fecha_actual, apellidoInquilino, id_propiedades, apellidoPropietario, monto_mensual, abl, aysa, exp_comunes, seguro, total
    } = req.body;

    const contrato = await recibo_contrato.obtenerContratos_Id(id_propiedades);

    if (!contrato || contrato.length === 0) {
      // No existe contrato, muestra aviso y no inserta
      const listaDePropiedades = await propiedades.obtenerPropiedadOrdenados();

      numero_recibo = numero_recibo || 0;
      meses_transcurridos = meses_transcurridos || 0;
      fecha_actual = fecha_actual || "";
      apellidoInquilino = apellidoInquilino || "";
      id_propiedades = id_propiedades || 0;
      apellidoPropietario = apellidoPropietario || "";
      monto_mensual = monto_mensual || 0;
      abl = abl || 0;
      aysa = aysa || 0;
      exp_comunes = exp_comunes || 0;
      seguro = seguro || 0;
      total = total || 0;
      // const reciboExistente = await recibo_contrato.existeReciboPorPropiedad(id_propiedades);

      if (reciboExistente) {
        // Puedes renderizar la vista con un mensaje, o redirigir a modificar
        return res.render("recibo_inquilino", {
          propiedades: await propiedades.obtenerPropiedadOrdenados(),
          numero_recibo,
          id_propiedad_seleccionada: id_propiedades,
          apellidoInquilino,
          apellidoPropietario,
          fecha_actual,
          fecha_inicio: reciboExistente.fecha_inicio || "",
          monto_mensual,
          exp_comunes,
          abl,
          aysa,
          seguro,
          // mensaje: "Ya existe un recibo para esta propiedad."
        });
      }

      // Si no hay contrato y no hay recibo existente, también puedes retornar aquí si lo deseas
      return res.render("recibo_inquilino", {
        propiedades: listaDePropiedades,
        numero_recibo,
        id_propiedad_seleccionada: id_propiedades,
        apellidoInquilino,
        apellidoPropietario,
        fecha_actual,
        fecha_inicio: "",
        monto_mensual,
        exp_comunes,
        abl,
        aysa,
        seguro,
        mensaje: "No se puede insertar un recibo sin contrato asociado"
      });
    }

    const resultado = await recibo_contrato.insertarRecibosInquilinos(
      numero_recibo,
      meses_transcurridos,
      fecha_actual,
      apellidoInquilino,
      id_propiedades,
      apellidoPropietario,
      monto_mensual,
      abl,
      aysa,
      exp_comunes,
      seguro,
      total
    );

    if (resultado && resultado.affectedRows > 0) {
      res.redirect("/recibo_inquilino");
    } else {
      res.status(404).json({ message: "recibo_inquilino no insertado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar recibo_inquilino");
  }
});
// ------------------  login ----------------------


app.post("/login", async (req, res) => {
  let conn2;
  try {
    const key = await getkey();
    console.log("La key obtenida es:", key);

    if (!key || key.length === 0) {
      throw new Error("No se pudo obtener la clave secreta: respuesta vacía");
    }

    const secretKey = key[0]?.clave; // Obtén la clave secreta del primer elemento
    console.log("La clave secreta es:", secretKey);

    if (!secretKey) {
      throw new Error("No se pudo obtener la clave secreta");
    }

    const { clave, nombre } = req.body;
    if (!clave || !nombre) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Faltan credenciales en el cuerpo de la solicitud",
        });
    }

    if (clave === key[0]?.clave && nombre.trim() === key[0]?.nombre) {
      console.log("Credenciales válidas:", clave, nombre);

      const playload = {
        check: true,
      };

      const token = jdw.sign(playload, secretKey, {
        algorithm: "HS256", // Algoritmo de firma
        expiresIn: "7d", // Expira en 7 días
      });

      console.log("Token generado:", token);
      return res.json({
        success: true,
        message: "Login exitoso",
        token: token,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("Error en el endpoint de login:", err);
    res.status(500).send("Error en el endpoint de login");
  } finally {
    if (conn2) conn2.end(); // Cierra la conexión
  }
});

const verificacion = async (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  console.log("Token recibido:", token);

  if (!token) {
    return res.status(403).send({ error: "Token no proporcionado" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
    console.log("token sin Bearer:", token);
  }

  try {
    const key = await getkey();
    const secretKey = key[0]?.clave;
    console.log("la key obtenida es:", secretKey);
    if (!secretKey) {
      throw new Error("No se pudo obtener la clave secreta");
    }
    const jdw = require("jsonwebtoken");
    jdw.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.error("Error al verificar el token:", err);
        return res.json({ message: "Token inválido" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } catch (err) {
    console.error("Error al obtener la clave para verificar el token:", err);
    res.status(500).send("Error interno del servidor");
  }
};

app.get("/inicio", (req, res) => {
  res.render("inicio");
});
app.get("/login", (req, res) => {
  res.render("login");
});
