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
