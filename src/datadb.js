//import mariadb from mariadb;
const mariadb= require('mariadb');


const pool = mariadb.createPool({
    host: 'localhost', // IP de la base de datos
    user: 'root', // Usuario de la base de datos           
    password: 'victor9530', // Contraseña de la base de datos
    database: 'alquileres',
    charset: 'utf8mb4', // Nombre de la base de datos
    connectionLimit: 5,
    port: 3306, // Puerto de la base de datos

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



