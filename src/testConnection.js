const database = require('./datadb');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

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