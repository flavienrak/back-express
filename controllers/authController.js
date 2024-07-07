const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const { isEmpty } = require("../lib/allFunctions");
const { isEmail } = require("validator");

const key = process.env.JWT_SECRET;

module.exports.signIn = async (req, res) => {
  try {
    let user = null;
    const body = req.body;

    if (!isEmail(body?.email)) {
      return res.json({ emailError: true });
    } else if (isEmpty(body?.password) || body?.password?.trim().length < 6) {
      return res.json({ passwordError: true });
    }

    user = await UserModel.findOne({ email: body.email });
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    const incorrectPassword = await bcrypt.compare(
      body.password,
      user.password
    );

    if (!incorrectPassword) {
      return res.json({ incorrectPassword: true });
    }

    const infos = {
      id: user._id,
      authToken: true,
    };

    const authToken = await jwt.sign({ infos }, key, {
      expiresIn: "3d",
    });

    const { password, ...userWithoutPassword } = user._doc;

    return res.status(200).json({ user: userWithoutPassword, authToken });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.signUp = async (req, res) => {
  try {
    let user = null;
    const body = req.body;

    if (isEmpty(body?.name) || body?.name?.trim().length < 3) {
      return res.json({ nameError: true });
    } else if (!isEmail(body?.email)) {
      return res.json({ emailError: true });
    } else if (isEmpty(body?.password) || body?.password?.trim().length < 6) {
      return res.json({ passwordError: true });
    }

    user = await UserModel.findOne({ email: body.email });
    if (!isEmpty(user)) {
      return res.json({ userAlreadyExist: true });
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(body.password, salt);

    user = await UserModel.create({
      name: body.name,
      email: body.email,
      password,
    });

    return res.status(200).json({ user: user._id });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
