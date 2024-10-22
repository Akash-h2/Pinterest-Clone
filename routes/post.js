const mongoose = require('mongoose');

// Define the schema
const postSchema =  mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
 title: String,
 description: String,
 image: String,
 comments: [String],
 savedBy: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
 });

// Create the model
module.exports = mongoose.model('Post', postSchema);


