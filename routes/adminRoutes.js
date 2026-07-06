import express from 'express';
import { adminController } from '../controllers/adminController.js';

const router = express.Router();

router.get('/', adminController.getAdminData);
router.put('/appointments/:id/status', adminController.updateAppointmentStatus);
router.put('/appointments/:id/archive', adminController.toggleArchiveAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment);
router.put('/queries/:id/archive', adminController.toggleArchiveQuery);
router.delete('/queries/:id', adminController.deleteQuery);

export default router;
