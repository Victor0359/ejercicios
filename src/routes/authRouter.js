// routes/authRouter.js
import express from "express";
const router = express.Router();
import bcrypt from "bcrypt";

// Ruta raíz, se encarga de la lógica de autenticación

function verificarSesion(req, res, next) {
  console.log(
    "Middleware verificarSesion - usuarioId:",
    req.session?.usuarioId
  );
  console.log("Session completa:", req.session);

  if (!req.session?.usuarioId) {
    console.log("No hay sesión válida, redirigiendo a /login");
    return res.redirect("/login");
  }
  next();
}

router.get("/", (req, res) => {
  console.log("Accediendo a ruta / - usuarioId:", req.session.usuarioId);
  if (req.session.usuarioId) {
    console.log("Usuario tiene sesión, redirigiendo a /inicio");
    return res.redirect("/inicio");
  }
  console.log("Redirigiendo a login");
  res.redirect("/login");
});
router.get("/login", (req, res) => {
  if (req.session.usuarioId) {
    return res.redirect("/inicio");
  }
  res.render("login", {
    mostrarNavbar: false,
    error: null,
  });
});

// Ruta de login (POST)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Intento de login con email:", email); // Debug

  try {
    const resultado = await database.query(
      "SELECT * FROM login WHERE email = $1",
      [email]
    );

    if (resultado.rows.length === 0) {
      console.log("Usuario no encontrado para email:", email);
      return res.render("login", {
        error: "Usuario no encontrado",
        mostrarNavbar: false,
      });
    }

    const usuario = resultado.rows[0];
    console.log("Usuario encontrado:", usuario); // Debug

    // Comparación de contraseñas
    const match = await bcrypt.compare(password, usuario.password);
    console.log("Resultado comparación contraseña:", match); // Debug

    if (!match) {
      console.log("Contraseña incorrecta para usuario:", usuario.email);
      return res.render("login", {
        error: "Contraseña incorrecta",
        mostrarNavbar: false,
      });
    }

    // Establecer sesión
    req.session.usuarioId = usuario.id_login;
    req.session.email = usuario.email;
    console.log("Sesión establecida para:", usuario.email); // Debug

    // Guardar sesión antes de redirigir
    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        return res.render("login", {
          error: "Error al iniciar sesión",
          mostrarNavbar: false,
        });
      }

      // Asegurar que la cookie se envía correctamente
      res.setHeader(
        "Set-Cookie",
        `connect.sid=${req.sessionID}; Path=/; HttpOnly; SameSite=Lax`
      );
      console.log("Redirigiendo a /inicio con sesión:", req.session);
      return res.redirect("/inicio");
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.render("login", {
      error: "Error del servidor",
      mostrarNavbar: false,
    });
  }
});
// Ruta de inicio
router.get("/inicio", verificarSesion, (req, res) => {
  res.render("inicio", {
    email: req.session.email,
    mostrarNavbar: true,
  });
});

// Ruta de logout
router.get("/logout", (req, res) => {
  console.log("Ejecutando logout");
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al destruir sesión:", err);
      return res.redirect("/inicio");
    }
    res.clearCookie("connect.sid");
    console.log("Sesión destruida, redirigiendo a /login");
    res.redirect("/login");
  });
});

// Ruta para debug de sesión
router.get("/debug-session", (req, res) => {
  res.send(`<pre>${JSON.stringify(req.session, null, 2)}</pre>`);
});

// Ruta de prueba API
router.post("/api-test", async (req, res) => {
  try {
    const result = await testAPIIsWriting();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      hint: "Verifica COMMIT y SSL",
    });
  }
});
// Prueba esto en tu código temporalmente para verificar el hash
const testHash = async () => {
  const hash = await bcrypt.hash("tucontraseña", 10);
  console.log("Hash generado:", hash);

  const match = await bcrypt.compare("tucontraseña", hash);
  console.log("¿Coincide?", match);
};
testHash();

export default router;
