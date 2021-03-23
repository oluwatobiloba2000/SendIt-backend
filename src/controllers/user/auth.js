/* eslint-disable max-len */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import httpResponse from '../../helpers/http-response';
import validate from '../../middleware/user_validation/auth.validation';
import { getUserByEmail, createUser } from '../../repository/user';
import { BAD_REQUEST_CODE, CREATED_CODE, OK_CODE, SERVER_FAILURE_CODE, UNAUTHORIZED_CODE } from '../../helpers/constants';

/**
 * @class Authentication
 *
 * @description  Authentication for users
 */

class UserAuthentication {
    /**
    * @static
    *
    * @description signup for users
    * @memberOf Authentication
    * req - {
    *   email, profile_pics, firstname, lastname, password, address
    * }
    */

    static async signup(req, res) {
        const validationError = validate.signup(req.body);
        if (validationError.error) return httpResponse.error(res, 400, validationError.error, 'validation error');

        try {

            const userExist = await getUserByEmail(req.body);
            if (userExist.error === false) return httpResponse.error(res, BAD_REQUEST_CODE, 'email already exist', true);

            const insertedUser = await createUser(req.body);

            return jwt.sign(insertedUser.data, process.env.USER_JWT_KEY, { expiresIn: '60d' }, async (err, token) => {
                if (err) {
                    return res.status(403).send(err);
                }
                return httpResponse.success(res, CREATED_CODE, 'user created success', {
                   user: insertedUser.data,
                   token
                })
            });
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    /**
      * @static
      *
      * @description login for users
      * @memberOf Authentication
      * req - {
      * email,
      * password
      * }
      */

    static async login(req, res) {
        try {
            const validationError = validate.login(req.body);
            if (validationError.error) return httpResponse.error(res, 400, validationError.error, 'validation error');

            const userExist = await getUserByEmail(req.body);

            if (userExist.error === false) {
                const match = await bcrypt.compare(
                    req.body.password,
                    userExist.data.password,
                );

                if (match) {
                    return jwt.sign(userExist.data, process.env.USER_JWT_KEY, { expiresIn: '60d' }, async (err, token) => {
                        if (err) {
                            return res.status(403).send(err);
                        }

                        return httpResponse.success(res, OK_CODE, 'login success', {
                            user: userExist.data,
                            token
                        });
                    });
                }
                return httpResponse.error(res, UNAUTHORIZED_CODE, 'incorrect email or password');
            }
            return httpResponse.error(res, 404, 'email does not exist');
        } catch (error) {
            return httpResponse.error(res, 500, error.message, 'server error');
        }
    }

    static async verifyUserToken(req, res) {
        try {
           return jwt.verify(req.token, process.env.USER_JWT_KEY, function(err, decoded) {
                if (err) {
                  return httpResponse.error(res, 401, 'invalid token', err );
                }else{
                 return httpResponse.success(res, OK_CODE, 'valid', {user: decoded})
                }
            });
        } catch (error) {
            return httpResponse.error(res, 500, 'Internal server error');
        }
    }
}

export default UserAuthentication;
