const { Pool } = require('pg');


const pool = new Pool({
    host: 'TAuI9t1Gw4sXuiTGj3UHQDM6lx7RDkeP@dpg-d10a6r2li9vc73dkq9t0-a.oregon-postgres.render.com',
    user: 'alquileres_1kec_user',
    password: 'TAuI9t1Gw4sXuiTGj3UHQDM6lx7RDkeP',
    database: 'alquilers_1Kec',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function conectar() {
   try {
    const conn = await pool.connect();
    console.log("Conexión exitosa!");
    return conn;
  } catch (err) {
    console.error("Error de conexión:", err);
    throw err;
  }
}


async function conectar() {
   try {
    const conn = await pool.connect();
    await conn.query("SET NAMES utf8mb4"); // <-- Fuerza el charset en cada conexión
    console.log("Conexión exitosa!");
    return conn;
  } catch (err) {
    console.error("Error de conexión:", err);
    throw err;
  }
}

module.exports= {conectar};



