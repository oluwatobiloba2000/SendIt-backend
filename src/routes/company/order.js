import { Router } from 'express';
import CompanyOrder from '../../controllers/company/order';
import {checkCompanyToken} from '../../middleware/checkToken';
import PhotoUploadController from '../../controllers/upload.controller';

const router = Router();

router.post('/company/order/activity/send', checkCompanyToken , CompanyOrder.sendOrderActivity);
router.get('/company/orders', checkCompanyToken, CompanyOrder.getAllOrderForACompany);
router.get('/company/order/pending', checkCompanyToken, CompanyOrder.getAllPendingOrder);
router.post('/company/order/status/change', checkCompanyToken, CompanyOrder.changeorderStatus);
router.get('/company/order/:track_id', checkCompanyToken, CompanyOrder.getOrderByTrackingId);
router.get('/company/orders/analytics', checkCompanyToken, CompanyOrder.OrderAnalytics);
router.get('/company/orders/search', checkCompanyToken, CompanyOrder.searchOrder);
router.put('/company/order/approve', checkCompanyToken, CompanyOrder.approveOrder);
router.post('/company/photo/upload', PhotoUploadController.upLoadphoto);

export default router;
