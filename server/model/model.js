const mongoose = require('mongoose');

const blueprints = {}

var userSchema  = new mongoose.Schema({
    email:{
        required: true,
        type: String,
        unique: true
    },
    username:{
        type: String,
        required: true,
        unique: true
    },
    gender:{
        type: String,
        required: true
    },
    age:{
        type: Number
    },
    hashed_password:{
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "customer"
    },
    profile_picture: {
        type:String
    },
    orders: [{
        created_on: {
            type: Date,
            default: Date.now
        },
        order_status: {
            type: String,
            default: "incomplete"
        },
        items_ordered: [String],
        total_price: {
            type: Number,
            default: 0
        },
        order_summary:String,
        payment_status: {
            type: String,
            default: "pending"
        }
    }]
})

var productSchema = new mongoose.Schema({
    Images: [String],
    name: {type: String, required: true, unique: true},
    seller: String,
    brand: String,
    price: Number,
    description: String,
    highlights: [String],
    composition: [String],
    wearing: [String],
    designerStyleId: String,
    category: String,
    sub_category: String,
    gender: String,
    sizes: [{
        size: String,
        in_stock: Number
    }],
    designer: String,
    color: [String],
    tags: [String],
    targetAge: new mongoose.Schema({
        kid: {type: Boolean, default: false},
        teen: {type: Boolean, default: false},
        twenties: {type: Boolean, default: false},
        thirties: {type: Boolean, default: false},
        forties: {type: Boolean, default: false},
        fifties: {type: Boolean, default: false},
        above_fifties: {type: Boolean, default: false},
    })
});

//article schema
const articleSchema = new mongoose.Schema({
    article_title: {
        type: String,
        required: true,
        unique: true
    },
    author: String,
    article_sections: [{
        sub_title: {
            type: String,
            unique: true
        },
        section_content: String,
        section_image: {
            type:String
        }
    }],
    tags: [String],
    key_topics: [String], 
    created_on: {
        type: Date,
        default: Date.now
    }
})

const tokenSchema = new mongoose.Schema({
    created_on: {
        type: Date,
        default: Date.now
    },
    useremail: String,
    username: String,
    token_id: String,
    expires_on:{
        type: Date,
        default: Date.now() + 1000*60*60
    }
})

blueprints.userDb = mongoose.model("userDb", userSchema);
blueprints.productDb = mongoose.model("productDb", productSchema);
blueprints.articleDb  = mongoose.model("articleDb", articleSchema);
blueprints.tokenDb = mongoose.model("tokenDb", tokenSchema)
module.exports = blueprints;