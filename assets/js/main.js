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

    try {
        // ส่งคำร้องขอร้องข้อมูลไปยัง API รายคลาสของฝั่งหลังบ้าน
        const response = await fetch(`http://localhost:3000/api/classes/${classId}`);

        // หากฝั่งหลังบ้านส่งข้อมูลกลับมาว่าไม่พบรหัสคลาสเรียน (404 Not Found)
        if (response.status === 404) {
            alert('ไม่พบข้อมูลคลาสเรียนนี้ในระบบ');
            window.location.href = 'index.html'; // ส่งกลับหน้าแรก
            return;
        }

        const item = await response.json();

        // นำข้อมูลจริงที่หลังบ้านส่งมา นำไปกระจายใส่ตาม id แท็กต่างๆ ที่เราตั้งไว้ใน HTML
        document.getElementById('detail-img').src = item.imageUrl;
        document.getElementById('detail-title').innerText = item.title;
        document.getElementById('detail-desc').innerText = item.description;
        document.getElementById('detail-price').innerText = `฿${item.price.toLocaleString()}`;
        document.getElementById('detail-seats-text').innerText = `${item.seatsTaken}/${item.capacity}`;

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

    // กำหนดรหัสผู้ใช้ชั่วคราวเป็น 'u-1' (สมชาย) เพื่อใช้ทดสอบระบบตามโครงสร้างข้อมูลของหลังบ้าน
    const mockUserId = 'u-1';

    try {
        // ยิงคำร้องขอแบบ POST ส่งข้อมูลสิทธิ์ไปสมัครเรียนกับหลังบ้าน
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classId: classId,
                userId: mockUserId
            })
        });

        // กรณีที่ 1: ดำเนินการสร้างรายการจองสำเร็จ (HTTP Status 201 Created)
        if (response.status === 201) {
            const result = await response.json();
            // ★ ส่ง bookingId ไปกับ URL เพื่อให้หน้า payment ดึงข้อมูลจองจาก API ได้
            window.location.href = `payment.html?bookingId=${result.id}`;
        }
        // กรณีที่ 2: ดักจับสเตตัส 409 Conflict เมื่อมีคนอื่นกดตัดหน้าจองที่นั่งสุดท้ายจนเต็มพอดี
        else if (response.status === 409) {
            alert('ขออภัยด้วยครับ! มีผู้ใช้อื่นทำรายการจองที่นั่งสุดท้ายตัดหน้าไปเมื่อสักครู่ คลาสเรียนนี้เต็มแล้ว');
            window.location.reload(); // รีเฟรชหน้าจอเพื่ออัปเดตสถานะปุ่มเป็นที่นั่งเต็ม
        }
        // กรณีเออร์เรอร์อื่นๆ จากระบบหลังบ้าน
        else {
            const errData = await response.json();
            alert(`ไม่สามารถทำรายการได้: ${errData.error || 'ระบบขัดข้อง'}`);
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

    // จำลองรหัสผู้ใช้ u-1 (สมชาย) เพื่อดึงข้อมูลตาม Mock Data ของหลังบ้าน
    const mockUserId = 'u-1'; 

    try {
        // ยิง API แบบ GET โดยส่ง Query Parameter เป็น userId เพื่อระบุเจาะจงประวัติของคนนี้
        const response = await fetch(`http://localhost:3000/api/bookings?userId=${mockUserId}`);
        const data = await response.json();

        // ★ แก้ไข: API ส่งข้อมูลกลับมาในรูปแบบ { items: [...] } ไม่ใช่ Array ตรงๆ
        const bookings = data.items || [];

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
                    <button class="btn btn-sm btn-outline-danger" onclick="alert('ยกเลิกรายการแล้ว')">ยกเลิกการจอง</button>
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