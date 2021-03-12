import db from '../db/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OK_CODE, UNAUTHORIZED_CODE } from '../helpers/constants';
import EmailSender from '../services/emailSender';
import httpResponse from '../helpers/http-response';
const uniqid = require('uniqid');
require('dotenv').config()

export async function createUser(field = {}) {
    const {
        email, profile_pics, firstname, lastname, password, address, phone
    } = field;

    //  hash the incoming password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertedUser = await db.query('INSERT INTO users (email,profile_pics, firstname,lastname, password, address, phone) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [email, profile_pics, firstname, lastname, hashedPassword, address, phone]);
    if (insertedUser.rows[0]) {
        return {
            error: false,
            message: 'user inserted',
            code: 200,
            data: insertedUser.rows[0]
        };
    } else {
        return {
            error: true,
            message: 'user cannot be inserted',
            code: 404
        };
    }
}



//   static async deleteAdmissionRecord(field = {}, transaction = {}) {
//     return await admissionModel.destroy(
//       { returning: true, where: { id: field.recordId } },
//       transaction
//     );
//   }

export async function getUserByEmail(field = {}) {
    const { email } = field;
    const emailExist = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (emailExist.rows[0]) {
        return {
            error: false,
            message: 'user exist',
            code: 200,
            data: emailExist.rows[0]
        };
    } else {
        return {
            error: true,
            message: 'user not found',
            code: 404
        };
    }
}

export async function createOrder(field = {}, { user_id }) {
    let parcel_track_number = uniqid.time();

    const {
        parcel_remarks,
        parcel_photo,
        parcel_pickup_time,
        parcel_pickup_fullname,
        parcel_pickup_phonenumber,
        parcel_pickup_location,
        parcel_pickup_location_lat,
        parcel_pickup_location_lng,
        delivery_fullname,
        delivery_phonenumber,
        delivery_location,
        delivery_location_lat,
        delivery_location_lng,
        order_package
    } = field;

    const insertedParcelDetails = await db.query(`INSERT INTO parcel (
            parcel_remarks,
            parcel_photo,
            parcel_pickup_time,
            parcel_pickup_fullname,
            parcel_pickup_phonenumber,
            parcel_pickup_location,
            parcel_pickup_location_lat,
            parcel_pickup_location_lng,
            delivery_fullname,
            delivery_phonenumber,
            delivery_location,
            delivery_location_lat,
            track_number,
            delivery_location_lng) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [parcel_remarks, parcel_photo, parcel_pickup_time, parcel_pickup_fullname, parcel_pickup_phonenumber, parcel_pickup_location, parcel_pickup_location_lat, parcel_pickup_location_lng, delivery_fullname, delivery_phonenumber, delivery_location, delivery_location_lat, parcel_track_number, delivery_location_lng]);

    const insertedOrder = await db.query(`INSERT INTO orders (
            order_package,
            user_id,
            order_status,
            parcel_track_id,
            payment_status
            ) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [order_package, user_id, 'Pending', parcel_track_number, 'Awaiting Authorization']);

    if (insertedParcelDetails.rows[0] && insertedOrder.rows[0]) {
        return {
            error: false,
            message: 'order inserted',
            code: 200,
            data: { ...insertedParcelDetails.rows[0], ...insertedOrder.rows[0] }
        };
    } else {
        return {
            error: true,
            message: 'order cannot be inserted',
            code: 404
        };
    }
}

export async function cancelOrder(track_id) {
    const order_status = 'Cancelled';

    const cancelledOrder = await db.query(`UPDATE orders SET order_status=$1 WHERE parcel_track_id=$2 RETURNING *`, [order_status, track_id]);

    return {
        error: false,
        message: 'order cancelled',
        code: 200,
        data: cancelledOrder.rows[0]
    };
}

export async function changedOrderLocation({parcel_pickup_location, parcel_delivery_location} , track_id) {

    const changedOrder = await db.query(`UPDATE parcel SET delivery_location=$1 , parcel_pickup_location=$2 WHERE track_number=$3 RETURNING *`, [parcel_delivery_location, parcel_pickup_location, track_id]);

    return {
        error: false,
        message: 'order location changed',
        code: 200,
        data: changedOrder.rows[0]
    };
}

export async function getAllOrderForUser({ user_id }) {
    const allOrder = await db.query(`
    SELECT p.track_number, p.parcel_remarks, o.order_package, o.delivery_cost, o.delivery_company_id,
            o.is_approved, (SELECT company_name FROM logistics_company WHERE id = o.delivery_company_id) AS logistics_company_name, o.order_status, o.payment_status
            FROM parcel p
           FULL OUTER JOIN orders o ON p.track_number = o.parcel_track_id
           WHERE o.user_id = $1 ORDER BY p.createdat DESC`,
        [user_id]);

    return {
        error: false,
        message: 'order exist',
        code: 200,
        data: allOrder.rows
    };
}

export async function getOrderWithTrackNumber(track_id) {
    const parcelDetails = await db.query(`
      SELECT * FROM parcel WHERE track_number = $1`,
        [track_id]);
    const ordersDetails = await db.query(`
     SELECT * FROM orders WHERE parcel_track_id = $1`,
        [track_id]);
    const parcel_activity = await db.query(`
    SELECT * FROM parcel_activity WHERE parcel_track_id = $1`,
        [track_id]);
    return {
        error: false,
        message: 'order details exist',
        code: 200,
        data: {
            parcel: parcelDetails.rows[0],
            order: ordersDetails.rows[0],
            parcel_activity: parcel_activity.rows[0] || 'no activity'
        }
    };
}

export async function getOrderAnanlytics(user_id) {
    const ordersCount = await db.query(`
      SELECT COUNT(*), (SELECT COUNT(*) FROM orders WHERE order_status = 'Pending') AS pending_orders, (SELECT COUNT(*) FROM orders WHERE order_status = 'Delivered') AS delivered_orders FROM orders o WHERE user_id = $1`,
        [user_id]);
    return {
        error: false,
        message: 'order details exist',
        code: 200,
        data: ordersCount.rows[0]
    };
}

export async function getSearchOrder({ order_name, order_status, track_id, user_id }) {
    const searchedOrder = await db.query(
        `SELECT * FROM orders
        WHERE order_status ILIKE($1) AND order_package ILIKE($2) OR parcel_track_id ILIKE($3) AND  user_id=$4`,
        [order_status, order_name, track_id, user_id]);
    return {
        error: false,
        message: 'search exist',
        code: 200,
        data: searchedOrder.rows
    };
}

export async function sendRecoveryAccountToken({ email }) {
    const token = jwt.sign({ email }, process.env.RECOVERY_ACCOUNT_JWT_KEY, { expiresIn: '2d' });

    //  hash the incoming password
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(token, salt);
    await db.query('UPDATE users SET forgot_password_token=$1 WHERE email=$2 RETURNING *', [hashedToken, email]);

    EmailSender.sendNotificationEmail(email, 'Password Recovery From SentIt', `
            <h4 style="text-align: center;width: 100%;">You requested a password Reset</h4>
            <p>click on the button to reset your password</p>
            <p>It expires in 2 days</p>
            <a target="_blank" href="localhost:3000/forgotpassword?token=${token}&email=${email}" style="background-color: green; width: 200px; height: 80px;>Reset</a>

            <div>
            or copy and paste this link in your browser

            <span style="font-size: 11px; color: blue;">
                localhost:3000/password/reset?token=${token}&email=${email}
            </span>
            </div>
        `)
    return {
        error: false,
        message: 'email sent',
        code: OK_CODE
    }
}



export async function changePassword({ token, email, password }) {
    return jwt.verify(token, process.env.RECOVERY_ACCOUNT_JWT_KEY, async (err, decoded) => {
        if (err) {
            return {
                error: true,
                message: err,
                code: UNAUTHORIZED_CODE,
            }
        } else {
            if (decoded.email === email) {
                //  hash the incoming password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                await db.query(`UPDATE users SET password=$1 WHERE email=$2 RETURNING *`, [hashedPassword, email]);
                const updatedUserRecoveryAccount = await db.query('UPDATE users SET forgot_password_token=$1 WHERE email=$2 RETURNING *', ['null', email]);
                return {
                    error: false,
                    message: 'password changed success',
                    code: OK_CODE,
                    data: updatedUserRecoveryAccount.rows[0]
                }
            } else {
                return {
                    error: true,
                    message: 'invalid token',
                    code: 400,
                }
            }
        }
    });
}