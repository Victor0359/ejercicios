const { Pool } = require('pg');
require('dotenv').config(); // Corregido typo y añadido config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { // Corregida sintaxis del SSL
    rejectUnauthorized: false
  }
});

// Verificación de conexión mejorada
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log("✅ Conexión exitosa. Hora actual de la DB:", result.rows[0].now);
    return true;
  } catch (err) {
    console.error("❌ Error de conexión:", err);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Función de conexión para usar en la app
async function conectar() {
  try {
    const client = await pool.connect();
    await client.query("SET timezone = 'UTC';"); // Mejor que SET NAMES para PostgreSQL
    return client;
  } catch (err) {
    console.error("Error al obtener cliente:", err);
    throw err;
  }
}

// Testear la conexión al iniciar
testConnection();

module.exports = { conectar, pool }; // Exportamos pool por si necesitas queries directas



