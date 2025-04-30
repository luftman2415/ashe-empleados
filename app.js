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
    const loginForm = document.getElementById('login-form'); // <-- CORREGIDO
    const registroForm = document.getElementById('registro-form'); // <-- CORREGIDO
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
             const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]'); // Seleccionar la navegación del breadcrumb
              if (breadcrumbNav) breadcrumbNav.classList.remove('d-none');

              // Ocultar el breadcrumb principal si estamos en login/registro
             if (seccion === 'Inicio de Sesión' || seccion === 'Registro') {
                 if (breadcrumbNav) breadcrumbNav.classList.add('d-none');
             }
        }
    }


    function showLoginForm() {
         ocultarTodo(); // Oculta todo primero
         if (loginForm) loginForm.classList.remove('d-none');
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
             // Delegación solo para el botón eliminar, y solo si el usuario es admin
             if (usuarioActual && usuarioActual.rol === 'admin') {
                 $('#empleados-table-body').on('click', '.eliminar-empleado-btn', function() {
                      // Obtenemos el objeto de datos asociado al botón
                      const rowData = empleadosTable.row($(this).parents('tr')).data();
                     if (rowData && rowData.id !== undefined) {
                          eliminarEmpleado(rowData.id);
                     }
                 });
             }


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
             // Re-aplicar filtros actuales al redibujar (en caso de que los selectores tengan valores)
             // Primero búsqueda global
             if (busquedaEmpleadosInput) empleadosTable.search(busquedaEmpleadosInput.value).draw();
             // Luego filtro de columna por departamento
             if (filtroDepartamentoSelect) {
                  const searchValue = filtroDepartamentoSelect.value;
                  empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
             }
             // El filtro de antigüedad es personalizado, solo necesitamos redibujar
             if (filtroAntiguedadSelect) empleadosTable.draw();

             // Actualizar visibilidad del botón eliminar si el rol cambió (improbable en esta demo, pero buena práctica)
             // La lógica ya está en el render de la columna, solo necesitamos redibujar si la data cambió
             // empleadosTable.rows().invalidate().draw(); // Invalidar caché si el rol afectara la visualización por fila
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
          const btnEditarDesdeDetalle = document.getElementById('btn-editar-desde-detalle');
          if (btnEditarDesdeDetalle) {
               // Quitamos listener viejo y ponemos uno nuevo para evitar duplicados
               // Clonamos solo si el botón está visible (es admin)
               if (!btnEditarDesdeDetalle.classList.contains('d-none')) {
                   const newBtnEditarDesdeDetalle = btnEditarDesdeDetalle.cloneNode(true);
                   btnEditarDesdeDetalle.parentNode.replaceChild(newBtnEditarDesdeDetalle, btnEditarDesdeDetalle);
                   newBtnEditarDesdeDetalle.addEventListener('click', function() {
                       editarEmpleado(empleado.id); // Llama a la función editarEmpleado
                   });
               }
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
         // Quitamos listener viejo y ponemos uno nuevo
         $('#ausencias-list .table tbody').off('click', '.eliminar-ausencia-btn'); // Quitar listeners existentes
         if (usuarioActual && usuarioActual.rol === 'admin') {
              $('#ausencias-list .table tbody').on('click', '.eliminar-ausencia-btn', function() {
                  const ausenciaId = $(this).data('id'); // Usamos jQuery data para obtener el id
                  eliminarAusencia(ausenciaId);
              });
         }
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
     const ausenciaFormElement = document.getElementById('ausenciaForm');
     if (ausenciaFormElement) {
          // Quitamos listener viejo y ponemos uno nuevo (prevents multiple listeners on redraw/re-show)
          const newAusenciaForm = ausenciaFormElement.cloneNode(true);
          ausenciaFormElement.parentNode.replaceChild(newAusenciaForm, ausenciaFormElement);

         newAusenciaForm.addEventListener('submit', function(e) {
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
          const loginFormElement = document.getElementById('loginForm');
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
         if (dashboardSection && !dashboardSection.classList.contains('d-none')) { // Si el dashboard está visible
              // Botones en el dashboard
               mostrarElements([btnNuevoEmpleado, btnVerEmpleados, btnExportarCSV]);
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
              // Botones en la lista de empleados
              mostrarElements([btnNuevoEmpleadoLista]); // Botón flotante "+"
              // Los filtros y búsqueda ya están visibles en la sección
         } else if (empleadoFormSection && !empleadoFormSection.classList.contains('d-none')) { // Si el formulario de empleado está visible
             // Botones en el formulario de empleado
             mostrarElements([btnCancelar]); // Muestra el botón cancelar
         } else if (empleadoDetalleSection && !empleadoDetalleSection.classList.contains('d-none')) { // Si el detalle de empleado está visible
              // Botones en el detalle de empleado
              mostrarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);
         }
          // Nota: No hay botones específicos para Cumpleaños o Ausencias aparte de la navegación principal

         // Ocultar botones de autenticación si existen
         ocultarElements([btnLogin, btnRegistro]);

         // Control de visibilidad de elementos solo para Admin si aplica
         const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
         const ausenciaForm = document.getElementById('ausenciaForm'); // Formulario de registro de ausencia
         const btnExportar = document.getElementById('btn-exportar-csv'); // Botón Exportar CSV (si está en el dashboard)

         if (usuarioActual && usuarioActual.rol !== 'admin') {
             // Ocultar elementos solo para admin si existen
             if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
             if (btnRegistro) btnRegistro.classList.add('d-none'); // Usuario empleado no puede registrar nuevos usuarios
             if (ausenciaForm) ausenciaForm.classList.add('d-none'); // Usuario empleado no puede registrar ausencias
             if (btnExportar) btnExportar.classList.add('d-none'); // Usuario empleado no puede exportar

             // Ocultar columnas/botones de admin en tablas (manejado en renderizado de DataTables y renderAusencias)

         } else {
              // Si es admin, asegurarse de que estén visibles si existen
              if (dashboardUsuariosCard) dashboardUsuariosCard.classList.remove('d-none');
              if (btnRegistro) btnRegistro.classList.remove('d-none'); // Admin podría registrar nuevos usuarios (en una versión real)
              if (ausenciaForm) ausenciaForm.classList.remove('d-none'); // Admin puede registrar ausencias
              if (btnExportar) btnExportar.classList.remove('d-none'); // Admin puede exportar
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
             // Re-aplicar filtros actuales después de actualizar los datos
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
        return `${day}/${month}/${year}`;
    }

     // Función para calcular antigüedad en años (puede ser flotante)
      function calcularAntiguedad(fechaIngresoStr) {
          if (!fechaIngresoStr) return 0;
          const fechaIngreso = new Date(fechaIngresoStr);
          const hoy = new Date();
          hoy.setHours(0,0,0,0); // Normalizar hora a medianoche
          fechaIngreso.setHours(0,0,0,0); // Normalizar hora a medianoche

          // Validar que la fecha de ingreso no sea en el futuro
          if (fechaIngreso > hoy) {
              return 0; // La antigüedad es 0 si la fecha es en el futuro
          }

          const diffMs = hoy.getTime() - fechaIngreso.getTime();
          const añosExactos = diffMs / (1000 * 60 * 60 * 24 * 365.25); // Dividir por el número de milisegundos en un año promedio
          return añosExactos > 0 ? añosExactos : 0; // Asegura que no sea negativo
      }


      // Función para calcular antigüedad y formatearla como texto (años, meses, días)
      function calcularAntiguedadTexto(fechaIngresoStr) {
          if (!fechaIngresoStr) return 'Fecha no válida';

          const fechaIngreso = new Date(fechaIngresoStr);
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
          if (partes.length === 0 || dias > 0) {
             // Si no hay partes (menos de un mes o exacto hoy), o si hay días positivos, los añadimos
             if (dias > 0 || partes.length === 0) { // Si no hay años/meses O si hay días > 0
                  partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
             }
          }


          if (partes.length === 0) {
              // Si después de todos los cálculos y ajustes no hay partes, significa que la diferencia es < 1 día.
               // Si la fecha de ingreso es exactamente hoy (sin considerar la hora, que ya normalizamos)
               const fechaIngresoSinHora = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());
               const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
               if (fechaIngresoSinHora.getTime() === hoySinHora.getTime()) {
                    return 'Menos de 1 día'; // Contratado hoy
               }
               return 'Recién ingresado'; // Debería cubrir casos de < 1 día si la fecha no es hoy exactamente
          }


          return partes.join(', ');
      }


    // Función para formatear números grandes con separadores de miles para visualización
    function formatearMiles(numero) {
        if (numero === null || numero === undefined) return '';
         // Convertir a string y usar toLocaleString para formato de miles del idioma local (es-ES)
        return numero.toLocaleString('es-ES');
    }

    // Función para formatear números grandes con separadores de miles para inputs (puede necesitar formato local)
    function formatearMilesInput(numero) {
        if (numero === null || numero === undefined) return '';
        // Usa toLocaleString con opciones para forzar 2 decimales y separadores.
        // Puede que necesites ajustar 'es-ES' si el formato local es diferente (ej: coma para decimales)
        return numero.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }


     // Función para mostrar alertas de Bootstrap
     function mostrarAlerta(mensaje, tipo) {
         const alertaContainer = document.getElementById('alerta-container');
         if (!alertaContainer) {
              console.error("Error: No se encontró el contenedor de alertas con ID 'alerta-container'.");
              alert(mensaje); // Fallback básico si no se encuentra el contenedor
              return;
         }

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
         // Usamos Bootstrap's data-bs-dismiss="alert" que ya maneja el cierre,
         // esto es solo para remover el elemento del DOM después de la animación fade-out
         setTimeout(() => {
             // Encontrar el elemento alerta dentro del contenedor que tenga la clase 'show' (significa que aún no se ha cerrado)
             const currentAlerts = alertaContainer.querySelectorAll('.alert.show');
              currentAlerts.forEach(currentAlert => {
                  // Opcional: Remover del DOM después de un tiempo
                   currentAlert.remove(); // Remover directamente después del tiempo
              });

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

         // Si el cumpleaños de este año ya pasó
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
          if (!dashboardSection || dashboardSection.classList.contains('d-none')) {
              // Si no estamos en el dashboard, no mostramos el detalle de notificaciones,
              // pero sí podríamos mostrar una alerta si hay cumpleaños hoy.
              // La alerta de cumpleaños hoy ya se maneja más abajo si hay próximos.
               return;
          }


          const proximosCumpleanos = empleados
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


          const notificacionesDiv = document.getElementById('cumpleanos-notificaciones'); // El div en el dashboard para esto
          if (!notificacionesDiv) {
              console.error("Error: No se encontró el contenedor de notificaciones de cumpleaños con ID 'cumpleanos-notificaciones'.");
              return; // Salir si no existe el div
          }

          notificacionesDiv.innerHTML = ''; // Limpiar notificaciones anteriores

          if (proximosCumpleanos.length > 0) {
              let notificacionHtml = '<h6 class="card-subtitle mb-2 text-muted">Próximos Cumpleaños (30 días)</h6><ul>';
              proximosCumpleanos.forEach(emp => {
                  notificacionHtml += `<li>${emp.nombres || ''} ${emp.apellidos || ''} - ${emp.diasRestantes === 0 ? 'Hoy' : `en ${emp.diasRestantes} día${emp.diasRestantes !== 1 ? 's' : ''}`} (${formatearFecha(emp.fechaNacimiento)})</li>`;
              });
              notificacionHtml += '</ul>';
              notificacionesDiv.innerHTML = notificacionHtml;
              notificacionesDiv.classList.remove('d-none'); // Mostrar el contenedor de notificaciones

               // Opcional: Mostrar una alerta de Bootstrap si hay cumpleaños hoy (para que aparezca aunque no esté en dashboard)
               if (proximosCumpleanos.some(emp => emp.diasRestantes === 0)) {
                   // Evitar mostrar la alerta múltiples veces si ya está visible
                   const alertaExiste = document.querySelector('.alert-info'); // Busca si ya hay una alerta info visible
                   if (!alertaExiste) {
                        mostrarAlerta('¡Hay cumpleaños hoy! Revisa el Dashboard.', 'info');
                   }
               }

          } else {
              notificacionesDiv.innerHTML = '<p class="card-text text-muted">No hay próximos cumpleaños registrados en los siguientes 30 días.</p>';
               notificacionesDiv.classList.remove('d-none'); // Mostrar el contenedor aunque esté vacío con el mensaje
          }
     }


     // --- Funciones de Restablecimiento de Contraseña (Solo demo) ---
     // NOTA: Esta implementación es SOLO para demostración en el navegador usando localStorage.
     // NO ES SEGURA para una aplicación real y no envía correos electrónicos reales.
     function showResetPasswordModal() {
         if (resetPasswordModal) {
              // Resetear el estado del modal
              const resetEmailInput = document.getElementById('reset-email');
              const resetRequestBtn = document.getElementById('reset-request-btn');
              const resetConfirmBtn = document.getElementById('reset-confirm-btn');
              const resetMessage = document.getElementById('reset-message'); // Asume que tienes un elemento con este ID en el modal para mensajes

              if (resetEmailInput) resetEmailInput.value = ''; // Limpia el campo de email
               if (resetPasswordFields) resetPasswordFields.classList.add('d-none'); // Oculta campos de nueva contraseña
               if (resetRequestBtn) resetRequestBtn.classList.remove('d-none'); // Muestra botón de solicitud
               if (resetConfirmBtn) resetConfirmBtn.classList.add('d-none'); // Oculta botón de confirmación
              if (resetMessage) resetMessage.textContent = 'Ingresa tu correo electrónico registrado para restablecer tu contraseña:'; // Mensaje inicial


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
             const resetRequestBtn = document.getElementById('reset-request-btn');
             const resetConfirmBtn = document.getElementById('reset-confirm-btn');
             if (resetRequestBtn) resetRequestBtn.classList.add('d-none'); // Oculta botón de solicitud
             if (resetConfirmBtn) resetConfirmBtn.classList.remove('d-none'); // Muestra botón de confirmación

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
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    // Listener para el enlace "¿Olvidaste tu contraseña?" (en el login)
     if (forgotPasswordLink) {
         forgotPasswordLink.addEventListener('click', function(e) {
             e.preventDefault();
             showResetPasswordModal(); // Abre el modal
         });
     }

     // Listeners para el formulario dentro del modal de restablecer contraseña
     if (resetPasswordForm) {
         const resetRequestBtn = resetPasswordForm.querySelector('button[type="submit"]'); // El primer submit es solicitar
         const resetConfirmBtn = resetPasswordForm.querySelector('.modal-footer button.btn-primary'); // El de continuar en el footer

         if (resetRequestBtn) {
              // Quitamos listener viejo y ponemos uno nuevo
             const newResetRequestBtn = resetRequestBtn.cloneNode(true);
             resetRequestBtn.parentNode.replaceChild(newResetRequestBtn, resetRequestBtn);
             newResetRequestBtn.addEventListener('click', handleResetPasswordRequest); // Primer paso: solicitar cambio
         }

         if (resetConfirmBtn) {
              // Quitamos listener viejo y ponemos uno nuevo
              const newResetConfirmBtn = resetConfirmBtn.cloneNode(true);
              resetConfirmBtn.parentNode.replaceChild(newResetConfirmBtn, resetConfirmBtn);
             newResetConfirmBtn.addEventListener('click', handleResetPasswordConfirm); // Segundo paso: confirmar nueva contraseña
         }

         // También un listener al submit del formulario para que funcione con Enter
          resetPasswordForm.addEventListener('submit', function(e) {
              e.preventDefault(); // Evita el submit por defecto
              const submitButton = e.submitter; // El botón que disparó el submit

              // Determinar qué botón se presionó (por ID o texto/clase)
              if (submitButton && submitButton.textContent.includes('Continuar')) { // Si el texto es "Continuar"
                  handleResetPasswordConfirm(e); // Llama a la función de confirmar
              } else {
                  handleResetPasswordRequest(e); // Llama a la función de solicitar
              }
          });
     }


    // Listeners de Registro
    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm); // Navbar "Registrarse"
    const registroFormElement = document.getElementById('registroForm'); // Referencia al formulario de registro
     if (registroFormElement) {
         // Event Listener para el formulario de registro (enviar)
         // Quitamos listener viejo y ponemos uno nuevo
         const newRegistroFormElement = registroFormElement.cloneNode(true);
         registroFormElement.parentNode.replaceChild(newRegistroFormElement, registroFormElement);

         newRegistroFormElement.addEventListener('submit', function(e) {
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
     if (btnDashboard) btnDashboard.addEventListener('click', showDashboard);
     if (btnEmpleados) btnEmpleados.addEventListener('click', showEmpleadosList);
     if (btnCumpleanos) btnCumpleanos.addEventListener('click', showCumpleanosList);
     if (btnAusencias) btnAusencias.addEventListener('click', showAusenciasList);


    // Listeners de botones de las secciones (Dashboard, Lista Empleados)
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm()); // Botón "Agregar Nuevo Empleado" en Dashboard
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm()); // Botón "Nuevo Empleado" en Lista de Empleados
     if (btnVerEmpleados) btnVerEmpleados.addEventListener('click', showEmpleadosList); // Botón "Ver Empleados" en Dashboard
     if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV); // Botón Exportar

    // Listener del formulario de Empleado (Guardar/Actualizar)
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
         // Quitamos listener viejo y ponemos uno nuevo
         const newEmpleadoFormElement = empleadoFormElement.cloneNode(true);
         empleadoFormElement.parentNode.replaceChild(newEmpleadoFormElement, empleadoFormElement);
         newEmpleadoFormElement.addEventListener('submit', handleEmpleadoFormSubmit);
    }


    // Listener del botón Cancelar en el formulario de empleado
    if (btnCancelar) btnCancelar.addEventListener('click', showEmpleadosList); // Vuelve a la lista

    // Listener para el enlace "Inicio" en el breadcrumb
     if (breadcrumbHomeLink) {
         // Quitamos listeners viejos y ponemos uno nuevo para evitar duplicados
          const newBreadcrumbHomeLink = breadcrumbHomeLink.cloneNode(true);
          breadcrumbHomeLink.parentNode.replaceChild(newBreadcrumbHomeLink, breadcrumbHomeLink);
          newBreadcrumbHomeLink.addEventListener('click', function(e) {
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
         // Quitamos listeners viejos y ponemos uno nuevo
         const newButton = button.cloneNode(true);
         button.parentNode.replaceChild(newButton, button);

         newButton.addEventListener('click', function() {
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
     });
     // --- Fin Funcionalidad mostrar/ocultar contraseña ---


    // --- Inicialización ---
    // Cargar datos iniciales (empleados, ausencias, usuarios)
    // Los usuarios y empleados/ausencias ya se cargan/inicializan al inicio del script

    // Redirigir a la página de login al cargar la aplicación
    showLoginForm();
}); // Fin del DOMContentLoaded
