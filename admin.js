// ==========================================================
// CONTROLADOR DEL MÓDULO ADMINISTRATIVO Y RECEPCIÓN
// Clínica Su Salud - Conexión Supabase & Control de Caja ($50 USD)
// ==========================================================

const CONSULTATION_FEE_USD = 50;

// Estado en memoria
let allAppointments = [];
let paymentsMap = {};
let activePaymentFilter = "all"; // 'all', 'paid', 'unpaid'
let activeStatusFilter = "all";
let activeSearchQuery = "";
let isSupabaseOnline = false;

// Elementos DOM
const themeToggle = document.getElementById("theme-toggle");
const clockDisplay = document.getElementById("clock-display");
const connectionBadge = document.getElementById("connection-badge");
const refreshBtn = document.getElementById("btn-refresh-data");
const searchInput = document.getElementById("patient-search");
const paymentFilterChips = document.querySelectorAll("[data-pay-filter]");
const statusFilterChips = document.querySelectorAll("[data-status-filter]");
const revenueDoctorFilter = document.getElementById("revenue-doctor-filter");
const revenueDonut = document.getElementById("revenue-donut");
const revenueDonutSegments = document.getElementById("revenue-donut-segments");
const revenueDonutTotal = document.getElementById("revenue-donut-total");
const revenueDonutCaption = document.getElementById("revenue-donut-caption");
const revenueDonutTitle = document.getElementById("revenue-donut-title");
const revenueDonutSubtitle = document.getElementById("revenue-donut-subtitle");
const revenueChartLegend = document.getElementById("revenue-chart-legend");
const revenueBarsTitle = document.getElementById("revenue-bars-title");
const revenueBarsSubtitle = document.getElementById("revenue-bars-subtitle");
const revenueBars = document.getElementById("revenue-bars");

// Elementos KPI
const kpiTotalPatients = document.getElementById("kpi-total-patients");
const kpiTotalPaid = document.getElementById("kpi-total-paid");
const kpiTotalPending = document.getElementById("kpi-total-pending");
const kpiTodayAppts = document.getElementById("kpi-today-appts");
const tableCountBadge = document.getElementById("table-count-badge");

// Tabla y contenedores
const patientsTableBody = document.getElementById("patients-table-body");
const emptyStateContainer = document.getElementById("empty-state-container");
const btnSeedDemo = document.getElementById("btn-seed-demo");

// Modal de Recibo
const receiptModal = document.getElementById("receipt-modal");
const btnCloseReceipt = document.getElementById("btn-close-receipt");
const btnPrintReceipt = document.getElementById("btn-print-receipt");

// ==========================================================
// GESTIÓN DEL TEMA OSCURO / CLARO (CAMBIO TOTAL DE PÁGINA)
// ==========================================================
function updateTheme(isDark) {
    document.body.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.setAttribute("aria-label", isDark ? "Activar tema claro" : "Activar tema oscuro");
        const icon = themeToggle.querySelector(".theme-icon");
        const label = themeToggle.querySelector(".theme-label");
        if (icon) icon.textContent = isDark ? "☀" : "☾";
        if (label) label.textContent = isDark ? "Tema claro" : "Tema oscuro";
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? "#061110" : "#f3f8f7";
}

// Inicializar tema inmediatamente
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialIsDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
updateTheme(initialIsDark);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isDark = document.body.dataset.theme !== "dark";
        updateTheme(isDark);
    });
}

// ==========================================================
// RELOJ DIGITAL EN VIVO
// ==========================================================
function initClock() {
    function update() {
        const now = new Date();
        if (clockDisplay) {
            clockDisplay.textContent = now.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        }
    }
    update();
    setInterval(update, 1000);
}

// ==========================================================
// PERSISTENCIA DE PAGOS ($50 USD)
// ==========================================================
function loadPaymentsMap() {
    try {
        const raw = localStorage.getItem("hospital_payments_v2");
        paymentsMap = raw ? JSON.parse(raw) : {};
    } catch (_err) {
        paymentsMap = {};
    }
}

function savePaymentsMap() {
    try {
        localStorage.setItem("hospital_payments_v2", JSON.stringify(paymentsMap));
    } catch (_err) {
        console.warn("No se pudo guardar paymentsMap localmente", _err);
    }
}

function getAppointmentPayment(apptId, dbPaidField = null) {
    if (paymentsMap[apptId]) {
        return paymentsMap[apptId];
    }
    // Si viene de la base de datos con algún campo
    const isPaid = dbPaidField === true || dbPaidField === "Pagado";
    return {
        paid: isPaid,
        method: isPaid ? "Efectivo / Caja" : null,
        paidAt: isPaid ? new Date().toISOString() : null
    };
}

async function setAppointmentPayment(apptId, paid, method = "Efectivo / Caja") {
    paymentsMap[apptId] = {
        paid,
        method: paid ? method : null,
        paidAt: paid ? new Date().toISOString() : null
    };
    savePaymentsMap();

    // Intentar sincronizar con Supabase si la columna existe en citas
    try {
        if (typeof getSupabaseClient === "function") {
            const client = await getSupabaseClient();
            await client
                .from("citas")
                .update({ 
                    payment_status: paid ? "Pagado" : "Pendiente" 
                })
                .eq("id", apptId);
        }
    } catch (_e) {
        // Silencioso si la columna no existe en el esquema original
    }

    renderDashboard();
}

// ==========================================================
// CARGA DE DATOS DESDE SUPABASE
// ==========================================================
async function loadAppointmentsFromSupabase() {
    if (connectionBadge) {
        connectionBadge.innerHTML = '<span class="live-pulse-dot" style="background:#f59e0b;"></span><span>Sincronizando con Supabase...</span>';
    }

    try {
        if (typeof apiGetAppointments !== "function") {
            throw new Error("El cliente de Supabase no está cargado.");
        }

        // apiGetAppointments(null) obtiene todas las citas sin filtrar por doctor
        const data = await apiGetAppointments(null);
        allAppointments = Array.isArray(data) ? data : [];
        isSupabaseOnline = true;

        if (connectionBadge) {
            connectionBadge.innerHTML = '<span class="live-pulse-dot"></span><span>Conectado en Tiempo Real</span>';
            connectionBadge.style.color = "";
        }
    } catch (error) {
        console.error("Error al cargar citas de Supabase:", error);
        isSupabaseOnline = false;

        if (connectionBadge) {
            connectionBadge.innerHTML = '<span class="live-pulse-dot" style="background:#ef4444;"></span><span>Modo Respaldo / Error Supabase</span>';
            connectionBadge.style.color = "#ef4444";
        }

        // Respaldo en localStorage si Supabase falla
        try {
            const localRaw = localStorage.getItem("citas_locales_backup");
            allAppointments = localRaw ? JSON.parse(localRaw) : [];
        } catch (_e) {
            allAppointments = [];
        }
    }

    renderDashboard();
}

// ==========================================================
// RENDERIZADO DEL DASHBOARD & FILTROS
// ==========================================================
function renderDashboard() {
    const todayStr = new Date().toISOString().split("T")[0];

    // Cálculos de KPI
    const totalCount = allAppointments.length;
    let paidCount = 0;
    let pendingCount = 0;
    let todayCount = 0;

    allAppointments.forEach((appt) => {
        const payInfo = getAppointmentPayment(appt.id, appt.payment_status || appt.paid);
        if (payInfo.paid) {
            paidCount++;
        } else {
            pendingCount++;
        }
        if (appt.date === todayStr) {
            todayCount++;
        }
    });

    const totalCollectedUsd = paidCount * CONSULTATION_FEE_USD;
    const totalPendingUsd = pendingCount * CONSULTATION_FEE_USD;

    // Actualizar KPI
    if (kpiTotalPatients) kpiTotalPatients.textContent = totalCount;
    if (kpiTotalPaid) kpiTotalPaid.textContent = `$${totalCollectedUsd.toLocaleString()} USD`;
    if (kpiTotalPending) kpiTotalPending.textContent = `$${totalPendingUsd.toLocaleString()} USD`;
    if (kpiTodayAppts) kpiTodayAppts.textContent = todayCount;

    renderRevenueCharts();

    // Filtrar citas
    let filtered = [...allAppointments];

    // Filtro por Estado de Pago
    if (activePaymentFilter === "paid") {
        filtered = filtered.filter((a) => {
            const pay = getAppointmentPayment(a.id, a.payment_status || a.paid);
            return pay.paid;
        });
    } else if (activePaymentFilter === "unpaid") {
        filtered = filtered.filter((a) => {
            const pay = getAppointmentPayment(a.id, a.payment_status || a.paid);
            return !pay.paid;
        });
    }

    // Filtro por Estado de Cita
    if (activeStatusFilter === "today") {
        filtered = filtered.filter((a) => a.date === todayStr);
    } else if (activeStatusFilter !== "all") {
        filtered = filtered.filter((a) => a.status === activeStatusFilter);
    }

    // Filtro por Búsqueda
    if (activeSearchQuery) {
        const q = activeSearchQuery.toLowerCase();
        filtered = filtered.filter((a) => (
            (a.patientName && a.patientName.toLowerCase().includes(q)) ||
            (a.patientPhone && a.patientPhone.toLowerCase().includes(q)) ||
            (a.patientEmail && a.patientEmail.toLowerCase().includes(q)) ||
            (a.doctorName && a.doctorName.toLowerCase().includes(q)) ||
            (a.specialty && a.specialty.toLowerCase().includes(q)) ||
            (a.code && a.code.toLowerCase().includes(q)) ||
            (a.notes && a.notes.toLowerCase().includes(q))
        ));
    }

    if (tableCountBadge) {
        tableCountBadge.textContent = `${filtered.length} paciente${filtered.length === 1 ? "" : "s"}`;
    }

    renderTableRows(filtered);
}

function formatRevenueUsd(amount) {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD`;
}

function renderRevenueCharts() {
    if (!revenueDoctorFilter || !revenueDonutSegments || !revenueBars) return;

    const doctorRevenue = new Map();
    allAppointments.forEach((appt) => {
        const payInfo = getAppointmentPayment(appt.id, appt.payment_status || appt.paid);
        if (appt.status === "Cancelada" && !payInfo.paid) return;
        const name = appt.doctorName || "Especialista";
        const totals = doctorRevenue.get(name) || { paid: 0, pending: 0 };
        totals[payInfo.paid ? "paid" : "pending"] += CONSULTATION_FEE_USD;
        doctorRevenue.set(name, totals);
    });

    const selectedDoctor = revenueDoctorFilter.value;
    const doctorNames = [...doctorRevenue.keys()].sort((a, b) => a.localeCompare(b, "es"));
    if (revenueDoctorFilter.options.length !== doctorNames.length + 1 ||
        doctorNames.some((name, index) => revenueDoctorFilter.options[index + 1]?.value !== name)) {
        revenueDoctorFilter.replaceChildren(new Option("Toda la clínica", "all"));
        doctorNames.forEach((name) => revenueDoctorFilter.add(new Option(name, name)));
        revenueDoctorFilter.value = doctorRevenue.has(selectedDoctor) ? selectedDoctor : "all";
    }

    const isDoctorSelected = revenueDoctorFilter.value !== "all";
    const selectedTotals = isDoctorSelected
        ? doctorRevenue.get(revenueDoctorFilter.value) || { paid: 0, pending: 0 }
        : [...doctorRevenue.values()].reduce((sum, totals) => ({
            paid: sum.paid + totals.paid,
            pending: sum.pending + totals.pending
        }), { paid: 0, pending: 0 });
    const total = selectedTotals.paid + selectedTotals.pending;
    const segments = [
        { label: "Recaudado", value: selectedTotals.paid, color: "#10b981" },
        { label: "Pendiente de cobro", value: selectedTotals.pending, color: "#f59e0b" }
    ];

    revenueDonutTitle.textContent = isDoctorSelected
        ? "Cobranza del especialista"
        : "Recaudado y pendiente";
    revenueDonutSubtitle.textContent = isDoctorSelected
        ? revenueDoctorFilter.value
        : "Estado de cobranza de toda la clínica";
    revenueDonutTotal.textContent = `$${total.toLocaleString("en-US")}`;
    revenueDonutCaption.textContent = "USD registrados";
    revenueDonut.setAttribute("aria-label", `Total registrado ${formatRevenueUsd(total)}; recaudado ${formatRevenueUsd(selectedTotals.paid)}; pendiente de cobro ${formatRevenueUsd(selectedTotals.pending)}`);

    const circumference = 2 * Math.PI * 78;
    let offset = 0;
    revenueDonutSegments.replaceChildren();
    segments.forEach((segment) => {
        if (!segment.value || !total) return;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("class", "revenue-donut-segment");
        circle.setAttribute("cx", "110");
        circle.setAttribute("cy", "110");
        circle.setAttribute("r", "78");
        circle.setAttribute("stroke", segment.color);
        circle.setAttribute("stroke-dasharray", `${(segment.value / total) * circumference} ${circumference}`);
        circle.setAttribute("stroke-dashoffset", String(-offset));
        revenueDonutSegments.append(circle);
        offset += (segment.value / total) * circumference;
    });

    revenueChartLegend.replaceChildren();
    segments.forEach((segment) => {
        const item = document.createElement("div");
        item.className = "revenue-legend-item";
        const label = document.createElement("span");
        label.className = "revenue-legend-label";
        const swatch = document.createElement("span");
        swatch.className = `revenue-legend-swatch ${segment.label === "Recaudado" ? "is-paid" : "is-pending"}`;
        swatch.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.textContent = segment.label;
        label.append(swatch, text);
        const value = document.createElement("strong");
        value.textContent = formatRevenueUsd(segment.value);
        item.append(label, value);
        revenueChartLegend.append(item);
    });

    const barItems = isDoctorSelected
        ? [
            { label: "Recaudado", value: selectedTotals.paid, tone: "is-paid" },
            { label: "Pendiente de cobro", value: selectedTotals.pending, tone: "is-pending" }
        ]
        : doctorNames
            .map((name) => ({ label: name, value: doctorRevenue.get(name).paid, tone: "is-doctor" }))
            .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "es"))
            .slice(0, 8);

    if (!isDoctorSelected && doctorNames.length > 8) {
        const otherRevenue = doctorNames
            .map((name) => doctorRevenue.get(name).paid)
            .sort((a, b) => b - a)
            .slice(8)
            .reduce((sum, value) => sum + value, 0);
        barItems.push({ label: "Otros especialistas", value: otherRevenue, tone: "is-other" });
    }

    revenueBarsTitle.textContent = isDoctorSelected
        ? "Detalle de cobranza"
        : "Recaudación por especialista";
    revenueBarsSubtitle.textContent = isDoctorSelected
        ? "Importes pagados y pendientes · USD"
        : "Ingresos confirmados · USD";
    revenueBars.replaceChildren();

    if (barItems.length === 0) {
        const empty = document.createElement("p");
        empty.className = "revenue-chart-empty";
        empty.textContent = "Aún no hay citas registradas para mostrar.";
        revenueBars.append(empty);
        return;
    }

    const maxValue = Math.max(...barItems.map((item) => item.value), 1);
    barItems.forEach((item) => {
        const row = document.createElement("div");
        row.className = "revenue-bar-row";
        const label = document.createElement("span");
        label.className = "revenue-bar-label";
        label.textContent = item.label;
        label.title = item.label;
        const track = document.createElement("div");
        track.className = "revenue-bar-track";
        track.setAttribute("role", "img");
        track.setAttribute("aria-label", `${item.label}: ${formatRevenueUsd(item.value)}`);
        const fill = document.createElement("span");
        fill.className = `revenue-bar-fill ${item.tone}`;
        fill.style.width = `${item.value ? Math.max((item.value / maxValue) * 100, 2) : 0}%`;
        track.append(fill);
        const value = document.createElement("strong");
        value.className = "revenue-bar-value";
        value.textContent = formatRevenueUsd(item.value);
        row.append(label, track, value);
        revenueBars.append(row);
    });
}

function renderTableRows(appointments) {
    if (!patientsTableBody) return;
    patientsTableBody.innerHTML = "";

    if (appointments.length === 0) {
        if (emptyStateContainer) emptyStateContainer.hidden = false;
        return;
    }

    if (emptyStateContainer) emptyStateContainer.hidden = true;

    appointments.forEach((appt) => {
        const tr = document.createElement("tr");

        const payInfo = getAppointmentPayment(appt.id, appt.payment_status || appt.paid);
        const initials = getInitials(appt.patientName || "Paciente");
        const formattedDate = formatDateDisplay(appt.date);
        const cleanPhone = (appt.patientPhone || "").replace(/[^0-9+]/g, "");

        tr.innerHTML = `
            <td>
                <div class="patient-cell-profile">
                    <div class="patient-avatar-circle" aria-hidden="true">${initials}</div>
                    <div class="patient-identity">
                        <h4>${escapeHtml(appt.patientName || "Sin Nombre")}</h4>
                        <span class="patient-code-tag">ID: ${escapeHtml(appt.code || "S/C")}</span>
                        <div style="font-size:12px; color:var(--adm-text-muted); margin-top:2px;">
                            🎂 ${appt.patientAge ? appt.patientAge + " años" : "Edad no esp."}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="contact-cell">
                    <a href="tel:${cleanPhone}" title="Llamar al paciente">📞 ${escapeHtml(appt.patientPhone || "No registrado")}</a>
                    <a href="mailto:${escapeHtml(appt.patientEmail || "")}" title="Enviar email"><small>✉️ ${escapeHtml(appt.patientEmail || "Sin email")}</small></a>
                </div>
            </td>
            <td>
                <div class="appt-doctor-cell">
                    <strong>${escapeHtml(appt.doctorName || "Especialista")}</strong>
                    <span>🩺 ${escapeHtml(appt.specialty || "Consulta General")}</span>
                </div>
            </td>
            <td>
                <div class="datetime-cell">
                    <span class="datetime-date">${formattedDate}</span>
                    <span class="datetime-time">⏰ ${escapeHtml(appt.time || "")}</span>
                </div>
            </td>
            <td>
                <select class="status-select-badge status-${(appt.status || "pendiente").toLowerCase()}" data-appt-id="${appt.id}" aria-label="Cambiar estado de cita">
                    <option value="Pendiente" ${appt.status === "Pendiente" ? "selected" : ""}>⏳ Pendiente</option>
                    <option value="Confirmada" ${appt.status === "Confirmada" ? "selected" : ""}>✓ Confirmada</option>
                    <option value="Atendida" ${appt.status === "Atendida" ? "selected" : ""}>🩺 Atendida</option>
                    <option value="Cancelada" ${appt.status === "Cancelada" ? "selected" : ""}>✕ Cancelada</option>
                </select>
            </td>
            <td>
                <div class="payment-cell-box">
                    <div class="payment-badge-status ${payInfo.paid ? "paid" : "unpaid"}">
                        ${payInfo.paid ? "✓ PAGADO · $50 USD" : "⏳ PENDIENTE · $50 USD"}
                    </div>
                    <div class="payment-actions-mini">
                        ${payInfo.paid 
                            ? `<button type="button" class="btn-toggle-payment btn-mark-unpaid" data-pay-toggle="${appt.id}" data-action="unpay">Marcar como Pendiente</button>` 
                            : `<button type="button" class="btn-toggle-payment btn-pay-now" data-pay-toggle="${appt.id}" data-action="pay">Cobrar $50 USD ✓</button>`
                        }
                    </div>
                    ${payInfo.paid && payInfo.method ? `<span class="method-tag-mini">Método: ${payInfo.method}</span>` : ""}
                </div>
            </td>
            <td>
                <div class="action-buttons-cell">
                    <button type="button" class="btn-icon-action" title="Ver / Imprimir Recibo de Caja ($50)" data-receipt-id="${appt.id}">
                        🧾
                    </button>
                    <a href="https://wa.me/${cleanPhone.replace("+", "")}?text=${encodeURIComponent(`Hola ${appt.patientName}, le contactamos de la Administración de Clínica Su Salud respecto a su cita con ${appt.doctorName}.`)}" target="_blank" class="btn-icon-action" title="Escribir por WhatsApp">
                        💬
                    </a>
                    <button type="button" class="btn-icon-action danger" title="Eliminar registro" data-delete-id="${appt.id}">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        patientsTableBody.appendChild(tr);
    });

    attachTableEvents();
}

// ==========================================================
// EVENTOS DE TABLA (CAMBIO DE PAGO, ESTADO, RECIBO, ELIMINAR)
// ==========================================================
function attachTableEvents() {
    // Cambio de Estado de Pago ($50 USD)
    document.querySelectorAll("[data-pay-toggle]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const apptId = e.currentTarget.getAttribute("data-pay-toggle");
            const action = e.currentTarget.getAttribute("data-action");

            if (action === "pay") {
                const method = prompt("Selecciona el método de pago:\n1: Efectivo (Divisas / Bs)\n2: Tarjeta / Punto de Venta\n3: Pago Móvil / Transferencia\n4: Zelle", "Efectivo");
                let finalMethod = "Efectivo";
                if (method) {
                    if (method === "1") finalMethod = "Efectivo";
                    else if (method === "2") finalMethod = "Tarjeta / Punto";
                    else if (method === "3") finalMethod = "Pago Móvil / Transf.";
                    else if (method === "4") finalMethod = "Zelle";
                    else finalMethod = method;
                }
                await setAppointmentPayment(apptId, true, finalMethod);
            } else {
                if (confirm("¿Deseas marcar esta consulta como PENDIENTE de pago?")) {
                    await setAppointmentPayment(apptId, false);
                }
            }
        });
    });

    // Cambio de Estado de Cita (Supabase)
    document.querySelectorAll(".status-select-badge").forEach((select) => {
        select.addEventListener("change", async (e) => {
            const apptId = e.target.getAttribute("data-appt-id");
            const newStatus = e.target.value;

            try {
                if (typeof apiUpdateAppointmentStatus === "function") {
                    await apiUpdateAppointmentStatus(apptId, newStatus);
                }
                // Actualizar localmente
                const target = allAppointments.find((a) => a.id === apptId);
                if (target) target.status = newStatus;
                renderDashboard();
            } catch (err) {
                alert(`Error al actualizar estado en Supabase: ${err.message}`);
            }
        });
    });

    // Ver Recibo de Pago ($50 USD)
    document.querySelectorAll("[data-receipt-id]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const apptId = e.currentTarget.getAttribute("data-receipt-id");
            const appt = allAppointments.find((a) => a.id === apptId);
            if (appt) openReceiptModal(appt);
        });
    });

    // Eliminar Cita
    document.querySelectorAll("[data-delete-id]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const apptId = e.currentTarget.getAttribute("data-delete-id");
            const appt = allAppointments.find((a) => a.id === apptId);
            const name = appt ? appt.patientName : "este paciente";

            if (confirm(`¿Estás seguro de eliminar el registro de ${name}? Esta acción no se puede deshacer.`)) {
                try {
                    if (typeof apiDeleteAppointment === "function") {
                        await apiDeleteAppointment(apptId);
                    }
                    allAppointments = allAppointments.filter((a) => a.id !== apptId);
                    delete paymentsMap[apptId];
                    savePaymentsMap();
                    renderDashboard();
                } catch (err) {
                    alert(`No se pudo eliminar de Supabase: ${err.message}`);
                }
            }
        });
    });
}

// ==========================================================
// MODAL DE RECIBO DE PAGO ($50 USD)
// ==========================================================
function openReceiptModal(appt) {
    if (!receiptModal) return;

    const payInfo = getAppointmentPayment(appt.id, appt.payment_status || appt.paid);

    document.getElementById("rec-modal-code").textContent = appt.code || "HDL-0000";
    document.getElementById("rec-modal-patient").textContent = appt.patientName || "Paciente";
    document.getElementById("rec-modal-phone").textContent = appt.patientPhone || "-";
    document.getElementById("rec-modal-doctor").textContent = appt.doctorName || "Especialista";
    document.getElementById("rec-modal-specialty").textContent = appt.specialty || "Consulta Médica";
    document.getElementById("rec-modal-datetime").textContent = `${formatDateDisplay(appt.date)} a las ${appt.time || ""}`;
    document.getElementById("rec-modal-status").textContent = payInfo.paid ? `PAGADO (${payInfo.method || "Caja"})` : "PENDIENTE DE PAGO";
    document.getElementById("rec-modal-status").style.color = payInfo.paid ? "#10b981" : "#f59e0b";
    document.getElementById("rec-modal-price").textContent = `$${CONSULTATION_FEE_USD}.00 USD`;

    receiptModal.classList.add("active");
}

function closeReceiptModal() {
    if (receiptModal) receiptModal.classList.remove("active");
}

if (btnCloseReceipt) btnCloseReceipt.addEventListener("click", closeReceiptModal);
if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener("click", () => {
        window.print();
    });
}
if (receiptModal) {
    receiptModal.addEventListener("click", (e) => {
        if (e.target === receiptModal) closeReceiptModal();
    });
}

// ==========================================================
// FILTROS Y BÚSQUEDA
// ==========================================================
function setupFilterListeners() {
    if (revenueDoctorFilter) {
        revenueDoctorFilter.addEventListener("change", renderRevenueCharts);
    }

    // Buscador en tiempo real
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            activeSearchQuery = e.target.value.trim();
            renderDashboard();
        });
    }

    // Filtros de Pago (Todos / Pagados / No pagados)
    paymentFilterChips.forEach((chip) => {
        chip.addEventListener("click", (e) => {
            paymentFilterChips.forEach((c) => c.classList.remove("active"));
            e.currentTarget.classList.add("active");
            activePaymentFilter = e.currentTarget.getAttribute("data-pay-filter");
            renderDashboard();
        });
    });

    // Filtros de Estado de Cita
    statusFilterChips.forEach((chip) => {
        chip.addEventListener("click", (e) => {
            statusFilterChips.forEach((c) => c.classList.remove("active"));
            e.currentTarget.classList.add("active");
            activeStatusFilter = e.currentTarget.getAttribute("data-status-filter");
            renderDashboard();
        });
    });

    // Botón refrescar
    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
            refreshBtn.classList.add("spinning");
            await loadAppointmentsFromSupabase();
            setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
        });
    }

    // Generar citas demo de prueba en Supabase si no hay pacientes
    if (btnSeedDemo) {
        btnSeedDemo.addEventListener("click", async () => {
            await seedDemoAppointments();
        });
    }
}

async function seedDemoAppointments() {
    const demos = [
        {
            id: `cita_${Date.now()}_1`,
            code: `HDL-${Math.floor(1000 + Math.random() * 9000)}`,
            doctorName: "Dra. Desiree Rojas",
            specialty: "Cardiología",
            date: new Date().toISOString().split("T")[0],
            time: "09:00 a. m.",
            patientName: "Mariana Albornoz",
            patientEmail: "mariana.albornoz@gmail.com",
            patientPhone: "0412-9876543",
            patientAge: 38,
            notes: "Evaluación cardiovascular preventiva y control de presión arterial.",
            status: "Confirmada",
            doctorNotes: ""
        },
        {
            id: `cita_${Date.now()}_2`,
            code: `HDL-${Math.floor(1000 + Math.random() * 9000)}`,
            doctorName: "Dr. Miguel Herrera",
            specialty: "Cirugía general",
            date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            time: "10:30 a. m.",
            patientName: "Roberto Gómez",
            patientEmail: "roberto.gomez@outlook.com",
            patientPhone: "0414-3456789",
            patientAge: 45,
            notes: "Revisión postoperatoria y retiro de puntos.",
            status: "Pendiente",
            doctorNotes: ""
        },
        {
            id: `cita_${Date.now()}_3`,
            code: `HDL-${Math.floor(1000 + Math.random() * 9000)}`,
            doctorName: "Dra. Lucía Fernández",
            specialty: "Pediatría",
            date: new Date().toISOString().split("T")[0],
            time: "11:00 a. m.",
            patientName: "Valentina Salazar (Madre: Andrea)",
            patientEmail: "andrea.salazar@gmail.com",
            patientPhone: "0424-5551234",
            patientAge: 6,
            notes: "Control pediátrico de rutina y esquema de vacunación.",
            status: "Pendiente",
            doctorNotes: ""
        }
    ];

    try {
        if (typeof apiSaveAppointment === "function") {
            for (const d of demos) {
                await apiSaveAppointment(d);
            }
        }
        // Guardar uno como pagado de ejemplo
        paymentsMap[demos[0].id] = { paid: true, method: "Efectivo / Divisas", paidAt: new Date().toISOString() };
        savePaymentsMap();

        await loadAppointmentsFromSupabase();
        alert("¡Citas de prueba registradas con éxito en Supabase!");
    } catch (err) {
        alert(`No se pudieron crear citas demo: ${err.message}`);
    }
}

// ==========================================================
// UTILIDADES
// ==========================================================
function getInitials(name) {
    return name
        .replace(/^(Dra?\. )/, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "P";
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const formatted = d.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return dateStr;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================
// INICIALIZACIÓN
// ==========================================================
document.addEventListener("DOMContentLoaded", async () => {
    initClock();
    loadPaymentsMap();
    setupFilterListeners();
    await loadAppointmentsFromSupabase();

    // Supabase Realtime para recibir citas agendadas al instante
    try {
        if (typeof apiSubscribeToAppointments === "function") {
            apiSubscribeToAppointments((_payload) => {
                loadAppointmentsFromSupabase();
            });
        }
    } catch (_e) {
        console.warn("Realtime no disponible en este entorno:", _e);
    }
});
