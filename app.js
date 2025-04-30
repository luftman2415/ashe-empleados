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
    const btnRegistro = document.getElementById('btn-registro'); // Botón "Registrarse" del navbar
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro'); // Botón cancelar formulario registro
    const btnLogin = document.getElementById('btn-login'); // Botón "Iniciar Sesión" del navbar
    const btnLogout = document.getElementById('btn-logout'); // Botón "Cerrar Sesión" del navbar
    const btnDashboard = document.getElementById('btn-dashboard'); // Botón "Dashboard" del navbar
    const btnEmpleados = document.getElementById('btn-empleados'); // Botón "Empleados" del navbar
    const btnCumpleanos = document.getElementById('btn-cumpleanos'); // Botón "Cumpleaños" del navbar
    const btnAusencias = document.getElementById('btn-ausencias'); // Botón "Ausencias" del navbar
    const btnExportarCSV = document.getElementById('btn-exportar-csv'); // Botón "Exportar CSV"

    // Elementos de filtro y búsqueda externos a la tabla
    const busquedaEmpleadosInput = document.getElementById('busqueda-empleados');
    const filtroDepartamentoSelect = document.getElementById('filtro-departamento');
    const filtroAntiguedadSelect = document.getElementById('filtro-antiguedad');

    const breadcrumbSection = document.getElementById('breadcrumb-section');
    const breadcrumbHomeLink = document.getElementById('breadcrumb-home-link'); // El enlace de "Inicio" en el breadcrumb


    // Modal de restablecer contraseña
    const resetPasswordModalElement = document.getElementById('reset-password-modal');
    const resetPasswordModal = resetPasswordModalElement ? new bootstrap.Modal(resetPasswordModalElement) : null; // Inicialización segura
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetPasswordFields = document.getElementById('reset-password-fields');
    const forgotPasswordLink = document.getElementById('forgot-password-link'); // Enlace "¿Olvidaste tu contraseña?"
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
             const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]'); // Seleccionar la navegación del breadcrumb
              if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');
        }
    }

    function showLoginForm() {
         ocultarTodo(); // Oculta todo primero
         if (loginForm) loginForm.classList.remove('d-none');
         ocultarElementosAutenticados(); // Oculta elementos del navbar autenticado
         actualizarBreadcrumb('Inicio de Sesión');
         limpiarLogin(); // Limpia el formulario de login
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
         if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Oculta el breadcrumb en la página de login
     }

     function showRegistroForm() {
         ocultarTodo(); // Oculta todo primero
         if (registroForm) registroForm.classList.remove('d-none');
         // ocultarElements([btnLogin, btnRegistro]); // Asegura que los botones Login/Registro estén ocultos en el navbar
         actualizarBreadcrumb('Registro');
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
         if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Oculta el breadcrumb en la página de registro
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
         mostrarElementosAutenticados(); // Muestra los botones correctos del navbar

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
        mostrarElementosAutenticados(); // Muestra los botones correctos del navbar

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
                             return `<a href="#" class="ver-empleado" data-id="<span class="math-inline">\{row\.id\}"\></span>{data || ''}</a>`;
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
                                <button class="btn btn-sm btn-primary editar-empleado-btn" data-id="<span class="math-inline">\{data\}"\>
<i class\="bi bi\-pencil"\></i\>
</button\>
<button class\="btn btn\-sm btn\-danger eliminar\-empleado\-btn" data\-id\="</span>{data}">
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
                     // ^value$ busca el valor exacto en la columna. '' busca cualquier cosa (quita filtro)
                     empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
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

                         const años = calcularAntiguedad(fechaIngreso); // Calcula la antigüedad exacta (puede ser flotante)

                         const [minStr, maxStr] = antiguedadFiltro.split('-');
                         const min = parseInt(minStr);
                         const max = maxStr === '+' ? Infinity : parseInt(maxStr);

                         // Rango "0-1": años >= 0 && años < 1 (menos de 1 año)
                         // Rango "1-3": años >= 1 && años < 3 (1, 2 años)
                         // Rango "3-5": años >= 3 && años < 5 (3, 4 años)
                         // Rango "5+": años >= 5 (5 años o más)
                         if (maxStr === '+') {
                              return años >= min;
                         } else {
                              return años >= min && años < max;
                         }
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
             // Primero búsqueda global
             if (busquedaEmpleadosInput) empleadosTable.search(busquedaEmpleadosInput.value).draw();
             // Luego filtro de columna por departamento
             if (filtroDepartamentoSelect) {
                  const searchValue = filtroDepartamentoSelect.value;
                  empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
             }
             // El filtro de antigüedad es personalizado, solo necesitamos redibujar
             if (filtroAntiguedadSelect) empleadosTable.draw();

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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren
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
                         <p><strong>Salario:</strong> <span class="math-inline">\{usuarioActual && usuarioActual\.rol \=\=\= 'admin' ? formatearMiles\(empleado\.salario\) \: '\*\*\*\*'\}</p\>
</div\>
</div\>
<div class\="row mt\-3"\>
<div class\="col\-12"\>
<h5\>Notas / Acontecimientos</h5\>
<p\></span>{empleado.notas || 'Sin notas registradas'}</p>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


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


     function showCumpleanosList() {
         if (!isAuthenticated) {
             showLoginForm();
             return;
         }
         ocultarTodo(); // Oculta todo primero
          if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
         actualizarBreadcrumb('Próximos Cumpleaños');
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren

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
                 <td>${emp.nombres || ''} <span class="math-inline">\{emp\.apellidos \|\| ''\}</td\>
<td\></span>{formatearFecha(emp.fechaNacimiento)}</td>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


         // Renderizar lista de ausencias (puedes mejorar esto con DataTables)
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         // Ordenar ausencias por fecha descendente
         // Usar slice() para no mutar el array original si se necesita
         const ausenciasOrdenadas = ausencias.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));


         ausenciasOrdenadas.forEach(ausencia => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td><span class="math-inline">\{ausencia\.nombreEmpleado \|\| ''\}</td\>
<td\></span>{formatearFecha(ausencia.fecha)}</td>
                 <td><span class="math-inline">\{ausencia\.tipo \|\| ''\}</td\>
<td\>
<button class\="btn btn\-sm btn\-danger eliminar\-ausencia\-btn" data\-id\="</span>{ausencia.id}">
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
          if (confirm('¿Está seguro de que desea eliminar esta ausencia? Esta acción es irreversible.')) {
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

        const email = emailInput ? emailInput.value.trim() : ''; // Limpiar email
        const password = passwordInput ? passwordInput.value : ''; // No limpiar password


        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
             // localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual)); // Opcional: guardar sesión (menos seguro en localStorage)
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
        // Opcional: Limpiar localStorage si implementaste guardar sesión
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
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Mostrar botones específicos del dashboard o lista de empleados (depende de la sección)
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) { // Si el dashboard está visible
             mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
             mostrarElements([btnNuevoEmpleadoLista]); // Mostrar solo el botón de "Nuevo Empleado" en la lista
             ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]); // Asegurar que los otros estén ocultos
         } else { // Si ninguna sección principal está visible (ej: formulario, detalle)
              ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV, btnNuevoEmpleadoLista]); // Ocultar todos los botones específicos
         }


        // Ocultar botones de login/registro
        ocultarElements([btnLogin, btnRegistro]);

        // Mostrar breadcrumb
        const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
        if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');
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
         const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
         if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
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
        if (password.length < 6) { // Validación simple de longitud
             mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }


        if (usuariosPermitidos.some(u => u.email === email)) {
            mostrarAlerta('El correo electrónico ya está registrado', 'danger');
            return;
        }

        // Guardar usuario con rol 'rrhh' (puedes cambiar el rol si es necesario)
        usuariosPermitidos.push({ email: email, password: password, rol: 'rrhh' }); // Guardamos el nuevo usuario
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos)); // Guardamos la lista actualizada en localStorage
        mostrarAlerta('Usuario registrado exitosamente. Ya puedes iniciar sesión.', 'success');
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
                 id: editId ? parseInt(editId) : Date.now(), // Usa Date.now() como ID para nuevos (simple)
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

             if (!empleado.nombres || !empleado.apellidos || !empleado.cedula || !empleado.telefono || !empleado.email) {
                  mostrarAlerta('Los campos Nombre, Apellido, Cédula, Teléfono y Email son obligatorios.', 'warning');
                  return; // Detiene el proceso de guardar si faltan campos requeridos
             }


             if (editId) {
                 // Actualizar empleado existente
                 const index = empleados.findIndex(e => e.id == editId);
                 if (index !== -1) {
                      // Verificar si la cédula ya existe en otro empleado (si se cambió la cédula)
                      if (empleados.some(e => e.cedula === empleado.cedula && e.id != editId && e.cedula !== '')) {
                           mostrarAlerta(`Ya existe otro empleado con la cédula ${empleado.cedula}`, 'warning');
                           return; // Detiene el proceso de guardar
                      }
                     empleados[index] = empleado;
                     mostrarAlerta('Empleado actualizado correctamente', 'success');
                 } else {
                      mostrarAlerta('Error: Empleado a editar no encontrado.', 'danger');
                 }
             } else {
                 // Añadir nuevo empleado
                  // Verificar si ya existe un empleado con la misma cédula
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
             const salarioInput = document.getElementById('salario');
             if (salarioInput) {
                 const salarioNum = parseFloat(empleado.salario);
                 salarioInput.value = isNaN(salarioNum) ? (empleado.salario || '') : formatearMiles(salarioNum);
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
         if (confirm('¿Está seguro de que desea eliminar este empleado? Esta acción es irreversible.')) { // Mensaje más claro
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
                         <p><strong>Salario:</strong> <span class="math-inline">\{usuarioActual && usuarioActual\.rol \=\=\= 'admin' ? formatearMiles\(empleado\.salario\) \: '\*\*\*\*'\}</p\>
</div\>
</div\>
<div class\="row mt\-3"\>
<div class\="col\-12"\>
<h5\>Notas / Acontecimientos</h5\>
<p\></span>{empleado.notas || 'Sin notas registradas'}</p>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


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


     function showCumpleanosList() {
         if (!isAuthenticated) {
             showLoginForm();
             return;
         }
         ocultarTodo(); // Oculta todo primero
          if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
         actualizarBreadcrumb('Próximos Cumpleaños');
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren

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
                 <td>${emp.nombres || ''} <span class="math-inline">\{emp\.apellidos \|\| ''\}</td\>
<td\></span>{formatearFecha(emp.fechaNacimiento)}</td>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


         // Renderizar lista de ausencias (puedes mejorar esto con DataTables)
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         // Ordenar ausencias por fecha descendente
         // Usar slice() para no mutar el array original si se necesita
         const ausenciasOrdenadas = ausencias.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));


         ausenciasOrdenadas.forEach(ausencia => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td><span class="math-inline">\{ausencia\.nombreEmpleado \|\| ''\}</td\>
<td\></span>{formatearFecha(ausencia.fecha)}</td>
                 <td><span class="math-inline">\{ausencia\.tipo \|\| ''\}</td\>
<td\>
<button class\="btn btn\-sm btn\-danger eliminar\-ausencia\-btn" data\-id\="</span>{ausencia.id}">
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
          if (confirm('¿Está seguro de que desea eliminar esta ausencia? Esta acción es irreversible.')) {
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

        const email = emailInput ? emailInput.value.trim() : ''; // Limpiar email
        const password = passwordInput ? passwordInput.value : ''; // No limpiar password


        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
             // localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual)); // Opcional: guardar sesión (menos seguro en localStorage)
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
        // Opcional: Limpiar localStorage si implementaste guardar sesión
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
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Mostrar botones específicos del dashboard o lista de empleados (depende de la sección)
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) { // Si el dashboard está visible
             mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
             mostrarElements([btnNuevoEmpleadoLista]); // Mostrar solo el botón de "Nuevo Empleado" en la lista
             ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]); // Asegurar que los otros estén ocultos
         } else { // Si ninguna sección principal está visible (ej: formulario, detalle)
              ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV, btnNuevoEmpleadoLista]); // Ocultar todos los botones específicos
         }


        // Ocultar botones de login/registro
        ocultarElements([btnLogin, btnRegistro]);

        // Mostrar breadcrumb
        const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
        if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');
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
         const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
         if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
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
        if (password.length < 6) { // Validación simple de longitud
             mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }


        if (usuariosPermitidos.some(u => u.email === email)) {
            mostrarAlerta('El correo electrónico ya está registrado', 'danger');
            return;
        }

        // Guardar usuario con rol 'rrhh' (puedes cambiar el rol si es necesario)
        usuariosPermitidos.push({ email: email, password: password, rol: 'rrhh' }); // Guardamos el nuevo usuario
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos)); // Guardamos la lista actualizada en localStorage
        mostrarAlerta('Usuario registrado exitosamente. Ya puedes iniciar sesión.', 'success');
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
                 id: editId ? parseInt(editId) : Date.now(), // Usa Date.now() como ID para nuevos (simple)
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

             if (!empleado.nombres || !empleado.apellidos || !empleado.cedula || !empleado.telefono || !empleado.email) {
                  mostrarAlerta('Los campos Nombre, Apellido, Cédula, Teléfono y Email son obligatorios.', 'warning');
                  return; // Detiene el proceso de guardar si faltan campos requeridos
             }


             if (editId) {
                 // Actualizar empleado existente
                 const index = empleados.findIndex(e => e.id == editId);
                 if (index !== -1) {
                      // Verificar si la cédula ya existe en otro empleado (si se cambió la cédula)
                      if (empleados.some(e => e.cedula === empleado.cedula && e.id != editId && e.cedula !== '')) {
                           mostrarAlerta(`Ya existe otro empleado con la cédula ${empleado.cedula}`, 'warning');
                           return; // Detiene el proceso de guardar
                      }
                     empleados[index] = empleado;
                     mostrarAlerta('Empleado actualizado correctamente', 'success');
                 } else {
                      mostrarAlerta('Error: Empleado a editar no encontrado.', 'danger');
                 }
             } else {
                 // Añadir nuevo empleado
                  // Verificar si ya existe un empleado con la misma cédula
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
             const salarioInput = document.getElementById('salario');
             if (salarioInput) {
                 const salarioNum = parseFloat(empleado.salario);
                 salarioInput.value = isNaN(salarioNum) ? (empleado.salario || '') : formatearMiles(salarioNum);
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
         if (confirm('¿Está seguro de que desea eliminar este empleado? Esta acción es irreversible.')) { // Mensaje más claro
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
                         <p><strong>Salario:</strong> <span class="math-inline">\{usuarioActual && usuarioActual\.rol \=\=\= 'admin' ? formatearMiles\(empleado\.salario\) \: '\*\*\*\*'\}</p\>
</div\>
</div\>
<div class\="row mt\-3"\>
<div class\="col\-12"\>
<h5\>Notas / Acontecimientos</h5\>
<p\></span>{empleado.notas || 'Sin notas registradas'}</p>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


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


     function showCumpleanosList() {
         if (!isAuthenticated) {
             showLoginForm();
             return;
         }
         ocultarTodo(); // Oculta todo primero
          if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
         actualizarBreadcrumb('Próximos Cumpleaños');
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren

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
                 <td>${emp.nombres || ''} <span class="math-inline">\{emp\.apellidos \|\| ''\}</td\>
<td\></span>{formatearFecha(emp.fechaNacimiento)}</td>
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
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


         // Renderizar lista de ausencias (puedes mejorar esto con DataTables)
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         // Ordenar ausencias por fecha descendente
         // Usar slice() para no mutar el array original si se necesita
         const ausenciasOrdenadas = ausencias.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));


         ausenciasOrdenadas.forEach(ausencia => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                 <td><span class="math-inline">\{ausencia\.nombreEmpleado \|\| ''\}</td\>
<td\></span>{formatearFecha(ausencia.fecha)}</td>
                 <td><span class="math-inline">\{ausencia\.tipo \|\| ''\}</td\>
<td\>
<button class\="btn btn\-sm btn\-danger eliminar\-ausencia\-btn" data\-id\="</span>{ausencia.id}">
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
          if (confirm('¿Está seguro de que desea eliminar esta ausencia? Esta acción es irreversible.')) {
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

        const email = emailInput ? emailInput.value.trim() : ''; // Limpiar email
        const password = passwordInput ? passwordInput.value : ''; // No limpiar password


        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
             // localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual)); // Opcional: guardar sesión (menos seguro en localStorage)
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
        // Opcional: Limpiar localStorage si implementaste guardar sesión
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
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Mostrar botones específicos del dashboard o lista de empleados (depende de la sección)
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) { // Si el dashboard está visible
             mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
             mostrarElements([btnNuevoEmpleadoLista]); // Mostrar solo el botón de "Nuevo Empleado" en la lista
             ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]); // Asegurar que los otros estén ocultos
         } else { // Si ninguna sección principal está visible (ej: formulario, detalle)
              ocultarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV, btnNuevoEmpleadoLista]); // Ocultar todos los botones específicos
         }


        // Ocultar botones de login/registro
        ocultarElements([btnLogin, btnRegistro]);

        // Mostrar breadcrumb
        const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
        if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');
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
         const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
         if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
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
        if (password.length < 6) { // Validación simple de longitud
             mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }


        if (usuariosPermitidos.some(u => u.email === email)) {
            mostrarAlerta('El correo electrónico ya está registrado', 'danger');
            return;
        }

        // Guardar usuario con rol 'rrhh' (puedes cambiar el rol si es necesario)
        usuariosPermitidos.push({ email: email, password: password, rol: 'rrhh' }); // Guardamos el nuevo usuario
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos)); // Guardamos la lista actualizada en localStorage
        mostrarAlerta('Usuario registrado exitosamente. Ya puedes iniciar sesión.', 'success');
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
                 id: editId ? parseInt(editId) : Date.now(), // Usa Date.now() como ID para nuevos (simple)
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

             if (!empleado.nombres || !empleado.apellidos || !empleado.cedula || !empleado.telefono || !empleado.email) {
                  mostrarAlerta('Los campos Nombre, Apellido, Cédula, Teléfono y Email son obligatorios.', 'warning');
                  return; // Detiene el proceso de guardar si faltan campos requeridos
             }


             if (editId) {
                 // Actualizar empleado existente
                 const index = empleados.findIndex(e => e.id == editId);
                 if (index !== -1) {
                      // Verificar si la cédula ya existe en otro empleado (si se cambió la cédula)
                      if (empleados.some(e => e.cedula === empleado.cedula && e.id != editId && e.cedula !== '')) {
                           mostrarAlerta(`Ya existe otro empleado con la cédula ${empleado.cedula}`, 'warning');
                           return; // Detiene el proceso de guardar
                      }
                     empleados[index] = empleado;
                     mostrarAlerta('Empleado actualizado correctamente', 'success');
                 } else {
                      mostrarAlerta('Error: Empleado a editar no encontrado.', 'danger');
                 }
             } else {
                 // Añadir nuevo empleado
                  // Verificar si ya existe un empleado con la misma cédula
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
             const salarioInput = document.getElementById('salario');
             if (salarioInput) {
                 const salarioNum = parseFloat(empleado.salario);
                 salarioInput.value = isNaN(salarioNum) ? (empleado.salario || '') : formatearMiles(salarioNum);
             }
             if (document.getElementById('fecha-nacimiento')) document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento || '';
             if (document.getElementById('fecha-ingreso')) document.getElementById('fecha-ingreso').value = empleado.fechaIngreso || '';
             if (document.getElementById('notas')) document.getElementById('notas').value = empleado.notas || '';
             if (document.getElementById('contacto-emergencia-nombre')) document.getElementById('contacto-emergencia-nombre').value = empleado.contactoEmergenciaNombre || '';
             if (document.getElementById('contacto-emergencia-telefono')) document.getElementById('contacto-emergencia-telefono').value = empleado.contacto
