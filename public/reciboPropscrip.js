document.addEventListener("DOMContentLoaded", () => {
  // Campos con checkbox (se suman si están tildados, se ponen en cero si no)
  const camposConCheck = [
    "exp_extraor",
    "expcomunes",
    "abl",
    "aysa",
    "seguro",
    "varios",
  ];

  const campoSumaFija = "importemensual"; // siempre suma
  const campoRestaFija = "honorarios"; // siempre resta

  const todosLosCampos = [campoSumaFija, ...camposConCheck, campoRestaFija];

  const toNumber = (v) => parseFloat(v) || 0;

  function recalcularTotal() {
    let total = 0;

    // Monto mensual siempre suma
    const inputSumaFija = document.getElementById(campoSumaFija);
    total += toNumber(inputSumaFija?.value);

    // Campos con checkbox
    camposConCheck.forEach((id) => {
      const input = document.getElementById(id);
      const checkbox = document.getElementById(`check_${id}`);
      let valor = toNumber(input?.value);

      if (checkbox?.checked) {
        total += valor;
        input.classList.remove("campo-desactivado");
      } else {
        input.value = 0;
        input.classList.add("campo-desactivado");
      }
    });

    // Honorarios siempre se restan
    const inputRestaFija = document.getElementById(campoRestaFija);
    total -= toNumber(inputRestaFija?.value);

    document.getElementById("total").value = total.toFixed(2);
  }

  function actualizarCampos(data) {
    const camposFijos = [
      "numero_recibo",
      "fecha_actual",
      "fecha_rec",
      "apellidopropietario",
      "cuota",
    ];

    [...camposFijos, ...todosLosCampos].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = data[id] || "";
      else console.warn(`⚠️ Campo "${id}" no encontrado.`);
    });

    recalcularTotal();
  }

  const sel = document.getElementById("id_propiedades");
  const btn = document.getElementById("btn-generar-recibo");

  sel?.addEventListener("change", async () => {
    const id = sel.value;
    if (!id) return;
    try {
      const res = await fetch(
        `/api/datos_propiedad/propietario?id_propiedades=${id}`
      );
      const data = await res.json();
      console.log("API ➞", data);
      actualizarCampos(data);
    } catch (err) {
      console.error("Error al cargar datos de propiedad:", err);
      alert("Error al obtener los datos del propietario");
    }
  });

  // Listeners para inputs
  todosLosCampos.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", recalcularTotal);
  });

  // Listeners para checkboxes
  camposConCheck.forEach((id) => {
    document
      .getElementById(`check_${id}`)
      ?.addEventListener("change", recalcularTotal);
  });

  btn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("¿Desea insertar el recibo?")) return;

    const totalValue = toNumber(document.getElementById("total")?.value);
    if (totalValue == null || isNaN(totalValue)) {
      alert("⚠️ Verifique los campos antes de generar el recibo.");
      return;
    }

    const datos = {
      fecha: document.getElementById("fecha_actual")?.value,
      id_propiedad: document.getElementById("id_propiedades")?.value,
      apellidopropietario: document.getElementById("apellidopropietario")
        ?.value,
      apellidoinquilino: "",
      numrecibo: document.getElementById("numero_recibo")?.value,
      cuota: document.getElementById("cuota")?.value,
      fecha_rec: document.getElementById("fecha_rec")?.value,
      total: totalValue.toFixed(2),
    };

    todosLosCampos.forEach((id) => {
      const input = document.getElementById(id);
      datos[id] = input?.value;
    });

    camposConCheck.forEach((id) => {
      const checkbox = document.getElementById(`check_${id}`);
      datos[`check_${id}`] = checkbox?.checked;
    });

    try {
      const res = await fetch("/recibo_propietario/insertar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const data = await res.json();
      if (data.exito) {
        alert(data.mensaje);
        window.location.href = data.redireccion;
      } else {
        alert("⚠️ " + data.mensaje);
      }
    } catch (err) {
      console.error("Error en el insert:", err);
      alert("❌ Error al insertar el recibo");
    }
  });

  recalcularTotal(); // inicial
});
