import { fetchCurrentLocation } from './geolocation.js';


function $(id) {
  return document.getElementById(id);
}

function setLocationLoading(button, isLoading, label = 'Update Location') {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Fetching location…' : label;
}

async function applyGeolocationToField(input, button, buttonLabel) {
  if (!input) return;

  setLocationLoading(button, true, buttonLabel);
  input.classList.add('is-loading');

  try {
    const location = await fetchCurrentLocation();
    input.value = location;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    alert(error.message || 'Could not fetch location.');
  } finally {
    input.classList.remove('is-loading');
    setLocationLoading(button, false, buttonLabel);
  }
}

function openEditPanel() {
  const panel = $('profileEditPanel');
  const section = $('profileSection');
  panel.hidden = false;
  section.classList.add('is-editing');
}

function closeEditPanel() {
  const panel = $('profileEditPanel');
  const section = $('profileSection');
  panel.hidden = true;
  section.classList.remove('is-editing');
}

function saveEditPanel() {
  closeEditPanel();
}


function initProfilePage() {
  $('btnEditProfile')?.addEventListener('click', openEditPanel);
  $('btnCancelEdit')?.addEventListener('click', closeEditPanel);
  $('btnSaveProfile')?.addEventListener('click', saveEditPanel);


  $('btnDetectEditLocation')?.addEventListener('click', () => {
    applyGeolocationToField($('editLocation'), $('btnDetectEditLocation'), 'Detect location');
  });

  $('btnShareLocation')?.addEventListener('click', async () => {
    const btn = $('btnShareLocation');
    setLocationLoading(btn, true, 'Share Location');
    try {
      const location = await fetchCurrentLocation();
      await navigator.clipboard.writeText(location);
      alert(`Location copied:\n${location}`);
    } catch (error) {
      alert(error.message || 'Could not share location.');
    } finally {
      setLocationLoading(btn, false, 'Share Location');
    }
  });
}

document.addEventListener('DOMContentLoaded', initProfilePage);