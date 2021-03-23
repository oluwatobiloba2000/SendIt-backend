/* eslint-disable max-len */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import httpResponse from '../../helpers/http-response';
import validate from '../../middleware/user_validation/order.validation';
import { cancelOrder, changedOrderLocation, createOrder, getAllOrderForUser, getOrderAnanlytics, getOrderWithTrackNumber, getSearchOrder } from '../../repository/user';
import { BAD_REQUEST_CODE, CREATED_CODE, OK_CODE, SERVER_FAILURE_CODE } from '../../helpers/constants';

/**
 * @class User Order
 *
 * @description  Controller for handling user orders
 */

class UserOrder {
    /**
    * @static
    *
    * @description create order
    * @memberOf user order
    * req - {
    *   parcel_track_number ,
        parcel_remarks,
        parcel_photo,
        parcel_pickup_time,
        parcel_pickup_fullname,
        parcel_pickup_phonenumber ,
        parcel_pickup_location,
        parcel_pickup_location_lat ,
        parcel_pickup_location_lng ,
        delivery_fullname ,
        delivery_phonenumber ,
        delivery_location ,
        delivery_location_lat ,
        delivery_location_lng ,

        ------order table ---

        order_package,
        delivery_cost,
        user_id,
        order_status = {
            Pending(default)
            Approved (apply if admin clicks on accept)
            in transit (admin can choose it)
            delayed (admin can choose it)
            cancelled (admin can choose it)
            Delivered (admin can choose it)
        }
        payment_status
        createdat
    * }
    */

    static async createOrder(req, res) {
        const validationError = validate.createOrder(req.body);
        if (validationError.error) return httpResponse.error(res, BAD_REQUEST_CODE, validationError.error, 'validation error');

        try {
            const insertedOrder = await createOrder(req.body, { user_id: req.user.id });

            return httpResponse.success(res, CREATED_CODE, 'order created success', insertedOrder)
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async getAllOrderForAUser(req, res) {
        try {
            const allOrder = await getAllOrderForUser({ user_id: req.user.id });

            return httpResponse.success(res, OK_CODE, 'orders fetched success', allOrder)
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async getOrderByTrackingId(req, res) {
        const { track_id } = req.params;
        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if(!orderDetails.data.parcel || !orderDetails.data.order)
             return httpResponse.error(res, 404, 'not found', 'not found');
            return httpResponse.success(res, OK_CODE, 'order details fetched success', orderDetails)
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async OrderAnalytics(req, res) {
        const { id: user_id } = req.user;

        try {
            const orderAnalytics = await getOrderAnanlytics(user_id);
            return httpResponse.success(res, OK_CODE, 'order analytics fetched success', orderAnalytics)
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }


    static async searchOrder(req, res) {
        const order_name = req.query.order_name || null;
        const track_id = req.query.track_id || null;
        const { id: user_id} = req.user;

        if(!(track_id || order_name))
         return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id or order_name query is required', 'validation error');

        try {
            const searchedOrder = await getSearchOrder({order_name, track_id, user_id});
            return httpResponse.success(res, OK_CODE, 'search fetched success', searchedOrder)

        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async cancelOrder(req, res) {
        const track_id = req.query.track_id;
        const { id: user_id} = req.user;

        if(!track_id) return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id is required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if(orderDetails.data.order && orderDetails.data.order.user_id === user_id){
                if(orderDetails.data.order.order_status === 'Delivered'){
                    return httpResponse.error(res, BAD_REQUEST_CODE, 'order has been delivered' ,'cannot cancel order');
                }
                const cancelledOrder =  await cancelOrder(track_id);
                if(!cancelledOrder.error) return httpResponse.success(res, OK_CODE, 'order cancelled success', cancelledOrder.data)
            }else{
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed' ,'only order owners are allowed');
            }

        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async changeOrderLocation(req, res) {
        const {
            parcel_pickup_location,
            parcel_delivery_location
        } = req.body;
        const {track_id} = req.query;
        const { id: user_id} = req.user;

        if(!track_id) return httpResponse.error(res, BAD_REQUEST_CODE, 'track_id is required', 'validation error');

        try {
            const orderDetails = await getOrderWithTrackNumber(track_id);
            if(orderDetails.data.order && orderDetails.data.order.user_id === user_id){
                if(orderDetails.data.order.order_status === 'Delivered'){
                    return httpResponse.error(res, BAD_REQUEST_CODE, 'order has been delivered' ,'cannot cancel order');
                }
                const changedLocOrder =  await changedOrderLocation({parcel_pickup_location, parcel_delivery_location, track_id, order_details: orderDetails.data});
                if(!changedLocOrder.error) return httpResponse.success(res, OK_CODE, 'order location change success', changedLocOrder.data)
            }else{
                return httpResponse.error(res, BAD_REQUEST_CODE, 'not allowed' ,'only order owners are allowed');
            }

        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }
}

export default UserOrder;
