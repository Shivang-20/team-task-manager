const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    }
  },
  { timestamps: true }
);

// hash password before saving if it was changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const rounds = 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// check if a plain-text password matches the stored hash
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
