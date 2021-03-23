/* eslint-disable max-len */
import express from 'express';

import cloudinary from 'cloudinary';

import expressFileUpload from 'express-fileupload';

import dotenv from 'dotenv';

import { json, urlencoded } from 'body-parser';

import morgan from 'morgan';

import cors from 'cors';

import Routes from './src/routes/';

// import { addUserToOnlineCount, getOnlineUsersCountInOrg, removeUser } from './src/socket.io/org_socket_users_count';

const app = express();
dotenv.config();

const server = require('http').Server(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'https://sendit.netlify.app',
    methods: ['GET', 'POST'],
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.use(expressFileUpload({
  useTempFiles: true,
}));

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny'));

app.get('/', (req, res) => res.status(200).json({
  status: 'okay',
  code: 200,
  message: 'SentIt Api',
}));

app.use(Routes);

app.all('*', (req, res) => res.status(404).json({
  status: 'error',
  message: 'not found',
  code: 404,
}));

io.on("connection", (socket) => {

  socket.on("enter_user_room_through_id", ({id}) => {
    socket.join(id);
    console.log("Joined your private Room Through your id: " + id);
  });


  socket.on("send_notification_to_user_using_userid", (data) => {
    console.log(data);
    socket.to(data.id).emit("receive_notification_from_admin", data.content);
  });

  // order details room
  socket.on("enter_activity_details_room", ({track_number}) => {
    console.log('entered activity room !!' + track_number)
    socket.join(track_number);
  });

  socket.on("send_updates_to_order_details", (data) => {
    if(data.updateType === 'activity_update'){
      socket.to(data.track_number).emit("receive_activity_updates_to_order_details", data.content);
    }else if(data.updateType === 'order_status'){
      socket.to(data.track_number).emit("receive_order_status_updates_to_order_details", data.content);
    }
    console.log(data);
  });

  socket.on("send_location_updates_to_order_details", (data) => {
     if(data.updateType === 'order_pickup_location'){
       console.log('emitted pickup loc')
      socket.to(data.track_number).emit("receive_order_pickup_location_updates_to_order_details", data.content);
    }else if(data.updateType === 'order_delivery_location'){
      socket.to(data.track_number).emit("receive_order_delivery_location_updates_to_order_details", data.content);
    }
    console.log(data);
  });

  socket.on("enter_company_room", ({id}) => {
    socket.join(id); //=== 'all_company_room
 });

 socket.on("send_orders_to_approve_to_logistics_companies", (data) => {
   socket.to(data.room).emit("recieve_orders_to_approve_to_logistics_companies", data.content);
 console.log(data);
});

socket.on("approve_order", (data) => {
  socket.to(data.room).emit("recieve_approved_order", data.content);
console.log(data);
});


  socket.on("disconnect", (reason) => {
    socket.emit('disconnected')
    console.log({reason})
    console.log("USER DISCONNECTED");
  });
});


export default server;
