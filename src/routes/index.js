import express  from 'express';
const router = express();

import UserAuthRouter from './user/authRouter';
import UserOrderRouter from './user/order';
import CompanyAuthRouter from './company/authRouter';
import CompanyOrderRouter from './company/order';

router.use('/api/v1/', UserAuthRouter);
router.use('/api/v1/', UserOrderRouter);
router.use('/api/v1', CompanyAuthRouter);
router.use('/api/v1/', CompanyOrderRouter);

module.exports = router;
