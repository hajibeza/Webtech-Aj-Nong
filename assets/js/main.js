// ==========================================
// ★ ตัวแปรกลาง (Central Config) สำหรับ API/State Layer
// ==========================================

// ★ API Base URL — เปลี่ยนตรงนี้จุดเดียว ส่งผลทั้งโปรเจค
const API_BASE_URL = 'http://localhost:3000';

// ★ ตัวแปรเก็บแคชของคลาสเรียนทั้งหมดที่ดึงมาจาก API (สำหรับฟีเจอร์ค้นหา/คัดกรอง)
let classesCache = [];

// ★ JWT helpers for protected API calls
function getAuthToken() {
    // ดึง JWT Token ที่เซฟไว้ใน localStorage ออกมาใช้งาน
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    // สร้าง Header สำหรับยิง API ในรูปแบบ JSON
    const headers = { 'Content-Type': 'application/json' };
    // ดึง Token ปัจจุบันออกมา
    const token = getAuthToken();
    if (token) {
        // ถ้ามี Token อยู่ ให้แนบ Bearer Token ใน Authorization Header เพื่อยืนยันตัวตนกับหลังบ้าน
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
    // ดึง userId ของผู้ใช้ปัจจุบันที่เซฟไว้ตอนล็อกอินสำเร็จ
    return localStorage.getItem('userId');
}

// ==========================================
// ★ [Phase 2 — ข้อ 3] Booking State Management
// ระบบจัดการสถานะการจองส่วนกลาง (Single Source of Truth)
// ข้อมูลการจองทั้งหมดจะถูกเก็บไว้ใน Array นี้ตัวเดียว
// และจะถูกบันทึก/กู้คืนผ่าน localStorage อัตโนมัติ
// ==========================================

// ★ ตัวแปรกลางเก็บข้อมูลการจองทั้งหมด (Single Source of Truth)
let bookingState = [];

// ★ บันทึกสถานะการจองลง localStorage (Persistence)
// เรียกทุกครั้งที่มีการเปลี่ยนแปลงข้อมูลใน bookingState
function persistBookingState() {
    // แปลงอาเรย์ bookingState เป็น JSON String (Serialization) แล้วเซฟลง localStorage เพื่อรักษาข้อมูลไว้
    localStorage.setItem('bookingState', JSON.stringify(bookingState));
}

// ★ กู้คืนสถานะการจองจาก localStorage กลับเข้า bookingState (Hydration)
// เรียกตอนเปิดหน้าเว็บครั้งแรก (DOMContentLoaded) เพื่อให้ข้อมูลไม่หายแม้รีเฟรช
function hydrateBookingState() {
    try {
        // ดึงค่า String ของการจองที่เซฟไว้ใน localStorage ออกมา
        const saved = localStorage.getItem('bookingState');
        if (saved) {
            // แปลง JSON String กลับมาเป็นอาเรย์ในโปรแกรม (Deserialization)
            bookingState = JSON.parse(saved);
        }
    } catch (error) {
        // หากเกิดข้อผิดพลาดในการโหลด ให้ทำการล้างค่าเป็นอาเรย์ว่างเปล่า
        console.error('ไม่สามารถกู้คืนข้อมูลการจองได้:', error);
        bookingState = [];
    }
}

// ★ เพิ่มใบจองใหม่เข้า State กลาง แล้วบันทึกลง localStorage
function addBookingToState(booking) {
    // ป้องกันข้อมูลซ้ำ: เช็คว่ามี booking id นี้อยู่แล้วหรือยังในอาเรย์
    const exists = bookingState.find(b => b.id === booking.id);
    if (!exists) {
        // ถ้าไม่มีใบจองไอดีนี้ ให้ผลักข้อมูลใบจองใหม่เข้าไปในอาเรย์ bookingState
        bookingState.push(booking);
        // บันทึกอัปเดตลง localStorage ทันที
        persistBookingState();
    }
}

// ★ อัปเดตสถานะของใบจองที่มีอยู่แล้ว (เช่น เปลี่ยนจาก pending → canceled)
function updateBookingInState(bookingId, updates) {
    // ค้นหาตำแหน่งอินเด็กซ์ของใบจองที่ต้องการอัปเดตในอาเรย์
    const index = bookingState.findIndex(b => b.id === bookingId);
    if (index !== -1) {
        // ถ้าเจอ ให้ทำการ Merge ข้อมูลใหม่ทับของเดิมโดยใช้ Spread Operator
        bookingState[index] = { ...bookingState[index], ...updates };
        // บันทึกอัปเดตลง localStorage ทันที
        persistBookingState();
    }
}

// ★ ลบใบจองออกจาก State กลาง (ใช้กรณีพิเศษ)
function removeBookingFromState(bookingId) {
    // กรองข้อมูลโดยตัดใบจองที่มีรหัสที่เลือกออกไป
    bookingState = bookingState.filter(b => b.id !== bookingId);
    // บันทึกอัปเดตลง localStorage ทันที
    persistBookingState();
}

// ★ ดึงข้อมูลการจองทั้งหมดจาก State กลาง
function getBookingState() {
    // ส่งอาเรย์สถานะการจองทั้งหมดออกไปใช้งาน
    return bookingState;
}

// ==========================================
// ★ [Phase 2 — ข้อ 9] Auth Guard
// ตรวจสอบสิทธิ์ก่อนเข้าหน้าลับ (เช่น profile, payment)
// ถ้ายังไม่ได้ล็อกอิน จะดีดกลับไปหน้า login ทันที
// ==========================================
function requireAuth() {
    // ตรวจสอบ JWT Token สิทธิ์ผู้ใช้งาน
    const token = getAuthToken();
    // ตรวจสอบตัวแปรเช็คสถานะการล็อกอิน
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!token || !isLoggedIn) {
        // หากไม่มี Token หรือยังไม่ได้ล็อกอิน ให้เปลี่ยนหน้าดีดผู้ใช้กลับไปที่หน้าล็อกอินทันที
        window.location.href = 'login.html';
        return false;
    }
    // ผ่านการเช็คสิทธิ์ (ส่งผลลัพธ์ว่าผ่าน)
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    // ★ [Phase 2 — ข้อ 3] กู้คืนสถานะการจองจาก localStorage ก่อนทำอย่างอื่น (Hydration)
    hydrateBookingState();

    // เริ่มต้นใช้งาน Bootstrap Toasts ทั้งหมดในหน้าจอ
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl)
    });

    // ดึงเช็คสถานะล็อกอินและแอดมินปัจจุบันจาก localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // ดึงอ้างอิง Element เมนูผู้ใช้และปุ่มเข้าสู่ระบบใน Navbar
    const userMenu = document.getElementById('user-menu');
    const loginBtn = document.getElementById('login-btn');
    const adminLink = document.getElementById('admin-link');

    if (userMenu && loginBtn) {
        if (isLoggedIn) {
            // หากล็อกอินอยู่ ให้ซ่อนปุ่มเข้าสู่ระบบ และโชว์ปุ่มเมนูโปรไฟล์ของผู้ใช้
            loginBtn.classList.add('d-none');
            userMenu.classList.remove('d-none');

            // หากผู้ใช้เป็น Admin ให้เปิดการลิงก์ไปหน้าระบบจัดการหลังบ้าน
            if (isAdmin && adminLink) {
                adminLink.classList.remove('d-none');
            }
        } else {
            // หากยังไม่ล็อกอิน ให้โชว์ปุ่มล็อกอินปกติ และซ่อนเมนูผู้ใช้ไว้
            loginBtn.classList.remove('d-none');
            userMenu.classList.add('d-none');
        }
    }

    // ★ [Phase 2 — ข้อ 9] Auth Guard: ตรวจสิทธิ์ก่อนเข้าหน้า protected
    // ถ้าอยู่หน้า profile หรือ payment แล้วยังไม่ได้ล็อกอิน → ดีดกลับไป login
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['profile.html', 'payment.html'];
    if (protectedPages.includes(currentPage)) {
        if (!requireAuth()) return; // หยุดทำงานทั้งหมดถ้ายังไม่ได้ล็อกอิน
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

// ฟังก์ชันลบตัวแปรออกจากหน่วยความจำและทำการออกจากระบบ
function handleLogout() {
    // ลบตัวแปรสถานะและข้อมูลส่วนตัวทั้งหมดออกจาก localStorage เพื่อทำลาย session ล็อกอิน
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    // ★ [Phase 2 — ข้อ 3] ล้างสถานะการจองออกจาก localStorage ตอนออกจากระบบด้วย
    localStorage.removeItem('bookingState');
    bookingState = [];
    // เปลี่ยนเส้นทางผู้ใช้กลับไปยังหน้าแรก
    window.location.href = 'index.html';
}

// ฟังก์ชันสร้างและกระตุ้นการแสดงกล่องแจ้งเตือนข้อมูลด่วน Toast แบบสวยงาม
function showToast(message, type = 'success') {
    // ดึง HTML Container ของตัวแจ้งเตือนด่วน (Toast)
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // หากยังไม่มี ให้สร้างขึ้นใหม่ใน DOM แล้วแปะไว้ที่มุมล่างขวาของหน้าจอ
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    // สุ่มสร้างรหัส ID เพื่อป้องกันการทับซ้อนกันเมื่อมี Toast แสดงขึ้นมาหลายตัวพร้อมกัน
    const toastId = 'toast-' + Date.now();
    // กำหนดสีพื้นหลังตามประเภทแจ้งเตือน (สำเร็จ = เขียว, ผิดพลาด = แดง, ปกติ = น้ำเงิน)
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-primary');

    // ประกอบร่างโครงสร้าง HTML ของ Toast
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

    // ใส่ HTML ใหม่ลงในกล่องบรรจุ
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    // สั่งแสดงผลแจ้งเตือนด้วย Bootstrap Toast (แสดงผลค้างไว้ 3 วินาที)
    const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
    bsToast.show();

    // ลบ Element นั้นออกจากหน้าจอทิ้งไปเพื่อป้องกัน RAM เต็มเมื่อซ่อนการแจ้งเตือนแล้ว
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// 1. สร้างฟังก์ชันสำหรับยิงไปดึงข้อมูลคลาสเรียนจากหลังบ้าน
async function loadAndDisplayClasses() {
    // ดึง Element คอนเทนเนอร์สำหรับแสดงรายการคลาสเรียน
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
        // ยิงคำร้องขอ GET ไปยัง API เส้นรวมคลาสเรียนทั้งหมดของหลังบ้าน
        const response = await fetch(`${API_BASE_URL}/api/classes`);
        // ★ เช็คสถานะ response ก่อนอ่าน JSON เพื่อป้องกันกรณี Backend ส่ง 500 กลับมา
        if (!response.ok) {
            throw new Error(`API ตอบกลับสถานะ ${response.status}`);
        }
        // แปลงผลการตอบกลับเป็น JSON Object
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load classes');
        }

        // เก็บข้อมูลรายการคลาสเรียนเข้าตัวแปรแคชสำหรับประมวลผลการค้นหา/ฟิลเตอร์
        classesCache = data.data?.items || [];

        // สั่งวาดแสดงผลคลาสเรียนครั้งแรกบนหน้าแรก
        renderClasses(classesCache);

        // ติดตั้งตัวรับฟังอีเวนต์สำหรับฟิลเตอร์ค้นหาและการจัดเรียงราคา
        setupFilteringListeners();

    } catch (error) {
        console.error('Error fetching classes:', error);
        // แสดงข้อความผิดพลาดบนจอหากดึง API ไม่สำเร็จ
        container.innerHTML = `<div class="col-12 text-center text-danger"><p><i class="bi bi-exclamation-triangle-fill"></i> เกิดข้อผิดพลาดในการโหลดข้อมูลระบบ</p></div>`;
    }
}

// ★ ฟังก์ชันสำหรับประกอบการ์ด HTML และเรนเดอร์ลงในหน้าแรก (Separation of Content & UI)
function renderClasses(classList) {
    const container = document.getElementById('class-list-container');
    if (!container) return;

    // ล้าง HTML เดิมออกทั้งหมดเพื่อเตรียมวาดอันที่กรองแล้วใหม่
    container.innerHTML = '';

    if (classList.length === 0) {
        // แสดงหน้าว่างพร้อมแจ้งเตือนในกรณีที่ไม่พบผลลัพธ์
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-search fs-1 d-block mb-3 text-secondary"></i>
                <p class="fw-semibold">ไม่พบข้อมูลคลาสเรียนที่คุณต้องการค้นหา</p>
                <p class="small">กรุณาลองเปลี่ยนคำค้นหาใหม่อีกครั้งครับ</p>
            </div>
        `;
        return;
    }

    // วนลูปข้อมูลเพื่อสร้าง HTML การ์ดแต่ละใบไปแปะในหน้าเว็บ
    classList.forEach(item => {
        // Logic เช็กที่นั่งเต็มเพื่อแสดงความแตกต่างบนป้าย (Badge)
        const isFull = item.seatsAvailable <= 0;
        const badgeColor = isFull ? 'bg-danger' : 'bg-warning text-dark';
        const badgeText = isFull ? 'เต็มแล้ว' : `${item.seatsTaken}/${item.capacity}`;

        // Logic ปรับแต่งปุ่มกด: หากคลาสเรียนเต็ม ให้เปลี่ยนปุ่มเป็น disabled สีเทา หากยังว่างให้เปิดลิงก์ปกติ
        const buttonHtml = isFull
            ? `<button class="btn btn-secondary" disabled>ที่นั่งเต็ม</button>`
            : `<a href="class-detail.html?id=${item.id}" class="btn btn-primary-custom">ดูรายละเอียด</a>`;

        // ประกอบโครงสร้างการ์ด HTML ด้วย template literal
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
}

// ★ ฟังก์ชันหน่วงเวลาทำงาน (Debounce Helper) เพื่อลดภาระการทำงานเบราว์เซอร์
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        // ล้างเวลาถอยหลังเดิมทิ้งไปก่อนเพื่อเตรียมเริ่มนับใหม่เมื่อมี Event พิมพ์เข้ามาถี่ๆ
        clearTimeout(timeoutId);
        // ตั้งเวลานับถอยหลังใหม่ เมื่อครบเวลาหน่วง (delay) ให้เริ่มประมวลผลทันที
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ★ ฟังก์ชันติดตั้ง Event Listeners สำหรับการค้นหาและคัดกรองข้อมูลคลาสเรียน (Event Delegation)
function setupFilteringListeners() {
    const searchInput = document.querySelector('.hero-section input[type="text"]');
    const sortSelect = document.querySelector('.mb-4 select');

    if (searchInput) {
        // ใช้ Debounce 300ms ดัก Event การพิมพ์ค้นหาเพื่อความลื่นไหลประหยัดทรัพยากรการเรนเดอร์จอ
        searchInput.addEventListener('input', debounce(() => {
            applyFiltersAndSort();
        }, 300));
    }

    if (sortSelect) {
        // ดัก Event dropdown จัดเรียงราคาเมื่อผู้ใช้เลือกเปลี่ยนค่า
        sortSelect.addEventListener('change', () => {
            applyFiltersAndSort();
        });
    }
}

// ★ ฟังก์ชันคำนวณการฟิลเตอร์และจัดเรียงข้อมูลแบบเรียลไทม์ฝั่งหน้าบ้าน
function applyFiltersAndSort() {
    const searchInput = document.querySelector('.hero-section input[type="text"]');
    const sortSelect = document.querySelector('.mb-4 select');

    // คัดลอกอาเรย์จากแคชดั้งเดิมมาใช้งานเพื่อไม่ให้ข้อมูลดิบเสียหาย
    let filtered = [...classesCache];

    // 1. คัดกรองข้อมูลด้วยคำค้นหา (ค้นหาได้ทั้ง ชื่อวิชา, ชื่อวิทยากร, หรือหมวดหมู่)
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.instructor.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        );
    }

    // 2. จัดเรียงข้อมูลตามเงื่อนไข (Sorting)
    if (sortSelect) {
        const sortValue = sortSelect.value;
        if (sortValue === 'ราคา ต่ำ-สูง') {
            // สั่งเรียงลำดับราคาจากน้อยไปมาก
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortValue === 'ความนิยมสูงสุด') {
            // เรียงตามจำนวนที่นั่งที่มีคนกดจองเยอะที่สุด
            filtered.sort((a, b) => b.seatsTaken - a.seatsTaken);
        } else {
            // ค่าเริ่มต้น (เรียงตามลำดับคลาสใหม่ล่าสุด - เรียง ID ถอยหลัง)
            filtered.sort((a, b) => b.id.localeCompare(a.id));
        }
    }

    // เรนเดอร์ข้อมูลที่กรองและเรียงลำดับใหม่ขึ้นระบายบนหน้าแรก
    renderClasses(filtered);
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
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
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
                // หากไม่พบคลาสเรียนนี้ ให้เตือนด่วนและดีดกลับไปหน้าแรกทันที
                showToast('ไม่พบข้อมูลคลาสเรียนนี้ในระบบ', 'warning');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`API ตอบกลับสถานะ ${response.status}`);
        }

        // แปลงข้อมูลผลตอบกลับเป็น JSON
        const result = await response.json();
        if (!result.success) {
            if (response.status === 404) {
                showToast('ไม่พบข้อมูลคลาสเรียนนี้ในระบบ', 'warning');
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
            // จัดการแปลงข้อมูลวันเดือนปีดิบ ให้กลายเป็นรูปแบบภาษาไทยที่อ่านง่าย
            const classDate = new Date(item.date);
            const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const formattedDate = `${classDate.getDate()} ${thaiMonths[classDate.getMonth()]} ${classDate.getFullYear() + 543}`;
            dateEl.innerHTML = `<i class="bi bi-calendar-event me-2"></i> ${formattedDate}`;
        }

        const timeEl = document.getElementById('detail-time');
        if (timeEl) {
            timeEl.innerHTML = `<i class="bi bi-clock me-2"></i> ${item.timeStart} - ${item.timeEnd} น.`;
        }

        // [เพิ่มเติมใหม่] อัปเดตตัวเตือนที่นั่งเหลือตามจริงอย่างยืดหยุ่น (ป้ายสีแดงเตือนเมื่อที่นั่งเหลือน้อย)
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
        // หากชื่อย่อไม่มีใน Dictionary จะใช้ชื่อย่อจาก API และภาพดีฟอลต์มาเป็น Instructor Info สำรอง
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
        // หากผู้ใช้ยังไม่ได้ล็อกอิน ให้ขึ้นเตือนและบังคับดีดไปหน้า login
        showToast('กรุณาเข้าสู่ระบบก่อนทำการจองคลาสเรียนครับ', 'warning');
        window.location.href = 'login.html';
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showToast('กรุณาเข้าสู่ระบบก่อนทำการจองคลาสเรียนครับ', 'warning');
        window.location.href = 'login.html';
        return;
    }

    try {
        // ส่ง Request ยิง API เส้นจองคลาสเรียน ด้วยโมเดลแบบ POST
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ classId })
        });

        // แปลงผลลัพธ์เป็น JSON Object
        const result = await response.json();

        if (response.status === 201 && result.success) {
            // ★ [Phase 2 — ข้อ 3] เพิ่มใบจองใหม่เข้า State กลาง + บันทึกลง localStorage (State Continuity)
            addBookingToState(result.data);
            // เปลี่ยนเส้นทางผู้ใช้ไปยังหน้า payment พร้อมแนบรหัสใบจองไปด้วย
            window.location.href = `payment.html?bookingId=${result.data.id}`;
        }
        else if (response.status === 409) {
            // ป้องกันกรณีปุ่มยังไม่เป็นสีเทาแต่ที่นั่งจองเต็มกะทันหันขณะส่งคำร้องขอ (409 Conflict)
            showToast(result.message || 'ขออภัยด้วยครับ! คลาสเรียนนี้เต็มแล้ว', 'danger');
            window.location.reload();
        }
        else {
            showToast(`ไม่สามารถทำรายการได้: ${result.message || 'ระบบขัดข้อง'}`, 'danger');
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่ง request การจอง:', error);
        showToast('ไม่สามารถเชื่อมต่อระบบหลังบ้านได้ในขณะนี้', 'danger');
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
        // ยิง GET API ไปขอดึงข้อมูลใบจองทั้งหมดของผู้ใช้
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

        // ★ [เพิ่มเติมใหม่สำหรับข้อ 12] คำนวณสถิติจากประวัติการจองจริงของผู้ใช้ (Array processing)
        const activeBookings = bookings.filter(b => b.status !== 'canceled');
        const paidBookings = bookings.filter(b => b.status === 'paid');
        const pendingBookings = bookings.filter(b => b.status === 'pending');

        // ส่งตัวเลขนับสถิติสดแบบเรียลไทม์ไปอัปเดตบนป้ายสถิติของ Sidebar
        const statTotalEl = document.getElementById('stat-total');
        if (statTotalEl) statTotalEl.innerText = activeBookings.length;

        const statPaidEl = document.getElementById('stat-paid');
        if (statPaidEl) statPaidEl.innerText = paidBookings.length;

        const statPendingEl = document.getElementById('stat-pending');
        if (statPendingEl) statPendingEl.innerText = pendingBookings.length;

        // เคลียร์พื้นที่ล้างกล่องข้อมูลทดสอบเก่าออกให้หมดก่อนแสดงข้อมูลจริง
        container.innerHTML = '';

        if (bookings.length === 0) {
            // แสดงผลกล่องว่างเปล่าในกรณีที่ไม่มีข้อมูลการจอง
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
    // ยืนยันการยกเลิกจองคลาสเรียนจากผู้ใช้
    const isConfirm = confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองคลาสเรียนนี้?');
    if (!isConfirm) return;

    try {
        // ยิงโมเดลอัปเดตแบบ PUT เพื่อเปลี่ยนค่าสเตตัสในฐานข้อมูลหลังบ้านเป็น canceled
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'canceled' })
        });

        // แปลงคำตอบรับเป็น JSON
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || `API ตอบกลับสถานะ ${response.status}`);
        }

        // ★ [Phase 2 — ข้อ 3] อัปเดตสถานะใบจองใน State กลางของหน้าบ้านเป็น 'canceled'
        updateBookingInState(bookingId, { status: 'canceled' });

        showToast('ยกเลิกการจองคลาสเรียนสำเร็จแล้วครับ', 'success');
        
        // โหลดประวัติการจองใหม่เพื่ออัปเดตสถิติและสถานะบนหน้าจอแบบเรียลไทม์ (Reactive UI)
        loadUserBookingHistory();

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการยกเลิกการจอง:', error);
        showToast('ไม่สามารถยกเลิกการจองได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง', 'danger');
    }
}
