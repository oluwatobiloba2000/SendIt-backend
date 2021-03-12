/* eslint-disable max-len */
import Joi from 'joi';

const validate = {
  login: ({ email, password } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().min(3).required(),
      password: Joi.string().min(5).required(),
    });

    return JoiSchema.validate({ email, password });
  },

  signup: ({
    email, company_name, logo, password, phone
  } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().required(),
      company_name: Joi.string().min(3).required(),
      logo: Joi.string().min(3).optional(),
      password: Joi.string().min(5).required(),
      phone: Joi.string().min(3).required(),
    });


    return JoiSchema.validate({ email, company_name, logo, password, phone});
  },
};

export default validate;
