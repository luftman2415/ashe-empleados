console.log("app.js cargado correctamente");

// --- Constantes de Local Storage ---
const LS_KEYS = {
    USUARIOS: 'ashe_usuarios',
    EMPLEADOS: 'ashe_empleados',
    AUSENCIAS: 'ashe_ausencias', // Assuming 'Ausencias' is for vacation/leave requests based on HTML/JS
    SESSION: 'ashe_session'
};

// --- Utilidades de Local Storage ---
function getUsuarios() {
    try {
        const usuarios = JSON.parse(localStorage.getItem(LS_KEYS.USUARIOS));
        return Array.isArray(usuarios) ? usuarios : [];
    } catch (e) {
        console.error("Error reading users from Local Storage:", e);
        return [];
    }
}

function setUsuarios(arr) {
    try {
        localStorage.setItem(LS_KEYS.USUARIOS, JSON.stringify(arr));
    } catch (e) {
        console.error("Error writing users to Local Storage:", e);
        mostrarAlerta('Error al guardar usuarios.', 'danger');
    }
}

function getEmpleados() {
    try {
        const empleados = JSON.parse(localStorage.getItem(LS_KEYS.EMPLEADOS));
        // Ensure it's an array, default to empty array if null or invalid JSON
        const empleadosArray = Array.isArray(empleados) ? empleados : [];

        // Add default values for new fields if loading old data
        return empleadosArray.map(emp => ({
            id: emp.id, // Ensure ID exists
            nombres: emp.nombres || '',
            apellidos: emp.apellidos || '',
            cedula: emp.cedula || '',
            telefono: emp.telefono || '',
            email: emp.email || '',
            cargo: emp.cargo || '',
            departamento: emp.departamento || '',
            contrato: emp.contrato || '',
            salario: emp.salario || '', // Store as string, format for display
            nacimiento: emp.nacimiento || '',
            ingreso: emp.ingreso || '',
            direccion: emp.direccion || '',
            ciudad: emp.ciudad || '',
            barrio: emp.barrio || '',
            notas: emp.notas || '',
            emergencia_nombre: emp.emergencia_nombre || '',
            emergencia_telefono: emp.emergencia_telefono || '',
            emergencia_parentesco: emp.emergencia_parentesco || '',
            // New fields - provide defaults if they don't exist
            hijos: emp.hijos || 'No', // Default to No
            cuantos_hijos: emp.cuantos_hijos > 0 ? parseInt(emp.cuantos_hijos) : 0, // Ensure it's a number
            detalle_hijos: emp.detalle_hijos || '[]', // Ensure this field exists and is a stringified array default
            con_quien_vive: emp.con_quien_vive || '',
            esposo_nombre: emp.esposo_nombre || '',
            esposo_edad: emp.esposo_edad > 0 ? parseInt(emp.esposo_edad) : '', // Ensure it's a number
            esposo_telefono: emp.esposo_telefono || '',
            estado_civil: emp.estado_civil || '',
            eps: emp.eps || '',
            fondo_pensiones: emp.fondo_pensiones || '',
            tipo_sangre: emp.tipo_sangre || '',
            licencia: emp.licencia || 'No', // Default to No
            licencia_categoria: emp.licencia_categoria || '',
            licencia_vencimiento: emp.licencia_vencimiento || '',
            hoja_vida_nombre: emp.hoja_vida_nombre || '',
            hoja_vida_url: emp.hoja_vida_url || '',
            // Add other new fields with defaults here
            // ...emp // Spread existing properties - use with caution if restructuring
        }));
    } catch (e) {
        console.error("Error reading employees from Local Storage:", e);
        return [];
    }
}

function setEmpleados(arr) {
    try {
        localStorage.setItem(LS_KEYS.EMPLEADOS, JSON.stringify(arr));
    } catch (e) {
        console.error("Error writing employees to Local Storage:", e);
        mostrarAlerta('Error al guardar empleados.', 'danger');
    }
}

function getAusencias() {
    try {
        const ausencias = JSON.parse(localStorage.getItem(LS_KEYS.AUSENCIAS));
        return Array.isArray(ausencias) ? ausencias : [];
    } catch (e) {
        console.error("Error reading absences from Local Storage:", e);
        return [];
    }
}

function setAusencias(arr) {
    try {
        localStorage.setItem(LS_KEYS.AUSENCIAS, JSON.stringify(arr));
    } catch (e) {
        console.error("Error writing absences to Local Storage:", e);
        mostrarAlerta('Error al guardar ausencias.', 'danger');
    }
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEYS.SESSION));
    } catch (e) {
        console.error("Error reading session from Local Storage:", e);
        return null;
    }
}

function setSession(obj) {
    try {
        localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(obj));
    } catch (e) {
        console.error("Error writing session to Local Storage:", e);
        mostrarAlerta('Error al iniciar sesión.', 'danger');
    }
}

function clearSession() {
    try {
        localStorage.removeItem(LS_KEYS.SESSION);
    } catch (e) {
        console.error("Error clearing session from Local Storage:", e);
        mostrarAlerta('Error al cerrar sesión.', 'danger');
    }
}


// --- Inicialización de datos por defecto ---
function initDatos() {
    if (!localStorage.getItem(LS_KEYS.USUARIOS)) {
        setUsuarios([{ id: 1, email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }]); // Added ID for consistency
    }
    if (!localStorage.getItem(LS_KEYS.EMPLEADOS)) {
         // Initialize with some dummy data including new fields
         setEmpleados([
             {
                 id: 1, nombres: 'Juan', apellidos: 'Pérez', cedula: '123456789', telefono: '555-1111', email: 'juan.perez@empresa.com', cargo: 'Representante de Ventas', departamento: 'Ventas', contrato: 'Indefinido', salario: '1500000', nacimiento: '1990-05-15', ingreso: '2022-03-15', direccion: 'Calle Falsa 123', ciudad: 'Bogotá', barrio: 'Centro', notas: '', emergencia_nombre: 'Ana Pérez', emergencia_telefono: '555-1112', emergencia_parentesco: 'Hermana', hijos: 'Sí', cuantos_hijos: 2, detalle_hijos: JSON.stringify([{sexo: 'Masculino', edad: 5}, {sexo: 'Femenino', edad: 8}]), con_quien_vive: 'Familia', esposo_nombre: '', esposo_edad: '', esposo_telefono: '', estado_civil: 'Soltero', eps: 'Salud Total', fondo_pensiones: 'Protección', tipo_sangre: 'O+', licencia: 'Sí', licencia_categoria: 'B1', licencia_vencimiento: '2025-12-31', hoja_vida_nombre: '', hoja_vida_url: ''
             },
             {
                 id: 2, nombres: 'María', apellidos: 'García', cedula: '987654321', telefono: '555-2222', email: 'maria.garcia@empresa.com', cargo: 'Generalista de RRHH', departamento: 'Recursos Humanos', contrato: 'Indefinido', salario: '1800000', nacimiento: '1985-08-20', ingreso: '2021-01-10', direccion: 'Avenida Siempreviva 742', ciudad: 'Medellín', barrio: 'El Poblado', notas: 'Experta en nómina', emergencia_nombre: 'Pedro García', emergencia_telefono: '555-2223', emergencia_parentesco: 'Hermano', hijos: 'No', cuantos_hijos: 0, detalle_hijos: '[]', con_quien_vive: 'Solo', esposo_nombre: 'Carlos Rodríguez', esposo_edad: 40, esposo_telefono: '555-2224', estado_civil: 'Casado', eps: 'Sura', fondo_pensiones: 'Porvenir', tipo_sangre: 'A-', licencia: 'No', licencia_categoria: '', licencia_vencimiento: '', hoja_vida_nombre: '', hoja_vida_url: ''
             }
         ]);
    }
    if (!localStorage.getItem(LS_KEYS.AUSENCIAS)) {
        setAusencias([]);
    }
     // Add more initial data checks for other sections if needed (e.g., Documentos, Encuestas, etc.)
}


/* --- SPA: Mostrar/Ocultar Secciones --- */
// Modificada para manejar solo secciones SPA
function mostrarSeccion(id) {
    console.log("Mostrando sección:", id); // Log which section is being shown
    // Oculta todas las secciones SPA
    $('.spa-section').addClass('d-none');
    // Muestra la sección solicitada
    $('#' + id).removeClass('d-none');

    // Actualiza el título de la sección
    const sectionTitleElement = document.getElementById('section-title');
    const targetSection = document.getElementById(id);
    if (targetSection) {
        // Try to find a main heading (h1, h2, h3, h4, h5) in the section
        const heading = targetSection.querySelector('h1, h2, h3, h4, h5');
        if (heading) {
            sectionTitleElement.innerText = heading.innerText;
        } else {
             // Fallback: Use the text from the corresponding navigation link
             const navLink = document.querySelector(`.list-group-item.spa-link[href="#${id}"]`);
             if(navLink) sectionTitleElement.innerText = navLink.innerText;
             else sectionTitleElement.innerText = 'Sistema de Gestión de RRHH'; // Default title if no matching link
        }
    }

    // Actualiza la clase 'active' en el sidebar
    $('.spa-link').removeClass('active');
    $(`.spa-link[href="#${id}"]`).addClass('active');


    // Controla la visibilidad del botón de logout (asumiendo que solo se oculta en login/registro)
    // Ensure sidebar is hidden on login/registro pages and shown otherwise
    if (id === 'login' || id === 'registro') { // Use IDs consistent with HTML structure
        $('#logout-btn').addClass('d-none');
        $('#sidebar-wrapper').addClass('d-none'); // Hide sidebar on login/registro
        $('#sidebarToggle').addClass('d-none'); // Hide toggle button
        $('#page-content-wrapper').removeClass('toggled'); // Ensure content area takes full width
    } else {
        $('#logout-btn').removeClass('d-none');
        $('#sidebar-wrapper').removeClass('d-none'); // Show sidebar on other pages
        $('#sidebarToggle').removeClass('d-none'); // Show toggle button
         // Keep content area adjusted for sidebar (toggled class is handled by the button)
    }

     // Oculta el sidebar en móviles después de la navegación si está abierto
     if (window.innerWidth <= 768 && $('#wrapper').hasClass('toggled')) { // Check if screen is small AND sidebar is toggled open
         $('#wrapper').removeClass('toggled');
     }
}


/* --- Breadcrumb dinámico (no usado en el HTML proporcionado, pero mantenido como ejemplo) --- */
// function actualizarBreadcrumb(id) {
//      const map = {
//          'login': 'Iniciar Sesión', // Use section IDs
//          'registro': 'Registro', // Use section IDs
//          'dashboard': 'Dashboard',
//          'empleados': 'Gestión de Empleados', // Use section IDs
//          // 'empleado-form': 'Formulario de Empleado', // This is part of 'empleados' section logic
//          // 'empleado-detalle-modal': 'Detalle de Empleado', // This is a modal, not a section
//          'cumpleanos-list': 'Próximos Cumpleaños', // Use section ID
//          'licencias-list': 'Licencias próximas a vencer', // Use section ID
//          'documentacion': 'Documentación y Manuales', // Use section ID
//          'encuestas': 'Encuestas y Feedback', // Use section ID
//          'objetivos': 'Objetivos y Metas', // Use section ID
//          'beneficios': 'Beneficios y Compensaciones', // Use section ID
//          'capacitaciones': 'Capacitaciones y Desarrollo', // Use section ID
//          'evaluaciones': 'Evaluaciones de Desempeño', // Use section ID
//          'nomina': 'Gestión de Nómina', // Use section ID
//          'vacaciones': 'Gestión de Vacaciones', // Use section ID
//          'horarios': 'Gestión de Horarios', // Use section ID
//          'incidencias': 'Gestión de Incidencias' // Use section ID
//      };
//      // Assuming '#breadcrumb-container' exists somewhere in the HTML, maybe in the navbar
//      $('#breadcrumb-container').html(`<nav aria-label="breadcrumb"><ol class="breadcrumb mb-0"><li class="breadcrumb-item active">${map[id] || 'Página'}</li></ol></nav>`);
// }


/* --- Alertas temporales --- */
// Asumiendo que tienes un div con id="alert-container" en tu HTML
function mostrarAlerta(msg, tipo = 'success', tiempo = 3000) {
    const id = 'alert-' + Date.now();
    $('#alert-container').append(`
        <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
    setTimeout(() => $('#' + id).remove(), tiempo); // Use .remove() instead of .alert('close') for direct cleanup
}

/* --- Mostrar/Ocultar contraseña --- */
$(document).on('click', '.toggle-password', function() {
    const targetId = $(this).data('target'); // Get target input ID from data-target attribute
    const input = $('#' + targetId);
    const icon = $(this).find('i');
    if (input.attr('type') === 'password') {
        input.attr('type', 'text');
        icon.removeClass('bi-eye').addClass('bi-eye-slash');
    } else {
        input.attr('type', 'password');
        icon.removeClass('bi-eye-slash').addClass('bi-eye');
    }
});

/* --- Formateo de moneda y validación de salario --- */
function limpiarSalario(valor) {
    if (typeof valor !== 'string' || !valor) return '';
    // Remove non-numeric characters except decimal point and comma
    let cleaned = valor.replace(/[^\d,\.]/g, '');
    // Replace comma with point for decimal separator if comma exists
    if (cleaned.includes(',')) {
        // Assuming comma is decimal separator, remove points if they exist (thousands)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    return cleaned;
}

function formatearMoneda(valor) {
    let num = Number(limpiarSalario(valor));
    if (isNaN(num)) return valor; // Return original value if not a valid number after cleaning

    // Use toLocaleString with configuration for Colombian pesos
    return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 });
}


/* --- Calcular antigüedad en años --- */
function calcularAntiguedad(fechaIngreso) {
    if (!fechaIngreso) return '';
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);

    // Validación básica de fecha
    if (isNaN(ingreso.getTime())) {
        return 'Fecha inválida';
    }

    let años = hoy.getFullYear() - ingreso.getFullYear();
    const mesDiff = hoy.getMonth() - ingreso.getMonth();

    // Ajuste por el mes y día
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < ingreso.getDate())) {
        años--;
    }

    // Manejar casos donde la fecha de ingreso es en el futuro (aunque no debería ocurrir)
    if (años < 0) return 'Fecha futura';
    if (años === 0) {
        const diaDiff = hoy.getDate() - ingreso.getDate();
        if (mesDiff === 0 && diaDiff >= 0) {
             // Less than a year, calculate months
             let meses = hoy.getMonth() - ingreso.getMonth();
             if (hoy.getDate() < ingreso.getDate()) {
                  meses--;
             }
             meses = meses < 0 ? meses + 12 : meses;
              return meses > 0 ? `${meses} meses` : 'Menos de 1 mes'; // Or just '< 1 año'
        }
        return 'Menos de 1 año'; // Or calculate months
    }


    return años;
}

/* --- Calcular días restantes para cumpleaños --- */
function diasParaCumple(fechaNacimiento) {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    // Validación básica de fecha
    if (isNaN(nacimiento.getTime())) {
        return ''; // Or handle as error
    }

    // Obtener el día y mes del cumpleaños
    const cumpleDia = nacimiento.getDate();
    const cumpleMes = nacimiento.getMonth(); // 0-indexed

    // Crear una fecha para el cumpleaños en el año actual
    let cumpleEsteAño = new Date(hoy.getFullYear(), cumpleMes, cumpleDia);

    // Si el cumpleaños ya pasó este año, calcular para el próximo año
    if (cumpleEsteAño < hoy) {
        cumpleEsteAño.setFullYear(hoy.getFullYear() + 1);
    }

    // Calcular la diferencia en milisegundos y convertir a días
    const diffTiempo = cumpleEsteAño.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

    return diffDias;
}

/* --- Cerrar sesión --- */
$('#logout-btn').on('click', function() {
    clearSession();
    mostrarAlerta('Sesión cerrada', 'info');
    // Redireccionar o mostrar la sección de login
    mostrarSeccion('login'); // Ensure this matches the login section ID
});

/* --- Login --- */
// Assuming your login section has id="login" and form has id="login-form"
$('#login-form').on('submit', function(e) { // Use the form ID 'login-form'
    e.preventDefault();
    let email = $('#login-email').val().trim();
    let password = $('#login-password').val();
    let usuarios = getUsuarios();
    let user = usuarios.find(u => u.email === email && u.password === password);
    if (user) {
        setSession({ email: user.email, rol: user.rol });
        mostrarAlerta('Bienvenido/a', 'success');
        // Redireccionar o mostrar la primera sección de la app
        mostrarSeccion('dashboard'); // Ensure this matches the dashboard section ID
        renderDashboard(user.rol); // Render dashboard content based on role
        // Mostrar elementos basados en el rol si es necesario
        // if (user.rol === 'admin') { $('.admin-only').removeClass('d-none'); }
    } else {
        mostrarAlerta('Credenciales incorrectas', 'danger');
    }
});

/* --- Registro --- */
// Assuming your registration section has id="registro" and form has id="registro-form"
$('#show-register-link').on('click', function(e) {
    e.preventDefault();
    mostrarSeccion('registro'); // Use the section ID 'registro'
});
$('#cancel-register-btn').on('click', function() {
    mostrarSeccion('login'); // Go back to login section
});
$('#registro-form').on('submit', function(e) { // Use the form ID 'registro-form'
    e.preventDefault();
    let email = $('#register-email').val().trim();
    let password = $('#register-password').val();
    let password2 = $('#register-password2').val();
    if (!email || !password || !password2) {
        mostrarAlerta('Completa todos los campos', 'danger');
        return;
    }
    if (password !== password2) {
        mostrarAlerta('Las contraseñas no coinciden', 'danger');
        return;
    }
    let usuarios = getUsuarios();
    if (usuarios.find(u => u.email === email)) {
        mostrarAlerta('El correo ya está registrado', 'danger');
        return;
    }
    // Simple ID generation (not robust for real applications)
    const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id || 0)) + 1 : 1;

    // Save with a default role, e.g., 'empleado'
    usuarios.push({ id: newId, email, password, rol: 'empleado' });
    setUsuarios(usuarios);
    mostrarAlerta('Usuario registrado. Ahora puedes iniciar sesión.', 'success');
    mostrarSeccion('login'); // Go back to login section after registration
});

/* --- Olvidaste tu contraseña (simulado) --- */
$('#forgot-password-link').on('click', function(e) {
    e.preventDefault();
    let email = prompt('Introduce tu correo electrónico para restablecer la contraseña:');
    if (!email) return;
    let usuarios = getUsuarios();
    let user = usuarios.find(u => u.email === email);
    if (!user) {
        mostrarAlerta('Correo no encontrado', 'danger');
        return;
    }
    // WARNING: This is not secure. In a real app, send a reset link via email.
    let nueva = prompt('Introduce la nueva contraseña (NO ES SEGURO EN UNA APP REAL):');
    if (!nueva) return;
    user.password = nueva; // In a real app, hash the password
    setUsuarios(usuarios);
    mostrarAlerta('Contraseña restablecida. Ahora puedes iniciar sesión.', 'success');
});

/* --- Renderizar dashboard y contadores --- */
function renderDashboard(rol) {
    console.log("Rendering Dashboard for role:", rol);
    let empleados = getEmpleados();
    let usuarios = getUsuarios(); // Assuming you might want to show total users on dashboard for admin
    let hoy = new Date();

    // Dashboard Counters (Ensure these IDs exist in your Dashboard HTML)
    $('#total-empleados').text(empleados.length);
    // Assuming a counter for total users might exist for admin
    // $('#total-usuarios').text(usuarios.length); // Uncomment if you add this counter

    // Cumpleaños próximos (30 días)
    let cumpleanos = empleados.filter(e => {
        let dias = diasParaCumple(e.nacimiento);
        return dias !== '' && dias >= 0 && dias <= 30; // Include today and next 30 days
    });
    // Assuming a counter for upcoming birthdays exists
    $('#proximos-cumpleanos').text(cumpleanos.length);

    // Listado de cumpleaños en el dashboard (Ensure this ID exists in your Dashboard HTML)
    let listaCumple = cumpleanos.map(e =>
        `<li class="list-group-item">${e.nombres} ${e.apellidos} - ${e.nacimiento} (${diasParaCumple(e.nacimiento)} días)</li>`
    ).join('');
    $('#lista-cumpleanos-dashboard').html(listaCumple || '<li class="list-group-item text-muted">Sin cumpleaños próximos</li>');

    // Licencias próximas a vencer (30 días)
    let licencias = empleados.filter(e => {
        if (e.licencia === 'Sí' && e.licencia_vencimiento) {
            let vencimientoDate = new Date(e.licencia_vencimiento + 'T00:00:00'); // Parse as local date
            if (isNaN(vencimientoDate.getTime())) return false; // Skip invalid dates
            let diffTime = vencimientoDate.getTime() - hoy.getTime();
             // Adjust for timezone differences if necessary, but simple day diff is often okay for this
            let dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 30; // Include today and next 30 days
        }
        return false;
    });
    // Assuming a counter for expiring licenses exists
    $('#licencias-por-vencer').text(licencias.length); // Using the ID from HTML

    // Listado de licencias en el dashboard (Ensure this ID exists in your Dashboard HTML)
    let listaLic = licencias.map(e =>
        `<li class="list-group-item">${e.nombres} ${e.apellidos} - Vence: ${e.licencia_vencimiento}</li>`
    ).join('');
    $('#lista-licencias-dashboard').html(listaLic || '<li class="list-group-item text-muted">Sin licencias próximas a vencer</li>');

    // Notificaciones de cumpleaños (Ensure this ID exists in your Dashboard HTML)
    let notis = cumpleanos.filter(e => diasParaCumple(e.nacimiento) <= 7).map(e => `<div class="alert alert-info mb-1 p-2"><b>${e.nombres} ${e.apellidos}</b> cumple años en ${diasParaCumple(e.nacimiento)} días (${e.nacimiento})</div>`).join(''); // Only show notification if within 7 days
    $('#cumpleanos-notificaciones').html(notis);

    // Renderizar gráficos (Placeholder function)
    renderGraficos(empleados); // Pass employees data to graphics function

    // Controlar visibilidad de elementos para admin
    if (rol === 'admin') {
        // Assuming certain elements/cards are only visible to admin
        // $('#total-usuarios-card').removeClass('d-none'); // Uncomment if you add this card
        // $('#exportar-csv-btn').removeClass('d-none'); // Uncomment if this button is only for admin
         $('.admin-only').removeClass('d-none'); // Example class for admin-specific elements
    } else {
        // $('#total-usuarios-card').addClass('d-none'); // Uncomment if you add this card
        // $('#exportar-csv-btn').addClass('d-none'); // Uncomment if this button is only for admin
        $('.admin-only').addClass('d-none'); // Example class for admin-specific elements
    }
}

// Placeholder for renderGraficos function - Using Chart.js example
function renderGraficos(empleados) {
    console.log("renderGraficos function called");

    if (!empleados || empleados.length === 0) {
        console.log("No employee data to render charts.");
         // Clear existing charts or show a message
         $('.chart-container').empty().html('<p class="text-muted text-center">No hay datos de empleados para mostrar gráficos.</p>');
        return;
    }

    // --- Chart 1: Distribución por Departamento ---
    const departamentoCounts = empleados.reduce((acc, emp) => {
        const depto = (emp.departamento || 'Desconocido').trim();
        acc[depto] = (acc[depto] || 0) + 1;
        return acc;
    }, {});

    const departamentoLabels = Object.keys(departamentoCounts);
    const departamentoData = Object.values(departamentoCounts);

    // Destroy previous chart instance if it exists on the same canvas
    const departamentoCanvas = document.getElementById('departamentoChart');
     if (departamentoCanvas) {
          const existingChart = Chart.getChart(departamentoCanvas);
          if (existingChart) {
              existingChart.destroy();
          }
          // Render new chart
          new Chart(departamentoCanvas, {
              type: 'pie', // Or 'bar' depending on preference
              data: {
                  labels: departamentoLabels,
                  datasets: [{
                      label: 'Empleados por Departamento',
                      data: departamentoData,
                      backgroundColor: [
                          'rgba(255, 99, 132, 0.6)', // Example colors
                          'rgba(54, 162, 235, 0.6)',
                          'rgba(255, 206, 86, 0.6)',
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(153, 102, 255, 0.6)',
                          'rgba(255, 159, 64, 0.6)'
                      ],
                      borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                          'rgba(255, 159, 64, 1)'
                      ],
                      borderWidth: 1
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false, // Allow chart to resize based on container
                  plugins: {
                      title: {
                          display: false, // Title is in card header
                      },
                      legend: {
                          position: 'bottom', // Or 'top', 'left', 'right'
                      }
                  }
              }
          });
     } else {
          console.warn("Canvas element #departamentoChart not found.");
     }


     // --- Chart 2: Estado de Empleados (Example - based on 'contrato' or similar) ---
     const estadoCounts = empleados.reduce((acc, emp) => {
         const estado = (emp.contrato || 'No especificado').trim(); // Using 'contrato' as example state
         acc[estado] = (acc[estado] || 0) + 1;
         return acc;
     }, {});

     const estadoLabels = Object.keys(estadoCounts);
     const estadoData = Object.values(estadoCounts);

     // Destroy previous chart instance if it exists on the same canvas
     const estadoCanvas = document.getElementById('estadoEmpleadoChart');
      if (estadoCanvas) {
           const existingChart = Chart.getChart(estadoCanvas);
           if (existingChart) {
               existingChart.destroy();
           }
           // Render new chart
           new Chart(estadoCanvas, {
               type: 'bar', // Or 'pie'
               data: {
                   labels: estadoLabels,
                   datasets: [{
                       label: 'Empleados por Estado de Contrato',
                       data: estadoData,
                       backgroundColor: [
                           'rgba(153, 102, 255, 0.6)', // Example colors
                           'rgba(255, 159, 64, 0.6)',
                           'rgba(255, 99, 132, 0.6)',
                           'rgba(54, 162, 235, 0.6)',
                       ],
                       borderColor: [
                           'rgba(153, 102, 255, 1)',
                           'rgba(255, 159, 64, 1)',
                           'rgba(255, 99, 132, 1)',
                           'rgba(54, 162, 235, 1)',
                       ],
                       borderWidth: 1
                   }]
               },
               options: {
                   responsive: true,
                   maintainAspectRatio: false,
                    plugins: {
                       title: {
                           display: false,
                       },
                       legend: {
                           display: false, // Hide legend for simple bar chart often
                       }
                    },
                   scales: {
                       y: {
                           beginAtZero: true,
                           ticks: {
                             precision: 0 // Ensure whole numbers on Y axis
                           }
                       }
                   }
               }
           });
      } else {
           console.warn("Canvas element #estadoEmpleadoChart not found.");
      }
}


/* --- Listeners de los botones principales del dashboard --- */
// Assuming these buttons exist in your Dashboard HTML
$('#add-empleado-btn').on('click', function() {
    // Prepare the form for adding
    $('#empleado-form-title').text('Agregar Empleado'); // Assuming title element exists in employee form section
    $('#form-empleado')[0].reset(); // Assuming form has ID form-empleado
    $('#empleado-id').val(''); // Clear hidden ID field
    // Reset conditional fields
    $('#datos-esposo-esposa').hide();
    $('#empleado-licencia-categoria-div').addClass('d-none');
    $('#empleado-licencia-vencimiento-div').addClass('d-none');
    $('#cuantos-hijos-div').hide();
    $('#hijos-tabla-row').hide();
    renderTablaHijos(); // Clear hijos table structure but not data
     // Clear hijos data from form
    $('#hijos-tabla tbody').empty();


    // Note: The HTML structure uses sections for forms/details.
    // If your 'Nuevo Empleado' button triggers a modal, this listener
    // might not be necessary, or it should just prepare the modal form.
    // If it navigates to a section, ensure that section is correctly shown.
    // Based on HTML, it triggers a modal, so the logic below is for preparing the modal.

    // Example: Prepare the modal form when the 'Nuevo Empleado' modal is shown
    $('#nuevo-empleado-modal').on('show.bs.modal', function (event) {
        $('#empleado-form-title').text('Agregar Empleado');
        $('#form-empleado')[0].reset();
        $('#empleado-id').val('');
        $('#datos-esposo-esposa').hide();
        $('#empleado-licencia-categoria-div').addClass('d-none');
        $('#empleado-licencia-vencimiento-div').addClass('d-none');
        $('#cuantos-hijos-div').hide();
        $('#hijos-tabla-row').hide();
        $('#hijos-tabla tbody').empty(); // Clear hijos data in modal form
    });

});

// Assuming these buttons exist in your Dashboard HTML
$('#ver-empleados-btn').on('click', function() {
    // If #ver-empleados-btn exists and navigates to the #empleados section,
    // the SPA link listener handles showing the section and rendering the table.
    // This listener might be redundant if using SPA links for navigation.
    // If it just renders the table within the dashboard, adjust this logic.
    // Based on HTML, navigation is via SPA links. This listener is likely for internal dashboard button if present.
    // If you keep this button, ensure it calls mostrarSeccion('empleados'); and renderTablaEmpleados(...);
     console.log("#ver-empleados-btn clicked - SPA link should handle navigation");
});

// Assuming this button exists and is only for admin (handled in renderDashboard visibility)
$('#exportar-csv-btn').on('click', function() {
    exportarEmpleadosCSV();
});


/* --- Botones para ver cumpleaños y licencias (Listeners added) --- */
// Assuming these buttons exist in your Dashboard HTML and use SPA navigation via href
// Listeners are handled by the general .spa-link listener.
// If these buttons *only* render the tables within the dashboard view, adjust the logic.
// Based on HTML, they are SPA links.
console.log("Listeners for #ver-cumpleanos-btn and #ver-licencias-btn are handled by .spa-link listener");


/* --- Botones para regresar al dashboard --- */
// Assuming these buttons exist in the new birthday/license sections and use SPA navigation via href
// Listeners are handled by the general .spa-link listener.
console.log("Listeners for volver-dashboard buttons are handled by .spa-link listener");


/* --- Función para exportar empleados a CSV --- */
function exportarEmpleadosCSV() {
    let empleados = getEmpleados();
    if (!empleados.length) {
        mostrarAlerta('No hay empleados para exportar', 'info');
        return;
    }
    // Ensure all possible keys are included in header, even if not present in first object
    const allKeys = new Set();
    empleados.forEach(emp => {
        // Include all original keys from the object
         Object.keys(emp).forEach(key => allKeys.add(key));
         // Also consider keys from nested objects if they exist and you want them as columns
          if (emp.detalle_hijos) {
              try {
                  const hijos = JSON.parse(emp.detalle_hijos);
                   if (hijos.length > 0) {
                       Object.keys(hijos[0]).forEach(key => allKeys.add(`hijo_${key}`)); // Example naming
                   }
              } catch(e) { console.error("Error parsing hijos for CSV keys:", e); }
          }
    });
    // Order the headers if needed, otherwise Array.from(allKeys) is fine
    // Example ordering: Put common fields first
     const orderedKeys = ['id', 'nombres', 'apellidos', 'cedula', 'email', 'cargo', 'departamento', 'ingreso', 'salario', 'nacimiento', 'telefono', 'direccion', 'ciudad', 'barrio', 'estado_civil', 'con_quien_vive', 'esposo_nombre', 'esposo_edad', 'esposo_telefono', 'hijos', 'cuantos_hijos', 'detalle_hijos', 'eps', 'fondo_pensiones', 'tipo_sangre', 'licencia', 'licencia_categoria', 'licencia_vencimiento', 'hoja_vida_nombre', 'hoja_vida_url', 'emergencia_nombre', 'emergencia_telefono', 'emergencia_parentesco', 'notas'];
     const finalHeader = orderedKeys.filter(key => allKeys.has(key)).concat(Array.from(allKeys).filter(key => !orderedKeys.includes(key) && !key.startsWith('hijo_'))); // Add any other keys not in ordered list
     // Add child columns if needed
     // if (allKeys.has('hijo_sexo')) finalHeader.push('hijo_sexo');
     // if (allKeys.has('hijo_edad')) finalHeader.push('hijo_edad');
     // This needs more complex logic if multiple children or varying fields

    let csv = [finalHeader.join(',')]; // Use final ordered header

    empleados.forEach(e => {
        let fila = finalHeader.map(k => {
            let value = e[k] === undefined || e[k] === null ? '' : e[k];

            // Handle potential stringified JSON fields (like detalle_hijos)
            if (k === 'detalle_hijos' && typeof value === 'string') {
                try {
                    const hijosArray = JSON.parse(value);
                     // Represent children as a string for CSV
                     value = hijosArray.map(h => `Sexo:${h.sexo || '-'} Edad:${h.edad || '-'}`).join(';'); // Example format
                } catch(err) {
                    console.error("Error parsing detalle_hijos for CSV:", err);
                    value = 'Error al parsear hijos'; // Indicate error in CSV
                }
            } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                 // Handle other potential JSON strings generically
                 try { value = JSON.parse(value); } catch(err) { console.error("Error parsing generic JSON for CSV:", err); }
            }

             // Simple string conversion for CSV, handle quotes and newlines
            let stringValue = String(value).replace(/"/g, '""'); // Escape double quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
                stringValue = `"${stringValue}"`; // Enclose in quotes if it contains commas, quotes, or newlines
            }
             return stringValue;
        });
        csv.push(fila.join(','));
    });

    let blob = new Blob([csv.join('\r\n')], { type: 'text/csv;charset=utf-8;' }); // Specify charset
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'empleados.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarAlerta('Datos de empleados exportados a CSV', 'success');
}


/* --- Renderizar filtros de departamento y antigüedad --- */
// Assuming filter elements exist in the employee list section
function renderFiltrosEmpleados(empleados) {
    // Normaliza los nombres de departamento para evitar duplicados y problemas de comparación
    let departamentos = [...new Set(
        empleados
            .map(e => (e.departamento || '').trim())
            .filter(Boolean) // Remove empty strings
            .map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()) // Normalize capitalization
    )].sort(); // Sort departments alphabetically
    // Prepend the "Todos" option and populate the select
    $('#filtro-departamento').html('<option value="">Todos</option>' + departamentos.map(d => `<option value="${d}">${d}</option>`).join(''));

    // Antiguedad filter options are static in HTML, no need to render dynamically unless based on data ranges
}

/* --- Renderizar tabla de empleados --- */
let tablaEmpleados; // Declare DataTable variable outside the function
// Assuming the table has ID #tabla-empleados and is within the #empleados section
function renderTablaEmpleados(rol) {
    console.log("Rendering Employee Table for role:", rol);
    let empleados = getEmpleados();
    renderFiltrosEmpleados(empleados); // Update filters based on current employees

    let filtroDepto = $('#filtro-departamento').val();
    let filtroAntig = $('#filtro-antiguedad').val();
     let searchTerm = $('#buscar-empleado-input').val().toLowerCase(); // Get search term

    let dataForTable = empleados.map(e => {
         // Prepare data in a format suitable for DataTables 'data' option
         // Include all original properties plus calculated/formatted ones
          const antiguedad = calcularAntiguedad(e.ingreso);
         let acciones = `<button class="btn btn-info btn-sm ver-empleado-btn" data-id="${e.id}" data-bs-toggle="modal" data-bs-target="#detalle-empleado-modal" title="Ver Detalle"><i class="bi bi-eye"></i></button>`; // Use modal trigger
         if (rol === 'admin') {
             acciones += ` <button class="btn btn-warning btn-sm editar-empleado-btn" data-id="${e.id}" title="Editar"><i class="bi bi-pencil"></i></button>
             <button class="btn btn-danger btn-sm eliminar-empleado-btn" data-id="${e.id}" title="Eliminar"><i class="bi bi-trash"></i></button>`;
         }

         return {
             // Include data fields matching DataTable columns
             id: e.id, // Include ID if needed for actions or data access
             nombres: e.nombres || '',
             apellidos: e.apellidos || '',
             cedula: e.cedula || '',
             telefono: e.telefono || '',
             email: e.email || '',
             cargo: e.cargo || '',
             departamento: e.departamento || '',
             antiguedad: antiguedad, // Calculated value
             acciones: acciones, // HTML buttons
             // Include other fields needed for filtering/searching even if not displayed
             nacimiento: e.nacimiento || '',
             ingreso: e.ingreso || '',
             // ... include other relevant fields for search ...
         };
     });


     // Apply filters (DataTables can do filtering, but manual filtering here gives more control before init)
     dataForTable = dataForTable.filter(e => {
         let ok = true;
         // Filter by Department
         let depEmp = (e.departamento || '').trim();
         depEmp = depEmp.charAt(0).toUpperCase() + depEmp.slice(1).toLowerCase(); // Normalize capitalization
         if (filtroDepto && filtroDepto !== "" && depEmp !== filtroDepto) ok = false;

         // Filter by Antiguedad (based on the calculated value)
         if (ok && filtroAntig && filtroAntig !== "") {
             let ant = e.antiguedad; // Use the already calculated value
              if (ant === 'Fecha inválida' || ant === 'Fecha futura') {
                  ok = false; // Filter out invalid/future dates based on filter selection
              } else if (ant === 'Menos de 1 año' && filtroAntig !== '0-1') {
                  ok = false;
              } else if (typeof ant === 'number') { // Numeric years
                 if (filtroAntig === '0-1' && !(ant >= 0 && ant <= 1)) ok = false;
                 else if (filtroAntig === '2-5' && !(ant >= 2 && ant <= 5)) ok = false;
                 else if (filtroAntig === '6-10' && !(ant >= 6 && ant <= 10)) ok = false;
                 else if (filtroAntig === '11+' && !(ant >= 11)) ok = false;
             } else if (typeof ant === 'string' && ant.includes(' meses')) { // Handle months case
                 if (filtroAntig !== '0-1') ok = false; // Months fall under 0-1 year category
             } else { // If antiguedad is not one of the handled formats, assume it doesn't match filter
                  if(filtroAntig !== '') ok = false; // If a filter is selected, exclude these
             }
         }

          // Apply search term filter - DataTables has built-in search, but applying here filters the initial data set
          // This manual search might not be needed if DataTables built-in search is sufficient
         // if (ok && searchTerm) {
         //     const searchFields = [e.nombres, e.apellidos, e.cedula, e.telefono, e.email, e.cargo, e.departamento, e.antiguedad]; // Fields to search within
         //     const match = searchFields.some(field =>
         //         String(field).toLowerCase().includes(searchTerm)
         //     );
         //     if (!match) ok = false;
         // }

         return ok;
     });


    // Destroy previous DataTable instance if it exists
    if (tablaEmpleados) {
        tablaEmpleados.destroy();
        $('#tabla-empleados tbody').empty(); // Clear tbody manually after destroy
    }

     // Initialize DataTable
     tablaEmpleados = $('#tabla-empleados').DataTable({
         destroy: true, // Ensure it can be reinitialized
         data: dataForTable, // Provide the filtered data array directly
         columns: [
             // Map data properties to table columns
             { data: 'nombres' },
             { data: 'apellidos' },
             { data: 'cedula' },
             { data: 'telefono' },
             { data: 'email' },
             { data: 'cargo' },
             { data: 'departamento' },
             { data: 'antiguedad' },
             { data: 'acciones', orderable: false, searchable: false } // Actions column
         ],
         language: {
             url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' // Ensure HTTPS here too
         },
         paging: true,
         searching: true, // Keep DataTables built-in search enabled
         info: true,
         ordering: true,
         // Optional: Customize search input placeholder
          initComplete: function () {
              const api = this.api();
              const searchInput = $('#buscar-empleado-input');
              if (searchInput.length) {
                  // Link external search input to DataTables search
                  searchInput.off('.appDataTable').on('input.appDataTable', function() {
                       api.search(this.value).draw();
                  });
                   // Also clear DataTables internal search if external is cleared
                   api.on('search.dt', function() {
                       if (api.search() !== searchInput.val()) {
                           searchInput.val(api.search());
                       }
                   });
              }
          }
     });

     // If you were using manual search input, remove the manual filtering and rely on DataTables built-in search
     // The manual search input is already linked above in initComplete
}

/* --- Filtros de empleados (Listeners) --- */
// Re-render table on filter change
$('#filtro-departamento, #filtro-antiguedad').on('change', function() {
    let session = getSession();
    renderTablaEmpleados(session ? session.rol : 'empleado'); // Pass role, default if session is null
});

// Listener for external search input is handled in renderTablaEmpleados initComplete


/* --- Acción de ver empleado (Listener modified to show modal) --- */
// This listener is for buttons inside the DataTables rows with class 'ver-empleado-btn'
// Data-bs-toggle="modal" and data-bs-target="#detalle-empleado-modal" in the HTML handle showing the modal.
// The following listener populates the modal content *before* it is shown.
$('#detalle-empleado-modal').on('show.bs.modal', function (event) {
    const button = $(event.relatedTarget); // Button that triggered the modal
    const employeeId = button.data('id'); // Extract info from data-id attribute
    const session = getSession();
    renderDetalleEmpleado(employeeId, session ? session.rol : 'empleado'); // Populate the modal body, pass role
});

/* --- Manejo dinámico de hijos (tabla de hijos) --- */
// Assuming elements related to hijos are within the employee form (#form-empleado)
function renderTablaHijos() {
    console.log("renderTablaHijos called");
    let tieneHijos = $('#empleado-hijos').val() === 'Sí';
    let cuantos = parseInt($('#empleado-cuantos-hijos').val()) || 0;

    if (tieneHijos && cuantos > 0) {
        $('#hijos-tabla-row').show(); // Assuming this row exists in the form HTML
        let html = `<table class="table table-bordered table-sm"><thead><tr><th>#</th><th>Sexo</th><th>Edad</th></tr></thead><tbody>`;
        // Generate rows based on the 'cuantos' number
        for (let i = 0; i < cuantos; i++) { // Use 0-based index for consistency with arrays
             // Check if there's existing data for this child index
            // This requires getting existing data from the form or a temp variable
            // For editing, you would populate these inputs/selects
             html += `<tr>
                 <td>${i + 1}</td>
                 <td>
                     <select class="form-select hijos-sexo" data-index="${i}">
                         <option value="">Seleccione</option>
                         <option value="Masculino">Masculino</option>
                         <option value="Femenino">Femenino</option>
                     </select>
                 </td>
                 <td>
                     <input type="number" min="0" class="form-control hijos-edad" data-index="${i}" placeholder="Edad">
                 </td>
             </tr>`;
         }
         html += `</tbody></table>`;
         $('#hijos-tabla').html(html); // Assuming a div with ID #hijos-tabla exists in the form HTML

         // Note: Populating existing children data on edit requires more logic here or in the edit function
         // Example (assuming you have existing children data in a variable `existingChildren`):
         // hijosArray.forEach((hijo, index) => {
         //     $(`#hijos-tabla tbody tr:eq(${index}) .hijos-sexo`).val(hijo.sexo);
         //     $(`#hijos-tabla tbody tr:eq(${index}) .hijos-edad`).val(hijo.edad);
         // });


    } else {
        $('#hijos-tabla-row').hide();
        $('#hijos-tabla').empty(); // Clear the table content and structure
    }
}


// Populate hijos table when editing an employee
function populateTablaHijos(detalleHijosJson) {
     console.log("Populating hijos table with:", detalleHijosJson);
     if (!detalleHijosJson || detalleHijosJson === '[]') {
          $('#empleado-hijos').val('No').trigger('change'); // Set select and trigger change to hide/clear
          $('#empleado-cuantos-hijos').val('');
          return;
     }

     try {
          const hijosArray = JSON.parse(detalleHijosJson);
          const cuantos = hijosArray.length;

          if (cuantos > 0) {
              $('#empleado-hijos').val('Sí'); // Set to Sí
              $('#empleado-cuantos-hijos').val(cuantos).trigger('input'); // Set count and trigger input to render table structure

              // Populate the rendered inputs/selects with existing data
              hijosArray.forEach((hijo, index) => {
                   // Ensure elements for this index exist before trying to set values
                   const sexSelect = $(`#hijos-tabla tbody tr:eq(${index}) .hijos-sexo`);
                   const edadInput = $(`#hijos-tabla tbody tr:eq(${index}) .hijos-edad`);
                   if(sexSelect.length) sexSelect.val(hijo.sexo || '');
                   if(edadInput.length) edadInput.val(hijo.edad > 0 ? hijo.edad : '');
              });
          } else {
              $('#empleado-hijos').val('No').trigger('change'); // Set to No and trigger change
              $('#empleado-cuantos-hijos').val('');
          }
     } catch (error) {
          console.error("Error populating hijos table:", error);
          mostrarAlerta('Error al cargar detalle de hijos para edición.', 'danger');
          $('#empleado-hijos').val('No').trigger('change'); // Default to No on error
          $('#empleado-cuantos-hijos').val('');
     }
}


// Mostrar/ocultar campos de hijos (Listeners)
// Assuming #empleado-hijos and #empleado-cuantos-hijos are in the form HTML
$('#empleado-hijos').on('change', function() {
    if ($(this).val() === 'Sí') {
        $('#cuantos-hijos-div').show(); // Assuming this div exists
        // renderTablaHijos will be called by the input listener on cuantos-hijos
        if (parseInt($('#empleado-cuantos-hijos').val()) > 0) {
             $('#hijos-tabla-row').show();
        } else {
             $('#hijos-tabla-row').hide();
        }

    } else {
        $('#cuantos-hijos-div').hide();
        $('#hijos-tabla-row').hide();
        $('#empleado-cuantos-hijos').val('');
        $('#hijos-tabla tbody').empty(); // Clear table body when hiding
    }
});
// Listener for the number input to re-render the hijos table structure
$('#empleado-cuantos-hijos').on('input', renderTablaHijos);


// Mostrar/ocultar datos de espos@ según estado civil (Listener)
// Assuming #empleado-estado-civil and #datos-esposo-esposa are in the form HTML
$('#empleado-estado-civil').on('change', function() {
    // Note: In the HTML, you had 'Casad@' || 'Divorciad@'. The form HTML was not detailed.
    // Adjust logic based on your form's specific options. Assuming 'Casado' and 'Divorciado' as values.
    const estado = $(this).val();
    if (estado === 'Casado' || estado === 'Divorciado' || estado === 'Union Libre') { // Added Union Libre based on HTML options
        $('#datos-esposo-esposa').show(); // Assuming this div exists
    } else {
        $('#datos-esposo-esposa').hide();
        // Clear fields when hiding
        $('#empleado-esposo-nombre, #empleado-esposo-edad, #empleado-esposo-telefono').val('');
    }
});

// Licencia de conducción: mostrar/ocultar categoría y vencimiento (Listener)
// Assuming #empleado-licencia and related divs are in the form HTML
$('#empleado-licencia').on('change', function() {
    if ($(this).val() === 'Sí') {
        $('#empleado-licencia-categoria-div').removeClass('d-none'); // Assuming this div exists
        $('#empleado-licencia-vencimiento-div').removeClass('d-none'); // Assuming this div exists
    } else {
        $('#empleado-licencia-categoria-div').addClass('d-none');
        $('#empleado-licencia-vencimiento-div').addClass('d-none');
        // Clear fields when hiding
        $('#empleado-licencia-categoria').val('');
        $('#empleado-licencia-vencimiento').val('');
    }
});

// Al guardar empleado, recolecta los datos de hijos desde la tabla dinámica
function getDetalleHijosFromTabla() {
    let hijos = [];
    $('#hijos-tabla tbody tr').each(function() { // Iterate through rows in the hijos table body
        const sexo = $(this).find('.hijos-sexo').val();
        const edad = $(this).find('.hijos-edad').val();
        // Only add if at least one field is filled
        if (sexo || edad) {
            hijos.push({
                sexo: sexo,
                edad: edad > 0 ? parseInt(edad) : '' // Store age as number or empty string
            });
        }
    });
    // Store as stringified JSON
    return JSON.stringify(hijos);
}


/* --- Guardar/Editar Empleado --- */
// Assuming form has ID form-empleado
$('#form-empleado').on('submit', function(e) {
    e.preventDefault();
    console.log("Employee form submitted");

    let empleados = getEmpleados();
    let empleadoId = $('#empleado-id').val(); // Get ID from hidden field
    const isEditing = !!empleadoId; // Check if editing based on ID presence

    // Collect data from the form
    const nuevoEmpleado = {
        id: isEditing ? parseInt(empleadoId) : (empleados.length > 0 ? Math.max(...empleados.map(emp => emp.id || 0)) + 1 : 1), // Generate ID only if adding
        nombres: $('#empleado-nombres').val().trim(),
        apellidos: $('#empleado-apellidos').val().trim(),
        cedula: $('#empleado-cedula').val().trim(),
        telefono: $('#empleado-telefono').val().trim(),
        email: $('#empleado-email').val().trim(),
        cargo: $('#empleado-cargo').val().trim(),
        departamento: $('#empleado-departamento').val().trim(),
        contrato: $('#empleado-contrato').val(),
        salario: limpiarSalario($('#empleado-salario').val()), // Store cleaned salary
        nacimiento: $('#empleado-nacimiento').val(),
        ingreso: $('#empleado-ingreso').val(),
        direccion: $('#empleado-direccion').val().trim(),
        ciudad: $('#empleado-ciudad').val().trim(),
        barrio: $('#empleado-barrio').val().trim(),
        notas: $('#empleado-notas').val().trim(),
        emergencia_nombre: $('#empleado-emergencia-nombre').val().trim(),
        emergencia_telefono: $('#empleado-emergencia-telefono').val().trim(),
        emergencia_parentesco: $('#empleado-emergencia-parentesco').val().trim(),
        // Additional fields
        hijos: $('#empleado-hijos').val(),
        cuantos_hijos: parseInt($('#empleado-cuantos-hijos').val()) || 0,
        detalle_hijos: getDetalleHijosFromTabla(), // Get data from dynamic table
        con_quien_vive: $('#empleado-con-quien-vive').val(),
        esposo_nombre: $('#empleado-esposo-nombre').val().trim(),
        esposo_edad: parseInt($('#empleado-esposo-edad').val()) || '', // Store as number or empty string
        esposo_telefono: $('#empleado-esposo-telefono').val().trim(),
        estado_civil: $('#empleado-estado-civil').val(),
        eps: $('#empleado-eps').val().trim(),
        fondo_pensiones: $('#empleado-fondo_pensiones').val().trim(),
        tipo_sangre: $('#empleado-tipo-sangre').val(),
        licencia: $('#empleado-licencia').val(),
        licencia_categoria: $('#empleado-licencia-categoria').val().trim(),
        licencia_vencimiento: $('#empleado-licencia-vencimiento').val(),
        // File handling requires specific backend/API logic. For Local Storage, you might store filename/URL.
        // For now, just include placeholder fields.
        hoja_vida_nombre: isEditing ? empleados.find(emp => emp.id == empleadoId)?.hoja_vida_nombre || '' : '', // Keep existing filename if editing
        hoja_vida_url: isEditing ? empleados.find(emp => emp.id == empleadoId)?.hoja_vida_url || '' : '', // Keep existing URL if editing
    };

    // Basic validation (can add more complex validation)
    if (!nuevoEmpleado.nombres || !nuevoEmpleado.apellidos || !nuevoEmpleado.cedula || !nuevoEmpleado.telefono || !nuevoEmpleado.email || !nuevoEmpleado.cargo || !nuevoEmpleado.departamento || !nuevoEmpleado.ingreso) {
        mostrarAlerta('Completa los campos obligatorios.', 'danger');
        return;
    }

     // Check for duplicate cedula (excluding the employee being edited)
    const duplicateCedula = empleados.some(emp => emp.cedula === nuevoEmpleado.cedula && emp.id !== nuevoEmpleado.id);
    if (duplicateCedula) {
        mostrarAlerta(`Ya existe un empleado con la cédula ${nuevoEmpleado.cedula}.`, 'danger');
        return;
    }


    if (isEditing) {
        // Update existing employee
        empleados = empleados.map(emp => emp.id == empleadoId ? { ...emp, ...nuevoEmpleado } : emp);
        mostrarAlerta('Empleado actualizado', 'success');
    } else {
        // Add new employee
        empleados.push(nuevoEmpleado);
        mostrarAlerta('Empleado agregado', 'success');
    }

    setEmpleados(empleados); // Save updated array to Local Storage
    $('#nuevo-empleado-modal').modal('hide'); // Hide the modal

    // Re-render the employee table
    let session = getSession();
    renderTablaEmpleados(session ? session.rol : 'empleado'); // Pass role
});

// Listener for the modal's hidden.bs.modal event to reset the form when it's closed
$('#nuevo-empleado-modal').on('hidden.bs.modal', function () {
    console.log("Employee modal hidden. Resetting form.");
     // Reset the form when the modal is completely hidden
     $('#form-empleado')[0].reset();
     $('#empleado-id').val(''); // Clear hidden ID field
     // Reset conditional fields display and content
     $('#datos-esposo-esposa').hide();
     $('#empleado-licencia-categoria-div').addClass('d-none');
     $('#empleado-licencia-vencimiento-div').addClass('d-none');
     $('#cuantos-hijos-div').hide();
     $('#hijos-tabla-row').hide();
     $('#hijos-tabla tbody').empty(); // Clear children table body
});

// Listener for 'Editar' button in the employee list table
$(document).on('click', '.editar-empleado-btn', function() {
    console.log("Edit employee button clicked");
    let id = $(this).data('id');
    let empleado = getEmpleados().find(e => e.id == id);

    if (empleado) {
        // Populate the form with employee data
        $('#empleado-form-title').text('Editar Empleado'); // Update modal title
        $('#empleado-id').val(empleado.id); // Set hidden ID field
        $('#empleado-nombres').val(empleado.nombres);
        $('#empleado-apellidos').val(empleado.apellidos);
        $('#empleado-cedula').val(empleado.cedula);
        $('#empleado-telefono').val(empleado.telefono);
        $('#empleado-email').val(empleado.email);
        $('#empleado-cargo').val(empleado.cargo);
        $('#empleado-departamento').val(empleado.departamento);
        $('#empleado-contrato').val(empleado.contrato);
        $('#empleado-salario').val(empleado.salario); // Display stored salary
        $('#empleado-nacimiento').val(empleado.nacimiento);
        $('#empleado-ingreso').val(empleado.ingreso);
        $('#empleado-direccion').val(empleado.direccion);
        $('#empleado-ciudad').val(empleado.ciudad);
        $('#empleado-barrio').val(empleado.barrio);
        $('#empleado-notas').val(empleado.notas);
        $('#empleado-emergencia-nombre').val(empleado.emergencia_nombre);
        $('#empleado-emergencia-telefono').val(empleado.emergencia_telefono);
        $('#empleado-emergencia-parentesco').val(empleado.emergencia_parentesco);
        // Additional fields
        $('#empleado-hijos').val(empleado.hijos).trigger('change'); // Set value and trigger change
        $('#empleado-cuantos-hijos').val(empleado.cuantos_hijos).trigger('input'); // Set value and trigger input
        populateTablaHijos(empleado.detalle_hijos); // Populate hijos table

        $('#empleado-con-quien-vive').val(empleado.con_quien_vive);
        $('#empleado-estado-civil').val(empleado.estado_civil).trigger('change'); // Set value and trigger change
        $('#empleado-esposo-nombre').val(empleado.esposo_nombre);
        $('#empleado-esposo-edad').val(empleado.esposo_edad);
        $('#empleado-esposo-telefono').val(empleado.esposo_telefono);

        $('#empleado-eps').val(empleado.eps);
        $('#empleado-fondo_pensiones').val(empleado.fondo_pensiones);
        $('#empleado-tipo-sangre').val(empleado.tipo_sangre);
        $('#empleado-licencia').val(empleado.licencia).trigger('change'); // Set value and trigger change
        $('#empleado-licencia-categoria').val(empleado.licencia_categoria);
        $('#empleado-licencia-vencimiento').val(empleado.licencia_vencimiento);

         // File input cannot be programmatically set for security reasons.
         // You might want to display the current file name if it exists.
         // $('#empleado-hoja-vida').val(''); // Clear file input for security
         // Display current file name if needed
         // if(empleado.hoja_vida_nombre) { $('#current-hoja-vida').text(empleado.hoja_vida_nombre).show(); } else { $('#current-hoja-vida').hide(); }


        // Show the modal
         $('#nuevo-empleado-modal').modal('show');

    } else {
        mostrarAlerta('Empleado no encontrado para editar', 'danger');
    }
});

// Listener for 'Editar' button in the employee detail modal footer
// This button's data-id is set when the detail modal is shown.
$('#editar-empleado-detalle-btn').on('click', function() {
      let id = $(this).data('id');
      console.log("Edit button clicked in detail modal for ID:", id);
      // Close the detail modal first
      $('#detalle-empleado-modal').modal('hide'); // Use Bootstrap's modal method

      // Trigger the edit logic which will populate and show the form modal
      // We can directly call the edit logic function with the ID
      const empleado = getEmpleados().find(e => e.id == id);
      if (empleado) {
          // Populate the form modal and show it
          $('#empleado-form-title').text('Editar Empleado'); // Update modal title
          $('#empleado-id').val(empleado.id); // Set hidden ID field
          $('#empleado-nombres').val(empleado.nombres);
          $('#empleado-apellidos').val(empleado.apellidos);
          $('#empleado-cedula').val(empleado.cedula);
          $('#empleado-telefono').val(empleado.telefono);
          $('#empleado-email').val(empleado.email);
          $('#empleado-cargo').val(empleado.cargo);
          $('#empleado-departamento').val(empleado.departamento);
          $('#empleado-contrato').val(empleado.contrato);
          $('#empleado-salario').val(empleado.salario); // Display stored salary
          $('#empleado-nacimiento').val(empleado.nacimiento);
          $('#empleado-ingreso').val(empleado.ingreso);
          $('#empleado-direccion').val(empleado.direccion);
          $('#empleado-ciudad').val(empleado.ciudad);
          $('#empleado-barrio').val(empleado.barrio);
          $('#empleado-notas').val(empleado.notas);
          $('#empleado-emergencia-nombre').val(empleado.emergencia_nombre);
          $('#empleado-emergencia-telefono').val(empleado.emergencia_telefono);
          $('#empleado-emergencia-parentesco').val(empleado.emergencia_parentesco);
          // Additional fields
          $('#empleado-hijos').val(empleado.hijos).trigger('change'); // Set value and trigger change
          $('#empleado-cuantos-hijos').val(empleado.cuantos_hijos).trigger('input'); // Set value and trigger input
          populateTablaHijos(empleado.detalle_hijos); // Populate hijos table

          $('#empleado-con-quien-vive').val(empleado.con_quien_vive);
          $('#empleado-estado-civil').val(empleado.estado_civil).trigger('change'); // Set value and trigger change
          $('#empleado-esposo-nombre').val(empleado.esposo_nombre);
          $('#empleado-esposo-edad').val(empleado.esposo_edad);
          $('#empleado-esposo-telefono').val(empleado.esposo_telefono);

          $('#empleado-eps').val(empleado.eps);
          $('#empleado-fondo_pensiones').val(empleado.fondo_pensiones);
          $('#empleado-tipo-sangre').val(empleado.tipo_sangre);
          $('#empleado-licencia').val(empleado.licencia).trigger('change'); // Set value and trigger change
          $('#empleado-licencia-categoria').val(empleado.licencia_categoria);
          $('#empleado-licencia-vencimiento').val(empleado.licencia_vencimiento);

           // File input cannot be programmatically set for security reasons.
           // You might want to display the current file name if it exists.
           // $('#empleado-hoja-vida').val(''); // Clear file input for security
           // Display current file name if needed
           // if(empleado.hoja_vida_nombre) { $('#current-hoja-vida').text(empleado.hoja_vida_nombre).show(); } else { $('#current-hoja-vida').hide(); }


          // Show the form modal
           $('#nuevo-empleado-modal').modal('show');

      } else {
          mostrarAlerta('Empleado no encontrado para editar', 'danger');
      }
});


// Listener for 'Eliminar' button in the employee list table
$(document).on('click', '.eliminar-empleado-btn', function() {
    let id = $(this).data('id');
    // Use Bootstrap confirmation modal instead of native confirm if preferred
    if (confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
        let empleados = getEmpleados();
        let filteredEmpleados = empleados.filter(e => e.id != id);
        setEmpleados(filteredEmpleados);
        mostrarAlerta('Empleado eliminado', 'success');
        let session = getSession();
        renderTablaEmpleados(session ? session.rol : 'empleado'); // Re-render the table, pass role
    }
});


// --- Renderizar detalle de empleado (Populates the modal body) ---
// Assuming the modal body content element is #detalle-empleado-content
function renderDetalleEmpleado(id, rol) {
    console.log("Rendering employee detail for ID:", id, "role:", rol);
    let e = getEmpleados().find(emp => emp.id == id);
    if (!e) {
         $('#detalle-empleado-content').html('<p class="text-danger">Error: Empleado no encontrado.</p>');
         $('#editar-empleado-detalle-btn').addClass('d-none'); // Hide edit button if not found
         return;
    }

    let hijosDetalle = '<i>(No tiene hij@s)</i>';
    if (e.hijos === 'Sí' && e.detalle_hijos) {
        try {
             let detalle = JSON.parse(e.detalle_hijos);
             if (Array.isArray(detalle) && detalle.length > 0) {
                 hijosDetalle = detalle.map((h, i) => `Hijo ${i+1}: Sexo: ${h.sexo || '-'}, Edad: ${h.edad > 0 ? h.edad + ' años' : '-'}`).join('<br>');
             } else {
                 hijosDetalle = '<i>(Detalle de hijos no especificado)</i>';
             }
        } catch (error) {
            console.error("Error parsing hijos detalle for view:", error);
            hijosDetalle = '<i>(Error al cargar detalle de hijos)</i>';
        }
    }

    let hojaVidaLink = (e.hoja_vida_url && e.hoja_vida_nombre) ? `<a href="${e.hoja_vida_url}" target="_blank">${e.hoja_vida_nombre}</a>` : '<i>(No disponible)</i>';

    let esposoDetalle = '<i>(No aplica)</i>';
    if (e.estado_civil === 'Casado' || e.estado_civil === 'Divorciado' || e.estado_civil === 'Union Libre') { // Use values consistent with HTML form options
         esposoDetalle = `Nombre: ${e.esposo_nombre || '-'}, Edad: ${e.esposo_edad > 0 ? e.esposo_edad + ' años' : '-'}, Teléfono: ${e.esposo_telefono || '-'}`;
    }


    let html = `
        <div class="row">
            <div class="col-md-4 text-center">
                <img src="https://via.placeholder.com/150" class="rounded-circle mb-3" alt="Foto de Empleado">
                <h5>${e.nombres || ''} ${e.apellidos || ''}</h5>
                <p class="text-muted">${e.cargo || ''}</p>
                </div>
            <div class="col-md-8">
                <h6>Información de Contacto</h6>
                <p><strong>Cédula:</strong> ${e.cedula || ''}</p>
                <p><strong>Teléfono:</strong> ${e.telefono || ''}</p>
                <p><strong>Email:</strong> ${e.email || ''}</p>
                <p><strong>Dirección:</strong> ${e.direccion || ''}, ${e.barrio || ''}, ${e.ciudad || ''}</p>


                <h6 class="mt-4">Información de Empleo</h6>
                <p><strong>Departamento:</strong> ${e.departamento || ''}</p>
                <p><strong>Tipo de Contrato:</strong> ${e.contrato || ''}</p>
                <p><strong>Fecha de Ingreso:</strong> ${e.ingreso || ''}</p>
                <p><strong>Antigüedad:</strong> ${calcularAntiguedad(e.ingreso)}</p>
                 ${rol === 'admin' ? `<p><strong>Salario:</strong> ${formatearMoneda(e.salario)}</p>` : ''}


                <h6 class="mt-4">Información Personal y Familiar</h6>
                 <p><strong>Fecha de Nacimiento:</strong> ${e.nacimiento || ''} ${e.nacimiento ? `(${diasParaCumple(e.nacimiento)} días para el cumple)` : ''}</p>
                 <p><strong>Estado civil:</strong> ${e.estado_civil || ''}</p>
                 <p><strong>Espos@:</strong> ${esposoDetalle}</p>
                 <p><strong>¿Tiene hij@s?:</strong> ${e.hijos || ''}</p>
                 ${e.hijos === 'Sí' ? `<p><strong>¿Cuántos?:</strong> ${e.cuantos_hijos > 0 ? e.cuantos_hijos : 'No especificado'}</p>` : ''}
                 ${e.hijos === 'Sí' ? `<p><strong>Detalle de hij@s:</strong><br>${hijosDetalle}</p>` : ''}
                 <p><strong>¿Con quién vive?:</strong> ${e.con_quien_vive || ''}</p>

                <h6 class="mt-4">Salud y Documentación</h6>
                 <p><strong>EPS:</strong> ${e.eps || ''}</p>
                 <p><strong>Fondo de pensiones:</strong> ${e.fondo_pensiones || ''}</p>
                 <p><strong>Tipo de Sangre:</strong> ${e.tipo_sangre || ''}</p>
                 <p><strong>Licencia de conducción:</strong> ${e.licencia || ''} ${e.licencia === 'Sí' ? `- Categoría: ${e.licencia_categoria || '-'} - Vence: ${e.licencia_vencimiento || '-'}` : ''}</p>
                 <p><strong>Hoja de Vida:</strong> ${hojaVidaLink}</p>
                <p><strong>Notas Adicionales:</strong> ${e.notas || ''}</p>

                 <h6 class="mt-4">Contacto de Emergencia</h6>
                 <p><strong>Nombre:</strong> ${e.emergencia_nombre || ''}</p>
                 <p><strong>Teléfono:</strong> ${e.emergencia_telefono || ''}</p>
                 <p><strong>Parentesco:</strong> ${e.emergencia_parentesco || ''}</p>

            </div>
        </div>
    `;
    $('#detalle-empleado-content').html(html); // Populate the modal's content div

     // Update the edit button data-id in the modal footer
     $('#editar-empleado-detalle-btn').data('id', e.id);

     // Control visibility of edit button
     if (rol === 'admin') {
         $('#editar-empleado-detalle-btn').removeClass('d-none');
     } else {
         $('#editar-empleado-detalle-btn').addClass('d-none');
     }
}

/* --- Renderizar tabla de cumpleaños --- */
let tablaCumpleanos; // Declare variable
// Assumes #tabla-cumpleanos is within #cumpleanos-list section
function renderTablaCumpleanos() {
    console.log("Rendering Birthday Table");
    let empleados = getEmpleados();
    let lista = empleados
        .filter(e => e.nacimiento) // Only include employees with a birth date
        .map(e => ({
            nombre: `${e.nombres || ''} ${e.apellidos || ''}`,
            nacimiento: e.nacimiento || '',
            dias: diasParaCumple(e.nacimiento) // Calculate days
        }))
        // Filter out invalid birth dates (where diasParaCumple returned '') and those that already passed this year
        .filter(e => e.dias !== '' && e.dias >= 0)
        .sort((a, b) => a.dias - b.dias); // Sort by days remaining

    // Destroy previous DataTable instance if it exists
    if (tablaCumpleanos) {
        tablaCumpleanos.destroy();
         $('#tabla-cumpleanos tbody').empty(); // Clear tbody manually
    }

    // Initialize DataTable
    tablaCumpleanos = $('#tabla-cumpleanos').DataTable({
        destroy: true,
         data: lista, // Provide data array directly
         columns: [
             { data: 'nombre' },
             { data: 'nacimiento' },
             { data: 'dias' }
         ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' // Ensure HTTPS here
        },
        paging: true,
        searching: true,
        info: true,
        ordering: true
    });
}

/* --- Renderizar tabla de licencias próximas a vencer --- */
let tablaLicencias; // Declare variable
// Assumes #tabla-licencias is within #licencias-list section
function renderTablaLicencias() {
    console.log("Rendering License Table");
    let empleados = getEmpleados();
    let hoy = new Date();
    let lista = empleados
        .filter(e => e.licencia === 'Sí' && e.licencia_vencimiento) // Only include employees with a license and expiration date
        .map(e => {
            let vencimientoDate = new Date(e.licencia_vencimiento + 'T00:00:00'); // Parse as local date
            // Handle invalid dates
            if (isNaN(vencimientoDate.getTime())) {
                return null; // Filter out invalid dates later
            }
             let diffTime = vencimientoDate.getTime() - hoy.getTime();
             let dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculate days remaining

            return {
                nombre: `${e.nombres || ''} ${e.apellidos || ''}`,
                vencimiento: e.licencia_vencimiento || '',
                dias: dias, // Calculated days
                categoria: e.licencia_categoria || ''
            };
        })
        .filter(e => e !== null && e.dias >= 0 && e.dias <= 365) // Filter for valid dates and those expiring within a year (adjust range as needed)
        .sort((a, b) => a.dias - b.dias); // Sort by days remaining

    // Destroy previous DataTable instance if it exists
    if (tablaLicencias) {
        tablaLicencias.destroy();
         $('#tabla-licencias tbody').empty(); // Clear tbody manually
    }

    // Initialize DataTable
    tablaLicencias = $('#tabla-licencias').DataTable({
        destroy: true,
         data: lista, // Provide data array directly
         columns: [
             { data: 'nombre' },
             { data: 'vencimiento' },
             { data: 'dias' },
             { data: 'categoria' }
         ],
        language: {
             url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' // Ensure HTTPS here
        },
        paging: true,
        searching: true,
        info: true,
        ordering: true
    });
}


/* --- Gestión del tema oscuro/claro --- */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Actualizar icono
    const icon = $('#toggle-theme i'); // Assuming button has ID toggle-theme and contains an <i>
    if (icon.length) { // Check if the icon element exists
        if (newTheme === 'dark') {
            icon.removeClass('bi-moon-stars').addClass('bi-sun');
        } else {
            icon.removeClass('bi-sun').addClass('bi-moon-stars');
        }
    }

    // Note: You might need to re-render charts or other elements that use theme-dependent colors
    // renderGraficos(); // Example - Pass data if needed
}

// Listener for theme toggle button (assuming button has ID toggle-theme)
$('#toggle-theme').on('click', toggleTheme);


/* --- Listeners for SPA Navigation Links --- */
// Assumes navigation links have class 'spa-link' and href="#section-id"
$(document).on('click', '.spa-link', function(e) {
    e.preventDefault(); // Prevent default anchor click behavior
    const targetId = $(this).attr('href').substring(1); // Get section ID from href="#section-id"
    console.log("SPA link clicked. Target ID:", targetId);

    // Check if the target is a known SPA section ID
    // Add all your section IDs here
    const spaSections = ['dashboard', 'empleados', 'documentacion', 'encuestas', 'objetivos', 'beneficios', 'capacitaciones', 'evaluaciones', 'nomina', 'vacaciones', 'horarios', 'incidencias', 'cumpleanos-list', 'licencias-list', 'login', 'registro']; // Include login/registro if they are part of SPA flow

    if (spaSections.includes(targetId)) {
         // Before showing a new section, perform necessary cleanup or data loading
         let session = getSession(); // Get current session info

         // Logic to handle specific sections on navigation
         if (targetId === 'empleados') {
             renderTablaEmpleados(session ? session.rol : 'empleado'); // Render the employee table
         } else if (targetId === 'cumpleanos-list') {
             renderTablaCumpleanos(); // Render the birthdays table
         } else if (targetId === 'licencias-list') {
             renderTablaLicencias(); // Render the licenses table
         } else if (targetId === 'dashboard') { // Ensure dashboard renders when navigated via link
             if(session) renderDashboard(session.rol);
         }
          // Add similar checks for other sections that need initial data loading/rendering
          // Example: if (targetId === 'vacaciones') { renderTablaVacaciones(); }
          // Example: if (targetId === 'nomina') { renderTablaNomina(); }


         mostrarSeccion(targetId); // Use the function to show/hide sections


    } else {
        console.warn("Clicked link does not map to a known SPA section:", targetId);
        // Optionally handle links that might point elsewhere or open modals differently
    }
});


// Note: Modals should be triggered via data-bs-toggle="modal" and data-bs-target="#modal-id"
// in the HTML buttons/links themselves. The JS only needs to populate modal content
// when the modal is about to be shown (using the 'show.bs.modal' event).

// Example: Listener for the 'Nueva Solicitud' modal in Vacaciones section
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-solicitud-modal"
$('#nueva-solicitud-modal').on('show.bs.modal', function(event) {
     console.log("Modal Nueva Solicitud Vacaciones Shown");
    // Optional: Clear form or populate initial data here
     $('#nueva-solicitud-form')[0].reset();
    // Example: pre-populate employee name/ID if applicable
    // let session = getSession();
    // if (session && session.empleadoId) { // Assuming session stores employee ID
    //      $('#solicitud-empleado-id').val(session.empleadoId);
    // }
});

// Example: Listener for the 'Ver Calendario' modal in Vacaciones section
// Assuming the button has data-bs-toggle="modal" data-bs-target="#calendario-modal"
$('#calendario-modal').on('show.bs.modal', function(event) {
    console.log("Calendario Modal Shown - Calendar initialization logic needed here.");
    // Initialize your calendar library (e.g., FullCalendar) inside the modal body #calendario-vacaciones
    // let calendarEl = document.getElementById('calendario-vacaciones');
    // let calendar = new FullCalendar.Calendar(calendarEl, {
    //     initialView: 'dayGridMonth', // Example view
    //     // ... other calendar options ...
    // });
    // calendar.render();
    // Load absence data and add events to the calendar
    // let ausencias = getAusencias();
    // let events = ausencias.map(a => ({ title: a.tipo, start: a.fechaInicio, end: a.fechaFin }));
    // calendar.addEventSource(events);
});

// Example: Listener for 'Nueva Nomina' modal
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-nomina-modal"
$('#nueva-nomina-modal').on('show.bs.modal', function(event) {
      console.log("Modal Nueva Nomina Shown");
      $('#nueva-nomina-form')[0].reset();
});

// Example: Listener for 'Recibo Nomina' modal (from table action)
// Assuming the button has data-bs-toggle="modal" data-bs-target="#recibo-nomina-modal"
$('#recibo-nomina-modal').on('show.bs.modal', function(event) {
      console.log("Recibo Nomina Modal Shown - Populate details here.");
      // Populate receipt details based on the employee/payroll data associated with the clicked button
      // const button = $(event.relatedTarget);
      // const payrollId = button.data('id'); // Assuming data-id holds payroll ID
      // const employeeId = button.data('employee-id'); // Assuming data-employee-id holds employee ID
      // Fetch payroll/employee data and populate modal body #recibo-nomina-content
});

// Example: Listener for 'Nueva Incidencia' modal
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-incidencia-modal"
$('#nueva-incidencia-modal').on('show.bs.modal', function(event) {
     console.log("Modal Nueva Incidencia Shown");
     $('#nueva-incidencia-form')[0].reset();
});

// Example: Listener for 'Detalle Incidencia' modal (from table action)
// Assuming the button has data-bs-toggle="modal" data-bs-target="#detalle-incidencia-modal"
$('#detalle-incidencia-modal').on('show.bs.modal', function(event) {
     console.log("Detalle Incidencia Modal Shown - Populate details here.");
     // Populate incident details based on the data associated with the clicked button
     // const button = $(event.relatedTarget);
     // const incidentId = button.data('id');
     // Fetch incident data and populate modal body #detalle-incidencia-content
});

// Add similar listeners for other modals to clear forms or load specific data before they are shown.
// For example, modals for Documentacion, Encuestas, Objetivos, Beneficios, Capacitaciones, Evaluaciones, Horarios.


// --- Main Document Ready Block ---
$(document).ready(function() {
    console.log("Document is ready. Starting app initialization.");

    // Load saved theme on document ready
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    // Ensure the icon is set correctly on load based on saved theme
    const icon = $('#toggle-theme i');
    if (icon.length) {
        if (savedTheme === 'dark') {
            icon.removeClass('bi-moon-stars').addClass('bi-sun');
        } else {
            icon.removeClass('bi-sun').addClass('bi-moon-stars');
        }
    }

    // Initialize default data if needed
    initDatos();

    // Check session and show the appropriate section
    let session = getSession();
    if (session) {
        console.log("Session found. Showing dashboard.");
        mostrarSeccion('dashboard'); // Go to dashboard if session exists
        renderDashboard(session.rol); // Render dashboard content
    } else {
        console.log("No session found. Showing login.");
        mostrarSeccion('login'); // Go to login if no session
    }

    /* --- Configuración GLOBAL de DataTables en español --- */
    // --->> ESTE BLOQUE DEBE ESTAR DENTRO DE $(document).ready <<---
    console.log("Configuring DataTables defaults.");
    if ($.fn.dataTable) { // Check if DataTables is loaded
         $.extend(true, $.fn.dataTable.defaults, {
             language: {
                 // Use HTTPS explicitly for CDN link
                 url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
             }
         });
         console.log("DataTables defaults configured.");
    } else {
         console.error("DataTables is not loaded. Cannot configure defaults.");
         mostrarAlerta('Error: DataTables no cargado. Las tablas no funcionarán.', 'danger');
    }
    // --->> FIN DEL BLOQUE DE CONFIGURACIÓN DE DATATABLES <<---


     // Initial render of tables that might be visible on the initial section (e.g., if dashboard shows a table)
     // Or if you deep link to #empleados etc. The SPA link listener also triggers rendering.
     // If your default section (dashboard) contains tables, you might need to render them here too.
     // renderTablaEmpleados(session ? session.rol : 'empleado'); // Only if employees table is on dashboard


}); // <--- FIN DEL BLOQUE $(document).ready aquí


// Note: Listeners defined using $(document).on('event', 'selector', ...)
// can be defined outside the $(document).ready block, as delegation
// handles elements that might be added to the DOM later.
// Direct element listeners like $('#id').on('event', ...) should ideally
// be inside $(document).ready if the element is in the initial HTML.
// However, the critical point was the $.extend call's placement.

// Example: Direct listener for a static button (if not using delegation)
// $('#sidebarToggle').on('click', function(e) {
//     e.preventDefault();
//     $('#wrapper').toggleClass('toggled');
// });
// But the SPA link listener should handle sidebar hide on mobile after navigation.
// A separate toggle for desktop/mobile sidebar is also needed, handled by Bootstrap template JS usually.
// The HTML snippet for the sidebar toggle was already there, handled by Bootstrap or custom CSS/JS.


// Listener for sidebar toggle button (assuming button has ID sidebarToggle)
// This should ideally toggle the 'toggled' class on #wrapper
$('#sidebarToggle').on('click', function(e) {
    e.preventDefault();
    $('#wrapper').toggleClass('toggled');
     console.log("Sidebar toggled");
});

// --- End of app.js ---