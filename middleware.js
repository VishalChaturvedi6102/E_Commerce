const Product = require('./models/product');
const { productSchema, reviewSchema } = require('./schemas');


module.exports.isLoggedIn = (req, res, next)=> {

    if(req.xhr && !req.isAuthenticated()){
        return res.status(401).json({msg:'You need to login first'});
    }

    if(!req.isAuthenticated()){
        req.flash('error', 'You need to login first!')
        return res.redirect('/login');
    }

    next();
}


module.exports.validateProduct = (req, res, next) => {
    const { name, img, price, desc } = req.body;
    const { error } = productSchema.validate({ name, img, price, desc });

    if (error) {
        const msg = error.details.map((err) => err.message).join(',');
        return res.render('error', { err: msg });
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { rating, comment } = req.body;
    const { error } = reviewSchema.validate({ rating, comment });

    if (error) {
        const msg = error.details.map((err) => err.message).join(',');
        return res.render('error', { err: msg });
    }
    next();
}


module.exports.isSeller = (req, res, next) => {
    // console.log(req.user);

    if(!(req.user.role && req.user.role === 'seller')){
        req.flash('error', 'You dont have permission to do that');
        return res.redirect('/products');
    }

    next();

}

module.exports.isProductAuthor = async (req, res, next) => {
    const {id} = req.params;
    const product = await Product.findById(id);

    if (!product.author.equals(req.user._id)) {
        req.flash('error', 'You dont have permissions to do that');
        return res.redirect(`/products/${id}`);
    }
    next();

}

