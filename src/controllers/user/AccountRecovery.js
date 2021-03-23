import bcrypt from 'bcryptjs';
import validate from '../../middleware/user_validation/account_recovery';
import httpResponse from '../../helpers/http-response';
import { changePassword, getUserByEmail, sendRecoveryAccountToken } from '../../repository/user';
import { BAD_REQUEST_CODE, OK_CODE, SERVER_FAILURE_CODE } from '../../helpers/constants';
class AccountRecovery {

    static async ForgotPassword(req, res) {
        const { email } = req.body;
        const validationError = validate.forgotpasswordEmail({ email: req.body.email });
        if (validationError.error) return httpResponse.error(res, 400, validationError.error, 'validation error');

        try {
            const userExist = await getUserByEmail(req.body);
            if (userExist.data) {
             const recoveryDetails =  await sendRecoveryAccountToken({res, email });
             if(!recoveryDetails.error) return httpResponse.success(res, OK_CODE, 'email sent');
             return httpResponse.error(res, 404, 'email cannot be sent', 'email cannot be sent at this time');
            }
            return httpResponse.error(res, 404, 'email not found', 'email not found');
        } catch (error) {
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }

    static async ResetPassword(req, res) {
        const { token, email } = req.query;
        const { password } = req.body;
        const validationError = validate.recover_password({ email, password});
        if (validationError.error) return httpResponse.error(res, 400, validationError.error, 'validation error');

        try {
            const userExist  = await getUserByEmail({email})
            const match = await bcrypt.compare(
                token,
                userExist.data.forgot_password_token
            );
            
            if(!match)
             return httpResponse.error(res, 400, 'invalid token', 'invalid token');

            const user = await changePassword({token, email, password });
            if (user.error) return httpResponse.error(res, 400, 'invalid token', 'token has expired');
            return httpResponse.success(res, OK_CODE, 'password reset success', user.data);

        } catch (error) {
            console.log("🚀 ~ file: AccountRecovery.js ~ line 46 ~ AccountRecovery ~ ResetPassword ~ error", {error})
            return httpResponse.error(res, SERVER_FAILURE_CODE, 'Internal server error');
        }
    }
}

export default AccountRecovery;