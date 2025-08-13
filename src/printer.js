// src/printer.js
import { print: printPDF, getPrinters } from "pdf-to-printer";

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
