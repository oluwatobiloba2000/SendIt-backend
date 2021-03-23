/* eslint-disable max-len */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import httpResponse from '../../helpers/http-response';
import validate from '../../middleware/company_validation/auth.validation';
import { getCompanyByEmail, createCompany } from '../../repository/company';
import { BAD_REQUEST_CODE, CREATED_CODE, OK_CODE, SERVER_FAILURE_CODE, UNAUTHORIZED_CODE } from '../../helpers/constants';

/**
 * @class Authentication
 *
 * @description  Authentication for users
 */

class CompanyAuthentication {
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
        if (validationError.error) return httpResponse.error(res, BAD_REQUEST_CODE, validationError.error, 'validation error');

        try {

            const companyExist = await getCompanyByEmail(req.body);
            if (companyExist.error === false) return httpResponse.error(res, 400, 'email already exist', true);

            const insertedCompany = await createCompany(req.body);

            return jwt.sign({
                id: insertedCompany.data.id,
                email: insertedCompany.data.email,
                company_name: insertedCompany.data.company_name,
                logo: insertedCompany.data.logo,
                phone: insertedCompany.data.phone
            }, process.env.COMPANY_JWT_KEY, { expiresIn: '7d' }, async (err, token) => {
                if (err) {
                    return res.status(403).send(err);
                }
                return httpResponse.success(res, CREATED_CODE, 'company created success', {
                   company: insertedCompany.data,
                   token
                })
            });
        } catch (error) {
            console.log({error})
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
            if (validationError.message) return httpResponse.error(res, 400, validationError.message, 'validation error');

            const companyExist = await getCompanyByEmail(req.body);
            if (companyExist.error === false) {
                const match = await bcrypt.compare(
                    req.body.password,
                    companyExist.data.password,
                );

                if (match) {
                    return jwt.sign({
                        id: companyExist.data.id,
                        email: companyExist.data.email,
                        company_name: companyExist.data.company_name,
                        logo: companyExist.data.logo,
                        phone: companyExist.data.phone
                    }, process.env.COMPANY_JWT_KEY, { expiresIn: '30d' }, async (err, token) => {
                        if (err) {
                            return res.status(403).send(err);
                        }

                        return httpResponse.success(res, OK_CODE, 'login success', {
                            company: companyExist.data,
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

    static async verifyCompanyToken(req, res) {
        try {
           return jwt.verify(req.token, process.env.COMPANY_JWT_KEY, function(err, decoded) {
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

export default CompanyAuthentication;
