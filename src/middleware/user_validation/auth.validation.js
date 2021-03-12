/* eslint-disable max-len */
import Joi, { object } from 'joi';

const validate = {
  login: ({ email, password } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().min(3).required(),
      password: Joi.string().min(5).required(),
    });

    return JoiSchema.validate({ email, password });
  },

  signup: ({
    email, firstname, lastname, address, phone,password
  } = obj) => {
    const JoiSchema = Joi.object({
      email: Joi.string().email().required(),
      firstname: Joi.string().min(3).required(),
      lastname: Joi.string().min(3).required(),
      password: Joi.string().min(5).required(),
      address: Joi.string().min(3).required(),
      phone: Joi.string().min(3).required(),
    });


    return JoiSchema.validate({email, firstname, lastname, address, phone, password});
  },
};

export default validate;
