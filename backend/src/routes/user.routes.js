const express = require('express');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const userValidation = require('../validations/user.validation');
const auth = require('../middlewares/auth.middleware');
const { requirePrivilege } = require('../middlewares/rbac.middleware');

const router = express.Router();

// Auth routes
router.post('/signin', validate(userValidation.signin), userController.signin);
router.post('/signout', auth, userController.signout);
router.post('/refresh-token', userController.refreshToken);
router.get('/me', auth, userController.getMe);

// CRUD routes
router.post('/create', validate(userValidation.create), userController.create);
router.post('/update', auth, requirePrivilege('Edit User'), validate(userValidation.update), userController.update);
router.post('/delete', auth, requirePrivilege('Delete User'), userController.remove);

// Search & Count
router.post('/search', auth, requirePrivilege('View User'), userController.search);
router.post('/count', auth, requirePrivilege('View User'), userController.count);

// Get details
router.get('/show/:id', auth, requirePrivilege('View User'), userController.show);
router.get('/showUser/:id', userController.showUser);

// Password
router.post('/updatePassword', auth, requirePrivilege('Reset Password'), userController.updatePassword);
router.post('/resetPassword', userController.resetPassword);

// Profile Picture
router.post('/upload', auth, multipartMiddleware, userController.uploadProfilePic);
router.get('/profilePic/:file', userController.getProfilePic);

module.exports = router;
