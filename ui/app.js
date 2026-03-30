const API_BASE = 'http://localhost:4000/api';
let loadedAccountId = null;

const form = document.getElementById('accountForm');
const message = document.getElementById('message');
const loadBtn = document.getElementById('loadBtn');
const loadIdInput = document.getElementById('loadId');
const updateBtn = document.getElementById('updateBtn');
const submitBtn = document.getElementById('submitBtn');

const readRates = () => {
  const rows = [...document.querySelectorAll('#ratesTable tbody tr')];
  return rows.map((row) => {
    const inputs = row.querySelectorAll('input');
    return {
      service: inputs[0]?.value?.trim() || '',
      rate: inputs[1]?.value?.trim() || '',
      billing_unit: inputs[2]?.value?.trim() || ''
    };
  });
};

const populateRates = (rates) => {
  const rows = [...document.querySelectorAll('#ratesTable tbody tr')];
  rows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input');
    const source = rates[index] || { service: '', rate: '', billing_unit: '' };
    inputs[0].value = source.service || '';
    inputs[1].value = source.rate || '';
    inputs[2].value = source.billing_unit || '';
  });
};

const setMessage = (value) => {
  message.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const formToPayload = () => {
  const fd = new FormData(form);
  fd.set('rate_list_rows_json', JSON.stringify(readRates()));
  return fd;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      body: formToPayload()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create account');

    loadedAccountId = data.id;
    loadIdInput.value = data.id;
    setMessage({ message: 'Created account successfully', account_id: data.id });
  } catch (error) {
    setMessage(`Error: ${error.message}`);
  }
});

loadBtn.addEventListener('click', async () => {
  const id = loadIdInput.value.trim();
  if (!id) return setMessage('Please enter an account id to load.');

  try {
    const res = await fetch(`${API_BASE}/accounts/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load account');

    loadedAccountId = data.id;

    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (field && typeof value === 'string') field.value = value;
    });

    if (Array.isArray(data.rate_list_rows_json)) {
      populateRates(data.rate_list_rows_json);
    }

    setMessage({ message: 'Loaded account for editing', account_id: data.id, data });
  } catch (error) {
    setMessage(`Error: ${error.message}`);
  }
});

updateBtn.addEventListener('click', async () => {
  if (!loadedAccountId) return setMessage('Load an account first, then update.');

  try {
    const res = await fetch(`${API_BASE}/accounts/${loadedAccountId}`, {
      method: 'PUT',
      body: formToPayload()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update account');

    setMessage({ message: 'Updated account successfully', account_id: loadedAccountId });
  } catch (error) {
    setMessage(`Error: ${error.message}`);
  }
});

setMessage('Ready. Start by creating an account or loading an existing one.');
submitBtn.textContent = 'Create Account';
