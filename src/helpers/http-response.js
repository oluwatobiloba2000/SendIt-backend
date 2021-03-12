import { OK_CODE, SERVER_FAILURE_CODE } from "./constants";

const response = {
  error: (res, statusCode, errorMessage, error) => res.status(statusCode)
    .json({
      code: statusCode,
      message: errorMessage,
      error,
    }),
  success: (res, statusCode, message, data) => res.status(statusCode || OK_CODE)
    .json({
      code: statusCode || OK_CODE,
      message,
      data,
    }),
  serverFailure: (res, statusCode, message, error) => res.status(SERVER_FAILURE_CODE)
    .json({
      code: SERVER_FAILURE_CODE,
      message,
      error,
    }),
};

export default response;
