document.addEventListener('DOMContentLoaded', function() {
    // Datos de usuarios permitidos
    let usuariosPermitidos = JSON.parse(localStorage.getItem('usuarios')) || [
        { email: 'admin@ashe.com', password: 'admin123' },
        { email: 'usuario1@ashe.com', password: 'usuario123' },
        { email: 'usuario2@ashe.com', password: 'usuario123' }
    ];

    // Almacenamiento local para empleados
    let empleados = JSON.parse(localStorage.getItem('empleados')) || [];

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const empleadosList = document.getElementById('empleados-list');
    const empleadoForm = document.getElementById('empleado-form');
    const cumpleanosList = document.getElementById('cumpleanos-list');
    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnRegistro = document.getElementById('btn-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    const navEmpleados = document.getElementById('nav-empleados');
    const navCumpleanos = document.getElementById('nav-cumpleanos');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnSalir = document.getElementById('btn-salir');

    // Toggles de contraseña
    const togglePassword = document.getElementById('toggle-password');
    const toggleRegPassword = document.getElementById('toggle-reg-password');
    const toggleRegConfirmPassword = document.getElementById('toggle-reg-confirm-password');

    // Estado de autenticación
    let isAuthenticated = false;

    // Event Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registroForm) registroForm.addEventListener('submit', handleRegistro);
    if (btnNuevoEmpleado) btnNuevoEmpleado.onclick = showEmpleadoForm;
    if (btnCancelar) btnCancelar.onclick = hideEmpleadoForm;
    if (btnRegistro) btnRegistro.onclick = showRegistroForm;
    if (btnCancelarRegistro) btnCancelarRegistro.onclick = hideRegistroForm;
    if (navEmpleados) navEmpleados.onclick = showEmpleadosList;
    if (navCumpleanos) navCumpleanos.onclick = showCumpleanosList;
    if (btnLogin) btnLogin.onclick = showLoginForm;
    if (btnLogout) btnLogout.onclick = handleLogout;
    if (btnSalir) btnSalir.onclick = handleSalir;

    // Toggle de contraseña
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibility('password', this);
        });
    }
    if (toggleRegPassword) {
        toggleRegPassword.addEventListener('click', function() {
            togglePasswordVisibility('reg-password', this);
        });
    }
    if (toggleRegConfirmPassword) {
        toggleRegConfirmPassword.addEventListener('click', function() {
            togglePasswordVisibility('reg-confirm-password', this);
        });
    }

    function togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        if (!input || !icon) return;
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

        usuariosPermitidos.push({ email, password });
        localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
        mostrarAlerta('Usuario registrado exitosamente', 'success');
        hideRegistroForm();
        showLoginForm();
    }

    function fadeInSection(element) {
        if (!element) return;
        element.classList.remove('fade-in');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('fade-in');
        setTimeout(() => element.classList.remove('fade-in'), 700);
    }

    function showRegistroForm() {
        const el = document.getElementById('registro-form');
        // Limpiar el formulario de registro
        const regForm = document.getElementById('registroForm');
        if (regForm) regForm.reset();
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('reg-confirm-password').value = '';
        el.classList.remove('d-none');
        fadeInSection(el);
        document.getElementById('login-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            if (btnLogout) btnLogout.style.display = 'block';
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnRegistro) btnRegistro.style.display = 'none';
            showDashboard();
        } else {
            mostrarAlerta('Credenciales incorrectas', 'danger');
        }
    }

    function showLoginForm() {
        const el = document.getElementById('login-form');
        el.classList.remove('d-none');
        fadeInSection(el);
        document.getElementById('registro-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        actualizarBotonLogout();
    }

    function hideLoginForm() {
        document.getElementById('login-form').classList.add('d-none');
    }

    function handleLogout() {
        isAuthenticated = false;
        if (btnLogout) btnLogout.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'block';
        if (btnRegistro) btnRegistro.style.display = 'block';
        document.getElementById('dashboard').classList.add('d-none');
        showLoginForm();
        mostrarAlerta('Sesión cerrada correctamente.', 'success');
        actualizarBotonLogout();
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

    function handleSalir() {
        if (confirm('¿Está seguro de que desea salir de la aplicación?')) {
            window.location.href = 'index.html';
        }
    }

    // Funciones de empleados
    function showEmpleadosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        empleadosList.classList.remove('d-none');
        fadeInSection(empleadosList);
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderEmpleados();
        actualizarBotonLogout();
    }

    function showEmpleadoForm() {
        const form = document.getElementById('empleadoForm');
        if (form) form.reset();
        const campos = ['contacto-nombre', 'contacto-telefono', 'contacto-parentesco', 'documentos', 'nombres', 'apellidos', 'cedula', 'telefono', 'email-empleado', 'fecha-nacimiento', 'fecha-ingreso'];
        campos.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        if (form) form.removeAttribute('data-edit-id');
        empleadoForm.classList.remove('d-none');
        fadeInSection(empleadoForm);
        empleadosList.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        actualizarBotonLogout();
    }

    function hideEmpleadoForm() {
        empleadoForm.classList.add('d-none');
        showEmpleadosList();
    }

    function renderEmpleados() {
        const tbody = document.getElementById('empleados-table-body');
        tbody.innerHTML = '';
        empleados.forEach(empleado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${empleado.nombres}</td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.cedula}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.email}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-action" onclick="adjuntarDocumento(${empleado.id})">Adjuntar</button>
                    <button class="btn btn-sm btn-primary btn-action" onclick="editEmpleado(${empleado.id})">Editar</button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteEmpleado(${empleado.id})">Eliminar</button>
                    <button class="btn btn-sm btn-success btn-action" onclick="guardarEmpleado(${empleado.id})">Guardar</button>
                </td>
                <td>
                    ${empleado.documentos && empleado.documentos.length > 0 ? `<a href="${empleado.documentos[0].data}" target="_blank">Ver documento</a>` : 'Sin documento'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Funciones de cumpleaños
    function showCumpleanosList() {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        cumpleanosList.classList.remove('d-none');
        fadeInSection(cumpleanosList);
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        document.getElementById('dashboard').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderCumpleanos();
        actualizarBotonLogout();
    }

    function renderCumpleanos() {
        const tbody = document.getElementById('cumpleanos-table-body');
        tbody.innerHTML = '';
        const hoy = new Date();
        const proximosCumpleanos = empleados
            .map(empleado => {
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
            .filter(emp => emp.diasRestantes <= 30)
            .sort((a, b) => a.diasRestantes - b.diasRestantes);
        proximosCumpleanos.forEach(empleado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${empleado.nombres} ${empleado.apellidos}</td>
                <td>${new Date(empleado.fechaNacimiento).toLocaleDateString()}</td>
                <td>${empleado.diasRestantes} días</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Funciones de gestión de empleados
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
        empleadoFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const empleado = {
                id: Date.now(),
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                cedula: document.getElementById('cedula').value,
                telefono: document.getElementById('telefono').value,
                email: document.getElementById('email-empleado').value,
                fechaNacimiento: document.getElementById('fecha-nacimiento').value,
                fechaIngreso: document.getElementById('fecha-ingreso').value,
                contactoEmergencia: {
                    nombre: document.getElementById('contacto-nombre').value,
                    telefono: document.getElementById('contacto-telefono').value,
                    parentesco: document.getElementById('contacto-parentesco').value
                },
                documentos: []
            };
            // Manejar archivos adjuntos
            const archivos = document.getElementById('documentos').files;
            if (archivos.length > 0) {
                for (let i = 0; i < archivos.length; i++) {
                    const archivo = archivos[i];
                    empleado.documentos.push({
                        nombre: archivo.name,
                        tipo: archivo.type,
                        tamaño: archivo.size
                    });
                }
            }
            empleados.push(empleado);
            localStorage.setItem('empleados', JSON.stringify(empleados));
            hideEmpleadoForm();
            showEmpleadosList();
        });
    }

    // Mostrar dashboard tras login
    function showDashboard() {
        const el = document.getElementById('dashboard');
        el.classList.remove('d-none');
        fadeInSection(el);
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        document.getElementById('login-form').classList.add('d-none');
        document.getElementById('registro-form').classList.add('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        actualizarBotonLogout();
    }

    // Inicialización
    showLoginForm();

    // Exponer funciones globales para botones de editar/eliminar
    window.editEmpleado = function(id) {
        const empleado = empleados.find(e => e.id === id);
        if (empleado) {
            document.getElementById('nombres').value = empleado.nombres;
            document.getElementById('apellidos').value = empleado.apellidos;
            document.getElementById('cedula').value = empleado.cedula;
            document.getElementById('telefono').value = empleado.telefono;
            document.getElementById('email-empleado').value = empleado.email;
            document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento;
            document.getElementById('fecha-ingreso').value = empleado.fechaIngreso;
            document.getElementById('empleadoForm').setAttribute('data-edit-id', id);
            showEmpleadoForm();
        }
    };

    window.deleteEmpleado = function(id) {
        if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
            empleados = empleados.filter(e => e.id !== id);
            localStorage.setItem('empleados', JSON.stringify(empleados));
            renderEmpleados();
        }
    };

    // Adjuntar documento a un empleado
    window.adjuntarDocumento = function(id) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const empleadosActualizados = empleados.map(emp => {
                        if (emp.id === id) {
                            emp.documentos = [{
                                nombre: file.name,
                                tipo: file.type,
                                tamaño: file.size,
                                data: evt.target.result
                            }];
                        }
                        return emp;
                    });
                    empleados = empleadosActualizados;
                    localStorage.setItem('empleados', JSON.stringify(empleados));
                    renderEmpleados();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    // Guardar cambios de un empleado
    window.guardarEmpleado = function(id) {
        // Buscar el empleado en el array
        const empleado = empleados.find(e => e.id === id);
        if (!empleado) {
            mostrarAlerta('Empleado no encontrado.', 'danger');
            return;
        }
        // Si el formulario está en modo edición de este empleado, actualiza los datos
        if (document.getElementById('empleadoForm').getAttribute('data-edit-id') == id) {
            empleado.nombres = document.getElementById('nombres').value;
            empleado.apellidos = document.getElementById('apellidos').value;
            empleado.cedula = document.getElementById('cedula').value;
            empleado.telefono = document.getElementById('telefono').value;
            empleado.email = document.getElementById('email-empleado').value;
            empleado.fechaNacimiento = document.getElementById('fecha-nacimiento').value;
            empleado.fechaIngreso = document.getElementById('fecha-ingreso').value;
            empleado.contactoEmergencia = {
                nombre: document.getElementById('contacto-nombre').value,
                telefono: document.getElementById('contacto-telefono').value,
                parentesco: document.getElementById('contacto-parentesco').value
            };
            localStorage.setItem('empleados', JSON.stringify(empleados));
            renderEmpleados();
            hideEmpleadoForm();
            mostrarAlerta('Empleado guardado correctamente.', 'success');
        } else {
            mostrarAlerta('Debes editar el empleado antes de guardar.', 'danger');
        }
    }

    // Event listener para el botón de logout en el dashboard
    const btnDashboardLogout = document.getElementById('btn-dashboard-logout');
    if (btnDashboardLogout) btnDashboardLogout.onclick = handleLogout;

    // Event listeners para los nuevos botones en empleados-list
    const btnEmpleadosDashboard = document.getElementById('btn-empleados-dashboard');
    if (btnEmpleadosDashboard) btnEmpleadosDashboard.onclick = showDashboard;
    const btnEmpleadosLogout = document.getElementById('btn-empleados-logout');
    if (btnEmpleadosLogout) btnEmpleadosLogout.onclick = handleLogout;

    // Event listeners para los nuevos botones en cumpleaños-list
    const btnCumpleanosDashboard = document.getElementById('btn-cumpleanos-dashboard');
    if (btnCumpleanosDashboard) btnCumpleanosDashboard.onclick = showDashboard;
    const btnCumpleanosLogout = document.getElementById('btn-cumpleanos-logout');
    if (btnCumpleanosLogout) btnCumpleanosLogout.onclick = handleLogout;

    // Event listeners para los nuevos botones en empleado-form
    const btnEmpleadoFormDashboard = document.getElementById('btn-empleadoform-dashboard');
    if (btnEmpleadoFormDashboard) btnEmpleadoFormDashboard.onclick = showDashboard;
    const btnEmpleadoFormLogout = document.getElementById('btn-empleadoform-logout');
    if (btnEmpleadoFormLogout) btnEmpleadoFormLogout.onclick = handleLogout;

    // Refuerza visibilidad del botón de cerrar sesión en la navbar
    function actualizarBotonLogout() {
        if (isAuthenticated && btnLogout) {
            btnLogout.style.display = 'block';
        } else if (btnLogout) {
            btnLogout.style.display = 'none';
        }
    }
}); 