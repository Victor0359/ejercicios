const  {pool}  = require('pg');


const pool = new pg.createPool({
    host: 'dpg-d10a6r2li9vc73dkq9t0-a.oregon-postgres.render.com', // IP de la base de datos
    user: 'alquileres_1kec_user', // Usuario de la base de datos           
    password: 'TAuI9t1Gw4sXuiTGj3UHQDM6lx7RDkeP', // Contraseña de la base de datos
    database: 'alquilers_1Kec',
    charset: 'utf8mb4', // Nombre de la base de datos
    port:5432,
    ssl: { rejectUnauthorized: false } 

});

async function conectar() {
   try {
    const conn = await pool.getConnection();
    await conn.query("SET NAMES utf8mb4"); // <-- Fuerza el charset en cada conexión
    console.log("Conexión exitosa!");
    return conn;
  } catch (err) {
    console.error("Error de conexión:", err);
    throw err;
  }
}

module.exports= {conectar};



