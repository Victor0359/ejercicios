const database = require('./datadb');

(async () => {
  try {
    const conn = await database.conectar();
    const resultado = await conn.query("SELECT 1");
    console.log("Conexión exitosa y prueba de consulta:", resultado);
    conn.end();
  } catch (err) {
    console.error("Error al probar la conexión:", err);
  }
})();