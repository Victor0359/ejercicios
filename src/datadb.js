// const { Pool } = require('pg');
// require('dotenv').config();

// // Configuración optimizada para Render
// const pool = new Pool({
//   connectionString: `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
//   ssl: { 
//     rejectUnauthorized: false 
//   }
// });
// pool.on('error', (err) => {
//   console.error('Error de conexión OCULTO:', err);
// });

// // Test de conexión automático (opcional)
// pool.connect()
//   .then(client => {
//     console.log('✅ Conexión exitosa a PostgreSQL');
//     client.release();
//   })
//   .catch(err => console.error('❌ Error de conexión:', err));

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false,
    sslmode: 'require' // ¡Clave para Render!
  },
  idleTimeoutMillis: 30000
});

// Función de prueba infalible
const testAPIIsWriting = async () => {
  const client = await pool.connect();
  try {
    // 1. Transacción explícita
    await client.query('BEGIN');
    
    // 2. Insert con marca única
    const uniqueMark = `API_${Date.now()}`;
    const res = await client.query(
      `INSERT INTO test_permissions (test_value) 
       VALUES ($1) 
       RETURNING *`,
      [uniqueMark]
    );
    
    await client.query('COMMIT');
    console.log('✅ Insert desde API:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error REAL:', err.stack);
    throw err;
  } finally {
    client.release(); // ¡Liberar siempre!
  }
};

// Llama esta función en tu endpoint


module.exports = pool;