/**
 * Admin panel — auth guard + CRUD via /api/admin/*
 */
(function () {
	function getApiBaseUrl() {
		const { protocol, hostname, port } = window.location;
		if (protocol !== 'http:' && protocol !== 'https:') {
			return 'http://localhost:3000';
		}
		if (port === '3000' || (port === '' && hostname === 'localhost')) {
			return window.location.origin;
		}
		return `http://${hostname}:3000`;
	}

	const API_BASE = getApiBaseUrl();

	function getToken() {
		return localStorage.getItem('token');
	}

	function parseJwtPayload(token) {
		if (!token) return null;
		try {
			const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(atob(base64));
		} catch {
			return null;
		}
	}

	function authHeaders(json = true) {
		const headers = { Authorization: `Bearer ${getToken()}` };
		if (json) headers['Content-Type'] = 'application/json';
		return headers;
	}

	function showAlert(message, type = 'danger') {
		const el = document.getElementById('adminAlert');
		if (!el) return;
		el.className = `alert alert-${type}`;
		el.textContent = message;
		el.classList.remove('d-none');
		setTimeout(() => el.classList.add('d-none'), 4000);
	}

	function requireAdmin() {
		const token = getToken();
		if (!token) {
			window.location.href = '/login.html';
			return false;
		}
		const user = parseJwtPayload(token);
		if (!user || user.role !== 'admin') {
			window.location.href = '/login.html';
			return false;
		}
		return true;
	}

	async function adminFetch(path, options = {}) {
		const response = await fetch(`${API_BASE}${path}`, {
			...options,
			headers: { ...authHeaders(options.body !== undefined && !(options.body instanceof FormData)), ...(options.headers || {}) },
		});
		const result = await response.json().catch(() => ({}));
		if (!response.ok || result.success === false) {
			const msg = result.message || `Request failed (${response.status})`;
			if (response.status === 404) {
				throw new Error(
					`${msg} — ตรวจสอบว่ารัน npm start แล้วเปิด ${API_BASE}/admin.html`
				);
			}
			throw new Error(msg);
		}
		return result.data;
	}

	// --- Navigation ---
	document.querySelectorAll('#adminNav .nav-link[data-panel]').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const panel = link.getAttribute('data-panel');
			document.querySelectorAll('#adminNav .nav-link').forEach((l) => l.classList.remove('active'));
			link.classList.add('active');
			document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
			document.getElementById(`panel-${panel}`).classList.add('active');
			if (panel === 'dashboard') loadStats();
			if (panel === 'users') loadUsers();
			if (panel === 'classes') loadClasses();
			if (panel === 'bookings') loadBookings();
		});
	});

	document.getElementById('adminLogoutBtn').addEventListener('click', () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login.html';
	});

	// --- Dashboard ---
	async function loadStats() {
		try {
			const stats = await adminFetch('/api/admin/stats');
			document.getElementById('stat-users').textContent = stats.totalUsers ?? 0;
			document.getElementById('stat-classes').textContent = stats.totalClasses ?? 0;
			document.getElementById('stat-bookings').textContent = stats.totalBookings ?? 0;
			document.getElementById('stat-revenue').textContent = Number(stats.revenue || 0).toLocaleString();
		} catch (err) {
			showAlert(err.message);
		}
	}

	// --- Users ---
	async function loadUsers() {
		const tbody = document.getElementById('users-table-body');
		tbody.innerHTML = '<tr><td colspan="5" class="text-center">กำลังโหลด...</td></tr>';
		try {
			const users = await adminFetch('/api/admin/users');
			if (!users.length) {
				tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">ไม่มีผู้ใช้</td></tr>';
				return;
			}
			tbody.innerHTML = users
				.map(
					(u) => `
				<tr>
					<td>${u.id}</td>
					<td>${escapeHtml(u.username || u.email)}</td>
					<td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${u.role}</span></td>
					<td>${formatDate(u.created_at)}</td>
					<td class="text-end">
						${u.role === 'admin' ? '' : `<button class="btn btn-sm btn-outline-danger" data-delete-user="${u.id}">ลบ</button>`}
					</td>
				</tr>`
				)
				.join('');
			tbody.querySelectorAll('[data-delete-user]').forEach((btn) => {
				btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-delete-user')));
			});
		} catch (err) {
			tbody.innerHTML = `<tr><td colspan="5" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
		}
	}

	async function deleteUser(id) {
		if (!confirm('ลบผู้ใช้นี้?')) return;
		try {
			await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
			showAlert('ลบผู้ใช้สำเร็จ', 'success');
			loadUsers();
			loadStats();
		} catch (err) {
			showAlert(err.message);
		}
	}

	// --- Classes ---
	let classModal;
	let classModalBs;

	function openClassModal(editClass) {
		document.getElementById('classModalTitle').textContent = editClass ? 'แก้ไขคลาส' : 'เพิ่มคลาสใหม่';
		document.getElementById('classFormId').value = editClass ? editClass.id : '';
		document.getElementById('classTitle').value = editClass?.title || '';
		document.getElementById('classCategory').value = editClass?.category || '';
		document.getElementById('classInstructor').value = editClass?.instructor || '';
		document.getElementById('classDate').value = editClass?.date || '';
		document.getElementById('classTimeStart').value = editClass?.timeStart || '09:00';
		document.getElementById('classTimeEnd').value = editClass?.timeEnd || '17:00';
		document.getElementById('classPrice').value = editClass?.price ?? '';
		document.getElementById('classCapacity').value = editClass?.capacity ?? 30;
		document.getElementById('classStatus').value = editClass?.status || 'open';
		document.getElementById('classImageUrl').value = editClass?.imageUrl || '';
		document.getElementById('classDescription').value = editClass?.description || '';
		classModalBs.show();
	}

	async function loadClasses() {
		const tbody = document.getElementById('classes-table-body');
		tbody.innerHTML = '<tr><td colspan="6" class="text-center">กำลังโหลด...</td></tr>';
		try {
			const classes = await adminFetch('/api/admin/classes');
			if (!classes.length) {
				tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">ไม่มีคลาส</td></tr>';
				return;
			}
			tbody.innerHTML = classes
				.map(
					(c) => `
				<tr>
					<td><code>${escapeHtml(c.id)}</code></td>
					<td>${escapeHtml(c.title)}</td>
					<td>฿${Number(c.price).toLocaleString()}</td>
					<td>${escapeHtml(c.date)}</td>
					<td><span class="badge bg-${c.status === 'open' ? 'success' : 'secondary'}">${c.status}</span></td>
					<td class="text-end text-nowrap">
						<button class="btn btn-sm btn-outline-primary me-1" data-edit-class="${escapeAttr(JSON.stringify(c))}">แก้ไข</button>
						<button class="btn btn-sm btn-outline-danger" data-delete-class="${c.id}">ลบ</button>
					</td>
				</tr>`
				)
				.join('');
			tbody.querySelectorAll('[data-edit-class]').forEach((btn) => {
				btn.addEventListener('click', () => openClassModal(JSON.parse(btn.getAttribute('data-edit-class'))));
			});
			tbody.querySelectorAll('[data-delete-class]').forEach((btn) => {
				btn.addEventListener('click', () => deleteClass(btn.getAttribute('data-delete-class')));
			});
		} catch (err) {
			tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
		}
	}

	async function saveClass() {
		const id = document.getElementById('classFormId').value;
		const body = {
			title: document.getElementById('classTitle').value.trim(),
			category: document.getElementById('classCategory').value.trim(),
			instructor: document.getElementById('classInstructor').value.trim(),
			date: document.getElementById('classDate').value,
			timeStart: document.getElementById('classTimeStart').value,
			timeEnd: document.getElementById('classTimeEnd').value,
			price: Number(document.getElementById('classPrice').value),
			capacity: Number(document.getElementById('classCapacity').value),
			status: document.getElementById('classStatus').value,
			imageUrl: document.getElementById('classImageUrl').value.trim() || null,
			description: document.getElementById('classDescription').value.trim(),
		};
		try {
			if (id) {
				await adminFetch(`/api/admin/classes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
			} else {
				await adminFetch('/api/admin/classes', { method: 'POST', body: JSON.stringify(body) });
			}
			classModalBs.hide();
			showAlert('บันทึกคลาสสำเร็จ', 'success');
			loadClasses();
			loadStats();
		} catch (err) {
			showAlert(err.message);
		}
	}

	async function deleteClass(id) {
		if (!confirm('ลบคลาสนี้?')) return;
		try {
			await adminFetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
			showAlert('ลบคลาสสำเร็จ', 'success');
			loadClasses();
			loadStats();
		} catch (err) {
			showAlert(err.message);
		}
	}

	// --- Bookings ---
	async function loadBookings() {
		const tbody = document.getElementById('bookings-table-body');
		tbody.innerHTML = '<tr><td colspan="6" class="text-center">กำลังโหลด...</td></tr>';
		try {
			const bookings = await adminFetch('/api/admin/bookings');
			if (!bookings.length) {
				tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">ไม่มีการจอง</td></tr>';
				return;
			}
			tbody.innerHTML = bookings
				.map((b) => {
					const userLabel = escapeHtml(b.user?.username || b.user?.name || '—');
					const classTitle = escapeHtml(b.classInfo?.title || '—');
					const statusBadge = bookingStatusBadge(b.status);
					const actions = bookingActions(b);
					return `
				<tr>
					<td><code>${escapeHtml(b.id)}</code></td>
					<td>${userLabel}</td>
					<td>${classTitle}</td>
					<td>${formatDate(b.createdAt)}</td>
					<td>${statusBadge}</td>
					<td class="text-end text-nowrap">${actions}</td>
				</tr>`;
				})
				.join('');
			tbody.querySelectorAll('[data-approve-booking]').forEach((btn) => {
				btn.addEventListener('click', () => setBookingStatus(btn.getAttribute('data-approve-booking'), 'paid'));
			});
			tbody.querySelectorAll('[data-cancel-booking]').forEach((btn) => {
				btn.addEventListener('click', () => setBookingStatus(btn.getAttribute('data-cancel-booking'), 'canceled'));
			});
		} catch (err) {
			tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${escapeHtml(err.message)}</td></tr>`;
		}
	}

	function bookingStatusBadge(status) {
		const map = {
			paid: 'success',
			pending: 'warning text-dark',
			canceled: 'secondary',
		};
		return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
	}

	function bookingActions(b) {
		if (b.status === 'paid') {
			return `<button class="btn btn-sm btn-outline-danger" data-cancel-booking="${b.id}">ยกเลิก</button>`;
		}
		if (b.status === 'pending') {
			return `
				<button class="btn btn-sm btn-success me-1" data-approve-booking="${b.id}">อนุมัติ</button>
				<button class="btn btn-sm btn-outline-danger" data-cancel-booking="${b.id}">ยกเลิก</button>`;
		}
		return '—';
	}

	async function setBookingStatus(id, status) {
		const label = status === 'paid' ? 'อนุมัติ' : 'ยกเลิก';
		if (!confirm(`${label}การจอง ${id}?`)) return;
		try {
			await adminFetch(`/api/admin/bookings/${id}/status`, {
				method: 'PUT',
				body: JSON.stringify({ status }),
			});
			showAlert('อัปเดตสถานะสำเร็จ', 'success');
			loadBookings();
			loadStats();
		} catch (err) {
			showAlert(err.message);
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

	function escapeAttr(str) {
		return escapeHtml(str).replace(/'/g, '&#39;');
	}

	function formatDate(raw) {
		if (!raw) return '—';
		try {
			return new Date(raw).toLocaleString('th-TH');
		} catch {
			return raw;
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		if (!requireAdmin()) return;
		const hint = document.getElementById('adminServerHint');
		if (hint && window.location.port && window.location.port !== '3000') {
			hint.classList.remove('d-none');
		}
		classModal = document.getElementById('classModal');
		classModalBs = new bootstrap.Modal(classModal);
		document.getElementById('btnAddClass').addEventListener('click', () => openClassModal(null));
		document.getElementById('classFormSave').addEventListener('click', saveClass);
		loadStats();
	});
})();
