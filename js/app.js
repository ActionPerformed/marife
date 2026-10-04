/**
 * MARIFÉ - Motor de Asignación y Relaciones para la Intermediación entre Formación y Empresa
 *
 * Este archivo combina todos los módulos de la aplicación en uno solo.
 * Para separar en múltiples archivos, extraiga cada sección marcada con "=== SECCIÓN ==="
 *
 * NOTA: Para usar como módulos ES6, elimine esta combinación y use imports/exports.
 */

// =============================================================================
// === SECCIÓN 1: UTILIDADES DOM (dom.js) ======================================
// =============================================================================

/**
 * Query selector shorthand - returns first matching element
 */
function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query selector all returning Array
 */
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Create element with attributes and children
 */
function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    }
    for (const child of children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    }
    return element;
}

/**
 * Show modal by ID
 */
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

/**
 * Hide modal by ID
 */
function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = $('#toast-container') || createToastContainer();
    const toast = createElement('div', {
        className: `toast toast-${type}`
    }, [
        createElement('span', { className: 'toast-message' }, [message]),
        createElement('button', {
            className: 'toast-close',
            'aria-label': 'Cerrar'
        }, ['×'])
    ]);
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    const timeout = setTimeout(() => removeToast(toast), 4000);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        removeToast(toast);
    });
}

/**
 * Create toast container if not exists
 */
function createToastContainer() {
    const container = createElement('div', {
        id: 'toast-container',
        className: 'toast-container'
    });
    document.body.appendChild(container);
    return container;
}

/**
 * Remove toast element with animation
 */
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
}

/**
 * Clear all child nodes from element
 */
function clearChildren(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}


// =============================================================================
// === SECCIÓN 2: GESTIÓN DE ESTADO (state.js) ================================
// =============================================================================

let state = {
    personas: new Map(),
    empresas: new Map(),
    asignaciones: new Map(),
    pilaAcciones: [],
    punteroAccion: -1
};

/**
 * Initialize/reset all state to default values
 */
function initState() {
    state = {
        personas: new Map(),
        empresas: new Map(),
        asignaciones: new Map(),
        pilaAcciones: [],
        punteroAccion: -1
    };
}

/**
 * Add persona to state
 */
function addPersona(persona) {
    if (!persona.email) throw new Error('Persona must have an email');
    state.personas.set(persona.email, {
        nombre: persona.nombre || '',
        email: persona.email,
        vehiculo: persona.vehiculo || false,
        poblacion: persona.poblacion || '',
        curso: persona.curso || '',
        anotaciones: persona.anotaciones || ''
    });
}

/**
 * Remove persona from state (also unassigns if needed)
 */
function removePersona(email) {
    if (!state.personas.has(email)) throw new Error('Persona not found');
    const persona = state.personas.get(email);
    const action = {
        type: 'removePersona',
        data: { persona },
        undo: () => { state.personas.set(email, persona); }
    };
    state.pilaAcciones = state.pilaAcciones.slice(0, state.punteroAccion + 1);
    state.pilaAcciones.push(action);
    state.punteroAccion = state.pilaAcciones.length - 1;
    // Also unassign if assigned
    if (state.asignaciones.has(email)) {
        state.asignaciones.delete(email);
    }
    state.personas.delete(email);
    saveToStorage();
}

/**
 * Add empresa to state
 */
function addEmpresa(empresa) {
    if (!empresa.nombre) throw new Error('Empresa must have a nombre');
    state.empresas.set(empresa.nombre, {
        nombre: empresa.nombre,
        responsable: empresa.responsable || '',
        email: empresa.email || '',
        direccion: empresa.direccion || '',
        requisitos: empresa.requisitos || '',
        capacidad_1: parseInt(empresa.capacidad_1) || 0,
        capacidad_2: parseInt(empresa.capacidad_2) || 0,
        vehiculo: empresa.vehiculo || false,
        anotaciones: empresa.anotaciones || ''
    });
}

/**
 * Assign a persona to an empresa
 */
function assign(emailPersona, nombreEmpresa) {
    const persona = state.personas.get(emailPersona);
    const empresa = state.empresas.get(nombreEmpresa);
    if (!persona) throw new Error(`Persona not found: ${emailPersona}`);
    if (!empresa) throw new Error(`Empresa not found: ${nombreEmpresa}`);

    const previousEmpresa = state.asignaciones.get(emailPersona);
    const action = {
        type: 'assign',
        data: { emailPersona, nombreEmpresa },
        undo: () => {
            if (previousEmpresa) {
                state.asignaciones.set(emailPersona, previousEmpresa);
            } else {
                state.asignaciones.delete(emailPersona);
            }
        }
    };
    state.pilaAcciones = state.pilaAcciones.slice(0, state.punteroAccion + 1);
    state.pilaAcciones.push(action);
    state.punteroAccion = state.pilaAcciones.length - 1;
    state.asignaciones.set(emailPersona, nombreEmpresa);
    saveToStorage();
}

/**
 * Unassign a persona from their current empresa
 */
function unassign(emailPersona) {
    const previousEmpresa = state.asignaciones.get(emailPersona);
    if (!previousEmpresa) throw new Error(`Persona ${emailPersona} has no assignment to remove`);
    const action = {
        type: 'unassign',
        data: { emailPersona, nombreEmpresa: previousEmpresa },
        undo: () => { state.asignaciones.set(emailPersona, previousEmpresa); }
    };
    state.pilaAcciones = state.pilaAcciones.slice(0, state.punteroAccion + 1);
    state.pilaAcciones.push(action);
    state.punteroAccion = state.pilaAcciones.length - 1;
    state.asignaciones.delete(emailPersona);
    saveToStorage();
}

/**
 * Remove empresa and all its assignments
 */
function removeEmpresa(nombreEmpresa) {
    if (!state.empresas.has(nombreEmpresa)) throw new Error(`Empresa not found: ${nombreEmpresa}`);

    const removedAssignments = [];
    for (const [email, empNombre] of state.asignaciones) {
        if (empNombre === nombreEmpresa) {
            removedAssignments.push({ emailPersona: email, nombreEmpresa: empNombre });
        }
    }

    const action = {
        type: 'removeEmpresa',
        data: {
            empresa: state.empresas.get(nombreEmpresa),
            assignments: [...state.asignaciones.entries()]
                .filter(([, emp]) => emp === nombreEmpresa)
                .map(([email]) => email)
        },
        undo: () => {
            state.empresas.set(action.data.empresa.nombre, action.data.empresa);
            for (const email of action.data.assignments) {
                state.asignaciones.set(email, nombreEmpresa);
            }
        }
    };

    state.pilaAcciones = state.pilaAcciones.slice(0, state.punteroAccion + 1);
    state.pilaAcciones.push(action);
    state.punteroAccion = state.pilaAcciones.length - 1;

    for (const { emailPersona } of removedAssignments) {
        state.asignaciones.delete(emailPersona);
    }
    state.empresas.delete(nombreEmpresa);
    saveToStorage();
    return removedAssignments;
}

/**
 * Undo last action
 */
function undo() {
    if (!canUndo()) return false;
    const action = state.pilaAcciones[state.punteroAccion];
    action.undo();
    state.punteroAccion--;
    saveToStorage();
    return true;
}

/**
 * Redo previously undone action
 */
function redo() {
    if (!canRedo()) return false;
    state.punteroAccion++;
    const action = state.pilaAcciones[state.punteroAccion];
    switch (action.type) {
        case 'assign':
            state.asignaciones.set(action.data.emailPersona, action.data.nombreEmpresa);
            break;
        case 'unassign':
            state.asignaciones.delete(action.data.emailPersona);
            break;
        case 'removeEmpresa':
            state.empresas.set(action.data.empresa.nombre, action.data.empresa);
            for (const email of action.data.assignments) {
                state.asignaciones.set(email, action.data.empresa.nombre);
            }
            break;
    }
    saveToStorage();
    return true;
}

/**
 * Get personas without assignment
 */
function getPersonasSinAsignar() {
    const result = [];
    for (const [email, persona] of state.personas) {
        if (!state.asignaciones.has(email)) result.push(persona);
    }
    return result;
}

/**
 * Get empresas that have assigned personas
 */
function getEmpresasConPersonas() {
    const result = [];
    for (const [nombreEmpresa, empresa] of state.empresas) {
        const personasAsignadas = [];
        for (const [emailPersona, empNombre] of state.asignaciones) {
            if (empNombre === nombreEmpresa) {
                personasAsignadas.push(state.personas.get(emailPersona));
            }
        }
        result.push({ empresa, personas: personasAsignadas });
    }
    return result;
}

function canUndo() { return state.punteroAccion >= 0; }
function canRedo() { return state.punteroAccion < state.pilaAcciones.length - 1; }

function getStateSnapshot() {
    return {
        personas: Array.from(state.personas.entries()),
        empresas: Array.from(state.empresas.entries()),
        asignaciones: Array.from(state.asignaciones.entries())
    };
}

function loadStateSnapshot(snapshot) {
    state = {
        personas: new Map(snapshot.personas),
        empresas: new Map(snapshot.empresas),
        asignaciones: new Map(snapshot.asignaciones),
        pilaAcciones: [],
        punteroAccion: -1
    };
}

// =============================================================================
// === AUTO-GUARDADO CON localStorage ===========================================
// =============================================================================

const STORAGE_KEY = 'marife_session';

function getSnapshot() {
    return {
        personas: Array.from(state.personas.entries()),
        empresas: Array.from(state.empresas.entries()),
        asignaciones: Array.from(state.asignaciones.entries())
    };
}

function saveToStorage() {
    try {
        const snapshot = getSnapshot();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        return JSON.parse(data);
    } catch (e) {
        console.warn('No se pudo cargar de localStorage:', e);
        return null;
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
}

function hasStoredData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}


// =============================================================================
// === SECCIÓN 3: PARSEO CSV (csv.js) ==========================================
// =============================================================================

/**
 * Parse CSV text to array of objects
 */
function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCSVLine(line);
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            let value = j < values.length ? values[j].trim() : '';
            if (value.toLowerCase() === 'true') value = true;
            else if (value.toLowerCase() === 'false' || value === '') value = false;
            obj[headers[j]] = value;
        }
        result.push(obj);
    }
    return result;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (inQuotes) {
            if (char === '"' && nextChar === '"') { current += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { current += char; }
        } else {
            if (char === '"') { inQuotes = true; }
            else if (char === ',') { result.push(current); current = ''; }
            else { current += char; }
        }
    }
    result.push(current);
    return result;
}

/**
 * Extract header row from CSV text
 */
function detectColumns(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    return parseCSVLine(lines[0]).map(h => h.trim());
}


// =============================================================================
// === SECCIÓN 4: MAPEO DE COLUMNAS (mapping.js) ===============================
// =============================================================================

const PERSONAS_REQUIRED_FIELDS = ['nombre', 'email'];
const PERSONAS_OPTIONAL_FIELDS = ['vehiculo', 'poblacion', 'curso', 'anotaciones'];
const EMPRESAS_REQUIRED_FIELDS = ['nombre', 'responsable', 'email'];
const EMPRESAS_OPTIONAL_FIELDS = ['direccion', 'requisitos', 'capacidad_1', 'capacidad_2', 'vehiculo', 'anotaciones'];

function getRequiredFields(tipo) {
    switch (tipo) {
        case 'personas': return [...PERSONAS_REQUIRED_FIELDS];
        case 'empresas': return [...EMPRESAS_REQUIRED_FIELDS];
        default: throw new Error(`Unknown type: ${tipo}`);
    }
}

function getAllFields(tipo) {
    switch (tipo) {
        case 'personas': return [...PERSONAS_REQUIRED_FIELDS, ...PERSONAS_OPTIONAL_FIELDS];
        case 'empresas': return [...EMPRESAS_REQUIRED_FIELDS, ...EMPRESAS_OPTIONAL_FIELDS];
        default: throw new Error(`Unknown type: ${tipo}`);
    }
}

function getFieldLabels(tipo) {
    if (tipo === 'personas') {
        return { nombre: 'Nombre', email: 'Email', vehiculo: 'Vehículo', poblacion: 'Población', curso: 'Curso', anotaciones: 'Anotaciones' };
    } else {
        return { nombre: 'Nombre de Empresa', responsable: 'Persona Responsable', email: 'Email de Empresa', direccion: 'Dirección', requisitos: 'Requisitos', capacidad_1: 'Personas 1º que acoge', capacidad_2: 'Personas 2º que acoge', vehiculo: 'Vehículo', anotaciones: 'Anotaciones' };
    }
}

/**
 * Apply mapping with validation
 */
function applyMapping(mapping, data, tipo) {
    if (!mapping || typeof mapping !== 'object') return { valid: false, error: 'Invalid mapping object' };
    const requiredFields = getRequiredFields(tipo);

    for (const field of requiredFields) {
        if (!mapping[field] || mapping[field] === '') {
            return { valid: false, error: `Debes seleccionar una columna para "${field}"` };
        }
    }

    const mappedData = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const mapped = {};
        for (const [fieldName, headerName] of Object.entries(mapping)) {
            if (!headerName) continue;
            let value = row[headerName];
            if (fieldName === 'vehiculo') {
                const v = String(value).toLowerCase().trim();
                value = v === 'true' || v === '1' || v === 'si' || v === 'yes' || v === 'sí';
            }
            if (fieldName === 'anotaciones') {
                // anotaciones es texto libre, no necesita conversión
            }
            mapped[fieldName] = value;
        }
        for (const field of requiredFields) {
            const value = mapped[field];
            // vehiculo puede ser false (NO), lo cual es válido
            if (field !== 'vehiculo' && (value === '' || value === null || value === undefined)) {
                return { valid: false, error: `Fila ${i + 2}: El campo "${field}" está vacío o es inválido` };
            }
        }
        mappedData.push(mapped);
    }
    return { valid: true, mappedData };
}


// =============================================================================
// === SECCIÓN 5: RENDERIZADO UI (render.js) ===================================
// =============================================================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderAll() {
    renderPersonasPanel();
    renderEmpresasPanel();
    renderStatsBar();
}

function renderStatsBar() {
    const totalPersonas = state.personas.size;
    const personasAsignadas = state.asignaciones.size;
    const personasSinAsignar = totalPersonas - personasAsignadas;
    const totalEmpresas = state.empresas.size;

    const el = $('#stat-total');
    if (el) el.textContent = totalPersonas;
    const el2 = $('#stat-asignadas');
    if (el2) el2.textContent = personasAsignadas;
    const el3 = $('#stat-sin-asignar');
    if (el3) el3.textContent = personasSinAsignar;
    const el4 = $('#stat-empresas');
    if (el4) el4.textContent = totalEmpresas;
}

function renderPersonasPanel() {
    const container = $('#personas-panel');
    if (!container) return;
    const personasSinAsignar = getPersonasSinAsignar();
    const html = renderPersonas(personasSinAsignar);
    const contentEl = container.querySelector('.panel-content');
    if (contentEl) {
        clearChildren(contentEl);
        contentEl.innerHTML = html;
    }
}

function renderEmpresasPanel() {
    const container = $('#empresas-panel');
    if (!container) return;
    const empresasConPersonas = getEmpresasConPersonas();
    const html = renderEmpresas(empresasConPersonas);
    const contentEl = container.querySelector('.panel-content');
    if (contentEl) {
        clearChildren(contentEl);
        contentEl.innerHTML = html;
    }
}

function renderAsignacionesPanel() {
    const container = $('#asignaciones-panel');
    if (!container) return;
    const html = renderAsignacionesSummary();
    const contentEl = container.querySelector('.panel-content');
    if (contentEl) {
        clearChildren(contentEl);
        contentEl.innerHTML = html;
    }
}

function renderPersonas(personas) {
    if (!personas || personas.length === 0) {
        return '<div class="empty-state"><div class="empty-state-icon">👤</div><p>No hay personas sin asignar</p></div>';
    }
    return personas.map(persona => renderCardPersona(persona)).join('');
}

function renderEmpresas(empresas) {
    if (!empresas || empresas.length === 0) {
        return '<div class="empty-state"><div class="empty-state-icon">🏢</div><p>No hay empresas cargadas</p></div>';
    }
    return empresas.map(({ empresa, personas }) => renderCardEmpresa(empresa, personas)).join('');
}

function renderAsignacionesSummary() {
    const empresasConPersonas = getEmpresasConPersonas();
    const totalEmpresas = state.empresas.size;
    const totalPersonas = state.personas.size;
    const personasAsignadas = state.asignaciones.size;
    const personasSinAsignar = totalPersonas - personasAsignadas;

    let html = `
        <div class="stats-summary">
            <div class="stat-item">
                <span class="stat-value">${totalPersonas}</span>
                <span class="stat-label">Total Personas</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${personasAsignadas}</span>
                <span class="stat-label">Asignadas</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${personasSinAsignar}</span>
                <span class="stat-label">Sin Asignar</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalEmpresas}</span>
                <span class="stat-label">Empresas</span>
            </div>
        </div>
    `;

    if (empresasConPersonas.length > 0) {
        html += '<div class="asignaciones-list">';
        for (const { empresa, personas } of empresasConPersonas) {
            html += `
                <div class="assignation-item">
                    <div class="assignation-empresa">🏢 ${escapeHtml(empresa.nombre)}</div>
                    <div class="assignation-personas">
                        ${personas.map(p => {
                            const vehiculoTexto = p.vehiculo ? 'Sí (🚗)' : 'No';
                            const vehiculoClass = p.vehiculo ? 'has-vehicle' : 'no-vehicle';
                            return `
                            <div class="assignation-persona">
                                <span class="persona-tooltip">
                                    <span>👤 ${escapeHtml(p.nombre)}</span>
                                    <div class="tooltip-content">
                                        <div class="tooltip-row">
                                            <span class="tooltip-label">Nombre</span>
                                            <span class="tooltip-value">${escapeHtml(p.nombre)}</span>
                                        </div>
                                        <div class="tooltip-row">
                                            <span class="tooltip-label">Email</span>
                                            <span class="tooltip-value">${escapeHtml(p.email)}</span>
                                        </div>
                                        <div class="tooltip-row">
                                            <span class="tooltip-label">Vehículo</span>
                                            <span class="tooltip-value ${vehiculoClass}">${vehiculoTexto}</span>
                                        </div>
                                        <div class="tooltip-row">
                                            <span class="tooltip-label">Población</span>
                                            <span class="tooltip-value">${escapeHtml(p.poblacion || 'N/A')}</span>
                                        </div>
                                        <div class="tooltip-row">
                                            <span class="tooltip-label">Curso</span>
                                            <span class="tooltip-value">${escapeHtml(p.curso || 'N/A')}</span>
                                        </div>
                                    </div>
                                </span>
                                <span style="color: var(--color-text-secondary)">(${escapeHtml(p.email)})</span>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `;
        }
        html += '</div>';
    }

    if (totalPersonas === 0) {
        return '<div class="empty-state"><div class="empty-state-icon">🔗</div><p>Sin asignaciones</p></div>';
    }
    return html;
}

function renderCardPersona(persona) {
    const vehiculoIcon = persona.vehiculo ? '🚗' : '';
    const vehiculoClass = persona.vehiculo ? 'has-vehicle' : 'no-vehicle';
    const vehiculoTexto = persona.vehiculo ? 'Sí' : 'No';

    return `
        <div class="card persona-card" draggable="true" data-type="persona" data-id="${escapeHtml(persona.email)}" data-curso="${escapeHtml(persona.curso || '')}">
            <div class="persona-card-header">
                <span class="persona-card-icon">👤</span>
                <span class="persona-card-name">${escapeHtml(persona.nombre)}</span>
                <div class="card-header-actions">
                    <button class="btn-icon btn-edit-persona" data-email="${escapeHtml(persona.email)}" title="Editar persona"><i class="ph ph-pencil"></i></button>
                    <button class="btn-remove btn-delete-persona" data-email="${escapeHtml(persona.email)}" title="Eliminar persona">×</button>
                </div>
            </div>
            <div class="persona-card-email">
                <span>${escapeHtml(persona.email)}</span>
                <button class="btn-icon btn-copy" data-copy="${escapeHtml(persona.email)}" title="Copiar email"><i class="ph ph-copy"></i></button>
            </div>
            <div class="persona-card-extra">
                ${vehiculoIcon ? `<span class="persona-card-info">${vehiculoIcon}</span>` : ''}
                ${persona.poblacion ? `<span class="persona-card-info">📍 ${escapeHtml(persona.poblacion)}</span>` : ''}
                ${persona.curso ? `<span class="persona-card-info">🎓 ${escapeHtml(persona.curso)}</span>` : ''}
                ${persona.anotaciones ? `<span class="persona-card-info" title="${escapeHtml(persona.anotaciones)}">📝</span>` : ''}
            </div>
        </div>
    `;
}

function renderCardEmpresa(empresa, personasAsignadas) {
    // Contar personas de 1º y 2º asignados
    const count1 = personasAsignadas.filter(p => p.curso === '1º').length;
    const count2 = personasAsignadas.filter(p => p.curso === '2º' || p.curso === '2º+').length;
    const cap1 = empresa.capacidad_1 || 0;
    const cap2 = empresa.capacidad_2 || 0;

    // Clases para exceso de capacidad
    const class1 = cap1 > 0 && count1 > cap1 ? 'capacidad-exceso' : '';
    const class2 = cap2 > 0 && count2 > cap2 ? 'capacidad-exceso' : '';
    const icon1 = class1 ? '⚠️' : '';
    const icon2 = class2 ? '⚠️' : '';

    return `
        <div class="card empresa-card" data-type="empresa" data-id="${escapeHtml(empresa.nombre)}">
            <div class="empresa-card-header">
                <div class="empresa-card-title">
                    <span class="empresa-card-icon">🏢</span>
                    <span class="empresa-card-name">${escapeHtml(empresa.nombre)}${empresa.vehiculo ? ' 🚗' : ''}</span>
                </div>
                <div class="empresa-card-actions">
                    <button class="btn-icon btn-edit-empresa" data-empresa="${escapeHtml(empresa.nombre)}" title="Editar empresa"><i class="ph ph-pencil"></i></button>
                    <button class="btn-remove btn-delete-empresa"
                            data-empresa="${escapeHtml(empresa.nombre)}"
                            title="Eliminar empresa"
                            ${personasAsignadas.length > 0 ? 'disabled title="Desasigna primero las personas"' : ''}>
                        ×
                    </button>
                </div>
            </div>
            <div class="empresa-card-body">
                <div class="empresa-card-info">
                    ${empresa.responsable ? `<div class="empresa-card-responsible">👤 ${escapeHtml(empresa.responsable)}</div>` : ''}
                    ${empresa.email ? `<div class="empresa-card-email">✉️ <span>${escapeHtml(empresa.email)}</span><button class="btn-icon btn-copy" data-copy="${escapeHtml(empresa.email)}" title="Copiar email"><i class="ph ph-copy"></i></button></div>` : ''}
                    ${empresa.direccion ? `<div class="empresa-card-address">📍 ${escapeHtml(empresa.direccion)}</div>` : ''}
                    ${empresa.requisitos ? `<div class="empresa-card-requirements" title="${escapeHtml(empresa.requisitos)}">📋 ${escapeHtml(empresa.requisitos)}</div>` : ''}
                    ${empresa.anotaciones ? `<div class="empresa-card-anotaciones" title="${escapeHtml(empresa.anotaciones)}">📝 ${escapeHtml(empresa.anotaciones)}</div>` : ''}
                </div>
                <div class="empresa-card-capacidades">
                    <div class="capacidad-item ${class1}">1º: ${icon1}${count1}/${cap1}</div>
                    <div class="capacidad-item ${class2}">2º: ${icon2}${count2}/${cap2}</div>
                </div>
            </div>
            <div class="empresa-card-dropzone drop-zone" data-empresa="${escapeHtml(empresa.nombre)}">
                ${personasAsignadas.length > 0 ? renderAssignedPersons(personasAsignadas) : '<div class="empresa-card-dropzone-empty">Arrastra personas aquí</div>'}
            </div>
        </div>
    `;
}

function renderAssignedPersons(personas) {
    return personas.map(persona => {
        const vehiculoTexto = persona.vehiculo ? 'Sí (🚗)' : 'No';
        const vehiculoClass = persona.vehiculo ? 'has-vehicle' : 'no-vehicle';
        return `
        <div class="persona-assigned" draggable="true" data-type="persona" data-id="${escapeHtml(persona.email)}" data-curso="${escapeHtml(persona.curso || '')}">
            <span class="persona-tooltip">
                <span class="persona-assigned-name">👤 ${escapeHtml(persona.nombre)}</span>
                <div class="tooltip-content">
                    <div class="tooltip-row">
                        <span class="tooltip-label">Nombre</span>
                        <span class="tooltip-value">${escapeHtml(persona.nombre)}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Email</span>
                        <span class="tooltip-value">${escapeHtml(persona.email)}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Vehículo</span>
                        <span class="tooltip-value ${vehiculoClass}">${vehiculoTexto}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Población</span>
                        <span class="tooltip-value">${escapeHtml(persona.poblacion || 'N/A')}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Curso</span>
                        <span class="tooltip-value">${escapeHtml(persona.curso || 'N/A')}</span>
                    </div>
                </div>
            </span>
            <button class="btn-remove btn-unassign" data-email="${escapeHtml(persona.email)}" title="Desasignar">×</button>
        </div>
    `}).join('');
}


// =============================================================================
// === SECCIÓN 6: DRAG & DROP (dragdrop.js) ===================================
// =============================================================================

function initDragDrop() {
    const personasPanel = $('#personas-panel');
    if (personasPanel) {
        makeDropZone(personasPanel, 'personas', 'unassigned');
    }
    setupPersonaCards();
}

function setupPersonaCards() {
    const personaCards = document.querySelectorAll('[data-type="persona"]');
    personaCards.forEach(card => {
        makeDraggable(card, 'persona', card.dataset.id);
    });
}

function makeDraggable(element, type, id) {
    element.setAttribute('draggable', 'true');
    element.dataset.type = type;
    element.dataset.id = id;

    element.addEventListener('dragstart', (e) => {
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
        document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.add('drop-zone-highlight'));
    });

    element.addEventListener('dragend', (e) => {
        element.classList.remove('dragging');
        document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drop-zone-highlight'));
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    });
}

function makeDropZone(element, type, id) {
    element.style.position = 'relative';

    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        element.classList.add('drop-target');
    });

    element.addEventListener('dragleave', (e) => {
        if (element.contains(e.relatedTarget)) return;
        element.classList.remove('drop-target');
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drop-target');
        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (err) { return; }
        handleDrop(data, type, id, element);
    });
}

function handleDrop(data, targetType, targetId, targetElement) {
    const { type, id } = data;
    if (type === 'persona') {
        if (targetType === 'empresa') {
            handleAssign(id, targetId);
        } else if (targetType === 'personas') {
            handleUnassign(id);
        }
    }
}

function handleAssign(personaEmail, empresaNombre) {
    try {
        assign(personaEmail, empresaNombre);
        renderAll();
        setupInteractionHandlers();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}

function handleUnassign(personaEmail) {
    try {
        unassign(personaEmail);
        renderAll();
        setupInteractionHandlers();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}

function setupEmpresaDropZones() {
    const dropZones = document.querySelectorAll('.drop-zone[data-empresa]');
    dropZones.forEach(zone => {
        const empresaNombre = zone.dataset.empresa;
        makeDropZone(zone, 'empresa', empresaNombre);
    });
}

function setupUnassignButtons() {
    const buttons = document.querySelectorAll('.btn-unassign');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleUnassign(btn.dataset.email);
        });
    });
}

function setupDeleteEmpresaButtons() {
    const buttons = document.querySelectorAll('.btn-delete-empresa');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteEmpresa(btn.dataset.empresa);
        });
    });
}

function handleDeleteEmpresa(empresaNombre) {
    let hasAssignments = false;
    for (const emp of state.asignaciones.values()) {
        if (emp === empresaNombre) { hasAssignments = true; break; }
    }
    if (hasAssignments) {
        if (confirm(`¿Eliminar "${empresaNombre}" y todas sus asignaciones?`)) {
            doDeleteEmpresa(empresaNombre);
        }
    } else {
        doDeleteEmpresa(empresaNombre);
    }
}

function doDeleteEmpresa(empresaNombre) {
    try {
        removeEmpresa(empresaNombre);
        renderAll();
        setupInteractionHandlers();
        showToast('Empresa eliminada', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}

function handleDeletePersona(email) {
    const persona = state.personas.get(email);
    if (!persona) return;
    if (confirm(`¿Eliminar a "${persona.nombre}"?`)) {
        doDeletePersona(email);
    }
}

function handleEditPersona(email) {
    const persona = state.personas.get(email);
    if (!persona) return;
    showAddFormModal('persona', persona);
}

function handleEditEmpresa(nombre) {
    const empresa = state.empresas.get(nombre);
    if (!empresa) return;
    showAddFormModal('empresa', empresa);
}

function doDeletePersona(email) {
    try {
        removePersona(email);
        renderAll();
        setupInteractionHandlers();
        showToast('Persona eliminada', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    }
}

let currentFormType = null;
let currentEditEmail = null;
let currentEditNombre = null;

function showAddFormModal(tipo, data = null) {
    currentFormType = tipo;
    currentEditEmail = data?.email || null;
    currentEditNombre = data?.nombre || null;

    const isEdit = data !== null;
    $('#form-title').textContent = isEdit
        ? (tipo === 'persona' ? 'Editar Persona' : 'Editar Empresa')
        : (tipo === 'persona' ? 'Añadir Persona' : 'Añadir Empresa');

    $('#form-fields').innerHTML = buildFormFields(tipo, data);

    // Disable email/nombre editing for existing records
    if (isEdit) {
        const emailInput = $('#fg-email');
        const nombreInput = $('#fg-nombre');
        if (emailInput) emailInput.disabled = true;
        if (nombreInput) nombreInput.disabled = true;
    }

    showModal('form-modal-backdrop');
}

function buildFormFields(tipo, data = null) {
    const d = data || {};
    if (tipo === 'persona') {
        return `
            <div class="form-group"><label>Nombre *</label><input type="text" id="fg-nombre" required value="${escapeHtml(d.nombre || '')}"></div>
            <div class="form-group"><label>Email *</label><input type="email" id="fg-email" required value="${escapeHtml(d.email || '')}"></div>
            <div class="form-group"><label>Vehículo</label><select id="fg-vehiculo"><option value="false" ${!d.vehiculo ? 'selected' : ''}>No</option><option value="true" ${d.vehiculo ? 'selected' : ''}>Sí</option></select></div>
            <div class="form-group"><label>Población</label><input type="text" id="fg-poblacion" value="${escapeHtml(d.poblacion || '')}"></div>
            <div class="form-group"><label>Curso</label><select id="fg-curso"><option value="">-- Seleccionar --</option><option value="1º" ${d.curso === '1º' ? 'selected' : ''}>1º</option><option value="2º" ${d.curso === '2º' ? 'selected' : ''}>2º</option><option value="2º+" ${d.curso === '2º+' ? 'selected' : ''}>2º+</option></select></div>
            <div class="form-group"><label>Anotaciones</label><textarea id="fg-anotaciones" rows="2">${escapeHtml(d.anotaciones || '')}</textarea></div>
        `;
    } else {
        return `
            <div class="form-group"><label>Nombre *</label><input type="text" id="fg-nombre" required value="${escapeHtml(d.nombre || '')}"></div>
            <div class="form-group"><label>Responsable *</label><input type="text" id="fg-responsable" required value="${escapeHtml(d.responsable || '')}"></div>
            <div class="form-group"><label>Email *</label><input type="email" id="fg-email" required value="${escapeHtml(d.email || '')}"></div>
            <div class="form-group"><label>Dirección</label><input type="text" id="fg-direccion" value="${escapeHtml(d.direccion || '')}"></div>
            <div class="form-group"><label>Requisitos</label><input type="text" id="fg-requisitos" value="${escapeHtml(d.requisitos || '')}"></div>
            <div class="form-group"><label>Personas 1º que acoge</label><input type="number" id="fg-capacidad_1" min="0" value="${d.capacidad_1 || 0}"></div>
            <div class="form-group"><label>Personas 2º que acoge</label><input type="number" id="fg-capacidad_2" min="0" value="${d.capacidad_2 || 0}"></div>
            <div class="form-group"><label>Vehículo</label><select id="fg-vehiculo"><option value="false" ${!d.vehiculo ? 'selected' : ''}>No</option><option value="true" ${d.vehiculo ? 'selected' : ''}>Sí</option></select></div>
            <div class="form-group"><label>Anotaciones</label><textarea id="fg-anotaciones" rows="2">${escapeHtml(d.anotaciones || '')}</textarea></div>
        `;
    }
}

function submitForm() {
    const tipo = currentFormType;
    if (!tipo) return;

    if (tipo === 'persona') {
        const nombre = $('#fg-nombre')?.value.trim();
        const email = $('#fg-email')?.value.trim();
        if (!nombre || !email) { showToast('Nombre y email son obligatorios', 'error'); return; }

        if (currentEditEmail) {
            // Editing existing persona
            const persona = state.personas.get(currentEditEmail);
            if (persona) {
                persona.nombre = nombre;
                persona.vehiculo = $('#fg-vehiculo')?.value === 'true';
                persona.poblacion = $('#fg-poblacion')?.value.trim();
                persona.curso = $('#fg-curso')?.value;
                persona.anotaciones = $('#fg-anotaciones')?.value.trim();
                // If email changed, we need to update the key (not common case)
                if (currentEditEmail !== email) {
                    state.personas.delete(currentEditEmail);
                    persona.email = email;
                    state.personas.set(email, persona);
                    // Update assignments if email changed
                    if (state.asignaciones.has(currentEditEmail)) {
                        const emp = state.asignaciones.get(currentEditEmail);
                        state.asignaciones.delete(currentEditEmail);
                        state.asignaciones.set(email, emp);
                    }
                }
                showToast('Persona actualizada', 'success');
            }
        } else {
            // Adding new persona
            if (state.personas.has(email)) { showToast('Ya existe una persona con ese email', 'error'); return; }
            addPersona({
                nombre,
                email,
                vehiculo: $('#fg-vehiculo')?.value === 'true',
                poblacion: $('#fg-poblacion')?.value.trim(),
                curso: $('#fg-curso')?.value,
                anotaciones: $('#fg-anotaciones')?.value.trim()
            });
            showToast('Persona añadida', 'success');
        }
    } else {
        const nombre = $('#fg-nombre')?.value.trim();
        const responsable = $('#fg-responsable')?.value.trim();
        const email = $('#fg-email')?.value.trim();
        if (!nombre || !responsable || !email) { showToast('Nombre, responsable y email son obligatorios', 'error'); return; }

        if (currentEditNombre) {
            // Editing existing empresa
            const empresa = state.empresas.get(currentEditNombre);
            if (empresa) {
                empresa.nombre = nombre;
                empresa.responsable = responsable;
                empresa.email = email;
                empresa.direccion = $('#fg-direccion')?.value.trim();
                empresa.requisitos = $('#fg-requisitos')?.value.trim();
                empresa.capacidad_1 = parseInt($('#fg-capacidad_1')?.value) || 0;
                empresa.capacidad_2 = parseInt($('#fg-capacidad_2')?.value) || 0;
                empresa.vehiculo = $('#fg-vehiculo')?.value === 'true';
                empresa.anotaciones = $('#fg-anotaciones')?.value.trim();
                // If nombre changed, we need to update the key
                if (currentEditNombre !== nombre) {
                    state.empresas.delete(currentEditNombre);
                    state.empresas.set(nombre, empresa);
                    // Update assignments if nombre changed
                    for (const [personaEmail, empNombre] of state.asignaciones) {
                        if (empNombre === currentEditNombre) {
                            state.asignaciones.set(personaEmail, nombre);
                        }
                    }
                }
                showToast('Empresa actualizada', 'success');
            }
        } else {
            // Adding new empresa
            if (state.empresas.has(nombre)) { showToast('Ya existe una empresa con ese nombre', 'error'); return; }
            addEmpresa({
                nombre,
                responsable,
                email,
                direccion: $('#fg-direccion')?.value.trim(),
                requisitos: $('#fg-requisitos')?.value.trim(),
                capacidad_1: $('#fg-capacidad_1')?.value || 0,
                capacidad_2: $('#fg-capacidad_2')?.value || 0,
                vehiculo: $('#fg-vehiculo')?.value === 'true',
                anotaciones: $('#fg-anotaciones')?.value.trim()
            });
            showToast('Empresa añadida', 'success');
        }
    }
    hideModal('form-modal-backdrop');
    renderAll();
    setupInteractionHandlers();
    saveToStorage();
    currentFormType = null;
    currentEditEmail = null;
    currentEditNombre = null;
}

function setupInteractionHandlers() {
    setupPersonaCards();
    setupEmpresaDropZones();
    setupUnassignButtons();
    setupDeleteEmpresaButtons();
}


// =============================================================================
// === SECCIÓN 7: IMPORT/EXPORT (export.js) ===================================
// =============================================================================

function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function exportAssignmentsCSV() {
    // Exportar asignaciones ya no es necesario - la sesión JSON cubre esta funcionalidad
    showToast('Usa Guardar Sesión para exportar todos los datos', 'info');
}

function exportPersonasCSV() {
    const rows = [['nombre', 'email', 'vehiculo', 'poblacion', 'curso', 'anotaciones']];
    for (const p of state.personas.values()) {
        rows.push([
            escapeCSV(p.nombre),
            escapeCSV(p.email),
            p.vehiculo ? 'SI' : 'NO',
            escapeCSV(p.poblacion),
            escapeCSV(p.curso),
            escapeCSV(p.anotaciones)
        ]);
    }
    const csv = rows.map(row => row.join(',')).join('\n');
    downloadFile(csv, 'personas.csv', 'text/csv;charset=utf-8');
}

function exportEmpresasCSV() {
    const rows = [['nombre', 'responsable', 'email', 'direccion', 'requisitos', 'capacidad_1', 'capacidad_2', 'vehiculo', 'anotaciones']];
    for (const e of state.empresas.values()) {
        rows.push([
            escapeCSV(e.nombre),
            escapeCSV(e.responsable),
            escapeCSV(e.email),
            escapeCSV(e.direccion),
            escapeCSV(e.requisitos),
            e.capacidad_1,
            e.capacidad_2,
            e.vehiculo ? 'SI' : 'NO',
            escapeCSV(e.anotaciones)
        ]);
    }
    const csv = rows.map(row => row.join(',')).join('\n');
    downloadFile(csv, 'empresas.csv', 'text/csv;charset=utf-8');
}

function exportSessionJSON() {
    const snapshot = {
        version: 1,
        timestamp: new Date().toISOString(),
        personas: Array.from(state.personas.entries()),
        empresas: Array.from(state.empresas.entries()),
        asignaciones: Array.from(state.asignaciones.entries())
    };
    const json = JSON.stringify(snapshot, null, 2);
    downloadFile(json, 'marife-session.json', 'application/json;charset=utf-8');
}

async function importSessionJSON(file) {
    try {
        const text = await readFile(file);
        const data = JSON.parse(text);
        if (!data.version || !Array.isArray(data.personas) || !Array.isArray(data.empresas)) {
            return { success: false, error: 'Invalid session file format' };
        }
        loadStateSnapshot(data);
        return { success: true };
    } catch (err) {
        if (err instanceof SyntaxError) return { success: false, error: 'Invalid JSON format' };
        return { success: false, error: err.message };
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'UTF-8');
    });
}


// =============================================================================
// === SECCIÓN 8: APLICACIÓN PRINCIPAL (app.js) ================================
// =============================================================================

const APP = {
    currentMapping: null,
    currentCSVText: null,

    init() {
        initDragDrop();
        initState();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.checkStoredSession();
    },

    /**
     * Check if there's a stored session and ask to restore
     */
    checkStoredSession() {
        const stored = loadFromStorage();
        if (stored && (stored.personas.length > 0 || stored.empresas.length > 0)) {
            if (confirm('Se encontró una sesión guardada. ¿Desea recuperarla?\n\nAceptar = recuperar sesión\nCancelar = empezar desde cero')) {
                loadStateSnapshot(stored);
                renderAll();
                setupInteractionHandlers();
                showToast('Sesión restaurada', 'success');
            } else {
                clearStorage();
            }
        } else {
            renderAll();
        }
    },

    bindEvents() {
        // Header buttons
        $('#btn-load-personas')?.addEventListener('click', () => this.triggerFileInput('personas'));
        $('#btn-add-persona')?.addEventListener('click', () => showAddFormModal('persona'));
        $('#btn-load-empresas')?.addEventListener('click', () => this.triggerFileInput('empresas'));
        $('#btn-add-empresa')?.addEventListener('click', () => showAddFormModal('empresa'));
        $('#btn-save-personas')?.addEventListener('click', () => exportPersonasCSV());
        $('#btn-save-empresas')?.addEventListener('click', () => exportEmpresasCSV());
        $('#btn-export')?.addEventListener('click', () => this.handleExport());
        $('#btn-save')?.addEventListener('click', () => this.handleSave());
        $('#btn-load-session')?.addEventListener('click', () => this.triggerFileInput('session'));

        // Inline add buttons in panel titles
        $('#btn-add-persona-inline')?.addEventListener('click', () => showAddFormModal('persona'));
        $('#btn-add-empresa-inline')?.addEventListener('click', () => showAddFormModal('empresa'));

        // Hidden file inputs
        $('#file-personas')?.addEventListener('change', (e) => this.handleFileSelect(e, 'personas'));
        $('#file-empresas')?.addEventListener('change', (e) => this.handleFileSelect(e, 'empresas'));
        $('#file-session')?.addEventListener('change', (e) => this.handleSessionFile(e));

        // Modal close buttons
        $('#mapping-modal-close')?.addEventListener('click', () => hideModal('mapping-modal-backdrop'));
        $('#mapping-cancel')?.addEventListener('click', () => hideModal('mapping-modal-backdrop'));
        $('#mapping-apply')?.addEventListener('click', () => this.confirmMapping());
        $('#confirm-modal-close')?.addEventListener('click', () => hideModal('confirm-modal-backdrop'));
        $('#confirm-cancel')?.addEventListener('click', () => this.cancelConfirmation());
        $('#error-modal-close')?.addEventListener('click', () => hideModal('error-modal-backdrop'));
        $('#error-ok')?.addEventListener('click', () => hideModal('error-modal-backdrop'));
        $('#form-modal-close')?.addEventListener('click', () => hideModal('form-modal-backdrop'));
        $('#form-cancel')?.addEventListener('click', () => hideModal('form-modal-backdrop'));
        $('#form-ok')?.addEventListener('click', () => submitForm());

        // Delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-unassign')) {
                handleUnassign(e.target.dataset.email);
            }
            if (e.target.classList.contains('btn-delete-persona')) {
                handleDeletePersona(e.target.dataset.email);
            }
            if (e.target.classList.contains('btn-delete-empresa')) {
                handleDeleteEmpresa(e.target.dataset.empresa);
            }
            if (e.target.classList.contains('btn-edit-persona') || e.target.closest('.btn-edit-persona')) {
                const btn = e.target.closest('.btn-edit-persona');
                handleEditPersona(btn.dataset.email);
            }
            if (e.target.classList.contains('btn-edit-empresa') || e.target.closest('.btn-edit-empresa')) {
                const btn = e.target.closest('.btn-edit-empresa');
                handleEditEmpresa(btn.dataset.empresa);
            }
            if (e.target.classList.contains('btn-copy') || e.target.closest('.btn-copy')) {
                const btn = e.target.closest('.btn-copy');
                navigator.clipboard.writeText(btn.dataset.copy).then(() => {
                    showToast('Copiado al portapapeles', 'success');
                });
            }
        });

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (state.personas.size > 0 || state.empresas.size > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.handleUndo(); }
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { e.preventDefault(); this.handleRedo(); }
        });
    },

    triggerFileInput(type) {
        const inputId = `file-${type}`;
        const input = $(`#${inputId}`);
        if (input) input.click();
    },

    handleFileSelect(e, type) {
        const file = e.target.files?.[0];
        if (file) this.loadFile(file, type);
        e.target.value = '';
    },

    async loadFile(file, type) {
        try {
            const text = await file.text();
            this.currentCSVText = text;
            const headers = detectColumns(text);
            if (headers.length === 0) { showToast('No se pudo leer el archivo CSV', 'error'); return; }
            this.currentMapping = { tipo: type, filename: file.name };
            this.buildMappingModalUI(type, headers);
            showModal('mapping-modal-backdrop');
        } catch (err) {
            showToast(`Error leyendo archivo: ${err.message}`, 'error');
        }
    },

    buildMappingModalUI(tipo, headers) {
        const previewTable = $('#mapping-preview-table');
        const fieldsContainer = $('#mapping-fields');
        if (!previewTable || !fieldsContainer) return;

        // Preview header row
        const thead = previewTable.querySelector('thead');
        const tbody = previewTable.querySelector('tbody');
        if (thead) thead.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
        if (tbody) {
            const lines = this.currentCSVText.trim().split(/\r?\n/);
            if (lines.length > 1) {
                const values = this.parseCSVLine(lines[1]);
                tbody.innerHTML = `<tr>${values.map(v => `<td>${escapeHtml(v)}</td>`).join('')}</tr>`;
            } else { tbody.innerHTML = ''; }
        }

        // Mapping fields
        const allFields = getAllFields(tipo);
        const requiredFields = getRequiredFields(tipo);
        clearChildren(fieldsContainer);

        for (const field of allFields) {
            const row = document.createElement('div');
            row.className = 'mapping-field';

            const label = document.createElement('label');
            label.className = 'mapping-field-label';
            const isRequired = requiredFields.includes(field);
            label.innerHTML = `${getFieldLabels(tipo)[field] || field}${isRequired ? ' <span class="required">*</span>' : ''}`;
            label.htmlFor = `mapping-${field}`;

            const select = document.createElement('select');
            select.id = `mapping-${field}`;
            select.className = 'mapping-field-select';
            select.dataset.field = field;

            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '-- Seleccionar --';
            select.appendChild(emptyOpt);

            for (const header of headers) {
                const opt = document.createElement('option');
                opt.value = header;
                opt.textContent = header;
                select.appendChild(opt);
            }

            row.appendChild(label);
            row.appendChild(select);
            fieldsContainer.appendChild(row);
        }
    },

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            if (inQuotes) {
                if (char === '"' && nextChar === '"') { current += '"'; i++; }
                else if (char === '"') { inQuotes = false; }
                else { current += char; }
            } else {
                if (char === '"') { inQuotes = true; }
                else if (char === ',') { result.push(current.trim()); current = ''; }
                else { current += char; }
            }
        }
        result.push(current.trim());
        return result;
    },

    confirmMapping() {
        const selects = document.querySelectorAll('.mapping-select, .mapping-field-select');
        const mapping = {};
        for (const select of selects) {
            const field = select.dataset.field;
            const value = select.value;
            mapping[field] = value;
        }
        // Only validate required fields
        const requiredFields = getRequiredFields(this.currentMapping.tipo);
        for (const field of requiredFields) {
            if (!mapping[field] || mapping[field] === '') {
                showToast(`Por favor, selecciona una columna para "${getFieldLabels(this.currentMapping.tipo)[field]}"`, 'error');
                return;
            }
        }
        hideModal('mapping-modal-backdrop');
        this.processMappedCSV(mapping);
    },

    processMappedCSV(mapping) {
        try {
            const data = parseCSV(this.currentCSVText);
            if (data.length === 0) { showToast('No se encontraron datos en el archivo', 'error'); return; }
            const result = applyMapping(mapping, data, this.currentMapping.tipo);
            if (!result.valid) { this.showErrorModal(result.error); return; }

            if (this.currentMapping.tipo === 'personas') {
                this.loadPersonasData(result.mappedData);
            } else {
                this.loadEmpresasData(result.mappedData);
            }
        } catch (err) {
            showToast(`Error procesando CSV: ${err.message}`, 'error');
        }
    },

    loadPersonasData(personas) {
        let added = 0;
        for (const persona of personas) {
            if (persona.nombre && persona.email) {
                if (!state.personas.has(persona.email)) {
                    addPersona(persona);
                    added++;
                }
            }
        }
        renderAll();
        showToast(`${added} personas añadidas`, 'success');
        setupInteractionHandlers();
        saveToStorage();
        showToast(`${personas.length} personas cargadas`, 'success');
    },

    loadEmpresasData(empresas) {
        let added = 0;
        for (const empresa of empresas) {
            if (empresa.nombre) {
                if (!state.empresas.has(empresa.nombre)) {
                    addEmpresa(empresa);
                    added++;
                }
            }
        }
        renderAll();
        setupInteractionHandlers();
        saveToStorage();
        showToast(`${added} empresas añadidas`, 'success');
    },

    showConfirmModal(title, message, onConfirm) {
        $('#confirm-title').textContent = title;
        $('#confirm-message').textContent = message;
        $('#confirm-warning').textContent = '';
        $('#confirm-ok').onclick = () => { hideModal('confirm-modal-backdrop'); onConfirm(); };
        showModal('confirm-modal-backdrop');
    },

    cancelConfirmation() { hideModal('confirm-modal-backdrop'); },

    showErrorModal(message) {
        const errorList = $('#error-list');
        if (errorList) { clearChildren(errorList); const li = document.createElement('li'); li.textContent = message; li.className = 'error-item'; errorList.appendChild(li); }
        showModal('error-modal-backdrop');
    },

    async handleSessionFile(e) {
        const file = e.target.files?.[0];
        if (file) {
            if (state.personas.size > 0 || state.empresas.size > 0) {
                this.showConfirmModal('Cargar sesión', 'Esto reemplazará todos los datos actuales. ¿Continuar?', () => this.doLoadSession(file));
            } else {
                await this.doLoadSession(file);
            }
        }
        e.target.value = '';
    },

    async doLoadSession(file) {
        const result = await importSessionJSON(file);
        if (result.success) {
            renderAll();
            setupInteractionHandlers();
            showToast('Sesión cargada correctamente', 'success');
        } else {
            showToast(`Error cargando sesión: ${result.error}`, 'error');
        }
    },

    handleExport() {
        if (state.asignaciones.size === 0) { showToast('No hay asignaciones para exportar', 'warning'); return; }
        try { exportAssignmentsCSV(); showToast('Asignaciones exportadas', 'success'); }
        catch (err) { showToast(`Error exportando: ${err.message}`, 'error'); }
    },

    handleSave() {
        try { exportSessionJSON(); showToast('Sesión guardada', 'success'); }
        catch (err) { showToast(`Error guardando sesión: ${err.message}`, 'error'); }
    },

    handleUndo() { if (canUndo()) { undo(); renderAll(); setupInteractionHandlers(); } },
    handleRedo() { if (canRedo()) { redo(); renderAll(); setupInteractionHandlers(); } }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => { APP.init(); });
