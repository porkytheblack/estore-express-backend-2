const express = require('express');
const route = express.Router();

//controller
const controller = require("../controller/controller");

const Grid = require("gridfs-stream");
const mongoose = require("mongoose")

let gfs;

const conn = mongoose.connection;

conn.once("open", ()=>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("e-store-pictures")
})

route.get("/file/:filename", async (req, res)=>{
    try {
        const file  = await gfs.files.findOne({filename: req.params.filename});
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        res.send({
            Error: "Image not found"
        })
    }
})


//API
//user api testing done π
route.post('/api/users', controller.create );/**π its cool */
route.get('/api/users', controller.findUser);/**π its cool */
route.put('/api/users', controller.updateUser);/**π its cool */
route.delete('/api/users/image', controller.deleteProfilePicture);/**π its cool */
route.put('/api/users/image', controller.addProfilePicture);/**π its cool */




//products
//products api testing done π
//βοΈTODO add the ability to add tags/highlights and wearing
route.post('/api/products', controller.createProduct); /**π its cool */
route.get('/api/products', controller.findProducts); /**π its cool */
route.put('/api/products', controller.updateProduct); /**π its cool */
route.delete('/api/products', controller.deleteProduct);/**π its cool */
route.delete('/api/products/image', controller.deleteProductImage);/**π its cool */
route.put('/api/products/image', controller.updateProductImage);/**π its cool */
route.put('/api/products/arrays', controller.updateProductArrays)


//articles
// products api testing done π
//βοΈTODO add the ability to add and update all other arrays
route.post('/api/articles', controller.createArticle);/**π its cool */
route.get('/api/articles', controller.findArticle);/**π its cool */
route.put('/api/articles', controller.updateArticle);/**π its cool */
route.delete('/api/articles/image', controller.deleteArticleImages);/**π its cool */
route.put('/api/articles/image', controller.addArticleImages);/**π its cool */
route.put('/api/articles/arrays', controller.updateArticleArrays)


//tokens
// tokens api testing done π
route.post("/api/tokens", controller.createToken);/**π its cool */
route.put("/api/tokens", controller.updateToken );/**π its cool */
route.delete("/api/tokens", controller.deleteToken);/**π its cool */

//files
module.exports = route;

