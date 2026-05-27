document.addEventListener('DOMContentLoaded', () => {
    // Initialize all Bootstrap Toasts
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl)
    });

    // Check login state (mock)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // Update navbar based on login state
    const userMenu = document.getElementById('user-menu');
    const loginBtn = document.getElementById('login-btn');
    const adminLink = document.getElementById('admin-link');
    
    if (userMenu && loginBtn) {
        if (isLoggedIn) {
            loginBtn.classList.add('d-none');
            userMenu.classList.remove('d-none');
            
            if (isAdmin && adminLink) {
                adminLink.classList.remove('d-none');
            }
        } else {
            loginBtn.classList.remove('d-none');
            userMenu.classList.add('d-none');
        }
    }
});

// Function to handle mock logout
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// Show Toast helper
function showToast(message, type = 'success') {
    // Check if container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-primary');
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 fade-in" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-info-circle-fill me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
    bsToast.show();
    
    // Remove from DOM after hide
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
