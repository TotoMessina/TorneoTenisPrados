let torneoData = {};

// Cargar datos del JSON
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    torneoData = data;
    init();
  });

function init() {
  // Generar selector de fechas
  const selectorFecha = document.getElementById('fecha');
  selectorFecha.innerHTML = torneoData.fixture.map((f, i) => 
    `<option value="${i}">Fecha ${f.fecha}</option>`
  ).join('');

  cargarFecha();
  actualizarTabla();
}

function cargarFecha() {
  const fechaIndex = document.getElementById('fecha').value;
  const fecha = torneoData.fixture[fechaIndex];
  const partidosDiv = document.getElementById('partidos-fecha');

  partidosDiv.innerHTML = `
    <h1>Fecha ${fecha.fecha}</h1>
    <table class="partidos">
      ${fecha.partidos.map(partido => `
        <tr>
          <td>${getNombreEquipo(partido.local)}</td>

          <td>vs</td>

          <td>${getNombreEquipo(partido.visitante)}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function actualizarResultado(fechaIndex, equipoA, equipoB, goles, tipo) {
  const partido = torneoData.fixture[fechaIndex].partidos.find(p => 
    (p.local === equipoA && p.visitante === equipoB) || 
    (p.local === equipoB && p.visitante === equipoA)
  );

  if (tipo === 'local') {
    partido.golesLocal = goles ? parseInt(goles) : null;
  } else {
    partido.golesVisitante = goles ? parseInt(goles) : null;
  }

  // Aquí podrías guardar los cambios en un backend o localStorage
  console.log("Datos actualizados (simulación):", torneoData);
  actualizarTabla();
}

function actualizarTabla() {
  // Reiniciar estadísticas
  torneoData.equipos.forEach(e => {
    e.pj = e.pg = e.pe = e.pp = e.gf = e.gc = 0;
  });

  // Calcular estadísticas
  torneoData.fixture.forEach(fecha => {
    fecha.partidos.forEach(partido => {
      if (partido.golesLocal !== null && partido.golesVisitante !== null) {
        const local = torneoData.equipos.find(e => e.id === partido.local);
        const visitante = torneoData.equipos.find(e => e.id === partido.visitante);

        local.pj++;
        visitante.pj++;

        local.gf += partido.golesLocal;
        local.gc += partido.golesVisitante;
        visitante.gf += partido.golesVisitante;
        visitante.gc += partido.golesLocal;

        if (partido.golesLocal > partido.golesVisitante) {
          local.pg++;
          local.puntos += 3;
          visitante.pp++;
        } else if (partido.golesLocal < partido.golesVisitante) {
          visitante.pg++;
          visitante.puntos += 3;
          local.pp++;
        } else {
          local.pe++;
          local.puntos += 1;
          visitante.pe++;
          visitante.puntos += 1;
        }
      }
    });
  });

  // Ordenar y mostrar
  const equiposOrdenados = [...torneoData.equipos].sort((a, b) => b.puntos - a.puntos);
  document.getElementById('cuerpo-tabla').innerHTML = equiposOrdenados.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.nombre}</td>
      <td>${e.puntos}</td>
      <td>${e.pj}</td>
      <td>${e.pg}</td>
      <td>${e.pp}</td>
    </tr>
  `).join('');
}

function getNombreEquipo(id) {
  return torneoData.equipos.find(e => e.id === id)?.nombre || `Equipo ${id}`;
}

// ===== TEMA OSCURO/CLARO =====
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;
const iconMoon = toggleThemeBtn.querySelector('.fa-moon');
const iconSun = toggleThemeBtn.querySelector('.fa-sun');

// Cargar tema guardado o usar preferencia del sistema
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Cambiar tema al hacer clic
toggleThemeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

// Actualizar ícono del botón
function updateThemeIcon(theme) {
    if (theme === 'dark') {
        iconMoon.style.display = 'none';
        iconSun.style.display = 'inline-block';
    } else {
        iconMoon.style.display = 'inline-block';
        iconSun.style.display = 'none';
    }
}

// Animación al actualizar resultados
function actualizarResultado(fechaIndex, equipoA, equipoB, goles, tipo) {
    const partido = torneoData.fixture[fechaIndex].partidos.find(p => 
        (p.local === equipoA && p.visitante === equipoB) || 
        (p.local === equipoB && p.visitante === equipoA)
    );

    if (tipo === 'local') {
        partido.golesLocal = goles ? parseInt(goles) : null;
    } else {
        partido.golesVisitante = goles ? parseInt(goles) : null;
    }

    // Feedback visual
    const input = event.target;
    input.style.borderColor = '#2ecc71';
    setTimeout(() => {
        input.style.borderColor = 'var(--border-color)';
    }, 1000);

    actualizarTabla();
}