const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");
const util = require("util");

const storage  = new GridFsStorage({
    url: process.env.MONGO_URI,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    file:(req, file)=>{
        const match = ["image/png", "image/jpeg"];
        //if an error occur change type back to mimetype
        if(match.indexOf(file.mimetype) === -1){
            const filename = `${Date.now()}-ecommerce-site-${file.originalname}`;
            return filename;
        }
        return {
            bucketName: "e-store-pictures",
            filename: `${Date.now()}-ecommerce-site-${file.originalname}`
        }
    }
})
var uploadFiles = multer({storage}).array("picture", 5);
var uploadFilesMiddleWare = util.promisify(uploadFiles);

module.exports = uploadFilesMiddleWare;