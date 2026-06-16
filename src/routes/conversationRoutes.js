const express = require('express');
const conversationController = require('../controllers/conversationController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', conversationController.getConversations);
router.get('/unread-count', conversationController.getUnreadCount);
router.post('/patient', authorize('patient'), conversationController.startConversation);
router.post('/clinic', authorize('clinic'), conversationController.startConversationClinic);
router.get('/:id/messages', conversationController.getMessages);
router.post('/:id/messages', upload.single('image'), conversationController.sendMessage);

module.exports = router;
