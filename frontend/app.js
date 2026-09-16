// Student Management System - Main Frontend Application Logic
const API_BASE_URL = 'http://127.0.0.1:8000/api/students/';

// Application State
let state = {
    students: [],
    filteredStudents: [],
    editingId: null,
    deletingId: null,
    isApiConnected: false
};

// DOM Elements
const elements = {
    apiStatus: document.getElementById('api-status'),
    tableBody: document.getElementById('student-table-body'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    courseFilter: document.getElementById('course-filter'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnAddStudent: document.getElementById('btn-add-student'),
    
    // Stats
    statTotalStudents: document.getElementById('stat-total-students'),
    statTotalCourses: document.getElementById('stat-total-courses'),
    statAvgAge: document.getElementById('stat-avg-age'),

    // Student Form Modal
    modal: document.getElementById('student-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    studentForm: document.getElementById('student-form'),
    studentId: document.getElementById('student-id'),
    nameInput: document.getElementById('student-name'),
    emailInput: document.getElementById('student-email'),
    courseInput: document.getElementById('student-course'),
    ageInput: document.getElementById('student-age'),
    btnCancel: document.getElementById('btn-cancel'),
    btnSave: document.getElementById('btn-save'),
    generalError: document.getElementById('general-error'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteStudentName: document.getElementById('delete-student-name'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    fetchStudents();
});

// Event Listeners Setup
function initEventListeners() {
    // Toolbar
    elements.searchInput.addEventListener('input', applyFilters);
    elements.courseFilter.addEventListener('change', applyFilters);
    elements.btnRefresh.addEventListener('click', fetchStudents);

    // Modal Actions
    elements.btnAddStudent.addEventListener('click', () => openStudentModal());
    elements.modalClose.addEventListener('click', closeStudentModal);
    elements.btnCancel.addEventListener('click', closeStudentModal);
    elements.studentForm.addEventListener('submit', handleFormSubmit);

    // Delete Modal Actions
    elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
    elements.btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    // Backdrop clicks
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeStudentModal();
    });
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) closeDeleteModal();
    });
}

// Fetch Students from REST API
async function fetchStudents() {
    showLoading(true);
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        state.students = data;
        updateApiStatus(true);
        updateCourseDropdownOptions();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error fetching students:', error);
        updateApiStatus(false);
        showToast('Failed to connect to Django API backend.', 'error');
        renderTable([]);
    } finally {
        showLoading(false);
    }
}

// Update API Status Badge
function updateApiStatus(isConnected) {
    state.isApiConnected = isConnected;
    if (isConnected) {
        elements.apiStatus.className = 'status-badge status-online';
        elements.apiStatus.innerHTML = '<span class="status-dot"></span> API Connected';
    } else {
        elements.apiStatus.className = 'status-badge status-offline';
        elements.apiStatus.innerHTML = '<span class="status-dot"></span> Backend Offline';
    }
}

// Apply Search and Course Filters
function applyFilters() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    const selectedCourse = elements.courseFilter.value;

    state.filteredStudents = state.students.filter(student => {
        const matchesSearch = 
            student.name.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.course.toLowerCase().includes(searchTerm);
        
        const matchesCourse = selectedCourse === '' || student.course === selectedCourse;

        return matchesSearch && matchesCourse;
    });

    renderTable(state.filteredStudents);
}

// Update Course Dropdown Options
function updateCourseDropdownOptions() {
    const selectedValue = elements.courseFilter.value;
    const courses = [...new Set(state.students.map(s => s.course))].sort();

    elements.courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        if (course === selectedValue) option.selected = true;
        elements.courseFilter.appendChild(option);
    });
}

// Update Stats Dashboard Cards
function updateStats() {
    const totalStudents = state.students.length;
    const uniqueCourses = new Set(state.students.map(s => s.course)).size;
    
    let avgAge = 0;
    if (totalStudents > 0) {
        const sumAge = state.students.reduce((acc, s) => acc + (parseInt(s.age) || 0), 0);
        avgAge = (sumAge / totalStudents).toFixed(1);
    }

    elements.statTotalStudents.textContent = totalStudents;
    elements.statTotalCourses.textContent = uniqueCourses;
    elements.statAvgAge.textContent = avgAge;
}

// Render Table Rows
function renderTable(students) {
    elements.tableBody.innerHTML = '';

    if (students.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');

    students.forEach(student => {
        const tr = document.createElement('tr');
        
        const formattedDate = new Date(student.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        tr.innerHTML = `
            <td>#${student.id}</td>
            <td>
                <div class="student-name">${escapeHtml(student.name)}</div>
            </td>
            <td>
                <span class="student-email">${escapeHtml(student.email)}</span>
            </td>
            <td>
                <span class="course-badge">${escapeHtml(student.course)}</span>
            </td>
            <td>${student.age} yrs</td>
            <td>${formattedDate}</td>
            <td class="text-right">
                <div class="actions-cell">
                    <button class="btn-icon btn-edit" title="Edit Student" onclick="openStudentModal(${student.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Student" onclick="openDeleteModal(${student.id}, '${escapeHtml(student.name)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(tr);
    });
}

// Open Form Modal (Create or Edit)
function openStudentModal(id = null) {
    clearFormErrors();
    state.editingId = id;

    if (id) {
        const student = state.students.find(s => s.id === id);
        if (!student) return;
        elements.modalTitle.textContent = 'Edit Student Details';
        elements.studentId.value = student.id;
        elements.nameInput.value = student.name;
        elements.emailInput.value = student.email;
        elements.courseInput.value = student.course;
        elements.ageInput.value = student.age;
    } else {
        elements.modalTitle.textContent = 'Add New Student';
        elements.studentForm.reset();
        elements.studentId.value = '';
    }

    elements.modal.classList.remove('hidden');
}

// Close Form Modal
function closeStudentModal() {
    elements.modal.classList.add('hidden');
    clearFormErrors();
    state.editingId = null;
}

// Clear Validation Errors
function clearFormErrors() {
    ['name', 'email', 'course', 'age'].forEach(field => {
        const errDiv = document.getElementById(`error-${field}`);
        const input = elements[`${field}Input`];
        if (errDiv) errDiv.textContent = '';
        if (input) input.classList.remove('is-invalid');
    });
    elements.generalError.classList.add('hidden');
    elements.generalError.textContent = '';
}

// Handle Form Submission (POST/PUT)
async function handleFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const payload = {
        name: elements.nameInput.value,
        email: elements.emailInput.value,
        course: elements.courseInput.value,
        age: parseInt(elements.ageInput.value) || ''
    };

    const isEdit = Boolean(state.editingId);
    const url = isEdit ? `${API_BASE_URL}${state.editingId}/` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    setFormLoading(true);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showToast(isEdit ? 'Student updated successfully!' : 'Student created successfully!', 'success');
            closeStudentModal();
            fetchStudents();
        } else {
            // Handle Validation Errors from DRF
            handleValidationErrors(data);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        elements.generalError.textContent = 'Network error. Please check backend connection.';
        elements.generalError.classList.remove('hidden');
    } finally {
        setFormLoading(false);
    }
}

// Handle Django REST Framework Validation Errors
function handleValidationErrors(errorData) {
    let hasFieldErrors = false;

    for (const [field, messages] of Object.entries(errorData)) {
        const errDiv = document.getElementById(`error-${field}`);
        const input = elements[`${field}Input`];
        const msgText = Array.isArray(messages) ? messages.join(' ') : messages;

        if (errDiv && input) {
            errDiv.textContent = msgText;
            input.classList.add('is-invalid');
            hasFieldErrors = true;
        }
    }

    if (!hasFieldErrors && errorData.detail) {
        elements.generalError.textContent = errorData.detail;
        elements.generalError.classList.remove('hidden');
    }
}

// Open Delete Modal
function openDeleteModal(id, name) {
    state.deletingId = id;
    elements.deleteStudentName.textContent = name;
    elements.deleteModal.classList.remove('hidden');
}

// Close Delete Modal
function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
    state.deletingId = null;
}

// Handle Delete Execution
async function handleConfirmDelete() {
    if (!state.deletingId) return;

    setDeleteLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}${state.deletingId}/`, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            showToast('Student deleted successfully!', 'success');
            closeDeleteModal();
            fetchStudents();
        } else {
            showToast('Failed to delete student.', 'error');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Network error while deleting student.', 'error');
    } finally {
        setDeleteLoading(false);
    }
}

// UI State Helpers
function showLoading(isLoading) {
    if (isLoading) {
        elements.loadingState.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.loadingState.classList.add('hidden');
    }
}

function setFormLoading(isLoading) {
    const btnText = elements.btnSave.querySelector('.btn-text');
    const spinner = elements.btnSave.querySelector('.btn-spinner');
    elements.btnSave.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function setDeleteLoading(isLoading) {
    const btnText = elements.btnConfirmDelete.querySelector('.btn-text');
    const spinner = elements.btnConfirmDelete.querySelector('.btn-spinner');
    elements.btnConfirmDelete.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconSvg = type === 'success' 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Utility: HTML Escaping
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
