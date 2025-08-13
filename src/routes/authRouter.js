// routes/authRouter.js
import express from "express";
import bcrypt from "bcrypt";
import datadb from "../datadb.js";

const router = express.Router();

// Middleware para verificar sesión
function verificarSesion(req, res, next) {
  console.log(
    "Middleware verificarSesion - usuarioId:",
    req.session?.usuarioId
  );
  if (!req.session?.usuarioId) {
    console.log("No hay sesión válida, redirigiendo a /login");
    return res.redirect("/login");
  }
  next();
}

// Ruta raíz
router.get("/", (req, res) => {
  if (req.session.usuarioId) {
    return res.redirect("/inicio");
  }
  res.redirect("/login");
});

// Vista de login
router.get("/login", (req, res) => {
  if (req.session.usuarioId) {
    return res.redirect("/inicio");
  }
  res.render("login", {
    mostrarNavbar: false,
    error: null,
  });
});

// Login POST
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Intento de login con email:", email);

  try {
    const resultado = await datadb.query(
      "SELECT * FROM login WHERE email = $1",
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.render("login", {
        error: "Usuario no encontrado",
        mostrarNavbar: false,
      });
    }

    const usuario = resultado.rows[0];
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.render("login", {
        error: "Contraseña incorrecta",
        mostrarNavbar: false,
      });
    }

    req.session.usuarioId = usuario.id_login;
    req.session.email = usuario.email;

    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        return res.render("login", {
          error: "Error al iniciar sesión",
          mostrarNavbar: false,
        });
      }

      res.setHeader(
        "Set-Cookie",
        `connect.sid=${req.sessionID}; Path=/; HttpOnly; SameSite=Lax`
      );
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

// Vista de inicio
router.get("/inicio", verificarSesion, (req, res) => {
  res.render("inicio", {
    email: req.session.email,
    mostrarNavbar: true,
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al destruir sesión:", err);
      return res.redirect("/inicio");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// Debug de sesión
router.get("/debug-session", (req, res) => {
  res.send(`<pre>${JSON.stringify(req.session, null, 2)}</pre>`);
});

// Ruta de prueba API
router.post("/api-test", async (req, res) => {
  try {
    const result = await testAPIIsWriting(); // Asegurate de definir esta función
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      hint: "Verifica COMMIT y SSL",
    });
  }
});

export default router;
