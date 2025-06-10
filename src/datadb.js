const { Pool } = require('pg');
const dontenv = require('dotenv');


const pool = new Pool({ connectionString: process.env.DATABASE_URL}, 
   
    ssl= { rejectUnauthorized: false }
);


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



