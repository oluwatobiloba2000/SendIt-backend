import { Router } from 'express';
import AccountRecovery from '../../controllers/user/AccountRecovery';
import UserAuthentication from '../../controllers/user/auth';
import { checkUserToken } from '../../middleware/checkToken';


const router = Router();

router.post('/user/signup', UserAuthentication.signup);
router.post('/user/login', UserAuthentication.login);
router.post('/user/forgotpassword', AccountRecovery.ForgotPassword);
router.post('/user/reset/password', AccountRecovery.ResetPassword);
router.get('/user/verify', checkUserToken,  UserAuthentication.verifyUserToken);
export default router;
