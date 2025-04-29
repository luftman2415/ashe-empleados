// app.js - Portal RRHH ASHE
document.addEventListener('DOMContentLoaded', function() {
    // Usuarios permitidos (solo admin por defecto)
    let usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' }
    ];

    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
    let ausencias = JSON.parse(localStorage.getItem('ausencias')) || [];
    let usuarioActual = null;

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const empleadosList = document.getElementById('empleados-list');
    const empleadoForm = document.getElementById('empleado-form');
    const empleadoDetalle = document.getElementById('empleado-detalle');
    const cumpleanosList = document.getElementById('cumpleanos-list');
    const dashboard = document.getElementById('dashboard');
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
    const busquedaEmpleados = document.getElementById('busqueda-empleados');
    const filtroDepartamento = document.getElementById('filtro-departamento');
    const filtroAntiguedad = document.getElementById('filtro-antiguedad');
    const breadcrumbSection = document.getElementById('breadcrumb-section');

    // Modal de restablecer contraseña
    const resetPasswordModal = new bootstrap.Modal(document.getElementById('reset-password-modal'));
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetPasswordFields = document.getElementById('reset-password-fields');
    let emailToReset = '';

    // Estado de autenticación
    let isAuthenticated = false;

    // Inicializar DataTables
    let empleadosTable = null;

    // Toggle de contraseña
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.getElementById(this.getAttribute('data-target'));
            if (input.type === 'password') {
                input.type = 'text';
                this.querySelector('i').classList.remove('bi-eye');
                this.querySelector('i').classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                this.querySelector('i').classList.remove('bi-eye-slash');
                this.querySelector('i').classList.add('bi-eye');
            }
        });
    });

    // Event Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registroForm) registroForm.addEventListener('submit', handleRegistro);
    if (btnNuevoEmpleado) btnNuevoEmpleado.onclick = showEmpleadoForm;
    if (btnNuevoEmpleadoLista) btnNuevoEmpleadoLista.onclick = showEmpleadoForm;
    if (btnVerEmpleados) btnVerEmpleados.onclick = showEmpleadosList;
    if (btnCancelar) btnCancelar.onclick = cancelarFormulario;
    if (btnRegistro) btnRegistro.onclick = showRegistroForm;
    if (btnCancelarRegistro) btnCancelarRegistro.onclick = hideRegistroForm;
    if (btnLogin) btnLogin.onclick = function() {
        limpiarLogin();
        showLoginForm();
    };
    if (btnLogout) btnLogout.onclick = handleLogout;
    if (btnDashboard) btnDashboard.onclick = showDashboard;
    if (btnEmpleados) btnEmpleados.onclick = showEmpleadosList;
    if (btnCumpleanos) btnCumpleanos.onclick = showCumpleanosList;
    if (btnAusencias) btnAusencias.onclick = showAusenciasList;
    if (btnExportarCSV) btnExportarCSV.onclick = exportarEmpleadosCSV;
    if (filtroDepartamento) filtroDepartamento.onchange = filtrarEmpleados;
    if (filtroAntiguedad) filtroAntiguedad.onchange = filtrarEmpleados;

    // Restablecer contraseña
    document.getElementById('forgot-password-link').onclick = function(e) {
        e.preventDefault();
        resetPasswordForm.reset();
        resetPasswordFields.classList.add('d-none');
        resetPasswordModal.show();
    };

    resetPasswordForm.onsubmit = function(e) {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        
        if (!resetPasswordFields.classList.contains('d-none')) {
            // Cambiar contraseña
            const newPassword = document.getElementById('reset-password').value;
            const confirmPassword = document.getElementById('reset-password-confirm').value;

            if (newPassword !== confirmPassword) {
                mostrarAlerta('Las contraseñas no coinciden', 'danger');
                return;
            }

            const userIndex = usuariosPermitidos.findIndex(u => u.email === emailToReset);
            if (userIndex !== -1) {
                usuariosPermitidos[userIndex].password = newPassword;
                localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
                mostrarAlerta('Contraseña restablecida con éxito', 'success');
                resetPasswordModal.hide();
            }
        } else {
            // Verificar email
            const usuario = usuariosPermitidos.find(u => u.email === email);
            if (usuario) {
                emailToReset = email;
                resetPasswordFields.classList.remove('d-none');
                document.getElementById('reset-email').readOnly = true;
            } else {
                mostrarAlerta('El correo no está registrado', 'danger');
            }
        }
    };

    // Funciones de registro
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

        usuariosPermitidos.push({ email, password, rol: 'rrhh' });
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
        mostrarAlerta('Usuario registrado exitosamente', 'success');
        hideRegistroForm();
        showLoginForm();
    }

    function showRegistroForm() {
        document.getElementById('registro-form').classList.remove('d-none');
        ocultarTodo(['login-form', 'empleados-list', 'empleado-form', 'cumpleanos-list', 
                     'dashboard', 'ausencias-list', 'empleado-detalle']);
        actualizarBreadcrumb('Registro');
    }

    function hideRegistroForm() {
        document.getElementById('registro-form').classList.add('d-none');
        showLoginForm();
    }

    // Funciones de autenticación
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const usuario = usuariosPermitidos.find(u => u.email === email && u.password === password);

        if (usuario) {
            isAuthenticated = true;
            usuarioActual = usuario;
            mostrarElementosAutenticados();
            showDashboard();
            notificarCumpleanos();
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

    function showLoginForm() {
        document.getElementById('login-form').classList.remove('d-none');
        ocultarTodo(['registro-form', 'empleados-list', 'empleado-form', 'cumpleanos-list', 
                     'dashboard', 'ausencias-list', 'empleado-detalle']);
        ocultarElementosAutenticados();
        actualizarBreadcrumb('Inicio de Sesión');
        limpiarLogin();
    }

    function limpiarLogin() {
        if (loginForm) loginForm.reset();
    }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        ocultarElementosAutenticados();
        showLoginForm();
        mostrarAlerta('Sesión cerrada correctamente', 'success');
    }

    function mostrarElementosAutenticados() {
        if (btnLogout) btnLogout.classList.remove('d-none');
        if (btnLogin) btnLogin.classList.add('d-none');
        if (btnRegistro) btnRegistro.classList.add('d-none');
        if (btnDashboard) btnDashboard.classList.remove('d-none');
        if (btnEmpleados) btnEmpleados.classList.remove('d-none');
        if (btnCumpleanos) btnCumpleanos.classList.remove('d-none');
        if (btnAusencias) btnAusencias.classList.remove('d-none');
    }

    function ocultarElementosAutenticados() {
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnLogin) btnLogin.classList.remove('d-none');
        if (btnRegistro) btnRegistro.classList.remove('d-none');
        if (btnDashboard) btnDashboard.classList.add('d-none');
        if (btnEmpleados) btnEmpleados.classList.add('d-none');
        if (btnCumpleanos) btnCumpleanos.classList.add('d-none');
        if (btnAusencias) btnAusencias.classList.add('d-none');
    }
    // Dashboard
    function showDashboard() {
        dashboard.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form', 
                     'cumpleanos-list', 'ausencias-list', 'empleado-detalle']);
        actualizarBreadcrumb('Dashboard');

        // Actualizar estadísticas
        document.getElementById('dashboard-total-empleados').textContent = empleados.length;
        document.getElementById('dashboard-usuarios').textContent = usuariosPermitidos.length;

        // Próximos cumpleaños
        const proximosCumpleanos = empleados.filter(emp => {
            if (!emp.fechaNacimiento) return false;
            const diasRestantes = calcularDiasParaCumpleanos(emp.fechaNacimiento);
            return diasRestantes <= 30;
        });
        document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanos.length;
    }

    // Funciones de empleados
    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        empleadosList.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleado-form', 'cumpleanos-list', 
                     'dashboard', 'ausencias-list', 'empleado-detalle']);
        actualizarBreadcrumb('Lista de Empleados');
        actualizarFiltroDepartamentos();
        renderEmpleados();
    }

    function showEmpleadoForm(editId = null) {
        const form = document.getElementById('empleadoForm');
        if (form) {
            form.reset();
            if (editId) {
                form.setAttribute('data-edit-id', editId);
                cargarDatosEmpleado(editId);
            } else {
                form.removeAttribute('data-edit-id');
            }
        }
        empleadoForm.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'cumpleanos-list', 
                     'dashboard', 'ausencias-list', 'empleado-detalle']);
        actualizarBreadcrumb(editId ? 'Editar Empleado' : 'Nuevo Empleado');
    }

    function renderEmpleados() {
        const tbody = document.getElementById('empleados-table-body');
        tbody.innerHTML = '';

        let empleadosFiltrados = empleados;

        // Aplicar filtros
        const departamento = filtroDepartamento.value;
        const antiguedad = filtroAntiguedad.value;
        const busqueda = busquedaEmpleados.value.toLowerCase();

        if (departamento) {
            empleadosFiltrados = empleadosFiltrados.filter(emp => emp.departamento === departamento);
        }

        if (antiguedad) {
            const [min, max] = antiguedad.split('-');
            empleadosFiltrados = empleadosFiltrados.filter(emp => {
                const años = calcularAntiguedad(emp.fechaIngreso);
                if (max === '+') return años > parseInt(min);
                return años >= parseInt(min) && años <= parseInt(max);
            });
        }

        if (busqueda) {
            empleadosFiltrados = empleadosFiltrados.filter(emp => 
                emp.nombres.toLowerCase().includes(busqueda) ||
                emp.apellidos.toLowerCase().includes(busqueda) ||
                emp.cedula.toLowerCase().includes(busqueda) ||
                (emp.cargo || '').toLowerCase().includes(busqueda) ||
                (emp.departamento || '').toLowerCase().includes(busqueda)
            );
        }

        empleadosFiltrados.forEach(empleado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" class="ver-empleado" data-id="${empleado.id}">${empleado.nombres}</a></td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.cedula}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.email}</td>
                <td>${empleado.cargo || ''}</td>
                <td>${empleado.departamento || ''}</td>
                <td>${calcularAntiguedadTexto(empleado.fechaIngreso)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editarEmpleado(${empleado.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado(${empleado.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos para ver detalle
        document.querySelectorAll('.ver-empleado').forEach(link => {
            link.onclick = function(e) {
                e.preventDefault();
                mostrarDetalleEmpleado(this.getAttribute('data-id'));
            };
        });
    }

    function mostrarDetalleEmpleado(id) {
        const empleado = empleados.find(e => e.id == id);
        if (!empleado) return;

        const detalleBody = document.getElementById('empleado-detalle-body');
        detalleBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h4>${empleado.nombres} ${empleado.apellidos}</h4>
                    <p><strong>Cédula:</strong> ${empleado.cedula}</p>
                    <p><strong>Teléfono:</strong> ${empleado.telefono}</p>
                    <p><strong>Email:</strong> ${empleado.email}</p>
                    <p><strong>Cargo:</strong> ${empleado.cargo || ''}</p>
                    <p><strong>Departamento:</strong> ${empleado.departamento || ''}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Tipo de Contrato:</strong> ${empleado.tipoContrato || ''}</p>
                    <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(empleado.fechaNacimiento)}</p>
                    <p><strong>Fecha de Ingreso:</strong> ${formatearFecha(empleado.fechaIngreso)}</p>
                    <p><strong>Antigüedad:</strong> ${calcularAntiguedadTexto(empleado.fechaIngreso)}</p>
                    <p><strong>Salario:</strong> ${usuarioActual.rol === 'admin' ? formatearMiles(empleado.salario) : '****'}</p>
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

        empleadoDetalle.classList.remove('d-none');
        ocultarTodo(['login-form', 'registro-form', 'empleados-list', 'empleado-form', 
                     'cumpleanos-list', 'dashboard', 'ausencias-list']);
        actualizarBreadcrumb('Detalle de Empleado');
    }

    function editarEmpleado(id) {
        showEmpleadoForm(id);
    }

    function eliminarEmpleado(id) {
        if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
            empleados = empleados.filter(e => e.id != id);
            localStorage.setItem('empleados', JSON.stringify(empleados));
            mostrarAlerta('Empleado eliminado correctamente', 'success');
            renderEmpleados();
        }
    }

    function cargarDatosEmpleado(id) {
        const empleado = empleados.find(e => e.id == id);
        if (empleado) {
            Object.keys(empleado).forEach(key => {
                const elemento = document.getElementById(key);
                if (elemento && key !== 'id') {
                    elemento.value = empleado[key];
                }
            });
        }
    }

    // Guardar empleado
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
        empleadoFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const editId = this.getAttribute('data-edit-id');
            
            const empleado = {
                id: editId ? parseInt(editId) : Date.now(),
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                cedula: document.getElementById('cedula').value,
                telefono: document.getElementById('telefono').value,
                email: document.getElementById('email-empleado').value,
                cargo: document.getElementById('cargo').value,
                departamento: document.getElementById('departamento').value,
                tipoContrato: document.getElementById('tipo-contrato').value,
                salario: limpiarMiles(document.getElementById('salario').value),
                fechaNacimiento: document.getElementById('fecha-nacimiento').value,
                fechaIngreso: document.getElementById('fecha-ingreso').value,
                notas: document.getElementById('notas').value,
                contactoEmergenciaNombre: document.getElementById('contacto-emergencia-nombre').value,
                contactoEmergenciaTelefono: document.getElementById('contacto-emergencia-telefono').value,
                contactoEmergenciaParentesco: document.getElementById('contacto-emergencia-parentesco').value
            };

            if (editId) {
                const index = empleados.findIndex(e => e.id == editId);
                if (index !== -1) {
                    empleados[index] = empleado;
                    mostrarAlerta('Empleado actualizado correctamente', 'success');
                }
            } else {
                empleados.push(empleado);
                mostrarAlerta('Empleado guardado correctamente', 'success');
            }

            localStorage.setItem('empleados', JSON.stringify(empleados));
            showEmpleadosList();
        });
    }

    // Funciones de utilidad
    function ocultarTodo(ids) {
        ids.forEach(id => document.getElementById(id).classList.add('d-none'));
    }

    function actualizarBreadcrumb(seccion) {
        if (breadcrumbSection) {
            breadcrumbSection.textContent = seccion;
        }
    }

    function calcularAntiguedad(fechaIngreso) {
        if (!fechaIngreso) return 0;
        const inicio = new Date(fechaIngreso);
        const hoy = new Date();
        return Math.floor((hoy - inicio) / (365.25 * 24 * 60 * 60 * 1000));
    }

    function calcularAntiguedadTexto(fechaIngreso) {
        if (!fechaIngreso) return 'No registrada';
        const años = calcularAntiguedad(fechaIngreso);
        if (años < 1) {
            const meses = Math.floor((new Date() - new Date(fechaIngreso)) / (30.44 * 24 * 60 * 60 * 1000));
            return meses === 1 ? '1 mes' : `${meses} meses`;
        }
        return años === 1 ? '1 año' : `${años} años`;
    }

    function calcularDiasParaCumpleanos(fechaNacimiento) {
        if (!fechaNacimiento) return Infinity;
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento);
        cumple.setFullYear(hoy.getFullYear());
        if (cumple < hoy) {
            cumple.setFullYear(hoy.getFullYear() + 1);
        }
        return Math.ceil((cumple - hoy) / (24 * 60 * 60 * 1000));
    }

    function formatearFecha(fecha) {
        if (!fecha) return 'No registrada';
        return new Date(fecha).toLocaleDateString();
    }

    function formatearMiles(valor) {
        if (!valor) return '';
        return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function limpiarMiles(valor) {
        return valor ? valor.replace(/\./g, '') : '';
    }

    function mostrarAlerta(mensaje, tipo = 'success') {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alerta.style.zIndex = '9999';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alerta);
        setTimeout(() => alerta.remove(), 3000);
    }

    function actualizarFiltroDepartamentos() {
        const departamentos = [...new Set(empleados.map(emp => emp.departamento).filter(Boolean))];
        filtroDepartamento.innerHTML = '<option value="">Todos los departamentos</option>';
        departamentos.forEach(dep => {
            filtroDepartamento.innerHTML += `<option value="${dep}">${dep}</option>`;
        });
    }

    function cancelarFormulario() {
        showEmpleadosList();
    }

    // Notificaciones de cumpleaños
    function notificarCumpleanos() {
        empleados.forEach(emp => {
            if (emp.fechaNacimiento) {
                const dias = calcularDiasParaCumpleanos(emp.fechaNacimiento);
                if (dias === 1) {
                    mostrarAlerta(`¡Mañana es el cumpleaños de ${emp.nombres} ${emp.apellidos}!`, 'info');
                } else if (dias === 0) {
                    mostrarAlerta(`¡Hoy es el cumpleaños de ${emp.nombres} ${emp.apellidos}!`, 'info');
                }
            }
        });
    }

    // Exportar a CSV
    function exportarEmpleadosCSV() {
        if (!empleados.length) {
            mostrarAlerta('No hay empleados para exportar', 'warning');
            return;
        }

        const headers = [
            'Nombres', 'Apellidos', 'Cédula', 'Teléfono', 'Email', 'Cargo', 
            'Departamento', 'Tipo de Contrato', 'Salario', 'Fecha de Nacimiento',
            'Fecha de Ingreso', 'Antigüedad', 'Notas', 'Contacto Emergencia Nombre',
            'Contacto Emergencia Teléfono', 'Contacto Emergencia Parentesco'
        ];

        let csv = headers.join(',') + '\n';
        
        empleados.forEach(emp => {
            const row = [
                emp.nombres,
                emp.apellidos,
                emp.cedula,
                emp.telefono,
                emp.email,
                emp.cargo || '',
                emp.departamento || '',
                emp.tipoContrato || '',
                emp.salario || '',
                emp.fechaNacimiento || '',
                emp.fechaIngreso || '',
                calcularAntiguedadTexto(emp.fechaIngreso),
                (emp.notas || '').replace(/,/g, ';'),
                emp.contactoEmergenciaNombre || '',
                emp.contactoEmergenciaTelefono || '',
                emp.contactoEmergenciaParentesco || ''
            ].map(val => `"${val}"`);
            
            csv += row.join(',') + '\n';
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'empleados_ashe.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Inicialización
    showLoginForm();
});
