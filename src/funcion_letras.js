function numeroALetras(num) {
  num = Number(num);
  if (isNaN(num)) {
    throw new TypeError("El valor recibido no es un número válido");
  }

  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const especiales = {
    10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    20: 'VEINTE', 21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS',
    24: 'VEINTICUATRO', 25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE',
    28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
  };

  function convertirGrupo(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const dosDigitos = n % 100;

    let texto = '';
    if (c > 0) texto += centenas[c] + ' ';

    if (dosDigitos <= 29 && dosDigitos >= 10) {
      texto += especiales[dosDigitos];
    } else {
      if (d > 0) texto += decenas[d];
      if (d > 0 && u > 0) texto += ' Y ';
      if (d !== 1) texto += unidades[u];
    }

    return texto.trim();
  }

  function seccion(num, divisor, singular, plural) {
    const cientos = Math.floor(num / divisor);
    if (cientos === 0) return '';
    if (cientos === 1) return singular;
    return `${numeroALetras(cientos)} ${plural}`;
  }

  function milesMillones(n) {
    let letras = '';
    letras += seccion(n, 1000000, 'UN MILLÓN', 'MILLONES');
    letras += letras ? ' ' : '';
    letras += seccion(n % 1000000, 1000, 'MIL', 'MIL');
    letras += letras ? ' ' : '';
    letras += convertirGrupo(n % 1000);
    return letras.trim();
  }

  const partes = num.toFixed(2).split('.');
  const entero = parseInt(partes[0]);
  return milesMillones(entero);
}

module.exports = { numeroALetras };
