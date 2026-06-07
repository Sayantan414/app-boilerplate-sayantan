const express = require('express');
const userlogController = require('../controllers/userlog.controller');
const auth = require('../middlewares/auth.middleware');
const { requirePrivilege } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.post('/search', auth, requirePrivilege('View User Log'), userlogController.search);
router.post('/count', auth, requirePrivilege('View User Log'), userlogController.count);

module.exports = router;
