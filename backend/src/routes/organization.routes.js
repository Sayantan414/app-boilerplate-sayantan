const express = require('express');
const organizationController = require('../controllers/organization.controller');
const auth = require('../middlewares/auth.middleware');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const { requirePrivilege } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.post('/create', auth, requirePrivilege('Add Organization'), organizationController.create);
router.post('/update', auth, requirePrivilege('Edit Organization'), organizationController.update);
router.post('/delete', auth, requirePrivilege('Delete Organization'), organizationController.deleteOrg);
router.post('/remove', auth, requirePrivilege('Delete Organization'), organizationController.remove); // status === 'Removed' guard inside controller
router.get('/show/:id', auth, requirePrivilege('View Organization'), organizationController.show);
router.get('/showByCode/:ocode', auth, requirePrivilege('View Organization'), organizationController.showByCode);
router.get('/showAll', auth, requirePrivilege('View Organization'), organizationController.showAll);
router.post('/search', auth, requirePrivilege('View Organization'), organizationController.search);
router.post('/count', auth, requirePrivilege('View Organization'), organizationController.count);
router.post('/upload', [auth, multipartMiddleware], requirePrivilege('Edit Organization'), organizationController.upload);
router.get('/orgLogo/:file', organizationController.getLogo); // Public — no auth required
router.post('/countries', auth, requirePrivilege('View Organization'), organizationController.getCountries);
router.post('/states', auth, requirePrivilege('View Organization'), organizationController.getStates);
router.post('/cities', auth, requirePrivilege('View Organization'), organizationController.getCities);
router.post('/zones', auth, requirePrivilege('View Organization'), organizationController.getZones);

module.exports = router;
