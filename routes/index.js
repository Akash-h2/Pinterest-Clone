var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const localStrategy = require("passport-local");
const passport = require('passport');
const upload = require('./multer');
const cloudinary = require('cloudinary').v2; // Import Cloudinary

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

// Login page
router.get('/login', function(req, res, next) {
  res.render('login');
});

// Register page
router.get('/register', function(req, res, next) {
  res.render('register');
});

// Feed page
router.get('/feed', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");
  res.render("feed", { user, posts });
});

// Profile
router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("profile", { user });
});

// Show posts
router.get('/show/posts', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("show", { user });
});

// Post by ID
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
router.post('/update-post/:id', isLoggedIn, upload.single("postimage"), async function(req, res) {
  try {
    const { title, description } = req.body;
    const updateData = { title, description };

    // If an image is uploaded, upload it to Cloudinary and add the URL to updateData
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "your_folder_name", // Optional: specify a folder in Cloudinary
      });
      updateData.image = result.secure_url; // Update the image URL with the Cloudinary link
    }

    const updatedPost = await postModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedPost) {
      return res.status(404).send('Post not found');
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating post:", error);
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
      post.savedBy.push(userId); // Add the userId to the savedBy array
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


// Add page
router.get('/add', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("add", { user });
});

// Create Post Route
router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "your_folder_name", // Optional: specify a folder in Cloudinary
    });

    // Create the post with the Cloudinary URL
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: result.secure_url, // Store the secure URL from Cloudinary
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("An error occurred while creating the post.");
  }
});

// File upload route (for user profile picture)
router.post('/fileupload', isLoggedIn, upload.single('image'), async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Save the Cloudinary URL instead of just the filename
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "your_folder_name", // Optional: specify a folder in Cloudinary
    });

    user.dp = result.secure_url; // This contains the Cloudinary URL
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while uploading the image.');
  }
});

// Register
router.post("/register", function(req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password)
    .then(function() {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/profile");
      });
    });
});

// Login
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login"
}), function(req, res) {});

// Logout
router.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
