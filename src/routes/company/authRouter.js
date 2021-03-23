import { Router } from 'express';
import CompanyAuthentication from '../../controllers/company/auth';
import { checkCompanyToken } from '../../middleware/checkToken';


const router = Router();

router.post('/company/signup', CompanyAuthentication.signup);
router.post('/company/login', CompanyAuthentication.login);
router.get('/company/verify', checkCompanyToken,  CompanyAuthentication.verifyCompanyToken);

export default router;
