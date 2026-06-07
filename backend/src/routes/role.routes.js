const express = require('express');
const roleController = require('../controllers/role.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const roleValidation = require('../validations/role.validation');
const { requirePrivilege } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.post('/create', auth, requirePrivilege('Add Role'), validate(roleValidation.create), roleController.create);
router.post('/update', auth, requirePrivilege('Edit Role'), validate(roleValidation.update), roleController.update);
router.post('/delete', auth, requirePrivilege('Delete Role'), validate(roleValidation.deleteRole), roleController.deleteRole);
router.post('/search', auth, requirePrivilege('View Role'), roleController.search);
router.get('/show/:id', auth, requirePrivilege('View Role'), roleController.show);
router.post('/count', auth, requirePrivilege('View Role'), roleController.count);
router.post('/showByName', auth, requirePrivilege('View Role'), validate(roleValidation.showByName), roleController.showByName);
router.post('/searchDefault', auth, requirePrivilege('View Role'), roleController.searchDefault);

module.exports = router;
