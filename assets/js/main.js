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

// 1. สร้างฟังก์ชันสำหรับยิงไปดึงข้อมูลคลาสเรียนจากหลังบ้าน
async function loadAndDisplayClasses() {
    const container = document.getElementById('class-list-container');
    if (!container) return; // ดักไว้เผื่อกรณีที่โหลดหน้าอื่นที่ไม่มีคอนเทนเนอร์นี้ จะได้ไม่เกิด Error ใน Console

    try {
        // ยิงไปหา API เส้นของเพื่อนหลังบ้าน
        const response = await fetch('http://localhost:3000/api/classes');
        const data = await response.json();

        // ดึง Array ของ classes ออกมาจาก data.items (ตามที่เพื่อนตั้ง API Structure ไว้)
        const classes = data.items || [];

        // ล้างข้อมูลเก่าหรือข้อความที่อาจจะค้างอยู่
        container.innerHTML = '';

        if (classes.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted"><p>ไม่มีข้อมูลคลาสเรียนในระบบ</p></div>`;
            return;
        }

        // วนลูปข้อมูลเพื่อสร้าง HTML การ์ดแต่ละใบไปแปะในหน้าเว็บ
        classes.forEach(item => {
            // Logic เช็กที่นั่งเต็มเพื่อแสดงความแตกต่างบนป้าย (Badge)
            const isFull = item.seatsAvailable <= 0;
            const badgeColor = isFull ? 'bg-danger' : 'bg-warning text-dark';
            const badgeText = isFull ? 'เต็มแล้ว' : `${item.seatsTaken}/${item.capacity}`;

            // Logic ปรับแต่งปุ่มกด
            const buttonHtml = isFull 
                ? `<button class="btn btn-secondary" disabled>ที่นั่งเต็ม</button>`
                : `<a href="class-detail.html?id=${item.id}" class="btn btn-primary-custom">ดูรายละเอียด</a>`;

            const cardHtml = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 glass-card">
                        <img src="${item.imageUrl}" class="card-img-top class-img" alt="${item.title}">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">${item.category}</span>
                                <span class="badge ${badgeColor} rounded-pill">${isFull ? '' : '<i class="bi bi-fire"></i> '} ${badgeText}</span>
                            </div>
                            <h5 class="card-title fw-bold">${item.title}</h5>
                            <p class="text-muted small mb-3"><i class="bi bi-person-video3 me-1"></i> ผู้สอน: ${item.instructor}</p>
                            <div class="d-flex align-items-center mb-3 text-sm">
                                <i class="bi bi-calendar-event text-primary me-2"></i> ${item.date} | ${item.timeStart} - ${item.timeEnd} น.
                            </div>
                            <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                                <span class="fs-5 fw-bold text-success">฿${item.price.toLocaleString()}</span>
                                ${buttonHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // แปะการ์ดที่ประกอบขึ้นมาลงบนคอนเทนเนอร์ใน HTML
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error('Error fetching classes:', error);
        container.innerHTML = `<div class="col-12 text-center text-danger"><p><i class="bi bi-exclamation-triangle-fill"></i> เกิดข้อผิดพลาดในการโหลดข้อมูลระบบ</p></div>`;
    }
}

// 2. เรียกใช้งานฟังก์ชันเมื่อหน้าเว็บทำงานสำเร็จ
document.addEventListener('DOMContentLoaded', () => {
    // โค้ดของเก่าน้องที่เช็กสเตตัสล็อกอิน...
    // ...
    
    // เรียกใช้ฟังก์ชันดึงคลาสเรียนที่เพิ่งเขียนเสร็จข้างบน
    loadAndDisplayClasses();
});
