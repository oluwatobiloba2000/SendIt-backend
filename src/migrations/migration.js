/* eslint-disable no-console */
const createUserTableQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS
    users(
        id UUID PRIMARY KEY NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        email VARCHAR UNIQUE NOT NULL,
        profile_pics VARCHAR NULL,
        firstname VARCHAR NOT NULL,
        lastname VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        address VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        is_suspended BOOLEAN NOT NULL DEFAULT false,
        forgot_password_token VARCHAR NULL,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        createdat TIMESTAMP DEFAULT NOW()
    )
`;

const createLogisticsCompanyTableQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS
    logistics_company(
        id UUID PRIMARY KEY NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        company_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        logo VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        forgot_password_token VARCHAR NULL,
        is_suspended BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        is_disabled BOOLEAN DEFAULT false,
        createdat TIMESTAMP DEFAULT NOW()
    )
`;


// DROP TABLE parcel;
const createParcelTableQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS
    parcel(
        id UUID PRIMARY KEY NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        track_number VARCHAR UNIQUE NOT NULL,
        parcel_remarks VARCHAR NOT NULL,
        parcel_photo VARCHAR NOT NULL,
        parcel_pickup_time TIMESTAMP NOT NULL,
        parcel_pickup_fullname VARCHAR NOT NULL,
        parcel_pickup_phonenumber VARCHAR NOT NULL,
        parcel_pickup_location VARCHAR NOT NULL,
        parcel_pickup_location_lat VARCHAR NOT NULL,
        parcel_pickup_location_lng VARCHAR NOT NULL,
        delivery_fullname VARCHAR NOT NULL,
        delivery_phonenumber VARCHAR NOT NULL,
        delivery_location VARCHAR NOT NULL,
        delivery_location_lat VARCHAR NOT NULL,
        delivery_location_lng VARCHAR NOT NULL,
        createdat TIMESTAMP DEFAULT NOW()
        )
        `;

const createOrderTableQuery = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE IF NOT EXISTS
        orders(
          id UUID PRIMARY KEY NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
          parcel_track_id VARCHAR UNIQUE NOT NULL,
          order_package VARCHAR NOT NULL,
          delivery_cost VARCHAR NULL,
          user_id UUID NOT NULL,
          delivery_company_id UUID NULL,
          is_approved BOOLEAN NULL DEFAULT false ,
          order_status VARCHAR NOT NULL,
          payment_status VARCHAR NOT NULL,
          FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_company_id) REFERENCES "logistics_company" (id) ON DELETE CASCADE,
      FOREIGN KEY (parcel_track_id) REFERENCES "parcel" (track_number) ON DELETE CASCADE
      )
`;

const createParcelActivityQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS
    parcel_activity(
        id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
        parcel_track_id VARCHAR NOT NULL,
        activity_content VARCHAR NOT NULL,
        createdat TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (parcel_track_id) REFERENCES "parcel" (track_number) ON DELETE CASCADE
  )
`;


const migrate = async (db) => {
  try {
    await db.query(createUserTableQuery);
    await db.query(createLogisticsCompanyTableQuery);
    await db.query(createParcelTableQuery);
    await db.query(createOrderTableQuery);
    await db.query(createParcelActivityQuery);
    return true;
  } catch (error) {
    return console.log(error);
  }
};

export default migrate;
