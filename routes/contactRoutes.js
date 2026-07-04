import express from 'express';
import { contactController } from '../controllers/contactController.js';

const router = express.Router();

router.get('/', contactController.getMessages);
router.post('/', contactController.createMessage);

export default router;
