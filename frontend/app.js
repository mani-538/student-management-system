// Student Management System - Plain JavaScript Frontend Logic
const API_BASE_URL = 'http://127.0.0.1:8000/api/students/';

// Application State
let state = {
    students: [],
    editingId: null,
    isSubmitting: false
};

// DOM References
const elements = {
    studentForm: document.getElementById('student-form'),
    formHeading: document.getElementById('form-heading'),
    studentIdInput: document.getElementById('student-id'),
    nameInput: document.getElementById('student-name'),
    emailInput: document.getElementById('student-email'),
    courseInput: document.getElementById('student-course'),
    ageInput: document.getElementById('student-age'),
    submitBtn: document.getElementById('submit-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    
    searchInput: document.getElementById('search-input'),
    totalCounter: document.getElementById('total-students-counter'),
    
    notificationArea: document.getElementById('notification-area'),
    loadingIndicator: document.getElementById('loading-indicator'),
    emptyState: document.getElementById('empty-state'),
    errorState: document.getElementById('error-state'),
    tableContainer: document.getElementById('table-container'),
    tableBody: document.getElementById('student-table-body')
};

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
    elements.studentForm.addEventListener('submit', handleFormSubmit);
    elements.cancelEditBtn.addEventListener('click', cancelEditMode);
    elements.searchInput.addEventListener('input', handleSearch);

    // Initial Load
    fetchStudents();
});

// Fetch All Students (Read)
async function fetchStudents() {
    showState('loading');
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
        
        const data = await response.json();
        state.students = Array.isArray(data) ? data : [];
        
        updateTotalCounter(state.students.length);
        renderStudents(state.students);
    } catch (error) {
        console.error('Fetch Students Error:', error);
        showState('error');
        showNotification('Unable to connect to Student Management API server.', 'error');
    }
}

// Display UI States (loading, empty, error, content)
function showState(stateName) {
    elements.loadingIndicator.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.tableContainer.classList.add('hidden');

    if (stateName === 'loading') {
        elements.loadingIndicator.classList.remove('hidden');
    } else if (stateName === 'empty') {
        elements.emptyState.classList.remove('hidden');
    } else if (stateName === 'error') {
        elements.errorState.classList.remove('hidden');
    } else if (stateName === 'content') {
        elements.tableContainer.classList.remove('hidden');
    }
}

// Render Student Records safely using DOM methods (protecting against XSS)
function renderStudents(studentsList) {
    elements.tableBody.innerHTML = '';

    if (!studentsList || studentsList.length === 0) {
        showState('empty');
        return;
    }

    showState('content');

    studentsList.forEach(student => {
        const tr = document.createElement('tr');

        // ID
        const tdId = document.createElement('td');
        tdId.textContent = `#${student.id}`;
        tr.appendChild(tdId);

        // Name
        const tdName = document.createElement('td');
        tdName.textContent = student.name;
        tr.appendChild(tdName);

        // Email
        const tdEmail = document.createElement('td');
        tdEmail.textContent = student.email;
        tr.appendChild(tdEmail);

        // Course
        const tdCourse = document.createElement('td');
        tdCourse.textContent = student.course;
        tr.appendChild(tdCourse);

        // Age
        const tdAge = document.createElement('td');
        tdAge.textContent = `${student.age}`;
        tr.appendChild(tdAge);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.className = 'text-right';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'table-actions';

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => populateEditForm(student));
        actionsDiv.appendChild(editBtn);

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => handleDeleteStudent(student.id, student.name));
        actionsDiv.appendChild(deleteBtn);

        tdActions.appendChild(actionsDiv);
        tr.appendChild(tdActions);

        elements.tableBody.appendChild(tr);
    });
}

// Client-Side Search
function handleSearch() {
    const query = elements.searchInput.value.toLowerCase().trim();
    if (!query) {
        renderStudents(state.students);
        updateTotalCounter(state.students.length);
        return;
    }

    const filtered = state.students.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.course.toLowerCase().includes(query)
    );

    renderStudents(filtered);
    updateTotalCounter(filtered.length);
}

// Client-Side Form Validation
function validateForm() {
    clearFieldErrors();
    let isValid = true;

    const name = elements.nameInput.value;
    const email = elements.emailInput.value;
    const course = elements.courseInput.value;
    const age = elements.ageInput.value;

    // Name Validation
    if (!name || !name.trim()) {
        showFieldError('name', 'Name is required and cannot be empty or spaces-only.');
        isValid = false;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
        showFieldError('email', 'Email is required.');
        isValid = false;
    } else if (!emailRegex.test(email.trim())) {
        showFieldError('email', 'Please enter a valid email address.');
        isValid = false;
    }

    // Course Validation
    if (!course || !course.trim()) {
        showFieldError('course', 'Course is required and cannot be empty or spaces-only.');
        isValid = false;
    }

    // Age Validation
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum)) {
        showFieldError('age', 'Age is required.');
        isValid = false;
    } else if (ageNum < 16 || ageNum > 100) {
        showFieldError('age', 'Age must be an integer between 16 and 100.');
        isValid = false;
    }

    return isValid;
}

// Show Field Error
function showFieldError(field, message) {
    const errorSpan = document.getElementById(`error-${field}`);
    const input = elements[`${field}Input`];
    if (errorSpan) errorSpan.textContent = message;
    if (input) input.classList.add('is-invalid');
}

// Clear Field Errors
function clearFieldErrors() {
    ['name', 'email', 'course', 'age'].forEach(field => {
        const errorSpan = document.getElementById(`error-${field}`);
        const input = elements[`${field}Input`];
        if (errorSpan) errorSpan.textContent = '';
        if (input) input.classList.remove('is-invalid');
    });
}

// Form Submission (Create or Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    if (!validateForm()) return;

    const payload = {
        name: elements.nameInput.value.trim(),
        email: elements.emailInput.value.trim().toLowerCase(),
        course: elements.courseInput.value.trim(),
        age: parseInt(elements.ageInput.value, 10)
    };

    const isEditing = Boolean(state.editingId);
    const url = isEditing ? `${API_BASE_URL}${state.editingId}/` : API_BASE_URL;
    const method = isEditing ? 'PUT' : 'POST';

    setSubmitting(true);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            const successMsg = isEditing ? 'Student updated successfully!' : 'Student created successfully!';
            showNotification(successMsg, 'success');
            resetForm();
            fetchStudents();
        } else {
            // Display backend validation error messages
            handleBackendErrors(data);
        }
    } catch (error) {
        console.error('Submit Error:', error);
        showNotification('Failed to submit form. Check server connection.', 'error');
    } finally {
        setSubmitting(false);
    }
}

// Map DRF Backend Validation Messages to Fields
function handleBackendErrors(errorObj) {
    let unmappedMessages = [];

    for (const [field, messages] of Object.entries(errorObj)) {
        const msgText = Array.isArray(messages) ? messages.join(' ') : messages;
        if (['name', 'email', 'course', 'age'].includes(field)) {
            showFieldError(field, msgText);
        } else {
            unmappedMessages.push(msgText);
        }
    }

    if (unmappedMessages.length > 0) {
        showNotification(unmappedMessages.join(' '), 'error');
    } else {
        showNotification('Validation error. Please review the highlighted fields.', 'error');
    }
}

// Populate Form for Editing (Update)
function populateEditForm(student) {
    state.editingId = student.id;
    elements.studentIdInput.value = student.id;
    elements.nameInput.value = student.name;
    elements.emailInput.value = student.email;
    elements.courseInput.value = student.course;
    elements.ageInput.value = student.age;

    elements.formHeading.textContent = `Edit Student (#${student.id})`;
    elements.submitBtn.textContent = 'Update Student';
    elements.cancelEditBtn.classList.remove('hidden');

    clearFieldErrors();
    elements.nameInput.focus();
}

// Cancel Edit Mode
function cancelEditMode() {
    resetForm();
    showNotification('Edit mode cancelled.', 'info');
}

// Reset Form State
function resetForm() {
    state.editingId = null;
    elements.studentForm.reset();
    elements.studentIdInput.value = '';
    
    elements.formHeading.textContent = 'Add New Student';
    elements.submitBtn.textContent = 'Add Student';
    elements.cancelEditBtn.classList.add('hidden');
    
    clearFieldErrors();
}

// Delete Student
async function handleDeleteStudent(id, name) {
    const confirmed = window.confirm(`Are you sure you want to delete student "${name}" (#${id})?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}${id}/`, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            showNotification(`Student "${name}" deleted successfully.`, 'success');
            
            // Reset edit form if we were editing the deleted student
            if (state.editingId === id) {
                resetForm();
            }

            fetchStudents();
        } else {
            showNotification('Failed to delete student.', 'error');
        }
    } catch (error) {
        console.error('Delete Error:', error);
        showNotification('Network error while deleting student.', 'error');
    }
}

// Disable Submit Button During Network Operations
function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    elements.submitBtn.disabled = isSubmitting;
    if (isSubmitting) {
        elements.submitBtn.textContent = state.editingId ? 'Updating...' : 'Saving...';
    } else {
        elements.submitBtn.textContent = state.editingId ? 'Update Student' : 'Add Student';
    }
}

// Update Total Counter Display
function updateTotalCounter(count) {
    elements.totalCounter.textContent = `Total: ${count}`;
}

// Show Toast Notification
function showNotification(message, type = 'success') {
    elements.notificationArea.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    elements.notificationArea.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
}
