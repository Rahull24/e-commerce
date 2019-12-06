const express = require('express');
const mongoose = require('../database/db');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {User} = require('../models/user');
const {Product} = require('../models/product');
const {Category} = require('../models/category');
const {authenticate} = require('../middleware/authenticate');

var app = express();
app.use(bodyParser.json());

// API to add category for Admin (You need to add categories first)
app.post('/admin/add-category', (req, res) => {
    var body = _.pick(req.body, ['name', 'type', 'model']);
    
    var category = new Category(body);

    category.save().then((category_) => {
        res.send({category_});
      }).catch((err) => {
          res.status(400).send(err);
      });
  })

  // API to add product for Admin 
  app.post('/admin/add-product', async(req, res) => {    
    var body = _.pick(req.body, ['name','category','description', 'price', 'make']);

    let category_id;

    let data = await Category.findOne({'name' : body.category});
    category_id = data._id;

    body.category = category_id;

    var product = new Product(body);

    product.save().then((product_) => {
        res.send(product_);
      }).catch((err) => {
          res.status(400).send(err);
      });

  })


// API for user registration
//Email and password required for registration
app.post('/users/register', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    var newUser = new User({ 
        'email' : email,
        'password' : password
    });
  
    newUser.save().then(() => {
      return newUser.generateAuthToken();
    }).then((token) => {
      res.header('x-auth', token).send(newUser);
    }).catch((err) => {
        res.status(400).send(err);
    });
  
  });


  // API for user login
  // If user logins with the same email id and password that he used for the registration, 
  //only authentication will complete and user get token in the header with 'x-auth' key
  app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
  
    User.findByCredentials(body.email, body.password).then(user => {
      return user.generateAuthToken().then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
      res.sendStatus(400).send();
    });
  });
  });


  // API to get all list of products
  // will only work if token has been passed in the header with 'x-auth' key,
  // and same goes for all route with authenticate middleware
  app.get('/product/list',authenticate, (req, res) => {

    Product.find({}).then((list) => {
        res.send({list});
    }).catch((err) => {
        res.status(400).send(err);
    });
  })


  // API to get list of all categories 
  app.get('/category/list',authenticate, (req, res) => {

    Category.find({}).then((list) => {
        res.send({list});
    }).catch((err) => {
        res.status(400).send(err);
    });
  })


  // API to get list all products of a specific category
  app.get('/product/:category_name',authenticate, async (req, res) => {
    let category_name = req.params.category_name;
    let records;
    let category_id;

    try {
        record = await Category.findOne({'name' : category_name});
        category_id = record._id;
    } catch (error) {
        return res.status(400).send(error);
    }

    try {
        let records = await Product.find({'category' : category_id});
        res.send(records)
   } catch (error) {
       return res.status(400).send(error);
   }
  })


  // API to add product to cart
  app.get('/cart/add/:product', authenticate, async(req, res) => {
    let product_name = req.params.product;
    let product_id;
    try {
        record = await Product.findOne({'name' : product_name});
        product_id = record._id;
    } catch (error) {
        return res.status(400).send(error);
    }

    try {
        let record = await User.update({_id : req.user.id},{$push : {'cart' : product_id}}, {new: true});
        res.send(record)
   } catch (error) {
       return res.status(400).send(error);
   }
})


// API to get cart for the current user
app.get('/cart/my-cart', authenticate, async(req, res) => {
    let cart_ids = [];
    try {
        let record = await User.findOne({'_id' : req.user.id});
        cart_ids = record['cart'];
    } catch (error) {
        return res.status(400).send(error);
    }

    try {
        let records = await Product.find({'_id' : {$in : cart_ids}}, {name : 1, _id : 0});
        res.send(records)
    } catch (error) {
        return res.status(400).send(error);
    }
})

//API to get cart for a specific user
app.post('/cart/user', authenticate, async(req, res) => {
    let email = req.body.email;
    let cart_ids = [];
    try {
        let record = await User.findOne({'email' : email});
        cart_ids = record.cart;
    } catch (error) {
        return res.status(400).send(error);
    }

    try {
        let records = await Product.find({'_id' : {$in : cart_ids}}, {name : 1, _id : 0});
        res.send(records)
    } catch (error) {
        return res.status(400).send(error);
    }
})

app.listen(3000, () => {
    console.log('listening');
})