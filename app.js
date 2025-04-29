// app.js - Portal RRHH ASHE

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
    const btnVerEmpleados = document.getElementById('btn-ver-empleados');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnRegistro = document.getElementById('btn-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnCumpleanos = document.getElementById('btn-cumpleanos');
    const btnAusencias = document.getElementById('btn-ausencias');
    const btnVolverDashboard = document.getElementById('btn-volver-dashboard');
    const btnVolverDashboardCumple = document.getElementById('btn-volver-dashboard-cumple');
    const btnVolverDashboardAusencias = document.getElementById('btn-volver-dashboard-ausencias');
    const btnExportarCSV = document.getElementById('btn-exportar-csv');
    const busquedaEmpleados = document.getElementById('busqueda-empleados');
    const ausenciasList = document.getElementById('ausencias-list');
    const ausenciaForm = document.getElementById('ausenciaForm');
    const empleadoDetalle = document.getElementById('empleado-detalle');
    const empleadoDetalleBody = document.getElementById('empleado-detalle-body');
    const btnVolverEmpleados = document.getElementById('btn-volver-empleados');

    // Olvidé mi contraseña
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const btnCerrarForgot = document.querySelectorAll('#btn-cerrar-forgot');
    const resetPasswordModal = document.getElementById('reset-password-modal');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const btnCerrarReset = document.querySelectorAll('#btn-cerrar-reset');

    // Estado de autenticación
    let isAuthenticated = false;
    let emailToReset = null;

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

    // Mostrar modal de "Olvidé mi contraseña"
    if (forgotPasswordLink) {
        forgotPasswordLink.onclick = function(e) {
            e.preventDefault();
            forgotPasswordModal.classList.remove('d-none');
        };
    }
    if (btnCerrarForgot) {
        btnCerrarForgot.forEach(btn => {
            btn.onclick = function() {
                forgotPasswordModal.classList.add('d-none');
            };
        });
    }
    if (forgotPasswordForm) {
        forgotPasswordForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            if (usuariosPermitidos.some(u => u.email === email)) {
                emailToReset = email;
                forgotPasswordModal.classList.add('d-none');
                resetPasswordModal.classList.remove('d-none');
            } else {
                mostrarAlerta('El correo no está registrado', 'danger');
                forgotPasswordModal.classList.add('d-none');
            }
        };
    }
    if (btnCerrarReset) {
        btnCerrarReset.forEach(btn => {
            btn.onclick = function() {
                resetPasswordModal.classList.add('d-none');
            };
        });
    }
    if (resetPasswordForm) {
        resetPasswordForm.onsubmit = function(e) {
            e.preventDefault();
            const pass1 = document.getElementById('reset-password').value;
            const pass2 = document.getElementById('reset-password-confirm').value;
            if (pass1 !== pass2) {
                mostrarAlerta('Las contraseñas no coinciden', 'danger');
                return;
            }
            let idx = usuariosPermitidos.findIndex(u => u.email === emailToReset);
            if (idx !== -1) {
                usuariosPermitidos[idx].password = pass1;
                localStorage.setItem('usuarios', JSON.stringify(usuariosPermitidos));
                mostrarAlerta('Contraseña restablecida con éxito', 'success');
            }
            resetPasswordModal.classList.add('d-none');
        };
    }

    // Event Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registroForm) registroForm.addEventListener('submit', handleRegistro);
    if (btnNuevoEmpleado) btnNuevoEmpleado.onclick = showEmpleadoForm;
    if (btnVerEmpleados) btnVerEmpleados.onclick = showEmpleadosList;
    if (btnCancelar) btnCancelar.onclick = function() {
        empleadoForm.classList.add('d-none');
        showEmpleadosList();
    };
    if (btnRegistro) btnRegistro.onclick = showRegistroForm;
    if (btnCancelarRegistro) btnCancelarRegistro.onclick = hideRegistroForm;
    if (btnLogin) btnLogin.onclick = function() {
        limpiarLogin();
        showLoginForm();
    };
    if (btnLogout) btnLogout.onclick = handleLogout;
    if (btnDashboard) btnDashboard.onclick = showDashboard;
    if (btnCumpleanos) btnCumpleanos.onclick = showCumpleanosList;
    if (btnAusencias) btnAusencias.onclick = showAusenciasList;
    if (btnVolverDashboard) btnVolverDashboard.onclick = showLoginForm;
    if (btnVolverDashboardCumple) btnVolverDashboardCumple.onclick = showLoginForm;
    if (btnVolverDashboardAusencias) btnVolverDashboardAusencias.onclick = showLoginForm;
    if (btnExportarCSV) btnExportarCSV.onclick = exportarEmpleadosCSV;
    if (busquedaEmpleados) busquedaEmpleados.oninput = filtrarEmpleados;
    if (ausenciaForm) ausenciaForm.addEventListener('submit', handleRegistrarAusencia);
    if (btnVolverEmpleados) btnVolverEmpleados.onclick = function() {
        empleadoDetalle.classList.add('d-none');
        showEmpleadosList();
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
        document.getElementById('login-form').classList.add('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        empleadoDetalle.classList.add('d-none');
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
            document.getElementById('login-form').classList.add('d-none');
            notificarCumpleanos();
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
        empleadoDetalle.classList.add('d-none');
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (btnCumpleanos) btnCumpleanos.style.display = 'none';
        if (btnAusencias) btnAusencias.style.display = 'none';
        if (btnLogin) btnLogin.classList.remove('d-none');
        if (btnRegistro) btnRegistro.classList.remove('d-none');
        limpiarLogin();
    }

    function limpiarLogin() {
        if (loginForm) {
            loginForm.reset();
        }
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
        empleadoDetalle.classList.add('d-none');
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
        empleadoDetalle.classList.add('d-none');
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
        empleadoDetalle.classList.add('d-none');
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
                salarioTd = `<td>${formatearMiles(empleado.salario) || ''}</td>`;
            } else {
                salarioTd = `<td>****</td>`;
            }
            const hojaDeVidaTd = empleado.hojaDeVidaNombre
                ? `<td><a href="${empleado.hojaDeVidaArchivo}" target="_blank">${empleado.hojaDeVidaNombre}</a></td>`
                : `<td></td>`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" class="ver-empleado" data-id="${empleado.id}">${empleado.nombres}</a></td>
                <td>${empleado.apellidos}</td>
                <td>${empleado.cedula}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.email}</td>
                <td>${empleado.cargo || ''}</td>
                <td>${empleado.departamento || ''}</td>
                <td>${empleado.tipoContrato || ''}</td>
                ${salarioTd}
                <td>${empleado.fechaNacimiento ? new Date(empleado.fechaNacimiento).toLocaleDateString() : ''}</td>
                <td>${empleado.fechaIngreso ? new Date(empleado.fechaIngreso).toLocaleDateString() : ''}</td>
                <td>${empleado.notas || ''}</td>
                ${hojaDeVidaTd}
                <td>${empleado.contactoEmergenciaNombre || ''}</td>
                <td>${empleado.contactoEmergenciaTelefono || ''}</td>
                <td>${empleado.contactoEmergenciaParentesco || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action" onclick="editEmpleado(${empleado.id})">Editar</button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteEmpleado(${empleado.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Evento para ver detalle de empleado
        document.querySelectorAll('.ver-empleado').forEach(link => {
            link.onclick = function(e) {
                e.preventDefault();
                const id = Number(this.getAttribute('data-id'));
                mostrarDetalleEmpleado(id);
            };
        });
    }

    function filtrarEmpleados() {
        renderEmpleados();
    }

    // Exportar empleados a CSV (UTF-8, separador coma)
    function exportarEmpleadosCSV() {
        if (!empleados.length) {
            mostrarAlerta('No hay empleados para exportar', 'danger');
            return;
        }
        let csv = 'Nombres,Apellidos,Cédula,Teléfono,Email,Cargo,Departamento,Tipo de Contrato,Salario,Fecha de Cumpleaños,Fecha de Ingreso,Notas/Acontecimientos,Hoja de Vida,Contacto Emergencia Nombre,Contacto Emergencia Teléfono,Contacto Emergencia Parentesco\n';
        empleados.forEach(emp => {
            csv += [
                emp.nombres, emp.apellidos, emp.cedula, emp.telefono, emp.email,
                emp.cargo || '', emp.departamento || '', emp.tipoContrato || '',
                emp.salario || '', emp.fechaNacimiento || '', emp.fechaIngreso || '', emp.notas || '', emp.hojaDeVidaNombre || '',
                emp.contactoEmergenciaNombre || '', emp.contactoEmergenciaTelefono || '', emp.contactoEmergenciaParentesco || ''
            ].map(val => `"${(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empleados.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Guardar empleado (con notas, hoja de vida, fechas y contacto emergencia separado)
    const empleadoFormElement = document.getElementById('empleadoForm');
    if (empleadoFormElement) {
        empleadoFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            const editId = empleadoFormElement.getAttribute('data-edit-id');
            // Adjuntar hoja de vida
            let hojaDeVidaNombre = '';
            let hojaDeVidaArchivo = '';
            const hojaDeVidaInput = document.getElementById('hoja-de-vida');
            if (hojaDeVidaInput && hojaDeVidaInput.files.length > 0) {
                hojaDeVidaNombre = hojaDeVidaInput.files[0].name;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    hojaDeVidaArchivo = evt.target.result;
                    guardarEmpleado();
                };
                reader.readAsDataURL(hojaDeVidaInput.files[0]);
                return; // Esperar a que termine FileReader
            } else {
                guardarEmpleado();
            }

            function guardarEmpleado() {
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
                    salario: limpiarMiles(document.getElementById('salario').value),
                    fechaNacimiento: document.getElementById('fecha-nacimiento').value,
                    fechaIngreso: document.getElementById('fecha-ingreso').value,
                    notas: document.getElementById('notas') ? document.getElementById('notas').value : '',
                    hojaDeVidaNombre,
                    hojaDeVidaArchivo,
                    contactoEmergenciaNombre: document.getElementById('contacto-emergencia-nombre') ? document.getElementById('contacto-emergencia-nombre').value : '',
                    contactoEmergenciaTelefono: document.getElementById('contacto-emergencia-telefono') ? document.getElementById('contacto-emergencia-telefono').value : '',
                    contactoEmergenciaParentesco: document.getElementById('contacto-emergencia-parentesco') ? document.getElementById('contacto-emergencia-parentesco').value : ''
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
            }
        });

        // Formato de miles en salario
        const salarioInput = document.getElementById('salario');
        if (salarioInput) {
            salarioInput.addEventListener('input', function(e) {
                let val = this.value.replace(/\D/g, '');
                if (val) {
                    this.value = formatearMiles(val);
                } else {
                    this.value = '';
                }
            });
        }
    }

    // Editar empleado (cargar campos separados)
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
            if (document.getElementById('salario')) document.getElementById('salario').value = formatearMiles(empleado.salario || '');
            if (document.getElementById('fecha-nacimiento')) document.getElementById('fecha-nacimiento').value = empleado.fechaNacimiento || '';
            if (document.getElementById('fecha-ingreso')) document.getElementById('fecha-ingreso').value = empleado.fechaIngreso || '';
            if (document.getElementById('notas')) document.getElementById('notas').value = empleado.notas || '';
            if (document.getElementById('contacto-emergencia-nombre')) document.getElementById('contacto-emergencia-nombre').value = empleado.contactoEmergenciaNombre || '';
            if (document.getElementById('contacto-emergencia-telefono')) document.getElementById('contacto-emergencia-telefono').value = empleado.contactoEmergenciaTelefono || '';
            if (document.getElementById('contacto-emergencia-parentesco')) document.getElementById('contacto-emergencia-parentesco').value = empleado.contactoEmergenciaParentesco || '';
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

    // Ver detalle de empleado
    function mostrarDetalleEmpleado(id) {
        const empleado = empleados.find(e => e.id === id);
        if (!empleado) return;
        let salario = (usuarioActual && usuarioActual.rol === 'admin') ? formatearMiles(empleado.salario) : '****';
        empleadoDetalleBody.innerHTML = `
            <h4>${empleado.nombres} ${empleado.apellidos}</h4>
            <p><i class="bi bi-credit-card"></i> <b>Cédula:</b> ${empleado.cedula}</p>
            <p><i class="bi bi-telephone"></i> <b>Teléfono:</b> ${empleado.telefono}</p>
            <p><i class="bi bi-envelope"></i> <b>Email:</b> ${empleado.email}</p>
            <p><i class="bi bi-person-badge"></i> <b>Cargo:</b> ${empleado.cargo || ''}</p>
            <p><i class="bi bi-building"></i> <b>Departamento:</b> ${empleado.departamento || ''}</p>
            <p><i class="bi bi-file-earmark-text"></i> <b>Tipo de Contrato:</b> ${empleado.tipoContrato || ''}</p>
            <p><i class="bi bi-cash"></i> <b>Salario:</b> ${salario}</p>
            <p><i class="bi bi-gift"></i> <b>Fecha de Cumpleaños:</b> ${empleado.fechaNacimiento ? new Date(empleado.fechaNacimiento).toLocaleDateString() : ''}</p>
            <p><i class="bi bi-calendar-check"></i> <b>Fecha de Ingreso:</b> ${empleado.fechaIngreso ? new Date(empleado.fechaIngreso).toLocaleDateString() : ''}</p>
            <p><i class="bi bi-journal-text"></i> <b>Notas/Acontecimientos:</b> ${empleado.notas || ''}</p>
            <p><i class="bi bi-file-earmark-pdf"></i> <b>Hoja de Vida:</b> ${empleado.hojaDeVidaNombre ? `<a href="${empleado.hojaDeVidaArchivo}" target="_blank">${empleado.hojaDeVidaNombre}</a>` : ''}</p>
            <p><i class="bi bi-person-lines-fill"></i> <b>Contacto Emergencia:</b> ${empleado.contactoEmergenciaNombre || ''} (${empleado.contactoEmergenciaParentesco || ''}) - ${empleado.contactoEmergenciaTelefono || ''}</p>
        `;
        empleadosList.classList.add('d-none');
        empleadoDetalle.classList.remove('d-none');
    }

    // Cumpleaños
    function showCumpleanosList() {
        cumpleanosList.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        dashboard.classList.add('d-none');
        ausenciasList.classList.add('d-none');
        empleadoDetalle.classList.add('d-none');
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

    // Notificación visual de cumpleaños próximo
    function notificarCumpleanos() {
        const hoy = new Date();
        empleados.forEach(emp => {
            if (!emp.fechaNacimiento) return;
            const fechaNac = new Date(emp.fechaNacimiento);
            const proximoCumple = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
            if (proximoCumple < hoy) {
                proximoCumple.setFullYear(hoy.getFullYear() + 1);
            }
            const diasRestantes = Math.ceil((proximoCumple - hoy) / (1000 * 60 * 60 * 24));
            if (diasRestantes === 1) {
                mostrarAlerta(`¡Mañana es el cumpleaños de ${emp.nombres} ${emp.apellidos}!`, 'info');
            }
        });
    }

    // Ausencias y Vacaciones
    function showAusenciasList() {
        ausenciasList.classList.remove('d-none');
        empleadosList.classList.add('d-none');
        empleadoForm.classList.add('d-none');
        dashboard.classList.add('d-none');
        cumpleanosList.classList.add('d-none');
        empleadoDetalle.classList.add('d-none');
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

    // Utilidades
    function formatearMiles(valor) {
        if (!valor) return '';
        return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    function limpiarMiles(valor) {
        return valor ? valor.replace(/\./g, '') : '';
    }

    // Inicialización
    showLoginForm();
});
