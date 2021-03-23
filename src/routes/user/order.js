import { Router } from 'express';
import UserOrder from '../../controllers/user/order';
import {checkUserToken} from '../../middleware/checkToken';
import PhotoUploadController from '../../controllers/upload.controller';
import CompanyOrder from '../../controllers/company/order';

const router = Router();

router.post('/user/order/create', checkUserToken , UserOrder.createOrder);
router.get('/user/orders', checkUserToken, UserOrder.getAllOrderForAUser);
router.post('/user/order/cancel', checkUserToken, UserOrder.cancelOrder);
router.post('/user/order/location/change', checkUserToken, UserOrder.changeOrderLocation);
router.get('/user/orders/analytics', checkUserToken, UserOrder.OrderAnalytics);
router.get('/user/orders/search', checkUserToken, UserOrder.searchOrder);
router.post('/user/photo/upload', checkUserToken, PhotoUploadController.upLoadphoto);
router.get('/user/order/:track_id', UserOrder.getOrderByTrackingId);
router.post('/user/order/activity/send' , CompanyOrder.sendOrderActivity);

export default router;
