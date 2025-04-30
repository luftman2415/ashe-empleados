// app.js - Portal RRHH ASHE
document.addEventListener('DOMContentLoaded', function() {
    // Usuarios permitidos
    // Para la demostración, inicializamos SIEMPRE con el usuario admin por defecto para asegurar un punto de entrada conocido.
    // Esto sobrescribe cualquier usuario que pudiera haber quedado en localStorage de pruebas anteriores.
    // NOTA MUY IMPORTANTE: En una aplicación real, la gestión de usuarios y contraseñas debe
    // manejarse de forma segura en un backend con autenticación y hashing de contraseñas.
    // NUNCA almacenes contraseñas en texto plano en el lado del cliente (localStorage).
    let usuariosPermitidos = [
         { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }
    ];
    // Guardamos este estado inicial (solo admin) en localStorage para la demo.
    // Las futuras registraciones/logins sí usarán localStorage.
    localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
    // Luego, cargamos los usuarios POR SI ACASO hubo registros en esta misma sesión antes de recargar
    // Aunque con la línea de arriba, siempre empezaremos con solo admin al cargar la página.
    usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }
    ];


    // Empleados y Ausencias sí los cargamos de localStorage si existen
    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
    let ausencias = JSON.parse(localStorage.getItem('ausencias')) || [];
    let usuarioActual = null; // Se establece al hacer login

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
    const btnLogin = document.getElementById('btn-login'); // Botón "Iniciar Sesión" del navbar
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
    const breadcrumbHome = document.getElementById('breadcrumb-home'); // El enlace de "Inicio" en el breadcrumb


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
    function ocultarTodo() {
        // Ocultamos todas las secciones principales
        [loginForm, registroForm, empleadosListSection, empleadoFormSection,
         empleadoDetalleSection, cumpleanosListSection, dashboardSection, ausenciasListSection].forEach(section => {
             if (section) section.classList.add('d-none');
         });
    }

    function actualizarBreadcrumb(seccion) {
        if (breadcrumbSection) {
            breadcrumbSection.textContent = seccion;
             // Asegurarse de que el breadcrumb principal es visible si una sección está activa
             if (document.querySelector('.breadcrumb')) document.querySelector('.breadcrumb').classList.remove('d-none');
        }
    }

    function showLoginForm() {
         ocultarTodo(); // Oculta todo primero
         if (loginForm) loginForm.classList.remove('d-none');
         ocultarElementosAutenticados(); // Oculta elementos del navbar autenticado
         actualizarBreadcrumb('Inicio de Sesión');
         limpiarLogin(); // Limpia el formulario de login
     }

     function showRegistroForm() {
         ocultarTodo(); // Oculta todo primero
         if (registroForm) registroForm.classList.remove('d-none');
         // ocultarElementosAutenticados(); // Mantiene ocultos los elementos autenticados (ya lo hace ocultarTodo)
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
         ocultarTodo(); // Oculta todo primero
         if (dashboardSection) dashboardSection.classList.remove('d-none');
         // mostrarElementosAutenticados(); // Mantiene visibles elementos autenticados (ya lo hace login/estado inicial)
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
        ocultarTodo(); // Oculta todo primero
        if (empleadosListSection) empleadosListSection.classList.remove('d-none');
        // mostrarElementosAutenticados(); // Mantiene visibles

        actualizarBreadcrumb('Lista de Empleados');

        // Si los filtros desplegables están vacíos, los poblamos
        if (filtroDepartamentoSelect && filtroDepartamentoSelect.options.length <= 1) {
             actualizarFiltroDepartamentos(); // Mantener la actualización del dropdown
        }


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
                             return `<a href="#" class="ver-empleado" data-id="${row.id}">${data || ''}</a>`;
                         }
                     },
                    { data: 'apellidos', defaultContent: '' },
                    { data: 'cedula', defaultContent: '' },
                    { data: 'telefono', defaultContent: '' },
                    { data: 'email', defaultContent: '' },
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
                searching: true, // Habilita búsqueda (aunque usaremos nuestro input externo para la global)
                info: true, // Muestra información de la tabla
                ordering: true, // Habilita ordenamiento
                pageLength: 10, // Número de filas por defecto
                // Layout de los elementos (l=lengthChange, f=filtering, t=table, i=info, p=pagination, r=processing)
                // Esto configura DataTables para NO usar su input de búsqueda interna, usaremos el nuestro
                dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6">><"row"<"col-sm-12"t>><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>', // f removed from first row


            });

            // --- Eventos de delegación para los botones dentro de la tabla ---
            // Usamos delegación porque DataTables recarga el contenido del tbody
             $('#empleados-table-body').on('click', '.ver-empleado', function(e) {
                 e.preventDefault(); // Previene la navegación del enlace
                 // Obtenemos el objeto de datos asociado a la fila clicada
                 const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      mostrarDetalleEmpleado(rowData.id);
                 }
             });
             $('#empleados-table-body').on('click', '.editar-empleado-btn', function() {
                  // Obtenemos el objeto de datos asociado al botón
                 const rowData = empleadosTable.row($(this).parents('tr')).data();
                  if (rowData && rowData.id !== undefined) {
                      editarEmpleado(rowData.id);
                  }
             });
             $('#empleados-table-body').on('click', '.eliminar-empleado-btn', function() {
                  // Obtenemos el objeto de datos asociado al botón
                 const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      eliminarEmpleado(rowData.id);
                 }
             });

             // --- Vincula los filtros y búsqueda externos a DataTables ---
             // Búsqueda global (vinculada al input que ya tienes)
             if (busquedaEmpleadosInput) {
                 busquedaEmpleadosInput.addEventListener('keyup', function () {
                     empleadosTable.search(this.value).draw(); // Aplica la búsqueda global y redibuja
                 });
                  busquedaEmpleadosInput.addEventListener('search', function () { // Evento para limpiar búsqueda con X
                     empleadosTable.search('').draw();
                 });
             }

             // Filtro por Departamento (aplicado a la columna de departamento)
             if (filtroDepartamentoSelect) {
                 filtroDepartamentoSelect.addEventListener('change', function () {
                     const searchValue = this.value;
                     // La columna de departamento es la 7ma (índice 6, contando desde 0)
                     empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw(); // Busca valor exacto o vacio si "Todos"
                 });
             }

             // Filtro por Antigüedad (filtro personalizado en DataTables)
             if (filtroAntiguedadSelect) {
                 // Agregamos la lógica del filtro personalizado de DataTables
                 $.fn.dataTable.ext.search.push(
                     function( settings, data, dataIndex ) {
                         // Asegura que este filtro solo se aplique a nuestra tabla de empleados
                         if ( settings.sTableId !== 'empleados-table' ) {
                             return true; // No aplicar a otras tablas si las hubiera
                         }

                         const antiguedadFiltro = filtroAntiguedadSelect.value;
                         if (antiguedadFiltro === "") {
                             return true; // Mostrar todos si no hay filtro seleccionado
                         }

                         // Obtenemos el objeto de datos original de la fila que DataTables está evaluando
                         const rowData = settings.aoData[dataIndex]._aData;
                         const fechaIngreso = rowData.fechaIngreso; // Obtiene la fecha original

                         if (!fechaIngreso) return false; // Ocultar si no hay fecha de ingreso

                         const años = calcularAntiguedad(fechaIngreso); // Calcula la antigüedad exacta

                         const [minStr, maxStr] = antiguedadFiltro.split('-');
                         const min = parseInt(minStr);
                         const max = maxStr === '+' ? Infinity : parseInt(maxStr);

                         return años >= min && años < max; // Usar < max para rangos (ej: 1-3 años significa >=1 y <3)
                     }
                 );

                 // El evento de cambio en el select de antigüedad solo necesita redibujar la tabla,
                 // el filtro personalizado de DataTables se encargará de la lógica.
                 filtroAntiguedadSelect.addEventListener('change', function () {
                     empleadosTable.draw(); // Redibuja la tabla para aplicar el filtro personalizado
                 });
             }

             // Aplicar Bootstrap classes al selector de paginación de DataTables
             $('.dataTables_length select').addClass('form-select form-select-sm');


        } else {
            // Si DataTables ya está inicializado, solo actualizamos los datos
            empleadosTable.clear().rows.add(empleados).draw(); // Borra datos viejos, añade nuevos y redibuja
             // Aplicar filtros actuales al redibujar (en caso de que los selectores tengan valores)
             empleadosTable.search(busquedaEmpleadosInput.value).draw();
             empleadosTable.column(6).search(filtroDepartamentoSelect.value ? '^'+filtroDepartamentoSelect.value+'$' : '', true, false).draw();
             empleadosTable.draw(); // Esto re-aplica el filtro personalizado de antigüedad

        }
    }


    function showEmpleadoForm(editId = null) {
        const form = document.getElementById('empleadoForm');
        if (form) {
            form.reset(); // Limpia el formulario
            if (editId !== null && editId !== undefined) { // Usamos !== null/undefined para permitir editId = 0 si fuera el caso
                form.setAttribute('data-edit-id', editId);
                cargarDatosEmpleado(editId); // Carga datos si es edición
            } else {
                form.removeAttribute('data-edit-id'); // Remueve atributo si es nuevo empleado
            }
        }
        ocultarTodo(); // Oculta todo primero
        if (empleadoFormSection) empleadoFormSection.classList.remove('d-none');
        actualizarBreadcrumb(editId !== null && editId !== undefined ? 'Editar Empleado' : 'Nuevo Empleado');
    }

     function mostrarDetalleEmpleado(id) {
         const empleado = empleados.find(e => e.id == id); // Usamos == para comparar number con string si es necesario
         if (!empleado) {
              mostrarAlerta('Empleado no encontrado', 'danger');
             return;
         }

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

         ocultarTodo(); // Oculta todo primero
         if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
         actualizarBreadcrumb('Detalle de Empleado');

         // Event listener para el botón Editar desde Detalle
         const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
         if (btnEditarDesdeDetalle) {
              // Quitamos listener viejo y ponemos uno nuevo para evitar duplicados
             const newBtnEditarDesdeDetalle = btnEditarDesdeDetalle.cloneNode(true);
             btnEditarDesdeDetalle.parentNode.replaceChild(newBtnEditarDesdeDetalle, btnEditarDesdeDetalle);
             newBtnEditarDesdeDetalle.addEventListener('click', function() {
                 editarEmpleado(empleado.id); // Llama a la función editarEmpleado
             });
         }

          // Event listener para el botón Volver desde Detalle
          const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
          if (btnVolverDesdeDetalle) {
              // Quitamos listener viejo y ponemos uno nuevo
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
         ocultarTodo(); // Oculta todo primero
          if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
         actualizarBreadcrumb('Próximos Cumpleaños');

         // Renderizar lista de cumpleaños (puedes mejorar esto con DataTables si quieres)
         renderCumpleanos();
     }

     function renderCumpleanos() {
         const tbody = document.getElementById('cumpleanos-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         const proximosCumpleanos = empleados
             .filter(emp => emp.fechaNacimiento) // Solo empleados con fecha de nacimiento válida
             .map(emp => { // Calcular días y añadir al objeto temporal
                 const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                 // Solo incluir cumpleaños que faltan o son hoy (dias >= 0)
                 if (dias >= 0) {
                     return { ...emp, diasRestantes: dias };
                 }
                 return null; // Excluir si ya pasaron este año
             })
             .filter(emp => emp !== null) // Eliminar los null
             .sort((a, b) => a.diasRestantes - b.diasRestantes); // Ordenar por los días restantes

         proximosCumpleanos.forEach(emp => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td>${emp.nombres || ''} ${emp.apellidos || ''}</td>
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
        ocultarTodo(); // Oculta todo primero
         if (ausenciasListSection) ausenciasListSection.classList.remove('d-none');
        actualizarBreadcrumb('Gestión de Ausencias');

         // Renderizar lista de ausencias (puedes mejorar esto con DataTables)
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         // Ordenar ausencias por fecha descendente
         const ausenciasOrdenadas = ausencias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

         ausenciasOrdenadas.forEach(ausencia => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td>${ausencia.nombreEmpleado || ''}</td>
                 <td>${formatearFecha(ausencia.fecha)}</td>
                 <td>${ausencia.tipo || ''}</td>
                 <td>
                      <button class="btn btn-sm btn-danger eliminar-ausencia-btn" data-id="${ausencia.id}">
                          <i class="bi bi-trash"></i>
                      </button>
                 </td>
             `;
             tbody.appendChild(tr);
         });

         // Evento de delegación para eliminar ausencias
         // Quitamos listener viejo y ponemos uno nuevo
         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn').on('click', '.eliminar-ausencia-btn', function() {
             const ausenciaId = $(this).data('id'); // Usamos jQuery data para obtener el id
             eliminarAusencia(ausenciaId);
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
          // Quitamos listener viejo y ponemos uno nuevo
          const newAusenciaForm = ausenciaFormElement.cloneNode(true);
          ausenciaFormElement.parentNode.replaceChild(newAusenciaForm, ausenciaFormElement);

         newAusenciaForm.addEventListener('submit', function(e) {
             e.preventDefault();
             const nombreInput = document.getElementById('ausencia-nombre');
             const fechaInput = document.getElementById('ausencia-fecha');
             const tipoSelect = document.getElementById('ausencia-tipo');

             const nuevaAusencia = {
                 id: Date.now(), // Generar un ID simple basado en el tiempo
                 nombreEmpleado: nombreInput ? nombreInput.value.trim() : '',
                 fecha: fechaInput ? fechaInput.value : '',
                 tipo: tipoSelect ? tipoSelect.value : '',
             };

             if (!nuevaAusencia.nombreEmpleado || !nuevaAusencia.fecha || !nuevaAusencia.tipo) {
                  mostrarAlerta('Por favor, complete todos los campos de la ausencia.', 'warning');
                 return;
             }

             ausencias.push(nuevaAusencia);
             localStorage.setItem('ausencias', JSON.stringify(ausencias));
             mostrarAlerta('Ausencia registrada correctamente', 'success');
             newAusenciaForm.reset(); // Limpiar formulario
             renderAusencias(); // Actualizar lista de ausencias
         });
     }


    // --- Funciones de Autenticación ---
    function handleLogin(e) {
        e.preventDefault(); // Previene el envío del formulario
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';


        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
            mostrarElementosAutenticados(); // Muestra botones de navegación
            showDashboard(); // Va al dashboard
            notificarCumpleanos(); // Muestra notificaciones
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

     function limpiarLogin() {
         if (loginForm) loginForm.reset(); // Limpia el formulario de login
     }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        // Opcional: Limpiar localStorage si queremos que el logout sea "completo"
        // localStorage.removeItem('usuarioActual');
        ocultarElementosAutenticados(); // Oculta botones de navegación
        showLoginForm(); // Vuelve al login
        mostrarAlerta('Sesión cerrada correctamente', 'success');
    }

    function mostrarElements(elements) {
         elements.forEach(el => { if(el) el.classList.remove('d-none'); });
    }

     function ocultarElements(elements) {
         elements.forEach(el => { if(el) el.classList.add('d-none'); });
     }


    function mostrarElementosAutenticados() {
        // Mostrar botones de navegación principales si existen
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias, btnExportarCSV]);

        // Mostrar botones específicos de la lista de empleados (si existen)
         if (empleadosListSection) mostrarElements([btnNuevoEmpleadoLista]);
          if (dashboardSection) mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);


        // Ocultar botones de login/registro
        ocultarElements([btnLogin, btnRegistro]);

        // Mostrar breadcrumb
        if (document.querySelector('.breadcrumb')) document.querySelector('.breadcrumb').classList.remove('d-none');
    }

    function ocultarElementosAutenticados() {
         // Ocultar todos los botones de navegación/acción
         ocultarElements([
             btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias,
             btnExportarCSV, btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados
         ]);

        // Mostrar botones de login/registro
        mostrarElements([btnLogin, btnRegistro]);

         // Ocultar breadcrumb
         if (document.querySelector('.breadcrumb')) document.querySelector('.breadcrumb').classList.add('d-none');
    }


     // Funciones de registro (ya estaban bien)
    function handleRegistro(e) {
        e.preventDefault();
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const confirmPasswordInput = document.getElementById('reg-confirm-password');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';


        if (password !== confirmPassword) {
            mostrarAlerta('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (usuariosPermitidos.some(u => u.email === email)) {
            mostrarAlerta('El correo electrónico ya está registrado', 'danger');
            return;
        }

        // Guardar usuario con rol 'rrhh' (puedes cambiar el rol si es necesario)
        usuariosPermitidos.push({ email: email, password: password, rol: 'rrhh' }); // Guardamos el nuevo usuario
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos)); // Guardamos la lista actualizada en localStorage
        mostrarAlerta('Usuario registrado exitosamente', 'success');
        hideRegistroForm(); // Ir al login después de registrar
    }


    // --- Funciones de Empleados (CRUD y Lógica) ---

     // Guardar empleado
     const empleadoFormElement = document.getElementById('empleadoForm');
     if (empleadoFormElement) {
         // Quitamos listener viejo y ponemos uno nuevo
          const newEmpleadoFormElement = empleadoFormElement.cloneNode(true);
          empleadoFormElement.parentNode.replaceChild(newEmpleadoFormElement, empleadoFormElement);

         newEmpleadoFormElement.addEventListener('submit', function(e) {
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
                 } else {
                      mostrarAlerta('Error: Empleado a editar no encontrado.', 'danger');
                 }
             } else {
                 // Añadir nuevo empleado
                  // Verificar si ya existe un empleado con la misma cédula (ejemplo de validación simple)
                  if (empleados.some(e => e.cedula === empleado.cedula && e.cedula !== '')) {
                       mostrarAlerta(`Ya existe un empleado con la cédula ${empleado.cedula}`, 'warning');
                       return; // Detiene el proceso de guardar
                  }
                 empleados.push(empleado);
                 mostrarAlerta('Empleado guardado correctamente', 'success');
             }

             localStorage.setItem('empleados', JSON.stringify(empleados)); // Guarda la lista de empleados actualizada
             showEmpleadosList(); // Vuelve a la lista después de guardar/actualizar
         });
     }

     function cargarDatosEmpleado(id) {
         const empleado = empleados.find(e => e.id == id);
         if (empleado) {
             // Cargar todos los campos del formulario (asegurando que los elementos existan)
             if (document.getElementById('nombres')) document.getElementById('nombres').value = empleado.nombres || '';
             if (document.getElementById('apellidos')) document.getElementById('apellidos').value = empleado.apellidos || '';
             if (document.getElementById('cedula')) document.getElementById('cedula').value = empleado.cedula || '';
             if (document.getElementById('telefono')) document.getElementById('telefono').value = empleado.telefono || '';
             if (document.getElementById('email-empleado')) document.getElementById('email-empleado').value = empleado.email || '';
             if (document.getElementById('cargo')) document.getElementById('cargo').value = empleado.cargo || '';
             if (document.getElementById('departamento')) document.getElementById('departamento').value = empleado.departamento || '';
             if (document.getElementById('tipo-contrato')) document.getElementById('tipo-contrato').value = empleado.tipoContrato || '';
             // Formatear salario al cargar solo si tiene un valor numérico
             if (document.getElementById('salario')) {
                 const salarioNum = parseFloat(empleado.salario);
                 document.getElementById('salario').value = isNaN(salarioNum) ? (empleado.salario || '') : formatearMiles(salarioNum);
             }
             if (document.getElementById('fecha-nacimiento')) document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento || '';
             if (document.getElementById('fecha-ingreso')) document.getElementById('fecha-ingreso').value = empleado.fechaIngreso || '';
             if (document.getElementById('notas')) document.getElementById('notas').value = empleado.notas || '';
             if (document.getElementById('contacto-emergencia-nombre')) document.getElementById('contacto-emergencia-nombre').value = empleado.contactoEmergenciaNombre || '';
             if (document.getElementById('contacto-emergencia-telefono')) document.getElementById('contacto-emergencia-telefono').value = empleado.contactoEmergenciaTelefono || '';
             if (document.getElementById('contacto-emergencia-parentesco')) document.getElementById('contacto-emergencia-parentesco').value = empleado.contactoEmergenciaParentesco || '';

             // Nota: La hoja de vida no se puede cargar directamente en un input type="file" por seguridad
         } else {
              mostrarAlerta('Error: Datos del empleado no encontrados para cargar en el formulario.', 'danger');
         }
     }

     // Eliminar empleado
     // La función ahora se llama desde el evento de delegación de DataTables
     window.eliminarEmpleado = function(id) { // Hacemos la función global para que onclick en el HTML funcione (aunque delegación es mejor)
         if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
             empleados = empleados.filter(e => e.id != id); // Filtra el array, creando uno nuevo sin el empleado eliminado
             localStorage.setItem('empleados', JSON.stringify(empleados)); // Guarda el nuevo array en localStorage
             mostrarAlerta('Empleado eliminado correctamente', 'success');
             // Actualizar DataTables después de eliminar
             if (empleadosTable) {
                empleadosTable.clear().rows.add(empleados).draw(); // Carga el array actualizado en DataTables y redibuja la tabla
             }
             // No es necesario llamar a showEmpleadosList a menos que quieras cambiar de sección
         }
     }

     // Editar empleado
      // La función ahora se llama desde el evento de delegación de DataTables (en el enlace del nombre)
     window.editarEmpleado = function(id) { // Hacemos la función global
         showEmpleadoForm(id); // Muestra el formulario y carga los datos
     }

     // Mostrar detalle de empleado
      // La función ahora se llama desde el evento de delegación de DataTables (en el enlace del nombre)
     window.mostrarDetalleEmpleado = function(id) { // Hacemos la función global
          const empleado = empleados.find(e => e.id == id); // Usamos == para comparar number con string si es necesario
         if (!empleado) {
              mostrarAlerta('Empleado no encontrado', 'danger');
             return;
         }

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

         ocultarTodo(); // Oculta todo primero
         if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
         actualizarBreadcrumb('Detalle de Empleado');

         // Event listener para el botón Editar desde Detalle
         const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
         if (btnEditarDesdeDetalle) {
              // Quitamos listener viejo y ponemos uno nuevo para evitar duplicados
             const newBtnEditarDesdeDetalle = btnEditarDesdeDetalle.cloneNode(true);
             btnEditarDesdeDetalle.parentNode.replaceChild(newBtnEditarDesdeDetalle, btnEditarDesdeDetalle);
             newBtnEditarDesdeDetalle.addEventListener('click', function() {
                 editarEmpleado(empleado.id); // Llama a la función editarEmpleado
             });
         }

          // Event listener para el botón Volver desde Detalle
          const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
          if (btnVolverDesdeDetalle) {
              // Quitamos listener viejo y ponemos uno nuevo
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
         // Calcula la diferencia en milisegundos, luego convierte a años exactos (flotante)
         const diffTime = Math.abs(hoy - inicio);
         const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Considera años bisiestos
         return diffYears; // Retorna un número (puede tener decimales) para comparación precisa
     }

     function calcularAntiguedadTexto(fechaIngreso) {
         if (!fechaIngreso) return 'No registrada';
         const diffTime = Math.abs(new Date() - new Date(fechaIngreso));

         const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
         const remainingTime = diffTime % (1000 * 60 * 60 * 24 * 365.25);
         const months = Math.floor(remainingTime / (1000 * 60 * 60 * 24 * 30.44)); // Promedio de días al mes

         if (years > 0) {
             return `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
         } else {
              // Si son menos de un año, mostrar solo meses si hay
             return months > 0 ? `${months} mes${months > 1 ? 'es' : ''}` : 'Menos de un mes';
         }
     }


    function calcularDiasParaCumpleanos(fechaNacimiento) {
        if (!fechaNacimiento) return Infinity; // Si no hay fecha, consideramos que no tiene cumpleaños próximo
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Reiniciar horas para comparación de días precisos
        const cumple = new Date(fechaNacimiento);

        // Si el cumpleaños de este año ya pasó, considerar el próximo año
        // Comparamos el día y mes del cumpleaños con el día y mes de hoy
        cumple.setFullYear(hoy.getFullYear()); // Ponemos el año actual al cumpleaños
         if (cumple < hoy) {
             cumple.setFullYear(hoy.getFullYear() + 1); // Si ya pasó este año, usamos el próximo
         }

         // Si el cumpleaños cae en un año bisiesto (29 de febrero) y el año actual/próximo no lo es, ajustar la fecha
         // (Esto es una simplificación, Date objects manejan bien los bisiestos pero puede haber edge cases)
         // No es estrictamente necesario para la demo, Date() generalmente lo maneja.

         // Calcular la diferencia en días
        const diffTime = cumple.getTime() - hoy.getTime(); // Usar getTime() para milisegundos
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Redondeamos hacia arriba para incluir el día actual/próximo

        return diffDays;
    }


    function formatearFecha(fecha) {
        if (!fecha) return 'No registrada';
        // Intentar parsear la fecha en formato YYYY-MM-DD (como viene del input type="date")
        try {
             const [year, month, day] = fecha.split('-');
             if (year && month && day) {
                 return `${day}/${month}/${year}`; // Formato DD/MM/YYYY
             } else {
                 // Si el split falla o no produce 3 partes, intentar parsear directamente
                 const dateObj = new Date(fecha);
                  if (!isNaN(dateObj.getTime())) { // Verificar si la fecha es válida
                       return dateObj.toLocaleDateString(); // Usar el formato local del navegador
                   } else {
                       return 'Fecha inválida';
                   }
             }
        } catch (e) {
             // Si hay algún error, usar el método por defecto de Date
             try {
                 const dateObj = new Date(fecha);
                 if (!isNaN(dateObj.getTime())) {
                      return dateObj.toLocaleDateString();
                  } else {
                      return 'Fecha inválida';
                  }
             } catch (e2) {
                  return 'Fecha inválida';
             }
        }
    }


    function formatearMiles(valor) {
        if (valor === null || valor === undefined || valor === '') return ''; // Maneja valores nulos o vacíos
         // Asegurarse de que es un número antes de formatear
        const numero = parseFloat(valor);
        if (isNaN(numero)) return valor; // Devuelve el valor original si no es un número válido

        // Formatear con puntos como separador de miles y coma para decimales
        return numero.toLocaleString('es-CO', { // 'es-CO' para formato colombiano
             minimumFractionDigits: 0, // Mínimo de decimales (cambia si necesitas mostrar céntimos)
             maximumFractionDigits: 2 // Máximo de decimales visibles
         });
    }


    function limpiarMiles(valor) {
         if (!valor) return '';
         // Convertir a string si no lo es, luego eliminar puntos (separador de miles)
         // y reemplazar coma por punto (separador de decimales) para obtener un número válido para parseFloat
         return String(valor).replace(/\./g, '').replace(/,/g, '.');
     }

    function mostrarAlerta(mensaje, tipo = 'success') {
        const alertaContainer = document.getElementById('alerta-visual'); // Usamos el contenedor en el HTML
         if (!alertaContainer) {
             console.error("Contenedor #alerta-visual no encontrado.");
             // Si el contenedor no existe, mostramos una alerta básica del navegador (menos ideal)
             alert(mensaje);
             return;
         }

         // Limpiamos el contenedor por si había otra alerta y añadimos el contenido
         alertaContainer.innerHTML = `
             ${mensaje}
             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
         `;

         // Establecemos las clases de Bootstrap para el estilo y la visibilidad
         alertaContainer.className = `alert alert-${tipo} alert-dismissible fade`; // Clases base
         alertaContainer.style.display = 'block'; // Aseguramos que sea visible para la transición
         alertaContainer.classList.add('show'); // Agregamos 'show' para activar la transición fade-in

         // Configuramos un temporizador para ocultar la alerta
         setTimeout(() => {
             alertaContainer.classList.remove('show'); // Remueve 'show' para activar la transición fade-out
             // Opcional: Esperar un poco más antes de ocultar completamente si la transición toma tiempo
             // setTimeout(() => { alertaContainer.style.display = 'none'; }, 150); // 150ms es una duración común para fade
         }, 4000); // Ocultar después de 4 segundos
    }


    function actualizarFiltroDepartamentos() {
        // Obtiene una lista única y ordenada de departamentos de los empleados, excluyendo valores vacíos
        const departamentos = [...new Set(empleados.map(emp => emp.departamento).filter(dep => dep && dep.trim() !== '').sort())]; // Obtiene, filtra vacíos y ordena
         if (filtroDepartamentoSelect) {
             const selectedValue = filtroDepartamentoSelect.value; // Guarda la selección actual del usuario
             filtroDepartamentoSelect.innerHTML = '<option value="">Todos los departamentos</option>'; // Reinicia las opciones

             // Añade las nuevas opciones ordenadas
             departamentos.forEach(dep => {
                 const option = document.createElement('option');
                 option.value = dep;
                 option.textContent = dep;
                 filtroDepartamentoSelect.appendChild(option);
             });

              // Intenta restaurar la selección anterior del usuario si todavía existe en la nueva lista
              if (departamentos.includes(selectedValue)) {
                   filtroDepartamentoSelect.value = selectedValue;
              } else {
                   filtroDepartamentoSelect.value = ""; // Si la opción anterior no existe, selecciona "Todos"
              }
         }
    }

     // Exportar a CSV
     function exportarEmpleadosCSV() {
         // Considerar exportar solo los datos visibles si se aplican filtros en DataTables
         // Para simplificar, por ahora exportamos todos los datos del array 'empleados'
         const datosAExportar = empleados; // O empleadosTable.rows({ search: 'applied' }).data().toArray(); para solo visibles


         if (!datosAExportar.length) {
             mostrarAlerta('No hay empleados para exportar', 'warning');
             return;
         }

         const headers = [
             'ID', 'Nombres', 'Apellidos', 'Cédula', 'Teléfono', 'Email', 'Cargo',
             'Departamento', 'Tipo de Contrato', 'Salario', 'Fecha de Nacimiento',
             'Fecha de Ingreso', 'Antigüedad', 'Notas', 'Contacto Emergencia Nombre',
             'Contacto Emergencia Teléfono', 'Contacto Emergencia Parentesco'
         ];

         // Crear filas de datos, escapando comas y comillas dobles
         const rows = datosAExportar.map(emp => [
             emp.id,
             emp.nombres,
             emp.apellidos,
             emp.cedula,
             emp.telefono,
             emp.email,
             emp.cargo || '',
             emp.departamento || '',
             emp.tipoContrato || '',
             formatearMiles(limpiarMiles(emp.salario)) || '', // Limpiar y luego formatear para exportar
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

         // La alerta se mostrará ANTES de la descarga en algunos navegadores
         mostrarAlerta('Preparando descarga de datos de empleados...', 'info');
     }


    // Notificaciones de cumpleaños
    function notificarCumpleanos() {
        // Asegurarse de que esta notificación solo se muestre una vez por sesión o página cargada si es posible
        // (La lógica actual la llama en cada login exitoso)
         const today = new Date();
         const todayKey = today.toISOString().slice(0, 10); // Formato YYYY-MM-DD

         // Usar localStorage para trackear si ya notificamos hoy
         const lastNotificationDate = localStorage.getItem('lastCumpleanosNotification');

         if (lastNotificationDate === todayKey) {
             return; // Ya notificamos hoy
         }

        empleados.forEach(emp => {
            if (emp.fechaNacimiento) {
                const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                // Mostramos notificaciones para cumpleaños hoy (0 días) o mañana (1 día)
                if (dias === 0) {
                    mostrarAlerta(`🎉 ¡Hoy es el cumpleaños de ${emp.nombres || ''} ${emp.apellidos || ''}!`, 'info');
                } else if (dias === 1) {
                    mostrarAlerta(`🎂 ¡Mañana es el cumpleaños de ${emp.nombres || ''} ${emp.apellidos || ''}!`, 'info');
                }
            }
        });

         // Marcar que ya notificamos hoy
         localStorage.setItem('lastCumpleanosNotification', todayKey);
    }


    // --- Inicialización ---

    // Toggle de contraseña - Asegurarnos de que solo se añade un listener por botón
    // Usamos delegación de eventos en el body para manejar todos los botones .toggle-password
    document.body.addEventListener('click', function(event) {
         const btn = event.target.closest('.toggle-password'); // Busca el botón .toggle-password más cercano
         if (btn) {
             const targetId = btn.getAttribute('data-target');
             const input = document.getElementById(targetId);
             const icon = btn.querySelector('i');

             if (input && icon) {
                 if (input.type === 'password') {
                     input.type = 'text';
                     icon.classList.remove('bi-eye');
                     icon.classList.add('bi-eye-slash');
                 } else {
                     input.type = 'password';
                     icon.classList.remove('bi-eye-slash');
                     icon.classList.add('bi-eye');
                 }
             }
         }
    });


    // Restablecer contraseña - Event listener para el enlace "Olvidaste tu contraseña"
    if (forgotPasswordLink) {
         forgotPasswordLink.addEventListener('click', function(e) {
             e.preventDefault();
             if (resetPasswordForm) resetPasswordForm.reset();
             if (resetPasswordFields) resetPasswordFields.classList.add('d-none');
             emailToReset = ''; // Limpiar email a restablecer
             const resetEmailInput = document.getElementById('reset-email');
             if (resetEmailInput) resetEmailInput.readOnly = false; // Asegurarse de que el email input sea editable
             if (resetPasswordModal) resetPasswordModal.show();
         });
    }

     // Restablecer contraseña - Event listener para el formulario del modal
     if (resetPasswordForm) {
         resetPasswordForm.addEventListener('submit', function(e) {
             e.preventDefault();
             const emailInput = document.getElementById('reset-email');
             const email = emailInput ? emailInput.value.trim() : '';


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
                 if (newPassword.length < 6) { // Validación simple de contraseña
                      mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'danger');
                     return;
                 }

                 // Buscar y actualizar usuario por el email guardado previamente (emailToReset)
                 const userIndex = usuariosPermitidos.findIndex(u => u.email === emailToReset);
                 if (userIndex !== -1) {
                     usuariosPermitidos[userIndex].password = newPassword; // Actualiza la contraseña
                     localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos)); // Guarda en localStorage
                     mostrarAlerta('Contraseña restablecida con éxito. Ya puedes iniciar sesión.', 'success');
                     if (resetPasswordModal) resetPasswordModal.hide(); // Cierra el modal
                 } else {
                     // Esto no debería pasar si el flujo es correcto, pero como seguridad
                     mostrarAlerta('Error al encontrar usuario para restablecer', 'danger');
                 }
             } else {
                 // Lógica para verificar email y mostrar campos de nueva contraseña
                 const usuario = usuariosPermitidos.find(u => u.email === email);
                 if (usuario) {
                     emailToReset = email; // Guardar email para el siguiente paso
                     if (resetPasswordFields) resetPasswordFields.classList.remove('d-none'); // Muestra los campos de contraseña
                     if (emailInput) emailInput.readOnly = true; // Hacer el input de email de solo lectura
                 } else {
                     mostrarAlerta('El correo no está registrado', 'danger');
                 }
             }
         });
     }


    // Asignar Event Listeners a botones de navegación/acción principales (Usando addEventListener)
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registroForm) registroForm.addEventListener('submit', handleRegistro);

    // Botones de navegación en el navbar o dashboard
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm());
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm());
    if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList);
    if (btnCancelar) btnCancelar.addEventListener('click', cancelarFormulario); // Botón cancelar formulario empleado
    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm); // Botón "Registrarse" del navbar
    if (btnCancelarRegistro) btnCancelarRegistro.addEventListener('click', hideRegistroForm); // Botón cancelar formulario registro
    if (btnLogin) btnLogin.addEventListener('click', showLoginForm); // Botón "Iniciar Sesión" del navbar
    if (btnLogout) btnLogout.addEventListener('click', handleLogout); // Botón "Cerrar Sesión" del navbar
    if (btnDashboard) btnDashboard.addEventListener('click', showDashboard); // Botón "Dashboard" del navbar
    if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList); // Botón "Empleados" del navbar
    if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList); // Botón "Cumpleaños" del navbar
    if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList); // Botón "Ausencias" del navbar
    if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV); // Botón "Exportar CSV"


    // Listener para el enlace "Inicio" en el breadcrumb
    if (breadcrumbHome) {
         breadcrumbHome.addEventListener('click', function(e) {
             e.preventDefault(); // Previene la navegación por defecto del enlace
             if (isAuthenticated) {
                 showDashboard(); // Ir al dashboard si está autenticado
             } else {
                 showLoginForm(); // Ir al login si no está autenticado
             }
         });
         // Asegurarse de que el enlace de inicio sea visible si el breadcrumb es visible
         const homeLinkInBreadcrumb = breadcrumbHome.querySelector('a');
         if(homeLinkInBreadcrumb) homeLinkInBreadcrumb.style.display = 'inline'; // Asegurar que el enlace sea visible
    } else {
         console.warn("Elemento #breadcrumb-home no encontrado.");
    }


    // --- Inicio de la aplicación ---
    // Al cargar la página, verificar si hay un usuario autenticado (simulado)
    // Para esta demo, siempre empezamos en el login a menos que ya hubiéramos implementado un login persistente.
    // Iniciamos en el login y si el usuario ingresa credenciales correctas, mostramos el dashboard.

    // Check if there's a stored 'usuarioActual' from a previous session (optional for demo)
    // let storedUser = JSON.parse(localStorage.getItem('usuarioActual'));
    // if (storedUser) {
    //     usuarioActual = storedUser;
    //     isAuthenticated = true;
    //     mostrarElementosAutenticados();
    //     showDashboard();
    //     notificarCumpleanos();
    // } else {
         isAuthenticated = false;
         usuarioActual = null;
         ocultarElementosAutenticados(); // Asegura que solo se vean login/registro al inicio
         showLoginForm(); // Muestra el formulario de login al cargar la página
    // }

    // La notificacion de cumpleaños se llama en el login exitoso ahora
    // notificarCumpleanos();


}); // Fin de DOMContentLoaded

// Nota de seguridad: Almacenar contraseñas y datos sensibles (como datos de empleados si son confidenciales)
// en localStorage del navegador NO es seguro para una aplicación de producción.
// Para una propuesta, puede ser aceptable para demostrar funcionalidad, pero una aplicación real requiere un backend seguro
// para la autenticación, el almacenamiento de datos y el manejo de archivos (hojas de vida).
