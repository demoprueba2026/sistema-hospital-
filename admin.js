// admin.js – JavaScript for the administrative portal
// Requires supabaseClient.js which exports a `supabase` instance.

document.addEventListener('DOMContentLoaded', async () => {
  await loadPrices();
  await loadPatients();
  setupFilters();
});

// Load consultation prices from the "prices" table
async function loadPrices() {
  const { data, error } = await supabase.from('prices').select('type, amount');
  const tbody = document.querySelector('#prices-table tbody');
  tbody.innerHTML = '';
  if (error) {
    console.error('Error loading prices:', error);
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 2;
    cell.textContent = 'No se pudieron cargar los precios.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }
  data.forEach(item => {
    const row = document.createElement('tr');
    const typeCell = document.createElement('td');
    typeCell.textContent = item.type;
    const amountCell = document.createElement('td');
    amountCell.textContent = `$${item.amount}`;
    row.appendChild(typeCell);
    row.appendChild(amountCell);
    tbody.appendChild(row);
  });
}

// Load patients and their payment status from the "patients" table
async function loadPatients() {
  const { data, error } = await supabase.from('patients').select('name, phone, appointment_type, paid');
  const tbody = document.querySelector('#patients-table tbody');
  tbody.dataset.full = JSON.stringify(data || []); // keep raw data for filtering
  renderPatients(data || []);
  if (error) {
    console.error('Error loading patients:', error);
  }
}

function renderPatients(patients) {
  const tbody = document.querySelector('#patients-table tbody');
  tbody.innerHTML = '';
  if (patients.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'No hay pacientes registrados.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }
  patients.forEach(p => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = p.name;
    const phoneCell = document.createElement('td');
    phoneCell.textContent = p.phone;
    const consultCell = document.createElement('td');
    consultCell.textContent = p.appointment_type;
    const paidCell = document.createElement('td');
    paidCell.textContent = p.paid ? 'Pagado' : 'No pagado';
    row.appendChild(nameCell);
    row.appendChild(phoneCell);
    row.appendChild(consultCell);
    row.appendChild(paidCell);
    tbody.appendChild(row);
  });
}

function setupFilters() {
  const searchInput = document.getElementById('patient-search');
  const paymentSelect = document.getElementById('payment-filter');
  searchInput.addEventListener('input', applyFilters);
  paymentSelect.addEventListener('change', applyFilters);
}

function applyFilters() {
  const searchTerm = document.getElementById('patient-search').value.toLowerCase();
  const paymentFilter = document.getElementById('payment-filter').value;
  const raw = JSON.parse(document.querySelector('#patients-table tbody').dataset.full || '[]');
  const filtered = raw.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.phone.includes(searchTerm);
    const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'paid' && p.paid) || (paymentFilter === 'unpaid' && !p.paid);
    return matchesSearch && matchesPayment;
  });
  renderPatients(filtered);
}

