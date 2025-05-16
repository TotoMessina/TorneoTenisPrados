const SHEET_ID = '1UzyKDX_lz95cFmAOAF-3y-ROvMeXAO-0yu9nwPZWYh8';
const API_KEY = 'AIzaSyCf45-R56xzps4fwSqBnpc8u0Edv4vpFYU';
const HOJA_EQUIPOS = 'Equipos';
const HOJA_FIXTURE = 'Fixture';

let torneoData = {
  equipos: [],
  fixture: []
};

// ===== TEMA OSCURO/CLARO =====
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;
const iconMoon = toggleThemeBtn.querySelector('.fa-moon');
const iconSun = toggleThemeBtn.querySelector('.fa-sun');

// Función para actualizar el ícono del tema
function updateThemeIcon(theme) {
  if (theme === 'dark') {
    iconMoon.style.display = 'none';
    iconSun.style.display = 'inline-block';
  } else {
    iconMoon.style.display = 'inline-block';
    iconSun.style.display = 'none';
  }
}

// Cargar tema guardado o usar preferencia del sistema
const savedTheme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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

// ===== CARGA DE DATOS =====
async function cargarDatosDesdeSheets() {
  try {
    // Cargar equipos
    const equiposUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${HOJA_EQUIPOS}?key=${API_KEY}`;
    const equiposResponse = await fetch(equiposUrl);
    const equiposData = await equiposResponse.json();
    
    torneoData.equipos = equiposData.values.slice(1).map(row => ({
      id: row[0],
      nombre: row[1],
      puntos: row[2],
      pj: row[3],
      pg: row[4],
      pe: row[5],
      pp: row[6],
      gf: row[7],
      gc: row[8]
    }));

    // Cargar fixture
    const fixtureUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${HOJA_FIXTURE}?key=${API_KEY}`;
    const fixtureResponse = await fetch(fixtureUrl);
    const fixtureData = await fixtureResponse.json();
    
    const partidosPorFecha = {};
    fixtureData.values.slice(1).forEach(row => {
      const fecha = row[0];
      if (!partidosPorFecha[fecha]) {
        partidosPorFecha[fecha] = [];
      }
      
      partidosPorFecha[fecha].push({
        local: row[1],
        visitante: row[2],
        golesLocal: row[3] || null,
        golesVisitante: row[4] || null
      });
    });
    
    torneoData.fixture = Object.entries(partidosPorFecha).map(([fecha, partidos]) => ({
      fecha: fecha,
      partidos: partidos
    }));

    mostrarDatos();
  } catch (error) {
    console.error('Error al cargar datos:', error);
    alert('Error al cargar datos. Por favor recarga la página.');
  }
}

// ===== MOSTRAR DATOS =====
function mostrarDatos() {
  // Mostrar tabla de posiciones
  const equiposOrdenados = [...torneoData.equipos].sort((a, b) => b.puntos - a.puntos);
  document.getElementById('cuerpo-tabla').innerHTML = equiposOrdenados.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.nombre}</td>
      <td>${e.puntos}</td>
      <td>${e.pj}</td>
      <td>${e.pg}</td>
      <td>${e.pe}</td>
      <td>${e.pp}</td>
      <td>${e.gf}</td>
      <td>${e.gc}</td>
      <td>${e.gf - e.gc}</td>
    </tr>
  `).join('');

  // Mostrar selector de fechas
  const selectorFecha = document.getElementById('fecha');
  selectorFecha.innerHTML = torneoData.fixture.map((f, i) => 
    `<option value="${i}">Fecha ${f.fecha}</option>`
  ).join('');

  cargarFecha();
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

function getNombreEquipo(id) {
  const equipo = torneoData.equipos.find(e => e.id == id);
  return equipo ? equipo.nombre : `Equipo ${id}`;
}

// ===== INICIAR APLICACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  // Primero cargar el tema
  const savedTheme = localStorage.getItem('theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Luego cargar los datos
  cargarDatosDesdeSheets();
});