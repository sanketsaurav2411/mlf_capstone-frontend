import { Router } from 'express';
import { handleValidationErrors } from '../lib/validation';
import { requireAuth } from '../middleware/auth';
import { login, logout, getMe, loginWithGoogle } from '../controllers/authController';
import { loginValidator, logoutValidator } from '../validators/authValidators';

const router = Router();

router.post('/login', loginValidator, handleValidationErrors, login);
router.post('/google', loginWithGoogle);
router.post('/logout', logoutValidator, handleValidationErrors, requireAuth, logout);
router.get('/me', requireAuth, getMe);


export default router;
