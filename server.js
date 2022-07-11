require('dotenv').config()
const startup = require('./startapp')

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const express = require('express')

const bp = require('body-parser');
const cors = require('cors')
const passport = require("passport");
require("./middlewares/passport")(passport);

// Initialize the application
const app = express()

// check if exist private key
if(!process.env.PRIVATE_KEY){
  throw new Error("missing private key")
}

//middlewares
app.use(cors())
app.use(bp.json());
app.use(passport.initialize());



// User Router Middleware
app.use('/api/users',require('./routes/userRoute'))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("*", (req, res) => {
  res.redirect("/api-docs");
});

// start the server
startup(app)