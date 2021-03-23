
import db from '../db/index';
import bcrypt from 'bcryptjs';

export async function createCompany(field = {}) {
    const {
        email, company_name, logo, password, phone
    } = field;

    //  hash the incoming password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertedUser = await db.query('INSERT INTO logistics_company ( email, company_name, logo, password, phone) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [ email, company_name, logo, hashedPassword, phone]);
    if (insertedUser.rows[0]) {
        return {
            error: false,
            message: 'company inserted',
            code: 200,
            data: insertedUser.rows[0]
        };
    } else {
        return {
            error: true,
            message: 'company cannot be inserted',
            code: 404
        };
    }
}

export async function getCompanyByEmail(field = {}) {
    const { email } = field;
    const emailExist = await db.query('SELECT * FROM logistics_company WHERE email=$1', [email]);
    if (emailExist.rows[0]) {
        return {
            error: false,
            message: 'company exist',
            code: 200,
            data: emailExist.rows[0]
        };
    } else {
        return {
            error: true,
            message: 'company not found',
            code: 404
        };
    }
}

export async function getSearchOrderCompany({ order_name, order_status, track_id, company_id }) {
    const searchedOrder = await db.query(
        `SELECT *, parcel_track_id AS track_number FROM orders
        WHERE order_status ILIKE($1) AND delivery_company_id=$4 OR order_package ILIKE($2) OR parcel_track_id ILIKE($3)`,
        [order_status, order_name, track_id, company_id]);
    return {
        error: false,
        message: 'search exist',
        code: 200,
        data: searchedOrder.rows
    };
}

export async function getOrderAnanlyticsCompany(company_id) {
    const ordersCount = await db.query(`
      SELECT COUNT(*), (SELECT COUNT(*) FROM orders WHERE order_status = 'Approved' AND delivery_company_id = $1) AS approved_orders, (SELECT COUNT(*) FROM orders WHERE order_status = 'Delivered' AND delivery_company_id = $1) AS delivered_orders FROM orders o WHERE delivery_company_id = $1`,
        [company_id]);
    return {
        error: false,
        message: 'order details exist',
        code: 200,
        data: ordersCount.rows[0]
    };
}

export async function getAllOrderForCompany({ company_id }) {
    const allOrder = await db.query(`
    SELECT p.track_number, p.parcel_remarks, o.order_package, o.delivery_cost, o.delivery_company_id,
            o.is_approved, (SELECT company_name FROM logistics_company WHERE id = o.delivery_company_id) AS logistics_company_name, o.order_status, o.payment_status
            FROM parcel p
           FULL OUTER JOIN orders o ON p.track_number = o.parcel_track_id
           WHERE o.delivery_company_id = $1 ORDER BY p.createdat DESC`,
        [company_id]);

    return {
        error: false,
        message: 'order exist',
        code: 200,
        data: allOrder.rows
    };
}


export async function sendOrderActivities({track_id, activity_content}) {

    const insertedActivity = await db.query('INSERT INTO parcel_activity ( parcel_track_id, activity_content) VALUES($1, $2) RETURNING *',
        [track_id, activity_content]);
    if (insertedActivity.rows[0]) {
        return {
            error: false,
            message: 'activity inserted',
            code: 200,
            data: insertedActivity.rows[0]
        };
    } else {
        return {
            error: true,
            message: 'activity cannot be inserted',
            code: 404
        };
    }
}

export async function changeOrderStatusRepo({track_id, status}) {

    const updatedOrderStatus = await db.query(`UPDATE orders SET order_status=$1 WHERE parcel_track_id=$2 RETURNING *`, [status, track_id]);

    return {
        error: false,
        message: 'order status updated',
        code: 200,
        data: updatedOrderStatus.rows[0]
    };
}


export async function getAllPendingOrderRepo() {
    const allOrder = await db.query(`
    SELECT o.id AS order_id, p.track_number, p.parcel_remarks,p.parcel_photo, p.parcel_pickup_time,
      o.order_package, o.delivery_cost, o.delivery_company_id,
       p.parcel_pickup_fullname, p.parcel_pickup_phonenumber, p.parcel_pickup_location,
       p.parcel_pickup_location_lat, p.parcel_pickup_location_lng, p.delivery_fullname,
       p.delivery_phonenumber, p.delivery_location, p.delivery_location_lat, p.delivery_location_lng, p.createdat,
       o.is_approved, (SELECT company_name FROM logistics_company WHERE id = o.delivery_company_id) AS logistics_company_name,
        (SELECT firstname FROM users WHERE id = o.user_id) AS poster_firstname,
        (SELECT lastname FROM users WHERE id = o.user_id) AS poster_lastname,
         o.order_status, o.payment_status
            FROM parcel p
           FULL OUTER JOIN orders o ON p.track_number = o.parcel_track_id
           WHERE o.is_approved = false AND NOT o.order_status = 'Cancelled' ORDER BY p.createdat DESC`);

    return {
        error: false,
        message: 'order exist',
        code: 200,
        data: allOrder.rows
    };
}

export async function approveOrderRepo({track_id, company_id}) {

    const approvedStatus = await db.query(`UPDATE orders SET delivery_company_id=$1, is_approved=true, order_status='Approved' WHERE parcel_track_id=$2 RETURNING *`, [company_id, track_id]);

    return {
        error: false,
        message: 'order approved',
        code: 200,
        data: approvedStatus.rows[0]
    };
}