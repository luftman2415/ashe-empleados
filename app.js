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
loginForm.addEventListener('submit', handleLogin);
registroForm.addEventListener('submit', handleRegistro);
btnNuevoEmpleado.addEventListener('click', showEmpleadoForm);
btnCancelar.addEventListener('click', hideEmpleadoForm);
btnRegistro.addEventListener('click', showRegistroForm);
btnCancelarRegistro.addEventListener('click', hideRegistroForm);
navEmpleados.addEventListener('click', showEmpleadosList);
navCumpleanos.addEventListener('click', showCumpleanosList);
btnLogin.addEventListener('click', showLoginForm);
btnLogout.addEventListener('click', handleLogout);
btnSalir.addEventListener('click', handleSalir);

// Toggle de contraseña
togglePassword.addEventListener('click', function() {
    togglePasswordVisibility('password', this);
});

toggleRegPassword.addEventListener('click', function() {
    togglePasswordVisibility('reg-password', this);
});

toggleRegConfirmPassword.addEventListener('click', function() {
    togglePasswordVisibility('reg-confirm-password', this);
});

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
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
        alert('Las contraseñas no coinciden');
        return;
    }

    if (usuariosPermitidos.some(u => u.email === email)) {
        alert('El correo electrónico ya está registrado');
        return;
    }

    usuariosPermitidos.push({ email, password });
    localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
    
    alert('Usuario registrado exitosamente');
    hideRegistroForm();
    showLoginForm();
}

function showRegistroForm() {
    document.getElementById('registro-form').classList.remove('d-none');
    document.getElementById('login-form').classList.add('d-none');
    empleadosList.classList.add('d-none');
    empleadoForm.classList.add('d-none');
    cumpleanosList.classList.add('d-none');
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
        btnLogout.style.display = 'block';
        btnLogin.style.display = 'none';
        btnRegistro.style.display = 'none';
        showEmpleadosList();
        hideLoginForm();
    } else {
        alert('Credenciales incorrectas');
    }
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('registro-form').classList.add('d-none');
    empleadosList.classList.add('d-none');
    empleadoForm.classList.add('d-none');
    cumpleanosList.classList.add('d-none');
}

function hideLoginForm() {
    document.getElementById('login-form').classList.add('d-none');
}

function handleLogout() {
    isAuthenticated = false;
    btnLogout.style.display = 'none';
    btnLogin.style.display = 'block';
    btnRegistro.style.display = 'block';
    showLoginForm();
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
    empleadoForm.classList.add('d-none');
    cumpleanosList.classList.add('d-none');
    renderEmpleados();
}

function showEmpleadoForm() {
    empleadoForm.classList.remove('d-none');
    empleadosList.classList.add('d-none');
    cumpleanosList.classList.add('d-none');
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
                <button class="btn btn-sm btn-primary btn-action" onclick="editEmpleado(${empleado.id})">Editar</button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteEmpleado(${empleado.id})">Eliminar</button>
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
    empleadosList.classList.add('d-none');
    empleadoForm.classList.add('d-none');
    renderCumpleanos();
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
document.getElementById('empleadoForm').addEventListener('submit', function(e) {
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

function editEmpleado(id) {
    const empleado = empleados.find(e => e.id === id);
    if (empleado) {
        document.getElementById('nombres').value = empleado.nombres;
        document.getElementById('apellidos').value = empleado.apellidos;
        document.getElementById('cedula').value = empleado.cedula;
        document.getElementById('telefono').value = empleado.telefono;
        document.getElementById('email-empleado').value = empleado.email;
        document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento;
        document.getElementById('fecha-ingreso').value = empleado.fechaIngreso;
        
        showEmpleadoForm();
    }
}

function deleteEmpleado(id) {
    if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
        empleados = empleados.filter(e => e.id !== id);
        localStorage.setItem('empleados', JSON.stringify(empleados));
        renderEmpleados();
    }
}

// Inicialización
showLoginForm(); 