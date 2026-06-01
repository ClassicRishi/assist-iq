(function () {
  const panel = document.getElementById('notificationPanel');
  const openBtn = document.getElementById('btnNotifications');
  const closeBtn = document.getElementById('btnCloseNotifications');

  if (!panel) {
    return;
  }

  function openPanel() {
    panel.classList.add('is-visible');
    panel.removeAttribute('hidden');
  }

  function closePanel() {
    panel.classList.remove('is-visible');
    panel.setAttribute('hidden', '');
  }

  openBtn?.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    openPanel();
  });

  closeBtn?.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    closePanel();
  });
})();
