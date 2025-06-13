const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1')
  .then(() => console.log('✅ Conexión exitosa'))
  .catch(err => console.error('❌ Error:', err));

  pool.query('SELECT * FROM propietarios LIMIT 1')
  .then(res => console.log("✅ Datos obtenidos:", res.rows))
  .catch(err => console.error("❌ Error en consulta:", err));


//Configuración optimizada para Render
// const pool = new Pool({
//   connectionString: `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
//   ssl: { 
//     rejectUnauthorized: false 
//   }
    
// });

console.log("DATABASE_URL generada:", `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

console.log("DB_HOST:", process.env.DB_HOST); // prueba para verificar que se está leyendo correctamente
pool.on('error', (err) => {
  console.error('Error de conexión OCULTO:', err);
});

// Test de conexión automático (opcional)
pool.connect()
  .then(client => {
    console.log('✅ Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch(err => console.error('❌ Error de conexión:', err));




module.exports = pool;