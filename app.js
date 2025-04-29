// app.js
// Lógica principal para gestión de empleados RRHH ASHE con toggle de contraseña

document.addEventListener('DOMContentLoaded', function() {
    // Usuarios permitidos (admin puede ver salario)
    let usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123', rol: 'admin' },
        { email: 'usuario1@ashe.com', password: 'usuario123', rol: 'rrhh' },
        { email: 'usuario2@ashe.com', password: 'usuario123', rol: 'rrhh' }
    ];

    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
    let usuarioActual = null;

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const empleadosList = document.getElementById('empleados-list');
    const empleadoForm = document.getElementById('empleado-form');
    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnRegistro = document.getElementById('btn-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

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
            if (btnLogout) btnLogout.style.display = 'block';
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnRegistro) btnRegistro.style.display = 'none';
            showEmpleadosList();
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

    function showLoginForm() {
        document.getElementById('login-form').classList.remove('d-none');
        document.getElementById('registro-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
    }

    function handleLogout() {
        isAuthenticated = false;
        usuarioActual = null;
        if (btnLogout) btnLogout.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'block';
        if (btnRegistro) btnRegistro.style.display = 'block';
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

    // Funciones de empleados
    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        empleadosList.classList.remove('d-none');
        empleadoForm.classList.add('d-none');
        renderEmpleados();
    }

    function showEmpleadoForm() {
        const form = document.getElementById('empleadoForm');
        if (form) form.reset();
        if (form) form.removeAttribute('data-edit-id');
        empleadoForm.classList.remove('d-none');
        empleadosList.classList.add('d-none');
    }

    function hideEmpleadoForm() {
        empleadoForm.classList.add('d-none');
        showEmpleadosList();
    }

    function renderEmpleados() {
        const tbody = document.getElementById('empleados-table-body');
        tbody.innerHTML = '';
        empleados.forEach(empleado => {
            let salarioTd = '';
            if (usuarioActual && usuarioActual.rol === 'admin') {
                salarioTd = `<td>${empleado.salario || ''}</td>`;
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
                <td>
                    <button class="btn btn-sm btn-primary btn-action" onclick="editEmpleado(${empleado.id})">Editar</button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteEmpleado(${empleado.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
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

    // Inicialización
    showLoginForm();
});
