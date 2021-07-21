var crypto = require('crypto');
const upload = require("../middleware/upload")
const Grid  = require("gridfs-stream")
const mongoose  = require("mongoose");
const blueprints = require("../model/model");
const tokenDb  = blueprints.tokenDb;

let gfs;
    const conn = mongoose.connection;
    conn.once("open", ()=>{
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection("e-store-pictures")
    })


var helpers  = {};

helpers.hash = (str)=>{
    const secret = process.env.HASHING_SECRET
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac("sha256", secret).update(str).digest('hex');
        return hash
    }else{
        return false
    }
}

helpers.uploadImages =async (req, res)=>{
    try {
        await upload(req, res);
        if(req.files.length < 1) return res.send("Choose an image to upload");
        let imgUrls = [];
        req.files.forEach((obj)=>{
            imgUrls.push(`http://localhost:${process.env.PORT}/file/${obj.filename}`)

        })
        return imgUrls; 
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            Error: "Unable to upload the image"
        })
    }
    
}

helpers.deleteImage = async (img_name)=>{
    try {
        await gfs.files.deleteOne({filename: img_name}).then(()=>{
            console.log("deletion success")
        }).catch((e)=>{
            console.log("Unable to delete the image")
        });
    } catch (error) {
        console.log("Deleting image error :- ",error)
    }

}
helpers.generateToken = (len)=>{
    len = typeof(len) == "number" ? len : false;
    if(len){
        //all the possible characters 
        var possibleCharacters = "QWERTYUIOPPPPPASDFGHJKLZXCVBNM1234567890qazwsxedcrfvtgbyhnujmikol.$#@&";
        var str  = "";
        for(i = 0; i <= len ; i++){
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length))
            str += randomCharacter;
        }
        return str
    }else{
        return false
    }
}

helpers.analyse_token = (token_id, rt)=>{
    
     tokenDb.findOne({token_id : token_id}).then((data)=>{
        if(typeof(data) !== undefined){
            const dt  = new Date();
            if(dt.getTime() < data.expires_on.getTime()){
                rt({ 
                    status: true,
                    message: "Token is working"
                })
            }else{
                rt({
                    status: false,
                    message: "The specified token has expired"
                })
            }
        }else{
            rt({
                status: false,
                message: "The specified token does not exist"
            })
        }
    }).catch((e)=>{
        console.log(e)
    })
}
helpers.chk_str = (str)=>{
    if(typeof(str) == "string" && str.length > 0 ){
        return true
    }else{
        return false
    }
}



module.exports = helpers;