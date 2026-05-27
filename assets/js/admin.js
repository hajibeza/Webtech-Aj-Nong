document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Chart if on dashboard
    const chartCtx = document.getElementById('bookingChart');
    if (chartCtx) {
        new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                datasets: [{
                    label: 'จำนวนคนจอง (คน)',
                    data: [12, 19, 3, 5, 2, 30, 45],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'ช่วงเวลาที่มีคนกดจองคลาสมากที่สุด'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 2. Real-time Seat Adjuster mock logic
    const seatAdjusters = document.querySelectorAll('.seat-adjuster');
    seatAdjusters.forEach(adjuster => {
        const minusBtn = adjuster.querySelector('.btn-minus');
        const plusBtn = adjuster.querySelector('.btn-plus');
        const seatDisplay = adjuster.querySelector('.seat-count');

        if (minusBtn && plusBtn && seatDisplay) {
            minusBtn.addEventListener('click', () => {
                let currentSeats = parseInt(seatDisplay.innerText);
                if (currentSeats > 0) {
                    currentSeats--;
                    seatDisplay.innerText = currentSeats;
                    if (typeof showToast === 'function') {
                        showToast(`ลดที่นั่งสำเร็จ อัปเดตไปยังหน้าจอผู้ใช้ทุกคนแล้ว (เหลือ ${currentSeats} ที่นั่ง)`, 'success');
                    }
                }
            });

            plusBtn.addEventListener('click', () => {
                let currentSeats = parseInt(seatDisplay.innerText);
                currentSeats++;
                seatDisplay.innerText = currentSeats;
                if (typeof showToast === 'function') {
                    showToast(`เพิ่มที่นั่งสำเร็จ อัปเดตไปยังหน้าจอผู้ใช้ทุกคนแล้ว (เพิ่มเป็น ${currentSeats} ที่นั่ง)`, 'success');
                }
            });
        }
    });

    // 3. Force Release mock logic
    const releaseBtns = document.querySelectorAll('.btn-force-release');
    releaseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            if (confirm('คุณต้องการยึดที่นั่งคืน (Force Release) ทันทีใช่หรือไม่?')) {
                // Change status mock
                const statusBadge = row.querySelector('.badge');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-danger';
                    statusBadge.innerText = 'ยกเลิกแล้ว (ยึดคืน)';
                }
                this.remove(); // Remove the button after action
                
                if (typeof showToast === 'function') {
                    showToast('ยึดที่นั่งคืนเข้าสู่ระบบสำเร็จ', 'success');
                }
            }
        });
    });
});
