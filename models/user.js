const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
  name: { type: String },
  email: {type: String, required: true , index: {unique: true}},
  password: {type: String, required: true},
  ratingArr: { type: Array },
  rating: {type: Number},
  completeGrants: { type: Array },
  completeWishes: { type: Array }
});

const User = mongoose.model("User", userSchema);

// User.prototype.validPassword = function(password) {
//   return bcrypt.compareSync(password, this.password);
// };
// Hooks are automatic methods that run during various phases of the User Model lifecycle
// In this case, before a User is created, we will automatically hash their password
// User.hook("beforeCreate", function(user) {
//   user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
// });

module.exports = User;



