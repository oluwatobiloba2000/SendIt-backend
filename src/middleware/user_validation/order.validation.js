/* eslint-disable max-len */
import Joi from 'joi';

const validate = {
    createOrder: ({
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
    } = obj) => {
        const JoiSchema = Joi.object({
            parcel_remarks: Joi.string().min(3).required(),
            parcel_photo: Joi.string().min(3).optional(),
            parcel_pickup_time: Joi.date().min(5).required(),
            parcel_pickup_fullname: Joi.string().min(3).required(),
            parcel_pickup_phonenumber: Joi.string().min(5).required(),
            parcel_pickup_location: Joi.string().min(3).required(),
            parcel_pickup_location_lat: Joi.string().min(2).required(),
            parcel_pickup_location_lng: Joi.string().min(2).required(),
            delivery_fullname: Joi.string().min(3).required(),
            delivery_phonenumber: Joi.string().min(5).required(),
            delivery_location: Joi.string().min(5).required(),
            delivery_location_lat: Joi.string().min(2).required(),
            delivery_location_lng: Joi.string().min(2).required(),
            order_package: Joi.string().min(2).required(),
        });

        return JoiSchema.validate({
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
        });
    },

    //   signup: ({
    //     email, firstname, lastname, address, phone,password
    //   } = obj) => {
    //     const JoiSchema = Joi.object({
    //       email: Joi.string().email().required(),
    //       firstname: Joi.string().min(3).required(),
    //       lastname: Joi.string().min(3).required(),
    //       password: Joi.string().min(5).required(),
    //       address: Joi.string().min(3).required(),
    //       phone: Joi.string().min(3).required(),
    //     });


    // return JoiSchema.validate({email, firstname, lastname, address, phone, password});
    //   },
};

export default validate;
