const { Pool } = require('pg');

// Conexión para Render.com (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obligatorio en Render
  }
});

// Función de prueba de conexión
async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa. Hora DB:', res.rows[0].now);
    return true;
  } finally {
    client.release(); // Liberar el cliente
  }
}

// Ejecutar prueba al iniciar
testConnection().catch(err => {
  console.error('❌ Error DE CONEXIÓN REAL:', err);
  process.exit(1); // Mata el proceso si falla (opcional)
});

module.exports = pool;