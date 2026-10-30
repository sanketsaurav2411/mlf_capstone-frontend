import { Router } from 'express';
import { handleValidationErrors } from '../lib/validation';
import { optionalAuth } from '../middleware/auth';
import { requestDemo } from '../controllers/demoController';
import { demoRequestValidator } from '../validators/demoValidators';

const router = Router();

router.post('/request-demo', demoRequestValidator, handleValidationErrors, optionalAuth, requestDemo);

export default router;
