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

    // Elementos del DOM - Obtenemos referencias (VERIFICADOS - Los IDs coinciden con HTML)
    const loginForm = document.getElementById('login-form');
    const registroForm = document.getElementById('registro-form');
    const empleadosListSection = document.getElementById('empleados-list');
    const empleadoFormSection = document.getElementById('empleado-form');
    const empleadoDetalleSection = document.getElementById('empleado-detalle');
    const cumpleanosListSection = document.getElementById('cumpleanos-list');
    const dashboardSection = document.getElementById('dashboard');
    const ausenciasListSection = document.getElementById('ausencias-list');

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
    // Botones dentro del formulario del modal (los necesitamos para adjuntar listeners)
    const resetRequestBtn = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null; // El primer submit es solicitar
    const resetConfirmBtn = resetPasswordForm ? resetPasswordForm.querySelector('.modal-footer button.btn-primary') : null; // El de continuar en el footer

    const resetPasswordFields = document.getElementById('reset-password-fields');
    const forgotPasswordLink = document.getElementById('forgot-password-link'); // Enlace "¿Olvidaste tu contraseña?"
    let emailToReset = ''; // Variable para guardar el email en el proceso de reset


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
        const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]'); // Seleccionar la navegación del breadcrumb

        if (breadcrumbSection) {
            // Limpia los elementos breadcrumb existentes excepto el primero (Inicio)
            while (breadcrumbSection.nextElementSibling) {
                breadcrumbSection.nextElementSibling.remove();
            }

            // Añade el nuevo elemento breadcrumb
            const li = document.createElement('li');
            li.classList.add('breadcrumb-item', 'active'); // Marcar como activo
            li.textContent = seccion;
            breadcrumbSection.parentNode.appendChild(li);


             // Asegurarse de que el breadcrumb principal es visible si una sección está activa
              if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');

              // Ocultar el breadcrumb principal si estamos en login/registro
             if (seccion === 'Inicio de Sesión' || seccion === 'Registro') {
                 if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
             }
        }
    }


   function showLoginForm() {
         ocultarTodo(); // Oculta todo primero
         if (loginForm) loginForm.classList.remove('d-none'); // Muestra el formulario de login

         // --- NUEVA LÍNEA: Mostrar también la sección de contacto ---
         const contactoSection = document.getElementById('contacto');
         if (contactoSection) contactoSection.classList.remove('d-none');
         // --------------------------------------------------------


         ocultarElementosAutenticados(); // Oculta elementos del navbar autenticado
         actualizarBreadcrumb('Inicio de Sesión'); // Actualiza breadcrumb (luego se ocultará en el mismo actualizarBreadcrumb)
         limpiarLogin(); // Limpia el formulario de login
     }

      function showRegistroForm() {
          ocultarTodo(); // Oculta todo primero
          if (registroForm) registroForm.classList.remove('d-none');
          actualizarBreadcrumb('Registro'); // Actualiza breadcrumb (luego se ocultará)
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


         // Próximos cumpleaños para dashboard (Actualiza la tarjeta)
         const proximosCumpleanosCount = empleados.filter(emp => {
             if (!emp.fechaNacimiento) return false;
             const diasRestantes = calcularDiasParaCumpleanos(emp.fechaNacimiento);
             return diasRestantes >= 0 && diasRestantes <= 30; // Cumpleaños hoy o en los próximos 30 días
         }).length;
          if (document.getElementById('dashboard-cumpleanos')) {
             document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanosCount;
          }

          // Muestra las notificaciones detalladas en el div correspondiente
          notificarCumpleanos(); // Llama a la función para llenar el div `#cumpleanos-notificaciones`

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
                             // Solo permite eliminar si el usuario actual es admin
                             const eliminarBtnHtml = (usuarioActual && usuarioActual.rol === 'admin') ?
                                 `<button class="btn btn-sm btn-danger eliminar-empleado-btn" data-id="${data}" title="Eliminar Empleado">
                                     <i class="bi bi-trash"></i>
                                 </button>` : '';

                             return `
                                 <button class="btn btn-sm btn-primary editar-empleado-btn" data-id="${data}" title="Editar Empleado">
                                     <i class="bi bi-pencil"></i>
                                 </button>
                                 ${eliminarBtnHtml}
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
            // Usamos .off() antes de .on() para asegurarnos de no adjuntar múltiples listeners si la tabla se redibuja completamente (raro pero posible)
             $('#empleados-table-body').off('click', '.ver-empleado').on('click', '.ver-empleado', function(e) {
                 e.preventDefault(); // Previene la navegación del enlace
                 // Obtenemos el objeto de datos asociado a la fila clicada
                 const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      mostrarDetalleEmpleado(rowData.id);
                 }
             });
             $('#empleados-table-body').off('click', '.editar-empleado-btn').on('click', '.editar-empleado-btn', function() {
                  // Obtenemos el objeto de datos asociado al botón
                  const rowData = empleadosTable.row($(this).parents('tr')).data();
                  if (rowData && rowData.id !== undefined) {
                       editarEmpleado(rowData.id);
                  }
             });
             // Delegación solo para el botón eliminar, y solo si el usuario es admin
             // Aseguramos que el listener se adjunte *siempre*, pero la acción real dentro del handler verifica el rol.
             $('#empleados-table-body').off('click', '.eliminar-empleado-btn').on('click', '.eliminar-empleado-btn', function() {
                  // Obtenemos el objeto de datos asociado al botón
                  const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      eliminarEmpleado(rowData.id); // eliminarEmpleado ya verifica el rol
                 }
             });


             // --- Vincula los filtros y búsqueda externos a DataTables ---
             // Búsqueda global (vinculada al input que ya tienes)
             if (busquedaEmpleadosInput) {
                  // Usamos .off() antes de .on() para evitar duplicados si la función showEmpleadosList se llama varias veces
                  $(busquedaEmpleadosInput).off('keyup search').on('keyup search', function () {
                      empleadosTable.search(this.value).draw(); // Aplica la búsqueda global y redibuja
                  });
             }

             // Filtro por Departamento (aplicado a la columna de departamento)
             if (filtroDepartamentoSelect) {
                  // Usamos .off() antes de .on()
                  $(filtroDepartamentoSelect).off('change').on('change', function () {
                      const searchValue = this.value;
                      // La columna de departamento es la 7ma (índice 6, contando desde 0)
                      // ^value$ busca el valor exacto en la columna. '' busca cualquier cosa (quita filtro)
                      empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
                  });
             }

             // Filtro por Antigüedad (filtro personalizado en DataTables)
             if (filtroAntiguedadSelect) {
                  // Agregamos la lógica del filtro personalizado de DataTables una sola vez
                  // Solo agregamos la función de filtro una vez, pero su lógica interna usa el valor del select
                  if (!$.fn.dataTable.ext.search.some(fn => fn.name === 'antiguedadFilterFn')) { // Evita añadir el filtro múltiples veces
                      $.fn.dataTable.ext.search.push(
                          function antiguedadFilterFn( settings, data, dataIndex ) { // Añadimos un nombre a la función de filtro
                              // Asegura que este filtro solo se aplique a nuestra tabla de empleados
                              if ( settings.sTableId !== 'empleados-table' ) {
                                  return true; // No aplicar a otras tablas si las hubiera
                              }

                              // Obtener el valor seleccionado del filtro externo
                              const antiguedadFiltroElement = document.getElementById('filtro-antiguedad');
                              if (!antiguedadFiltroElement) return true; // No aplicar filtro si el select no existe
                              const antiguedadFiltro = antiguedadFiltroElement.value;


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
                  }


                  // El evento de cambio en el select de antigüedad solo necesita redibujar la tabla,
                  // el filtro personalizado de DataTables se encargará de la lógica.
                  // Usamos .off() antes de .on()
                  $(filtroAntiguedadSelect).off('change').on('change', function () {
                      empleadosTable.draw(); // Redibuja la tabla para aplicar el filtro personalizado
                  });
             }

             // Aplicar Bootstrap classes al selector de paginación de DataTables
              $('.dataTables_length select').addClass('form-select form-select-sm');


        } else {
            // Si DataTables ya está inicializado, solo actualizamos los datos
             empleadosTable.clear().rows.add(empleados).draw(); // Borra datos viejos, añade nuevos y redibuja
             // Re-aplicar filtros actuales al redibujar (en caso de que los selectores tengan valores)
             // DataTables debería recordar los filtros de búsqueda y columna al redibujar,
             // pero si usas filtros personalizados o buscas manualmente, podrías necesitar re-aplicarlos
             // Si usas los listeners de keyup/change en los inputs/selects externos, ellos ya disparan el draw()
             // Así que aquí quizás solo necesitamos redibujar si hay filtros activos fuera de esos eventos.
             // Una llamada draw() general suele bastar.
             empleadosTable.draw(); // Redibuja para asegurar que los datos frescos se muestren con filtros/búsqueda activos
        }
    }


    function showEmpleadoForm(editId = null) {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        const form = document.getElementById('empleadoForm');
        if (form) {
            form.reset(); // Limpia el formulario
             if (editId !== null && editId !== undefined) { // Usamos !== null/undefined para permitir editId = 0 si fuera el caso
                 form.setAttribute('data-edit-id', editId);
                 cargarDatosEmpleado(editId); // Carga datos si es edición
                 // Cambiar texto del botón Guardar a Actualizar
                 const saveButton = form.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Actualizar'; // Cambiar texto
             } else {
                 form.removeAttribute('data-edit-id'); // Remueve atributo si es nuevo empleado
                 // Cambiar texto del botón Guardar a Guardar
                 const saveButton = form.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Guardar'; // Cambiar texto
             }
        }
        ocultarTodo(); // Oculta todo primero
        if (empleadoFormSection) empleadoFormSection.classList.remove('d-none');
        actualizarBreadcrumb(editId !== null && editId !== undefined ? 'Editar Empleado' : 'Nuevo Empleado');
         mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren
    }

     function mostrarDetalleEmpleado(id) {
          if (!isAuthenticated) {
              showLoginForm();
              return;
          }
          const empleado = empleados.find(e => e.id == id); // Usamos == para comparar number con string si es necesario
          if (!empleado) {
               mostrarAlerta('Empleado no encontrado', 'danger');
              return;
          }

          const detalleBody = document.getElementById('empleado-detalle-body');
          if (detalleBody) {
              // Renderizar el detalle, incluyendo el salario solo si es admin
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

              // Ocultar el botón Editar si el usuario no es admin
              const btnEditar = document.getElementById('btn-editar-desde-detalle');
              if (btnEditar) {
                  if (usuarioActual && usuarioActual.rol !== 'admin') {
                      btnEditar.classList.add('d-none');
                  } else {
                       btnEditar.classList.remove('d-none'); // Asegurarse de que esté visible para admin
                  }
              }

          }

          ocultarTodo(); // Oculta todo primero
          if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
          actualizarBreadcrumb('Detalle de Empleado');
           mostrarElementosAutenticados(); // Asegura que los botones correctos del navbar se muestren


          // Event listener para el botón Editar desde Detalle
          // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
          const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
          if (btnEditarDesdeDetalle) {
              // Opcional: Remover listener si ya existiera (menos probable con DOMContentLoaded)
              // btnEditarDesdeDetalle.removeEventListener('click', editarEmpleado); // Si tuvieras una referencia a la función del handler

              // Adjuntamos el nuevo listener (la lógica dentro de la función verificaría el rol si fuera necesario,
              // pero la visibilidad ya se maneja arriba)
               btnEditarDesdeDetalle.addEventListener('click', function() {
                   // Encontramos el ID del empleado desde la sección de detalle si es necesario,
                   // o si la función mostrarDetalleEmpleado guarda el ID en algún lugar.
                   // Para simplificar, la llamamos con el ID del empleado cargado en la vista
                   // (asumimos que 'empleado' en el scope de mostrarDetalleEmpleado es el correcto)
                   // Una forma más robusta sería guardar el ID del empleado en la sección de detalle:
                   // if(empleadoDetalleSection) empleadoDetalleSection.setAttribute('data-empleado-id', empleado.id);
                   // Y luego recuperarlo aquí: const empleadoId = empleadoDetalleSection ? empleadoDetalleSection.getAttribute('data-empleado-id') : null;
                   // Para esta demo, pasaremos el ID directamente al llamar a esta función desde la tabla.
                   // Si esta función se llama desde otro lugar sin un ID explícito, necesitaríamos obtenerlo.
                   // Como la función mostrarDetalleEmpleado es la única que llama a esto, asumimos que 'empleado.id' es accesible o se pasa.
                   // PERO, la forma correcta es que mostrarDetalleEmpleado pase el ID a editarEmpleado.
                   // La lógica actual de mostrarDetalleEmpleado ya llama a editarEmpleado(empleado.id) directamente en el listener.
                   // ¡Revisando el código, el listener ya llama a editarEmpleado(empleado.id) directamente!
                   // El código que estaba dando error era el de cloneNode/replaceChild.
                   // Así que solo necesitamos adjuntar el listener sin el clonado/reemplazo.
                   // La función mostrarDetalleEmpleado ya adjunta el listener para el botón 'btn-editar-desde-detalle' y llama a editarEmpleado(empleado.id)
                   // PERO, ese listener se adjunta DENTRO de mostrarDetalleEmpleado. Si mostrarDetalleEmpleado se llama múltiples veces, se adjuntan múltiples listeners.
                   // Debemos adjuntar este listener FUERA de mostrarDetalleEmpleado, una sola vez en DOMContentLoaded.
                   // Necesitaremos una forma de saber qué empleado editar cuando se haga clic si no estamos pasando el ID.
                   // Opción: Guardar el ID del empleado cargado en la sección de detalle.

                   // Modificamos mostrarDetalleEmpleado para guardar el ID:
                   if (empleadoDetalleSection) empleadoDetalleSection.setAttribute('data-current-empleado-id', empleado.id);

                   // Ahora, el listener del botón editar solo necesita leer ese atributo:
                   const empleadoId = empleadoDetalleSection ? empleadoDetalleSection.getAttribute('data-current-empleado-id') : null;
                   if (empleadoId) {
                       editarEmpleado(parseInt(empleadoId)); // Llamar a editarEmpleado con el ID
                   } else {
                       console.error("No se pudo obtener el ID del empleado desde la sección de detalle.");
                   }
               });
          }


           // Event listener para el botón Volver desde Detalle
           // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente
           const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
           if (btnVolverDesdeDetalle) {
              // Opcional: Remover listener si ya existiera
              // btnVolverDesdeDetalle.removeEventListener('click', showEmpleadosList); // Si tuvieras referencia
               btnVolverDesdeDetalle.addEventListener('click', showEmpleadosList); // Adjuntamos directamente
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

          // Renderizar lista de cumpleaños
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

          if (proximosCumpleanos.length === 0) {
              // Mostrar mensaje si no hay cumpleaños
               const tr = document.createElement('tr');
               tr.innerHTML = `<td colspan="3" class="text-center">No hay próximos cumpleaños registrados en los siguientes 365 días.</td>`;
               tbody.appendChild(tr);
          } else {
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


         // Renderizar lista de ausencias
         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = ''; // Limpia la tabla actual

         // Ordenar ausencias por fecha descendente
         // Usar slice() para no mutar el array original si se necesita
         const ausenciasOrdenadas = ausencias.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));


         if (ausenciasOrdenadas.length === 0) {
              // Mostrar mensaje si no hay ausencias
              const tr = document.createElement('tr');
              tr.innerHTML = `<td colspan="4" class="text-center">No hay ausencias registradas.</td>`;
              tbody.appendChild(tr);
         } else {
              ausenciasOrdenadas.forEach(ausencia => {
                  const tr = document.createElement('tr');
                  // Solo permite eliminar si el usuario actual es admin
                  const eliminarBtnHtml = (usuarioActual && usuarioActual.rol === 'admin') ?
                      `<button class="btn btn-sm btn-danger eliminar-ausencia-btn" data-id="${ausencia.id}" title="Eliminar Ausencia">
                           <i class="bi bi-trash"></i>
                       </button>` : '';

                  tr.innerHTML = `
                      <td>${ausencia.nombreEmpleado || ''}</td>
                      <td>${formatearFecha(ausencia.fecha)}</td>
                      <td>${ausencia.tipo || ''}</td>
                      <td>${eliminarBtnHtml}</td>
                   `;
                  tbody.appendChild(tr);
              });
         }


         // Evento de delegación para eliminar ausencias (solo si es admin)
         // Usamos .off().on() con jQuery para manejar listeners en elementos dinámicos dentro de la tabla
         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn').on('click', '.eliminar-ausencia-btn', function() {
             // La lógica de verificación de rol está dentro de eliminarAusencia
             const ausenciaId = $(this).data('id'); // Usamos jQuery data para obtener el id
             eliminarAusencia(ausenciaId);
         });
     }

     function eliminarAusencia(id) {
          // Asegurarse de que solo admin puede eliminar
          if (!(usuarioActual && usuarioActual.rol === 'admin')) {
               mostrarAlerta('No tienes permiso para eliminar ausencias.', 'danger');
              return;
          }
          if (confirm('¿Está seguro de que desea eliminar esta ausencia? Esta acción es irreversible.')) {
             ausencias = ausencias.filter(a => a.id != id);
             localStorage.setItem('ausencias', JSON.stringify(ausencias));
             mostrarAlerta('Ausencia eliminada correctamente', 'success');
             renderAusencias(); // Volver a renderizar la lista de ausencias
          }
     }

     // Event listener para el formulario de Ausencias
     // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
     const ausenciaFormElement = document.getElementById('ausenciaForm');
     if (ausenciaFormElement) {
         // Usamos .off().on() con jQuery para manejar submit si es necesario evitar múltiples envíos
         $(ausenciaFormElement).off('submit').on('submit', function(e) {
              e.preventDefault();
              // Asegurarse de que solo admin puede registrar
              if (!(usuarioActual && usuarioActual.rol === 'admin')) {
                   mostrarAlerta('No tienes permiso para registrar ausencias.', 'danger');
                  return;
              }

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
              ausenciaFormElement.reset(); // Limpiar formulario
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

        // Buscar al usuario en la lista permitida
        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario; // Establece el usuario que inició sesión
             // Opcional: localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual)); // Opcional: guardar sesión (menos seguro en localStorage)
            mostrarElementosAutenticados(); // Muestra botones de navegación
            showDashboard(); // Va al dashboard
             notificarCumpleanos(); // Muestra notificaciones en el dashboard
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

     function limpiarLogin() {
          // Limpia solo el formulario de login
          const loginFormElement = document.getElementById('login-form'); // Usar el ID correcto
          if (loginFormElement) loginFormElement.reset();
     }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null; // Limpia el usuario actual
        // Opcional: localStorage.removeItem('usuarioActual'); // Limpiar localStorage si implementaste guardar sesión
        ocultarElementosAutenticados(); // Oculta botones de navegación
        showLoginForm(); // Vuelve al login
        mostrarAlerta('Sesión cerrada correctamente', 'success');
    }

    // Helper para mostrar elementos
    function mostrarElements(elements) {
         elements.forEach(el => { if(el) el.classList.remove('d-none'); });
    }

    // Helper para ocultar elementos
     function ocultarElements(elements) {
         elements.forEach(el => { if(el) el.classList.add('d-none'); });
     }


    function mostrarElementosAutenticados() {
        // Mostrar botones de navegación principales si existen
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Mostrar botones específicos según la sección (solo si las secciones existen)
         // Esta lógica se ejecuta cada vez que se cambia de sección o al iniciar sesión
         // Asegura que solo se muestren los botones relevantes para la sección actual

         // Ocultar *todos* los botones de acción primero, y luego mostrar los de la sección actual
         ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         // Ocultar botones específicos del detalle del empleado (adjuntos en la función mostrarDetalleEmpleado, pero los ocultamos globalmente aquí por si acaso)
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);


         if (dashboardSection && !dashboardSection.classList.contains('d-none')) { // Si el dashboard está visible
              // Botones en el dashboard
               mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
              // Botones en la lista de empleados
              mostrarElements([btnNuevoEmpleadoLista]); // Botón "Nuevo Empleado" flotante
              // Los filtros y búsqueda ya están visibles en la sección HTML
         } else if (empleadoFormSection && !empleadoFormSection.classList.contains('d-none')) { // Si el formulario de empleado está visible
             // Botones en el formulario de empleado
             mostrarElements([btnCancelar]); // Muestra el botón cancelar
         } else if (empleadoDetalleSection && !empleadoDetalleSection.classList.contains('d-none')) { // Si el detalle de empleado está visible
              // Botones en el detalle de empleado - Se muestran en la función mostrarDetalleEmpleado
              // Solo nos aseguramos de que estén ocultos si no estamos en esa sección
         }
          // Nota: No hay botones específicos para Cumpleaños o Ausencias aparte de la navegación principal


         // Ocultar botones de autenticación si existen
         ocultarElements([btnLogin, btnRegistro]);

         // Control de visibilidad de elementos solo para Admin si aplica
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         const ausenciaForm = document.getElementById('ausenciaForm'); // Formulario de registro de ausencia
         // const btnExportar = document.getElementById('btn-exportar-csv'); // Botón Exportar CSV (ya lo referenciamos arriba)

         if (usuarioActual && usuarioActual.rol !== 'admin') {
             // Ocultar elementos solo para admin si existen
             if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
             if (btnRegistro) btnRegistro.classList.add('d-none'); // Usuario empleado no puede registrar nuevos usuarios
             if (ausenciaForm) ausenciaForm.classList.add('d-none'); // Usuario empleado no puede registrar ausencias
             if (btnExportarCSV) btnExportarCSV.classList.add('d-none'); // Usuario empleado no puede exportar

             // Ocultar columnas/botones de admin en tablas (manejado en renderizado de DataTables y renderAusencias)

         } else {
              // Si es admin, asegurarse de que estén visibles si existen
              if (dashboardUsuariosCard) dashboardUsuariosCard.classList.remove('d-none');
              // El botón de registro de usuario en el navbar (`btnRegistro`) se gestiona en ocultarElementosAutenticados y mostrarElementosAutenticados.
              // Cuando no estás autenticado, se muestra junto con btnLogin.
              // Cuando estás autenticado, se oculta en ocultarElementosAutenticados y luego mostrarElementosAutenticados
              // no lo vuelve a mostrar porque no es un botón de navegación principal ni de sección.
              // Si un admin pudiera registrar usuarios autenticado, necesitaríamos otro botón de registro en la UI.
              // Por ahora, el botón "Registrarse" solo aparece en la página de login inicial.

              if (ausenciaForm) ausenciaForm.classList.remove('d-none'); // Admin puede registrar ausencias
              if (btnExportarCSV) btnExportarCSV.classList.remove('d-none'); // Admin puede exportar
         }

         // Ocultar el breadcrumb principal al autenticar para que solo aparezca en secciones internas
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Se mostrará de nuevo en las funciones show... adecuadas

     }


    function ocultarElementosAutenticados() {
        // Ocultar todos los botones de navegación principales si existen
        ocultarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Ocultar botones específicos de secciones si existen
        ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);

        // Ocultar formulario de ausencia y tarjeta de usuarios dashboard
        const ausenciaForm = document.getElementById('ausenciaForm');
        if (ausenciaForm) ausenciaForm.classList.add('d-none');
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');


        // Mostrar botones de autenticación si existen
        mostrarElements([btnLogin, btnRegistro]);

         // Ocultar el breadcrumb principal
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
    }


    // --- Funciones de Empleados (CRUD) ---
    function generarId() {
        // Genera un ID único basado en la marca de tiempo actual
        return Date.now();
    }

    function guardarEmpleadosLocal() {
        localStorage.setItem('empleados', JSON.stringify(empleados));
        // Si DataTables está inicializado, actualiza sus datos
        if (empleadosTable) {
             empleadosTable.clear().rows.add(empleados).draw();
             // Re-aplicar filtros actuales al redibujar (en caso de que los selectores tengan valores)
             // Esto asegura que si un empleado guardado/editado afectara un filtro, la lista se actualice correctamente
             if (busquedaEmpleadosInput) empleadosTable.search(busquedaEmpleadosInput.value).draw();
             if (filtroDepartamentoSelect) {
                  const searchValue = filtroDepartamentoSelect.value;
                  empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
             }
             if (filtroAntiguedadSelect) empleadosTable.draw(); // Trigger custom filter redraw
        }
         actualizarFiltroDepartamentos(); // Actualiza el dropdown de departamentos (importante si se añade un departamento nuevo)
         notificarCumpleanos(); // Revisa y actualiza las notificaciones de cumpleaños en dashboard
         // showDashboard(); // No es necesario volver al dashboard, solo actualizar si estamos allí
         // Si estamos en el dashboard, actualizar las estadísticas de empleados
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
              if (document.getElementById('dashboard-total-empleados')) {
                 document.getElementById('dashboard-total-empleados').textContent = empleados.length;
             }
         }
    }

     function cargarEmpleadosLocal() {
          // Esta función ahora solo asegura que la variable 'empleados' esté cargada al inicio
          // DataTables se encarga de mostrar los datos al llamar a showEmpleadosList
          // Ya se carga al inicio del script: let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
     }


    function handleEmpleadoFormSubmit(e) {
        e.preventDefault();
        const form = document.getElementById('empleadoForm');
        if (!form) return;

        const id = form.getAttribute('data-edit-id'); // Obtiene el ID si es edición
        const nombresInput = document.getElementById('nombres');
        const apellidosInput = document.getElementById('apellidos');
        const cedulaInput = document.getElementById('cedula');
        const telefonoInput = document.getElementById('telefono');
        const emailInput = document.getElementById('email-empleado'); // Cambiado para no confundir con email de login
        const cargoInput = document.getElementById('cargo');
        const departamentoInput = document.getElementById('departamento');
        const tipoContratoInput = document.getElementById('tipoContrato'); // CORRECTO ID
        const fechaNacimientoInput = document.getElementById('fechaNacimiento'); // CORRECTO ID
        const fechaIngresoInput = document.getElementById('fechaIngreso'); // CORRECTO ID
        const salarioInput = document.getElementById('salario');
        const notasInput = document.getElementById('notas');
        const contactoEmergenciaNombreInput = document.getElementById('contactoEmergenciaNombre'); // CORRECTO ID
        const contactoEmergenciaTelefonoInput = document.getElementById('contactoEmergenciaTelefono'); // CORRECTO ID
        const contactoEmergenciaParentescoInput = document.getElementById('contactoEmergenciaParentesco'); // CORRECTO ID

        const nuevoEmpleado = {
            id: id ? parseInt(id) : generarId(), // Usa el ID existente o genera uno nuevo
            nombres: nombresInput ? nombresInput.value.trim() : '',
            apellidos: apellidosInput ? apellidosInput.value.trim() : '',
            cedula: cedulaInput ? cedulaInput.value.trim() : '',
            telefono: telefonoInput ? telefonoInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            cargo: cargoInput ? cargoInput.value.trim() : '',
            departamento: departamentoInput ? departamentoInput.value.trim() : '',
            tipoContrato: tipoContratoInput ? tipoContratoInput.value : '',
            fechaNacimiento: fechaNacimientoInput ? fechaNacimientoInput.value : '',
            fechaIngreso: fechaIngresoInput ? fechaIngresoInput.value : '',
            salario: salarioInput ? parseFloat(salarioInput.value.replace(/\./g, '').replace(',', '.')) : 0, // Limpiar puntos y reemplazar coma por punto para parseFloat
            notas: notasInput ? notasInput.value.trim() : '',
            contactoEmergenciaNombre: contactoEmergenciaNombreInput ? contactoEmergenciaNombreInput.value.trim() : '',
            contactoEmergenciaTelefono: contactoEmergenciaTelefonoInput ? contactoEmergenciaTelefonoInput.value.trim() : '',
            contactoEmergenciaParentesco: contactoEmergenciaParentescoInput ? contactoEmergenciaParentescoInput.value.trim() : '',
        };

         // Validaciones básicas
         if (!nuevoEmpleado.nombres || !nuevoEmpleado.apellidos || !nuevoEmpleado.cedula || !nuevoEmpleado.fechaIngreso || !nuevoEmpleado.departamento) {
              mostrarAlerta('Por favor, complete los campos obligatorios (Nombres, Apellidos, Cédula, Fecha de Ingreso, Departamento).', 'warning');
              return;
         }

         // Validación de Cédula duplicada (solo para nuevos empleados o si la cédula ha cambiado en edición)
         const cedulaExiste = empleados.some(emp => emp.cedula === nuevoEmpleado.cedula && emp.id != nuevoEmpleado.id); // Usar != para comparar ID
         if (cedulaExiste) {
              mostrarAlerta('La cédula ingresada ya existe para otro empleado.', 'warning');
              return;
         }


        if (id) {
            // Editar empleado existente
            empleados = empleados.map(emp => emp.id == id ? nuevoEmpleado : emp); // Usar == para comparar ID
            mostrarAlerta('Empleado actualizado correctamente', 'success');
        } else {
            // Agregar nuevo empleado
            empleados.push(nuevoEmpleado);
            mostrarAlerta('Empleado agregado correctamente', 'success');
        }

        guardarEmpleadosLocal(); // Guarda en localStorage y actualiza DataTables
        showEmpleadosList(); // Regresa a la lista de empleados
    }

    function cargarDatosEmpleado(id) {
        const empleado = empleados.find(emp => emp.id == id); // Usar == para comparar ID
        const form = document.getElementById('empleadoForm');
        if (empleado && form) {
            document.getElementById('nombres').value = empleado.nombres || '';
            document.getElementById('apellidos').value = empleado.apellidos || '';
            document.getElementById('cedula').value = empleado.cedula || '';
            document.getElementById('telefono').value = empleado.telefono || '';
            document.getElementById('email-empleado').value = empleado.email || ''; // Usar el ID correcto
            document.getElementById('cargo').value = empleado.cargo || '';
            document.getElementById('departamento').value = empleado.departamento || '';
            document.getElementById('tipoContrato').value = empleado.tipoContrato || ''; // CORRECTO ID
            document.getElementById('fechaNacimiento').value = empleado.fechaNacimiento || ''; // CORRECTO ID
            document.getElementById('fechaIngreso').value = empleado.fechaIngreso || ''; // CORRECTO ID
            document.getElementById('salario').value = empleado.salario ? formatearMilesInput(empleado.salario) : ''; // Formatear para el input
            document.getElementById('notas').value = empleado.notas || '';
             document.getElementById('contactoEmergenciaNombre').value = empleado.contactoEmergenciaNombre || ''; // CORRECTO ID
             document.getElementById('contactoEmergenciaTelefono').value = empleado.contactoEmergenciaTelefono || ''; // CORRECTO ID
             document.getElementById('contactoEmergenciaParentesco').value = empleado.contactoEmergenciaParentesco || ''; // CORRECTO ID
        }
    }

     function editarEmpleado(id) {
         // Asegurarse de que solo admin puede editar
          if (!(usuarioActual && usuarioActual.rol === 'admin')) {
               mostrarAlerta('No tienes permiso para editar empleados.', 'danger');
              return;
          }
         showEmpleadoForm(id); // Muestra el formulario y carga los datos
     }

    function eliminarEmpleado(id) {
        // Asegurarse de que solo admin puede eliminar
         if (!(usuarioActual && usuarioActual.rol === 'admin')) {
              mostrarAlerta('No tienes permiso para eliminar empleados.', 'danger');
             return;
         }
        // Pide confirmación antes de eliminar
        if (confirm('¿Está seguro de que desea eliminar este empleado? Esta acción es irreversible.')) {
            empleados = empleados.filter(emp => emp.id != id); // Filtra y elimina el empleado (Usar != para comparar ID)
            guardarEmpleadosLocal(); // Guarda los cambios en localStorage y actualiza DataTables
            mostrarAlerta('Empleado eliminado correctamente', 'success');
            showEmpleadosList(); // Asegura que estamos en la vista de lista
        }
    }


    // --- Funciones de Utilidad ---

    // Función para formatear fechas (por ejemplo, de YYYY-MM-DD a DD/MM/YYYY)
    function formatearFecha(fechaStr) {
        if (!fechaStr) return '';
        const [year, month, day] = fechaStr.split('-');
        if (!year || !month || !day) return fechaStr; // Devuelve original si el formato no es YYYY-MM-DD
        // Validar si es una fecha válida después de parsear
        const date = new Date(fechaStr);
         if (isNaN(date.getTime())) {
              return fechaStr; // Devuelve original si es una fecha no válida
         }
        return `${day}/${month}/${year}`;
    }


     // Función para calcular antigüedad en años (puede ser flotante)
      function calcularAntiguedad(fechaIngresoStr) {
          if (!fechaIngresoStr) return 0;

          // Validar si la fecha es válida antes de crear el objeto Date
          const fechaIngreso = new Date(fechaIngresoStr);
           if (isNaN(fechaIngreso.getTime())) {
              return 0; // Devuelve 0 si la fecha no es válida
           }

          const hoy = new Date();
          hoy.setHours(0,0,0,0); // Normalizar hora a medianoche
          fechaIngreso.setHours(0,0,0,0); // Normalizar hora a medianoche

          // Validar que la fecha de ingreso no sea en el futuro
          if (fechaIngreso > hoy) {
              return 0; // La antigüedad es 0 si la fecha es en el futuro
          }

          const diffMs = hoy.getTime() - fechaIngreso.getTime();
          // Usar 365.25 para años bisiestos
          const añosExactos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
          return añosExactos > 0 ? añosExactos : 0; // Asegura que no sea negativo
      }


      // Función para calcular antigüedad y formatearla como texto (años, meses, días)
      function calcularAntiguedadTexto(fechaIngresoStr) {
          if (!fechaIngresoStr) return 'Fecha no válida';

          // Validar si la fecha es válida antes de crear el objeto Date
          const fechaIngreso = new Date(fechaIngresoStr);
          if (isNaN(fechaIngreso.getTime())) {
             return 'Fecha no válida';
          }

          const hoy = new Date();

          // Validar que la fecha de ingreso no sea en el futuro
          if (fechaIngreso > hoy) {
              return 'Fecha futura';
          }

          let años = hoy.getFullYear() - fechaIngreso.getFullYear();
          let meses = hoy.getMonth() - fechaIngreso.getMonth();
          let dias = hoy.getDate() - fechaIngreso.getDate();

          // Ajustar si los días son negativos
          if (dias < 0) {
              meses--;
              // Obtener el número de días en el mes anterior a 'hoy'
              const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
              dias = ultimoDiaMesAnterior + dias; // días + (días negativos)
          }

          // Ajustar si los meses son negativos
          if (meses < 0) {
              años--;
              meses = 12 + meses; // meses + (meses negativos)
          }

          // Construir la cadena de texto
          const partes = [];
          if (años > 0) partes.push(`${años} año${años > 1 ? 's' : ''}`);
          if (meses > 0) partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
          // Solo añadir días si no hay años o meses, o si es el mismo año/mes y hay días restantes
          // Esto evita ver "1 año, 0 meses, 5 días" y mostrar solo "1 año, 5 días" o "5 días"
          // Ajustamos la lógica para ser más clara: si hay días positivos, los añadimos.
          // Si no hay años NI meses, y hay días (incluyendo 0 si la fecha es hoy), añadimos los días.
           if (dias > 0 || (años === 0 && meses === 0)) { // Si hay días > 0 O si es menos de un mes (años=0, meses=0)
               partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
           }


          if (partes.length === 0) {
              // Si después de todos los cálculos y ajustes no hay partes, significa que la diferencia es < 1 día.
               // Si la fecha de ingreso es exactamente hoy (sin considerar la hora, que ya normalizamos)
               const fechaIngresoSinHora = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());
               const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
               if (fechaIngresoSinHora.getTime() === hoySinHora.getTime()) {
                    return 'Hoy'; // Contratado hoy
               }
               return 'Menos de 1 día'; // Debería cubrir casos de < 1 día si la fecha no es hoy exactamente
          }

          // Unir las partes: usa "y" solo entre las dos últimas si hay más de una parte
          if (partes.length > 1) {
              const ultimaParte = partes.pop();
              return partes.join(', ') + ' y ' + ultimaParte;
          }


          return partes.join(', ');
      }


    // Función para formatear números grandes con separadores de miles para visualización
    function formatearMiles(numero) {
        if (numero === null || numero === undefined) return '';
         // Asegurarse de que es un número
         const num = parseFloat(numero);
         if (isNaN(num)) return '';
         // Convertir a string y usar toLocaleString para formato de miles del idioma local (es-ES)
        return num.toLocaleString('es-ES');
    }

    // Función para formatear números grandes con separadores de miles para inputs (puede necesitar formato local)
    function formatearMilesInput(numero) {
        if (numero === null || numero === undefined) return '';
         // Asegurarse de que es un número
         const num = parseFloat(numero);
         if (isNaN(num)) return '';
        // Usa toLocaleString con opciones para forzar 0 decimales y separadores.
        // Si necesitas decimales en el input, ajusta minimumFractionDigits/maximumFractionDigits
        return num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }


     // Función para mostrar alertas de Bootstrap
     function mostrarAlerta(mensaje, tipo) {
         const alertaContainer = document.getElementById('alerta-container');
         if (!alertaContainer) {
              console.error("Error: No se encontró el contenedor de alertas con ID 'alerta-container'.");
              alert(mensaje); // Fallback básico si no se encuentra el contenedor
              return;
         }

         // Limpiar alertas existentes antes de mostrar una nueva (opcional, para no saturar)
         alertaContainer.innerHTML = ''; // Limpia todas las alertas anteriores


         // Crear el elemento de alerta (usamos Bootstrap 5 structure)
         const alerta = document.createElement('div');
         alerta.classList.add('alert', `alert-${tipo}`, 'alert-dismissible', 'fade', 'show'); // Añade fade y show para animación
         alerta.setAttribute('role', 'alert');
         alerta.innerHTML = `
             ${mensaje}
             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
         `;

         // Añadir la alerta al contenedor
         alertaContainer.appendChild(alerta);

         // Opcional: auto-cerrar la alerta después de unos segundos
         // Usamos Bootstrap's data-bs-dismiss="alert" que ya maneja el cierre al hacer clic en la X.
         // Este setTimeout es para auto-cerrar si el usuario no hace clic en la X.
         setTimeout(() => {
             // Encuentra la alerta específica que acabamos de añadir y remuévela si no se ha cerrado ya
             const alertToRemove = alertaContainer.querySelector('.alert.show'); // Busca la primera alerta visible
              if (alertToRemove) {
                   // Usar la función de cierre de Bootstrap para que la animación funcione al auto-cerrar
                   const bootstrapAlert = bootstrap.Alert.getInstance(alertToRemove);
                   if (bootstrapAlert) {
                       bootstrapAlert.hide(); // Inicia la animación de fade-out de Bootstrap
                       // Remover del DOM después de que la animación termine (por defecto dura 500ms)
                       setTimeout(() => alertToRemove.remove(), 500);
                   } else {
                       // Si no se pudo obtener la instancia, simplemente remueve el elemento
                       alertToRemove.remove();
                   }
              }

         }, 7000); // 7 segundos (dar tiempo a leer)
     }


     // Función para actualizar el dropdown de departamentos con los departamentos existentes en los empleados
     function actualizarFiltroDepartamentos() {
         if (!filtroDepartamentoSelect) return;

         // Obtener departamentos únicos de los empleados, filtrar vacíos, ordenar y convertir a Set para únicos
         const departamentosUnicos = [...new Set(empleados.map(emp => emp.departamento).filter(dep => dep))].sort();

         // Guardar el valor seleccionado actualmente para no perderlo al actualizar
         const valorSeleccionadoActual = filtroDepartamentoSelect.value;

         // Limpiar opciones actuales (mantener la opción por defecto "Todos")
         filtroDepartamentoSelect.innerHTML = '<option value="">Todos los Departamentos</option>';

         // Añadir las nuevas opciones
         departamentosUnicos.forEach(departamento => {
             const option = document.createElement('option');
             option.value = departamento;
             option.textContent = departamento;
             filtroDepartamentoSelect.appendChild(option);
         });

         // Restaurar el valor seleccionado si todavía existe en las nuevas opciones
         if ([...filtroDepartamentoSelect.options].some(option => option.value === valorSeleccionadoActual)) {
             filtroDepartamentoSelect.value = valorSeleccionadoActual;
         } else {
             // Si el valor anterior no existe, asegurarse de que se aplique el filtro "Todos"
             filtroDepartamentoSelect.value = "";
             // Si DataTables existe y está visible, aplicar el filtro "Todos" inmediatamente
              if (empleadosTable && empleadosListSection && !empleadosListSection.classList.contains('d-none')) {
                 empleadosTable.column(6).search('', true, false).draw();
             }
         }
     }

     // Función para calcular cuántos días faltan para el cumpleaños (considerando el próximo cumpleaños)
     function calcularDiasParaCumpleanos(fechaNacimientoStr) {
         if (!fechaNacimientoStr) return -1; // Retorna -1 si la fecha no es válida

         const fechaNacimiento = new Date(fechaNacimientoStr);
         const hoy = new Date();
         hoy.setHours(0, 0, 0, 0); // Poner la hora a 0 para comparación solo de fecha

         // Manejar fechas de nacimiento no válidas (ej. "Invalid Date")
         if (isNaN(fechaNacimiento.getTime())) {
              return -1;
         }


         const cumpleanosEsteAño = new Date(hoy.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate());
         cumpleanosEsteAño.setHours(0, 0, 0, 0);

         const unDia = 24 * 60 * 60 * 1000; // Milisegundos en un día

         // Si el cumpleaños de este año ya pasó (y no es hoy)
         if (cumpleanosEsteAño < hoy) {
             // Calcular el cumpleaños del próximo año
             const cumpleanosProximoAño = new Date(hoy.getFullYear() + 1, fechaNacimiento.getMonth(), fechaNacimiento.getDate());
             cumpleanosProximoAño.setHours(0, 0, 0, 0);
             const diffMs = cumpleanosProximoAño.getTime() - hoy.getTime();
             return Math.round(diffMs / unDia); // Días restantes para el próximo
         } else {
             // Si el cumpleaños de este año aún no ha pasado o es hoy
             const diffMs = cumpleanosEsteAño.getTime() - hoy.getTime();
             return Math.round(diffMs / unDia); // Días restantes para este año
         }
     }


     // Función para mostrar notificaciones de cumpleaños en el dashboard o en una alerta
     function notificarCumpleanos() {
          // Esta función se llama al iniciar sesión y al guardar/eliminar empleado
          // Asume que ya estamos autenticados.
          const notificacionesDiv = document.getElementById('cumpleanos-notificaciones'); // El div en el dashboard para esto

          // Siempre calculamos los próximos cumpleaños en los 30 días para mostrar en el dashboard si está visible
          const proximosCumpleanos30Dias = empleados
              .filter(emp => emp.fechaNacimiento && calcularDiasParaCumpleanos(emp.fechaNacimiento) >= 0) // Solo empleados con fecha de nacimiento válida que aún no pasó este año
              .map(emp => {
                  const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                  // Incluir cumpleaños hoy o en los próximos 30 días para el detalle del dashboard
                   if (dias >= 0 && dias <= 30) {
                      return { ...emp, diasRestantes: dias };
                  }
                  return null;
              })
              .filter(emp => emp !== null)
              .sort((a, b) => a.diasRestantes - b.diasRestantes); // Ordenar por los días restantes


          if (notificacionesDiv) { // Solo actualizamos el div del dashboard si existe
              notificacionesDiv.innerHTML = ''; // Limpiar notificaciones anteriores

              if (proximosCumpleanos30Dias.length > 0) {
                  let notificacionHtml = '<h6 class="card-subtitle mb-2 text-muted">Próximos Cumpleaños (30 días)</h6><ul>';
                  proximosCumpleanos30Dias.forEach(emp => {
                      notificacionHtml += `<li>${emp.nombres || ''} ${emp.apellidos || ''} - ${emp.diasRestantes === 0 ? 'Hoy' : `en ${emp.diasRestantes} día${emp.diasRestantes !== 1 ? 's' : ''}`} (${formatearFecha(emp.fechaNacimiento)})</li>`;
                  });
                  notificacionHtml += '</ul>';
                  notificacionesDiv.innerHTML = notificacionHtml;
                  notificacionesDiv.classList.remove('d-none'); // Mostrar el contenedor de notificaciones si hay cumpleaños
              } else {
                  notificacionesDiv.innerHTML = '<p class="card-text text-muted">No hay próximos cumpleaños registrados en los siguientes 30 días.</p>';
                   // Mantenemos visible el contenedor con el mensaje de "no hay"
                  notificacionesDiv.classList.remove('d-none');
              }
          }


           // Mostrar una alerta de Bootstrap si hay cumpleaños hoy (para que aparezca aunque no esté en dashboard)
           const cumpleanosHoy = empleados.filter(emp => emp.fechaNacimiento && calcularDiasParaCumpleanos(emp.fechaNacimiento) === 0);
           if (cumpleanosHoy.length > 0) {
               // Evitar mostrar la alerta múltiples veces si ya está visible (busca una alerta info con texto específico)
               const alertaExiste = document.querySelector('.alert-info');
               const alertaExistenteYaDiceCumple = alertaExiste ? alertaExiste.textContent.includes('cumpleaños hoy') : false;

               if (!alertaExiste || !alertaExistenteYaDiceCumple) {
                    mostrarAlerta('¡Hay cumpleaños hoy! Revisa el Dashboard.', 'info');
               }
           }

     }


     // --- Funciones de Restablecimiento de Contraseña (Solo demo) ---
     // NOTA: Esta implementación es SOLO para demostración en el navegador usando localStorage.
     // NO ES SEGURA para una aplicación real y no envía correos electrónicos reales.
     function showResetPasswordModal() {
         if (resetPasswordModal) {
              // Resetear el estado del modal
              const resetEmailInput = document.getElementById('reset-email');
              const resetRequestBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null; // El primer submit es solicitar
              const resetConfirmBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('.modal-footer button.btn-primary') : null; // El de continuar en el footer

              const resetMessage = document.getElementById('reset-message'); // Asume que tienes un elemento con este ID en el modal para mensajes

              if (resetEmailInput) resetEmailInput.value = ''; // Limpia el campo de email
               if (resetPasswordFields) resetPasswordFields.classList.add('d-none'); // Oculta campos de nueva contraseña
               if (resetRequestBtnElement) resetRequestBtnElement.classList.remove('d-none'); // Muestra botón de solicitud
               if (resetConfirmBtnElement) resetConfirmBtnElement.classList.add('d-none'); // Oculta botón de confirmación
              if (resetMessage) resetMessage.textContent = 'Ingresa tu correo electrónico registrado para restablecer tu contraseña:'; // Mensaje inicial

              // Limpiar campos de contraseña en el modal si estaban visibles de una prueba anterior
              const newPasswordInput = document.getElementById('new-password');
              const confirmPasswordInput = document.getElementById('confirm-password');
              if(newPasswordInput) newPasswordInput.value = '';
              if(confirmPasswordInput) confirmPasswordInput.value = '';


              resetPasswordModal.show(); // Mostrar el modal
         } else {
              console.error("Modal de restablecimiento de contraseña no encontrado.");
              mostrarAlerta("Error al abrir el formulario de restablecimiento de contraseña.", "danger");
         }
     }

     function handleResetPasswordRequest(e) {
         e.preventDefault();
         const resetEmailInput = document.getElementById('reset-email');
         const email = resetEmailInput ? resetEmailInput.value.trim() : '';
         const resetMessage = document.getElementById('reset-message');

         const usuario = usuariosPermitidos.find(u => u.email === email);

         if (usuario) {
             emailToReset = email; // Guarda el email para el segundo paso
             if (resetPasswordFields) resetPasswordFields.classList.remove('d-none'); // Muestra campos de nueva contraseña
             if (resetMessage) resetMessage.textContent = 'Correo encontrado. Ingresa tu nueva contraseña:';
             const resetRequestBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null;
             const resetConfirmBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('.modal-footer button.btn-primary') : null;
             if (resetRequestBtnElement) resetRequestBtnElement.classList.add('d-none'); // Oculta botón de solicitud
             if (resetConfirmBtnElement) resetConfirmBtnElement.classList.remove('d-none'); // Muestra botón de confirmación

              // Limpiar campos de contraseña en el modal
              const newPasswordInput = document.getElementById('new-password');
              const confirmPasswordInput = document.getElementById('confirm-password');
              if(newPasswordInput) newPasswordInput.value = '';
              if(confirmPasswordInput) confirmPasswordInput.value = '';


         } else {
              if (resetMessage) resetMessage.textContent = 'Correo no encontrado. Intenta de nuevo.'; // Actualiza mensaje en el modal
             mostrarAlerta('Correo no encontrado.', 'danger'); // Muestra alerta principal
         }
     }

     function handleResetPasswordConfirm(e) {
          e.preventDefault();
          const newPasswordInput = document.getElementById('new-password'); // ID corregido en HTML, usarlo aquí
          const confirmPasswordInput = document.getElementById('confirm-password'); // ID corregido en HTML, usarlo aquí
          const resetMessage = document.getElementById('reset-message');


          const newPassword = newPasswordInput ? newPasswordInput.value : '';
          const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

          if (newPassword !== confirmPassword) {
              mostrarAlerta('Las contraseñas no coinciden.', 'warning');
               if (resetMessage) resetMessage.textContent = 'Las contraseñas no coinciden. Intenta de nuevo:';
              return;
          }

          if (newPassword.length < 6) { // Validación básica de longitud
               mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'warning');
               if (resetMessage) resetMessage.textContent = 'La contraseña es muy corta. Debe tener al menos 6 caracteres:';
               return;
          }

          // En una aplicación real, aquí se enviaría la nueva contraseña (hasheada) al backend.
          // Para esta demo, simplemente actualizamos en localStorage (INSEGURO EN PRODUCCIÓN).
          usuariosPermitidos = usuariosPermitidos.map(u => {
              if (u.email === emailToReset) {
                  // NOTA: En producción NUNCA guardar texto plano. Usar hashing (bcrypt, etc.)
                  return { ...u, password: newPassword };
              }
              return u;
          });
          localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));

          mostrarAlerta('Contraseña restablecida con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.', 'success');
          if (resetPasswordModal) resetPasswordModal.hide(); // Cierra el modal
          emailToReset = ''; // Limpiar email guardado

          // No es necesario resetear el estado del modal aquí, showResetPasswordModal ya lo hace al abrirse.
      }


      // --- Funciones de Exportación ---
      function exportarEmpleadosCSV() {
           if (!isAuthenticated || !(usuarioActual && usuarioActual.rol === 'admin')) {
               mostrarAlerta('No tienes permiso para exportar datos.', 'danger');
               return;
           }

          if (!empleados || empleados.length === 0) {
              mostrarAlerta('No hay datos de empleados para exportar.', 'info');
              return;
          }

          // Define las cabeceras del CSV (ajusta según tus campos)
          const headers = ["ID", "Nombres", "Apellidos", "Cédula", "Teléfono", "Email", "Cargo", "Departamento", "Tipo Contrato", "Fecha Nacimiento", "Fecha Ingreso", "Salario", "Notas", "Contacto Emergencia Nombre", "Contacto Emergencia Teléfono", "Contacto Emergencia Parentesco"];

          // Mapea los datos de los empleados a filas de CSV
          const rows = empleados.map(emp => [
              emp.id,
              `"${(emp.nombres || '').replace(/"/g, '""')}"`, // Encerrar en comillas y escapar comillas dobles
              `"${(emp.apellidos || '').replace(/"/g, '""')}"`,
              `"${(emp.cedula || '').replace(/"/g, '""')}"`,
              `"${(emp.telefono || '').replace(/"/g, '""')}"`,
              `"${(emp.email || '').replace(/"/g, '""')}"`,
              `"${(emp.cargo || '').replace(/"/g, '""')}"`,
              `"${(emp.departamento || '').replace(/"/g, '""')}"`,
              `"${(emp.tipoContrato || '').replace(/"/g, '""')}"`,
              `"${formatearFecha(emp.fechaNacimiento).replace(/"/g, '""')}"`, // Formatear fecha
              `"${formatearFecha(emp.fechaIngreso).replace(/"/g, '""')}"`,   // Formatear fecha
               usuarioActual && usuarioActual.rol === 'admin' ? `"${(emp.salario || '').toString().replace(/"/g, '""')}"` : '****', // Exportar salario (como string para manejar formato) solo para admin
              `"${(emp.notas || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaNombre || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaTelefono || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaParentesco || '').replace(/"/g, '""')}"`,
          ]);

          // Unir cabeceras y filas con comas y saltos de línea
          // El carácter de BOM (Byte Order Mark) ayuda a Excel a reconocer la codificación UTF-8
          const csvContent = "\uFEFF" + [
              headers.join(","),
              ...rows.map(row => row.join(","))
          ].join("\n");

          // Crear un Blob con el contenido CSV
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

          // Crear un enlace de descarga
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "empleados_ashe.csv"); // Nombre del archivo

          // Simular un clic en el enlace para iniciar la descarga
          link.style.visibility = 'hidden'; // Ocultar el enlace
          document.body.appendChild(link);
          link.click();

          // Limpiar URL y remover el enlace después de un breve retraso
           setTimeout(() => {
               document.body.removeChild(link);
               URL.revokeObjectURL(url);
           }, 100);


          mostrarAlerta('Datos de empleados exportados a CSV.', 'success');
      }


    // --- Event Listeners ---
    // Listeners de Autenticación
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Listener para el enlace "¿Olvidaste tu contraseña?" (en el login)
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
     if (forgotPasswordLink) {
         forgotPasswordLink.addEventListener('click', function(e) {
             e.preventDefault();
             showResetPasswordModal(); // Abre el modal
         });
     }

     // Listeners para el formulario dentro del modal de restablecer contraseña
     // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si los elementos existen
     if (resetPasswordForm) {
         // Listener al submit del formulario para que funcione con Enter y botones
          resetPasswordForm.addEventListener('submit', function(e) {
              e.preventDefault(); // Evita el submit por defecto
              const submitButton = e.submitter; // El botón que disparó el submit

              // Determinar qué botón se presionó (por ID o texto/clase)
              // Si el botón "Continuar" (confirmar) está visible, el submit es para confirmar
              const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary');
               if (resetConfirmBtnElement && !resetConfirmBtnElement.classList.contains('d-none')) {
                  handleResetPasswordConfirm(e); // Llama a la función de confirmar
              } else { // De lo contrario, es para solicitar
                  handleResetPasswordRequest(e); // Llama a la función de solicitar
              }
          });

          // Listeners explícitos para los botones por si no se usa Enter en el formulario
          const resetRequestBtnElement = resetPasswordForm.querySelector('button[type="submit"]'); // El primer submit es solicitar
          const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary'); // El de continuar en el footer

          if (resetRequestBtnElement) {
               resetRequestBtnElement.addEventListener('click', handleResetPasswordRequest); // Primer paso: solicitar cambio
          }

          if (resetConfirmBtnElement) {
              resetConfirmBtnElement.addEventListener('click', handleResetPasswordConfirm); // Segundo paso: confirmar nueva contraseña
          }

     }


    // Listeners de Registro
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm); // Navbar "Registrarse"
    const registroFormElement = document.getElementById('registroForm'); // Referencia al formulario de registro
     if (registroFormElement) {
         // Event Listener para el formulario de registro (enviar)
         // Usamos .off().on() con jQuery si es necesario evitar múltiples envíos
          $(registroFormElement).off('submit').on('submit', function(e) {
             e.preventDefault();
             const newEmailInput = document.getElementById('new-email');
             const newPasswordInput = document.getElementById('new-password-reg'); // ID corregido en HTML
             const confirmPasswordInput = document.getElementById('confirm-password-reg'); // ID corregido en HTML
             const newEmail = newEmailInput ? newEmailInput.value.trim() : '';
             const newPassword = newPasswordInput ? newPasswordInput.value : '';
             const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

             // Validaciones básicas de registro
             if (!newEmail || !newPassword || !confirmPassword) {
                  mostrarAlerta('Por favor, complete todos los campos del formulario de registro.', 'warning');
                  return;
             }
              if (newPassword !== confirmPassword) {
                  mostrarAlerta('Las contraseñas no coinciden.', 'warning');
                  return;
              }
              if (newPassword.length < 6) {
                   mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'warning');
                   return;
              }
             const emailExiste = usuariosPermitidos.some(u => u.email === newEmail);
             if (emailExiste) {
                  mostrarAlerta('El correo electrónico ya está registrado.', 'warning');
                  return;
             }

             // Agregar nuevo usuario (con rol 'empleado' por defecto en esta demo simple)
             usuariosPermitidos.push({ email: newEmail, password: newPassword, rol: 'empleado' });
             localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));

             mostrarAlerta('Usuario registrado con éxito. Ahora puedes iniciar sesión.', 'success');
             hideRegistroForm(); // Vuelve al formulario de login
         });
     }

     if (btnCancelarRegistro) btnCancelarRegistro.addEventListener('click', hideRegistroForm); // Botón Cancelar del formulario registro

    // Listeners de Navegación del Navbar (asegurarse de que existan los botones)
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
     if (btnDashboard) btnDashboard.addEventListener('click', showDashboard);
     if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList);
     if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList);
     if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList);


    // Listeners de botones de las secciones (Dashboard, Lista Empleados)
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si los elementos existen
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm()); // Botón "Agregar Nuevo Empleado" en Dashboard
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm()); // Botón "Nuevo Empleado" en Lista de Empleados
     if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList); // Botón "Ver Empleados" en Dashboard
     if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV); // Botón Exportar

    // Listener del formulario de Empleado (Guardar/Actualizar)
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
         // Usamos .off().on() con jQuery si es necesario evitar múltiples envíos
         $(empleadoFormElement).off('submit').on('submit', handleEmpleadoFormSubmit);
    }


    // Listener del botón Cancelar en el formulario de empleado
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
    if (btnCancelar) btnCancelar.addEventListener('click', showEmpleadosList); // Vuelve a la lista

    // Listener para el enlace "Inicio" en el breadcrumb
    // Eliminamos el patrón cloneNode/replaceChild, adjuntamos directamente si el elemento existe
     if (breadcrumbHomeLink) {
          breadcrumbHomeLink.addEventListener('click', function(e) {
             e.preventDefault(); // Prevenir navegación por defecto
              if (isAuthenticated) {
                 showDashboard(); // Ir al dashboard si está autenticado
             } else {
                 showLoginForm(); // Ir al login si no está autenticado
             }
         });
     }


     // --- Funcionalidad para mostrar/ocultar contraseña ---
     // Busca todos los botones con la clase 'toggle-password'
     const togglePasswordButtons = document.querySelectorAll('.toggle-password');

     togglePasswordButtons.forEach(button => {
         // **CORRECCIÓN:** Adjuntamos el listener directamente si el elemento existe.
         // Eliminamos la lógica de cloneNode/replaceChild que causaba el error.
         if (button) {
             button.addEventListener('click', function() {
                 // Obtiene el ID del input de contraseña desde el atributo data-target
                 const targetId = this.dataset.target;
                 const passwordInput = document.getElementById(targetId);

                 if (passwordInput) {
                     // Alterna el tipo de input entre 'password' y 'text'
                     const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                     passwordInput.setAttribute('type', type);

                     // Opcional: Cambia el icono del ojo (de bi-eye a bi-eye-slash y viceversa)
                     const icon = this.querySelector('i');
                     if (icon) {
                         icon.classList.toggle('bi-eye');
                         icon.classList.toggle('bi-eye-slash');
                     }
                 }
             });
         } else {
             console.warn("Botón toggle password encontrado en querySelectorAll pero es null.");
         }
     });
     // --- Fin Funcionalidad mostrar/ocultar contraseña ---


    // --- Inicialización ---
    // Cargar datos iniciales (empleados, ausencias, usuarios)
    // Los usuarios y empleados/ausencias ya se cargan/inicializan al inicio del script

    // Redirigir a la página de login al cargar la aplicación
    showLoginForm();
}); // Fin del DOMContentLoaded
