var express = require('express');
var router = express.Router();
const userModel = require('./users')
const postModel = require('./post')
const localStrategy = require("passport-local");
const passport = require('passport');                               // for user login both line this and below
const upload = require('./multer');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

//login page
router.get('/login', function(req, res, next) {
  res.render('login',);
});

//register page
router.get('/register', function(req, res, next) {
  res.render('register',);
});

//feed page

router.get('/feed',isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
   const  posts = await postModel.find()
  .populate("user")
  res.render("feed",{user,posts,});
 
});

//profile

router.get('/profile',isLoggedIn, async function(req, res) {
  const user =
   await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("profile",{user,});
 
});

//showposts

router.get('/show/posts',isLoggedIn, async function(req, res) {
  const user =
   await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("show",{user,});
 
});
//post:id

router.get('/show/post/:cardid', isLoggedIn, async function(req, res) {     
  try {
    const post = await postModel.findById(req.params.cardid).populate("user");
    if (!post) {
      return res.status(404).send('Post not found');
    }
    res.render("cardid", { post });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Handle the submission of the edit form
router.post('/update-post/:id', isLoggedIn, async function(req, res) {
  try {
    const { title, description, image } = req.body;
    const updatedPost = await postModel.findByIdAndUpdate(req.params.id, {
      title,
      description,
      image
    }, { new: true });

    if (!updatedPost) {
      return res.status(404).send('Post not found');
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).send('Error updating post');
  }
});

// Get saved posts for the logged-in user
router.get('/saved-posts', isLoggedIn, async function(req, res) {
  try {
    const userId = req.user._id;
    const savedPosts = await postModel.find({ savedBy: userId });
    res.render('saved-posts', { savedPosts });
  } catch (error) {
    res.status(500).send('Error fetching saved posts');
  }
});

// Save a post for the logged-in user
router.post('/save-post/:id', isLoggedIn, async function(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Find the post by ID and update the savedBy field
    const post = await postModel.findById(postId);
    
    if (!post.savedBy.includes(userId)) {
      post.savedBy.push(userId);  // Add the userId to the savedBy array
      await post.save();
    }

    res.json({ success: true, message: 'Post saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving post' });
  }
});



// Route to delete a saved post
router.post('/delete-saved/:id', isLoggedIn, async function(req, res) {
  try {
    const userId = req.user._id;
    await userModel.findByIdAndUpdate(userId, { $pull: { savedPosts: req.params.id } });
    await postModel.findByIdAndUpdate(req.params.id, { $pull: { savedBy: userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
});



// Delete Post Route
router.get('/delete/:id', isLoggedIn, async function(req, res) {
  try {
    await postModel.findByIdAndDelete(req.params.id);
    res.redirect('/profile'); // Redirect to profile page after deletion
  } catch (error) {
    res.status(500).send('Error deleting post');
  }
});


//add page

router.get('/add',isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add",{user,});
 
});

//createpost

router.post('/createpost',isLoggedIn,upload.single("postimage"), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
 
});

//upload file

router.post('/fileupload',isLoggedIn,upload.single('image'), async function(req, res,next) {
  const user = await userModel.findOne({username: req.session.passport.user});
   user.dp =req.file.filename;
    await user.save();
   res.redirect("/profile");
  });

//register
router.post("/register",function(req,res){
  const { username, email,fullname } = req.body;
  const userData = new userModel({ username, email, fullname });
  
  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
})
//login
router.post("/login", passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login"
}),function(req,res){
  
})
//logout
router.get("/logout",function(req,res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})
 
function isLoggedIn(req,res,next){
 if(req.isAuthenticated()) return next();
 res.redirect("/login");
}
module.exports = router;
