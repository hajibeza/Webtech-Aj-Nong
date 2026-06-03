/**
 * Admin pages: admin-dashboard.html, admin-classes.html, admin-bookings.html
 */
let adminChartInstance = null;
let editingClassId = null;

function requireAdminPage() {
	if (typeof getAuthToken !== 'function' || typeof getCurrentUser !== 'function') {
		window.location.href = 'login.html';
		return false;
	}
	if (!getAuthToken() || getCurrentUser()?.role !== 'admin') {
		window.location.href = 'login.html';
		return false;
	}
	return true;
}

function adminAuthHeaders() {
	return getAuthHeaders();
}

async function adminFetch(url, options = {}) {
	const response = await fetch(`${API_BASE_URL}${url}`, {
		...options,
		headers: { ...adminAuthHeaders(), ...(options.headers || {}) },
	});
	const result = await response.json().catch(() => ({}));
	if (!response.ok || result.success === false) {
		throw new Error(result.message || `Request failed (${response.status})`);
	}
	return result.data;
}

function formatBookingStatus(status) {
	if (status === 'paid') {
		return { label: 'สำเร็จแล้ว', className: 'bg-success' };
	}
	if (status === 'pending') {
		return { label: 'รอชำระเงิน', className: 'bg-warning text-dark' };
	}
	if (status === 'canceled') {
		return { label: 'ยกเลิกแล้ว', className: 'bg-danger' };
	}
	return { label: status, className: 'bg-secondary' };
}

async function loadAdminDashboard() {
	const classCountEl = document.getElementById('admin-kpi-classes');
	const revenueEl = document.getElementById('admin-kpi-revenue');
	const seatsEl = document.getElementById('admin-kpi-seats');
	const progressEl = document.getElementById('admin-kpi-progress');
	const chartCtx = document.getElementById('bookingChart');

	if (!classCountEl) return;

	try {
		const { metrics, chart } = await adminFetch('/api/admin/metrics');

		classCountEl.textContent = metrics.classCount;
		revenueEl.textContent = `฿${Number(metrics.revenue).toLocaleString()}`;
		seatsEl.innerHTML = `${metrics.bookedSeats} <span class="fs-5 text-muted fw-normal">/ ${metrics.totalSeats} ที่นั่ง</span>`;

		const pct = metrics.totalSeats
			? Math.round((metrics.bookedSeats / metrics.totalSeats) * 100)
			: 0;
		if (progressEl) {
			progressEl.style.width = `${pct}%`;
		}

		if (chartCtx && chart) {
			if (adminChartInstance) adminChartInstance.destroy();
			adminChartInstance = new Chart(chartCtx, {
				type: 'line',
				data: {
					labels: chart.labels,
					datasets: [{
						label: 'จำนวนคนจอง (คน)',
						data: chart.data,
						borderColor: '#4F46E5',
						backgroundColor: 'rgba(79, 70, 229, 0.1)',
						borderWidth: 3,
						tension: 0.4,
						fill: true,
					}],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { position: 'top' },
						title: {
							display: true,
							text: 'สถิติการจองคลาสเรียน (วันนี้)',
						},
					},
					scales: { y: { beginAtZero: true } },
				},
			});
		}
	} catch (error) {
		console.error('Admin dashboard load failed:', error);
		if (typeof showToast === 'function') {
			showToast('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'danger');
		}
	}
}

async function loadAdminClasses() {
	const tbody = document.getElementById('admin-classes-tbody');
	if (!tbody) return;

	tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">กำลังโหลด...</td></tr>`;

	try {
		const classes = await adminFetch('/api/admin/classes');
		tbody.innerHTML = '';

		if (!classes.length) {
			tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">ไม่มีคลาสในระบบ</td></tr>`;
			return;
		}

		classes.forEach((cls) => {
			const isOpen = cls.status === 'open';
			const row = document.createElement('tr');
			row.dataset.classId = cls.id;
			row.innerHTML = `
                <td class="px-4 py-3">
                    <div class="d-flex align-items-center">
                        <img src="${cls.imageUrl || 'https://via.placeholder.com/40'}" class="rounded me-3" width="40" height="40" style="object-fit: cover;" alt="">
                        <div class="fw-bold">${escapeHtml(cls.title)}</div>
                    </div>
                </td>
                <td>${escapeHtml(cls.instructor)}</td>
                <td><span class="small text-muted">${escapeHtml(cls.date)} (${escapeHtml(cls.timeStart)})</span></td>
                <td>
                    <div class="seat-adjuster" data-class-id="${cls.id}">
                        <button type="button" class="btn btn-outline-danger btn-minus btn-sm"><i class="bi bi-dash"></i></button>
                        <span class="seat-count fw-bold px-2">${cls.capacity}</span>
                        <button type="button" class="btn btn-outline-success btn-plus btn-sm"><i class="bi bi-plus"></i></button>
                    </div>
                    <small class="text-muted d-block mt-1">จองแล้ว ${cls.seatsTaken}/${cls.capacity}</small>
                </td>
                <td>฿${cls.price.toLocaleString()}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input class-status-toggle" type="checkbox" role="switch"
                            data-class-id="${cls.id}" ${isOpen ? 'checked' : ''}>
                        <label class="form-check-label small ${isOpen ? '' : 'text-danger'}">${isOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}</label>
                    </div>
                </td>
                <td class="px-4 text-end">
                    <button type="button" class="btn btn-sm btn-light text-primary me-1 btn-edit-class" data-class-id="${cls.id}"><i class="bi bi-pencil-square"></i></button>
                    <button type="button" class="btn btn-sm btn-light text-danger btn-delete-class" data-class-id="${cls.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
			tbody.appendChild(row);
		});

		bindAdminClassActions();
	} catch (error) {
		console.error('Admin classes load failed:', error);
		tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
	}
}

function escapeHtml(str) {
	if (str == null) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

async function updateClassCapacity(classId, capacity) {
	await adminFetch(`/api/admin/classes/${classId}`, {
		method: 'PUT',
		body: JSON.stringify({ capacity }),
	});
}

async function updateClassStatus(classId, status) {
	await adminFetch(`/api/admin/classes/${classId}`, {
		method: 'PUT',
		body: JSON.stringify({ status }),
	});
}

function getClassFormPayload() {
	const datetime = document.getElementById('classFormDatetime')?.value || '';
	let date = document.getElementById('classFormDate')?.value || '';
	let timeStart = document.getElementById('classFormTimeStart')?.value || '09:00';
	if (datetime) {
		const [d, t] = datetime.split('T');
		date = d || date;
		timeStart = (t || timeStart).slice(0, 5);
	}
	return {
		title: document.getElementById('classFormTitle')?.value.trim(),
		category: document.getElementById('classFormCategory')?.value.trim(),
		instructor: document.getElementById('classFormInstructor')?.value.trim(),
		date,
		timeStart,
		timeEnd: document.getElementById('classFormTimeEnd')?.value || '17:00',
		capacity: Number(document.getElementById('classFormCapacity')?.value) || 30,
		price: Number(document.getElementById('classFormPrice')?.value) || 0,
		description: document.getElementById('classFormDescription')?.value.trim() || '',
		status: document.getElementById('classFormStatus')?.value || 'open',
		imageUrl: document.getElementById('classFormImageUrl')?.value.trim() || null,
	};
}

function resetClassForm() {
	editingClassId = null;
	document.getElementById('classFormTitle').value = '';
	document.getElementById('classFormCategory').value = 'Programming';
	document.getElementById('classFormInstructor').value = '';
	document.getElementById('classFormDatetime').value = '';
	document.getElementById('classFormCapacity').value = '30';
	document.getElementById('classFormPrice').value = '';
	document.getElementById('classFormDescription').value = '';
	document.getElementById('classFormStatus').value = 'open';
	document.getElementById('classFormImageUrl').value = '';
	document.querySelector('#classModal .modal-title').textContent = 'เพิ่ม / แก้ไข คลาสเรียน';
}

async function openEditClassModal(classId) {
	try {
		const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
		const result = await response.json();
		if (!response.ok || !result.success) throw new Error(result.message || 'ไม่พบคลาส');
		const cls = result.data;
		editingClassId = classId;
		document.getElementById('classFormTitle').value = cls.title;
		document.getElementById('classFormCategory').value = cls.category;
		document.getElementById('classFormInstructor').value = cls.instructor;
		document.getElementById('classFormDatetime').value =
			cls.date && cls.timeStart ? `${cls.date}T${cls.timeStart}` : '';
		document.getElementById('classFormCapacity').value = cls.capacity;
		document.getElementById('classFormPrice').value = cls.price;
		document.getElementById('classFormDescription').value = cls.description || '';
		document.getElementById('classFormStatus').value = cls.status;
		document.getElementById('classFormImageUrl').value = cls.imageUrl || '';
		document.querySelector('#classModal .modal-title').textContent = 'แก้ไขคลาสเรียน';
		bootstrap.Modal.getOrCreateInstance(document.getElementById('classModal')).show();
	} catch (e) {
		showToast(e.message, 'danger');
	}
}

async function saveClassForm() {
	const payload = getClassFormPayload();
	if (!payload.title || !payload.category || !payload.instructor || !payload.date) {
		showToast('กรุณากรอกข้อมูลที่จำเป็น', 'warning');
		return;
	}
	try {
		if (editingClassId) {
			await adminFetch(`/api/admin/classes/${editingClassId}`, {
				method: 'PUT',
				body: JSON.stringify(payload),
			});
			showToast('บันทึกคลาสแล้ว', 'success');
		} else {
			await adminFetch('/api/admin/classes', {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			showToast('เพิ่มคลาสแล้ว', 'success');
		}
		bootstrap.Modal.getInstance(document.getElementById('classModal'))?.hide();
		resetClassForm();
		loadAdminClasses();
	} catch (e) {
		showToast(e.message, 'danger');
	}
}

function bindAdminClassActions() {
	document.querySelectorAll('.seat-adjuster').forEach((adjuster) => {
		const classId = adjuster.dataset.classId;
		const minusBtn = adjuster.querySelector('.btn-minus');
		const plusBtn = adjuster.querySelector('.btn-plus');
		const seatDisplay = adjuster.querySelector('.seat-count');

		minusBtn?.addEventListener('click', async () => {
			let current = parseInt(seatDisplay.innerText, 10);
			const row = adjuster.closest('tr');
			const small = row?.querySelector('small')?.textContent || '';
			const match = small.match(/จองแล้ว (\d+)/);
			const seatsTaken = match ? parseInt(match[1], 10) : 0;
			if (current <= seatsTaken) {
				showToast('ความจุไม่สามารถต่ำกว่าที่นั่งที่จองแล้ว', 'warning');
				return;
			}
			current--;
			try {
				await updateClassCapacity(classId, current);
				seatDisplay.innerText = current;
				showToast(`อัปเดตความจุเป็น ${current} ที่นั่งแล้ว`, 'success');
			} catch (e) {
				showToast(e.message, 'danger');
			}
		});

		plusBtn?.addEventListener('click', async () => {
			let current = parseInt(seatDisplay.innerText, 10);
			current++;
			try {
				await updateClassCapacity(classId, current);
				seatDisplay.innerText = current;
				showToast(`อัปเดตความจุเป็น ${current} ที่นั่งแล้ว`, 'success');
			} catch (e) {
				showToast(e.message, 'danger');
			}
		});
	});

	document.querySelectorAll('.class-status-toggle').forEach((toggle) => {
		toggle.addEventListener('change', async () => {
			const classId = toggle.dataset.classId;
			const status = toggle.checked ? 'open' : 'closed';
			try {
				await updateClassStatus(classId, status);
				showToast('อัปเดตสถานะคลาสแล้ว', 'success');
			} catch (e) {
				toggle.checked = !toggle.checked;
				showToast(e.message, 'danger');
			}
		});
	});

	document.querySelectorAll('.btn-edit-class').forEach((btn) => {
		btn.addEventListener('click', () => openEditClassModal(btn.dataset.classId));
	});

	document.querySelectorAll('.btn-delete-class').forEach((btn) => {
		btn.addEventListener('click', async () => {
			const classId = btn.dataset.classId;
			if (!confirm('ลบคลาสนี้จากระบบ?')) return;
			try {
				await adminFetch(`/api/admin/classes/${classId}`, { method: 'DELETE' });
				showToast('ลบคลาสแล้ว', 'success');
				loadAdminClasses();
			} catch (e) {
				showToast(e.message, 'danger');
			}
		});
	});
}

async function loadAdminBookings() {
	const tbody = document.getElementById('admin-bookings-tbody');
	if (!tbody) return;

	tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">กำลังโหลด...</td></tr>`;

	try {
		const data = await adminFetch('/api/admin/bookings');
		const items = Array.isArray(data) ? data : data.items || [];
		tbody.innerHTML = '';

		if (items.length === 0) {
			tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">ไม่มีรายการจอง</td></tr>`;
			return;
		}

		items.forEach((booking) => {
			const badge = formatBookingStatus(booking.status);
			const canForce = booking.status === 'pending';
			const row = document.createElement('tr');
			row.dataset.bookingId = booking.id;
			row.innerHTML = `
                <td class="px-4 text-muted">#${escapeHtml(booking.id)}</td>
                <td>${escapeHtml(booking.user?.name || booking.user?.username || '-')}</td>
                <td>${escapeHtml(booking.classInfo?.title || '-')}</td>
                <td><span class="small text-muted">${escapeHtml(booking.createdAt || '-')}</span></td>
                <td>${Number(booking.amount).toLocaleString()}</td>
                <td><span class="badge ${badge.className}">${badge.label}</span></td>
                <td class="px-4 text-end">
                    ${canForce
						? `<button type="button" class="btn btn-sm btn-danger btn-force-release" data-booking-id="${booking.id}">ยึดที่นั่งคืน</button>`
						: '<span class="text-muted small">-</span>'}
                </td>
            `;
			tbody.appendChild(row);
		});

		document.querySelectorAll('.btn-force-release').forEach((btn) => {
			btn.addEventListener('click', async () => {
				const bookingId = btn.dataset.bookingId;
				if (!confirm('ยึดที่นั่งคืน (Force Release) ทันทีใช่หรือไม่?')) return;
				try {
					await adminFetch(`/api/admin/bookings/${bookingId}/status`, {
						method: 'PUT',
						body: JSON.stringify({ status: 'canceled' }),
					});
					showToast('ยึดที่นั่งคืนเข้าสู่ระบบสำเร็จ', 'success');
					loadAdminBookings();
					if (typeof loadAdminDashboard === 'function' && document.getElementById('admin-kpi-classes')) {
						loadAdminDashboard();
					}
				} catch (e) {
					showToast(e.message, 'danger');
				}
			});
		});
	} catch (error) {
		console.error('Admin bookings load failed:', error);
		tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	if (!requireAdminPage()) return;

	if (typeof refreshUserDisplayFromApi === 'function') {
		refreshUserDisplayFromApi();
	}

	const refreshBtn = document.getElementById('admin-refresh-btn');
	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => {
			loadAdminDashboard();
			showToast('รีเฟรชข้อมูลแล้ว', 'success');
		});
	}

	const classModal = document.getElementById('classModal');
	if (classModal) {
		classModal.addEventListener('show.bs.modal', (e) => {
			if (!e.relatedTarget && !editingClassId) resetClassForm();
		});
		document.getElementById('admin-class-save-btn')?.addEventListener('click', (e) => {
			e.preventDefault();
			saveClassForm();
		});
		const addBtn = document.querySelector('[data-bs-target="#classModal"]');
		addBtn?.addEventListener('click', () => {
			editingClassId = null;
			resetClassForm();
		});
	}

	loadAdminDashboard();
	loadAdminClasses();
	loadAdminBookings();
});
