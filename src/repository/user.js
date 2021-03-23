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

export async function changedOrderLocation({ parcel_pickup_location, parcel_delivery_location, order_details, track_id }) {
    const newPickupLocation = parcel_pickup_location === undefined ? order_details.parcel.parcel_pickup_location : parcel_pickup_location;
    const newDeliveryLocation = parcel_delivery_location === undefined ? order_details.parcel.delivery_location : parcel_delivery_location;
    const changedOrder = await db.query(`UPDATE parcel SET delivery_location=$1 , parcel_pickup_location=$2 WHERE track_number=$3 RETURNING *`, [newDeliveryLocation, newPickupLocation, track_id]);

    return {
        error: false,
        message: 'order location changed',
        code: 200,
        data: changedOrder.rows[0]
    };
}

export async function getAllOrderForUser({ user_id }) {
    const allOrder = await db.query(`
    SELECT p.track_number, p.parcel_remarks, o.order_package, o.id AS order_id, o.delivery_cost, o.delivery_company_id,
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
     SELECT * FROM orders o FULL OUTER JOIN logistics_company lc ON o.delivery_company_id = lc.id WHERE parcel_track_id = $1`,
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
            parcel_activity: parcel_activity.rows || 'no activity'
        }
    };
}

export async function getOrderAnanlytics(user_id) {
    const totalOrdersCount = await db.query(`SELECT COUNT(*) FROM orders WHERE user_id = $1`, [user_id]);
    const pendingOrders = await db.query(`SELECT COUNT(*) FROM orders WHERE user_id = $1 AND order_status = 'Pending'`, [user_id]);
    const deliveredOrders = await db.query(`SELECT COUNT(*) FROM orders WHERE user_id = $1 AND order_status = 'Delivered'`, [user_id]);

    return {
        error: false,
        message: 'order details exist',
        code: 200,
        data: {
            count: totalOrdersCount.rows[0].count,
            pending_orders: pendingOrders.rows[0].count,
            delivered_orders: deliveredOrders.rows[0].count
        }
    };
}

export async function getSearchOrder({ order_name, track_id, user_id }) {
    const searchedOrder = await db.query(
        `SELECT *,parcel_track_id AS track_number FROM orders
        WHERE order_package ILIKE ($1) AND user_id=$3 OR parcel_track_id ILIKE ($2) `,
        [`%${order_name}%`, `%${track_id}%`, user_id]);
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
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
    <!--[if !mso]><!-->
    <style type="text/css">
      @font-face {
                font-family: 'flama-condensed';
                font-weight: 100;
                src: url('http://assets.vervewine.com/fonts/FlamaCond-Medium.eot');
                src: url('http://assets.vervewine.com/fonts/FlamaCond-Medium.eot?#iefix') format('embedded-opentype'),
                      url('http://assets.vervewine.com/fonts/FlamaCond-Medium.woff') format('woff'),
                      url('http://assets.vervewine.com/fonts/FlamaCond-Medium.ttf') format('truetype');
            }
            @font-face {
                font-family: 'Muli';
                font-weight: 100;
                src: url('http://assets.vervewine.com/fonts/muli-regular.eot');
                src: url('http://assets.vervewine.com/fonts/muli-regular.eot?#iefix') format('embedded-opentype'),
                      url('http://assets.vervewine.com/fonts/muli-regular.woff2') format('woff2'),
                      url('http://assets.vervewine.com/fonts/muli-regular.woff') format('woff'),
                      url('http://assets.vervewine.com/fonts/muli-regular.ttf') format('truetype');
              }
            .address-description a {color: #000000 ; text-decoration: none;}
            @media (max-device-width: 480px) {
              .vervelogoplaceholder {
                height:83px ;
              }
            }
    </style>
    <!--<![endif]-->
    <!--[if (gte mso 9)|(IE)]>
      <style type="text/css">
          .address-description a {color: #000000 ; text-decoration: none;}
          table {border-collapse: collapse ;}
      </style>
      <![endif]-->
  </head>
  
  <body bgcolor="#e1e5e8" style="margin-top:0 ;margin-bottom:0 ;margin-right:0 ;margin-left:0 ;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;background-color:#e1e5e8;">
    <center style="width:100%;table-layout:fixed;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#e1e5e8;">
      <div style="max-width:600px;margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;">
        <table align="center" cellpadding="0" style="border-spacing:0;font-family:'Muli',Arial,sans-serif;color:#333333;Margin:0 auto;width:100%;max-width:600px;">
          <tbody>
            <tr>
              <td align="center" class="vervelogoplaceholder" height="143" style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;height:143px;vertical-align:middle;" valign="middle"><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%22160%22%2C%22height%22%3A34%2C%22alt_text%22%3A%22Verve%20Wine%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/79d8f4f889362f0c7effb2c26e08814bb12f5eb31c053021ada3463c7b35de6fb261440fc89fa804edbd11242076a81c8f0a9daa443273da5cb09c1a4739499f.png%22%2C%22link%22%3A%22%23%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><aSend href="#" target="_blank"><img src="https://res.cloudinary.com/oluwatobby/image/upload/v1616247512/sendIT_logo_wbwcxm.png" alt="SendIt logo" style="border-width: 0px; width: 40px; height: 40px;" width="160"></a><b>&nbsp; Send IT</b></span></td>
            </tr>
            <!-- Start of Email Body-->
            <tr>
              <td class="one-column" style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;background-color:#ffffff;">
                <!--[if gte mso 9]>
                      <center>
                      <table width="80%" cellpadding="20" cellspacing="30"><tr><td valign="top">
                      <![endif]-->
                <table style="border-spacing:0;" width="100%">
                  <tbody>
                    <tr>
                      <td align="center" class="inner" style="padding-top:15px;padding-bottom:15px;padding-right:30px;padding-left:30px;" valign="middle"><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%22255%22%2C%22height%22%3A93%2C%22alt_text%22%3A%22Forgot%20Password%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/35c763626fdef42b2197c1ef7f6a199115df7ff779f7c2d839bd5c6a8c2a6375e92a28a01737e4d72f42defcac337682878bf6b71a5403d2ff9dd39d431201db.png%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><img alt="Forgot Password" class="banner" height="93" src="https://marketing-image-production.s3.amazonaws.com/uploads/35c763626fdef42b2197c1ef7f6a199115df7ff779f7c2d839bd5c6a8c2a6375e92a28a01737e4d72f42defcac337682878bf6b71a5403d2ff9dd39d431201db.png" style="border-width: 0px; margin-top: 30px; width: 255px; height: 93px;" width="255"></span></td>
                    </tr>
                    <tr>
                      <td class="inner contents center" style="padding-top:15px;padding-bottom:15px;padding-right:30px;padding-left:30px;text-align:left;">
                        <center>
                          <p class="h1 center" style="Margin:0;text-align:center;font-family:'flama-condensed','Arial Narrow',Arial;font-weight:100;font-size:30px;Margin-bottom:26px;">Forgot your password?</p>
                          <!--[if (gte mso 9)|(IE)]><![endif]-->
  
                          <p class="description center" style="font-family:'Muli','Arial Narrow',Arial;Margin:0;text-align:center;max-width:320px;color:#a1a8ad;line-height:24px;font-size:15px;Margin-bottom:10px;margin-left: auto; margin-right: auto;"><span style="color: rgb(161, 168, 173); font-family: Muli, &quot;Arial Narrow&quot;, Arial; font-size: 15px; text-align: center; background-color: rgb(255, 255, 255);">That's okay, it happens! Click on the button below to reset your password.</span></p>
                          <!--[if (gte mso 9)|(IE)]><br>&nbsp;<![endif]--><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%22260%22%2C%22height%22%3A54%2C%22alt_text%22%3A%22Reset%20your%20Password%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/c1e9ad698cfb27be42ce2421c7d56cb405ef63eaa78c1db77cd79e02742dd1f35a277fc3e0dcad676976e72f02942b7c1709d933a77eacb048c92be49b0ec6f3.png%22%2C%22link%22%3A%22%23%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D">
                          <a href="https://sendit.netlify.app/password/reset?token=${token}&email=${email}" target="_blank">
  <img alt="Reset your Password" height="54" src="https://marketing-image-production.s3.amazonaws.com/uploads/c1e9ad698cfb27be42ce2421c7d56cb405ef63eaa78c1db77cd79e02742dd1f35a277fc3e0dcad676976e72f02942b7c1709d933a77eacb048c92be49b0ec6f3.png" style="border-width: 0px; margin-top: 30px; margin-bottom: 50px; width: 260px; height: 54px;" width="260"></a></span>
                          <div>
                            <h3>Or Copy and paste this link in your browser</h3>
                            <div style="width: 500px; overflow: auto">
                            https://sendit.netlify.app/password/reset?token=${token}&email=${email}
                            </div>
                          </div>
                          <!--[if (gte mso 9)|(IE)]><br>&nbsp;<![endif]--></center>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                      </td></tr></table>
                      </center>
                      <![endif]-->
              </td>
            </tr>
            <!-- End of Email Body-->
            <!-- whitespace -->
            <tr>
              <td height="40">
                <p style="line-height: 40px; padding: 0 0 0 0; margin: 0 0 0 0;">&nbsp;</p>
  
                <p>&nbsp;</p>
              </td>
            </tr>
            <!-- Social Media -->
            <tr>
              <td align="center" style="padding-bottom:0;padding-right:0;padding-left:0;padding-top:0px;" valign="middle"><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%228%22%2C%22height%22%3A18%2C%22alt_text%22%3A%22Facebook%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/0a1d076f825eb13bd17a878618a1f749835853a3a3cce49111ac7f18255f10173ecf06d2b5bd711d6207fbade2a3779328e63e26a3bfea5fe07bf7355823567d.png%22%2C%22link%22%3A%22%23%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><a href="https://web.facebook.com/oluwatobi.anani.9/" target="_blank"><img alt="Facebook" height="18" src="https://marketing-image-production.s3.amazonaws.com/uploads/0a1d076f825eb13bd17a878618a1f749835853a3a3cce49111ac7f18255f10173ecf06d2b5bd711d6207fbade2a3779328e63e26a3bfea5fe07bf7355823567d.png" style="border-width: 0px; margin-right: 21px; margin-left: 21px; width: 8px; height: 18px;" width="8"></a></span>
                <!--[if gte mso 9]>&nbsp;&nbsp;&nbsp;<![endif]--><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%2223%22%2C%22height%22%3A18%2C%22alt_text%22%3A%22Twitter%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/6234335b200b187dda8644356bbf58d946eefadae92852cca49fea227cf169f44902dbf1698326466ef192bf122aa943d61bc5b092d06e6a940add1368d7fb71.png%22%2C%22link%22%3A%22%23%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><a href="https://twitter.com/Anani_oluwatobi" target="_blank"><img alt="Twitter" height="18" src="https://marketing-image-production.s3.amazonaws.com/uploads/6234335b200b187dda8644356bbf58d946eefadae92852cca49fea227cf169f44902dbf1698326466ef192bf122aa943d61bc5b092d06e6a940add1368d7fb71.png" style="border-width: 0px; margin-right: 16px; margin-left: 16px; width: 23px; height: 18px;" width="23"></a></span>
                <!--[if gte mso 9]>&nbsp;&nbsp;&nbsp;&nbsp;<![endif]--><span class="sg-image" data-imagelibrary="%7B%22width%22%3A%2218%22%2C%22height%22%3A18%2C%22alt_text%22%3A%22Instagram%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//marketing-image-production.s3.amazonaws.com/uploads/650ae3aa9987d91a188878413209c1d8d9b15d7d78854f0c65af44cab64e6c847fd576f673ebef2b04e5a321dc4fed51160661f72724f1b8df8d20baff80c46a.png%22%2C%22link%22%3A%22%23%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><a href="https://www.instagram.com/anani_oluwatobi/" target="_blank"><img alt="Instagram" height="18" src="https://marketing-image-production.s3.amazonaws.com/uploads/650ae3aa9987d91a188878413209c1d8d9b15d7d78854f0c65af44cab64e6c847fd576f673ebef2b04e5a321dc4fed51160661f72724f1b8df8d20baff80c46a.png" style="border-width: 0px; margin-right: 16px; margin-left: 16px; width: 18px; height: 18px;" width="18"></a></span></td>
            </tr>
            <!-- whitespace -->
            <tr>
              <td height="25">
                <p style="line-height: 25px; padding: 0 0 0 0; margin: 0 0 0 0;">&nbsp;</p>
  
                <p>&nbsp;</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding-top:0;padding-bottom:0;padding-right:30px;padding-left:30px;text-align:center;Margin-right:auto;Margin-left:auto;">
                <center>
                  <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;font-size:15px;color:#a1a8ad;line-height:23px;">Problems or questions? Call us at
                    <nobr><a class="tel" href="tel:+2348109263085" style="color:#a1a8ad;text-decoration:none;" target="_blank"><span style="white-space: nowrap">+2348109263085</span></a></nobr>
                  </p>
  
                  <p style="font-family:'Muli',Arial,sans-serif;Margin:0;text-align:center;Margin-right:auto;Margin-left:auto;font-size:15px;color:#a1a8ad;line-height:23px;">or email <a href="mailto:oluwatobiloba2000@gmail.com" style="color:#a1a8ad;text-decoration:underline;" target="_blank">ananioluwatobiloba2000@gmail.com</a></p>
  
                </center>
              </td>
            </tr>
            <!-- whitespace -->
            <tr>
              <td height="40">
                <p style="line-height: 40px; padding: 0 0 0 0; margin: 0 0 0 0;">&nbsp;</p>
  
                <p>&nbsp;</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </center>
    <!--[if gte mso 9]>
  </td></tr></table>
  </center>
  <![endif]-->
  
  
  </body>
        `)
    return {
        error: false,
        message: 'email sent',
        code: OK_CODE
    }
}



export async function changePassword({ token, email, password }) {
    return jwt.verify(token, process.env.RECOVERY_ACCOUNT_JWT_KEY, async (err, decoded) => {
        console.log("🚀 ~ file: user.js ~ line 397 ~ returnjwt.verify ~ err", err)
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
                console.log("🚀 ~ file: user.js ~ line 412 ~ returnjwt.verify ~ updatedUserRecoveryAccount", updatedUserRecoveryAccount.rows[0])
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