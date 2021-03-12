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
    origin: 'http://localhost:3000',
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
  console.log(socket.id);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log("User Joined Room: " + data);
  });

  socket.on("send_message", (data) => {
    console.log(data);
    socket.to(data.room).emit("receive_message", data.content);
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});


export default server;
