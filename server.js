const express = require("express");
const app = express();
const cors = require("cors")
const dotenv = require("dotenv");
const morgan  = require("morgan");
//importing the configs
dotenv.config({path: `${__dirname}/config.env`})
app.use(cors());
//connect DB
const connectDB = require("./server/database/connection");
//MongoDB connection
connectDB();
//initializing the config f ile 

//init the port
const PORT = process.env.PORT || 3000
//disable etag
app.disable('etag');
//middleware-morgan
app.use(morgan('tiny'))
//middleware - bodyparser
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//the router as middleware
app.use('/', require('./server/routes/router'))



//initialize the server to listen on port 
app.listen(PORT, ()=>{console.log(`App is listening on port ${PORT}` )})