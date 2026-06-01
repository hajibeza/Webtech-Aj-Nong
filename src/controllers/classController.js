const classService = require('../services/classService');

function getAll(req, res) {
	try {
		const items = classService.getAll();
		return res.json({
			success: true,
			data: { items },
			message: '',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to fetch classes',
		});
	}
}

function getById(req, res) {
	try {
		const item = classService.getById(req.params.id);
		if (!item) {
			return res.status(404).json({
				success: false,
				data: null,
				message: 'Class not found',
			});
		}
		return res.json({
			success: true,
			data: item,
			message: '',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to fetch class',
		});
	}
}

function create(req, res) {
	try {
		const item = classService.create(req.body || {});
		return res.status(201).json({
			success: true,
			data: item,
			message: 'Class created',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to create class',
		});
	}
}

function update(req, res) {
	try {
		const item = classService.update(req.params.id, req.body || {});
		return res.json({
			success: true,
			data: item,
			message: 'Class updated',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to update class',
		});
	}
}

function remove(req, res) {
	try {
		const item = classService.remove(req.params.id);
		return res.json({
			success: true,
			data: item,
			message: 'Class deleted',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to delete class',
		});
	}
}

module.exports = { getAll, getById, create, update, remove };
