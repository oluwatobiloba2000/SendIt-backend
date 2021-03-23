/* eslint-disable max-len */
import Joi from 'joi';

const validate = {
  order_activity: ({ activity_content, track_id } = obj) => {
    const JoiSchema = Joi.object({
      activity_content: Joi.string().min(3).required(),
      track_id: Joi.string().min(3).required(),
    });

    return JoiSchema.validate({ activity_content, track_id });
  },

  change_order_status: ({
    track_id, status
  } = obj) => {
    const JoiSchema = Joi.object({
        status: Joi.string().min(3).valid('In Transit').valid('Delayed').valid('Cancelled').valid('Delivered').required(),
        track_id: Joi.string().min(3).required(),
    });

    return JoiSchema.validate({ track_id, status});
  },
};

export default validate;
