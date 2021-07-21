const mongoose = require("mongoose");

const connectDB = async () =>{
    try{
        // mongo db connection
        const con = await mongoose.connect(process.env.MONGO_URI, 
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true
            })
        console.log(`MongoDB connected on host: ${con.connection.host}`)
    }catch(e){
        console.log(e)
        process.exit(1);
        
    }
}

module.exports = connectDB;
