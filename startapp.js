const { connect } = require("mongoose");
const { success, error } = require("consola");

module.exports = startapp = async(app)=>{
    try {
        // Connection With DB
        await connect(process.env.MONGO_CONNECTION, {
            useNewUrlParser: true,
          });
          success({
            message: `Successfully connected with the Database \n${process.env.MONGO_CONNECTION}`,
            badge: true,
          });

         app.listen(process.env.PORT, () =>success({ message: "Server started", badge: true }))
    } catch (err) {
        error({
            message: `Unable to connect with Database \n${err}`,
            badge: true,
          });
        
        //recursive call
        startapp(app)
    }
}