import { Router } from 'express';
import CompanyAuthentication from '../../controllers/company/auth';


const router = Router();

router.post('/company/signup', CompanyAuthentication.signup);
router.post('/company/login', CompanyAuthentication.login);

export default router;
