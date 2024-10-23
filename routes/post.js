const mongoose = require('mongoose');

// Define the schema
const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Ensure a user is associated with the post
  },
  title: {
    type: String,
    required: true, // Title is required
    trim: true, // Remove whitespace from the start and end
  },
  description: {
    type: String,
    required: true, // Description is required
    trim: true, // Remove whitespace from the start and end
  },
  image: {
    type: String,
    required: true, // Image is required
  },
  comments: {
    type: [String],
    default: [], // Default to an empty array
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [], // Default to an empty array
  }],
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
});

// Create the model
module.exports = mongoose.model('Post', postSchema);
