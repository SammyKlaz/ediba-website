
/* =========================
   SCROLL ANIMATION
========================= */
const animatedItems = document.querySelectorAll(
  ".service-card, .arm-card, .event-card, .sermon-card"
);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.transform = "translateY(0)";
      entry.target.style.opacity = "1";
    }
  });
}, { threshold: 0.2 });

animatedItems.forEach(item => {
  item.style.opacity = "0";
  item.style.transform = "translateY(40px)";
  item.style.transition = "all 0.6s ease";
  observer.observe(item);
});







/**
 * Main JavaScript file for PCN Ediba Qua Parish Website
 * Features: Form validation, character counts, interactive elements
 */

// ============================
// FORM VALIDATION & CHARACTER COUNT
// ============================

function initCharacterCounters() {
  const textareas = document.querySelectorAll('textarea[maxlength]');
  const inputs = document.querySelectorAll('input[maxlength]');

  [...textareas, ...inputs].forEach(element => {
    if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('char-count')) {
      const countDisplay = document.createElement('div');
      countDisplay.className = 'char-count';
      element.parentNode.insertBefore(countDisplay, element.nextSibling);
    }

    element.addEventListener('input', function() {
      const countDisplay = this.nextElementSibling;
      const maxLength = this.maxLength;
      const currentLength = this.value.length;
      const remaining = maxLength - currentLength;

      countDisplay.textContent = `${currentLength} / ${maxLength} characters`;

      if (currentLength >= maxLength * 0.8) {
        countDisplay.classList.add('warning');
      } else {
        countDisplay.classList.remove('warning');
      }
    });

    const countDisplay = element.nextElementSibling;
    if (countDisplay) {
      const maxLength = element.maxLength;
      const currentLength = element.value.length;
      countDisplay.textContent = `${currentLength} / ${maxLength} characters`;
    }
  });
}

// ============================
// FORM VALIDATION
// ============================

function validateForm(formElement) {
  let isValid = true;
  const requiredFields = formElement.querySelectorAll('[required]');

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = '#d32f2f';
      showAlert(`${field.name || field.id} is required`, 'error');
    } else {
      field.style.borderColor = '';
    }
  });

  const emailFields = formElement.querySelectorAll('input[type="email"]');
  emailFields.forEach(field => {
    if (field.value && !isValidEmail(field.value)) {
      isValid = false;
      field.style.borderColor = '#d32f2f';
      showAlert('Please enter a valid email address', 'error');
    }
  });

  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================
// ALERT SYSTEM
// ============================

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '100px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.maxWidth = '400px';

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// ============================
// FORM SUBMIT HANDLER
// ============================

function setupFormHandlers() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    if (form.action.includes('logout')) return;

    form.addEventListener('submit', function(e) {
      if (!validateForm(this)) {
        e.preventDefault();
        return false;
      }
    });
  });
}

// ============================
// DELETE CONFIRMATION
// ============================

function setupDeleteConfirmation() {
  const deleteForms = document.querySelectorAll('form[action*="/delete"]');

  deleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const confirmDelete = confirm('Are you sure you want to delete this item? This action cannot be undone.');
      if (!confirmDelete) {
        e.preventDefault();
      }
    });
  });
}

// ============================
// LIKE BUTTON WITH ICON
// ============================

function setupLikeButtons() {
  const likeIcons = document.querySelectorAll('[data-like-form]');

  likeIcons.forEach(icon => {
    icon.style.cursor = 'pointer';
    icon.style.fontSize = '1.5rem';

    icon.addEventListener('click', function(e) {
      e.preventDefault();
      const formId = this.getAttribute('data-like-form');
      const form = document.getElementById(formId);
      if (form) {
        form.submit();
      }
    });
  });
}

// ============================
// MODAL FUNCTIONALITY
// ============================

function setupModals() {
  const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal-trigger');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('show');
      }
    });
  });

  const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('show');
      }
    });
  });

  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      modals.forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });
}

// ============================
// MOBILE MENU TOGGLE
// ============================

function setupMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.navbar-nav-custom');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('show');
    });

    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navMenu.classList.remove('show');
      });
    });
  }
}

// ============================
// SMOOTH SCROLL
// ============================

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ============================
// TABLE SORTING (Admin)
// ============================

function setupTableSorting() {
  const sortableHeaders = document.querySelectorAll('th[data-sortable]');

  sortableHeaders.forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function() {
      const table = this.closest('table');
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const columnIndex = Array.from(this.parentNode.children).indexOf(this);
      const isAscending = this.classList.contains('asc');

      rows.sort((a, b) => {
        const aValue = a.children[columnIndex].textContent.trim();
        const bValue = b.children[columnIndex].textContent.trim();

        if (!isNaN(aValue) && !isNaN(bValue)) {
          return isAscending ? bValue - aValue : aValue - bValue;
        }

        return isAscending
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      });

      sortableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
      this.classList.add(isAscending ? 'desc' : 'asc');

      const tbody = table.querySelector('tbody');
      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

// ============================
// INPUT FIELD FOCUS EFFECTS
// ============================

function setupInputEffects() {
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });
}

// ============================
// FILE INPUT PREVIEW
// ============================

function setupFileInputs() {
  const fileInputs = document.querySelectorAll('input[type="file"]');

  fileInputs.forEach(input => {
    input.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          showAlert('File size exceeds 5MB limit', 'error');
          this.value = '';
          return;
        }

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = this.nextElementSibling;
            if (preview && preview.classList.contains('file-preview')) {
              preview.innerHTML = `<img src="${e.target.result}">`;
            }
          };
          reader.readAsDataURL(file);
        }

        const fileNameDisplay = document.createElement('small');
        fileNameDisplay.className = 'file-name-display';
        fileNameDisplay.textContent = `Selected: ${file.name}`;
        fileNameDisplay.style.display = 'block';
        fileNameDisplay.style.marginTop = '0.5rem';

        const oldDisplay = this.parentNode.querySelector('.file-name-display');
        if (oldDisplay) oldDisplay.remove();

        this.parentNode.appendChild(fileNameDisplay);
      }
    });
  });
}

// ============================
// DATE INPUT VALIDATION
// ============================

function setupDateInputs() {
  const dateInputs = document.querySelectorAll('input[type="date"]');

  dateInputs.forEach(input => {
    input.addEventListener('change', function() {
      if (this.value) {
        const date = new Date(this.value);
        if (this.getAttribute('data-no-past') && date < new Date()) {
          showAlert('Please select a future date', 'warning');
          this.value = '';
        }
      }
    });
  });
}

// ============================
// INITIALIZE ALL FEATURES
// ============================

document.addEventListener('DOMContentLoaded', function() {
  initCharacterCounters();
  setupFormHandlers();
  setupDeleteConfirmation();
  setupModals();
  setupLikeButtons();
  setupMobileMenu();
  setupSmoothScroll();
  setupTableSorting();
  setupInputEffects();
  setupFileInputs();
  setupDateInputs();
  setupKeyboardNavigation();
});

// ============================
// KEYBOARD NAVIGATION
// ============================

function setupKeyboardNavigation() {
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 's') {
      const form = document.querySelector('form');
      if (form) {
        form.submit();
      }
    }
  });
}

// ============================
// UTILITY FUNCTIONS
// ============================

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

window.validateForm = validateForm;
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;

*/