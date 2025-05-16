// Configuración de Google Sheets
const SHEET_ID = '1UzyKDX_lz95cFmAOAF-3y-ROvMeXAO-0yu9nwPZWYh8'; // Tu ID correcto
const API_KEY = 'AIzaSyCf45-R56xzps4fwSqBnpc8u0Edv4vpFYU'; // Tu API Key
const EQUIPOS_SHEET = 'Equipos';
const FIXTURE_SHEET = 'Fixture';

let torneoData = {
  equipos: [],
  fixture: []
};

// Función mejorada para cargar datos desde Google Sheets
async function cargarDatosDesdeSheets() {
  try {
    // Cargar equipos
    const equiposUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${EQUIPOS_SHEET}?key=${API_KEY}`;
    const equiposResponse = await fetch(equiposUrl);
    
    if (!equiposResponse.ok) {
      throw new Error(`Error HTTP: ${equiposResponse.status}`);
    }
    
    const equiposData = await equiposResponse.json();
    
    if (!equiposData.values) {
      throw new Error('No se encontraron datos en la hoja de equipos');
    }
    
    // Procesar equipos con validación
    torneoData.equipos = equiposData.values.slice(1) // Saltar encabezados
      .filter(row => row && row.length >= 6) // Filtrar filas válidas
      .map(row => ({
        id: parseInt(row[0]) || 0,
        nombre: row[1] || `Equipo ${row[0]}`,
        puntos: parseInt(row[2]) || 0,
        pj: parseInt(row[3]) || 0,
        pg: parseInt(row[4]) || 0,
        pp: parseInt(row[5]) || 0,
        pe: 0, // Asegurar que existe
        gf: 0, // Asegurar que existe
        gc: 0  // Asegurar que existe
      }));

    // Cargar fixture
    const fixtureUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${FIXTURE_SHEET}?key=${API_KEY}`;
    const fixtureResponse = await fetch(fixtureUrl);
    
    if (!fixtureResponse.ok) {
      throw new Error(`Error HTTP: ${fixtureResponse.status}`);
    }
    
    const fixtureData = await fixtureResponse.json();
    
    if (!fixtureData.values) {
      throw new Error('No se encontraron datos en la hoja de fixture');
    }
    
    // Procesar fixture con validación
    const partidosPorFecha = {};
    fixtureData.values.slice(1) // Saltar encabezados
      .filter(row => row && row.length >= 3) // Filtrar filas válidas
      .forEach(row => {
        const fecha = parseInt(row[0]) || 1;
        if (!partidosPorFecha[fecha]) {
          partidosPorFecha[fecha] = [];
        }
        
        partidosPorFecha[fecha].push({
          local: parseInt(row[1]) || 0,
          visitante: parseInt(row[2]) || 0,
          golesLocal: row[3] ? parseInt(row[3]) : null,
          golesVisitante: row[4] ? parseInt(row[4]) : null
        });
      });
    
    // Convertir a estructura de fixture
    torneoData.fixture = Object.entries(partidosPorFecha)
      .map(([fecha, partidos]) => ({
        fecha: parseInt(fecha),
        partidos: partidos
      }))
      .sort((a, b) => a.fecha - b.fecha); // Ordenar por fecha

    init();
  } catch (error) {
    console.error('Error al cargar datos desde Google Sheets:', error);
    alert('Error al cargar datos. Verifica la consola para más detalles.');
    cargarDatosLocales();
  }
}

// Función de respaldo para cargar datos locales
function cargarDatosLocales() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      torneoData = data;
      init();
    });
}

// Inicializar la aplicación
function init() {
  // Generar selector de fechas
  const selectorFecha = document.getElementById('fecha');
  selectorFecha.innerHTML = torneoData.fixture.map((f, i) => 
    `<option value="${i}">Fecha ${f.fecha}</option>`
  ).join('');

  cargarFecha();
  actualizarTabla();
}

// Resto de las funciones permanecen igual...
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

function actualizarTabla() {
  // Reiniciar estadísticas con valores por defecto más completos
  torneoData.equipos.forEach(e => {
    if (!e) return; // Saltar si el equipo es undefined
    
    e.pj = e.pg = e.pe = e.pp = e.gf = e.gc = 0;
    e.puntos = e.puntos || 0; // Asegurar que puntos existe
  });

  // Calcular estadísticas con verificaciones
  torneoData.fixture.forEach(fecha => {
    if (!fecha || !fecha.partidos) return;
    
    fecha.partidos.forEach(partido => {
      if (!partido || partido.golesLocal === null || partido.golesVisitante === null) return;

      const local = torneoData.equipos.find(e => e && e.id === partido.local);
      const visitante = torneoData.equipos.find(e => e && e.id === partido.visitante);

      if (!local || !visitante) {
        console.warn(`Partido con equipos no encontrados: Local ${partido.local} vs Visitante ${partido.visitante}`);
        return;
      }

      // Incrementar estadísticas
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
    });
  });

  // Ordenar y mostrar (filtramos equipos undefined por si acaso)
  const equiposOrdenados = torneoData.equipos
    .filter(e => e) // Filtrar equipos undefined
    .sort((a, b) => b.puntos - a.puntos || b.gf - a.gf || a.gc - b.gc);
    
  document.getElementById('cuerpo-tabla').innerHTML = equiposOrdenados.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.nombre}</td>
      <td>${e.puntos}</td>
      <td>${e.pj}</td>
      <td>${e.pg}</td>
      <td>${e.pe || 0}</td> <!-- Asegurar empates -->
      <td>${e.pp}</td>
      <td>${e.gf || 0}</td> <!-- Asegurar goles -->
      <td>${e.gc || 0}</td>
      <td>${(e.gf || 0) - (e.gc || 0)}</td>
    </tr>
  `).join('');
}

function getNombreEquipo(id) {
  return torneoData.equipos.find(e => e.id === id)?.nombre || `Equipo ${id}`;
}

// Tema oscuro/claro (igual que antes)
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;
const iconMoon = toggleThemeBtn.querySelector('.fa-moon');
const iconSun = toggleThemeBtn.querySelector('.fa-sun');

const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

toggleThemeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        iconMoon.style.display = 'none';
        iconSun.style.display = 'inline-block';
    } else {
        iconMoon.style.display = 'inline-block';
        iconSun.style.display = 'none';
    }
}

// Iniciar la carga de datos
cargarDatosDesdeSheets();