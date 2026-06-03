/**
 * Auth session helpers — always derive user from the current JWT, not stale cache.
 */
/** Backend origin: same host when on :3000, else default API port. */
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

function parseJwtPayload(token) {
	if (!token) return null;
	try {
		const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
		return JSON.parse(atob(base64));
	} catch {
		return null;
	}
}

function getAuthToken() {
	return localStorage.getItem('token');
}

/** Current user from live JWT payload (id, email, name, role). */
function getCurrentUser() {
	return parseJwtPayload(getAuthToken());
}

function isAuthenticated() {
	return !!getAuthToken() && !!getCurrentUser();
}

/**
 * Replace session on login — clear stale data first, then store new token + user.
 * @param {string} token
 * @param {object} [apiUser] — optional fields from API (name) merged into payload
 */
function saveAuthSession(token, apiUser = {}) {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	localStorage.removeItem('userId');
	localStorage.removeItem('userName');
	localStorage.removeItem('isAdmin');
	localStorage.removeItem('isLoggedIn');

	localStorage.setItem('token', token);

	const payload = parseJwtPayload(token) || {};
	const user = { ...payload, ...apiUser };
	localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthSession() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	localStorage.removeItem('userId');
	localStorage.removeItem('userName');
	localStorage.removeItem('isAdmin');
	localStorage.removeItem('isLoggedIn');
}

function getAuthHeaders() {
	const headers = { 'Content-Type': 'application/json' };
	const token = getAuthToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

function applyUserDisplay(name, email, profileImage) {
	document.querySelectorAll('[data-user-name]').forEach((el) => {
		el.textContent = name || 'ผู้ใช้';
	});
	document.querySelectorAll('[data-user-email]').forEach((el) => {
		el.textContent = email || '';
	});

	// Update profile images if profileImage is provided
	if (profileImage) {
		const imageUrl = getApiBaseUrl() + profileImage;
		const navProfileImg = document.querySelector('.dropdown-toggle img.rounded-circle');
		if (navProfileImg) navProfileImg.src = imageUrl;

		const profilePageImg = document.getElementById('profile-image-display');
		if (profilePageImg) profilePageImg.src = imageUrl;
	}
}

/** Quick update from JWT only (name field never falls back to email). */
function updateUserDisplay() {
	const user = getCurrentUser();
	applyUserDisplay(user?.name, user?.email, user?.profile_image);
}

/** Fetch name + email from database via GET /api/auth/me (source of truth). */
async function refreshUserDisplayFromApi() {
	if (!getAuthToken()) return;

	try {
		const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
			headers: getAuthHeaders(),
		});
		const result = await response.json();
		if (response.ok && result.success && result.data) {
			applyUserDisplay(result.data.name, result.data.email, result.data.profile_image);
			
			// Update local storage user data to keep it in sync
			saveAuthSession(getAuthToken(), result.data);
			return;
		}
	} catch (error) {
		console.error('Failed to load user profile:', error);
	}

	updateUserDisplay();
}

/** Upload new profile image */
async function uploadProfileImage(event) {
	const file = event.target.files[0];
	if (!file) return;

	const formData = new FormData();
	formData.append('profileImage', file);

	try {
		const response = await fetch(`${getApiBaseUrl()}/api/auth/profile-image`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${getAuthToken()}`
				// Don't set Content-Type here; let the browser set it automatically for FormData
			},
			body: formData
		});

		const result = await response.json();
		
		if (response.ok && result.success) {
			if (typeof showToast === 'function') {
				showToast('อัปเดตรูปโปรไฟล์สำเร็จ', 'success');
			} else {
				alert('อัปเดตรูปโปรไฟล์สำเร็จ');
			}
			// Refresh user display to show new image
			refreshUserDisplayFromApi();
		} else {
			if (typeof showToast === 'function') {
				showToast(result.message || 'การอัปโหลดล้มเหลว', 'danger');
			} else {
				alert(result.message || 'การอัปโหลดล้มเหลว');
			}
		}
	} catch (error) {
		console.error('Upload error:', error);
		alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
	}
}
