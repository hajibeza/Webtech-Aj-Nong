// ==========================================
// ★ ตัวแปรกลาง (Central Config) สำหรับ API/State Layer
// ==========================================

// ★ API Base URL — เปลี่ยนตรงนี้จุดเดียว ส่งผลทั้งโปรเจค
const API_BASE_URL = 'http://localhost:3000';

// ★ JWT helpers for protected API calls
function getAuthToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ★ พจนานุกรมแปลข้อมูลผู้สอน (Instructor Mapping) เพื่อแปลงชื่อย่อจาก API เป็นข้อมูลโปรไฟล์ตัวเต็ม
const INSTRUCTOR_MAP = {
    'Somkiat': {
        name: 'อ. สมเกียรติ โค้ดดิ้ง',
        role: 'Senior Fullstack Developer',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=50&q=80'
    },
    'Wittaya': {
        name: 'อ. วิทยา ดาต้าซายน์',
        role: 'Data Scientist & Analyst',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80'
    },
    'Praew': {
        name: 'อ. แพรว ยูเอ็กซ์ยูไอ',
        role: 'Lead UX/UI Designer',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&q=80'
    }
};

// ★ ฟังก์ชันดึง userId ที่ล็อกอินอยู่จาก localStorage
// แทนที่จะฮาร์ดโค้ด 'u-1' กระจายไปทั่ว เราเรียกฟังก์ชันนี้แทน
function getCurrentUserId() {
    return localStorage.getItem('userId');
}

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

    // สั่งให้ฟังก์ชันดึงข้อมูลคลาสเรียนทั้งหมดทำงาน (ถ้ามีฟังก์ชันนี้อยู่ในไฟล์)
    if (typeof loadAndDisplayClasses === 'function') {
        loadAndDisplayClasses();
    }

    // 2. สั่งให้ฟังก์ชันดึงรายละเอียดคลาสเรียนเดี่ยวทำงาน (สำหรับหน้า class-detail.html)
    if (typeof loadSingleClassDetail === 'function') {
        loadSingleClassDetail();
    }

    // 3. สั่งให้ฟังก์ชันดึงประวัติการจองทำงาน (สำหรับหน้า profile.html)
    if (typeof loadUserBookingHistory === 'function') {
        loadUserBookingHistory();
    }

});

// Function to handle mock logout
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
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

    // ★ แสดง Loading Spinner หมุนโหลดตรงกลางก่อนเริ่มยิง API (ข้อ 7)
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">กำลังโหลด...</span>
            </div>
            <p class="text-muted mt-3 fw-semibold">กำลังโหลดข้อมูลคลาสเรียนเรียนออนไลน์...</p>
        </div>
    `;

    try {
        // ยิงไปหา API เส้นของเพื่อนหลังบ้าน
        const response = await fetch(`${API_BASE_URL}/api/classes`);
        // ★ เช็คสถานะ response ก่อนอ่าน JSON เพื่อป้องกันกรณี Backend ส่ง 500 กลับมา
        if (!response.ok) {
            throw new Error(`API ตอบกลับสถานะ ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load classes');
        }

        const classes = data.data?.items || [];

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

// ==========================================
// พาร์ทที่ 2: ระบบดึงรายละเอียดและกดจองคลาสเรียน (หน้ารายละเอียด)
// ==========================================

// 1. ฟังก์ชันดึงข้อมูลรายละเอียดของคลาสเรียนที่ผู้ใช้เลือกมาแสดงผล
async function loadSingleClassDetail() {
    // แกะรหัสไอดีคลาสเรียนออกจาก URL Parameter (ตัวอย่าง: class-detail.html?id=cls-1)
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('id');

    // ตรวจสอบเบื้องต้น: ถ้าหน้านี้ไม่มีการส่งไอดีมา หรือไม่มีแท็กชื่อคลาส ให้หยุดทำงานทันที
    if (!classId || !document.getElementById('detail-title')) return;

    // ★ แสดง Loading Spinner เล็กๆ ประคอง UX สำหรับหัวข้อเรียนรู้ระหว่างรอ API (ข้อ 7)
    const topicsContainer = document.getElementById('detail-topics');
    if (topicsContainer) {
        topicsContainer.innerHTML = `
            <div class="py-3 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                กำลังโหลดรายละเอียดหัวข้อเรียนรู้ออนไลน์...
            </div>
        `;
    }

    try {
        // ส่งคำร้องขอร้องข้อมูลไปยัง API รายคลาสของฝั่งหลังบ้าน
        const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`);

        // ★ เช็คสถานะ response ทั้งหมด (รวม 404 และ 500)
        if (!response.ok) {
            if (response.status === 404) {
                alert('ไม่พบข้อมูลคลาสเรียนนี้ในระบบ');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`API ตอบกลับสถานะ ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            if (response.status === 404) {
                alert('ไม่พบข้อมูลคลาสเรียนนี้ในระบบ');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(result.message || `API ตอบกลับสถานะ ${response.status}`);
        }

        const item = result.data;

        // นำข้อมูลจริงที่หลังบ้านส่งมา นำไปกระจายใส่ตาม id แท็กต่างๆ ที่เราตั้งไว้ใน HTML
        document.getElementById('detail-img').src = item.imageUrl;
        document.getElementById('detail-title').innerText = item.title;
        document.getElementById('detail-desc').innerText = item.description;
        document.getElementById('detail-price').innerText = `฿${item.price.toLocaleString()}`;
        document.getElementById('detail-seats-text').innerText = `${item.seatsTaken}/${item.capacity}`;

        // [เพิ่มเติมใหม่] อัปเดต Breadcrumb, Category และวันเวลาจาก API
        const breadcrumbEl = document.getElementById('detail-breadcrumb');
        if (breadcrumbEl) breadcrumbEl.innerText = item.title;

        const categoryEl = document.getElementById('detail-category');
        if (categoryEl) categoryEl.innerText = item.category;

        const dateEl = document.getElementById('detail-date');
        if (dateEl) {
            const classDate = new Date(item.date);
            const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const formattedDate = `${classDate.getDate()} ${thaiMonths[classDate.getMonth()]} ${classDate.getFullYear() + 543}`;
            dateEl.innerHTML = `<i class="bi bi-calendar-event me-2"></i> ${formattedDate}`;
        }

        const timeEl = document.getElementById('detail-time');
        if (timeEl) {
            timeEl.innerHTML = `<i class="bi bi-clock me-2"></i> ${item.timeStart} - ${item.timeEnd} น.`;
        }

        // [เพิ่มเติมใหม่] อัปเดตตัวเตือนที่นั่งเหลือตามจริงอย่างยืดหยุ่น
        const seatsWarningEl = document.getElementById('detail-seats-warning');
        if (seatsWarningEl) {
            if (item.seatsAvailable <= 0) {
                seatsWarningEl.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger me-2"></i>ขออภัย คลาสเรียนนี้เต็มแล้ว';
                seatsWarningEl.className = 'small text-danger mt-2 mb-0';
            } else if (item.seatsAvailable <= 5) {
                seatsWarningEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>เหลืออีกเพียง ${item.seatsAvailable} ที่นั่งสุดท้าย!`;
                seatsWarningEl.className = 'small text-danger mt-2 mb-0';
            } else {
                seatsWarningEl.innerHTML = `<i class="bi bi-check-circle-fill text-success me-2"></i>เปิดรับสมัครปกติ (เหลือ ${item.seatsAvailable} ที่นั่ง)`;
                seatsWarningEl.className = 'small text-success mt-2 mb-0';
            }
        }

        // [เพิ่มเติมใหม่] อัปเดตข้อมูลและโปรไฟล์ของผู้สอนแบบ Dynamic
        const instructorInfo = INSTRUCTOR_MAP[item.instructor] || {
            name: `อ. ${item.instructor}`,
            role: 'วิทยากรผู้เชี่ยวชาญ',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=50&q=80'
        };

        const instructorImgEl = document.getElementById('detail-instructor-img');
        if (instructorImgEl) {
            instructorImgEl.src = instructorInfo.image;
            instructorImgEl.alt = instructorInfo.name;
        }

        const instructorNameEl = document.getElementById('detail-instructor-name');
        if (instructorNameEl) instructorNameEl.innerText = instructorInfo.name;

        const instructorRoleEl = document.getElementById('detail-instructor-role');
        if (instructorRoleEl) instructorRoleEl.innerText = instructorInfo.role;

        // คำนวณสัดส่วนเปอร์เซ็นต์ที่นั่งเพื่อนำไปปรับความยาวของหลอด Progress Bar แบบเรียลไทม์
        const progressPercent = (item.seatsTaken / item.capacity) * 100;
        document.getElementById('detail-seats-progress').style.width = `${progressPercent}%`;

        // ทำการลูปสร้างรายการสิ่งที่จะได้เรียนรู้ (Topics) แปะลงในหน้าเว็บ
        const topicsContainer = document.getElementById('detail-topics');
        if (topicsContainer) {
            topicsContainer.innerHTML = ''; // ล้างรายการสมมุติเดิมใน HTML ออกก่อน
            item.topics.forEach(topic => {
                topicsContainer.insertAdjacentHTML('beforeend', `
                    <li class="list-group-item bg-transparent px-0">
                        <i class="bi bi-check-circle-fill text-success me-2"></i> ${topic}
                    </li>
                `);
            });
        }

        // ตรวจสอบสถานะปุ่มจอง: หากที่นั่งเต็มแล้ว ให้ทำการปิดการใช้งานปุ่มทันที
        const bookBtn = document.getElementById('btn-book-now');
        if (bookBtn) {
            if (item.seatsAvailable <= 0) {
                // กรณีที่นั่งเต็ม → ปิดปุ่มเลย
                bookBtn.innerText = 'ที่นั่งเต็มแล้ว';
                bookBtn.className = 'btn btn-secondary w-100 py-3 fs-5';
                bookBtn.removeAttribute('onclick');
                bookBtn.style.pointerEvents = 'none';
            } else {
                // ★ กรณีที่นั่งยังว่าง → เปลี่ยนปุ่มจาก "กำลังโหลด" เป็นปุ่มจองจริง
                bookBtn.innerHTML = '<i class="bi bi-ticket-perforated me-2"></i> จองคลาสนี้ทันที';
                bookBtn.className = 'btn btn-primary-custom w-100 py-3 fs-5';
                bookBtn.classList.remove('disabled');
                // ★ ฝัง classId เข้าไปในปุ่ม → เมื่อ User กด จะส่ง id ไปยิง API ได้ถูกต้อง
                bookBtn.setAttribute('onclick', `processClassBooking('${item.id}')`);
            }
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดคลาส:', error);
    }
}

// 2. ฟังก์ชันส่งข้อมูลคำร้องขอจองคลาสเรียนไปยังระบบหลังบ้าน
async function processClassBooking(classId) {
    // ตรวจสอบสิทธิ์: ดึงสถานะการล็อกอินปัจจุบันจาก localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการจองคลาสเรียนครับ');
        window.location.href = 'login.html'; // ส่งไปหน้าล็อกอิน
        return;
    }

    const token = getAuthToken();
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการจองคลาสเรียนครับ');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ classId })
        });

        const result = await response.json();

        if (response.status === 201 && result.success) {
            window.location.href = `payment.html?bookingId=${result.data.id}`;
        }
        else if (response.status === 409) {
            alert(result.message || 'ขออภัยด้วยครับ! คลาสเรียนนี้เต็มแล้ว');
            window.location.reload();
        }
        else {
            alert(`ไม่สามารถทำรายการได้: ${result.message || 'ระบบขัดข้อง'}`);
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่ง request การจอง:', error);
        alert('ไม่สามารถเชื่อมต่อระบบหลังบ้านได้ในขณะนี้');
    }
}

// ==========================================
// พาร์ทที่ 3: ระบบดึงประวัติการจองจริงของผู้ใช้ (หน้า Profile แบบแผ่นการ์ด)
// ==========================================

async function loadUserBookingHistory() {
    const container = document.getElementById('booking-history-container');
    // ดักไว้ก่อน: ถ้าหน้านี้ไม่มีพื้นที่แสดงประวัติการจอง ให้หยุดทำงานทันทีเพื่อกันเออร์เรอร์
    if (!container) return;

    // ★ แสดง Loading Spinner ตรงกลางหน้าประวัติการจองก่อนเริ่มยิง API (ข้อ 7)
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
                <span class="visually-hidden">กำลังโหลด...</span>
            </div>
            <p class="text-muted mt-2 fw-semibold">กำลังเชื่อมต่อข้อมูลการจองของคุณ...</p>
        </div>
    `;

    const token = getAuthToken();
    if (!token) {
        container.innerHTML = `<div class="text-center text-muted py-5"><p>กรุณา<a href="login.html">เข้าสู่ระบบ</a>เพื่อดูประวัติการจอง</p></div>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error(`API ตอบกลับสถานะ ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load bookings');
        }

        const bookings = data.data?.items || [];

        // ★ [เพิ่มเติมใหม่สำหรับข้อ 12] คำนวณสถิติจากประวัติการจองจริง
        const activeBookings = bookings.filter(b => b.status !== 'canceled');
        const paidBookings = bookings.filter(b => b.status === 'paid');
        const pendingBookings = bookings.filter(b => b.status === 'pending');

        // ส่งตัวเลขไปอัปเดตบนหน้าเว็บจริงแบบเรียลไทม์
        const statTotalEl = document.getElementById('stat-total');
        if (statTotalEl) statTotalEl.innerText = activeBookings.length;

        const statPaidEl = document.getElementById('stat-paid');
        if (statPaidEl) statPaidEl.innerText = paidBookings.length;

        const statPendingEl = document.getElementById('stat-pending');
        if (statPendingEl) statPendingEl.innerText = pendingBookings.length;

        // เคลียร์พื้นที่ล้างกล่องข้อมูลทดสอบเก่าออกให้หมดก่อน
        container.innerHTML = '';

        if (bookings.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><p><i class="bi bi-folder-x fs-2 d-block mb-2"></i>คุณยังไม่มีประวัติการจองคลาสเรียนในขณะนี้</p></div>`;
            return;
        }

        // วนลูปข้อมูลรายการใบจองที่ดึงมาจากหลังบ้านมาประกอบเป็นการ์ด HTML
        bookings.forEach(booking => {
            // 1. ดักจัดการสีของป้ายบอกสถานะ (Badge) และสไตล์ของการ์ดตามสเตตัสใบจอง
            let statusBadge = '';
            let cardBgClass = 'bg-white';
            let actionButtons = '';

            if (booking.status === 'paid') {
                statusBadge = '<span class="badge bg-success px-3 py-2 rounded-pill shadow-sm">ชำระเงินสำเร็จ</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-outline-danger" disabled>ยกเลิกการจอง</button>
                    <button class="btn btn-sm btn-primary-custom ms-2"><i class="bi bi-camera-video me-1"></i> เข้าเรียน</button>
                `;
            } else if (booking.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">รอชำระเงิน</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-outline-danger" onclick="cancelBooking('${booking.id}')">ยกเลิกการจอง</button>
                    <a href="payment.html?bookingId=${booking.id}" class="btn btn-sm btn-primary-custom ms-2">ชำระเงินต่อ</a>
                `;
            } else {
                statusBadge = `<span class="badge bg-secondary px-3 py-2 rounded-pill">${booking.status}</span>`;
                cardBgClass = 'bg-light'; // ปรับการ์ดเป็นสีเทาสำหรับเคสเรียนจบแล้วหรือยกเลิก
                actionButtons = `<button class="btn btn-sm btn-outline-secondary" disabled>เสร็จสิ้น</button>`;
            }

            // ★ แก้ไข: ดึงชื่อคลาสจาก classInfo.title (ตาม API Structure ของหลังบ้าน)
            const classTitle = (booking.classInfo && booking.classInfo.title) || 'ไม่ทราบชื่อคลาส';
            // ★ แก้ไข: ใช้ field "amount" แทน "price" (ตาม API Structure ของหลังบ้าน)
            const bookingAmount = booking.amount || 0;

            // 2. ประกอบร่างการ์ด HTML ด้วยรูปแบบ (UI) ดั้งเดิมของน้อง
            const itemHtml = `
                <div class="card border-0 ${cardBgClass} shadow-sm mb-3 position-relative">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="fw-bold mb-1">${classTitle}</h5>
                                <p class="text-muted small mb-0">
                                    <i class="bi bi-ticket-perforated me-1"></i> รหัสใบจอง: ${booking.id}
                                </p>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="fw-bold">ยอดชำระ: ฿${bookingAmount.toLocaleString()}</span>
                            <div>
                                ${actionButtons}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 3. แปะแผ่นการ์ดใบจองจริงเรียงลงบนหน้าเว็บ
            container.insertAdjacentHTML('beforeend', itemHtml);
        });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดประวัติการจอง:', error);
        container.innerHTML = `<div class="text-center text-danger py-5"><p>ไม่สามารถโหลดข้อมูลประวัติการจองได้ในขณะนี้</p></div>`;
    }
}

// ★ ฟังก์ชันส่งคำร้องขอยกเลิกการจองคลาสเรียนไปยังระบบหลังบ้าน (ข้อ 5)
async function cancelBooking(bookingId) {
    const isConfirm = confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองคลาสเรียนนี้?');
    if (!isConfirm) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'canceled' })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || `API ตอบกลับสถานะ ${response.status}`);
        }

        showToast('ยกเลิกการจองคลาสเรียนสำเร็จแล้วครับ', 'success');
        
        // โหลดประวัติการจองใหม่เพื่ออัปเดตหน้าจอแบบเรียลไทม์
        loadUserBookingHistory();

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการยกเลิกการจอง:', error);
        showToast('ไม่สามารถยกเลิกการจองได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง', 'danger');
    }
}
