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
         if (loginFormSection) loginFormSection.classList.remove('d-none'); // Muestra la sección del formulario de login
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
             showLoginForm();
             return;
         }
         ocultarTodo();
         if (dashboardSection) dashboardSection.classList.remove('d-none');
         mostrarElementosAutenticados();

         actualizarBreadcrumb('Dashboard');

         if (document.getElementById('dashboard-total-empleados')) {
             document.getElementById('dashboard-total-empleados').textContent = empleados.length;
         }
          if (document.getElementById('dashboard-usuarios')) {
             document.getElementById('dashboard-usuarios').textContent = usuariosPermitidos.length;
           }


         const proximosCumpleanosCount = empleados.filter(emp => {
             if (!emp.fechaNacimiento) return false;
             const diasRestantes = calcularDiasParaCumpleanos(emp.fechaNacimiento);
             return diasRestantes >= 0 && diasRestantes <= 30;
         }).length;
          if (document.getElementById('dashboard-cumpleanos')) {
             document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanosCount;
          }

          notificarCumpleanos();

     }

    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        ocultarTodo();
        if (empleadosListSection) empleadosListSection.classList.remove('d-none');
        mostrarElementsAutenticados();

        actualizarBreadcrumb('Lista de Empleados');

        if (filtroDepartamentoSelect && filtroDepartamentoSelect.options.length <= 1) {
             actualizarFiltroDepartamentos();
        }


        // --- Inicializar o actualizar DataTables ---
        if (empleadosTable === null) {
            empleadosTable = $('#empleados-table').DataTable({
                 data: empleados,
                 columns: [
                     {
                          data: 'nombres',
                          render: function(data, type, row) {
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
                      eliminarEmpleado(rowData.id);
                 }
             });


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
             empleadosTable.clear().rows.add(empleados).draw();
             empleadosTable.draw();
        }
    }


    function showEmpleadoForm(editId = null) {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        if (empleadoFormElement) {
            empleadoFormElement.reset();
             if (editId !== null && editId !== undefined) {
                 empleadoFormElement.setAttribute('data-edit-id', editId);
                 cargarDatosEmpleado(editId);
                 const saveButton = empleadoFormElement.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Actualizar';
             } else {
                 empleadoFormElement.removeAttribute('data-edit-id');
                 const saveButton = empleadoFormElement.querySelector('button[type="submit"]');
                 if(saveButton) saveButton.innerHTML = '<i class="bi bi-save"></i> Guardar';
             }
        }
        ocultarTodo();
        if (empleadoFormSection) empleadoFormSection.classList.remove('d-none');
        actualizarBreadcrumb(editId !== null && editId !== undefined ? 'Editar Empleado' : 'Nuevo Empleado');
         mostrarElementsAutenticados();
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
                            <h5>Dirección</h5>
                            <p>${empleado.direccion || 'No especificada'}</p>
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
          if (empleadoDetalleSection) empleadoDetalleSection.classList.remove('d-none');
          actualizarBreadcrumb('Detalle de Empleado');
           mostrarElementsAutenticados();

          if (empleadoDetalleSection) empleadoDetalleSection.setAttribute('data-current-empleado-id', empleado.id);

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
           if (cumpleanosListSection) cumpleanosListSection.classList.remove('d-none');
          actualizarBreadcrumb('Próximos Cumpleaños');
          mostrarElementsAutenticados();

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
         if (ausenciasListSection) ausenciasListSection.classList.remove('d-none');
        actualizarBreadcrumb('Gestión de Ausencias');
         mostrarElementsAutenticados();

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

         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn').on('click', '.eliminar-ausencia-btn', function() {
             const ausenciaId = $(this).data('id');
             eliminarAusencia(ausenciaId);
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


     if (ausenciaFormElement) {
         $(ausenciaFormElement).off('submit').on('submit', function(e) {
              e.preventDefault();
              if (!(usuarioActual && usuarioActual.rol === 'admin')) {
                   mostrarAlerta('No tienes permiso para registrar ausencias.', 'danger');
                  return;
              }

              const nombreInput = document.getElementById('ausencia-nombre');
              const fechaInput = document.getElementById('ausencia-fecha');
              const tipoSelect = document.getElementById('ausencia-tipo');

              const nuevaAusencia = {
                  id: Date.now(),
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
              ausenciaFormElement.reset();
              renderAusencias();
          });
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
            mostrarElementsAutenticados();
            showDashboard();
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

     function limpiarLogin() {
          if (loginFormElement) loginFormElement.reset();
     }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        ocultarElementsAutenticados();
        showLoginForm();
        mostrarAlerta('Sesión cerrada correctamente', 'success');
    }

    function mostrarElements(elements) {
         elements.forEach(el => { if(el) el.classList.remove('d-none'); });
    }

    function ocultarElements(elements) {
         elements.forEach(el => { if(el) el.classList.add('d-none'); });
     }


    function mostrarElementsAutenticados() {
         mostrarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);

         ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);


         if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
               mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) {
              mostrarElements([btnNuevoEmpleadoLista]);
         } else if (empleadoFormSection && !empleadoFormSection.classList.contains('d-none')) {
             mostrarElements([btnCancelar]);
         }

         ocultarElements([btnLogin, btnRegistro]);

         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         if (usuarioActual && usuarioActual.rol !== 'admin') {
             if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
             if (btnRegistro) btnRegistro.classList.add('d-none');
             if (ausenciaFormElement) ausenciaFormElement.classList.add('d-none');
             if (btnExportarCSV) btnExportarCSV.classList.add('d-none');

         } else {
              if (dashboardUsuariosCard) dashboardUsuariosCard.classList.remove('d-none');
              if (ausenciaFormElement) ausenciaFormElement.classList.remove('d-none');
              if (btnExportarCSV) btnExportarCSV.classList.remove('d-none');
         }

          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) {
               if (loginFormSection.classList.contains('d-none') && registroFormSection.classList.contains('d-none')) {
                   breadcrumbNav.classList.add('d-none'); // Ocultar breadcrumb si estamos en login/registro
               } else {
                   breadcrumbNav.classList.remove('d-none'); // Mostrarlo en secciones autenticadas
               }
          }
     }


    function ocultarElementosAutenticados() {
        ocultarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias]);
        ocultarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);

        if (ausenciaFormElement) ausenciaFormElement.classList.add('d-none');
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');

        mostrarElements([btnLogin, btnRegistro]);

          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Ocultar breadcrumb si no está autenticado
    }


    // --- Event Listeners ---
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

     if (forgotPasswordLink) {
         forgotPasswordLink.addEventListener('click', function(e) {
             e.preventDefault();
             showResetPasswordModal();
         });
     }

     if (resetPasswordForm) {
          resetPasswordForm.addEventListener('submit', function(e) {
              e.preventDefault();
              const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary');
               if (resetConfirmBtnElement && !resetConfirmBtnElement.classList.contains('d-none')) {
                  handleResetPasswordConfirm(e);
              } else {
                  handleResetPasswordRequest(e);
              }
          });

          const resetRequestBtnElement = resetPasswordForm.querySelector('button[type="submit"]');
          const resetConfirmBtnElement = resetPasswordForm.querySelector('.modal-footer button.btn-primary');

          if (resetRequestBtnElement) {
                resetRequestBtnElement.addEventListener('click', handleResetPasswordRequest);
          }

          if (resetConfirmBtnElement) {
               resetConfirmBtnElement.addEventListener('click', handleResetPasswordConfirm);
          }


     }

    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm);

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

     if (btnDashboard) btnDashboard.addEventListener('click', showDashboard);
     if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList);
     if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList);
     if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList);


    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm());
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm());
     if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList);
     if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV);

    if (empleadoFormElement) {
         $(empleadoFormElement).off('submit').on('submit', handleEmpleadoFormSubmit);
    }


    if (btnCancelar) btnCancelar.addEventListener('click', showEmpleadosList);

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
     const togglePasswordButtons = document.querySelectorAll('.toggle-password');

     togglePasswordButtons.forEach(button => {
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
    showLoginForm();
}); // Fin del DOMContentLoaded
