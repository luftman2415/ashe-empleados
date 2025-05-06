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
    return JSON.parse(localStorage.getItem(LS_KEYS.USUARIOS)) || [];
}
function setUsuarios(arr) {
    localStorage.setItem(LS_KEYS.USUARIOS, JSON.stringify(arr));
}
function getEmpleados() {
    // Ensure detailed fields exist for existing employees if needed
    const empleados = JSON.parse(localStorage.getItem(LS_KEYS.EMPLEADOS)) || [];
    // Add default values for new fields if loading old data
    return empleados.map(emp => ({
        detalle_hijos: '[]', // Ensure this field exists and is a stringified array
        esposo_nombre: '',
        esposo_edad: '',
        esposo_telefono: '',
        estado_civil: '',
        eps: '',
        fondo_pensiones: '',
        tipo_sangre: '',
        licencia: 'No', // Default to No
        licencia_categoria: '',
        licencia_vencimiento: '',
        hoja_vida_nombre: '',
        hoja_vida_url: '',
        ...emp // Spread existing properties
    }));
}
function setEmpleados(arr) {
    localStorage.setItem(LS_KEYS.EMPLEADOS, JSON.stringify(arr));
}
function getAusencias() {
    return JSON.parse(localStorage.getItem(LS_KEYS.AUSENCIAS)) || [];
}
function setAusencias(arr) {
    localStorage.setItem(LS_KEYS.AUSENCIAS, JSON.stringify(arr));
}
function getSession() {
    return JSON.parse(localStorage.getItem(LS_KEYS.SESSION));
}
function setSession(obj) {
    localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(obj));
}
function clearSession() {
    localStorage.removeItem(LS_KEYS.SESSION);
}

// --- Inicialización de datos por defecto ---
function initDatos() {
    if (!localStorage.getItem(LS_KEYS.USUARIOS)) {
        setUsuarios([{ email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }]);
    }
    if (!localStorage.getItem(LS_KEYS.EMPLEADOS)) {
         // Initialize with some dummy data including new fields
         setEmpleados([
            {
                id: 1, nombres: 'Juan', apellidos: 'Pérez', cedula: '123456789', telefono: '555-1111', email: 'juan.perez@empresa.com', cargo: 'Representante de Ventas', departamento: 'Ventas', contrato: 'Indefinido', salario: '1500000', nacimiento: '1990-05-15', ingreso: '2022-03-15', direccion: 'Calle Falsa 123', ciudad: 'Bogotá', barrio: 'Centro', notas: '', emergencia_nombre: 'Ana Pérez', emergencia_telefono: '555-1112', emergencia_parentesco: 'Hermana', hijos: 'Sí', cuantos_hijos: '2', detalle_hijos: JSON.stringify([{sexo: 'Masculino', edad: '5'}, {sexo: 'Femenino', edad: '8'}]), con_quien_vive: 'Familia', esposo_nombre: '', esposo_edad: '', esposo_telefono: '', estado_civil: 'Solter@', eps: 'Salud Total', fondo_pensiones: 'Protección', tipo_sangre: 'O+', licencia: 'Sí', licencia_categoria: 'B1', licencia_vencimiento: '2025-12-31', hoja_vida_nombre: '', hoja_vida_url: ''
            },
             {
                id: 2, nombres: 'María', apellidos: 'García', cedula: '987654321', telefono: '555-2222', email: 'maria.garcia@empresa.com', cargo: 'Generalista de RRHH', departamento: 'Recursos Humanos', contrato: 'Indefinido', salario: '1800000', nacimiento: '1985-08-20', ingreso: '2021-01-10', direccion: 'Avenida Siempreviva 742', ciudad: 'Medellín', barrio: 'El Poblado', notas: 'Experta en nómina', emergencia_nombre: 'Pedro García', emergencia_telefono: '555-2223', emergencia_parentesco: 'Hermano', hijos: 'No', cuantos_hijos: '0', detalle_hijos: '[]', con_quien_vive: 'Solo', esposo_nombre: 'Carlos Rodríguez', esposo_edad: '40', esposo_telefono: '555-2224', estado_civil: 'Casad@', eps: 'Sura', fondo_pensiones: 'Porvenir', tipo_sangre: 'A-', licencia: 'No', licencia_categoria: '', licencia_vencimiento: '', hoja_vida_nombre: '', hoja_vida_url: ''
            }
         ]);
    }
    if (!localStorage.getItem(LS_KEYS.AUSENCIAS)) {
        setAusencias([]);
    }
}
/* --- SPA: Mostrar/Ocultar Secciones --- */
// Modificada para manejar solo secciones SPA
function mostrarSeccion(id) {
    // Oculta todas las secciones SPA
    $('.spa-section').addClass('d-none');
    // Muestra la sección solicitada
    $('#' + id).removeClass('d-none');

    // Actualiza el título de la sección
    const sectionTitleElement = document.getElementById('section-title');
    const targetSection = document.getElementById(id);
    if (targetSection) {
        const h4Title = targetSection.querySelector('h4');
        if (h4Title) {
            sectionTitleElement.innerText = h4Title.innerText;
        } else {
             // Fallback if no h4, maybe use link text or default
             const navLink = document.querySelector(`.spa-link[href="#${id}"]`);
             if(navLink) sectionTitleElement.innerText = navLink.innerText;
             else sectionTitleElement.innerText = 'Sistema de Gestión de RRHH'; // Default title
        }
    }


    // Actualiza la clase 'active' en el sidebar
    $('.spa-link').removeClass('active');
    $(`.spa-link[href="#${id}"]`).addClass('active');


    // Controla la visibilidad del botón de logout (asumiendo que solo se oculta en login/registro)
    if (id === 'login' || id === 'registro') { // Use IDs consistent with HTML structure
        $('#logout-btn').addClass('d-none');
    } else {
        $('#logout-btn').removeClass('d-none');
    }

     // Oculta el sidebar en móviles después de la navegación
     if (window.innerWidth <= 768) { // Ajustar breakpoint si es necesario
         $('#wrapper').removeClass('toggled');
     }
}


/* --- Breadcrumb dinámico (no usado en el HTML proporcionado, pero mantenido) --- */
// function actualizarBreadcrumb(id) {
//     const map = {
//         'login-form': 'Iniciar Sesión',
//         'registro-form': 'Registro',
//         'dashboard': 'Dashboard',
//         'empleados-list': 'Empleados', // Corrected ID based on section
//         'empleado-form': 'Formulario de Empleado', // Corrected ID based on section
//         'empleado-detalle': 'Detalle de Empleado', // Corrected ID based on section - Note: this is a modal in HTML
//         'cumpleanos-list': 'Próximos Cumpleaños', // Corrected ID based on new section
//         'licencias-list': 'Licencias próximas a vencer', // Corrected ID based on new section
//         'ausencias-list': 'Gestión de Ausencias', // Example, if this section existed
//         'documentacion': 'Documentación y Manuales', // Added section
//         'encuestas': 'Encuestas y Feedback', // Added section
//         'objetivos': 'Objetivos y Metas', // Added section
//         'beneficios': 'Beneficios y Compensaciones', // Added section
//         'capacitaciones': 'Capacitaciones y Desarrollo', // Added section
//         'evaluaciones': 'Evaluaciones de Desempeño', // Added section
//         'nomina': 'Gestión de Nómina', // Added section
//         'vacaciones': 'Gestión de Vacaciones', // Added section
//         'horarios': 'Gestión de Horarios', // Added section
//         'incidencias': 'Gestión de Incidencias' // Added section
//     };
//      // Assuming '#breadcrumb-container' exists somewhere in the HTML
//     $('#breadcrumb-container').html(`<nav aria-label="breadcrumb"><ol class="breadcrumb mb-0"><li class="breadcrumb-item active">${map[id] || 'Página'}</li></ol></nav>`);
// }

/* --- Alertas temporales --- */
// Asumiendo que tienes un div con id="alert-container" en tu HTML (no estaba en los snippets, lo añadí en el HTML completo)
function mostrarAlerta(msg, tipo = 'success', tiempo = 3000) {
    const id = 'alert-' + Date.now();
    $('#alert-container').append(`<div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`);
    setTimeout(() => $('#' + id).remove(), tiempo); // Use .remove() instead of .alert('close') for direct cleanup
}

/* --- Mostrar/Ocultar contraseña --- */
$(document).on('click', '.toggle-password', function() {
    const target = $(this).data('target');
    const input = $('#' + target);
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
    if (!valor) return '';
    // Remueve puntos (separador de miles en Colombia) y reemplaza la coma (separador decimal) por punto
    return valor.replace(/\./g, '').replace(',', '.');
}
function formatearMoneda(valor) {
    if (!valor) return '';
    // Asegura que el valor es un número después de limpiar
    let num = Number(limpiarSalario(valor));
    if (isNaN(num)) return valor; // Retorna el valor original si no es un número válido después de limpiar
    // Usa toLocaleString con configuración para pesos colombianos
    return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 }); // Ajuste de decimales
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
    if (años === 0) return 'Menos de 1 año'; // O podrías calcular meses si prefieres

    return años;
}

/* --- Calcular días restantes para cumpleaños --- */
function diasParaCumple(fechaNacimiento) {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

     // Validación básica de fecha
    if (isNaN(nacimiento.getTime())) {
        return ''; // O manejar como error
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
    mostrarSeccion('login'); // Ensure this matches the login section ID
    mostrarAlerta('Sesión cerrada', 'info');
    // Ocultar elementos protegidos si existen
    // $('.admin-only').addClass('d-none');
});

/* --- Login --- */
// Assuming your login section has id="login"
$('#login form').on('submit', function(e) { // Use the section ID 'login'
    e.preventDefault();
    let email = $('#login-email').val().trim();
    let password = $('#login-password').val();
    let usuarios = getUsuarios();
    let user = usuarios.find(u => u.email === email && u.password === password);
    if (user) {
        setSession({ email: user.email, rol: user.rol });
        mostrarAlerta('Bienvenido/a', 'success');
        mostrarSeccion('dashboard'); // Ensure this matches the dashboard section ID
        // Redireccionar o mostrar la primera sección de la app
        renderDashboard(user.rol); // Render dashboard content based on role
         // Mostrar elementos basados en el rol si es necesario
        // if (user.rol === 'admin') { $('.admin-only').removeClass('d-none'); }
    } else {
        mostrarAlerta('Credenciales incorrectas', 'danger');
    }
});

/* --- Registro --- */
// Assuming your registration section has id="registro"
$('#show-register-link').on('click', function(e) {
    e.preventDefault();
    mostrarSeccion('registro'); // Use the section ID 'registro'
});
$('#cancel-register-btn').on('click', function() {
    mostrarSeccion('login'); // Go back to login section
});
$('#registro form').on('submit', function(e) { // Use the section ID 'registro'
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
    // Save with a default role, e.g., 'empleado'
    usuarios.push({ email, password, rol: 'empleado' });
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
            let vencimientoDate = new Date(e.licencia_vencimiento);
            if (isNaN(vencimientoDate.getTime())) return false; // Skip invalid dates
            let dias = Math.ceil((vencimientoDate - hoy) / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 30; // Include today and next 30 days
        }
        return false;
    });
     // Assuming a counter for expiring licenses exists
    // $('#licencias-por-vencer').text(licencias.length); // Uncomment if you add this counter

    // Listado de licencias en el dashboard (Ensure this ID exists in your Dashboard HTML)
    let listaLic = licencias.map(e =>
        `<li class="list-group-item">${e.nombres} ${e.apellidos} - Vence: ${e.licencia_vencimiento}</li>`
    ).join('');
    $('#lista-licencias-dashboard').html(listaLic || '<li class="list-group-item text-muted">Sin licencias próximas a vencer</li>');

    // Notificaciones de cumpleaños (Ensure this ID exists in your Dashboard HTML)
    let notis = cumpleanos.map(e => `<div class="alert alert-info mb-1 p-2"><b>${e.nombres} ${e.apellidos}</b> cumple años en ${diasParaCumple(e.nacimiento)} días (${e.nacimiento})</div>`).join('');
    $('#cumpleanos-notificaciones').html(notis);

    // Renderizar gráficos (Placeholder function)
    renderGraficos();

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

// Placeholder for renderGraficos function
function renderGraficos() {
    console.log("renderGraficos function called - charting logic needed here.");
    // Implement charting logic using a library like Chart.js
    // Example:
    // const ctx = document.getElementById('myChartCanvas').getContext('2d');
    // new Chart(ctx, { ... });
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
    renderTablaHijos(); // Clear hijos table
    // Show the employee form section
    mostrarSeccion('empleado-form'); // Ensure this matches the employee form section ID
});

// Assuming these buttons exist in your Dashboard HTML
$('#ver-empleados-btn').on('click', function() {
    mostrarSeccion('empleados'); // Show the employee list section (using section ID)
    let session = getSession();
    renderTablaEmpleados(session ? session.rol : 'empleado'); // Render the table
});

// Assuming this button exists and is only for admin (handled in renderDashboard visibility)
$('#exportar-csv-btn').on('click', function() {
    exportarEmpleadosCSV();
});

/* --- Botones para ver cumpleaños y licencias (Listeners added) --- */
// Assuming these buttons exist in your Dashboard HTML
$('#ver-cumpleanos-btn').on('click', function() {
    mostrarSeccion('cumpleanos-list'); // Show the new birthdays section
    renderTablaCumpleanos(); // Render the birthdays table
});
$('#ver-licencias-btn').on('click', function() {
    mostrarSeccion('licencias-list'); // Show the new licenses section
    renderTablaLicencias(); // Render the licenses table
});

/* --- Botones para regresar al dashboard --- */
// Assuming these buttons exist in the new birthday/license sections
$('#volver-dashboard-cumpleanos-btn').on('click', function() {
    mostrarSeccion('dashboard'); // Go back to dashboard
    let session = getSession();
    if (session) {
        renderDashboard(session.rol);
    }
});
$('#volver-dashboard-licencias-btn').on('click', function() {
    mostrarSeccion('dashboard'); // Go back to dashboard
    let session = getSession();
    if (session) {
        renderDashboard(session.rol);
    }
});


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
        Object.keys(emp).forEach(key => allKeys.add(key));
    });
    let encabezado = Array.from(allKeys); // Use all collected keys

    let csv = [encabezado.join(',')];
    empleados.forEach(e => {
        let fila = encabezado.map(k => {
            let value = e[k] === undefined || e[k] === null ? '' : e[k];
             // Handle potential stringified JSON fields
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                 try { value = JSON.parse(value); } catch(e) {} // Attempt to parse
            }
             // Simple string conversion for CSV, handle quotes
            return `"${(value.toString().replace(/"/g, '""'))}"`;
        });
        csv.push(fila.join(','));
    });
    let blob = new Blob([csv.join('\r\n')], { type: 'text/csv' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'empleados.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* --- Renderizar filtros de departamento y antigüedad --- */
// Assuming filter elements exist in the employee list section
function renderFiltrosEmpleados(empleados) {
    // Normaliza los nombres de departamento para evitar duplicados y problemas de comparación
    let departamentos = [...new Set(
        empleados
            .map(e => (e.departamento || '').trim())
            .filter(Boolean)
            .map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()) // Normalize capitalization
    )].sort(); // Sort departments alphabetically
    $('#filtro-departamento').html('<option value="">Todos</option>' + departamentos.map(d => `<option value="${d}">${d}</option>`).join(''));
}

/* --- Renderizar tabla de empleados --- */
let tablaEmpleados;
// Assuming the table has ID #tabla-empleados and is within the #empleados section
function renderTablaEmpleados(rol) {
    let empleados = getEmpleados();
    renderFiltrosEmpleados(empleados); // Update filters based on current employees

    let filtroDepto = $('#filtro-departamento').val();
    let filtroAntig = $('#filtro-antiguedad').val();

    let filtrados = empleados.filter(e => {
        let ok = true;
        // Normaliza para comparar igual que en el filtro
        let depEmp = (e.departamento || '').trim();
        depEmp = depEmp.charAt(0).toUpperCase() + depEmp.slice(1).toLowerCase(); // Normalize capitalization
        if (filtroDepto && filtroDepto !== "" && depEmp !== filtroDepto) ok = false; // Check if filter is selected

        if (filtroAntig && filtroAntig !== "") { // Check if filter is selected
            let ant = calcularAntiguedad(e.ingreso);
             // Need to handle "Menos de 1 año" case from calcularAntiguedad
            if (ant === 'Fecha inválida' || ant === 'Fecha futura') {
                ok = false; // Filter out invalid/future dates
            } else if (ant === 'Menos de 1 año') {
                 if (filtroAntig !== '0-1') ok = false;
            }
            else { // Numeric years
                let antNum = parseInt(ant);
                if (filtroAntig === '0-1' && !(antNum >= 0 && antNum <= 1)) ok = false;
                else if (filtroAntig === '2-5' && !(antNum >= 2 && antNum <= 5)) ok = false;
                else if (filtroAntig === '6-10' && !(antNum >= 6 && antNum <= 10)) ok = false;
                else if (filtroAntig === '11+' && !(antNum >= 11)) ok = false;
            }
        }
        return ok;
    });

    // Destroy previous DataTable instance if it exists
    if (tablaEmpleados) {
        tablaEmpleados.destroy();
    }

    let filas = filtrados.map(e => {
        let acciones = `<button class="btn btn-info btn-sm ver-empleado-btn" data-id="${e.id}" data-bs-toggle="modal" data-bs-target="#detalle-empleado-modal"><i class="bi bi-eye"></i></button>`; // Use modal trigger
        if (rol === 'admin') {
            acciones += ` <button class="btn btn-warning btn-sm editar-empleado-btn" data-id="${e.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm eliminar-empleado-btn" data-id="${e.id}"><i class="bi bi-trash"></i></button>`;
        }
        // Ensure all table columns match the data rendered here
        return `<tr>
            <td>${e.nombres || ''}</td>
            <td>${e.apellidos || ''}</td>
            <td>${e.cedula || ''}</td>
            <td>${e.telefono || ''}</td>
            <td>${e.email || ''}</td>
            <td>${e.cargo || ''}</td>
            <td>${e.departamento || ''}</td>
            <td>${calcularAntiguedad(e.ingreso)}</td>
            <td>${acciones}</td>
        </tr>`;
    }).join('');
    $('#tabla-empleados tbody').html(filas);

    // Initialize DataTable
    tablaEmpleados = $('#tabla-empleados').DataTable({
        destroy: true, // Destroy existing instance before reinitializing
         language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        // Define columns explicitly to map data to table columns
        columns: [
             { data: 'nombres' },
             { data: 'apellidos' },
             { data: 'cedula' },
             { data: 'telefono' },
             { data: 'email' },
             { data: 'cargo' },
             { data: 'departamento' },
             { data: 'antiguedad' }, // This column is calculated
             { data: 'acciones' } // This column contains buttons
        ],
         // Provide the data directly to DataTables (alternative to rendering HTML rows manually)
         // This requires restructuring the data returned by the filter or adjusting the map function above
         // For now, keeping manual row rendering as per original JS
         // data: filtrados.map(e => ({ ...e, antiguedad: calcularAntiguedad(e.ingreso), acciones: /* buttons HTML */ })),
         // columnDefs: [ { targets: -1, orderable: false, searchable: false } ] // Disable sorting/searching on actions column
    });
}

/* --- Filtros de empleados (Listeners) --- */
$('#filtro-departamento, #filtro-antiguedad').on('change', function() {
    let session = getSession();
    renderTablaEmpleados(session ? session.rol : 'empleado'); // Pass role, default if session is null
});

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
    let tieneHijos = $('#empleado-hijos').val() === 'Sí';
    let cuantos = parseInt($('#empleado-cuantos-hijos').val()) || 0;

    if (tieneHijos && cuantos > 0) {
        $('#hijos-tabla-row').show(); // Assuming this row exists in the form HTML
        let html = `<table class="table table-bordered table-sm"><thead><tr><th>#</th><th>Sexo</th><th>Edad</th></tr></thead><tbody>`;
        for (let i = 0; i < cuantos; i++) { // Use 0-based index for consistency with arrays
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
                    <input type="number" min="0" class="form-control hijos-edad" data-index="${i}">
                </td>
            </tr>`;
        }
        html += `</tbody></table>`;
        $('#hijos-tabla').html(html); // Assuming a div with ID #hijos-tabla exists in the form HTML
    } else {
        $('#hijos-tabla-row').hide();
        $('#hijos-tabla').empty();
    }
}

// Mostrar/ocultar campos de hijos (Listeners)
// Assuming #empleado-hijos and #empleado-cuantos-hijos are in the form HTML
$('#empleado-hijos').on('change', function() {
    if ($(this).val() === 'Sí') {
        $('#cuantos-hijos-div').show(); // Assuming this div exists
    } else {
        $('#cuantos-hijos-div').hide();
        $('#hijos-tabla-row').hide();
        $('#empleado-cuantos-hijos').val('');
        $('#hijos-tabla').empty();
    }
    renderTablaHijos();
});
$('#empleado-cuantos-hijos').on('input', renderTablaHijos); // Use input for real-time updates

// Mostrar/ocultar datos de espos@ según estado civil (Listener)
// Assuming #empleado-estado-civil and #datos-esposo-esposa are in the form HTML
$('#empleado-estado-civil').on('change', function() {
    // Note: In the HTML, you had 'Casad@' || 'Divorciad@'. The form HTML was not detailed.
    // Adjust logic based on your form's specific options. Assuming 'Casado' and 'Divorciado' as values.
    const estado = $(this).val();
    if (estado === 'Casado' || estado === 'Divorciado') { // Use values consistent with HTML form options
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

// Al guardar empleado, recolecta los datos de hijos
function getDetalleHijos() {
    let hijos = [];
    $('#hijos-tabla tbody tr').each(function() { // Iterate through rows in the hijos table body
        const sexo = $(this).find('.hijos-sexo').val();
        const edad = $(this).find('.hijos-edad').val();
        // Only add if at least one field has a value
        if (sexo || edad) {
            hijos.push({ sexo, edad: edad ? parseInt(edad) : '' }); // Convert age to number
        }
    });
    return hijos;
}


// --- Guardar/editar empleado ---
// Assuming the form has ID form-empleado and is in the employee form section
$('#form-empleado').on('submit', function(e) {
    e.preventDefault();

    let id = $('#empleado-id').val(); // Hidden ID field
    let hojaVidaInput = $('#empleado-hoja-vida')[0]; // File input
    let hoja_vida_nombre = '';
    let hoja_vida_url = '';

    // Find the existing employee to retain old file data if no new file is uploaded
    const existingEmployee = getEmpleados().find(emp => emp.id == id);
    if (existingEmployee) {
        hoja_vida_nombre = existingEmployee.hoja_vida_nombre || '';
        hoja_vida_url = existingEmployee.hoja_vida_url || '';
    }


    if (hojaVidaInput && hojaVidaInput.files && hojaVidaInput.files[0]) {
        const file = hojaVidaInput.files[0];
         // Basic file type validation (optional but recommended)
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            mostrarAlerta('Tipo de archivo no permitido para la hoja de vida. Usa PDF o DOCX.', 'danger');
            return; // Stop submission
        }

        hoja_vida_nombre = file.name;
        let reader = new FileReader();
        reader.onload = function(evt) {
            hoja_vida_url = evt.target.result; // Base64 Data URL
            // Now save the employee data with the file URL
            saveEmployeeData(id, hoja_vida_nombre, hoja_vida_url);
        };
        reader.readAsDataURL(file); // Read file as Data URL
    } else {
         // If no new file, save employee data with existing or empty file info
        saveEmployeeData(id, hoja_vida_nombre, hoja_vida_url);
    }

     // Function to actually save the employee data
    function saveEmployeeData(id, hoja_vida_nombre_to_save, hoja_vida_url_to_save) {
        let obj = {
            id: id || Date.now(), // Use existing ID or generate new one
            nombres: $('#empleado-nombres').val().trim(),
            apellidos: $('#empleado-apellidos').val().trim(),
            cedula: $('#empleado-cedula').val().trim(),
            telefono: $('#empleado-telefono').val().trim(),
            email: $('#empleado-email').val().trim(),
            cargo: $('#empleado-cargo').val().trim(),
            departamento: $('#empleado-departamento').val().trim(),
            contrato: $('#empleado-contrato').val(), // Assuming select value
            salario: limpiarSalario($('#empleado-salario').val()), // Clean salary format
            nacimiento: $('#empleado-nacimiento').val(),
            ingreso: $('#empleado-ingreso').val(),
            direccion: $('#empleado-direccion').val().trim(),
            ciudad: $('#empleado-ciudad').val().trim(),
            barrio: $('#empleado-barrio').val().trim(),
            notas: $('#empleado-notas').val().trim(),
            emergencia_nombre: $('#empleado-emergencia-nombre').val().trim(),
            emergencia_telefono: $('#empleado-emergencia-telefono').val().trim(),
            emergencia_parentesco: $('#empleado-emergencia-parentesco').val().trim(),
            hijos: $('#empleado-hijos').val(), // 'Sí' or 'No'
            cuantos_hijos: $('#empleado-cuantos-hijos').val() ? parseInt($('#empleado-cuantos-hijos').val()) : 0, // Convert to number
            detalle_hijos: JSON.stringify(getDetalleHijos()), // Stringify the array of objects
            con_quien_vive: $('#empleado-con-quien-vive').val(),
            esposo_nombre: $('#empleado-esposo-nombre').val().trim(),
            esposo_edad: $('#empleado-esposo-edad').val() ? parseInt($('#empleado-esposo-edad').val()) : '', // Convert to number
            esposo_telefono: $('#empleado-esposo-telefono').val().trim(),
            estado_civil: $('#empleado-estado-civil').val(),
            eps: $('#empleado-eps').val().trim(),
            fondo_pensiones: $('#empleado-fondo_pensiones').val().trim(),
            tipo_sangre: $('#empleado-tipo-sangre').val(),
            licencia: $('#empleado-licencia').val(), // 'Sí' or 'No'
            licencia_categoria: $('#empleado-licencia-categoria').val().trim(),
            licencia_vencimiento: $('#empleado-licencia-vencimiento').val(),
            hoja_vida_nombre: hoja_vida_nombre_to_save,
            hoja_vida_url: hoja_vida_url_to_save
        };

        // Basic validation
        if (!obj.nombres || !obj.apellidos || !obj.cedula || !obj.telefono || !obj.email || !obj.cargo || !obj.departamento || !obj.ingreso) {
             mostrarAlerta('Completa los campos obligatorios (Nombre, Apellido, Cédula, Teléfono, Email, Cargo, Departamento, Fecha Ingreso).', 'danger');
             return; // Stop saving process
        }

        let empleados = getEmpleados();
        // Check for duplicate cédula only when adding a new employee
        if (!id && empleados.find(e => e.cedula === obj.cedula)) {
            mostrarAlerta('La cédula ya existe', 'danger');
            return; // Stop saving process
        }

        if (id) {
            // Update existing employee
            let idx = empleados.findIndex(e => e.id == id);
            if (idx !== -1) {
                 // Keep existing file data if no new file was selected
                 if (!hojaVidaInput || !hojaVidaInput.files || !hojaVidaInput.files[0]) {
                      obj.hoja_vida_nombre = empleados[idx].hoja_vida_nombre;
                      obj.hoja_vida_url = empleados[idx].hoja_vida_url;
                 }
                empleados[idx] = obj;
                mostrarAlerta('Empleado actualizado', 'success');
            } else {
                 mostrarAlerta('Error al actualizar empleado', 'danger'); // Should not happen if editing from the list
                 return; // Stop saving process
            }
        } else {
            // Add new employee
            empleados.push(obj);
            mostrarAlerta('Empleado agregado', 'success');
        }

        setEmpleados(empleados); // Save updated array to localStorage
        mostrarSeccion('empleados'); // Go back to the employee list (using section ID)
        let session = getSession();
        renderTablaEmpleados(session ? session.rol : 'empleado'); // Re-render the employee table, pass role
    }
});

$('#cancel-empleado-btn').on('click', function() {
    mostrarSeccion('empleados'); // Go back to the employee list (using section ID)
    let session = getSession();
    renderTablaEmpleados(session ? session.rol : 'empleado'); // Pass role
});

// --- Empleados: acciones (editar, eliminar) ---
// Listener for 'Editar' button in the employee list table
$(document).on('click', '.editar-empleado-btn', function() {
    let id = $(this).data('id');
    let empleados = getEmpleados();
    let e = empleados.find(emp => emp.id == id);
    if (!e) {
        mostrarAlerta('Empleado no encontrado', 'danger');
        return;
    }

    $('#empleado-form-title').text('Editar Empleado');
    $('#form-empleado')[0].reset(); // Reset form first
    $('#empleado-id').val(e.id); // Populate hidden ID field
    // Populate form fields with employee data
    $('#empleado-nombres').val(e.nombres);
    $('#empleado-apellidos').val(e.apellidos);
    $('#empleado-cedula').val(e.cedula);
    $('#empleado-telefono').val(e.telefono);
    $('#empleado-email').val(e.email);
    $('#empleado-cargo').val(e.cargo);
    $('#empleado-departamento').val(e.departamento);
    $('#empleado-contrato').val(e.contrato);
    $('#empleado-salario').val(e.salario); // Use raw value for editing
    $('#empleado-nacimiento').val(e.nacimiento);
    $('#empleado-ingreso').val(e.ingreso);
    $('#empleado-direccion').val(e.direccion);
    $('#empleado-ciudad').val(e.ciudad);
    $('#empleado-barrio').val(e.barrio);
    $('#empleado-notas').val(e.notas);
    $('#empleado-emergencia-nombre').val(e.emergencia_nombre);
    $('#empleado-emergencia-telefono').val(e.emergencia_telefono);
    $('#empleado-emergencia-parentesco').val(e.emergencia_parentesco);

    // Handle conditional fields visibility and data
    $('#empleado-hijos').val(e.hijos).trigger('change'); // Trigger change to show/hide hijos fields
    if (e.hijos === 'Sí') {
        $('#empleado-cuantos-hijos').val(e.cuantos_hijos).trigger('input'); // Trigger input to render hijos table
         // Populate hijos table data
        if (e.detalle_hijos) {
            try {
                 let detalle = JSON.parse(e.detalle_hijos);
                 $('#hijos-tabla tbody tr').each(function(idx) {
                     if (detalle[idx]) {
                          $(this).find('.hijos-sexo').val(detalle[idx].sexo || '');
                          $(this).find('.hijos-edad').val(detalle[idx].edad || '');
                     }
                 });
            } catch (error) {
                 console.error("Error parsing hijos detalle:", error);
                 mostrarAlerta("Error cargando detalle de hijos", "warning");
            }
        }
    }

    $('#empleado-con-quien-vive').val(e.con_quien_vive);
    $('#empleado-estado-civil').val(e.estado_civil).trigger('change'); // Trigger change to show/hide spouse fields
    if (e.estado_civil === 'Casado' || e.estado_civil === 'Divorciado') { // Use values consistent with change listener
        $('#empleado-esposo-nombre').val(e.esposo_nombre);
        $('#empleado-esposo-edad').val(e.esposo_edad);
        $('#empleado-esposo-telefono').val(e.esposo_telefono);
    }


    $('#empleado-eps').val(e.eps);
    $('#empleado-fondo_pensiones').val(e.fondo_pensiones);
    $('#empleado-tipo-sangre').val(e.tipo_sangre);
    $('#empleado-licencia').val(e.licencia).trigger('change'); // Trigger change to show/hide license fields
    if (e.licencia === 'Sí') {
        $('#empleado-licencia-categoria').val(e.licencia_categoria);
        $('#empleado-licencia-vencimiento').val(e.licencia_vencimiento);
    }

    // File input cannot be programmatically set for security reasons.
    // You might want to display the current file name if it exists.
    // $('#empleado-hoja-vida').val(''); // Clear file input for security
    // Display current file name if needed
    // if(e.hoja_vida_nombre) { $('#current-hoja-vida').text(e.hoja_vida_nombre).show(); } else { $('#current-hoja-vida').hide(); }


    mostrarSeccion('empleado-form'); // Show the employee form section
});

// Listener for 'Editar' button in the employee detail modal
$('#editar-empleado-detalle-btn').on('click', function() {
     let id = $(this).data('id');
     // Close the detail modal first (optional, or handle it in edit logic)
     $('#detalle-empleado-modal').modal('hide'); // Use Bootstrap's modal method

     // Trigger the edit logic which will open the form section
     $('.editar-empleado-btn[data-id="' + id + '"]').click(); // Reuse the existing edit listener
});


// Listener for 'Eliminar' button in the employee list table
$(document).on('click', '.eliminar-empleado-btn', function() {
    let id = $(this).data('id');
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
        let empleados = getEmpleados();
        let filteredEmpleados = empleados.filter(e => e.id != id);
        setEmpleados(filteredEmpleados);
        mostrarAlerta('Empleado eliminado', 'success');
        let session = getSession();
        renderTablaEmpleados(session ? session.rol : 'empleado'); // Re-render the table, pass role
    }
});


// --- Acción de ver empleado (Listener - data-bs-toggle handles modal display) ---
// This listener is for buttons inside the DataTables rows with class 'ver-empleado-btn'
// Data-bs-toggle="modal" and data-bs-target="#detalle-empleado-modal" in the HTML handle showing the modal.
// The following listener populates the modal content *before* it is shown.
$('#detalle-empleado-modal').on('show.bs.modal', function (event) {
    const button = $(event.relatedTarget); // Button that triggered the modal
    const employeeId = button.data('id'); // Extract info from data-id attribute
    const session = getSession();
    renderDetalleEmpleado(employeeId, session ? session.rol : 'empleado'); // Populate the modal body, pass role
});

// --- Renderizar detalle de empleado (Populates the modal body) ---
// Assuming the modal body content element is #detalle-empleado-content
function renderDetalleEmpleado(id, rol) {
    let e = getEmpleados().find(emp => emp.id == id);
    if (!e) {
         $('#detalle-empleado-content').html('<p>Error: Empleado no encontrado.</p>');
         $('#editar-empleado-detalle-btn').addClass('d-none'); // Hide edit button if not found
         return;
    }

    let hijosDetalle = '<i>(No tiene hij@s)</i>';
    if (e.detalle_hijos) {
        try {
             let detalle = JSON.parse(e.detalle_hijos);
             if (detalle.length > 0) {
                  hijosDetalle = detalle.map((h, i) => `Hijo ${i+1}: ${h.sexo || '-'} / ${h.edad || '-'} años`).join('<br>');
             }
        } catch (error) {
             console.error("Error parsing hijos detalle for view:", error);
             hijosDetalle = '<i>(Error al cargar detalle de hijos)</i>';
        }
    }

    let hojaVidaLink = e.hoja_vida_url ? `<a href="${e.hoja_vida_url}" target="_blank">${e.hoja_vida_nombre || 'Ver documento'}</a>` : '<i>(No disponible)</i>';
    let esposoDetalle = '<i>(No aplica)</i>';
    if (e.estado_civil === 'Casado' || e.estado_civil === 'Divorciado') { // Use values consistent with HTML form options
         esposoDetalle = `${e.esposo_nombre || '-'} (Edad: ${e.esposo_edad || '-'}, Teléfono: ${e.esposo_telefono || '-'})`;
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
                <p><strong>Dirección:</strong> ${e.direccion || ''}</p>
                <p><strong>Ciudad:</strong> ${e.ciudad || ''}</p>
                <p><strong>Barrio:</strong> ${e.barrio || ''}</p>

                <h6 class="mt-4">Información de Empleo</h6>
                <p><strong>Departamento:</strong> ${e.departamento || ''}</p>
                <p><strong>Tipo de Contrato:</strong> ${e.contrato || ''}</p>
                <p><strong>Fecha de Ingreso:</strong> ${e.ingreso || ''}</p>
                <p><strong>Antigüedad:</strong> ${calcularAntiguedad(e.ingreso)}</p>
                 ${rol === 'admin' ? `<p><strong>Salario:</strong> ${formatearMoneda(e.salario)}</p>` : ''}


                <h6 class="mt-4">Información Personal y Familiar</h6>
                 <p><strong>Fecha de Nacimiento:</strong> ${e.nacimiento || ''} (${diasParaCumple(e.nacimiento)} días para el cumple)</p>
                 <p><strong>Estado civil:</strong> ${e.estado_civil || ''}</p>
                 <p><strong>Espos@:</strong> ${esposoDetalle}</p>
                 <p><strong>¿Tiene hij@s?:</strong> ${e.hijos || ''}</p>
                 <p><strong>¿Cuántos?:</strong> ${e.cuantos_hijos > 0 ? e.cuantos_hijos : (e.hijos === 'Sí' ? 'No especificado' : '-')}</p>
                 <p><strong>Detalle de hij@s:</strong><br>${hijosDetalle}</p>
                 <p><strong>¿Con quién vive?:</strong> ${e.con_quien_vive || ''}</p>

                <h6 class="mt-4">Salud y Documentación</h6>
                 <p><strong>EPS:</strong> ${e.eps || ''}</p>
                 <p><strong>Fondo de pensiones:</strong> ${e.fondo_pensiones || ''}</p>
                 <p><strong>Tipo de Sangre:</strong> ${e.tipo_sangre || ''}</p>
                 <p><strong>Licencia de conducción:</strong> ${e.licencia || ''} ${e.licencia === 'Sí' ? `- Categoría: ${e.licencia_categoria || '-'} - Vence: ${e.licencia_vencimiento || '-'}` : ''}</p>
                 <p><strong>Hoja de Vida:</strong> ${hojaVidaLink}</p>
                <p><strong>Notas Adicionales:</strong> ${e.notas || ''}</p>

                 <h6 class="mt-4">Otros Detalles</h6>
                <p>Esta sección podría expandirse con más datos relevantes.</p>
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
let tablaCumpleanos;
// Assumes #tabla-cumpleanos is within #cumpleanos-list section
function renderTablaCumpleanos() {
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
    }

    let filas = lista.map(e => `<tr>
        <td>${e.nombre}</td>
        <td>${e.nacimiento}</td>
        <td>${e.dias}</td>
    </tr>`).join('');
    $('#tabla-cumpleanos tbody').html(filas);

    // Initialize DataTable
    tablaCumpleanos = $('#tabla-cumpleanos').DataTable({
        destroy: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
         paging: true, // Enable pagination
         searching: true, // Enable search
         info: true, // Show info
         ordering: true // Enable sorting
    });
}

/* --- Renderizar tabla de licencias próximas a vencer --- */
let tablaLicencias;
// Assumes #tabla-licencias is within #licencias-list section
function renderTablaLicencias() {
    let empleados = getEmpleados();
    let hoy = new Date();
    let lista = empleados
        .filter(e => e.licencia === 'Sí' && e.licencia_vencimiento) // Only include employees with a license and expiration date
        .map(e => {
            let vencimientoDate = new Date(e.licencia_vencimiento);
            // Handle invalid dates
            if (isNaN(vencimientoDate.getTime())) {
                 return null; // Filter out invalid dates
            }
            let dias = Math.ceil((vencimientoDate - hoy) / (1000 * 60 * 60 * 24));
            return {
                nombre: `${e.nombres || ''} ${e.apellidos || ''}`,
                vencimiento: e.licencia_vencimiento || '',
                dias,
                categoria: e.licencia_categoria || ''
            };
        })
        .filter(e => e !== null && e.dias >= 0 && e.dias <= 365) // Filter for valid dates and those expiring within a year (adjust range as needed)
        .sort((a, b) => a.dias - b.dias); // Sort by days remaining

    // Destroy previous DataTable instance if it exists
    if (tablaLicencias) {
        tablaLicencias.destroy();
    }

    let filas = lista.map(e => `<tr>
        <td>${e.nombre}</td>
        <td>${e.vencimiento}</td>
        <td>${e.dias}</td>
        <td>${e.categoria}</td>
    </tr>`).join('');
    $('#tabla-licencias tbody').html(filas);

    // Initialize DataTable
    tablaLicencias = $('#tabla-licencias').DataTable({
        destroy: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
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
     // renderGraficos(); // Example
}

// Cargar tema guardado al cargar el documento
$(document).ready(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    // Ensure the icon is set correctly on load based on saved theme
    const icon = $('#toggle-theme i');
     if (icon.length) { // Check if the icon element exists
        if (savedTheme === 'dark') {
            icon.removeClass('bi-moon-stars').addClass('bi-sun');
        } else {
            icon.removeClass('bi-sun').addClass('bi-moon-stars');
        }
     }

     // Activate initial load logic
     initDatos(); // Initialize default data if needed
     let session = getSession();
     if (session) {
         mostrarSeccion('dashboard'); // Go to dashboard if session exists
         renderDashboard(session.rol); // Render dashboard content
     } else {
         mostrarSeccion('login'); // Go to login if no session
     }

     // Initial render of tables that might be visible on load (e.g., if deep linking or specific start page)
     // renderTablaEmpleados(session ? session.rol : 'empleado'); // Example, adjust based on your default visible section

});


/* --- Configuración de DataTables en español --- */
// This should ideally be done once after jQuery and DataTables are loaded
$.extend(true, $.fn.dataTable.defaults, {
    language: {
        // ¡Cambiado a https:// explícito!
        url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
    }
});

/* --- Listeners for SPA Navigation Links --- */
// Assumes navigation links have class 'spa-link' and href="#section-id"
$(document).on('click', '.spa-link', function(e) {
    e.preventDefault(); // Prevent default anchor click behavior
    const targetId = $(this).attr('href').substring(1); // Get section ID from href="#section-id"

    // Check if the target is a known SPA section ID
    const spaSections = ['dashboard', 'empleados', 'documentacion', 'encuestas', 'objetivos', 'beneficios', 'capacitaciones', 'evaluaciones', 'nomina', 'vacaciones', 'horarios', 'incidencias', 'cumpleanos-list', 'licencias-list']; // List all your SPA section IDs
    if (spaSections.includes(targetId)) {
         mostrarSeccion(targetId); // Use the function to show/hide sections

         // Perform initial render/setup for the section if needed
         if (targetId === 'empleados') {
             let session = getSession();
             renderTablaEmpleados(session ? session.rol : 'empleado');
         } else if (targetId === 'cumpleanos-list') {
             renderTablaCumpleanos();
         } else if (targetId === 'licencias-list') {
             renderTablaLicencias();
         } else if (targetId === 'dashboard') { // Ensure dashboard renders when navigated via link
             let session = getSession();
              if(session) renderDashboard(session.rol);
         }
         // Add similar checks for other sections that need initial data loading/rendering
         // Example: if (targetId === 'vacaciones') { renderTablaVacaciones(); }
    } else {
        console.warn("Clicked link does not map to a known SPA section:", targetId);
        // Optionally handle links that might point elsewhere or open modals differently
    }
});


// Note: Modals should be triggered via data-bs-toggle="modal" and data-bs-target="#modal-id"
// in the HTML buttons/links themselves. The JS only needs to populate modal content
// when the modal is about to be shown (using the 'show.bs.modal' event).

// Example: Listener for the 'Nueva Solicitud' button in Vacaciones section
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-solicitud-modal"
$('#nueva-solicitud-modal').on('show.bs.modal', function(event) {
     // Optional: Clear form or populate initial data here
     $('#nueva-solicitud-form')[0].reset();
     // Example: pre-populate employee name if applicable
     // $('#solicitud-empleado-id').val(getSession().empleadoId);
     console.log("Modal Nueva Solicitud Vacaciones Shown");
});

// Example: Listener for the 'Ver Calendario' button in Vacaciones section
// Assuming the button has data-bs-toggle="modal" data-bs-target="#calendario-modal"
$('#calendario-modal').on('show.bs.modal', function(event) {
    console.log("Calendario Modal Shown - Calendar initialization logic needed here.");
    // Initialize your calendar library (e.g., FullCalendar) inside the modal body #calendario-vacaciones
    // let calendarEl = document.getElementById('calendario-vacaciones');
    // let calendar = new FullCalendar.Calendar(calendarEl, { ... });
    // calendar.render();
    // Load absence data and add events to the calendar
    // let ausencias = getAusencias();
    // let events = ausencias.map(a => ({ title: a.tipo, start: a.fechaInicio, end: a.fechaFin }));
    // calendar.addEventSource(events);
});

// Example: Listener for 'Nueva Nomina' button
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-nomina-modal"
$('#nueva-nomina-modal').on('show.bs.modal', function(event) {
     $('#nueva-nomina-form')[0].reset();
     console.log("Modal Nueva Nomina Shown");
});

// Example: Listener for 'Recibo Nomina' button (from table action)
// Assuming the button has data-bs-toggle="modal" data-bs-target="#recibo-nomina-modal"
$('#recibo-nomina-modal').on('show.bs.modal', function(event) {
     // Populate receipt details based on the employee/payroll data associated with the clicked button
     // const button = $(event.relatedTarget);
     // const payrollId = button.data('id'); // Assuming data-id holds payroll ID
     // const employeeId = button.data('employee-id'); // Assuming data-employee-id holds employee ID
     console.log("Recibo Nomina Modal Shown - Populate details here.");
});

// Example: Listener for 'Nueva Incidencia' button
// Assuming the button has data-bs-toggle="modal" data-bs-target="#nueva-incidencia-modal"
$('#nueva-incidencia-modal').on('show.bs.modal', function(event) {
     $('#nueva-incidencia-form')[0].reset();
     console.log("Modal Nueva Incidencia Shown");
});

// Example: Listener for 'Detalle Incidencia' button (from table action)
// Assuming the button has data-bs-toggle="modal" data-bs-target="#detalle-incidencia-modal"
$('#detalle-incidencia-modal').on('show.bs.modal', function(event) {
     // Populate incident details based on the data associated with the clicked button
     // const button = $(event.relatedTarget);
     // const incidentId = button.data('id');
     console.log("Detalle Incidencia Modal Shown - Populate details here.");
});


// Add similar listeners for other modals to clear forms or load specific data before they are shown.
// For example, modals for Documentacion, Encuestas, Objetivos, Beneficios, Capacitaciones, Evaluaciones, Horarios.

// Initial call to load data and set initial section
// This block is inside $(document).ready above now.
// initDatos();
// let session = getSession();
// if (session) {
//     mostrarSeccion('dashboard');
//     renderDashboard(session.rol);
// } else {
//     mostrarSeccion('login');
// }
