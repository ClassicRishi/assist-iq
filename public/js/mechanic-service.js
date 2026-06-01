(function () {
  const form = document.getElementById('mechanicForm');
  const totalBillInput = document.getElementById('totalBill');
  const MAP_ROUTE = '/mechanic-service/map';

  if (!form || !totalBillInput) {
    return;
  }

  function calculateTotalBill() {
    const selectedServices = form.querySelectorAll('input[name="services"]:checked');
    let total = 0;

    selectedServices.forEach(function (checkbox) {
      total += Number(checkbox.dataset.price || 0);
    });

    totalBillInput.value = 'Rs. ' + total.toLocaleString('en-IN');
    return total;
  }

  function getSelectedServices() {
    return Array.from(form.querySelectorAll('input[name="services"]:checked')).map(function (el) {
      return el.value;
    });
  }

  function saveRequestToSession() {
    const payload = {
      name: form.querySelector('#name')?.value || '',
      email: form.querySelector('#email')?.value || '',
      phone: form.querySelector('#phone')?.value || '',
      services: getSelectedServices(),
      totalBill: totalBillInput.value,
      submittedAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem('mechanicRequest', JSON.stringify(payload));
    } catch {
      /* ignore storage errors */
    }
  }

  const serviceCheckboxes = form.querySelectorAll('input[name="services"]');

  serviceCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', calculateTotalBill);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    calculateTotalBill();

    if (!getSelectedServices().length) {
      alert('Please select at least one service.');
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    saveRequestToSession();
    window.location.href = MAP_ROUTE;
  });

  calculateTotalBill();
})();
