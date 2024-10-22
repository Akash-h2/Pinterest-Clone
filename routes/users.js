require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

// Connect to MongoDB Atlas

const mongoAtlasUri = process.env.MONGODB_URI;
mongoose.connect(mongoAtlasUri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

// Define the schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  dp: {
    type: String, // URL for the display picture
    default: 'default_dp.png' // You can provide a default image or path
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  }
});

userSchema.plugin(plm);

// Create the model
module.exports = mongoose.model('User', userSchema);
