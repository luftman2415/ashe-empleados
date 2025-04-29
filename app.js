// app.js
// Portal RRHH ASHE: gestión avanzada de empleados, cumpleaños, ausencias, documentos, login seguro y navegación moderna

document.addEventListener('DOMContentLoaded', function() {
    // Usuarios permitidos (admin puede ver salario)
    let usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' },
        { email: 'usuario1@ashe.com', password: 'usuario123', rol: 'rrhh' },
        { email: 'usuario2@ashe.com', password: 'usuario123', rol: 'rrhh' }
    ];

    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
    let ausencias = JSON.parse(localStorage.getItem('ausencias')) || [];
    let usuarioActual = null;

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const empleadosList = document.getElementById('empleados-list');
    const empleadoForm = document.getElementById('empleado-form');
    const cumpleanosList = document.getElementById('cumpleanos-list');
    const dashboard = document.getElementById('dashboard');
    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnRegistro = document.getElementById('btn-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnCumpleanos = document.getElementById('btn-cumpleanos');
    const btnAusencias = document.getElementById('btn-ausencias');
    const btnDocumentos = document.getElementById('btn-documentos');
    const btnVolverDashboard = document.getElementById('btn-volver-dashboard');
    const btnVolverDashboardCumple = document.getElementById('btn-volver-dashboard-cumple');
    const btnVolverDashboardAusencias = document.getElementById('btn-volver-dashboard-ausencias');
    const btnExportarCSV = document.getElementById('btn-exportar-csv');
    const busquedaEmpleados = document.getElementById('busqueda-empleados');
    const ausenciasList = document.getElementById('ausencias-list');
    const ausenciaForm = document.getElementById('ausenciaForm');

    // Estado de autenticación
    let isAuthenticated = false;

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
    if (btnCancelar) btnCancelar.onclick = hideEmpleadoForm;
    if (btnRegistro) btnRegistro.onclick = showRegistroForm;
    if (btnCancelarRegistro) btnCancelarRegistro.onclick = hideRegistroForm;
    if (btnLogin) btnLogin.onclick = showLoginForm;
    if (btnLogout) btnLogout.onclick = handleLogout;
    if (btnDashboard) btnDashboard.onclick = showDashboard;
    if (btnCumpleanos) btnCumpleanos.onclick = showCumpleanosList;
    if (btnAusencias) btnAusencias.onclick = showAusenciasList;
    if (btnVolverDashboard) btnVolverDashboard.onclick = showDashboard;
    if (btnVolverDashboardCumple) btnVolverDashboardCumple.onclick = showDashboard;
    if (btnVolverDashboardAusencias) btnVolverDashboardAusencias.onclick = showDashboard;
    if (btnExportarCSV) btnExportarCSV.onclick = exportarEmpleadosCSV;
    if (busquedaEmpleados) busquedaEmpleados.oninput = filtrarEmpleados;
    if (ausenciaForm) ausenciaForm.addEventListener('submit', handleRegistrarAusencia);

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
        document.getElementById('login-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
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
            if (btnLogout) btnLogout.classList.remove('d-none');
            if (btnLogin) btnLogin.classList.add('d-none');
            if (btnRegistro) btnRegistro.classList.add('d-none');
            if (btnDashboard) btnDashboard.style.display = '';
            if (btnCumpleanos) btnCumpleanos.style.display = '';
            if (btnAusencias) btnAusencias.style.display = '';
            showDashboard();
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

    function showLoginForm() {
        document.getElementById('login-form').classList.remove('d-none');
        document.getElementById('registro-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (btnCumpleanos) btnCumpleanos.style.display = 'none';
        if (btnAusencias) btnAusencias.style.display = 'none';
    }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnLogin) btnLogin.classList.remove('d-none');
        if (btnRegistro) btnRegistro.classList.remove('d-none');
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (btnCumpleanos) btnCumpleanos.style.display = 'none';
        if (btnAusencias) btnAusencias.style.display = 'none';
        showLoginForm();
        mostrarAlerta('Sesión cerrada correctamente.', 'success');
    }

    // Función para mostrar alertas visuales
    function mostrarAlerta(mensaje, tipo = 'success') {
        let alerta = document.getElementById('alerta-visual');
        if (!alerta) {
            alerta = document.createElement('div');
            alerta.id = 'alerta-visual';
            alerta.className = `alert alert-${tipo} position-fixed top-0 start-50 translate-middle-x mt-3 fade-in`;
            alerta.style.zIndex = 9999;
            document.body.appendChild(alerta);
        }
        alerta.textContent = mensaje;
        alerta.style.display = 'block';
        setTimeout(() => { alerta.style.display = 'none'; }, 2200);
    }

    // Dashboard
    function showDashboard() {
        dashboard.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        document.getElementById('login-form').classList.add('d-none');
        document.getElementById('registro-form').classList.add('d-none');
        // Actualizar datos
        document.getElementById('dashboard-total-empleados').textContent = empleados.length;
        // Próximos cumpleaños
        const hoy = new Date();
        const proximosCumpleanos = empleados.filter(emp => {
            if (!emp.fechaNacimiento) return false;
            const fechaNac = new Date(emp.fechaNacimiento);
            const proximoCumple = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
            if (proximoCumple < hoy) {
                proximoCumple.setFullYear(hoy.getFullYear() + 1);
            }
            const diasRestantes = Math.ceil((proximoCumple - hoy) / (1000 * 60 * 60 * 24));
            return diasRestantes <= 30;
        });
        document.getElementById('dashboard-cumpleanos').textContent = proximosCumpleanos.length;
        // Usuarios registrados
        document.getElementById('dashboard-usuarios').textContent = usuariosPermitidos.length;
    }

    // Funciones de empleados
    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        empleadosList.classList.remove('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        renderEmpleados();
    }

    function showEmpleadoForm() {
        const form = document.getElementById('empleadoForm');
        if (form) form.reset();
        if (form) form.removeAttribute('data-edit-id');
        empleadoForm.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
    }

    function hideEmpleadoForm() {
        empleadoForm.classList.add('d-none');
        showEmpleadosList();
    }

    function renderEmpleados() {
        const tbody = document.getElementById('empleados-table-body');
        tbody.innerHTML = '';
        let filtro = busquedaEmpleados ? busquedaEmpleados.value.toLowerCase() : '';
        empleados.filter(emp => {
            if (!filtro) return true;
            return (
                emp.nombres.toLowerCase().includes(filtro) ||
                emp.apellidos.toLowerCase().includes(filtro) ||
                emp.cedula.toLowerCase().includes(filtro) ||
                (emp.cargo || '').toLowerCase().includes(filtro) ||
                (emp.departamento || '').toLowerCase().includes(filtro)
            );
        }).forEach(empleado => {
            let salarioTd = '';
            if (usuarioActual && usuarioActual.rol === 'admin') {
                salarioTd = `<td>${empleado.salario || ''}</td>`;
            } else {
                salarioTd = `<td>****</td>`;
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${empleado.nombres}</td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.cedula}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.email}</td>
                <td>${empleado.cargo || ''}</td>
                <td>${empleado.departamento || ''}</td>
                <td>${empleado.tipoContrato || ''}</td>
                ${salarioTd}
                <td>${empleado.historialLaboral || ''}</td>
                <td>${empleado.contactoEmergencia || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action" onclick="editEmpleado(${empleado.id})">Editar</button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteEmpleado(${empleado.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function filtrarEmpleados() {
        renderEmpleados();
    }

    // Exportar empleados a CSV
    function exportarEmpleadosCSV() {
        let csv = 'Nombres,Apellidos,Cédula,Teléfono,Email,Cargo,Departamento,Tipo de Contrato,Salario,Historial Laboral,Contacto Emergencia\n';
        empleados.forEach(emp => {
            csv += [
                emp.nombres, emp.apellidos, emp.cedula, emp.telefono, emp.email,
                emp.cargo || '', emp.departamento || '', emp.tipoContrato || '',
                emp.salario || '', emp.historialLaboral || '', emp.contactoEmergencia || ''
            ].map(val => `"${(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empleados.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Guardar empleado
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
        empleadoFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const editId = empleadoFormElement.getAttribute('data-edit-id');
            const empleado = {
                id: editId ? Number(editId) : Date.now(),
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                cedula: document.getElementById('cedula').value,
                telefono: document.getElementById('telefono').value,
                email: document.getElementById('email-empleado').value,
                cargo: document.getElementById('cargo') ? document.getElementById('cargo').value : '',
                departamento: document.getElementById('departamento') ? document.getElementById('departamento').value : '',
                tipoContrato: document.getElementById('tipo-contrato') ? document.getElementById('tipo-contrato').value : '',
                salario: (usuarioActual && usuarioActual.rol === 'admin' && document.getElementById('salario')) ? document.getElementById('salario').value : '',
                historialLaboral: document.getElementById('historial-laboral') ? document.getElementById('historial-laboral').value : '',
                contactoEmergencia: document.getElementById('contacto-emergencia') ? document.getElementById('contacto-emergencia').value : ''
            };
            if (editId) {
                const idx = empleados.findIndex(e => e.id == editId);
                if (idx !== -1) {
                    empleados[idx] = empleado;
                }
                empleadoFormElement.removeAttribute('data-edit-id');
                mostrarAlerta('Empleado actualizado correctamente.', 'success');
            } else {
                empleados.push(empleado);
                mostrarAlerta('Empleado guardado correctamente.', 'success');
            }
            localStorage.setItem('empleados', JSON.stringify(empleados));
            hideEmpleadoForm();
            showEmpleadosList();
        });
    }

    // Editar empleado
    window.editEmpleado = function(id) {
        const empleado = empleados.find(e => e.id === id);
        if (empleado) {
            document.getElementById('nombres').value = empleado.nombres;
            document.getElementById('apellidos').value = empleado.apellidos;
            document.getElementById('cedula').value = empleado.cedula;
            document.getElementById('telefono').value = empleado.telefono;
            document.getElementById('email-empleado').value = empleado.email;
            if (document.getElementById('cargo')) document.getElementById('cargo').value = empleado.cargo || '';
            if (document.getElementById('departamento')) document.getElementById('departamento').value = empleado.departamento || '';
            if (document.getElementById('tipo-contrato')) document.getElementById('tipo-contrato').value = empleado.tipoContrato || '';
            if (usuarioActual && usuarioActual.rol === 'admin' && document.getElementById('salario')) document.getElementById('salario').value = empleado.salario || '';
            if (document.getElementById('historial-laboral')) document.getElementById('historial-laboral').value = empleado.historialLaboral || '';
            if (document.getElementById('contacto-emergencia')) document.getElementById('contacto-emergencia').value = empleado.contactoEmergencia || '';
            empleadoFormElement.setAttribute('data-edit-id', id);
            showEmpleadoForm();
        }
    };

    // Eliminar empleado
    window.deleteEmpleado = function(id) {
        if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
            empleados = empleados.filter(e => e.id !== id);
            localStorage.setItem('empleados', JSON.stringify(empleados));
            renderEmpleados();
        }
    };

    // Cumpleaños
    function showCumpleanosList() {
        cumpleanosList.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        renderCumpleanos();
    }

    function renderCumpleanos() {
        const tbody = document.getElementById('cumpleanos-table-body');
        tbody.innerHTML = '';
        const hoy = new Date();
        const proximosCumpleanos = empleados
            .map(empleado => {
                if (!empleado.fechaNacimiento) return null;
                const fechaNac = new Date(empleado.fechaNacimiento);
                const proximoCumple = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
                if (proximoCumple < hoy) {
                    proximoCumple.setFullYear(hoy.getFullYear() + 1);
                }
                const diasRestantes = Math.ceil((proximoCumple - hoy) / (1000 * 60 * 60 * 24));
                return {
                    ...empleado,
                    diasRestantes
                };
            })
            .filter(emp => emp && emp.diasRestantes <= 30)
            .sort((a, b) => a.diasRestantes - b.diasRestantes);
        proximosCumpleanos.forEach(empleado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${empleado.nombres} ${empleado.apellidos}</td>
                <td>${empleado.fechaNacimiento ? new Date(empleado.fechaNacimiento).toLocaleDateString() : ''}</td>
                <td>${empleado.diasRestantes} días</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Ausencias y Vacaciones
    function showAusenciasList() {
        ausenciasList.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        dashboard.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        renderAusencias();
    }

    function handleRegistrarAusencia(e) {
        e.preventDefault();
        const nombre = document.getElementById('ausencia-nombre').value;
        const fecha = document.getElementById('ausencia-fecha').value;
        const tipo = document.getElementById('ausencia-tipo').value;
        ausencias.push({ nombre, fecha, tipo });
        localStorage.setItem('ausencias', JSON.stringify(ausencias));
        renderAusencias();
        ausenciaForm.reset();
    }

    function renderAusencias() {
        const tbody = document.getElementById('ausencias-table-body');
        tbody.innerHTML = '';
        ausencias.forEach(aus => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aus.nombre}</td>
                <td>${aus.fecha}</td>
                <td>${aus.tipo}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Navegación global
    window.showEmpleadosList = showEmpleadosList;
    window.showCumpleanosList = showCumpleanosList;
    window.showDashboard = showDashboard;
    window.showAusenciasList = showAusenciasList;

    // Inicialización
    showLoginForm();
});
