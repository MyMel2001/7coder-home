/**
 * Application JavaScript
 * Handles interactivity, API calls, and state management
 */

// State management
const appState = {
  users: [],
  currentUser: null,
  notifications: [],
  isLoading: false,
  currentView: 'dashboard'
};

// API Configuration
const API_BASE_URL = '/api';

// DOM Elements
const elements = {
  sidebar: document.getElementById('sidebar'),
  mainContent: document.getElementById('main-content'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  navLinks: document.querySelectorAll('.nav-link'),
  activeNavLink: document.querySelector('.nav-link.active'),
  modal: document.getElementById('userModal'),
  modalOverlay: document.getElementById('modalOverlay'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalForm: document.getElementById('userForm'),
  modalNameInput: document.getElementById('modalName'),
  modalEmailInput: document.getElementById('modalEmail'),
  modalRoleInput: document.getElementById('modalRole'),
  modalIdInput: document.getElementById('modalId'),
  modalStatusSelect: document.getElementById('modalStatus'),
  statsCards: document.querySelectorAll('.stat-card'),
  dashboardGrid: document.getElementById('dashboard-grid'),
  userTable: document.getElementById('userTable'),
  addNewButton: document.getElementById('addNewButton'),
  editButtons: document.querySelectorAll('.btn-edit'),
  deleteButtons: document.querySelectorAll('.btn-delete'),
  searchInput: document.getElementById('searchInput'),
  filterSelect: document.getElementById('filterSelect')
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initNavigation();
  initModals();
  initForms();
  initTables();
  initSearch();
  initFilters();
  loadInitialData();
});

// Sidebar functionality
function initSidebar() {
  if (elements.sidebarToggle) {
    elements.sidebarToggle.addEventListener('click', () => {
      elements.sidebar.classList.toggle('active');
    });
  }
}

// Navigation
function initNavigation() {
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      elements.navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Update current view
      appState.currentView = link.dataset.view;
      
      // Update main content
      const viewContent = link.dataset.content;
      if (viewContent) {
        elements.mainContent.innerHTML = viewContent;
        initForms(); // Re-initialize forms for new views
      }
    });
  });
}

// Modal functionality
function initModals() {
  // Open modal
  elements.modalOverlay.addEventListener('click', () => {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Close modal
  elements.modalClose.addEventListener('click', () => {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
      elements.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Form handling
function initForms() {
  // User form
  if (elements.modalForm) {
    elements.modalForm.addEventListener('submit', handleUserFormSubmit);
  }

  // Create user button
  if (elements.addNewButton) {
    elements.addNewButton.addEventListener('click', () => {
      openModal();
    });
  }

  // Edit buttons
  elements.editButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      openModal(id);
    });
  });

  // Delete buttons
  elements.deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      confirmDelete(id);
    });
  });
}

// Modal operations
function openModal(userId = null) {
  elements.modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (userId) {
    // Edit mode
    const user = appState.users.find(u => u.id === userId);
    if (user) {
      elements.modalTitle.textContent = 'Edit User';
      elements.modalNameInput.value = user.name;
      elements.modalEmailInput.value = user.email;
      elements.modalRoleInput.value = user.role;
      elements.modalIdInput.value = user.id;
      elements.modalStatusSelect.value = user.status;
    }
  } else {
    // Create mode
    elements.modalTitle.textContent = 'Add New User';
    elements.modalForm.reset();
    elements.modalIdInput.value = '';
  }
}

function closeModal() {
  elements.modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Form submission
async function handleUserFormSubmit(e) {
  e.preventDefault();

  const formData = {
    id: elements.modalIdInput.value,
    name: elements.modalNameInput.value,
    email: elements.modalEmailInput.value,
    role: elements.modalRoleInput.value,
    status: elements.modalStatusSelect.value
  };

  appState.isLoading = true;

  try {
    if (elements.modalIdInput.value) {
      // Update existing user
      const response = await fetch(`${API_BASE_URL}/users/${elements.modalIdInput.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      await updateUserInState(formData.id, formData);
    } else {
      // Create new user
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      const newUser = await response.json();
      appState.users.push(newUser);
    }

    closeModal();
    renderTables();
    renderStats();
    showNotification('success', 'User ' + (elements.modalIdInput.value ? 'updated' : 'created') + ' successfully!');
  } catch (error) {
    console.error('Error:', error);
    showNotification('error', 'Error: ' + error.message);
  } finally {
    appState.isLoading = false;
  }
}

// Confirmation dialog
function confirmDelete(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    deleteUsers(userId);
  }
}

// Delete users
async function deleteUsers(userIds) {
  appState.isLoading = true;

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userIds)
    });

    if (!response.ok) throw new Error('Failed to delete users');
    
    appState.users = appState.users.filter(u => !userIds.includes(u.id));
    renderTables();
    renderStats();
    showNotification('success', 'Users deleted successfully!');
  } catch (error) {
    console.error('Error:', error);
    showNotification('error', 'Error: ' + error.message);
  } finally {
    appState.isLoading = false;
  }
}

// Update user in state
function updateUserInState(userId, userData) {
  const index = appState.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    appState.users[index] = { ...appState.users[index], ...userData };
  }
}

// Render tables
function renderTables() {
  if (!elements.userTable) return;

  const searchTerm = elements.searchInput?.value.toLowerCase() || '';
  const filterStatus = elements.filterSelect?.value || 'all';

  const filteredUsers = appState.users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                         user.email.toLowerCase().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Render table rows
  const tbody = elements.userTable.querySelector('tbody');
  if (tbody) {
    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <div class="empty-state-title">No users found</div>
              <div class="empty-state-description">Try adjusting your search or filters</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filteredUsers.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>
          <span class="status-dot status-${user.status}"></span>
          ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </td>
        <td>
          <div class="actions">
            <button class="btn btn-icon btn-edit" data-id="${user.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn btn-icon btn-delete" data-id="${user.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Re-attach event listeners
    row.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.btn-edit').dataset.id;
        openModal(id);
      });
    });

    row.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.btn-delete').dataset.id;
        confirmDelete(id);
      });
    });
  }
}

// Render stats
function renderStats() {
  const stats = [
    { label: 'Total Users', value: appState.users.length, icon: '👥' },
    { label: 'Active', value: appState.users.filter(u => u.status === 'active').length, icon: '✅' },
    { label: 'Pending', value: appState.users.filter(u => u.status === 'pending').length, icon: '⏳' },
    { label: 'Inactive', value: appState.users.filter(u => u.status === 'inactive').length, icon: '❌' }
  ];

  elements.statsCards.forEach(card => {
    const stat = stats.find(s => s.label === card.dataset.label);
    if (stat) {
      card.querySelector('.stat-value').textContent = stat.value;
      card.querySelector('.stat-icon').textContent = stat.icon;
    }
  });
}

// Search functionality
function initSearch() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', () => {
      renderTables();
    });
  }
}

// Filter functionality
function initFilters() {
  if (elements.filterSelect) {
    elements.filterSelect.addEventListener('change', () => {
      renderTables();
    });
  }
}

// Notifications
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} animate-fade-in`;
  notification.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>${message}</span>
  `;

  // Add to top of main content
  if (elements.mainContent) {
    elements.mainContent.insertBefore(notification, elements.mainContent.firstChild);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s ease';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Load initial data (mock data for demo)
async function loadInitialData() {
  appState.isLoading = true;

  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    
    if (response.ok) {
      const users = await response.json();
      appState.users = users;
      renderTables();
      renderStats();
    } else {
      // Use mock data if API fails
      appState.users = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Administrator', status: 'active' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'pending' },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'inactive' },
        { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Viewer', status: 'active' }
      ];
      renderTables();
      renderStats();
    }
  } catch (error) {
    console.error('Error loading data:', error);
    // Use fallback mock data
    appState.users = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Administrator', status: 'active' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active' }
    ];
    renderTables();
    renderStats();
  } finally {
    appState.isLoading = false;
  }
}

// Handle loading state
if (appState.isLoading) {
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'loading-container';
  loadingContainer.innerHTML = `
    <div class="loading-spinner"></div>
    <span>Loading...</span>
  `;
  
  if (elements.mainContent) {
    elements.mainContent.appendChild(loadingContainer);
  }
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    appState,
    elements,
    showNotification
  };
}