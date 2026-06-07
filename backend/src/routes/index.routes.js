const express = require('express');
const indexController = require('../controllers/index.controller');

const router = express.Router();

router.get('/', indexController.getHome);
router.get('/appmeta/:file', indexController.getAppMeta);

module.exports = router;
