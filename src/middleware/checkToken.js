/* eslint-disable consistent-return */
import jwt from 'jsonwebtoken';
import { SERVER_FAILURE_CODE, UNAUTHORIZED_CODE } from '../helpers/constants';
import httpResponse from '../helpers/http-response';

const checkUserToken = (req, res, next) => {
  const header = req.headers.authorization;
  try {
    if (typeof header !== 'undefined') {
      const bearer = header.split(' ');
      const token = bearer[1] || req.token;
      const decodedToken = jwt.verify(token, process.env.USER_JWT_KEY);
      if (decodedToken) {
        req.user = decodedToken;
        req.token = token;
        return next();
      }
      return res.status(UNAUTHORIZED_CODE).json({
        code: UNAUTHORIZED_CODE,
        message: 'Not Authorized',
      });
    }
    // if header is undefined , return bad request
    return res.status(UNAUTHORIZED_CODE).json({
      code: UNAUTHORIZED_CODE,
      message: 'Not Authorized',
    });
  } catch (error) {
    return res.status(UNAUTHORIZED_CODE).json({
      code: UNAUTHORIZED_CODE,
      message: 'Not Authorized',
    });
  }
};


const checkCompanyToken = (req, res, next) => {
  const header = req.headers.authorization;
  try {
    if (typeof header !== 'undefined') {
      const bearer = header.split(' ');
      const token = bearer[1] || req.token;
      const decodedToken = jwt.verify(token, process.env.COMPANY_JWT_KEY);
      if (decodedToken) {
        req.company = decodedToken;
        req.token = token;
        return next();
      }
      return res.status(UNAUTHORIZED_CODE).json({
        code: UNAUTHORIZED_CODE,
        message: 'Not Authorized',
      });
    }
    // if header is undefined , return bad request
    return res.status(UNAUTHORIZED_CODE).json({
      code: UNAUTHORIZED_CODE,
      message: 'Not Authorized',
    });
  } catch (error) {
    return res.status(UNAUTHORIZED_CODE).json({
      code: UNAUTHORIZED_CODE,
      message: 'Not Authorized',
    });
  }
};



export {
  checkCompanyToken,
  checkUserToken
};
