/**
 * Vortex Fitness Club - Interactive Script
 * Handles form validation, VIP pass generation, timetable previews,
 * before/after slider, modal controls, and local lead persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDateConstraints();
  initFormValidation();
  initBeforeAfterSlider();
  initScheduleModal();
  initGeneralModals();
  initMobileNavigation();
  initLeadsViewer();
});

/* ==========================================================================
   1. Date Constraints Setup
   ========================================================================== */
function initDateConstraints() {
  const startDateInputs = document.querySelectorAll('#free-trial input[name="startDate"], input[name="startDate"], #startDate');
  startDateInputs.forEach(input => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    input.min = minDate;
    if (!input.value) input.value = minDate;
  });
}

/* ==========================================================================
   2. Lead Capture Form Validation & VIP Pass Generation
   ========================================================================== */
function initFormValidation() {
  const form = document.querySelector('#free-trial form') || document.getElementById('lead-form');
  if (!form) return;

  const nameInput = form.querySelector('input[name="name"], #fullName');
  const phoneInput = form.querySelector('input[name="phone"], #phone');
  const emailInput = form.querySelector('input[name="email"], #email');
  const dateInput = form.querySelector('input[name="startDate"], #startDate');
  const goalSelect = form.querySelector('select[name="goal"], #fitnessGoal');

  form.addEventListener('submit', (e) => {
    // Generate Pass ID & Lead Record
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const passId = `VTX-${randomDigits}-7D`;
    const leadData = {
      passId,
      name: nameInput ? nameInput.value.trim() : 'Guest',
      phone: phoneInput ? phoneInput.value.trim() : '',
      email: emailInput ? emailInput.value.trim() : '',
      startDate: dateInput ? dateInput.value : '',
      goal: goalSelect ? goalSelect.value : '',
      referral: '7-Day Free Trial Form',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };

    // Save lead to localStorage
    saveLead(leadData);

    // Update VIP Pass modal data if elements exist
    const ticketPassId = document.getElementById('ticket-pass-id');
    const ticketName = document.getElementById('ticket-name');
    const ticketPhone = document.getElementById('ticket-phone');
    const ticketStart = document.getElementById('ticket-start');
    const ticketGoal = document.getElementById('ticket-goal');

    if (ticketPassId) ticketPassId.textContent = passId;
    if (ticketName) ticketName.textContent = leadData.name;
    if (ticketPhone) ticketPhone.textContent = leadData.phone;
    if (ticketStart) ticketStart.textContent = formatDateDisplay(leadData.startDate);
    if (ticketGoal) ticketGoal.textContent = leadData.goal;

    // Configure WhatsApp Link with pre-filled message
    const waText = encodeURIComponent(
      `Hi Vortex Fitness! I just claimed my 7-Day VIP Guest Pass!\n\n` +
      `🎟️ Pass ID: ${passId}\n` +
      `👤 Name: ${leadData.name}\n` +
      `📅 Start Date: ${leadData.startDate}\n` +
      `🎯 Primary Goal: ${leadData.goal}\n\n` +
      `Looking forward to my first session!`
    );
    const modalWaBtn = document.getElementById('modal-whatsapp-btn');
    if (modalWaBtn) {
      modalWaBtn.href = `https://wa.me/15550192834?text=${waText}`;
    }

    // Let the form submit natively to FormSubmit unless it is a dummy email
    const actionUrl = form.getAttribute('action') || '';
    if (actionUrl.includes('YOUR_EMAIL_HERE')) {
      // If placeholder email, prevent 404/Formsubmit error and show instant VIP pass modal
      e.preventDefault();
      openModal('pass-modal');
      showToast(`VIP Pass ${passId} generated! (Replace YOUR_EMAIL_HERE with your email to receive submissions)`);
      form.reset();
      initDateConstraints();
    }
  });
}

function showError(errorId, inputElem) {
  const err = document.getElementById(errorId);
  if (err) err.classList.add('visible');
  if (inputElem) inputElem.classList.add('is-invalid');
}

function clearError(errorId, inputElem) {
  const err = document.getElementById(errorId);
  if (err) err.classList.remove('visible');
  if (inputElem) inputElem.classList.remove('is-invalid');
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Selected Date';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

/* ==========================================================================
   3. Interactive Before / After Comparison Slider
   ========================================================================== */
function initBeforeAfterSlider() {
  const slider = document.getElementById('ba-slider');
  const afterWrap = document.getElementById('ba-after-wrap');
  const handle = document.getElementById('ba-handle');

  if (!slider || !afterWrap || !handle) return;

  let isDragging = false;

  const updateSlider = (clientX) => {
    const rect = slider.getBoundingClientRect();
    let posX = clientX - rect.left;
    let percentage = (posX / rect.width) * 100;

    // Clamp between 5% and 95%
    percentage = Math.max(5, Math.min(percentage, 95));

    afterWrap.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  };

  // Mouse Events
  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Events for Mobile
  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches && e.touches[0]) {
      updateSlider(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) {
      updateSlider(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* ==========================================================================
   4. Class Timetable Modal
   ========================================================================== */
function initScheduleModal() {
  const buttons = document.querySelectorAll('.view-schedule-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const className = btn.getAttribute('data-class') || 'Classes';
      const titleElem = document.getElementById('schedule-modal-title');
      if (titleElem) {
        titleElem.textContent = `${className} - Weekly Schedule`;
      }
      openModal('schedule-modal');
    });
  });

  const bookBtn = document.getElementById('book-from-schedule-btn');
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      closeModal('schedule-modal');
    });
  }
}

/* ==========================================================================
   5. General Modal Logic (Backdrop, Close Buttons, Print)
   ========================================================================== */
function initGeneralModals() {
  // Pass Modal Close
  const closePassBtn = document.getElementById('close-pass-modal');
  if (closePassBtn) closePassBtn.addEventListener('click', () => closeModal('pass-modal'));

  // Schedule Modal Close
  const closeSchedBtn = document.getElementById('close-schedule-modal');
  if (closeSchedBtn) closeSchedBtn.addEventListener('click', () => closeModal('schedule-modal'));

  // Privacy Modal
  const openPrivBtn = document.getElementById('open-privacy-btn');
  const closePrivBtn = document.getElementById('close-privacy-modal');
  if (openPrivBtn) openPrivBtn.addEventListener('click', () => openModal('privacy-modal'));
  if (closePrivBtn) closePrivBtn.addEventListener('click', () => closeModal('privacy-modal'));

  // Terms Modal
  const openTermsBtn = document.getElementById('open-terms-btn');
  const closeTermsBtn = document.getElementById('close-terms-modal');
  if (openTermsBtn) openTermsBtn.addEventListener('click', () => openModal('terms-modal'));
  if (closeTermsBtn) closeTermsBtn.addEventListener('click', () => closeModal('terms-modal'));

  // Close when clicking outside modal content
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Print / Save Pass Button
  const printBtn = document.getElementById('print-pass-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   6. Mobile Navigation Drawer
   ========================================================================== */
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (toggleBtn && mobileNav) {
    toggleBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });
  }
}

/* ==========================================================================
   7. Demo Leads Storage & Viewer
   ========================================================================== */
function getSavedLeads() {
  try {
    return JSON.parse(localStorage.getItem('vortex_gym_leads') || '[]');
  } catch (err) {
    return [];
  }
}

function saveLead(lead) {
  const leads = getSavedLeads();
  leads.unshift(lead);
  localStorage.setItem('vortex_gym_leads', JSON.stringify(leads));
  updateLeadsBadge();
}

function updateLeadsBadge() {
  const countBadge = document.getElementById('leads-count-badge');
  if (countBadge) {
    const leads = getSavedLeads();
    countBadge.textContent = leads.length;
  }
}

function initLeadsViewer() {
  const openLeadsBtn = document.getElementById('open-leads-btn');
  const closeLeadsBtn = document.getElementById('close-leads-modal');
  const clearLeadsBtn = document.getElementById('clear-leads-btn');
  const tbody = document.getElementById('leads-table-body');

  updateLeadsBadge();

  if (openLeadsBtn) {
    openLeadsBtn.addEventListener('click', () => {
      renderLeadsTable();
      openModal('leads-modal');
    });
  }

  if (closeLeadsBtn) {
    closeLeadsBtn.addEventListener('click', () => closeModal('leads-modal'));
  }

  if (clearLeadsBtn) {
    clearLeadsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all demo leads?')) {
        localStorage.removeItem('vortex_gym_leads');
        renderLeadsTable();
        updateLeadsBadge();
        showToast('Demo leads cleared.');
      }
    });
  }

  function renderLeadsTable() {
    if (!tbody) return;
    const leads = getSavedLeads();
    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 1.5rem;">No leads captured yet. Submit the form above to see real-time lead capture!</td></tr>`;
      return;
    }

    tbody.innerHTML = leads.map(l => `
      <tr>
        <td><strong class="text-accent">${l.passId}</strong></td>
        <td>${escapeHtml(l.name)}</td>
        <td>${escapeHtml(l.phone)}</td>
        <td>${escapeHtml(l.email)}</td>
        <td>${escapeHtml(l.startDate)}</td>
        <td>${escapeHtml(l.goal)}</td>
        <td>${escapeHtml(l.referral)}</td>
        <td>${escapeHtml(l.createdAt)}</td>
      </tr>
    `).join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/* ==========================================================================
   8. Toast Notification Utility
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">⚡</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
