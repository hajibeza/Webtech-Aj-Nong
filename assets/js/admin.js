document.addEventListener('DOMContentLoaded', () => {
    // 1. วาดโครงกราฟวิเคราะห์ปริมาณการจอง (Chart.js) เมื่ออยู่หน้า Dashboard ของ Admin
    const chartCtx = document.getElementById('bookingChart'); // ค้นหา Element สำหรับวาดแผนภูมิ
    if (chartCtx) {
        // สร้างแผนภูมิแบบเส้นแสดงสถิติการจอง
        new Chart(chartCtx, {
            type: 'line', // กำหนดประเภทแผนภูมิเป็นเส้น
            data: {
                labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], // แกน X แสดงช่วงเวลา
                datasets: [{
                    label: 'จำนวนคนจอง (คน)',
                    data: [12, 19, 3, 5, 2, 30, 45], // ข้อมูลตัวเลขจำลองยอดคนจองในแต่ละชั่วโมง
                    borderColor: '#4F46E5', // กำหนดสีของเส้นแผนภูมิ
                    backgroundColor: 'rgba(79, 70, 229, 0.1)', // สีระบายใต้แผนภูมิเส้นแบบโปร่งแสง
                    borderWidth: 3, // ความหนาของเส้น
                    tension: 0.4, // ความโค้งมนของเส้นแผนภูมิ
                    fill: true // สั่งให้เทสีเติมเต็มด้านล่างเส้นกราฟ
                }]
            },
            options: {
                responsive: true, // ทำให้แผนภูมิยืดหยุ่นปรับขนาดตามหน้าจออัตโนมัติ
                plugins: {
                    legend: {
                        position: 'top', // วางตำแหน่งคำอธิบายสัญลักษณ์ไว้ด้านบน
                    },
                    title: {
                        display: true,
                        text: 'ช่วงเวลาที่มีคนกดจองคลาสมากที่สุด' // แสดงหัวข้อหลักบนหัวแผนภูมิ
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true // บังคับให้แกน Y เริ่มต้นจากตัวเลข 0
                    }
                }
            }
        });
    }

    // 2. ระบบจำลองปรับเปลี่ยนจำนวนที่นั่งเรียนแบบเรียลไทม์ (Real-time Seat Adjuster Mock)
    const seatAdjusters = document.querySelectorAll('.seat-adjuster'); // ดึงตัวคุมปรับนั่งทั้งหมด
    seatAdjusters.forEach(adjuster => {
        const minusBtn = adjuster.querySelector('.btn-minus'); // ปุ่มเครื่องหมายลบ
        const plusBtn = adjuster.querySelector('.btn-plus'); // ปุ่มเครื่องหมายบวก
        const seatDisplay = adjuster.querySelector('.seat-count'); // ช่องแสดงตัวเลขจำนวนที่นั่ง

        if (minusBtn && plusBtn && seatDisplay) {
            // ดักฟังการคลิกปุ่มลดที่นั่ง
            minusBtn.addEventListener('click', () => {
                let currentSeats = parseInt(seatDisplay.innerText); // แกะอ่านค่าที่นั่งปัจจุบันมาแปลงเป็นตัวเลข
                if (currentSeats > 0) {
                    currentSeats--; // ลดตัวเลขจำนวนที่นั่งลง 1 ที่
                    seatDisplay.innerText = currentSeats; // พิมพ์ตัวเลขใหม่แทนที่ลงบนหน้าจอ
                    if (typeof showToast === 'function') {
                        // แจ้งเตือนความสำเร็จผ่านระบบ Toast
                        showToast(`ลดที่นั่งสำเร็จ อัปเดตไปยังหน้าจอผู้ใช้ทุกคนแล้ว (เหลือ ${currentSeats} ที่นั่ง)`, 'success');
                    }
                }
            });

            // ดักฟังการคลิกปุ่มเพิ่มที่นั่ง
            plusBtn.addEventListener('click', () => {
                let currentSeats = parseInt(seatDisplay.innerText); // แกะอ่านค่าที่นั่งปัจจุบัน
                currentSeats++; // เพิ่มตัวเลขจำนวนที่นั่งขึ้น 1 ที่
                seatDisplay.innerText = currentSeats; // พิมพ์ตัวเลขใหม่แทนที่
                if (typeof showToast === 'function') {
                    showToast(`เพิ่มที่นั่งสำเร็จ อัปเดตไปยังหน้าจอผู้ใช้ทุกคนแล้ว (เพิ่มเป็น ${currentSeats} ที่นั่ง)`, 'success');
                }
            });
        }
    });

    // 3. ระบบยึดคืนที่นั่งห้องเรียนของแอดมิน (Force Release Mock)
    const releaseBtns = document.querySelectorAll('.btn-force-release'); // ค้นหาปุ่มยึดคืนทั้งหมด
    releaseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr'); // ดึงตำแหน่งแถวตาราง (Table Row) ของใบจองนั้น
            if (confirm('คุณต้องการยึดที่นั่งคืน (Force Release) ทันทีใช่หรือไม่?')) {
                // เปลี่ยนป้ายสเตตัสจำลองบนหน้าจอ
                const statusBadge = row.querySelector('.badge');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-danger'; // สลับสไตล์เป็นป้ายสีแดงเตือนภัย
                    statusBadge.innerText = 'ยกเลิกแล้ว (ยึดคืน)'; // สลับข้อความบอกสถานะ
                }
                this.remove(); // ลบปุ่มยึดคืนออกจากตารางเพื่อจำลองว่าทำรายการสำเร็จแล้ว
                
                if (typeof showToast === 'function') {
                    showToast('ยึดที่นั่งคืนเข้าสู่ระบบสำเร็จ', 'success');
                }
            }
        });
    });
});
