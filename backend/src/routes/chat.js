const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getHistory, getChat, deleteChat } = require('../controllers/chatController');

router.post('/send-message', auth, sendMessage);
router.get('/history', auth, getHistory);
router.get('/:id', auth, getChat);
router.delete('/:id', auth, deleteChat);

module.exports = router;
