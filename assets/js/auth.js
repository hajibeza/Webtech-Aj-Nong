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

function applyUserDisplay(name, email) {
	document.querySelectorAll('[data-user-name]').forEach((el) => {
		el.textContent = name || 'ผู้ใช้';
	});
	document.querySelectorAll('[data-user-email]').forEach((el) => {
		el.textContent = email || '';
	});
}

/** Quick update from JWT only (name field never falls back to email). */
function updateUserDisplay() {
	const user = getCurrentUser();
	applyUserDisplay(user?.name, user?.email);
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
			applyUserDisplay(result.data.name, result.data.email);
			return;
		}
	} catch (error) {
		console.error('Failed to load user profile:', error);
	}

	updateUserDisplay();
}
