// dependency imports
const express = require('express');
const { cookieAuth: auth } = require('../middleware/authenticate');
const HomeController = require('../controllers/HomeController');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// routes
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the API'
    });
});

router.get('/test', HomeController.testMethod);
router.get('/refresh-token', auth, AuthController.refreshToken);
router.get('/logout', auth, AuthController.logout);

router.get('/users', auth, HomeController.getUsersList);
router.get('/videos', auth, HomeController.getVideoList);
router.get('/quiz', auth, HomeController.getQuizList);
router.get('/answers', auth, HomeController.getAnswerList);
router.get('/contacts', HomeController.getContactsList);
router.get('/file-upload', HomeController.uploadImage);

module.exports = router;
