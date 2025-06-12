const { Pool } = require('pg');
require('dotenv').config();

// Configuración optimizada para Render
const pool = new Pool({
  connectionString: `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: { 
    rejectUnauthorized: false 
  }
});

// Test de conexión automático (opcional)
pool.connect()
  .then(client => {
    console.log('✅ Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch(err => console.error('❌ Error de conexión:', err));

module.exports = pool;