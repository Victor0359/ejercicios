const { Pool } = require('pg');
const dontenv = require('dotenv');


const pool = new Pool({ connectionString: process.env.DATABASE_URL}, 
   
    ssl= { rejectUnauthorized: false }
);


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("Error al conectar a la DB:", err);
  } else {
    console.log("Conexión exitosa. Hora actual de la DB:", res.rows[0].now);
  }
  pool.end();
});

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



