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
//user api testing done 👍
route.post('/api/users', controller.create );/**👈 its cool */
route.get('/api/users', controller.findUser);/**👈 its cool */
route.put('/api/users', controller.updateUser);/**👈 its cool */
route.delete('/api/users/image', controller.deleteProfilePicture);/**👈 its cool */
route.put('/api/users/image', controller.addProfilePicture);/**👈 its cool */




//products
//products api testing done 👍
//✔️TODO add the ability to add tags/highlights and wearing
route.post('/api/products', controller.createProduct); /**👈 its cool */
route.get('/api/products', controller.findProducts); /**👈 its cool */
route.put('/api/products', controller.updateProduct); /**👈 its cool */
route.delete('/api/products', controller.deleteProduct);/**👈 its cool */
route.delete('/api/products/image', controller.deleteProductImage);/**👈 its cool */
route.put('/api/products/image', controller.updateProductImage);/**👈 its cool */
route.put('/api/products/arrays', controller.updateProductArrays)


//articles
// products api testing done 👍
//✔️TODO add the ability to add and update all other arrays
route.post('/api/articles', controller.createArticle);/**👈 its cool */
route.get('/api/articles', controller.findArticle);/**👈 its cool */
route.put('/api/articles', controller.updateArticle);/**👈 its cool */
route.delete('/api/articles/image', controller.deleteArticleImages);/**👈 its cool */
route.put('/api/articles/image', controller.addArticleImages);/**👈 its cool */
route.put('/api/articles/arrays', controller.updateArticleArrays)


//tokens
// tokens api testing done 👍
route.post("/api/tokens", controller.createToken);/**👈 its cool */
route.put("/api/tokens", controller.updateToken );/**👈 its cool */
route.delete("/api/tokens", controller.deleteToken);/**👈 its cool */

//files
module.exports = route;

