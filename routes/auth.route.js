const router = require('express').Router();
const User = require('../models/user.model')
const {body,validationResult}=require('express-validator');
const passport = require('passport')



router.get('/login',ensureNotAuthenticated,async(req,res,next)=>{


    res.render('login')
})
router.get('/register',ensureNotAuthenticated,async(req,res,next)=>{
    
    res.render('register')
})
router.post('/login',ensureNotAuthenticated,passport.authenticate('local',{
   successRedirect:"/",
   failureRedirect:"/auth/login",
   failureFlash:true
}))
router.post('/register',ensureNotAuthenticated,[
    body('email').trim().isEmail().withMessage('Email must be a valid email').normalizeEmail().toLowerCase().custom(value => {
      if (!value.endsWith('@nitkkr.ac.in')) {
          throw new Error('Email must end with @nitkkr.ac.in');
      }
      return true;
  }),
    body('password').trim().isLength(8).withMessage('Password should be of minimum length 8 '),
    body('password2').custom((value,{req})=>{
        if (value != req.body.password){
            throw new Error('Passwords do not match')
        }
        return true;
    }),
    body('hostelNumber')
    .isInt({ min: 1, max: 5 })  // Ensures hostel number is between 1 and 5
    .withMessage('Hostel number must be between 1 and 5')
],async (req,res,next)=>{
    try {
          const errors = validationResult(req);
          if(!errors.isEmpty()){
             errors.array().forEach(error=>{
                req.flash('error',error.msg);
                
             })

             if (errors.array().some(err => err.msg === 'Email must be a valid email')||errors.array().some(err => err.msg === 'Email must end with @nitkkr.ac.in')) {
            res.render('register',{
                messages:req.flash()
            }); 
            return;   
           }

             res.render('register',{
                email:req.body.email,
                messages:req.flash()
            }); 

             return;
          }


          const {email,password}=req.body;
          const doesExist = await User.findOne({email})
           if(doesExist){
            req.flash ('error','Email already exist')
            res.redirect('/auth/register');
            return; 
           }

        const user = new User(req.body);
        await user.save();
        req.flash('success','Sucessfully registered! Please Log in...')
        res.redirect('/auth/login');
    } catch (error) {
        next(error);
    }
})
router.get('/logout',ensureAuthenticated, (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);  // Pass the error to Express error handling
        }
        res.redirect('/');  // Redirect to home page after logout
    });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

function ensureNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('back');
  } else {
    next();
  }
}
module.exports = router;