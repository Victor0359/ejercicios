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
const helmet = require('helmet');
const session = require('express-session');
const flash = require('express-flash');
const funcion_letras = require("./funcion_letras");
const recibo_prop = require("./recRecPropietario");
const app = express();
const bcrypt = require('bcrypt');
const PgSession = require('connect-pg-simple')(session);




app.set("views", path.join(__dirname, "views"));


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});




app.use(express.json());





app.use((req, res, next) => {
  res.locals.ocultarNavbar = false; // valor por defecto para TODAS las vistas
  next();
});
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new PgSession({
    pool: database,
    tableName: 'session',
 
  }),
  secret: 'claveSuperSecreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
  }
}));
app.use(flash());
app.use(expressEjsLayouts);
app.set("layout", "layout");
app.use(cors());
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
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://translate.google.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
    },
  })
);

app.use((req, res, next) => {
  res.locals.insertado = false;
  res.locals.eliminado = false;
  res.locals.mensaje = null;
  res.locals.lista = [];
  next();
});

// Para parsear body
app.use(express.urlencoded({ extended: true }));

function verificarSesion(req, res, next) {
  console.log("verificarSesion - usuarioId:", req.session.usuarioId);
  if (req.session.usuarioId) return next();
  res.redirect('/login');
}
// Página principal protegida

// app.get('/inicio', verificarSesion, (req, res) => {
//    res.locals.ocultarNavbar = false;
//   console.log("Sesión en /inicio:", req.session); // debería mostrar usuarioId
//   res.render('inicio', { email: req.session.email });
// });

app.use((req, res, next) => {
  res.locals.mostrarNavbar = !!req.session.usuarioId; // o cualquier lógica que necesites
  next();
});

// Registro de usuario


// Login del usuario// 🟢 POST: intenta loguear al usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const resultado = await database.query('SELECT * FROM login WHERE email = $1', [email]);

  if (resultado.rows.length === 0) {
    return res.render('login', { error: 'Usuario no encontrado'});
  }

  const usuario = resultado.rows[0];
  const match = await bcrypt.compare(password, usuario.password);

  console.log('¿Coincide?', match);

  if (!match) {
    return res.render('login', { error: 'Contraseña incorrecta', mostrarNavbar: true });
  }

  // Sesión OK
  req.session.usuarioId = usuario.id_login;
  req.session.email = usuario.email;

  req.session.save((err) => {
    if (err) {
      console.error('Error al guardar sesión:', err);
      return res.render('login', { error: 'Falla al guardar sesión', mostrarNavbar: true });
    }
    res.redirect('/inicio');
  });
});


// 🟢 GET: inspeccionar sesión
app.get('/debug-session', (req, res) => {
  res.send(`<pre>${JSON.stringify(req.session, null, 2)}</pre>`);
});

app.get('/login', (req, res) => {
  console.log("Entrando a /login");
  if (req.session.usuarioId) {
    return res.redirect('/inicio' );
  }
  
  res.render('login', { error: null, });
});
// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/inicio');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});
function requireLogin(req, res, next) {
  console.log("Middleware requireLogin ejecutado. UsuarioId:", req.session.usuarioId);
  if (!req.session.usuarioId) {
    return res.redirect('/login');
  }
  next();
}

app.get('/inicio', verificarSesion, (req, res) => {
 
  res.render('inicio', { email: req.session.email,mostrarNavbar:true});
});

app.get('/', (req, res) => {
  if (req.session.usuarioId) {
    return res.redirect('/inicio');
  }
  res.render('login', { mostrarNavbar: false });
});



app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use((req, res, next) => {
  console.log("Sesión actual:", req.session);
  next();
});



// ------------------  inquilinos ----------------------

app.get("/inquilinos",requireLogin, async (req, res) => {
  try {
    const lista = await inquilinos.obtenerInquilinos();
    res.render("inquilinos", {
      inquilinos: lista,
      insertado: req.query.insertado === "1",
      eliminado: req.query.eliminado === "1",
      mensaje: req.query.mensaje || null
    });
  } catch (error) {
    console.error("❌ Error al cargar inquilinos:", error);
    res.status(500).send("Error interno al cargar inquilinos");
  }
});
app.post("/inquilinos", async (req, res) => {
  try {

    const datos = req.body;
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
  console.log("Inquilino buscado por ID:", inquilino);
  console.log(resultado);
  if (resultado) {
    res.status(200).json(resultado);
  } else {
    res.status(404).json({ message: "Inquilino no encontrado" });
  }
});
app.post('/inquilinos/editar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec
  } = req.body;

  try {
    const resultado = await inquilinos.modificarInquilinos({
      id_inquilinos: id, // importante: usar el ID de los params
      nombre,
      apellido,
      dni,
      cuil,
      direccion,
      telefono,
      celular,
      correo_elec
    });

    if (resultado && resultado.rowCount > 0) {

      res.redirect('/inquilinos?mensaje=modificado');

    } else {
      res.redirect(`/inquilinos/editar/${id}?mensaje=error`);
    }
  } catch (err) {
    console.error('❌ Error al modificar inquilinos:', err);
    res.status(500).send('💥 Error interno del servidor');
  }
});

app.post('/inquilinos/modificar', async (req, res) => {
  const {
    id_inquilinos,
    nombre,
    apellido,
    dni,
    cuil,
    direccion,
    telefono,
    celular,
    correo_elec
  } = req.body;

  try {
    const resultado = await inquilinos.modificarInquilinos({
      id_inquilinos,
      nombre,
      apellido,
      dni,
      cuil,
      direccion,
      telefono,
      celular,
      correo_elec
    });

    if (resultado && resultado.rowCount > 0) {
      req.flash('success', '✅ Inquilino modificado correctamente');
      res.redirect('/inquilinos');
    } else {
      req.flash('error', 'No se pudo modificar el inquilino');
      res.redirect(`/inquilinos/editar/${id}`);
    }

  } catch (err) {
    console.error('❌ Error al modificar inquilino:', err);
    res.status(500).send('💥 Error interno del servidor');
  }
});

app.post('/inquilinos/eliminar/:id', async (req, res) => {
  console.log("📌 Recibiendo solicitud en /inquilinos/eliminar con ID:", req.params.id);

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Falta el ID en la solicitud" });
  }

  try {
    console.log("🔍 Eliminando inquilinos con ID:", id);
    const resultado = await inquilinos.eliminarInquilinos({ id });

    if (!Array.isArray(resultado) || resultado.length === 0) {
      return res.status(404).json({ mensaje: "Inquilino no encontrado" });
    }

    res.redirect('/inquilinos?eliminado=1');
    return;

  } catch (err) {
    console.error("❌ Error al eliminar inquilino:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }

});

app.post("/inquilinos/insertar", async (req, res) => {
  const { nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec } = req.body;

  try {
    const existentes = await inquilinos.obtenerInquilinosPorDni(dni);

    if (existentes && existentes.length > 0) {
      const lista = await inquilinos.obtenerInquilinos();
      return res.render("inquilinos", {

        inquilinos: lista,
        insertado: false,
        eliminado: false,
        mensaje: "Ya existe un inquilino con ese DNI."
      });
    }

    const resultado = await inquilinos.agregarInquilinos({ nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec });
    console.log("🔎 Resultado de agregarInquilinos:", resultado);

    if (resultado && resultado.rowCount > 0) {
      console.log("Resultado del INSERT:", resultado); //Inserción exitosa
      return res.redirect("/inquilinos?insertado=1");
    } else {
      // Fallo sin excepción
      const lista = await inquilinos.obtenerInquilinos();
      return res.render("inquilinos", {


        inquilinos: lista,
        insertado: false,
        eliminado: false,

        mensaje: "No se pudo insertar el inquilino. Intente nuevamente."
      });
    }

  } catch (err) {
    console.error(err);
    const lista = await inquilinos.obtenerInquilinos();
    return res.render("inquilinos", {
      inquilinos: lista,

      insertado: false,
      eliminado: false,

      mensaje: "Ocurrió un error en el servidor al insertar el inquilino."
    });
  }
});

app.get('/inquilinos/editar/:id', async (req, res) => {
  const { id } = req.params;
  const mensaje = req.query.mensaje || null;

  try {
    const inquilino = await inquilinos.obtenerInquilinosPorId(id);
    res.render('editarInquilino', {
      inquilino,
      mensaje,
      insertado: req.query.insertado === "1",
      eliminado: req.query.eliminado === "1"
    });
  } catch (err) {
    console.error("❌ Error al cargar el formulario de edición:", err);
    res.status(500).send("Error al cargar el formulario");
  }
});

app.post('/inquilinos/buscar', async (req, res) => {
  const prop = req.body.prop;
  console.log("📥 Datos recibidos para buscar inquilinos:", prop);

  try {
    const inquilinosEncontrados = await inquilinos.obtenerInquilinos(prop);
    const insertado = req.query.insertado === "1";
    const eliminado = req.query.eliminado === "1";
    let mensaje = req.query.mensaje || null;

    // Si no se encontró nada, avisamos
    if (!inquilinosEncontrados || inquilinosEncontrados.length === 0) {
      mensaje = `🔎 No se encontraron resultados para: "${prop}"`;
    }

    res.render('inquilinos', {
      inquilinos: inquilinosEncontrados || [],
      insertado,
      eliminado,
      mensaje
    });

  } catch (err) {
    console.error("❌ Error al buscar inquilinos:", err);
    res.render('inquilinos', {
      inquilinos: [],
      insertado: false,
      eliminado: false,
      mensaje: "Error del servidor al buscar inquilinos."
    });
  }
});


// ------------------  propietarios ----------------------


app.get("/propietarios", requireLogin, async (req, res) => {
  try {
    const lista = await propietarios.obtenerPropietarios();
    res.render("propietarios", {
      propietarios: lista,
      insertado: req.query.insertado === "1",
      eliminado: req.query.eliminado === "1",
      mensaje: req.query.mensaje || null
    });
  } catch (error) {
    console.error("❌ Error al cargar propietarios:", error);
    res.status(500).send("Error interno al cargar propietarios");
  }
});



app.post('/propietarios/editar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec
  } = req.body;

  try {
    const resultado = await propietarios.modificarPropietarios({
      id_propietarios: id, // importante: usar el ID de los params
      nombre,
      apellido,
      dni,
      cuil,
      direccion,
      telefono,
      celular,
      correo_elec
    });

    if (resultado && resultado.rowCount > 0) {

      res.redirect('/propietarios?mensaje=modificado');

    } else {
      res.redirect(`/propietarios/editar/${id}?mensaje=error`);
    }
  } catch (err) {
    console.error('❌ Error al modificar propietario:', err);
    res.status(500).send('💥 Error interno del servidor');
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

app.post('/propietarios/modificar',requireLogin, async (req, res) => {
  const {
    id_propietarios,
    nombre,
    apellido,
    dni,
    cuil,
    direccion,
    telefono,
    celular,
    correo_elec
  } = req.body;

  try {
    const resultado = await propietarios.modificarPropietarios({
      id_propietarios,
      nombre,
      apellido,
      dni,
      cuil,
      direccion,
      telefono,
      celular,
      correo_elec
    });

    if (resultado && resultado.rowCount > 0) {
      req.flash('success', '✅ Propietario modificado correctamente');
      res.redirect('/propietarios');
    } else {
      req.flash('error', 'No se pudo modificar el propietario');
      res.redirect(`/propietarios/editar/${id}`);
    }

  } catch (err) {
    console.error('❌ Error al modificar propietario:', err);
    res.status(500).send('💥 Error interno del servidor');
  }
});


app.post('/propietarios/eliminar/:id', async (req, res) => {
  console.log("📌 Recibiendo solicitud en /propietarios/eliminar con ID:", req.params.id);

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Falta el ID en la solicitud" });
  }

  try {
    console.log("🔍 Eliminando propietario con ID:", id);
    const resultado = await propietarios.eliminarPropietarios({ id });

    if (!Array.isArray(resultado) || resultado.length === 0) {
      return res.status(404).json({ mensaje: "Propietario no encontrado" });
    }

    res.redirect('/propietarios?eliminado=1');
    return;

  } catch (err) {
    console.error("❌ Error al eliminar propietario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }

});


app.post("/propietarios/insertar", async (req, res) => {
  const { nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec } = req.body;

  try {
    const existentes = await propietarios.obtenerPropietariosPorDni(dni);

    if (existentes && existentes.length > 0) {
      const lista = await propietarios.obtenerPropietarios();
      return res.render("propietarios", {
        propietarios: lista,
        mensaje: "Ya existe un propietario con ese DNI."
      });
    }

    const resultado = await propietarios.agregarPropietarios({ nombre, apellido, dni, cuil, direccion, telefono, celular, correo_elec });

    if (resultado && resultado.rowCount > 0) {
      console.log("Resultado del INSERT:", resultado); //Inserción exitosa
      return res.redirect("/propietarios?insertado=1");
    } else {
      // Fallo sin excepción
      const lista = await propietarios.obtenerPropietarios();
      return res.render("propietarios", {
        propietarios: lista,
        mensaje: "No se pudo insertar el propietario. Intente nuevamente."
      });
    }

  } catch (err) {
    console.error(err);
    const lista = await propietarios.obtenerPropietarios();
    return res.render("propietarios", {
      propietarios: lista,
      mensaje: "Ocurrió un error en el servidor al insertar el propietario."
    });
  }
});

app.get('/propietarios/editar/:id', async (req, res) => {
  const { id } = req.params;
  const mensaje = req.query.mensaje || null;

  try {
    const propietario = await propietarios.obtenerPorId(id);
    res.render('editarPropietario', {
      propietario,
      mensaje: req.query.mensaje || null,
      insertado: req.query.insertado === "1",
      eliminado: req.query.eliminado === "1"
    });
  } catch (err) {
    console.error("❌ Error al cargar el formulario de edición:", err);
    res.status(500).send("Error al cargar el formulario");
  }
});




app.post('/propietarios/buscar', requireLogin, async (req, res) => {
  const prop = req.body.prop;
  console.log("Datos recibidos para buscar propietarios:", prop);
  try {
    const propietariosEncontrados = await propietarios.obtenerPropietarios(prop);
    const eliminado = req.query.eliminado === '1';
    res.render('propietarios', {
      propietarios: propietariosEncontrados,
      eliminado,
      mensaje: req.query.mensaje || null,
      insertado: req.query.insertado === "1"
    });
  } catch (err) {
    console.error(err);
    res.render('propietarios', { propietarios: [] });
  }
});


// ------------------  propiedades ----------------------

app.get("/propiedades", requireLogin, async (req, res) => {
  try {
    const propietariosLista = await propiedades.obtenerPropietarioSql();
    const propiedadesLista = await propiedades.obtenerPropiedad();
   

    const mensaje = req.query.mensaje;
    const insertado = req.query.insertado;

    
    console.log(propiedadesLista)

  
 res.render("propiedades", {
  mostrarNavbar: true,
  propiedades: propiedadesLista || [],
  propietarios: propietariosLista || [],
  mensaje,
  insertado,
  eliminado: req.query.eliminado || false
});

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar el formulario");
  }
});

app.post("/propiedades", async (req, res) => {
  try {
    const { id_propietario } = req.body;
    console.log("ID PROPIETARIO DEL FORMULARIO:", id_propietario);
    const propiedadesLista = await propiedades.obtenerPropiedad(id_propietario);
    const propietarios = await propiedades.obtenerPropietarioSql();
    console.log("propietarios para el dropdown", propietarios);
 console.log("propietariosLista:", Array.isArray(propietarios), propietarios);

    res.render("propiedades", {
      propiedades: propiedadesLista,
      propietarios: propietarios
    });
    // Puedes dejar el log si lo necesitas

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar propiedades");
  }
});
app.post("/propiedades/porId", async (req, res) => {
  const propiedad = req.body.id_propiedades;

  if (!propiedad) {
    return res.status(400).json({ message: "ID de propiedad no proporcionado" });
  }
  try {
    const resultado = await propiedades.obtenerPropiedadesPorId(propiedad);
    if (resultado) {
      res.status(200).json(resultado);
    } else {
      res.status(404).json({ message: "Propiedad no encontrada" });
    }
  } catch (err) {
    console.error("Error al buscar propiedad por ID:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/propiedades/modificar", requireLogin, async (req, res) => {
  const { direccion, localidad, id_propietario, id_impuestos, id_propiedades } = req.body;
  if (id_impuestos === '' || id_impuestos === undefined) {
    id_impuestos = 0;
  }

  try {
    const resultado = await propiedades.modificarPropiedades({ direccion, localidad, id_propietario, id_impuestos, id_propiedades });

    res.redirect("/propiedades");


  } catch (err) {
    console.error(err);
    res.status(500).send("Error al modificar propiedad");
  }
});
app.get("/propiedades/editar/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const propiedad = await propiedades.obtenerPropiedadesPorId(id);
    propiedad[0];
    if (!propiedad) {
      return res.status(404).send("Propiedad no encontrada");
    }

    const listaPropietarios = await propiedades.obtenerPropietarioSql();
    const listaImpuestos = await propiedades.obtenerImpuestosSql();

    res.render("editarPropiedad", {
      propiedad,
      propietarios: listaPropietarios,
      impuestos: listaImpuestos
    });
  } catch (err) {
    console.error("❌ Error en GET /editar/:id:", err);
    res.status(500).send("Error al buscar la propiedad");
  }
});

app.post("/propiedades/eliminar", async (req, res) => {
  const { id_propiedades } = req.body;
  try {
    const resultado = await propiedades.eliminarPropiedad({ id: id_propiedades });

    if (resultado && resultado.rowCount) {
      res.redirect("/propiedades");
    } else {
      res.status(404).json({ message: "Propiedad no eliminada" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar propiedad");
  }
});
app.post("/propiedades/eliminar/:id", async (req, res) => {
  const id_propiedades = req.params.id;
  try {
    const resultado = await propiedades.eliminarPropiedad({ id: id_propiedades });

    if (resultado && resultado.rowCount) {
      res.redirect("/propiedades");
    } else {
      res.status(404).json({ message: "Propiedad no eliminada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar propiedad");
  }
});

app.post("/propiedades/insertar", async (req, res) => {
  const { direccion, localidad, id_propietario, id_impuestos } = req.body;
  try {
    const resultado = await propiedades.agregarPropiedades({ direccion, localidad, id_propietario, id_impuestos });

    if (resultado && resultado.rowCount > 0) {
      res.redirect("/propiedades?insertado=1");
      // Nota: res.redirect termina la respuesta, así que no deberías enviar también un JSON aquí.
      // Si quieres enviar JSON, elimina el res.redirect y usa solo res.json.
    } else {
      res.redirect("/propiedades?insertado=1");
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar propiedad");
  }
});
app.get("/propiedades/insertar", async (req, res) => {
  try {
    const propietarios = await propiedades.obtenerPropietarioSql();
    const propiedadesLista = await propiedades.obtenerPropiedad();
    res.render("propiedades", {
      propiedades: propiedadesLista,
      propietarios: propietarios
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar el formulario");
  }
});

app.post('/propiedades/buscar', requireLogin, async (req, res) => {
  const datos = req.body.datos;
  console.log("Datos recibidos para buscar propietarios:", datos);
  try {
    const propiedadesEncontrados = await propiedades.obtenerPropiedad(datos);
    const eliminado = req.query.eliminado === '1';
    const propietarios = await propiedades.obtenerPropietarioSql();

    res.render('propiedades', {
      propiedades: propiedadesEncontrados,
      propietarios: propietarios, // 👈 esto es lo que faltaba
      eliminado,
      mensaje: req.query.mensaje || null,
      insertado: req.query.insertado === "1"
    });

  } catch (err) {
    console.error(err);
    res.render('propiedades', { propiedades: [] });
  }
});


//----------------------- impúestos ----------------------

app.get("/impuestos",requireLogin, async (req, res) => {
  try {
    const idPropiedad = req.query.id_propiedad;
    const propiedadesLista = await propiedades.obtenerPropiedadesOrdenadasPorId();
    const hayFiltro = Boolean(idPropiedad);


    /* let impuestosLista; */

    if (idPropiedad) {
      impuestosLista = await impuestos.obtenerImpuestosPorDireccion(idPropiedad);
    } else {
      impuestosLista = await impuestos.obtenerImpuestos();
    }

    res.render("impuestos", {
      impuestos: Array.isArray(impuestosLista.rows) ? impuestosLista.rows : [],
      propiedades: propiedadesLista,
      id_propiedad: idPropiedad || "",
      hayFiltro
    });
  } catch (err) {
    console.error("Error en /impuestos:", err);
    res.status(500).send("Error al cargar impuestos");
  }
});



app.get("/impuestos/insertar", requireLogin, async (req, res) => {

  try {
    const propiedad = await propiedades.obtenerPropiedadesOrdenadasPorId();

    res.render("impuestos", {
      propiedades: Array.isArray(propiedad) ? propiedad : []
    });
  } catch {
    console.error("Error en /impuestos:", err);
    res.status(500).send("Error al cargar impuestos");
  }

});

app.post("/impuestos/insertar", async (req, res) => {
  const { abl, aysa, exp_com, exp_ext, seguro, varios, id_propiedades } = req.body;
  try {
    const resultado = await impuestos.insertarImpuestos({ abl, aysa, exp_com, exp_ext, seguro, varios, id_propiedades });


    if (resultado && resultado.rowCount > 0) {
      res.redirect("/impuestos");
      // Nota: res.redirect termina la respuesta, así que no deberías enviar también un JSON aquí.
      // Si quieres enviar JSON, elimina el res.redirect y usa solo res.json.
    } else {
      res.status(404).json({ message: "impuesto no insertado" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar impuesto");
  }
});

// ----------------------  contratos ----------------------
app.get("/contratos", requireLogin, async (req, res) => {
  console.log("URL completa:", req.url);
  console.log("Query completa:", req.query);
  try {
    const id_propiedad = req.query.id_propiedad;
    const hayFiltro = Boolean(id_propiedad);
    const contratosLista = id_propiedad
      ? await contratos.obtenerContratosPorIdPropiedad(id_propiedad)
      : await contratos.obtenerContratos();

    const propietariosLista = await propietarios.obtenerTodosLosPropietarios();
    const inquilinosLista = await inquilinos.obtenerTodosLosInquilinos();
    const propiedadesLista = await contratos.obtenerPropiedadOrdenados();
    console.log("req.query completo:", req.query);
    console.log("Valor recibido en filtro:", id_propiedad);
    res.set("Cache-Control", "no-store");
    res.render("contratos", {
      contratos: contratosLista,
      propietarios: propietariosLista,
      inquilinos: inquilinosLista,
      propiedades: propiedadesLista,
      hayFiltro,
      id_propiedad
    });


  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar contratos");
  }
});




app.post("/contratos/insertar",requireLogin, async (req, res) => {
  try {
    let { id_propietarios, id_inquilinos, id_propiedades, fecha_inicio, precioinicial, precioactual, honorarios, duracion_contrato } = req.body;
    console.log(req.body);
    function calcularCuota(fecha_inicio) {
      const hoy = new Date();
      const inicio = new Date(fecha_inicio);


      let meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      if (hoy.getDate() < inicio.getDate()) meses--; // ajusta si el día aún no pasó
      return meses;
    }

    // Convierte vacíos a 0
    if (precioinicial === '' || precioinicial === undefined) precioinicial = 0;
    if (precioactual === '' || precioactual === undefined) precioactual = 0;
    if (honorarios === '' || honorarios === undefined) honorarios = 0;
    if (duracion_contrato === '' || duracion_contrato === undefined) duracion_contrato = 0;


    const resultado = await contratos.agregarContratos({
      id_propietarios,
      id_inquilinos,
      id_propiedades,
      fecha_inicio,
      precioinicial,
      precioactual,
      honorarios,
      duracion_contrato,
      cuota: calcularCuota(fecha_inicio),


    });

    if (resultado && resultado.rowCount > 0) {
      res.redirect("/contratos");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar contratos");
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
app.post("/contratos/modificar", requireLogin, async (req, res) => {
  try {
    const {
      id_propietarios,
      id_inquilinos,
      id_propiedades,
      fecha_inicio,
      precioinicial,
      precioactual,
      honorarios,
      duracion_contrato,
      id_contratos
    } = req.body;

    console.log("req.body:", req.body);
    console.log("🔎 Buscando contrato con ID:", id_contratos);

    const resultado = await contratos.modificarContrato({
      id_propietarios,
      id_inquilinos,
      id_propiedades,
      fecha_inicio,
      precioinicial,
      precioactual,
      honorarios,
      duracion_contrato,
      id_contratos
    });

    console.log("Resultado de la modificación:", resultado);

    if (!resultado || resultado.rowCount === 0) {
      return res.status(404).send("Contrato no encontrado");
    }

    res.redirect("/contratos");

  } catch (err) {
    console.error("❌ Error al modificar contrato:", err);
    res.status(500).send("Error al modificar contrato");
  }
});

app.get("/contratos/editar/:id", async (req, res) => {
  const id_contratos = req.params.id;
  try {
    const resultado = await contratos.obtenerContratoPorId(id_contratos);
    console.log("Resultado obtenido:", resultado);
    console.log("Primer contrato:", resultado[0]);

    if (!resultado || resultado.length === 0) {
      return res.status(404).send("Contrato no encontrado");
    }

    const listaPropietarios = await propietarios.obtenerTodosLosPropietarios();
    const listaPropiedades = await propiedades.obtenerPropiedadOrdenados();
    const listaInquilinos = await inquilinos.obtenerTodosLosInquilinos()

    res.render("editarContratos", {
      contrato: resultado[0],
      propietarios: listaPropietarios,
      propiedades: listaPropiedades,
      inquilinos: listaInquilinos
    });
  } catch (err) {
    console.error("❌ Error en GET /editar/:id:", err);
    res.status(500).send("Error al buscar contratos");
  }
});



// ------------------- Recibo Inquilino ----------------------  
// Mostrar el buscador y la tabla
app.get("/recibo_alquiler/buscar", async (req, res) => {
  try {
    const inquilinolista = await inquilinos.obtenerTodosLosInquilinos();
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
    const id_propiedades = req.body.id_propiedades;

    if (!id_propiedades || id_propiedades.trim() === '') {
      return res.render("buscar_recibo_alquiler", {
        propiedades: await propiedades.obtenerPropiedadOrdenados(),
        inquilinos: await inquilinos.obtenerTodosLosInquilinos(),
        recibos: [],
        mensaje: "Debe seleccionar una propiedad antes de buscar recibos."
      });
    }

    // ✅ Si pasó la validación, ahora sí busca los recibos:
    const recibos = await recibo_contrato.obtenerRecibosPorPropiedad(id_propiedades);
    console.log("Recibos encontrados:", recibos);
    res.render("buscar_recibo_alquiler", {
      propiedades: await propiedades.obtenerPropiedadOrdenados(),
      inquilinos: await inquilinos.obtenerTodosLosInquilinos(),
      recibos
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al buscar recibos");
  }
});

app.get('/api/datos_propiedad', async (req, res) => {
  try {

    const id = req.query.id_propiedades;
    if (!id) {
      return res.status(400).json({ error: 'Falta id_propiedades' });
    }

    // 1) Cargo datos de BD
    const contrato = await recibo_contrato.obtenerContratos_Id(id);
    const impuestos = await recibo_contrato.obtenerImpuestos(id);
    const ultimo = await recibo_contrato.obtenernumeroRecibo();

    // 2) Extraigo valores (aseguro números por default)
    const apellidoinquilino = contrato[0]?.apellidoinquilino || '';
    const apellidopropietario = contrato[0]?.apellidopropietario || '';
    const cuota = Number(contrato[0]?.cuota) || 0;
    const importemensual = Number(contrato[0]?.precioactual) || 0;
    const expcomunes = Number(impuestos[0]?.exp_comunes) || 0;
    const abl = Number(impuestos[0]?.abl) || 0;
    const aysa = Number(impuestos[0]?.aysa) || 0;
    const seguro = Number(impuestos[0]?.seguro) || 0;
    const varios = Number(impuestos[0]?.varios) || 0;
    const numero_recibo = (ultimo.length > 0 && ultimo[0].numrecibo != null)
      ? Number(ultimo[0].numrecibo) + 1
      : 1; // Valor inicial si no hay recibos aún

    console.log('Valor de ultimo:', ultimo);
    console.log('Tipo de ultimo:', typeof ultimo);

    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const hoy = new Date();
    const fecha_actual = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;

    // 4) Total = suma de todos los importes numéricos
    const total = importemensual
      + expcomunes
      + abl
      + aysa
      + seguro
      + varios;

    // 5) Devuelvo JSON limpio
    return res.json({
      numero_recibo,
      apellidoinquilino,
      apellidopropietario,
      cuota,
      importemensual,
      expcomunes,
      abl,
      aysa,
      seguro,
      varios,
      total,
      fecha_actual
    });
  }
  catch (err) {
    console.error('Error en /api/datos_propiedad:', err);
    return res.status(500).json({ error: 'Error al obtener datos de la propiedad' });
  }
});

app.get("/recibo_inquilino", async (req, res) => {
  try {
    const listaDePropiedades = await propiedades.obtenerPropiedadOrdenados(); // <-- trae todas las propiedades

    const numero = await recibo_contrato.obtenernumeroRecibo();
    const numero_recibo = (numero[0]?.numero_recibo || 0) + 1;

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
      apellidoinquilino: "",
      apellidopropietario: "",
      fecha_actual: fechaFormateada,
      cuota: "",
      importemensual: "",
      exp_comunes: "",
      abl: "",
      aysa: "",
      seguro: "",
      varios: "",
      total: 0
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
    const impuestosLista = await recibo_contrato.obtenerImpuestos(id_propiedades);
    const numero = await recibo_contrato.obtenernumeroRecibo();
    const numero_recibo = (numero[0]?.numero_recibo || 0) + 1;

    const apellidoinquilino = Array.isArray(contrato) && contrato.length > 0
      ? (contrato[0].apellidoinquilino)
      : "";
    const apellidopropietario = Array.isArray(contrato) && contrato.length > 0
      ? (contrato[0].apellidopropietario)
      : "";
    const cuota = Array.isArray(contrato) && contrato.length > 0
      ? (contrato[0].cuota)
      : "";
    const importemensual = Array.isArray(contrato) && contrato.length > 0
      ? (contrato[0].importemensual)
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
    const varios = Array.isArray(impuestosLista) && impuestosLista.length > 0
      ? (impuestosLista[0].varios)
      : "";

    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const hoy = new Date();
    const fechaFormateada = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;


    res.render("recibo_inquilino", {
      propiedades: listaDePropiedades,
      numero_recibo: numero_recibo,
      id_propiedad_seleccionada: id_propiedades,
      apellidoinquilino,
      apellidopropietario,
      cuota,
      fecha_actual: fechaFormateada,
      fecha_inicio: fecha_inicial,
      importemensual: importemensual,
      exp_comunes: exp_comunes,
      abl: abl,
      aysa: aysa,
      seguro: seguro,
      varios: varios,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar recibo de inquilino");
  }
});

app.post("/recibo_inquilino/insertar", async (req, res) => {
  try {
    // 1) Desestructuramos con valores por defecto
    let {
      numrecibo = "0",
      cuota = "0",
      fecha = "",
      apellidoinquilino = "",
      id_propiedad,
      apellidopropietario = "",
      importemensual = "0",
      abl = "0",
      aysa = "0",
      expcomunes = "0",
      seguro = "0",
      varios = "0"
    } = req.body;

    // 2) Función para convertir strings a números seguros
    const toNumber = v => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    const ultimo = await recibo_contrato.obtenernumeroRecibo();
    numrecibo = (ultimo.length > 0 && ultimo[0].numrecibo != null)
      ? Number(ultimo[0].numrecibo) + 1
      : 1;
    // 4) Convierto todos a números
    numrecibo = toNumber(numrecibo);
    cuota = toNumber(cuota);
    importemensual = toNumber(importemensual);
    abl = toNumber(abl);
    aysa = toNumber(aysa);
    expcomunes = toNumber(expcomunes);
    seguro = toNumber(seguro);
    varios = toNumber(varios);

    // 5) Calculo el total
    const total = importemensual
      + abl
      + aysa
      + expcomunes
      + seguro
      + varios;

    // 6) Preparo la fecha en formato YYYY-MM-DD para la BD
    const fechaPg = new Date().toISOString().slice(0, 10);

    // 7) Llamo al método de inserción
    const resultado = await recibo_contrato.insertarRecibosInquilinos(
      fechaPg,               // fecha (DATE)
      id_propiedad,          // FK
      apellidopropietario,   // id_propietario o string
      apellidoinquilino,     // id_inquilino o string
      numrecibo,        // numrecibo
      cuota,                 // cuota
      importemensual,        // importemensual
      abl,                   // abl
      aysa,                  // aysa
      expcomunes,            // expcomunes
      seguro,                // seguro
      varios,                // varios
      total                  // total
    );


    if (resultado && resultado.rowCount > 0) {
      return res.redirect(`/recibo_inq_impreso/${numrecibo}`); // ⬅ redirige directamente


    } else {
      res.status(400).send("No se insertó el recibo.");
    }

  } catch (err) {
    console.error("Error al insertar recibo_inquilino:", err);
    res.status(500).send("Error interno al insertar recibo_inquilino");
  }
});
// -------------------  recibo impreso inquilino ----------------------

app.get("/recibo_inq_impreso/:numero_recibo", async (req, res) => {
  try {
    const numero_recibo = req.params.numero_recibo;;
    const resultado = await recibo_contrato.obtenerRecibosPorNumrecibo(numero_recibo);
    console.log("Número de resultado:", resultado);
    if (!resultado || resultado.length === 0) {
      console.warn(`No se encontró recibo con numrecibo = ${numero_recibo}`);
      return res.status(404).send("Recibo no encontrado");
    }
    const prop = await propiedades.obtenerPropiedadesPorId(resultado[0].id_propiedad);
    const total = Number(resultado[0].total);

    const fechaContrato = new Date(resultado[0].fecha);
    const mes_contrato = fechaContrato.toLocaleDateString('es-AR', { month: 'long' }).toUpperCase();

    function ultimoDiaDelMes(fecha) {
      const año = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      return new Date(año, mes, 0).getDate();
    }
    const fechaActual = new Date(resultado[0].fecha);

    const vencimiento = ultimoDiaDelMes(fechaActual);
    console.log("Fecha de vencimiento:", vencimiento);
    console.log("fechaActual:", fechaActual);

    if (isNaN(total)) throw new TypeError("El total del recibo no es un número válido");
    const letra = funcion_letras.numeroALetras(total);

    console.log("Resultado obtenido:", resultado);
    console.log("Propiedades obtenidas:", prop);

    if (!resultado || resultado.length === 0) {
      return res.status(404).send("Recibo no encontrado");
    }
    res.render("recibo_inq_impreso", {
      ocultarNavbar: true,
      recibo: resultado[0],
      propiedades: prop,
      letra: letra,
      mes_contrato,
      vencimiento,
      fechaActual: new Date(resultado[0].fecha).toLocaleDateString("es-AR", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),

    });
  } catch (err) {
    console.error("Error al generar el recibo:", err);
    res.status(500).send("Error interno al generar el recibo");
  }
});
// ------------------- recibo propietario ----------------------

app.post("/recibo_propietario", async (req, res) => {
  try {
    const { id_propiedades } = req.body;

    // Validación básica
    if (!id_propiedades) {
      return res.status(400).send("ID de propiedad no proporcionado");
    }

    // Obtener datos necesarios
    const [
      listaDePropiedades,
      contratos,
      impuestos,
      datosContrato
    ] = await Promise.all([
      propiedades.obtenerPropiedadOrdenados(),
      contratos.obtenerContratoPorId(id_propiedades),
      impuestos.obtenerImpuestosPorDireccion(id_propiedades),
      recibo_prop.obtenerContratos_Id(id_propiedades)
    ]);

    // Extraer datos con fallback
    const contrato = datosContrato?.[0] || {};
    const impuesto = impuestos?.[0] || {};
    const honorarios = contratos?.[0]?.honorarios || "";
    
    // Fecha formateada
    const hoy = new Date();
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const fechaFormateada = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;

    // Renderizar vista
    res.render("recibo_propietario", {
      propiedades: listaDePropiedades,
      numero_recibo: contrato.numero_recibo || "",
      id_propiedad_seleccionada: id_propiedades,
      apellidopropietario: contrato.apellidopropietario || "",
      cuota: contrato.cuota || "",
      fecha_actual: fechaFormateada,
      fecha1: contrato.fecha_inicial || "",
      importemensual: contrato.importemensual || "",
      exp_extraor: impuesto.exp_extraor || "",
      seguro: impuesto.seguro || "",
      varios: impuesto.varios || "",
      honorarios,
      mensaje
    });

  } catch (err) {
    console.error("Error al cargar recibo de propietario:", err);
    res.status(500).send("Error interno al cargar el recibo");
  }
});



app.get('/api/datos_propiedad/propietario', async (req, res) => {

  try {
    // 1) Leer query param
    const id = req.query.id_propiedades;
    console.log("ID recibido:", id);
    if (!id) {
      return res.status(400).json({ error: "Falta id_propiedades" });
    }

    // 2) Consultas paralelas
   const [contrato, propietario] = await Promise.all([
            // devuelve datos del inquilino
   recibo_prop.obtenerContratos_Id(id),
  recibo_prop.obtenerPropietario_Id(id)
        // devuelve datos del propietario
]);

    console.log("Contrato obtenido:", contrato);
    
  
    console.log("Propietario obtenido:", propietario);

    // 3) Calcular nuevo número de recibo

    const apellidoPropietario = propietario?.[0]?.apellido || ""; // 3) Extraigo el apellido del propietario
    const cuota = Number(contrato?.[0]?.cuota) || 0; // 3) Extraigo la cuota del contrato
    const numrecibo = Number(contrato?.[0]?.numrecibo) || 0;// 4) Parseo seguro de valores
    const num = v => Number(v) || 0;
    const importemensual = num(contrato?.[0]?.importemensual);
    const exp_extraor = num(contrato?.[0]?.exp_ext);
    const seguro = num(contrato?.[0]?.seguro);
    const varios = num(contrato?.[0]?.varios);
    const honorarios = num(contrato?.[0]?.honorarios);
    const fecha1 = (contrato?.[0]?.fecha || ""); //Extraigo la fecha del contrato
    console.log(fecha1);
    // 5) Fecha formateada
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const hoy = new Date();
    const fecha_actual = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;
    const honorario1 = importemensual * honorarios / 100;
    // 6) Total
    const total = importemensual
      - exp_extraor
      + seguro
      + varios
      - honorario1;

    // 7) Respuesta JSON
    return res.json({
      numero_recibo: numrecibo,
      apellidopropietario: apellidoPropietario,
      cuota,
      importemensual,
      exp_extraor: exp_extraor || 0,
      seguro: seguro || 0,
      varios: varios || 0,
      honorarios: honorario1 || 0,
      total: Number.isFinite(total) ? total : 0,
      fecha_actual: fecha_actual || "",
      fecha1: fecha1 || null,
      fecha_rec: fecha1 || null
    });

  }
  catch (err) {
    console.error("Error en /api/datos_propiedad/propietario:", err);
    return res.status(500).json({ error: "Error al obtener datos de la propiedad" });
  }
});

app.get("/recibo_propietario", async (req, res) => {
  try {
    const listaDePropiedades = await propiedades.obtenerPropiedadOrdenados();
    const hoy = new Date();
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const fecha_actual = `${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`;

    res.render("recibo_propietario", {
      propiedades: listaDePropiedades,
      numero_recibo: "",
      id_propiedad_seleccionada: "",
      apellidopropietario: "",
      cuota: "",
      fecha_actual,
      fecha1: "",
      importemensual: "",
      exp_extraor: "",
      seguro: "",
      varios: "",
      honorarios: ""
    });
  } catch (err) {
    console.error("Error al servir GET /recibo_propietario:", err);
    res.status(500).send("Error al cargar el formulario");
  }
});

app.post("/recibo_propietario/insertar", async (req, res) => {
  try {
    // 1) Desestructuramos con valores por defecto
    let {
      numrecibo = "0",
      cuota = "0",
      fecha = "",
      fecha1 = "",
      id_propiedad,
      apellidopropietario = "",
     apellidoinquilino = "",
      importemensual = "0",
      exp_extraor = "0",
      seguro = "0",
      varios = "0",
      honorarios = "0",
      total = "0"
    } = req.body;
    console.log("Datos recibidos:", req.body);
    // 2) Función para convertir strings a números seguros
    const toNumber = v => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };
    const fecha_rec = (!fecha1 || fecha1 === "null" || fecha1.trim() === "") ? null : fecha1;


    // 3) Convierto todos a números
    numrecibo = toNumber(numrecibo);
    cuota = toNumber(cuota);
    importemensual = toNumber(importemensual);
    exp_extraor = toNumber(exp_extraor);
    seguro = toNumber(seguro);
    varios = toNumber(varios);
    honorarios = toNumber(honorarios);
    total = toNumber(total);

    // 4) Preparo la fecha en formato YYYY-MM-DD para la BD
    const fechaPg = new Date().toISOString().slice(0, 10);
    fecha = fechaPg;
     const { rows } = await database.query("SELECT MAX(numrecibo) AS ultimo FROM recibo_propietario");
     const ultimoNumRecibo = rows[0].ultimo || 0;
     numrecibo = ultimoNumRecibo + 1;
     console.log("datos de insertar:", recibo_prop);
    // 5) Llamo al método de inserción pasando un OBJETO
    
    
    const resultado = await recibo_prop.insertarReciboPropietario_Id ({
      fecha,
      id_propiedad,
      apellidopropietario,
      apellidoinquilino,
      numrecibo,
      cuota,
      importemensual,
      seguro,
      varios,
      total,
      exp_extraor,
      honorarios,
      fecha_rec
    });
    
    // 6) Resultado de la inserción
    if (resultado && resultado.rowCount > 0) {
  return res.json({
    exito: true,
    mensaje: "Recibo cargado exitosamente",
    redireccion: `/recibo_prop_impreso/${numrecibo}`
  });
} else {
  res.json({ exito: false, mensaje: "No se pudo insertar el recibo" });
}


  } catch (err) {
    console.error("Error al insertar recibo_propietario:", err);
    res.status(500).send("Error interno al insertar recibo_propietario");
  }
});

app.get("/recibo_prop_impreso/:numrecibo", async (req, res) => {
  try {
    const numrecibo = req.params.numrecibo;
  console.log("Contenido de recibo_contrato:", recibo_prop);  
    const resultado = await recibo_prop.recibosPropietarios(numrecibo);


    if (!Array.isArray(resultado) || resultado.length === 0) {
      console.warn(`No se encontró recibo con numrecibo = ${numrecibo}`);
      return res.status(404).send("Recibo no encontrado");
    }
   let reciboProp = resultado[0];
    
  
    const datosPropiedades = await propiedades.obtenerPropiedadesPorId(reciboProp.id_propiedad);
    
      
   // Parseador seguro
const parseNumber = val => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};


// 📅 Fechas
const fechaContrato = new Date(reciboProp.fecha);
// const fechaActual = new Date();
const fechaActual = fechaContrato.toLocaleDateString("es-AR", {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const mes_contrato = fechaContrato.toLocaleDateString("es-AR", { month: 'long' }).toUpperCase();
const ultimoDiaDelMes = fecha => new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
const vencimiento = ultimoDiaDelMes(fechaContrato);

// 🧾 Estructura consolidada para la vista
reciboProp = {
  id: resultado[0].id_recibopropietarios,
  fecha: resultado[0].fecha,
  numrecibo: resultado[0].numrecibo,
  importemensual: parseNumber(resultado[0].importemensual),
  seguro: parseNumber(resultado[0].seguro),
  varios: parseNumber(resultado[0].varios),
  honorarios: parseNumber(resultado[0].honorarios),
  exp_extraor: parseNumber(resultado[0].exp_extraor),
  total: parseNumber(resultado[0].total),
  apellidopropietario: resultado[0].apellidopropietario,
  apellidoinquilino: resultado[0].apellidoinquilino,
  cuota: resultado[0].cuota,
 };
 const letra = funcion_letras.numeroALetras(reciboProp.total);

res.render("recibo_prop_impreso", {
  ocultarNavbar: true,
  reciboProp,
  propiedades: datosPropiedades,
  letra,
  mes_contrato,
  vencimiento,
  fechaActual
  });



  } catch (err) {
    console.error("Error al generar el recibo:", err);
    res.status(500).send("Error interno al generar el recibo");
  }
});

app.post("/buscar_recProp", async (req, res) =>  {
  try {
    const id_propiedades = req.body.id_propiedades;

    if (!id_propiedades || id_propiedades.trim() === '') {
      return res.render("buscar_recibo_alquiler", {
        propiedades: await propiedades.obtenerPropiedadOrdenados(),
        inquilinos: await inquilinos.obtenerTodosLosInquilinos(),
        recibos: [],
        mensaje: "Debe seleccionar una propiedad antes de buscar recibos."
      });
    }

    // ✅ Si pasó la validación, ahora sí busca los recibos:
    const recibos = await recibo_prop.rePropietarios(id_propiedades);
    console.log("Recibos encontrados:", recibos);
    res.render("buscar_recProp", {
      propiedades: await propiedades.obtenerPropiedadOrdenados(),
      inquilinos: await inquilinos.obtenerTodosLosInquilinos(),
      recibos
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al buscar recibos");
  }
});

app.get("/buscar_recProp", async (req, res) => {
  res.render("buscar_recProp", {
    propiedades: await propiedades.obtenerPropiedadOrdenados(),
    inquilinos: await inquilinos.obtenerTodosLosInquilinos(),
    recibos: []
  });
});





// ------------------  login ----------------------
















