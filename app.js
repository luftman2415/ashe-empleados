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
    const loginFormSection = document.getElementById('login-form'); // La sección que contiene el formulario de login
    const registroFormSection = document.getElementById('registro-form'); // La sección que contiene el formulario de registro
    const empleadosListSection = document.getElementById('empleados-list');
    const empleadoFormSection = document.getElementById('empleado-form');
    const empleadoDetalleSection = document.getElementById('empleado-detalle');
    const cumpleanosListSection = document.getElementById('cumpleanos-list');
    const dashboardSection = document.getElementById('dashboard');
    const ausenciasListSection = document.getElementById('ausencias-list');
    const contactoSection = document.getElementById('contacto'); // La sección de contacto

    // Referencias directas a los formularios (usando sus IDs de <form>)
    const loginFormElement = document.getElementById('loginForm'); // El formulario de login
    const registroFormElement = document.getElementById('registroForm'); // El formulario de registro
    const empleadoFormElement = document.getElementById('empleadoForm'); // El formulario de empleado
    const ausenciaFormElement = document.getElementById('ausenciaForm'); // El formulario de ausencia


    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado'); // Botón en Dashboard
    const btnNuevoEmpleadoLista = document.getElementById('btn-nuevo-empleado-lista'); // Botón en Lista Empleados
    const btnVerEmpleados = document.getElementById('btn-ver-empleados'); // Botón en Dashboard
    const btnCancelar = document.getElementById('btn-cancelar'); // Botón en Form Empleado
    const btnRegistro = document.getElementById('btn-registro'); // Botón "Registrarse" del navbar
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro'); // Botón cancelar formulario registro
    const btnLogin = document.getElementById('btn-login'); // Botón "Iniciar Sesión" del navbar
    const btnLogout = document.getElementById('btn-logout'); // Botón "Cerrar Sesión" del navbar
    const btnDashboard = document.getElementById('btn-dashboard'); // Botón "Dashboard" del navbar
    const btnEmpleados = document.getElementById('btn-empleados'); // Botón "Empleados" del navbar
    const btnCumpleanos = document.getElementById('btn-cumpleanos'); // Botón "Cumpleaños" del navbar
    const btnAusencias = document.getElementById('btn-ausencias'); // Botón "Ausencias" del navbar
    const btnExportarCSV = document.getElementById('btn-exportar-csv'); // Botón "Exportar CSV"

    // Elementos de filtro y búsqueda externos a la tabla (En sección empleados-list)
    const busquedaEmpleadosInput = document.getElementById('busqueda-empleados');
    const filtroDepartamentoSelect = document.getElementById('filtro-departamento');
    const filtroAntiguedadSelect = document.getElementById('filtro-antiguedad');

    const breadcrumbSection = document.getElementById('breadcrumb-section'); // El último item activo del breadcrumb
    const breadcrumbHomeLink = document.getElementById('breadcrumb-home-link'); // El enlace de "Inicio" en el breadcrumb


    // Modal de restablecer contraseña
    const resetPasswordModalElement = document.getElementById('reset-password-modal');
    const resetPasswordModal = resetPasswordModalElement ? new bootstrap.Modal(resetPasswordModalElement) : null; // Inicialización segura con Bootstrap
    const resetPasswordForm = document.getElementById('reset-password-form'); // El formulario dentro del modal

    const resetPasswordFields = document.getElementById('reset-password-fields'); // Div que contiene campos de nueva contraseña
    const forgotPasswordLink = document.getElementById('forgot-password-link'); // Enlace "¿Olvidaste tu contraseña?"
    const resetMessage = document.getElementById('reset-message'); // Elemento para mensajes en el modal


    let emailToReset = ''; // Variable para guardar el email en el proceso de reset


    // Estado de autenticación
    let isAuthenticated = false;

    // Inicializar DataTables - La variable mantendrá la instancia
    let empleadosTable = null;

    // --- Funciones de Visualización de Secciones ---
    function ocultarTodo() {
        // Ocultamos todas las secciones principales
        [loginFormSection, registroFormSection, empleadosListSection, empleadoFormSection,
         empleadoDetalleSection, cumpleanosListSection, dashboardSection, ausenciasListSection, contactoSection].forEach(section => {
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

              // Ocultar el breadcrumb principal si estamos en login/registro (ya que el breadcrumb de navbar se oculta)
             if (seccion === 'Inicio de Sesión' || seccion === 'Registro') {
                 // La barra de breadcrumb en el navbar se oculta en mostrarElementosAutenticados/ocultarElementosAutenticados
                 // y se muestra en las funciones show... de secciones autenticadas.
                 // Aquí solo nos aseguramos de que no se muestre en las vistas no autenticadas
                 // if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Ya se maneja globalmente
             } else {
                  // Para cualquier otra sección (autenticada), asegurarse de que el breadcrumb del navbar esté visible
                   // if (breadcrumbNav) breadcrumbNav.classList.remove('d-none'); // Ya se maneja globalmente
             }
        }
    }


    function showLoginForm() {
         ocultarTodo(); // Oculta todo primero

         // Muestra la sección de login Y la sección de contacto
         if (loginFormSection) loginFormSection.classList.remove('d-none');
         if (contactoSection) contactoSection.classList.remove('d-none'); // Mostrar también la sección de contacto


         ocultarElementosAutenticados(); // Oculta elementos del navbar autenticado (botones dashboard, empleados, etc.)
         actualizarBreadcrumb('Inicio de Sesión'); // Actualiza breadcrumb (luego se ocultará el breadcrumb del navbar)
         limpiarLogin(); // Limpia el formulario de login
     }

      function showRegistroForm() {
          ocultarTodo(); // Oculta todo primero
          if (registroFormSection) registroFormSection.classList.remove('d-none'); // Muestra la sección de registro
          // La sección de contacto no se muestra en el registro, solo en login
          actualizarBreadcrumb('Registro'); // Actualiza breadcrumb (luego se ocultará)
          ocultarElementosAutenticados(); // Oculta elementos autenticados, muestra login/registro navbar
      }

      function hideRegistroForm() {
          if (registroFormSection) registroFormSection.classList.add('d-none');
          showLoginForm(); // Volver al login después de cancelar/registrar
      }


    function showDashboard() {
         if (!isAuthenticated) {
             showLoginForm(); // Redirigir al login si no está autenticado
             return;
         }
         ocultarTodo(); // Oculta todo primero
         if (dashboardSection) dashboardSection.classList.remove('d-none'); // Muestra la sección del dashboard
         mostrarElementosAutenticados(); // Muestra los botones correctos del navbar y esconde login/registro

         actualizarBreadcrumb('Dashboard'); // Muestra y actualiza breadcrumb en navbar

         // Actualizar estadísticas
         if (document.getElementById('dashboard-total-empleados')) {
             document.getElementById('dashboard-total-empleados').textContent = empleados.length;
         }
          if (document.getElementById('dashboard-usuarios')) {
             document.getElementById('dashboard-usuarios').textContent = usuariosPermitidos.length;
           }


         // Próximos cumpleaños para dashboard
         const proximosCumpleanosCount = empleados.filter(emp => {
             if (!emp.fechaNacimiento) return false;
             const diasRestantes = calcularDiasParaCumpleanos(emp.fechaNacimiento);
             return diasRestantes >= 0 && diasRestantes <= 30; // Cumpleaños hoy o en los próximos 30 días
         }).length;
          if (document.getElementById('dashboard-cumpleanos')) {
             document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanosCount;
          }

          // Muestra las notificaciones detalladas en el div correspondiente
          notificarCumpleanos();

     }

    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        ocultarTodo(); // Oculta todo primero
        if (empleadosListSection) empleadosListSection.classList.remove('d-none'); // Muestra la sección de la lista de empleados
        mostrarElementsAutenticados(); // Muestra los botones correctos del navbar

        actualizarBreadcrumb('Lista de Empleados'); // Muestra y actualiza breadcrumb en navbar

        // Si los filtros desplegables están vacíos, los poblamos
        if (filtroDepartamentoSelect && filtroDepartamentoSelect.options.length <= 1) {
             actualizarFiltroDepartamentos();
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
                     { data: 'cargo', defaultContent: '' },
                     { data: 'departamento', defaultContent: '' },
                     {
                         data: 'fechaIngreso',
                         render: function(data, type, row) {
                            return calcularAntiguedadTexto(data);
                         },
                          orderSequence: ['asc', 'desc']
                     },
                     {
                         data: 'id',
                         render: function(data, type, row) {
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
                         orderable: false
                     }
                 ],
                 language: {
                      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
                 },
                 paging: true,
                 lengthChange: true,
                 searching: true,
                 info: true,
                 ordering: true,
                 pageLength: 10,
                 dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6">><"row"<"col-sm-12"t>><"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',


            });

            // --- Eventos de delegación para los botones dentro de la tabla (Usando jQuery .off().on()) ---
             $('#empleados-table-body').off('click', '.ver-empleado').on('click', '.ver-empleado', function(e) {
                 e.preventDefault();
                 const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      mostrarDetalleEmpleado(rowData.id);
                 }
             });
             $('#empleados-table-body').off('click', '.editar-empleado-btn').on('click', '.editar-empleado-btn', function() {
                  const rowData = empleadosTable.row($(this).parents('tr')).data();
                  if (rowData && rowData.id !== undefined) {
                       editarEmpleado(rowData.id);
                  }
             });
             $('#empleados-table-body').off('click', '.eliminar-empleado-btn').on('click', '.eliminar-empleado-btn', function() {
                  const rowData = empleadosTable.row($(this).parents('tr')).data();
                 if (rowData && rowData.id !== undefined) {
                      eliminarEmpleado(rowData.id); // eliminarEmpleado ya verifica el rol
                 }
             });


             // --- Vincula los filtros y búsqueda externos a DataTables (Usando jQuery .off().on()) ---
             if (busquedaEmpleadosInput) {
                  $(busquedaEmpleadosInput).off('keyup search').on('keyup search', function () {
                      empleadosTable.search(this.value).draw();
                  });
             }

             if (filtroDepartamentoSelect) {
                  $(filtroDepartamentoSelect).off('change').on('change', function () {
                      const searchValue = this.value;
                      empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
                  });
             }

             if (filtroAntiguedadSelect) {
                  if (!$.fn.dataTable.ext.search.some(fn => fn.name === 'antiguedadFilterFn')) {
                      $.fn.dataTable.ext.search.push(
                          function antiguedadFilterFn( settings, data, dataIndex ) {
                              if ( settings.sTableId !== 'empleados-table' ) {
                                  return true;
                              }
                              const antiguedadFiltroElement = document.getElementById('filtro-antiguedad');
                              if (!antiguedadFiltroElement) return true;
                              const antiguedadFiltro = antiguedadFiltroElement.value;
                              if (antiguedadFiltro === "") { return true; }
                              const rowData = settings.aoData[dataIndex]._aData;
                              const fechaIngreso = rowData.fechaIngreso;
                              if (!fechaIngreso) return false;
                              const años = calcularAntiguedad(fechaIngreso);
                              const [minStr, maxStr] = antiguedadFiltro.split('-');
                              const min = parseInt(minStr);
                              const max = maxStr === '+' ? Infinity : parseInt(maxStr);
                              if (maxStr === '+') { return años >= min; }
                              else { return años >= min && años < max; }
                          }
                      );
                  }
                  $(filtroAntiguedadSelect).off('change').on('change', function () {
                      empleadosTable.draw();
                  });
             }

             $('.dataTables_length select').addClass('form-select form-select-sm');


        } else {
            // Si DataTables ya está inicializado, solo actualizamos los datos y redibujamos
             empleadosTable.clear().rows.add(empleados).draw();
             // DataTables debería mantener los filtros/búsqueda al redibujar si se usaron los eventos asociados.
             empleadosTable.draw();
        }
    }


    function showEmpleadoForm(editId = null) {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        if (empleadoFormElement) { // Usar la referencia directa al formulario
            empleadoFormElement.reset(); // Limpia el formulario
             if (editId !== null && editId !== undefined) {
                 empleadoFormElement.setAttribute('data-edit-id', editId);
                 cargarDatosEmpleado(editId); // Carga datos si es edición
                 const saveButton = empleadoFormElement.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Actualizar';
             } else {
                 empleadoFormElement.removeAttribute('data-edit-id');
                 const saveButton = empleadoFormElement.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Guardar';
             }
        }
        ocultarTodo(); // Oculta todo primero
        if (empleadoFormSection) empleadoFormSection.classList.remove('d-none'); // Muestra la sección del formulario
        actualizarBreadcrumb(editId !== null && editId !== undefined ? 'Editar Empleado' : 'Nuevo Empleado');
         mostrarElementosAutenticados();
    }

     function mostrarDetalleEmpleado(id) {
          if (!isAuthenticated) {
              showLoginForm();
              return;
          }
          const empleado = empleados.find(e => e.id == id);
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

              const btnEditar = document.getElementById('btn-editar-desde-detalle');
              if (btnEditar) {
                  if (usuarioActual && usuarioActual.rol !== 'admin') {
                      btnEditar.classList.add('d-none');
                  } else {
                       btnEditar.classList.remove('d-none');
                  }
              }

          }

          ocultarTodo();
          if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none'); // Muestra la sección de detalle
          actualizarBreadcrumb('Detalle de Empleado');
           mostrarElementosAutenticados();

          // Guardar el ID del empleado actual en la sección de detalle para usarlo en el botón editar
          if (empleadoDetalleSection) empleadoDetalleSection.setAttribute('data-current-empleado-id', empleado.id);

           // Event listener para el botón Editar desde Detalle (Adjuntamos directamente)
           const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
           if (btnEditarDesdeDetalle) {
               btnEditarDesdeDetalle.addEventListener('click', function() {
                   const empleadoId = empleadoDetalleSection ? empleadoDetalleSection.getAttribute('data-current-empleado-id') : null;
                   if (empleadoId) {
                       editarEmpleado(parseInt(empleadoId));
                   } else {
                       console.error("No se pudo obtener el ID del empleado desde la sección de detalle.");
                   }
               });
           }

           // Event listener para el botón Volver desde Detalle (Adjuntamos directamente)
           const btnVolverDesdeDetalle = document.getElementById('btn-volver-desde-detalle');
           if (btnVolverDesdeDetalle) {
               btnVolverDesdeDetalle.addEventListener('click', showEmpleadosList);
           }
     }


     function showCumpleanosList() {
          if (!isAuthenticated) {
              showLoginForm();
              return;
          }
          ocultarTodo();
           if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none'); // Muestra la sección de cumpleaños
          actualizarBreadcrumb('Próximos Cumpleaños');
          mostrarElementosAutenticados();

          renderCumpleanos();
     }

     function renderCumpleanos() {
          const tbody = document.getElementById('cumpleanos-table-body');
          if (!tbody) return;
          tbody.innerHTML = '';

          const proximosCumpleanos = empleados
              .filter(emp => emp.fechaNacimiento)
              .map(emp => {
                  const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                   if (dias >= 0) {
                      return { ...emp, diasRestantes: dias };
                  }
                  return null;
              })
              .filter(emp => emp !== null)
              .sort((a, b) => a.diasRestantes - b.diasRestantes);

          if (proximosCumpleanos.length === 0) {
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
        ocultarTodo();
         if (ausenciasListSection) ausenciasListSection.classList.remove('d-none'); // Muestra la sección de ausencias
        actualizarBreadcrumb('Gestión de Ausencias');
         mostrarElementosAutenticados();

         renderAusencias();
    }

    function renderAusencias() {
         const tbody = document.getElementById('ausencias-table-body');
         if (!tbody) return;
         tbody.innerHTML = '';

         const ausenciasOrdenadas = ausencias.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));


         if (ausenciasOrdenadas.length === 0) {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td colspan="4" class="text-center">No hay ausencias registradas.</td>`;
              tbody.appendChild(tr);
         } else {
              ausenciasOrdenadas.forEach(ausencia => {
                  const tr = document.createElement('tr');
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

         // Evento de delegación para eliminar ausencias (Usando jQuery .off().on())
         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn').on('click', '.eliminar-ausencia-btn', function() {
             const ausenciaId = $(this).data('id');
             eliminarAusencia(ausenciaId); // eliminarAusencia ya verifica el rol
         });
     }

     function eliminarAusencia(id) {
          if (!(usuarioActual && usuarioActual.rol === 'admin')) {
               mostrarAlerta('No tienes permiso para eliminar ausencias.', 'danger');
              return;
          }
          if (confirm('¿Está seguro de que desea eliminar esta ausencia? Esta acción es irreversible.')) {
             ausencias = ausencias.filter(a => a.id != id);
             localStorage.setItem('ausencias', JSON.stringify(ausencias));
             mostrarAlerta('Ausencia eliminada correctamente', 'success');
             renderAusencias();
          }
     }



    // --- Funciones de Autenticación ---
    function handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
            mostrarElementosAutenticados(); // Oculta login/registro, muestra autenticados en navbar
            showDashboard(); // Va al dashboard (que a su vez llama a notificarCumpleanos)
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

     function limpiarLogin() {
          // Limpia solo el formulario de login
          // Usamos la referencia correcta al elemento FORMULARIO con id="loginForm"
          if (loginFormElement) loginFormElement.reset();
     }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        ocultarElementosAutenticados(); // Oculta autenticados, muestra login/registro en navbar
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

        // Ocultar botones específicos de secciones primero
         ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);


         // Mostrar botones específicos según la sección actual
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
               mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) {
              mostrarElements([btnNuevoEmpleadoLista]);
         } else if (empleadoFormSection && !empleadoFormSection.classList.contains('d-none')) {
             mostrarElements([btnCancelar]);
         }
          // Nota: No hay botones específicos para Cumpleaños o Ausencias aparte de la navegación principal


         // Ocultar botones de autenticación (Login, Registro)
         ocultarElements([btnLogin, btnRegistro]);

         // Control de visibilidad de elementos solo para Admin si aplica
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         // const ausenciaForm = document.getElementById('ausenciaForm'); // Referencia ya global
         // const btnExportar = document.getElementById('btn-exportar-csv'); // Referencia ya global

         if (usuarioActual && usuarioActual.rol !== 'admin') {
             if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
             if (btnRegistro) btnRegistro.classList.add('d-none');
             if (ausenciaFormElement) ausenciaFormElement.classList.add('d-none');
             if (btnExportarCSV) btnExportarCSV.classList.add('d-none');

         } else {
              if (dashboardUsuariosCard) dashboardUsuariosCard.classList.remove('d-none');
              // btnRegistro se mantiene oculto si ya estás autenticado (solo aparece en vista no autenticada)
              if (ausenciaFormElement) ausenciaFormElement.classList.remove('d-none');
              if (btnExportarCSV) btnExportarCSV.classList.remove('d-none');
         }

         // Mostrar la barra de breadcrumb en el navbar si no estamos en login/registro
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) {
               if (loginFormSection.classList.contains('d-none') && registroFormSection.classList.contains('d-none')) {
                   breadcrumbNav.classList.remove('d-none');
               } else {
                   breadcrumbNav.classList.add('d-none');
               }
          }
     }


    function ocultarElementosAutenticados() {
        // Ocultar todos los botones de navegación principales
        ocultarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

        // Ocultar botones específicos de secciones
        ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);

        // Ocultar formulario de ausencia y tarjeta de usuarios dashboard
        // const ausenciaForm = document.getElementById('ausenciaForm'); // Referencia ya global
        if (ausenciaFormElement) ausenciaFormElement.classList.add('d-none');
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');

        // Mostrar botones de autenticación (Login, Registro)
        mostrarElements([btnLogin, btnRegistro]);

         // Ocultar la barra de breadcrumb en el navbar
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
    }


    // --- Funciones de Empleados (CRUD) ---
    function generarId() {
        return Date.now();
    }

    function guardarEmpleadosLocal() {
        localStorage.setItem('empleados', JSON.stringify(empleados));
        if (empleadosTable) {
             empleadosTable.clear().rows.add(empleados).draw();
             empleadosTable.draw();
        }
         actualizarFiltroDepartamentos();
         notificarCumpleanos();
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
              if (document.getElementById('dashboard-total-empleados')) {
                 document.getElementById('dashboard-total-empleados').textContent = empleados.length;
             }
         }
    }

     function cargarEmpleadosLocal() {
          // Ya se carga al inicio del script
     }


    function handleEmpleadoFormSubmit(e) {
        e.preventDefault();
        // Usamos la referencia directa al formulario de empleado
        if (!empleadoFormElement) return;

        const id = empleadoFormElement.getAttribute('data-edit-id');
        const nombresInput = document.getElementById('nombres');
        const apellidosInput = document.getElementById('apellidos');
        const cedulaInput = document.getElementById('cedula');
        const telefonoInput = document.getElementById('telefono');
        const emailInput = document.getElementById('email-empleado');
        const cargoInput = document.getElementById('cargo');
        const departamentoInput = document.getElementById('departamento');
        const tipoContratoInput = document.getElementById('tipoContrato');
        const fechaNacimientoInput = document.getElementById('fechaNacimiento');
        const fechaIngresoInput = document.getElementById('fechaIngreso');
        const salarioInput = document.getElementById('salario');
        const notasInput = document.getElementById('notas');
        const contactoEmergenciaNombreInput = document.getElementById('contactoEmergenciaNombre');
        const contactoEmergenciaTelefonoInput = document.getElementById('contactoEmergenciaTelefono');
        const contactoEmergenciaParentescoInput = document.getElementById('contactoEmergenciaParentesco');
        // Aquí irían las referencias a los NUEVOS campos si se añaden


        const nuevoEmpleado = {
            id: id ? parseInt(id) : generarId(),
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
            salario: salarioInput ? parseFloat(salarioInput.value.replace(/\./g, '').replace(',', '.')) : 0,
            notas: notasInput ? notasInput.value.trim() : '',
            contactoEmergenciaNombre: contactoEmergenciaNombreInput ? contactoEmergenciaNombreInput.value.trim() : '',
            contactoEmergenciaTelefono: contactoEmergenciaTelefonoInput ? contactoEmergenciaTelefonoInput.value.trim() : '',
            contactoEmergenciaParentesco: contactoEmergenciaParentescoInput ? contactoEmergenciaParentescoInput.value.trim() : '',
            // Aquí se añadirían los valores de los NUEVOS campos
        };

         // Validaciones básicas
         if (!nuevoEmpleado.nombres || !nuevoEmpleado.apellidos || !nuevoEmpleado.cedula || !nuevoEmpleado.fechaIngreso || !nuevoEmpleado.departamento) {
              mostrarAlerta('Por favor, complete los campos obligatorios (Nombres, Apellidos, Cédula, Fecha de Ingreso, Departamento).', 'warning');
              return;
         }

         const cedulaExiste = empleados.some(emp => emp.cedula === nuevoEmpleado.cedula && emp.id != nuevoEmpleado.id);
         if (cedulaExiste) {
              mostrarAlerta('La cédula ingresada ya existe para otro empleado.', 'warning');
              return;
         }


        if (id) {
            empleados = empleados.map(emp => emp.id == id ? nuevoEmpleado : emp);
            mostrarAlerta('Empleado actualizado correctamente', 'success');
        } else {
            empleados.push(nuevoEmpleado);
            mostrarAlerta('Empleado agregado correctamente', 'success');
        }

        guardarEmpleadosLocal();
        showEmpleadosList();
    }

    function cargarDatosEmpleado(id) {
        const empleado = empleados.find(emp => emp.id == id);
        // Usamos la referencia directa al formulario de empleado
        if (empleado && empleadoFormElement) {
            document.getElementById('nombres').value = empleado.nombres || '';
            document.getElementById('apellidos').value = empleado.apellidos || '';
            document.getElementById('cedula').value = empleado.cedula || '';
            document.getElementById('telefono').value = empleado.telefono || '';
            document.getElementById('email-empleado').value = empleado.email || '';
            document.getElementById('cargo').value = empleado.cargo || '';
            document.getElementById('departamento').value = empleado.departamento || '';
            document.getElementById('tipoContrato').value = empleado.tipoContrato || '';
            document.getElementById('fechaNacimiento').value = empleado.fechaNacimiento || '';
            document.getElementById('fechaIngreso').value = empleado.fechaIngreso || '';
            document.getElementById('salario').value = empleado.salario ? formatearMilesInput(empleado.salario) : '';
            document.getElementById('notas').value = empleado.notas || '';
             document.getElementById('contactoEmergenciaNombre').value = empleado.contactoEmergenciaNombre || '';
             document.getElementById('contactoEmergenciaTelefono').value = empleado.contactoEmergenciaTelefono || '';
             document.getElementById('contactoEmergenciaParentesco').value = empleado.contactoEmergenciaParentesco || '';
             // Aquí se añadirían las líneas para cargar los valores de los NUEVOS campos
        }
    }

     function editarEmpleado(id) {
          if (!(usuarioActual && usuarioActual.rol === 'admin')) {
               mostrarAlerta('No tienes permiso para editar empleados.', 'danger');
              return;
          }
         showEmpleadoForm(id);
     }

    function eliminarEmpleado(id) {
         if (!(usuarioActual && usuarioActual.rol === 'admin')) {
              mostrarAlerta('No tienes permiso para eliminar empleados.', 'danger');
             return;
         }
        if (confirm('¿Está seguro de que desea eliminar este empleado? Esta acción es irreversible.')) {
            empleados = empleados.filter(emp => emp.id != id);
            guardarEmpleadosLocal();
            mostrarAlerta('Empleado eliminado correctamente', 'success');
            showEmpleadosList();
        }
    }


    // --- Funciones de Utilidad ---

    function formatearFecha(fechaStr) {
        if (!fechaStr) return '';
        const [year, month, day] = fechaStr.split('-');
        if (!year || !month || !day) return fechaStr;
        const date = new Date(fechaStr);
         if (isNaN(date.getTime())) {
              return fechaStr;
         }
        return `${day}/${month}/${year}`;
    }


      function calcularAntiguedad(fechaIngresoStr) {
          if (!fechaIngresoStr) return 0;
          const fechaIngreso = new Date(fechaIngresoStr);
           if (isNaN(fechaIngreso.getTime())) { return 0; }
          const hoy = new Date();
          hoy.setHours(0,0,0,0);
          fechaIngreso.setHours(0,0,0,0);
          if (fechaIngreso > hoy) { return 0; }
          const diffMs = hoy.getTime() - fechaIngreso.getTime();
          const añosExactos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
          return añosExactos > 0 ? añosExactos : 0;
      }


      function calcularAntiguedadTexto(fechaIngresoStr) {
          if (!fechaIngresoStr) return 'Fecha no válida';
          const fechaIngreso = new Date(fechaIngresoStr);
          if (isNaN(fechaIngreso.getTime())) { return 'Fecha no válida'; }
          const hoy = new Date();
          if (fechaIngreso > hoy) { return 'Fecha futura'; }

          let años = hoy.getFullYear() - fechaIngreso.getFullYear();
          let meses = hoy.getMonth() - fechaIngreso.getMonth();
          let dias = hoy.getDate() - fechaIngreso.getDate();

          if (dias < 0) {
              meses--;
              const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
              dias = ultimoDiaMesAnterior + dias;
          }
          if (meses < 0) {
              años--;
              meses = 12 + meses;
          }

          const partes = [];
          if (años > 0) partes.push(`${años} año${años > 1 ? 's' : ''}`);
          if (meses > 0) partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
           if (dias > 0 || (años === 0 && meses === 0 && dias >= 0)) { // Incluye "Hoy" (0 días) si es menos de un mes
               partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
           }


          if (partes.length === 0) {
              const fechaIngresoSinHora = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());
              const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
               if (fechaIngresoSinHora.getTime() === hoySinHora.getTime()) { return 'Hoy'; }
               return 'Menos de 1 día';
          }

          if (partes.length > 1) {
              const ultimaParte = partes.pop();
              return partes.join(', ') + ' y ' + ultimaParte;
          }
          return partes.join(', ');
      }


    function formatearMiles(numero) {
        if (numero === null || numero === undefined) return '';
         const num = parseFloat(numero);
         if (isNaN(num)) return '';
        return num.toLocaleString('es-ES');
    }

    function formatearMilesInput(numero) {
        if (numero === null || numero === undefined) return '';
         const num = parseFloat(numero);
         if (isNaN(num)) return '';
        return num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }


     function mostrarAlerta(mensaje, tipo) {
         const alertaContainer = document.getElementById('alerta-container');
         if (!alertaContainer) {
              console.error("Error: No se encontró el contenedor de alertas con ID 'alerta-container'.");
              alert(mensaje);
              return;
         }

         alertaContainer.innerHTML = '';

         const alerta = document.createElement('div');
         alerta.classList.add('alert', `alert-${tipo}`, 'alert-dismissible', 'fade', 'show');
         alerta.setAttribute('role', 'alert');
         alerta.innerHTML = `
             ${mensaje}
             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
         `;

         alertaContainer.appendChild(alerta);

         setTimeout(() => {
             const alertToRemove = alertaContainer.querySelector('.alert.show');
              if (alertToRemove) {
                   const bootstrapAlert = bootstrap.Alert.getInstance(alertToRemove);
                   if (bootstrapAlert) {
                       bootstrapAlert.hide();
                       setTimeout(() => alertToRemove.remove(), 500);
                   } else {
                       alertToRemove.remove();
                   }
              }
         }, 7000);
     }


     function actualizarFiltroDepartamentos() {
         if (!filtroDepartamentoSelect) return;
         const departamentosUnicos = [...new Set(empleados.map(emp => emp.departamento).filter(dep => dep))].sort();
         const valorSeleccionadoActual = filtroDepartamentoSelect.value;
         filtroDepartamentoSelect.innerHTML = '<option value="">Todos los Departamentos</option>';
         departamentosUnicos.forEach(departamento => {
             const option = document.createElement('option');
             option.value = departamento;
             option.textContent = departamento;
             filtroDepartamentoSelect.appendChild(option);
         });
         if ([...filtroDepartamentoSelect.options].some(option => option.value === valorSeleccionadoActual)) {
             filtroDepartamentoSelect.value = valorSeleccionadoActual;
         } else {
             filtroDepartamentoSelect.value = "";
              if (empleadosTable && empleadosListSection && !empleadosListSection.classList.contains('d-none')) {
                 empleadosTable.column(6).search('', true, false).draw();
             }
         }
     }

     function calcularDiasParaCumpleanos(fechaNacimientoStr) {
         if (!fechaNacimientoStr) return -1;
         const fechaNacimiento = new Date(fechaNacimientoStr);
          if (isNaN(fechaNacimiento.getTime())) { return -1; }
         const hoy = new Date();
         hoy.setHours(0, 0, 0, 0);
         const cumpleanosEsteAño = new Date(hoy.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate());
         cumpleanosEsteAño.setHours(0, 0, 0, 0);
         const unDia = 24 * 60 * 60 * 1000;

         if (cumpleanosEsteAño < hoy) {
             const cumpleanosProximoAño = new Date(hoy.getFullYear() + 1, fechaNacimiento.getMonth(), fechaNacimiento.getDate());
             cumpleanosProximoAño.setHours(0, 0, 0, 0);
             const diffMs = cumpleanosProximoAño.getTime() - hoy.getTime();
             return Math.round(diffMs / unDia);
         } else {
             const diffMs = cumpleanosEsteAño.getTime() - hoy.getTime();
             return Math.round(diffMs / unDia);
         }
     }


     function notificarCumpleanos() {
          const notificacionesDiv = document.getElementById('cumpleanos-notificaciones');
          const proximosCumpleanos30Dias = empleados
              .filter(emp => emp.fechaNacimiento && calcularDiasParaCumpleanos(emp.fechaNacimiento) >= 0)
              .map(emp => {
                  const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                   if (dias >= 0 && dias <= 30) {
                      return { ...emp, diasRestantes: dias };
                  }
                  return null;
              })
              .filter(emp => emp !== null)
              .sort((a, b) => a.diasRestantes - b.diasRestantes);


          if (notificacionesDiv) {
              notificacionesDiv.innerHTML = '';
              if (proximosCumpleanos30Dias.length > 0) {
                  let notificacionHtml = '<h6 class="card-subtitle mb-2 text-muted">Próximos Cumpleaños (30 días)</h6><ul>';
                  proximosCumpleanos30Dias.forEach(emp => {
                      notificacionHtml += `<li>${emp.nombres || ''} ${emp.apellidos || ''} - ${emp.diasRestantes === 0 ? 'Hoy' : `en ${emp.diasRestantes} día${emp.diasRestantes !== 1 ? 's' : ''}`} (${formatearFecha(emp.fechaNacimiento)})</li>`;
                  });
                  notificacionHtml += '</ul>';
                  notificacionesDiv.innerHTML = notificacionHtml;
                  notificacionesDiv.classList.remove('d-none');
              } else {
                  notificacionesDiv.innerHTML = '<p class="card-text text-muted">No hay próximos cumpleaños registrados en los siguientes 30 días.</p>';
                  notificacionesDiv.classList.remove('d-none');
              }
          }

           const cumpleanosHoy = empleados.filter(emp => emp.fechaNacimiento && calcularDiasParaCumpleanos(emp.fechaNacimiento) === 0);
           if (cumpleanosHoy.length > 0) {
               const alertaExiste = document.querySelector('.alert-info');
               const alertaExistenteYaDiceCumple = alertaExiste ? alertaExiste.textContent.includes('cumpleaños hoy') : false;

               if (!alertaExiste || !alertaExistenteYaDiceCumple) {
                    mostrarAlerta('¡Hay cumpleaños hoy! Revisa el Dashboard.', 'info');
               }
           }
     }


     // --- Funciones de Restablecimiento de Contraseña (Solo demo) ---
     function showResetPasswordModal() {
         if (resetPasswordModal) {
              const resetEmailInput = document.getElementById('reset-email');
              const resetRequestBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null;
              const resetConfirmBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('.modal-footer button.btn-primary') : null;


              if (resetEmailInput) resetEmailInput.value = '';
               if (resetPasswordFields) resetPasswordFields.classList.add('d-none');
               if (resetRequestBtnElement) resetRequestBtnElement.classList.remove('d-none');
               if (resetConfirmBtnElement) resetConfirmBtnElement.classList.add('d-none');
              if (resetMessage) resetMessage.textContent = 'Ingresa tu correo electrónico registrado para restablecer tu contraseña:';

              const newPasswordInput = document.getElementById('new-password');
              const confirmPasswordInput = document.getElementById('confirm-password');
              if(newPasswordInput) newPasswordInput.value = '';
              if(confirmPasswordInput) confirmPasswordInput.value = '';


              resetPasswordModal.show();
         } else {
              console.error("Modal de restablecimiento de contraseña no encontrado.");
              mostrarAlerta("Error al abrir el formulario de restablecimiento de contraseña.", "danger");
         }
     }

     function handleResetPasswordRequest(e) {
         e.preventDefault();
         const resetEmailInput = document.getElementById('reset-email');
         const email = resetEmailInput ? resetEmailInput.value.trim() : '';

         const usuario = usuariosPermitidos.find(u => u.email === email);

         if (usuario) {
             emailToReset = email;
             if (resetPasswordFields) resetPasswordFields.classList.remove('d-none');
             if (resetMessage) resetMessage.textContent = 'Correo encontrado. Ingresa tu nueva contraseña:';
             const resetRequestBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null;
             const resetConfirmBtnElement = resetPasswordForm ? resetPasswordForm.querySelector('.modal-footer button.btn-primary') : null;
             if (resetRequestBtnElement) resetRequestBtnElement.classList.add('d-none');
             if (resetConfirmBtnElement) resetConfirmBtnElement.classList.remove('d-none');

              const newPasswordInput = document.getElementById('new-password');
              const confirmPasswordInput = document.getElementById('confirm-password');
              if(newPasswordInput) newPasswordInput.value = '';
              if(confirmPasswordInput) confirmPasswordInput.value = '';


         } else {
              if (resetMessage) resetMessage.textContent = 'Correo no encontrado. Intenta de nuevo.';
             mostrarAlerta('Correo no encontrado.', 'danger');
         }
     }

     function handleResetPasswordConfirm(e) {
          e.preventDefault();
          const newPasswordInput = document.getElementById('new-password');
          const confirmPasswordInput = document.getElementById('confirm-password');

          const newPassword = newPasswordInput ? newPasswordInput.value : '';
          const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

          if (newPassword !== confirmPassword) {
              mostrarAlerta('Las contraseñas no coinciden.', 'warning');
               if (resetMessage) resetMessage.textContent = 'Las contraseñas no coinciden. Intenta de nuevo:';
              return;
          }

          if (newPassword.length < 6) {
               mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'warning');
               if (resetMessage) resetMessage.textContent = 'La contraseña es muy corta. Debe tener al menos 6 caracteres:';
               return;
          }

          usuariosPermitidos = usuariosPermitidos.map(u => {
              if (u.email === emailToReset) {
                  return { ...u, password: newPassword };
              }
              return u;
          });
          localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));

          mostrarAlerta('Contraseña restablecida con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.', 'success');
          if (resetPasswordModal) resetPasswordModal.hide();
          emailToReset = '';
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

          const headers = ["ID", "Nombres", "Apellidos", "Cédula", "Teléfono", "Email", "Cargo", "Departamento", "Tipo Contrato", "Fecha Nacimiento", "Fecha Ingreso", "Salario", "Notas", "Contacto Emergencia Nombre", "Contacto Emergencia Teléfono", "Contacto Emergencia Parentesco"];

          const rows = empleados.map(emp => [
              emp.id,
              `"${(emp.nombres || '').replace(/"/g, '""')}"`,
              `"${(emp.apellidos || '').replace(/"/g, '""')}"`,
              `"${(emp.cedula || '').replace(/"/g, '""')}"`,
              `"${(emp.telefono || '').replace(/"/g, '""')}"`,
              `"${(emp.email || '').replace(/"/g, '""')}"`,
              `"${(emp.cargo || '').replace(/"/g, '""')}"`,
              `"${(emp.departamento || '').replace(/"/g, '""')}"`,
              `"${(emp.tipoContrato || '').replace(/"/g, '""')}"`,
              `"${formatearFecha(emp.fechaNacimiento).replace(/"/g, '""')}"`,
              `"${formatearFecha(emp.fechaIngreso).replace(/"/g, '""')}"`,
               usuarioActual && usuarioActual.rol === 'admin' ? `"${(emp.salario || '').toString().replace(/"/g, '""')}"` : '****',
              `"${(emp.notas || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaNombre || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaTelefono || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaParentesco || '').replace(/"/g, '""')}"`,
              // Aquí se añadirían los NUEVOS campos al CSV
          ]);

          const csvContent = "\uFEFF" + [
              headers.join(","),
              ...rows.map(row => row.join(","))
          ].join("\n");

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "empleados_ashe.csv");

          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();

           setTimeout(() => {
               document.body.removeChild(link);
               URL.revokeObjectURL(url);
           }, 100);

          mostrarAlerta('Datos de empleados exportados a CSV.', 'success');
      }


    // --- Event Listeners ---
    // Listeners de Autenticación (Adjuntamos directamente si el elemento existe)
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin); // Listener al formulario de login
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Listener para el enlace "¿Olvidaste tu contraseña?"
     if (forgotPasswordLink) {
         forgotPasswordLink.addEventListener('click', function(e) {
             e.preventDefault();
             showResetPasswordModal();
         });
     }

     // Listeners para el formulario y botones dentro del modal de restablecer contraseña
     if (resetPasswordForm) {
         // Listener al submit del formulario del modal (funciona con Enter o clic en submit)
          resetPasswordForm.addEventListener('submit', function(e) {
              e.preventDefault();
              // Verificamos qué botón submit está visible para saber si es solicitud o confirmación
              const resetRequestBtnElement = resetPasswordForm.querySelector('button[type="submit"]'); // El primer submit es solicitar
              const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary'); // El de continuar en el footer

               if (resetConfirmBtnElement && !resetConfirmBtnElement.classList.contains('d-none')) {
                  // Si el botón de confirmar está visible, estamos en el segundo paso
                  handleResetPasswordConfirm(e);
              } else {
                  // De lo contrario, estamos en el primer paso (solicitud de email)
                  handleResetPasswordRequest(e);
              }
          });

          // Listeners explícitos para los botones por si no se usa Enter (opcional pero robusto)
          const resetRequestBtnElement = resetPasswordForm.querySelector('button[type="submit"]');
          const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary');

          if (resetRequestBtnElement) {
               // Usamos type="button" para que no actúe como submit por defecto si el form ya tiene un listener
               // Pero aquí el listener del form ya maneja ambos casos, así que este listener explícito es un respaldo.
               // Es mejor usar type="submit" para el primer botón y type="button" para el segundo y que el form listener determine la acción.
               // La lógica actual en el listener del form ya usa el submitter o la visibilidad para decidir.
               // Si quieres listeners separados que *no* dependan del listener del form, podrías usar type="button" en ambos y llamar a preventDefault() aquí.
               // Pero el setup actual con un listener en el form y type="submit" en el primer botón es estándar.
               // Si da problemas, podríamos cambiar ambos a type="button" y manejarlo solo con estos listeners explícitos.
               // Por ahora, mantenemos la lógica del listener del form, estos listeners explícitos son de respaldo.
                resetRequestBtnElement.addEventListener('click', handleResetPasswordRequest); // Adjuntamos directamente
          }

          if (resetConfirmBtnElement) {
               resetConfirmBtnElement.addEventListener('click', handleResetPasswordConfirm); // Adjuntamos directamente
          }


     }


    // Listeners de Registro
    // Usamos la referencia directa a la sección del formulario de registro para el botón del navbar
    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm);

    // Listener para el formulario de registro (enviar)
    // Usamos .off().on() con jQuery si es necesario evitar múltiples envíos
     if (registroFormElement) {
         $(registroFormElement).off('submit').on('submit', function(e) {
             e.preventDefault();
             const newEmailInput = document.getElementById('new-email');
             const newPasswordInput = document.getElementById('new-password-reg');
             const confirmPasswordInput = document.getElementById('confirm-password-reg');
             const newEmail = newEmailInput ? newEmailInput.value.trim() : '';
             const newPassword = newPasswordInput ? newPasswordInput.value : '';
             const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

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

             usuariosPermitidos.push({ email: newEmail, password: newPassword, rol: 'empleado' });
             localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));

             mostrarAlerta('Usuario registrado con éxito. Ahora puedes iniciar sesión.', 'success');
             hideRegistroForm();
         });
     }


     if (btnCancelarRegistro) btnCancelarRegistro.addEventListener('click', hideRegistroForm);

    // Listeners de Navegación del Navbar (Adjuntamos directamente si el elemento existe)
     if (btnDashboard) btnDashboard.addEventListener('click', showDashboard);
     if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList);
     if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList);
     if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList);


    // Listeners de botones de las secciones (Dashboard, Lista Empleados) (Adjuntamos directamente si el elemento existe)
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm()); // Botón "Agregar Nuevo Empleado" en Dashboard
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm()); // Botón "Nuevo Empleado" en Lista de Empleados
     if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList); // Botón "Ver Empleados" en Dashboard
     if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV); // Botón Exportar

    // Listener del formulario de Empleado (Guardar/Actualizar)
    // Usamos .off().on() con jQuery si es necesario evitar múltiples envíos
    if (empleadoFormElement) {
         $(empleadoFormElement).off('submit').on('submit', handleEmpleadoFormSubmit);
    }


    // Listener del botón Cancelar en el formulario de empleado (Adjuntamos directamente si el elemento existe)
    if (btnCancelar) btnCancelar.addEventListener('click', showEmpleadosList);

    // Listener para el enlace "Inicio" en el breadcrumb (Adjuntamos directamente si el elemento existe)
     if (breadcrumbHomeLink) {
          breadcrumbHomeLink.addEventListener('click', function(e) {
             e.preventDefault();
              if (isAuthenticated) {
                 showDashboard();
             } else {
                 showLoginForm();
             }
         });
     }


     // --- Funcionalidad para mostrar/ocultar contraseña ---
     // Busca todos los botones con la clase 'toggle-password'
     const togglePasswordButtons = document.querySelectorAll('.toggle-password');

     togglePasswordButtons.forEach(button => {
         // Adjuntamos el listener directamente si el elemento existe y tiene padre (para mayor seguridad)
         if (button && button.parentNode) {
             button.addEventListener('click', function() {
                 const targetId = this.dataset.target;
                 const passwordInput = document.getElementById(targetId);

                 if (passwordInput) {
                     const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                     passwordInput.setAttribute('type', type);

                     const icon = this.querySelector('i');
                     if (icon) {
                         icon.classList.toggle('bi-eye');
                         icon.classList.toggle('bi-eye-slash');
                     }
                 }
             });
         } else {
             console.warn("Botón toggle password encontrado sin parentNode al adjuntar listener:", button);
         }
     });
     // --- Fin Funcionalidad mostrar/ocultar contraseña ---


    // --- Inicialización ---
    // Los usuarios y empleados/ausencias ya se cargan/inicializan al inicio del script

    // Redirigir a la página de login al cargar la aplicación
    showLoginForm();
}); // Fin del DOMContentLoaded
