// app.js - Portal RRHH ASHE
document.addEventListener('DOMContentLoaded', function() {
    // Usuarios permitidos (solo admin por defecto)
    let usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }
    ];

    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
    let ausencias = JSON.parse(localStorage.getItem('ausencias')) || []; // Mantenemos ausencias, aunque no las trabajaremos a fondo ahora
    let usuarioActual = null;

    // Elementos del DOM - Obtenemos referencias
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const empleadosListSection = document.getElementById('empleados-list'); // Renombrado para evitar conflicto con variable de tabla
    const empleadoFormSection = document.getElementById('empleado-form'); // Renombrado
    const empleadoDetalleSection = document.getElementById('empleado-detalle'); // Renombrado
    const cumpleanosListSection = document.getElementById('cumpleanos-list'); // Renombrado
    const dashboardSection = document.getElementById('dashboard'); // Renombrado
    const ausenciasListSection = document.getElementById('ausencias-list'); // Renombrado

    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado');
    const btnNuevoEmpleadoLista = document.getElementById('btn-nuevo-empleado-lista');
    const btnVerEmpleados = document.getElementById('btn-ver-empleados');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnRegistro = document.getElementById('btn-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnEmpleados = document.getElementById('btn-empleados');
    const btnCumpleanos = document.getElementById('btn-cumpleanos');
    const btnAusencias = document.getElementById('btn-ausencias');
    const btnExportarCSV = document.getElementById('btn-exportar-csv');

    // Elementos de filtro y búsqueda externos a la tabla
    const busquedaEmpleadosInput = document.getElementById('busqueda-empleados');
    const filtroDepartamentoSelect = document.getElementById('filtro-departamento');
    const filtroAntiguedadSelect = document.getElementById('filtro-antiguedad');

    const breadcrumbSection = document.getElementById('breadcrumb-section');

    // Modal de restablecer contraseña
    const resetPasswordModalElement = document.getElementById('reset-password-modal');
    const resetPasswordModal = resetPasswordModalElement ? new bootstrap.Modal(resetPasswordModalElement) : null; // Inicialización segura
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetPasswordFields = document.getElementById('reset-password-fields');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    let emailToReset = '';

    // Estado de autenticación
    let isAuthenticated = false;

    // Inicializar DataTables - La variable mantendrá la instancia
    let empleadosTable = null;

    // --- Funciones de Visualización de Secciones ---
    function ocultarTodo(ids) {
        ids.forEach(id => {
             const element = document.getElementById(id);
             if (element) element.classList.add('d-none');
        });
         // También ocultamos las secciones renombradas si existen
        [loginForm, registroForm, empleadosListSection, empleadoFormSection,
         empleadoDetalleSection, cumpleanosListSection, dashboardSection, ausenciasListSection].forEach(section => {
             if (section) section.classList.add('d-none');
         });
    }

    function actualizarBreadcrumb(seccion) {
        if (breadcrumbSection) {
            breadcrumbSection.textContent = seccion;
        }
    }

    function showLoginForm() {
         if (loginForm) loginForm.classList.remove('d-none');
         ocultarTodo(['registro-form', 'empleados-list', 'empleado-form', 'cumpleanos-list',
                      'dashboard', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
         ocultarElementosAutenticados();
         actualizarBreadcrumb('Inicio de Sesión');
         limpiarLogin();
     }

     function showRegistroForm() {
         if (registroForm) registroForm.classList.remove('d-none');
         ocultarTodo(['login-form', 'empleados-list', 'empleado-form', 'cumpleanos-list',
                      'dashboard', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
         actualizarBreadcrumb('Registro');
     }

     function hideRegistroForm() {
         if (registroForm) registroForm.classList.add('d-none');
         showLoginForm(); // Volver al login después de cancelar/registrar
     }


    function showDashboard() {
         if (!isAuthenticated) {
             showLoginForm(); // Redirigir al login si no está autenticado
             return;
         }
         if (dashboardSection) dashboardSection.classList.remove('d-none');
         ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form',
                      'cumpleanos-list', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
         actualizarBreadcrumb('Dashboard');

         // Actualizar estadísticas (basado en tu lógica existente)
         if (document.getElementById('dashboard-total-empleados')) {
             document.getElementById('dashboard-total-empleados').textContent = empleados.length;
         }
          if (document.getElementById('dashboard-usuarios')) {
             document.getElementById('dashboard-usuarios').textContent = usuariosPermitidos.length;
         }


         // Próximos cumpleaños para dashboard
         const proximosCumpleanos = empleados.filter(emp => {
             if (!emp.fechaNacimiento) return false;
             const diasRestantes = calcularDiasParaCumpleanos(emp.fechaNacimiento);
             return diasRestantes >= 0 && diasRestantes <= 30; // Cumpleaños hoy o en los próximos 30 días
         });
          if (document.getElementById('dashboard-cumpleanos')) {
            document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanos.length;
          }
     }

    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        if (empleadosListSection) empleadosListSection.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleado-form', 'cumpleanos-list',
                     'dashboard', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
        actualizarBreadcrumb('Lista de Empleados');

        actualizarFiltroDepartamentos(); // Mantener la actualización del dropdown

        // --- Inicializar o actualizar DataTables ---
        if (empleadosTable === null) {
            // Si es la primera vez que mostramos la lista, inicializamos DataTables
            empleadosTable = $('#empleados-table').DataTable({
                data: empleados, // Carga los datos iniciales
                columns: [
                    {
                         data: 'nombres',
                         render: function(data, type, row) {
                             // Renderiza el nombre como un enlace para ver detalles
                             return `<a href="#" class="ver-empleado" data-id="${row.id}">${data}</a>`;
                         }
                     },
                    { data: 'apellidos' },
                    { data: 'cedula' },
                    { data: 'telefono' },
                    { data: 'email' },
                    { data: 'cargo', defaultContent: '' }, // Muestra "" si el dato es null/undefined
                    { data: 'departamento', defaultContent: '' },
                    {
                        data: 'fechaIngreso',
                        render: function(data, type, row) {
                             // Renderiza la antigüedad calculada
                            return calcularAntiguedadTexto(data);
                        },
                         orderSequence: ['asc', 'desc'] // Permite ordenar por esta columna
                    },
                    {
                        data: 'id', // Columna para los botones de acción
                        render: function(data, type, row) {
                            // Renderiza los botones de editar y eliminar
                            return `
                                <button class="btn btn-sm btn-primary editar-empleado-btn" data-id="${data}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-danger eliminar-empleado-btn" data-id="${data}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            `;
                        },
                        orderable: false // Deshabilita el ordenamiento en esta columna
                    }
                ],
                language: { // Configuración de idioma a español
                     url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
                },
                 // Opciones adicionales de DataTables
                paging: true, // Habilita paginación
                lengthChange: true, // Permite cambiar el número de elementos por página
                searching: true, // Habilita búsqueda (aunque usaremos nuestro input externo)
                info: true, // Muestra información de la tabla
                ordering: true, // Habilita ordenamiento
                pageLength: 10 // Número de filas por defecto
            });

            // --- Eventos de delegación para los botones dentro de la tabla ---
            // Usamos delegación porque DataTables recarga el contenido del tbody
             $('#empleados-table-body').on('click', '.ver-empleado', function(e) {
                 e.preventDefault(); // Previene la navegación del enlace
                 mostrarDetalleEmpleado($(this).data('id')); // Usamos jQuery para obtener data-id
             });
             $('#empleados-table-body').on('click', '.editar-empleado-btn', function() {
                 editarEmpleado($(this).data('id'));
             });
             $('#empleados-table-body').on('click', '.eliminar-empleado-btn', function() {
                 eliminarEmpleado($(this).data('id'));
             });

             // --- Vincula los filtros y búsqueda externos a DataTables ---
             // Búsqueda global
             if (busquedaEmpleadosInput) {
                 busquedaEmpleadosInput.addEventListener('keyup', function () {
                     empleadosTable.search(this.value).draw(); // Aplica la búsqueda global y redibuja
                 });
             }

             // Filtro por Departamento (aplicado a la columna de departamento)
             if (filtroDepartamentoSelect) {
                 filtroDepartamentoSelect.addEventListener('change', function () {
                     // La columna de departamento es la 7ma (índice 6, contando desde 0)
                     empleadosTable.column(6).search(this.value).draw(); // Aplica filtro a la columna y redibuja
                 });
             }

             // Filtro por Antigüedad (requiere filtro personalizado en DataTables)
             if (filtroAntiguedadSelect) {
                 // Agregamos la lógica del filtro personalizado de DataTables
                 $.fn.dataTable.ext.search.push(
                     function( settings, data, dataIndex ) {
                         const antiguedadFiltro = filtroAntiguedadSelect.value;
                         if (antiguedadFiltro === "") {
                             return true; // Mostrar todos si no hay filtro seleccionado
                         }

                         const fechaIngreso = empleados[dataIndex].fechaIngreso; // Obtiene la fecha original del array empleados
                         if (!fechaIngreso) return false; // Ocultar si no hay fecha de ingreso

                         const años = calcularAntiguedad(fechaIngreso); // Calcula la antigüedad

                         const [minStr, maxStr] = antiguedadFiltro.split('-');
                         const min = parseInt(minStr);
                         const max = maxStr === '+' ? Infinity : parseInt(maxStr);

                         return años >= min && años <= max;
                     }
                 );

                 // El evento de cambio en el select de antigüedad solo necesita redibujar la tabla,
                 // el filtro personalizado de DataTables se encargará de la lógica.
                 filtroAntiguedadSelect.addEventListener('change', function () {
                     empleadosTable.draw(); // Redibuja la tabla para aplicar el filtro personalizado
                 });
             }


        } else {
            // Si DataTables ya está inicializado, solo actualizamos los datos
            empleadosTable.clear().rows.add(empleados).draw(); // Borra datos viejos, añade nuevos y redibuja
        }
    }


    function showEmpleadoForm(editId = null) {
        const form = document.getElementById('empleadoForm');
        if (form) {
            form.reset(); // Limpia el formulario
            if (editId !== null) { // Usamos !== null para permitir editId = 0 si fuera el caso
                form.setAttribute('data-edit-id', editId);
                cargarDatosEmpleado(editId); // Carga datos si es edición
            } else {
                form.removeAttribute('data-edit-id'); // Remueve atributo si es nuevo empleado
            }
        }
        if (empleadoFormSection) empleadoFormSection.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'cumpleanos-list',
                     'dashboard', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
        actualizarBreadcrumb(editId !== null ? 'Editar Empleado' : 'Nuevo Empleado');
    }

    function mostrarDetalleEmpleado(id) {
        const empleado = empleados.find(e => e.id == id); // Usamos == para comparar number con string si es necesario
        if (!empleado) return;

        const detalleBody = document.getElementById('empleado-detalle-body');
        if (detalleBody) {
            detalleBody.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h4>${empleado.nombres} ${empleado.apellidos}</h4>
                        <p><strong>Cédula:</strong> ${empleado.cedula || ''}</p>
                        <p><strong>Teléfono:</strong> ${empleado.telefono || ''}</p>
                        <p><strong>Email:</strong> ${empleado.email || ''}</p>
                        <p><strong>Cargo:</strong> ${empleado.cargo || ''}</p>
                        <p><strong>Departamento:</strong> ${empleado.departamento || ''}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Tipo de Contrato:</strong> ${empleado.tipoContrato || ''}</p>
                        <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(empleado.fechaNacimiento)}</p>
                        <p><strong>Fecha de Ingreso:</strong> ${formatearFecha(empleado.fechaIngreso)}</p>
                        <p><strong>Antigüedad:</strong> ${calcularAntiguedadTexto(empleado.fechaIngreso)}</p>
                        <p><strong>Salario:</strong> ${usuarioActual && usuarioActual.rol === 'admin' ? formatearMiles(empleado.salario) : '****'}</p>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>Notas / Acontecimientos</h5>
                        <p>${empleado.notas || 'Sin notas registradas'}</p>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>Contacto de Emergencia</h5>
                        <p><strong>Nombre:</strong> ${empleado.contactoEmergenciaNombre || ''}</p>
                        <p><strong>Teléfono:</strong> ${empleado.contactoEmergenciaTelefono || ''}</p>
                        <p><strong>Parentesco:</strong> ${empleado.contactoEmergenciaParentesco || ''}</p>
                    </div>
                </div>
            `;
        }


        if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form',
                     'cumpleanos-list', 'dashboard', 'ausencias-list']); // Usamos IDs por si acaso
        actualizarBreadcrumb('Detalle de Empleado');

        // Event listener para el botón Editar desde Detalle
        const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
        if (btnEditarDesdeDetalle) {
             // Clonar y reemplazar para evitar duplicar listeners si se ve varias veces
             const newBtnEditarDesdeDetalle = btnEditarDesdeDetalle.cloneNode(true);
             btnEditarDesdeDetalle.parentNode.replaceChild(newBtnEditarDesdeDetalle, btnEditarDesdeDetalle);
             newBtnEditarDesdeDetalle.addEventListener('click', function() {
                 editarEmpleado(empleado.id);
             });
        }

         // Event listener para el botón Volver desde Detalle
         const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
         if (btnVolverDesdeDetalle) {
             // Clonar y reemplazar para evitar duplicar listeners
             const newBtnVolverDesdeDetalle = btnVolverDesdeDetalle.cloneNode(true);
             btnVolverDesdeDetalle.parentNode.replaceChild(newBtnVolverDesdeDetalle, btnVolverDesdeDetalle);
              newBtnVolverDesdeDetalle.addEventListener('click', function() {
                 showEmpleadosList(); // Vuelve a la lista de empleados
             });
         }
    }


     function showCumpleanosList() {
         if (!isAuthenticated) {
             showLoginForm();
             return;
         }
          if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
         ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form',
                      'dashboard', 'ausencias-list', 'empleado-detalle']); // Usamos IDs por si acaso
         actualizarBreadcrumb('Próximos Cumpleaños');

         // Renderizar lista de cumpleaños (puedes mejorar esto con DataTables si quieres)
         renderCumpleanos();
     }

     function renderCumpleanos() {
         const tbody = document.getElementById('cumpleanos-table-body');
         if (!tbody) return;
         tbody.innerHTML = '';

         const proximosCumpleanos = empleados
             .filter(emp => emp.fechaNacimiento) // Solo empleados con fecha de nacimiento
             .map(emp => { // Calcular días y añadir al objeto temporal
                 const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                 return { ...emp, diasRestantes: dias };
             })
             .filter(emp => emp.diasRestantes >= 0 && emp.diasRestantes <= 365) // Cumpleaños que faltan o son hoy este año
             .sort((a, b) => a.diasRestantes - b.diasRestantes); // Ordenar por los días restantes

         proximosCumpleanos.forEach(emp => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td>${emp.nombres} ${emp.apellidos}</td>
                 <td>${formatearFecha(emp.fechaNacimiento)}</td>
                 <td>${emp.diasRestantes === 0 ? 'Hoy!' : (emp.diasRestantes === 1 ? 'Mañana' : `${emp.diasRestantes} días`)}</td>
             `;
             tbody.appendChild(tr);
         });
     }

    function showAusenciasList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
         if (ausenciasListSection) ausenciasListSection.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form',
                     'cumpleanos-list', 'dashboard', 'empleado-detalle']); // Usamos IDs por si acaso
        actualizarBreadcrumb('Gestión de Ausencias');

         // Renderizar lista de ausencias (puedes mejorar esto con DataTables)
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = '';

         // Ordenar ausencias por fecha descendente
         const ausenciasOrdenadas = ausencias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

         ausenciasOrdenadas.forEach(ausencia => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td>${ausencia.nombreEmpleado}</td>
                 <td>${formatearFecha(ausencia.fecha)}</td>
                 <td>${ausencia.tipo}</td>
                 <td>
                      <button class="btn btn-sm btn-danger eliminar-ausencia-btn" data-id="${ausencia.id}">
                          <i class="bi bi-trash"></i>
                      </button>
                 </td>
             `;
             tbody.appendChild(tr);
         });

         // Evento de delegación para eliminar ausencias
         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn').on('click', '.eliminar-ausencia-btn', function() {
             eliminarAusencia($(this).data('id'));
         });
     }

     function eliminarAusencia(id) {
          if (confirm('¿Está seguro de que desea eliminar esta ausencia?')) {
             ausencias = ausencias.filter(a => a.id != id);
             localStorage.setItem('ausencias', JSON.stringify(ausencias));
             mostrarAlerta('Ausencia eliminada correctamente', 'success');
             renderAusencias(); // Volver a renderizar la lista de ausencias
         }
     }

     // Event listener para el formulario de Ausencias
     const ausenciaFormElement = document.getElementById('ausenciaForm');
     if (ausenciaFormElement) {
         ausenciaFormElement.addEventListener('submit', function(e) {
             e.preventDefault();
             const nuevaAusencia = {
                 id: Date.now(), // Generar un ID simple basado en el tiempo
                 nombreEmpleado: document.getElementById('ausencia-nombre').value,
                 fecha: document.getElementById('ausencia-fecha').value,
                 tipo: document.getElementById('ausencia-tipo').value,
             };
             ausencias.push(nuevaAusencia);
             localStorage.setItem('ausencias', JSON.stringify(ausencias));
             mostrarAlerta('Ausencia registrada correctamente', 'success');
             ausenciaFormElement.reset(); // Limpiar formulario
             renderAusencias(); // Actualizar lista de ausencias
         });
     }


    // --- Funciones de Autenticación ---
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
            mostrarElementosAutenticados();
            showDashboard(); // Ir al dashboard después de login
            notificarCumpleanos(); // Mostrar notificaciones de cumpleaños después de login
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

     function limpiarLogin() {
         if (loginForm) loginForm.reset();
     }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        ocultarElementosAutenticados();
        showLoginForm(); // Ir al login después de logout
        mostrarAlerta('Sesión cerrada correctamente', 'success');
    }

    function mostrarElementosAutenticados() {
        // Mostrar botones de navegación
        [btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias, btnExportarCSV, btnNuevoEmpleado, btnNuevoEmpleadoLista].forEach(btn => {
             if (btn) btn.classList.remove('d-none');
         });

        // Ocultar botones de login/registro
        [btnLogin, btnRegistro].forEach(btn => {
            if (btn) btn.classList.add('d-none');
        });

        // Mostrar breadcrumb si está oculto (solo la sección de inicio quizás)
        if (document.querySelector('.breadcrumb')) document.querySelector('.breadcrumb').classList.remove('d-none'); // Asumiendo que breadcrumb tiene una clase bootstrap breadcrumb
    }

    function ocultarElementosAutenticados() {
         // Ocultar botones de navegación
        [btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias, btnExportarCSV, btnNuevoEmpleado, btnNuevoEmpleadoLista].forEach(btn => {
             if (btn) btn.classList.add('d-none');
         });

        // Mostrar botones de login/registro
        [btnLogin, btnRegistro].forEach(btn => {
            if (btn) btn.classList.remove('d-none');
        });
         // Ocultar breadcrumb si está visible
         if (document.querySelector('.breadcrumb')) document.querySelector('.breadcrumb').classList.add('d-none');
    }

     // Funciones de registro (ya estaban bien)
    function handleRegistro(e) {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (password !== confirmPassword) {
            mostrarAlerta('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (usuariosPermitidos.some(u => u.email === email)) {
            mostrarAlerta('El correo electrónico ya está registrado', 'danger');
            return;
        }

        // Guardar usuario con rol 'rrhh' (puedes cambiar el rol si es necesario)
        usuariosPermitidos.push({ email, password, rol: 'rrhh' });
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
        mostrarAlerta('Usuario registrado exitosamente', 'success');
        hideRegistroForm(); // Ir al login después de registrar
    }

    // --- Funciones de Empleados (CRUD y Lógica) ---

     // Guardar empleado
     const empleadoFormElement = document.getElementById('empleadoForm');
     if (empleadoFormElement) {
         empleadoFormElement.addEventListener('submit', function(e) {
             e.preventDefault();
             const editId = this.getAttribute('data-edit-id');

             const empleado = {
                 id: editId ? parseInt(editId) : Date.now(), // Usa Date.now() como ID para nuevos
                 nombres: document.getElementById('nombres').value.trim(), // Añade trim para limpiar espacios
                 apellidos: document.getElementById('apellidos').value.trim(),
                 cedula: document.getElementById('cedula').value.trim(),
                 telefono: document.getElementById('telefono').value.trim(),
                 email: document.getElementById('email-empleado').value.trim(),
                 cargo: document.getElementById('cargo').value.trim(),
                 departamento: document.getElementById('departamento').value.trim(),
                 tipoContrato: document.getElementById('tipo-contrato').value.trim(),
                 salario: limpiarMiles(document.getElementById('salario').value.trim()), // Limpia miles y trim
                 fechaNacimiento: document.getElementById('fecha-nacimiento').value,
                 fechaIngreso: document.getElementById('fecha-ingreso').value,
                 notas: document.getElementById('notas').value.trim(),
                 contactoEmergenciaNombre: document.getElementById('contacto-emergencia-nombre').value.trim(),
                 contactoEmergenciaTelefono: document.getElementById('contacto-emergencia-telefono').value.trim(),
                 contactoEmergenciaParentesco: document.getElementById('contacto-emergencia-parentesco').value.trim()
                 // Hoja de vida no se guarda en localStorage directamente (es un File)
             };

             if (editId) {
                 // Actualizar empleado existente
                 const index = empleados.findIndex(e => e.id == editId);
                 if (index !== -1) {
                     empleados[index] = empleado;
                     mostrarAlerta('Empleado actualizado correctamente', 'success');
                 }
             } else {
                 // Añadir nuevo empleado
                 empleados.push(empleado);
                 mostrarAlerta('Empleado guardado correctamente', 'success');
             }

             localStorage.setItem('empleados', JSON.stringify(empleados));
             showEmpleadosList(); // Volver a la lista después de guardar/actualizar
         });
     }

     function cargarDatosEmpleado(id) {
         const empleado = empleados.find(e => e.id == id);
         if (empleado) {
             // Cargar todos los campos del formulario
             document.getElementById('nombres').value = empleado.nombres || '';
             document.getElementById('apellidos').value = empleado.apellidos || '';
             document.getElementById('cedula').value = empleado.cedula || '';
             document.getElementById('telefono').value = empleado.telefono || '';
             document.getElementById('email-empleado').value = empleado.email || '';
             document.getElementById('cargo').value = empleado.cargo || '';
             document.getElementById('departamento').value = empleado.departamento || '';
             document.getElementById('tipo-contrato').value = empleado.tipoContrato || '';
             document.getElementById('salario').value = formatearMiles(empleado.salario) || ''; // Formatear al cargar
             document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento || '';
             document.getElementById('fecha-ingreso').value = empleado.fechaIngreso || '';
             document.getElementById('notas').value = empleado.notas || '';
             document.getElementById('contacto-emergencia-nombre').value = empleado.contactoEmergenciaNombre || '';
             document.getElementById('contacto-emergencia-telefono').value = empleado.contactoEmergenciaTelefono || '';
             document.getElementById('contacto-emergencia-parentesco').value = empleado.contactoEmergenciaParentesco || '';

             // Nota: La hoja de vida no se puede cargar directamente en un input type="file" por seguridad
         }
     }

     // Eliminar empleado
     // La función ahora se llama desde el evento de delegación de DataTables
     window.eliminarEmpleado = function(id) { // Hacemos la función global para que onclick en el HTML funcione (aunque delegación es mejor)
         if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
             empleados = empleados.filter(e => e.id != id);
             localStorage.setItem('empleados', JSON.stringify(empleados));
             mostrarAlerta('Empleado eliminado correctamente', 'success');
             // Actualizar DataTables después de eliminar
             if (empleadosTable) {
                empleadosTable.clear().rows.add(empleados).draw();
             }
             // No es necesario llamar a showEmpleadosList a menos que quieras cambiar de sección
         }
     }

     // Editar empleado
      // La función ahora se llama desde el evento de delegación de DataTables
     window.editarEmpleado = function(id) { // Hacemos la función global
         showEmpleadoForm(id); // Muestra el formulario y carga los datos
     }

     // Mostrar detalle de empleado
      // La función ahora se llama desde el evento de delegación de DataTables (en el enlace del nombre)
     window.mostrarDetalleEmpleado = function(id) { // Hacemos la función global
          const empleado = empleados.find(e => e.id == id);
         if (!empleado) return;

         const detalleBody = document.getElementById('empleado-detalle-body');
         if (detalleBody) {
             detalleBody.innerHTML = `
                 <div class="row">
                     <div class="col-md-6 mb-3">
                         <h4>${empleado.nombres || ''} ${empleado.apellidos || ''}</h4>
                         <p><strong>Cédula:</strong> ${empleado.cedula || ''}</p>
                         <p><strong>Teléfono:</strong> ${empleado.telefono || ''}</p>
                         <p><strong>Email:</strong> ${empleado.email || ''}</p>
                         <p><strong>Cargo:</strong> ${empleado.cargo || ''}</p>
                         <p><strong>Departamento:</strong> ${empleado.departamento || ''}</p>
                     </div>
                     <div class="col-md-6 mb-3">
                         <p><strong>Tipo de Contrato:</strong> ${empleado.tipoContrato || ''}</p>
                         <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(empleado.fechaNacimiento)}</p>
                         <p><strong>Fecha de Ingreso:</strong> ${formatearFecha(empleado.fechaIngreso)}</p>
                         <p><strong>Antigüedad:</strong> ${calcularAntiguedadTexto(empleado.fechaIngreso)}</p>
                         <p><strong>Salario:</strong> ${usuarioActual && usuarioActual.rol === 'admin' ? formatearMiles(empleado.salario) : '****'}</p>
                     </div>
                 </div>
                 <div class="row mt-3">
                     <div class="col-12">
                         <h5>Notas / Acontecimientos</h5>
                         <p>${empleado.notas || 'Sin notas registradas'}</p>
                     </div>
                 </div>
                 <div class="row mt-3">
                     <div class="col-12">
                         <h5>Contacto de Emergencia</h5>
                         <p><strong>Nombre:</strong> ${empleado.contactoEmergenciaNombre || ''}</p>
                         <p><strong>Teléfono:</strong> ${empleado.contactoEmergenciaTelefono || ''}</p>
                         <p><strong>Parentesco:</strong> ${empleado.contactoEmergenciaParentesco || ''}</p>
                     </div>
                 </div>
             `;
         }


         if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
         ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form',
                      'cumpleanos-list', 'dashboard', 'ausencias-list']); // Usamos IDs por si acaso
         actualizarBreadcrumb('Detalle de Empleado');

         // Event listener para el botón Editar desde Detalle
         const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
         if (btnEditarDesdeDetalle) {
              // Clonar y reemplazar para evitar duplicar listeners si se ve varias veces
              const newBtnEditarDesdeDetalle = btnEditarDesdeDetalle.cloneNode(true);
              btnEditarDesdeDetalle.parentNode.replaceChild(newBtnEditarDesdeDetalle, btnEditarDesdeDetalle);
              newBtnEditarDesdeDetalle.addEventListener('click', function() {
                  editarEmpleado(empleado.id); // Llama a la función editarEmpleado
              });
         }

          // Event listener para el botón Volver desde Detalle
          const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
          if (btnVolverDesdeDetalle) {
              // Clonar y reemplazar para evitar duplicar listeners
              const newBtnVolverDesdeDetalle = btnVolverDesdeDetalle.cloneNode(true);
              btnVolverDesdeDetalle.parentNode.replaceChild(newBtnVolverDesdeDetelle, btnVolverDesdeDetalle);
               newBtnVolverDesdeDetalle.addEventListener('click', function() {
                  showEmpleadosList(); // Vuelve a la lista de empleados
              });
          }
     }


     function cancelarFormulario() {
         // Simplemente vuelve a mostrar la lista de empleados
         showEmpleadosList();
     }


    // --- Funciones de Utilidad ---
     function calcularAntiguedad(fechaIngreso) {
         if (!fechaIngreso) return 0;
         const inicio = new Date(fechaIngreso);
         const hoy = new Date();
         // Calcula la diferencia en milisegundos, luego convierte a años aproximados
         const diffTime = Math.abs(hoy - inicio);
         const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Considera años bisiestos
         return diffYears; // Retorna un número (puede tener decimales) para comparación precisa
     }

     function calcularAntiguedadTexto(fechaIngreso) {
         if (!fechaIngreso) return 'No registrada';
         const diffTime = Math.abs(new Date() - new Date(fechaIngreso));

         const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
         const months = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44)); // Promedio de días al mes

         if (years > 0) {
             return `${years} año${years > 1 ? 's' : ''}`;
         } else {
             return `${months} mes${months > 1 ? 'es' : ''}`;
         }
     }

    function calcularDiasParaCumpleanos(fechaNacimiento) {
        if (!fechaNacimiento) return Infinity;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Reiniciar horas para comparación de días
        const cumple = new Date(fechaNacimiento);
        cumple.setFullYear(hoy.getFullYear()); // Establecer el año actual

         // Si el cumpleaños de este año ya pasó, considerar el próximo año
        if (cumple < hoy) {
            cumple.setFullYear(hoy.getFullYear() + 1);
        }

         // Calcular la diferencia en días
        const diffTime = cumple - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }


    function formatearFecha(fecha) {
        if (!fecha) return 'No registrada';
        // Intentar formatear a un formato más legible (ej: 25/12/2023)
        try {
             const [year, month, day] = fecha.split('-');
             return `${day}/${month}/${year}`;
        } catch (e) {
             // Si falla, usar el método por defecto (puede variar por navegador)
             return new Date(fecha).toLocaleDateString();
        }
    }

    function formatearMiles(valor) {
        if (!valor) return '';
         // Asegurarse de que es un número antes de formatear
        const numero = parseFloat(valor);
        if (isNaN(numero)) return valor; // Devuelve el valor original si no es un número

        // Formatear con puntos como separador de miles y coma para decimales
        return numero.toLocaleString('es-CO', { // 'es-CO' para formato colombiano
             minimumFractionDigits: 0, // Mínimo de decimales (cambia si necesitas mostrar céntimos)
             maximumFractionDigits: 2 // Máximo de decimales
         });
    }


    function limpiarMiles(valor) {
         if (!valor) return '';
         // Elimina puntos (separador de miles) y reemplaza coma por punto (separador de decimales)
         return valor.toString().replace(/\./g, '').replace(/,/g, '.');
     }

    function mostrarAlerta(mensaje, tipo = 'success') {
        const alertaContainer = document.getElementById('alerta-visual'); // Usamos el contenedor en el HTML
         if (!alertaContainer) {
             // Si el contenedor no existe, creamos uno temporal (menos ideal)
             const tempAlerta = document.createElement('div');
              tempAlerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
              tempAlerta.style.zIndex = '9999';
              tempAlerta.innerHTML = `${mensaje} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
              document.body.appendChild(tempAlerta);
              setTimeout(() => tempAlerta.remove(), 3000);
              return;
         }

         // Limpiamos el contenedor y mostramos la alerta usando clases de Bootstrap
         alertaContainer.innerHTML = `
             ${mensaje}
             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
         `;
         alertaContainer.className = `alert alert-${tipo} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`; // Clases para el estilo y posición
         alertaContainer.style.display = 'block'; // Mostrar el contenedor

         // Ocultar la alerta después de 3 segundos
         setTimeout(() => {
             alertaContainer.classList.remove('show'); // Inicia la transición de salida
             alertaContainer.classList.add('fade');
             // Esperar a que termine la transición antes de ocultar completamente
             setTimeout(() => {
                 alertaContainer.style.display = 'none';
             }, 150); // El tiempo de la transición fade de Bootstrap es ~150ms
         }, 3000);
    }


    function actualizarFiltroDepartamentos() {
        const departamentos = [...new Set(empleados.map(emp => emp.departamento).filter(Boolean).sort())]; // Obtiene, filtra vacíos y ordena
         if (filtroDepartamentoSelect) {
             const selectedValue = filtroDepartamentoSelect.value; // Guarda la selección actual
             filtroDepartamentoSelect.innerHTML = '<option value="">Todos los departamentos</option>';
             departamentos.forEach(dep => {
                 const option = document.createElement('option');
                 option.value = dep;
                 option.textContent = dep;
                 filtroDepartamentoSelect.appendChild(option);
             });
              filtroDepartamentoSelect.value = selectedValue; // Restaura la selección
         }
    }

     // Exportar a CSV
     function exportarEmpleadosCSV() {
         // Considerar exportar solo los datos visibles si se aplican filtros en DataTables
         // Para simplificar, por ahora exportamos todos los datos del array 'empleados'
         if (!empleados.length) {
             mostrarAlerta('No hay empleados para exportar', 'warning');
             return;
         }

         const headers = [
             'ID', 'Nombres', 'Apellidos', 'Cédula', 'Teléfono', 'Email', 'Cargo',
             'Departamento', 'Tipo de Contrato', 'Salario', 'Fecha de Nacimiento',
             'Fecha de Ingreso', 'Antigüedad', 'Notas', 'Contacto Emergencia Nombre',
             'Contacto Emergencia Teléfono', 'Contacto Emergencia Parentesco'
         ];

         // Crear filas de datos, escapando comas y comillas
         const rows = empleados.map(emp => [
             emp.id,
             emp.nombres,
             emp.apellidos,
             emp.cedula,
             emp.telefono,
             emp.email,
             emp.cargo || '',
             emp.departamento || '',
             emp.tipoContrato || '',
             formatearMiles(emp.salario) || '', // Exportar salario formateado
             formatearFecha(emp.fechaNacimiento) || '', // Exportar fecha formateada
             formatearFecha(emp.fechaIngreso) || '', // Exportar fecha formateada
             calcularAntiguedadTexto(emp.fechaIngreso),
             (emp.notas || '').replace(/"/g, '""'), // Escapa comillas dobles en notas
             emp.contactoEmergenciaNombre || '',
             emp.contactoEmergenciaTelefono || '',
             emp.contactoEmergenciaParentesco || ''
         ].map(field => `"${String(field).replace(/"/g, '""')}"`)); // Envuelve cada campo en comillas y escapa comillas internas


         let csvContent = "\ufeff" + headers.join(',') + '\n'; // Agrega BOM para compatibilidad con Excel y encabezados
         rows.forEach(row => {
             csvContent += row.join(',') + '\n';
         });

         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
         const link = document.createElement('a');
         const url = URL.createObjectURL(blob);

         link.setAttribute('href', url);
         link.setAttribute('download', 'empleados_ashe.csv');
         link.style.visibility = 'hidden'; // No mostrar el enlace
         document.body.appendChild(link);
         link.click(); // Simular clic para descargar
         document.body.removeChild(link); // Limpiar

         mostrarAlerta('Exportando datos de empleados...', 'info'); // Mensaje informativo
     }


    // --- Inicialización ---

    // Toggle de contraseña - Asegurarnos de que solo se añade un listener por botón
    document.querySelectorAll('.toggle-password').forEach(btn => {
         // Remove any existing listeners first if they were added before
         const newBtn = btn.cloneNode(true);
         btn.parentNode.replaceChild(newBtn, btn);
         newBtn.addEventListener('click', function() {
             const targetId = this.getAttribute('data-target');
             const input = document.getElementById(targetId);
             const icon = this.querySelector('i');

             if (input.type === 'password') {
                 input.type = 'text';
                 icon.classList.remove('bi-eye');
                 icon.classList.add('bi-eye-slash');
             } else {
                 input.type = 'password';
                 icon.classList.remove('bi-eye-slash');
                 icon.classList.add('bi-eye');
             }
         });
     });


    // Restablecer contraseña - Asegurarnos de que solo se añade un listener
    if (forgotPasswordLink) {
         const newLink = forgotPasswordLink.cloneNode(true);
         forgotPasswordLink.parentNode.replaceChild(newLink, forgotPasswordLink);
         newLink.addEventListener('click', function(e) {
             e.preventDefault();
             if (resetPasswordForm) resetPasswordForm.reset();
             if (resetPasswordFields) resetPasswordFields.classList.add('d-none');
             emailToReset = ''; // Limpiar email a restablecer
             if (document.getElementById('reset-email')) document.getElementById('reset-email').readOnly = false; // Asegurarse de que el email input sea editable
             if (resetPasswordModal) resetPasswordModal.show();
         });
    }

     if (resetPasswordForm) {
         // Remove existing listener if any, then add the new one
          const newResetPasswordForm = resetPasswordForm.cloneNode(true);
          resetPasswordForm.parentNode.replaceChild(newResetPasswordForm, resetPasswordForm);

         newResetPasswordForm.addEventListener('submit', function(e) {
             e.preventDefault();
             const emailInput = document.getElementById('reset-email');
             const email = emailInput ? emailInput.value : '';

             if (resetPasswordFields && !resetPasswordFields.classList.contains('d-none')) {
                 // Lógica para cambiar contraseña
                 const newPasswordInput = document.getElementById('reset-password');
                 const confirmPasswordInput = document.getElementById('reset-password-confirm');
                 const newPassword = newPasswordInput ? newPasswordInput.value : '';
                 const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';


                 if (newPassword !== confirmPassword) {
                     mostrarAlerta('Las contraseñas no coinciden', 'danger');
                     return;
                 }

                 // Buscar y actualizar usuario por el email guardado previamente (emailToReset)
                 const userIndex = usuariosPermitidos.findIndex(u => u.email === emailToReset);
                 if (userIndex !== -1) {
                     usuariosPermitidos[userIndex].password = newPassword;
                     localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
                     mostrarAlerta('Contraseña restablecida con éxito', 'success');
                     if (resetPasswordModal) resetPasswordModal.hide();
                 } else {
                     // Esto no debería pasar si el flujo es correcto, pero como seguridad
                     mostrarAlerta('Error al encontrar usuario para restablecer', 'danger');
                 }
             } else {
                 // Lógica para verificar email y mostrar campos de nueva contraseña
                 const usuario = usuariosPermitidos.find(u => u.email === email);
                 if (usuario) {
                     emailToReset = email; // Guardar email para el siguiente paso
                     if (resetPasswordFields) resetPasswordFields.classList.remove('d-none');
                     if (emailInput) emailInput.readOnly = true; // Hacer el email de lectura
                 } else {
                     mostrarAlerta('El correo no está registrado', 'danger');
                 }
             }
         });
     }


    // Asignar Event Listeners a botones de navegación/acción principales
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registroForm) registroForm.addEventListener('submit', handleRegistro);
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm()); // Usar función flecha para llamar sin argumentos al inicio
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm()); // Usar función flecha
    if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList);
    if (btnCancelar) btnCancelar.addEventListener('click', cancelarFormulario); // Cancelar vuelve a la lista
    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm);
    if (btnCancelarRegistro) btnCancelarRegistro.addEventListener('click', hideRegistroForm); // Cancelar registro vuelve al login
    if (btnLogin) btnLogin.addEventListener('click', showLoginForm); // Botón "Iniciar Sesión" en el navbar muestra el form de login
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    if (btnDashboard) btnDashboard.addEventListener('click', showDashboard);
    if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList);
    if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList);
    if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList);
    if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV);

    // Nota: Los listeners para filtros y búsqueda se mueven DENTRO de showEmpleadosList
    // Event listeners para botones de acción de tabla (ver, editar, eliminar) se manejan con delegación DENTRO de showEmpleadosList

    // --- Inicio de la aplicación ---
    // Verificar si el usuario ya está "autenticado" (simulado con una variable)
    // En una aplicación real, esto implicaría verificar una cookie o token
    // Para esta propuesta, siempre empezamos en la pantalla de login si no hay usuarioActual
    if (usuarioActual) {
         isAuthenticated = true; // Si hay un usuarioActual cargado de localStorage (si implementaste eso antes)
         mostrarElementosAutenticados();
         showDashboard(); // Ir al dashboard si hay usuario actual al cargar
    } else {
         isAuthenticated = false;
         ocultarElementosAutenticados();
         showLoginForm(); // Si no, empezar en el login
    }

     // Inicializar el breadcrumb de inicio
     const breadcrumbHome = document.getElementById('breadcrumb-home');
     if (breadcrumbHome) {
         breadcrumbHome.addEventListener('click', function() {
             if (isAuthenticated) {
                 showDashboard(); // Ir al dashboard si está autenticado
             } else {
                 showLoginForm(); // Ir al login si no
             }
         });
     }


});

// Nota de seguridad: Almacenar contraseñas y datos sensibles en localStorage NO es seguro para una aplicación de producción.
// Para una propuesta, puede ser aceptable para demostrar funcionalidad, pero una aplicación real requiere un backend seguro.
