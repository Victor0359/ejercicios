document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEditar');
  if (form) {
    form.addEventListener('submit', (e) => {
      const confirmacion = confirm("¿Está seguro que desea modificar este propietario?");
      if (!confirmacion) {
        e.preventDefault();
      }
    });
  } else {
    console.warn('Formulario no encontrado: id="formEditar"');
  }
});
