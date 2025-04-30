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
    const loginForm = document.getElementById('login-form'); // <-- CORREGIDO a 'login-form'
    const registroForm = document.getElementById('registro-form'); // <-- CORREGIDO a 'registro-form'
    const empleadosListSection = document.getElementById('empleados-list'); // Esta está bien
    const empleadoFormSection = document.getElementById('empleado-form'); // Esta está bien
    const empleadoDetalleSection = document.getElementById('empleado-detalle'); // Esta está bien
    const cumpleanosListSection = document.getElementById('cumpleanos-list'); // Esta está bien
    const dashboardSection = document.getElementById('dashboard'); // Esta está bien
    const ausenciasListSection = document.getElementById('ausencias-list'); // Esta está bien

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
              // No hay botones extra específicos del dashboard por ahora
         } else if (empleadosListSection && !empleadosListSection.classList.contains('d-none')) { // Si la lista de empleados está visible
              mostrarElements([btnNuevoEmpleado, btnNuevoEmpleadoLista, btnExportarCSV]); // Muestra botones de añadir y exportar
         } else if (empleadoFormSection && !empleadoFormSection.classList.contains('d-none')) { // Si el formulario de empleado está visible
             mostrarElements([btnCancelar]); // Muestra el botón cancelar
         } else if (empleadoDetalleSection && !empleadoDetalleSection.classList.contains('d-none')) { // Si el detalle de empleado está visible
              mostrarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]); // Muestra botones editar/volver del detalle
         }


         // Ocultar botones de autenticación si existen
         ocultarElements([btnLogin, btnRegistro]);

         // Control de visibilidad de elementos solo para Admin si aplica
         if (usuarioActual && usuarioActual.rol !== 'admin') {
             // Ejemplo: Ocultar sección de usuarios en dashboard si existe
             const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
             if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
             // Ocultar botón de registro en el navbar si existe
             if (btnRegistro) btnRegistro.classList.add('d-none');
             // Ocultar columna de salario en detalle de empleado (ya manejado en render)
             // Ocultar botones de eliminar empleado/ausencia si el rol no es admin
             // Esto se maneja mejor en el renderizado o en los event listeners si es necesario
         } else {
              // Si es admin, asegurarse de que estén visibles si existen
              const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
              if (dashboardUsuariosCard) dashboardUsuariosCard.classList.remove('d-none');
              if (btnRegistro) btnRegistro.classList.remove('d-none'); // Admin podría registrar nuevos usuarios admin (en una versión real)
         }

         // Ocultar el breadcrumb principal al autenticar para que solo aparezca en secciones internas
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none'); // Se mostrará de nuevo en las funciones show... adecuadas

     }


    function ocultarElementosAutenticados() {
        // Ocultar todos los botones de navegación principales si existen
        ocultarElements([btnLogout, btnDashboard, btnEmpleados, btnCumpleanos, btnAusencias, btnNuevoEmpleado, btnNuevoEmpleadoLista, btnVerEmpleados, btnCancelar, btnExportarCSV]);

         // Ocultar botones específicos del detalle si existen
         ocultarElements([document.getElementById('btn-editar-desde-detalle'), document.getElementById('btn-volver-desde-detalle')]);

        // Mostrar botones de autenticación si existen
        mostrarElements([btnLogin, btnRegistro]);

         // Ocultar el breadcrumb principal
          const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"]');
          if (breadcrumbNav) breadcrumbNav.classList.add('d-none');

          // Asegurarse de que la tarjeta de usuarios en el dashboard se oculte si no es admin al desloguear
           const dashboardUsuariosCard = document.getElementById('dashboard-usuarios-card');
           if (dashboardUsuariosCard) dashboardUsuariosCard.classList.add('d-none');
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
             // Re-aplicar filtros después de actualizar los datos
             if (busquedaEmpleadosInput) empleadosTable.search(busquedaEmpleadosInput.value).draw();
             if (filtroDepartamentoSelect) {
                  const searchValue = filtroDepartamentoSelect.value;
                  empleadosTable.column(6).search(searchValue ? '^'+searchValue+'$' : '', true, false).draw();
             }
             if (filtroAntiguedadSelect) empleadosTable.draw(); // Trigger custom filter redraw
        }
         actualizarFiltroDepartamentos(); // Actualiza el dropdown de departamentos
         notificarCumpleanos(); // Revisa y actualiza las notificaciones de cumpleaños
         showDashboard(); // Actualiza estadísticas del dashboard
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
        const tipoContratoInput = document.getElementById('tipoContrato');
        const fechaNacimientoInput = document.getElementById('fechaNacimiento');
        const fechaIngresoInput = document.getElementById('fechaIngreso');
        const salarioInput = document.getElementById('salario');
        const notasInput = document.getElementById('notas');
        const contactoEmergenciaNombreInput = document.getElementById('contactoEmergenciaNombre');
        const contactoEmergenciaTelefonoInput = document.getElementById('contactoEmergenciaTelefono');
        const contactoEmergenciaParentescoInput = document.getElementById('contactoEmergenciaParentesco');

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
            salario: salarioInput ? parseFloat(salarioInput.value) : 0, // Convertir a número
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
         const cedulaExiste = empleados.some(emp => emp.cedula === nuevoEmpleado.cedula && emp.id !== nuevoEmpleado.id);
         if (cedulaExiste) {
              mostrarAlerta('La cédula ingresada ya existe para otro empleado.', 'warning');
              return;
         }


        if (id) {
            // Editar empleado existente
            empleados = empleados.map(emp => emp.id == id ? nuevoEmpleado : emp);
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
        const empleado = empleados.find(emp => emp.id == id);
        const form = document.getElementById('empleadoForm');
        if (empleado && form) {
            document.getElementById('nombres').value = empleado.nombres || '';
            document.getElementById('apellidos').value = empleado.apellidos || '';
            document.getElementById('cedula').value = empleado.cedula || '';
            document.getElementById('telefono').value = empleado.telefono || '';
            document.getElementById('email-empleado').value = empleado.email || ''; // Usar el ID correcto
            document.getElementById('cargo').value = empleado.cargo || '';
            document.getElementById('departamento').value = empleado.departamento || '';
            document.getElementById('tipoContrato').value = empleado.tipoContrato || '';
            document.getElementById('fechaNacimiento').value = empleado.fechaNacimiento || '';
            document.getElementById('fechaIngreso').value = empleado.fechaIngreso || '';
            document.getElementById('salario').value = empleado.salario || ''; // Mostrar como número
            document.getElementById('notas').value = empleado.notas || '';
             document.getElementById('contactoEmergenciaNombre').value = empleado.contactoEmergenciaNombre || '';
             document.getElementById('contactoEmergenciaTelefono').value = empleado.contactoEmergenciaTelefono || '';
             document.getElementById('contactoEmergenciaParentesco').value = empleado.contactoEmergenciaParentesco || '';
        }
    }

     function editarEmpleado(id) {
         showEmpleadoForm(id); // Muestra el formulario y carga los datos
     }

    function eliminarEmpleado(id) {
        // Pide confirmación antes de eliminar
        if (confirm('¿Está seguro de que desea eliminar este empleado? Esta acción es irreversible.')) {
            empleados = empleados.filter(emp => emp.id != id); // Filtra y elimina el empleado
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
         let años = hoy.getFullYear() - fechaIngreso.getFullYear();
         const mesDiff = hoy.getMonth() - fechaIngreso.getMonth();
         const diaDiff = hoy.getDate() - fechaIngreso.getDate();

         // Ajustar años si el mes de hoy es menor o si es el mismo mes pero el día de hoy es menor
         if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
             años--;
         }

         // Cálculo más preciso (puede ser flotante)
         const diffMs = hoy.getTime() - fechaIngreso.getTime();
         const añosExactos = diffMs / (1000 * 60 * 60 * 24 * 365.25); // Dividir por el número de milisegundos en un año promedio
         return añosExactos > 0 ? añosExactos : 0; // Asegura que no sea negativo si la fecha es en el futuro (error)
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
         if (dias > 0) partes.push(`${dias} día${dias > 1 ? 's' : ''}`);

         if (partes.length === 0) {
              // Si la fecha es hoy, la antigüedad es 0 días
              // O si es un empleado con antigüedad de menos de un día (aunque improbable con este formato)
              // Podríamos decir "Menos de un mes" o "Menos de un año" si años/meses son 0 pero hay días.
              // Simplificamos: si no hay años, meses ni días positivos calculados así, asumimos es muy reciente o el mismo día.
              // La lógica de DataTables que usa `calcularAntiguedad` (flotante) es más precisa para ordenar/filtrar rangos.
              // Para el texto, podemos redondear un poco o usar una frase genérica si es < 1 mes.
              // Si años, meses, días calculados > 0 (después de ajustes), mostramos el texto.
              // Si todo es 0, significa que la diferencia es menos de un día, o exactamente 0 si fechaIngreso == hoy.
              // Si la fecha de ingreso es exactamente hoy:
              const fechaIngresoSinHora = new Date(fechaIngreso.getFullYear(), fechaIngreso.getMonth(), fechaIngreso.getDate());
              const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
              if (fechaIngresoSinHora.getTime() === hoySinHora.getTime()) {
                   return 'Menos de 1 día'; // Contratado hoy
              } else {
                   // Esto cubre casos donde la diferencia es muy pequeña o hubo algún error lógico,
                   // pero según el cálculo paso a paso, debería dar días > 0 si la fecha es anterior a hoy.
                   // Si llegamos aquí, podría ser un caso de antigüedad < 1 mes pero > 0 días.
                   // Para simplicidad, si no hay años ni meses, mostramos los días si > 0.
                   // Esta parte ya está cubierta por el `if (dias > 0) partes.push(...)`.
                   // Si partes está vacío, significa años, meses y días son 0.
                   return 'Recién ingresado'; // Si no calculó años, meses ni días significativos.
              }
         }


         return partes.join(', ');
     }


    // Función para formatear números grandes con separadores de miles
    function formatearMiles(numero) {
        if (numero === null || numero === undefined) return '';
         // Convertir a string y usar toLocaleString para formato de miles del idioma local (es-ES)
        return numero.toLocaleString('es-ES');
    }


     // Función para mostrar alertas de Bootstrap
     function mostrarAlerta(mensaje, tipo) {
         const alertaContainer = document.getElementById('alerta-container');
         if (!alertaContainer) return;

         // Crear el elemento de alerta
         const alerta = document.createElement('div');
         alerta.classList.add('alert', `alert-${tipo}`, 'alert-dismissible', 'fade', 'show', 'mt-3'); // Añade mt-3 para espacio
         alerta.setAttribute('role', 'alert');
         alerta.innerHTML = `
             ${mensaje}
             <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
         `;

         // Añadir la alerta al contenedor
         alertaContainer.appendChild(alerta);

         // Opcional: auto-cerrar la alerta después de unos segundos
         setTimeout(() => {
             if (alerta) { // Comprobar si el elemento aún existe
                 const bsAlert = new bootstrap.Alert(alerta);
                 bsAlert.close();
             }
         }, 5000); // 5 segundos
     }


     // Función para actualizar el dropdown de departamentos con los departamentos existentes en los empleados
     function actualizarFiltroDepartamentos() {
         if (!filtroDepartamentoSelect) return;

         // Obtener departamentos únicos de los empleados
         const departamentosUnicos = [...new Set(empleados.map(emp => emp.departamento).filter(dep => dep))].sort(); // Obtener únicos, filtrar vacíos y ordenar

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
             // Opcional: Si DataTables ya existe, aplicar el filtro "Todos" inmediatamente
             // if (empleadosTable) empleadosTable.column(6).search('', true, false).draw();
         }
     }

     // Función para calcular cuántos días faltan para el cumpleaños (considerando el próximo cumpleaños)
     function calcularDiasParaCumpleanos(fechaNacimientoStr) {
         if (!fechaNacimientoStr) return -1; // Retorna -1 si la fecha no es válida

         const fechaNacimiento = new Date(fechaNacimientoStr);
         const hoy = new Date();
         hoy.setHours(0, 0, 0, 0); // Poner la hora a 0 para comparación solo de fecha

         const cumpleanosEsteAño = new Date(hoy.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate());
         cumpleanosEsteAño.setHours(0, 0, 0, 0);

         const unDia = 24 * 60 * 60 * 1000; // Milisegundos en un día

         // Si el cumpleaños de este año ya pasó o es hoy
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
          if (!isAuthenticated || !usuarioActual) return; // Solo para usuarios autenticados

          const proximosCumpleanos = empleados
              .filter(emp => emp.fechaNacimiento) // Solo empleados con fecha de nacimiento válida
              .map(emp => {
                  const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                  // Incluir cumpleaños hoy o en los próximos 7 días
                  if (dias >= 0 && dias <= 7) {
                      return { ...emp, diasRestantes: dias };
                  }
                  return null;
              })
              .filter(emp => emp !== null)
              .sort((a, b) => a.diasRestantes - b.diasRestantes); // Ordenar por los días restantes

          const notificacionesDiv = document.getElementById('cumpleanos-notificaciones'); // Un div en el dashboard para esto
          if (!notificacionesDiv) return; // Salir si no existe el div

          notificacionesDiv.innerHTML = ''; // Limpiar notificaciones anteriores

          if (proximosCumpleanos.length > 0) {
              let notificacionHtml = '<h6 class="card-subtitle mb-2 text-muted">Próximos Cumpleaños (7 días)</h6><ul>';
              proximosCumpleanos.forEach(emp => {
                  notificacionHtml += `<li>${emp.nombres || ''} ${emp.apellidos || ''} - ${emp.diasRestantes === 0 ? 'Hoy' : `en ${emp.diasRestantes} días`} (${formatearFecha(emp.fechaNacimiento)})</li>`;
              });
              notificacionHtml += '</ul>';
              notificacionesDiv.innerHTML = notificacionHtml;
               // Opcional: Mostrar una alerta si hay cumpleaños hoy
               if (proximosCumpleanos.some(emp => emp.diasRestantes === 0)) {
                   mostrarAlerta('¡Hay cumpleaños hoy! Revisa el Dashboard.', 'info');
               }
          } else {
              notificacionesDiv.innerHTML = '<p class="card-text text-muted">No hay próximos cumpleaños en los siguientes 7 días.</p>';
          }
     }


     // --- Funciones de Restablecimiento de Contraseña (Solo demo) ---
     function showResetPasswordModal() {
         if (resetPasswordModal) {
              if (resetPasswordFields) resetPasswordFields.classList.add('d-none'); // Oculta campos de nueva contraseña inicialmente
              const resetEmailInput = document.getElementById('reset-email');
              if (resetEmailInput) resetEmailInput.value = ''; // Limpia el campo de email
              resetPasswordModal.show();
         }
     }

     function handleResetPasswordRequest(e) {
         e.preventDefault();
         const resetEmailInput = document.getElementById('reset-email');
         const email = resetEmailInput ? resetEmailInput.value.trim() : '';

         const usuario = usuariosPermitidos.find(u => u.email === email);

         if (usuario) {
             emailToReset = email; // Guarda el email para el segundo paso
             if (resetPasswordFields) resetPasswordFields.classList.remove('d-none'); // Muestra campos de nueva contraseña
             const resetMessage = document.getElementById('reset-message');
             if (resetMessage) resetMessage.textContent = 'Correo encontrado. Ingresa tu nueva contraseña:';
             const resetRequestBtn = document.getElementById('reset-request-btn');
             const resetConfirmBtn = document.getElementById('reset-confirm-btn');
             if (resetRequestBtn) resetRequestBtn.classList.add('d-none'); // Oculta botón de solicitud
             if (resetConfirmBtn) resetConfirmBtn.classList.remove('d-none'); // Muestra botón de confirmación

         } else {
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
              return;
          }

          if (newPassword.length < 6) { // Validación básica de longitud
               mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'warning');
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
          // Volver al estado inicial del modal si se vuelve a abrir
           const resetMessage = document.getElementById('reset-message');
           if (resetMessage) resetMessage.textContent = 'Ingresa tu correo electrónico registrado para restablecer tu contraseña:';
           const resetRequestBtn = document.getElementById('reset-request-btn');
           const resetConfirmBtn = document.getElementById('reset-confirm-btn');
           if (resetRequestBtn) resetRequestBtn.classList.remove('d-none');
           if (resetConfirmBtn) resetConfirmBtn.classList.add('d-none');
           if (resetPasswordFields) resetPasswordFields.classList.add('d-none'); // Oculta campos de nueva contraseña
           if (document.getElementById('reset-email')) document.getElementById('reset-email').value = '';
           if (newPasswordInput) newPasswordInput.value = '';
           if (confirmPasswordInput) confirmPasswordInput.value = '';

      }


      // --- Funciones de Exportación ---
      function exportarEmpleadosCSV() {
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
               usuarioActual && usuarioActual.rol === 'admin' ? emp.salario : '****', // Exportar salario solo para admin
              `"${(emp.notas || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaNombre || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaTelefono || '').replace(/"/g, '""')}"`,
              `"${(emp.contactoEmergenciaParentesco || '').replace(/"/g, '""')}"`,
          ]);

          // Unir cabeceras y filas con comas y saltos de línea
          const csvContent = [
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

          // Limpiar URL y remover el enlace
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          mostrarAlerta('Datos de empleados exportados a CSV.', 'success');
      }


    // --- Event Listeners ---
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    if (btnRegistro) btnRegistro.addEventListener('click', showRegistroForm); // Navbar "Registrarse"
    const registroFormElement = document.getElementById('registroForm'); // Referencia al formulario de registro
     if (registroFormElement) {
         // Event Listener para el formulario de registro (enviar)
         registroFormElement.addEventListener('submit', function(e) {
             e.preventDefault();
             const newEmailInput = document.getElementById('new-email');
             const newPasswordInput = document.getElementById('new-password-reg'); // Cambiado ID para no confundir
             const confirmPasswordInput = document.getElementById('confirm-password-reg'); // Cambiado ID
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


    // Listeners de botones de la sección Empleados
    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', () => showEmpleadoForm()); // Botón "Agregar Nuevo Empleado" arriba de la tabla
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.addEventListener('click', () => showEmpleadoForm()); // Botón flotante "+"
     if (btnExportarCSV) btnExportarCSV.addEventListener('click', exportarEmpleadosCSV); // Botón Exportar

    // Listener del formulario de Empleado (Guardar/Actualizar)
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) empleadoFormElement.addEventListener('submit', handleEmpleadoFormSubmit);

    // Listener del botón Cancelar en el formulario de empleado
    if (btnCancelar) btnCancelar.addEventListener('click', showEmpleadosList); // Vuelve a la lista


    // Listener para el enlace "¿Olvidaste tu contraseña?"
     if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', function(e) {
         e.preventDefault();
         showResetPasswordModal();
     });

     // Listeners para el formulario dentro del modal de restablecer contraseña
     if (resetPasswordForm) {
         const resetRequestBtn = document.getElementById('reset-request-btn');
         const resetConfirmBtn = document.getElementById('reset-confirm-btn');
         if (resetRequestBtn) resetRequestBtn.addEventListener('click', handleResetPasswordRequest);
         if (resetConfirmBtn) resetConfirmBtn.addEventListener('click', handleResetPasswordConfirm);
     }


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


    // --- Inicialización ---
    // Cargar datos iniciales (empleados, ausencias)
    // cargarEmpleadosLocal(); // Ya se cargan al inicio del script

    // Redirigir a la página de login al cargar la aplicación
    showLoginForm();
}); // Fin del DOMContentLoaded
