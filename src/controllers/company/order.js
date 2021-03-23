/* eslint-disable max-len */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import httpResponse from '../../helpers/http-response';
import validate from '../../middleware/company_validation/order.validation';
import { cancelOrder, changedOrderLocation, createOrder, getAllOrderForUser, getOrderAnanlytics, getOrderWithTrackNumber, getSearchOrder } from '../../repository/user';
import { BAD_REQUEST_CODE, CREATED_CODE, OK_CODE, SERVER_FAILURE_CODE, UNAUTHORIZED_CODE } from '../../helpers/constants';
import { approveOrderRepo, changeOrderStatusRepo, getAllOrderForCompany, getAllPendingOrderRepo, getOrderAnanlyticsCompany, getSearchOrderCompany, sendOrderActivities } from '../../repository/company';

/**
 * @class User Order
 *
 * @description  Controller for handling user orders
 */

class CompanyOrder {
    static async getOrderByTrackingId(req, res) {
        const { track_id } = req.params;

        if (!track_id) return httpResponse.error(res, 400, 'track_id is required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if(!orderDetails.data.parcel || !orderDetails.data.order)
             return httpResponse.error(res, 404, 'not found', 'not found');
            return httpResponse.success(res, OK_CODE, 'order details fetched success', orderDetails)
        } catch (error) {
            console.log({ error })
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async OrderAnalytics(req, res) {
        const { id: company_id } = req.company;

        try {
            const orderAnalytics = await getOrderAnanlyticsCompany(company_id);
            return httpResponse.success(res, OK_CODE, 'order analytics fetched success', orderAnalytics)
        } catch (error) {
            console.log({ error })
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }


    static async searchOrder(req, res) {
        const order_name = req.query.order_name || null;
        const track_id = req.query.track_id || null;
        const order_status = req.query.order_status || 'Approved';
        const { id: company_id } = req.company;

        // if (!(track_id || order_name))
        //     return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id or order_name query is required', 'validation error');

        try {
            const searchedOrder = await getSearchOrderCompany({ order_name, order_status, track_id, company_id });
            return httpResponse.success(res, OK_CODE, 'search fetched success', searchedOrder)

        } catch (error) {
            console.log(error)
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async getAllOrderForACompany(req, res) {
        try {
            const allOrder = await getAllOrderForCompany({ company_id: req.company.id });

            return httpResponse.success(res, OK_CODE, 'orders fetched success', allOrder)
        } catch (error) {
            console.log({ error })
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async cancelOrder(req, res) {
        const track_id = req.query.track_id;
        const { id: user_id } = req.user;

        if (!track_id) return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id is required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if (orderDetails.data.order && orderDetails.data.order.user_id === user_id) {
                if (orderDetails.data.order.order_status === 'Delivered') {
                    return httpResponse.error(res, BAD_REQUEST_CODE, 'order has been delivered', 'cannot cancel order');
                }
                const cancelledOrder = await cancelOrder(track_id);
                if (!cancelledOrder.error) return httpResponse.success(res, OK_CODE, 'order cancelled success', cancelledOrder.data)
            } else {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'only order owners are allowed');
            }

        } catch (error) {
            console.log(error)
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async changeOrderLocation(req, res) {
        const {
            parcel_pickup_location,
            parcel_delivery_location
        } = req.body;
        const { track_id } = req.query;
        const { id: user_id } = req.user;

        if (!track_id) return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id is required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if (orderDetails.data.order && orderDetails.data.order.user_id === user_id) {
                if (orderDetails.data.order.order_status === 'Delivered') {
                    return httpResponse.error(res, BAD_REQUEST_CODE, 'order has been delivered', 'cannot cancel order');
                }
                const changedLocOrder = await changedOrderLocation({ parcel_pickup_location, parcel_delivery_location }, track_id);
                if (!changedLocOrder.error) return httpResponse.success(res, OK_CODE, 'order location change success', changedLocOrder.data)
            } else {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'only order owners are allowed');
            }

        } catch (error) {
            console.log(error)
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async sendOrderActivity(req, res) {
        const {
            activity_content
        } = req.body;
        const { track_id } = req.query;
        // const { id: company_id } = req.company;

        // const validationError = validate.order_activity({ track_id, activity_content });
        if (!activity_content && !track_id) return httpResponse.error(res, BAD_REQUEST_CODE, 'all fields are required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if(!orderDetails.data.parcel || !orderDetails.data.order){
                return httpResponse.error(res, 404, 'order not found', 'not found')
            }
            else if (orderDetails.data.order) {
                const sentOrderActivity = await sendOrderActivities({ track_id, activity_content });
                if (!sentOrderActivity.error) return httpResponse.success(res, OK_CODE, 'order activity sent', sentOrderActivity.data)
            } else {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'this company is not allowed to send an activity');
            }

        } catch (error) {
            console.log(error)
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async changeorderStatus(req, res) {
        const {
            status
        } = req.body;
        const { track_id } = req.query;
        const { id: company_id } = req.company;

        const validationError = validate.change_order_status({ track_id, status });
        if (validationError.error) return httpResponse.error(res, BAD_REQUEST_CODE, validationError.error, 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if (orderDetails.data.order && orderDetails.data.order.delivery_company_id !== company_id) {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'this company is not allowed to send an activity');
            } else if (orderDetails.data.order && orderDetails.data.order.order_status === 'Cancelled') {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'this order has been cancelled');
            } else {
                const updatedOrderActivity = await changeOrderStatusRepo({ track_id, status });
                if (!updatedOrderActivity.error) return httpResponse.success(res, OK_CODE, 'order status changed', updatedOrderActivity.data)
            }

        } catch (error) {
            console.log(error)
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }


    static async getAllPendingOrder(req, res) {
        try {
            const allPendingOrder = await getAllPendingOrderRepo();

            return httpResponse.success(res, OK_CODE, 'pending orders fetched success', allPendingOrder.data)
        } catch (error) {
            console.log({ error })
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async approveOrder(req, res) {
        const { track_id } = req.query;
        const { id: company_id } = req.company;
        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if (orderDetails.data.order.is_approved === true && orderDetails.data.order.delivery_company_id !== null) {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'order has been approved');
            } else if (orderDetails.data.order.order_status === 'Cancelled') {
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed', 'order has been cancelled');
            }
            else {
                const approvedOrder = await approveOrderRepo({ track_id, company_id });
                if (!approvedOrder.error) return httpResponse.success(res, OK_CODE, 'orders approved success', approvedOrder.data)
            }

        } catch (error) {
            console.log({ error })
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }
}

export default CompanyOrder;
