// src/printer.js
const { print: printPDF, getPrinters } = require("pdf-to-printer");

function print(filePath, options = {}) {
  return printPDF(filePath, {
    printer: options.printer,
    win32: ["-print-settings", "fit"],
    ...options,
  });
}

module.exports = {
  print,
  getPrinters,
};
