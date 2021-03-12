/* eslint-disable max-len */
import Joi, { object } from 'joi';

const validate = {
  forgotpasswordEmail: ({ email } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().min(3).required(),
    });

    return JoiSchema.validate({ email });
  },

  recover_password: ({
    password, email
  } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().min(3).required(),
      password: Joi.string().min(3).required()
    });


    return JoiSchema.validate({password, email});
  },
};

export default validate;
