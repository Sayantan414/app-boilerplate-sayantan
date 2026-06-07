const express = require('express');
const smslogController = require('../controllers/smslog.controller');
const auth = require('../middlewares/auth.middleware');
const { requirePrivilege } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.post('/search', auth, requirePrivilege('View SMS Log'), smslogController.search);
router.post('/count', auth, requirePrivilege('View SMS Log'), smslogController.count);
router.post('/totalUsage', auth, requirePrivilege('View SMS Log'), smslogController.totalUsage);

module.exports = router;
