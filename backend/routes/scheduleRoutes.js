// /api/schedules 경로 정의

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// GET /api/schedules 경로로 들어오면 컨트롤러 실행!
router.get('/', scheduleController.getSchedules);

module.exports = router;