const blueprints = require("../model/model");
const helpers  = require("../helpers/helpers")


//the user db
const userDb = blueprints.userDb;
const productDb = blueprints.productDb;
const articleDb = blueprints.articleDb;
const tokenDb  = blueprints.tokenDb;


//create and save the user
exports.create = (req, res)=>{
    console.log(req)
    //validate the request
    if(!req.body){
        res.status(400).json({
            Error: "The user Details cannot be empty"
        })
    }
    const hashed_password  = helpers.hash(req.body.password);
    console.log(hashed_password)
    //new user
    if(hashed_password){
        const user = userDb({
            email : req.body.email,
            username: req.body.username,
            profile_picture: "",
            gender: req.body.gender,
            age: req.body.age,
            hashed_password: hashed_password,
            status: req.body.status || "user"
        })
        //save the user to the database
    user 
        .save(user)
        .then(data=>{
            res.status(200).send(data)
        })
        .catch(err=>{
            res.status(500).send({
                message : err.message || "Some error occured while creating the user"
            })
        })
    }else{
        res.status(400).json({
            Error: "Invalid password was provided"
        })
    }
    

    
}


//add the profile picture
exports.addProfilePicture = async (req, res)=>{
    if(req.query.email){
        const hdr = req.headers;
        tokenDb.findOne({token_id: hdr.token_id, useremail: req.query.email }).then(async (data)=>{
            if(data.length > 0){
                const nw  = new Date;
                if(nw.getTime() < data[0].expires_on.getTime()){
                    const imgUrl = await helpers.uploadImages(req, res);
                    userDb.updateOne({email: req.query.email}, {profile_picture: imgUrl[0]}).then((data)=>{
                        res.status(200).send(data)
                    }).catch(e=>{
                        res.send({
                            Error: e || "Unable to add image to user's profile"
                        })
                    })
                }else{
                    res.send({
                        Error: "The specified token has already expired"
                    })
                }               
            }else{
                res.send({
                    Error: "The specified token is invalid"
                })
            }
        })
    }else{
        return res.send({
            Error: "No user email was specified"
        })
    }
}


//delete the profile picture
exports.deleteProfilePicture = async (req, res)=>{
    if(req.query.email){
        const hdr = req.headers;
        tokenDb.findOne({token_id: hdr.token_id, useremail: req.query.email}).then((data)=>{
            if(data.length > 0 ){
                const dt = new Date();
                if(dt.getTime() < data[0].expires_on.getTime()){
                    userDb.find({email: req.query.email}).then(async(data)=>{
                        if(data.length > 0){
                            //@TODO remember to edit this part when the url changes from localhost
                            const img_name  = data[0].profile_picture.replace(`http://localhost:${process.env.PORT}/file/`, "");
                            
                            await helpers.deleteImage(img_name);
                            userDb.updateOne({email: req.query.email}, {profile_picture: ""}).then((data)=>{
                                res.status(200).send(data)
                            }).catch(e=>{
                                res.send({
                                    Error: e || "Unable to delete profile picture from user's profile"
                                })
                            })
                        }else{
                            res.send({
                                Error: "Unable to find the specified user"
                            })
                        }
                    }).catch((e)=>{
                        res.send({
                            Error: e || "Unable to find the specified user"
                        })
                    });
                }else{
                    res.send({
                        Error: "The provided token has already expired"
                    })
                }
            }else{
            res.send({
                Error: "The specified token does not exist"
            })
            }
        })
    }else{
        return res.send({
            Error: "No user email was specified"
        })
    }
}

//finding the user
exports.findUser = (req, res)=>{
    
    const hdr  = req.headers;
    console.log(hdr.token_id.length)
    if(typeof(hdr.token_id) == "string" && hdr.token_id.length > 0){
        tokenDb.findOne({token_id: hdr.token_id}).then((data)=>{
            console.log(data)
            if( typeof(data) !== undefined){
                const dt = new Date();
                if(dt.getTime() < data.expires_on.getTime()){
                    userDb.findOne({email: data.useremail}).then((data)=>{
                        if(typeof(data) !== undefined){
                            res.send(data)
                        }else{
                            res.send({
                                Error: "This user does not exist"
                            })
                        }
                    })
                }else{
                    res.send({
                        Error: "This token has already expired"
                    })
                }
            }else{
                res.send({
                    Error: "Token id provided does not exist"
                })
            }
        })
    }else{
        res.send({
            Error: "Invalid token Id was provided"
        })
    }    
}
//updating the user
exports.updateUser = (req, res)=>{
    if(!req.body ){
        return res.send({
            Error: "Nothing to update"
        })
    }
    if(!req.query.email){
        return res.send({
            Error: "No user email has been specied"
        })
    }
    const hdr = req.headers;
    if(typeof(hdr.token_id) == "string" && hdr.token_id.length > 0){
        const token = helpers.analyse_token(hdr.token_id);
        if(token.status){
            const userEmail = typeof(req.query.email) == "string" && req.query.email.length > 0 ? req.query.email : false;
            // @Todo add password updating
            if(userEmail){
                userDb.findOneAndUpdate({email: userEmail}, req.body, {returnNewDocument: true})
                    .then((data)=>{
                        res.send(data)
                    }).catch((err)=>{
                        res.send({
                            Error: err || "Unable to update the user with the specified email"
                        })
                    })
            }else{
                res.send({
                    Error: "Invalid Email was provided"
                })
            }   
        }else{
            res.send({
                Error: token.message
            })
        }
    }else{
        res.send({
            Error: "The provided token is invalid"
        })
    }  

}


///product logic
//create and save a product
exports.createProduct = async (req, res)=>{
    if(!req.body){
        res.send({
            Error: "Data needs to be provided inorder to create an new product"
        })
    }else{
        const hdr = req.headers;
        if(typeof(hdr.token_id) == "string" && hdr.token_id.length > 0){

            helpers.analyse_token(hdr.token_id, (token)=>{
                if(token.status){
                    let imgUrls = []
                    if(req.files){
                        imgUrls = helpers.uploadImages(req, res);
                    }
                    const data = req.body;
                    console.log(data)
                    //remember to update this and make it dynamic this will hapen when tokenisation starts👉
                    const product = new productDb({
                        seller: data.seller,
                        Images: imgUrls,
                        name: data.product_name,
                        brand: data.brand,
                        price: data.price,
                        wearing: data.wearing,
                        description: data.description,
                        highlights: data.highlights,
                        composition: data.composition,
                        designerStyleId: data.designerStyleId,
                        category: data.category,
                        sub_category: data.sub_category,
                        gender: data.gender,
                        sizes: data.sizes,
                        designer: data.designer,
                        color: data.color,
                        tags: data.tags,
                        targetAge: data.targetAge
                    })
    
                    product
                        .save(product)
                        .then((data)=>{
                            res.status(200).json(data)
                        }).catch((e)=>{
                            res.status(500).json({
                                Error: e.message || "Unable to create new product"
                            })
                        })
                }else{
                    res.status(400).send({
                        Error: token.message
                    })
                }
            })
        }else{
            res.send({
                Error: "Invalid token was provided"
            })
        }
        
    }
}

//find product
exports.findProducts = async (req, res)=>{
    const hdr  = req.headers;
    if(typeof(hdr.token_id) == "string" && hdr.token_id.length > 0){
        const token = helpers.analyse_token(hdr.token_id);
        if(typeof(token) !== undefined){
            if(token.status){
                if(req.query.product_name){
                    const pName = req.query.product_name;
                    productDb.find({name: pName})
                        .then((data)=>{
                            if(!data){
                                res.status(404).json({
                                    Error: "No such product exists"
                                })
                            }else{
                                res.send(data)
                            }
                        }).catch((e)=>{
                            res.status(500).json({Error: "Unable to find the specified product"})
                        })
                }else{
                    productDb.find({})
                        .then(data=>{
                            res.send(data)
                        }).catch((e)=>{
                            res.status(500).send({Error: e.message || "An error occured while trying to retrieve product information"})
                        })
                }
            }else{
                res.send({
                    Error: token.message
                })
            }
        }
        
    }else{
        res.send({
            Error: "Invalid token id was provided"
        })
    }
}


//update the product
exports.updateProduct = (req, res)=>{
    if(!req.query.product_name){
        res.status(400).send({
            Error: "Specify a product inorder to update it"
        })
    }else{
        const tkn  = req.headers.token_id;
        if(typeof(tkn) == "string" && tkn.length > 0){
            const token  = helpers.analyse_token;
            if(token.status){
                productDb.findOneAndUpdate({name: req.query.product_name}, req.body, {returnNewDocument: true})
                .then((data)=>{
                    res.send(data)
                })
                .catch((e)=>{
                    res.status(500).send({
                        Error: e.message || "Unable to update the user"
                    })
                })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }
    }
}

//delete a product
exports.deleteProduct = (req,res)=>{
    if(req.query.product_name){
        const tkn  = req.headers.token_id;
        if(typeof(tkn) == "string" && tkn.length > 0){
            const token = helpers.analyse_token(tkn);
            if(token.status){
                productDb.deleteOne({
                    name: req.query.product_name
                }).then((data)=>{
                    res.send(data)
                }).catch((e)=>{
                    res.send({
                        Error: e || "Unable to delete the specified product"
                    })
                })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }
    }else{
        res.send({
            message:"No product name was specified"
        })
    }
}

//delete product image
exports.deleteProductImage = async (req, res)=>{
    if(req.query.image_name && req.query.product_name){
        const tkn  = req.headers.token_id;
        if(typeof(tkn) == "string" && tkn.length > 0){
            const token  = helpers.analyse_token(tkn);
            if(token.status){
                //@TODO remember to modify this path whe hosting canges from localhost
                const img_name  = req.query.image_name.replace(`http://localhost:${process.env.PORT}/file/`, "")
                await helpers.deleteImage(img_name);
                productDb.updateOne({name: req.query.product_name}, {$pull: {Images: req.query.image_name}}).then((data)=>{
                    res.status(200).send(data)
                }).catch(e=>{
                    res.send({
                        Error: e || "Unable to delete the product's image"
                    })
                })
            }else{
                res.send({
                    Error: e.message
                })
            }
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }
    }else{
        res.send({
            message: "No image to delete"
        })
    }
}
//add product image
exports.updateProductImage = async (req, res)=>{
    if(req.query.product_name){
        const tkn = req.headers.token_id;
        if(helpers.chk_str(tkn)){
            helpers.analyse_token(tkn, async (token)=>{
                if(token.status){
                    const imgUrls = await helpers.uploadImages(req, res);
                    if(imgUrls.length > 0 ){
                        if(imgUrls.length > 1){
                            productDb.updateOne({name: req.query.product_name}, {$push: {Images: imgUrls}}).then((data)=>{
                                res.send(data)
                            }).catch((e)=>{
                                res.send({
                                    Error: e || "Unable to add the product image"
                                })
                            })
                        }else{
                            productDb.updateOne({name: req.query.product_name}, {$push: {Images: imgUrls[0]}}).then((data)=>{
                                res.send(data)
                            }).catch((e)=>{
                                res.send({
                                    Error: e || "Unable to add the product image"
                                })
                            })
                        }
                        
                    }else{
                        res.send({
                            Error: "No image to upload"
                        })
                    } 
                }else{
                    res.send({
                        Error: token.message
                    })
                }
            });
            
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }       
    }else{
        res.send({
            message: "No product to update"
        })
    }
}

//update product arrays
exports.updateProductArrays = (req, res)=>{
    const tkn = req.headers.token_id;
    const p_n = req.query.product_name
    const method = req.method;
    if(helpers.chk_str(tkn)){
        const token  = helpers.analyse_token(tkn);
        if(token.status){
            const data = req.body;
            if(data){
                for(const key in data){
                    if(key == "highlights" && method == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {highlights: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "highlights" && method == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {highlights: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "tags" && method == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {tags: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "tags" && method == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {tags: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "wearing" && method  == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {wearing: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "wearing" && method  == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {wearing: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "composition" && method == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {composition: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "composition" && method == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {composition: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "color" && method == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {color: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "color" && method == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {color: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "sizes" && method == "put"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$push : {sizes: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }else if(key == "sizes" && method == "delete"){
                        data[key].forEach((obj)=>{
                            productDb.updateOne({name: p_n}, {$pull : {sizes: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                    console.log("update complete")
                                }else{
                                    res.send({
                                        Error: "no such product found"
                                    })
                                }
                            })
                        })
                    }
                }
                
            }else{
                res.send({
                    Error: "Nothing to update"
                })
            }
        }else{
            res.send({
                Error: token.message
            })
        }
    }else{
        res.send({
            Error: "Invalid token id was provided"
        })
    }
}


//update article arrays
exports.updateArticleArrays = (req, res)=>{
    const tkn = req.headers.token_id;
    const a_n = req.query.article_title
    const method = req.method;
    if(helpers.chk_str(tkn)){
        const token  = helpers.analyse_token(tkn);
        if(token.status){
            const data = req.body;
            if(data){
                for(const key in data){
                    if(key == "tags" && method == "put"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$push : {tags: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }else if(key == "tags" && method == "delete"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$pull : {tags: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }
                    if(key == "key_topics" && method == "put"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$push : {key_topics: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }else if(key == "tags" && method == "delete"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$pull : {key_topics: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }

                    if(key == "article_sections" && method == "put"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$push : {article_sections: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }else if(key == "tags" && method == "delete"){
                        data[key].forEach((obj)=>{
                            articleDb.updateOne({name: a_n}, {$pull : {article_sections: obj}}).then((data)=>{
                                if(data.length > 0 ){
                                    //do nothing coz if something is returned it would stop at this point
                                }else{
                                    res.send({
                                        Error: "no such article found"
                                    })
                                }
                            })
                        })
                    }
                }
                
            }else{
                res.send({
                    Error: "Nothing to update"
                })
            }
        }else{
            res.send({
                Error: token.message
            })
        }
    }else{
        res.send({
            Error: "Invalid token id was provided"
        })
    }
}


//adding articles
exports.createArticle = (req, res)=>{
    if(req.body){
        //data
        const tkn = req.headers.token_id;
        if(helpers.chk_str(tkn)){
            const token  = helpers.analyse_token(tkn);
            if(token.status){
                const data  = req.body;
                const article = articleDb({
                    author: data.author,
                    article_title: data.article_title,
                    article_sections: data.article_sections,
                    tags: data.tags,
                    key_topics: data.key_topics
                })
                article
                    .save(article)
                    .then((data)=>{
                        res.status(200).send(data)
                    })
                    .catch((e)=>{
                        res.status(500).send({
                            Error: e.message || "Unable to create this article"
                        })
                    })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }
        
    }else{
        res.send({
            Error: "Article data cannot be left empty"
        })
    }
}

//reading articles based on the name
exports.findArticle = (req, res)=>{
    if(req.query.article_name){
        const tkn = req.headers.token_id;
        if(helpers.chk_str(tkn)){
            const token  = helpers.analyse_token(tkn);
            if(token.status){
                articleDb.find({article_title: req.query.article_name})
            .then((data)=>{
                if(data){
                    res.send(data)
                }else{
                    res.status(404).send({
                        Error: "No article was found with the specifeied article name"
                    })
                }
            }).catch((e)=>{
                res.status(500).send({
                    Error: e.message || "Unable to find the article with the specified name"
                })
            })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "Invalid token id was provided"
            })
        }
    }else{
        res.send({
            Error: "No article name was specified"
        })
    }
}
//updating articles
exports.updateArticle = (req, res)=>{
    if(req.query.article_name){
        const tkn  = req.headers.token_id;
        if(helpers.chk_str(tkn)){
            const token = helpers.analyse_token(tkn);
            if(token.status){
                articleDb.findOneAndUpdate({article_title: req.query.article_name}, req.body, {returnDocument: true}).then((data)=>{
                    if(data){
                        res.status(200).send(data)
                    }else{ 
                        res.status(404).send({
                            Error: "No article found with the specied article name"
                        })
                    }
                })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "invalid token id was provided"
            })
        }
    }else{
        res.send({
            Error: "No article name has been speciied"
        })
    }
}

//deleting article image
exports.deleteArticleImages  = async (req, res)=>{
    const qry = req.query;
    const tkn = req.headers.token_id;

    if(qry.image_name && qry.sub_title && qry.article_title){
        if(helpers.chk_str(tkn)){
            const token  = helpers.analyse_token(tkn);
            if(token.status){
                //@TODO remeber to modify this when a new hosting is used
                const img_name  = qry.image_name.replace(`http://localhost:${process.env.PORT}/file/`, "")
                await helpers.deleteImage(img_name);
                articleDb.updateOne({article_title: qry.article_title, "article_sections.sub_title": qry.sub_title}, {$set : {"article_sections.$.section_image": ""}}).then((data)=>{
                    res.send(data)
                }).catch((e)=>{
                    res.send({
                        Error: e || "Unable to delete the article image"
                    })
                })
            }else{
                res.send({
                    Error: token.message
                })
            }
        }else{
            res.send({
                Error: "invalid token id was provided"
            })
        }
    }else{
        res.send({
            Error: "Unable to find the specied image"
        })
    }
}

//adding article image
exports.addArticleImages  = async  (req, res)=>{
    const tkn = re.headers.token_id;
    if(helpers.chk_str(tkn)){
        const token  = helpers.analyse_token(tkn);
        if(token.status){
            const qry = req.query;
            const imgUrl  = await  helpers.uploadImages(req, res);
            if(qry.sub_title && qry.article_title){
                articleDb.updateOne({article_title:qry.article_title, "article_sections.sub_title":qry.sub_title }, {$set : {"article_sections.$.section_image": imgUrl[0]}}).then((data)=>{
                    res.send(data)
                }).catch((e)=>{
                    res.send({
                        Error: e  || "Unable to add the article section's image"
                    })
                })
            }else{
                res.send({
                    Error: "Unable to find the specied article"
                })
            }
        }else{
            res.send({
                Error: token.message
            })
        }
    }else{
        res.send({
            Error: "Invalid token id provided"
        })
    }
}




//create token
exports.createToken = async (req, res)=>{
    console.log(req)
    if(typeof(req.body.email) == "string" && typeof(req.body.password) == "string"){
        const hashed_password = helpers.hash(req.body.password);
        userDb.find({email: req.body.email, hashed_password: hashed_password}).then((data)=>{
            if(data.length > 0){
                const token_id  = helpers.generateToken(20);
                const token = tokenDb({
                    username: data[0].username,
                    useremail: data[0].email,
                    token_id: token_id
                })
                token.save(token).then((data)=>{
                    res.send(data)
                }).catch((e)=>{
                    res.send({
                        Error: e || "Unable to create token"
                    })
                })
            }else{
                res.send({
                    Error: "No such user exists"
                })
            }
            
        }).catch((e)=>{
            res.send({
                Error: "Unable to find the specified user's data"
            })
        })
    }else{
        res.send({
            Error: "No Email was specified"
        })
    }
}


//read token  
exports.updateToken = (req, res)=>{
    const hdr = req.headers;
    if(typeof(hdr.token_id) == "string"){
        tokenDb.find({token_id: hdr.token_id }).then((data)=>{
            if(data.length > 0){
                if(data[0].expires_on > Date.now()){
                    var dt  = data[0].expires_on;
                    dt.setHours(dt.getHours() + 1);
                    tokenDb.findOneAndUpdate({token_id: hdr.token_id, useremail: data[0].useremail},{expires_on: dt}, { returnOriginal: false }).then((data)=>{
                        res.send(data)
                    })
                }else{
                    res.send({
                        Error: "This token has already expired"
                    })
                }
            }else{
                res.send({
                    Error: "Token Id does not exist"
                })
            }
        })
    }
}

//delete token
exports.deleteToken = (req, res)=>{
    const hdr  = req.headers;
    if(typeof(hdr.token_id)== "string" && hdr.token_id.length > 0){
        tokenDb.deleteOne({token_id: hdr.token_id}).then((data)=>{
            res.send({
                message: "Token was successfully deleted"
            })
        }).catch((e)=>{
            res.send({
                Error: e || "An error occured while trying to delete this token"
            })
        })
    }else{
        res.send({
            Error: "The specified token is not formated properyly"
        })
    }
}

