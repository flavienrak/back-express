const { isEmpty } = require("../lib/allFunctions");
const { isEmail } = require("validator");

const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");

module.exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};

module.exports.signUp = async (req, res) => {
  try {
    let user = null;
    const body = req.body;

    if (isEmpty(body?.name) || body?.name?.trim().length < 3) {
      return res.status(400).json({ nameError: true });
    } else if (isEmpty(body?.username) || body?.username?.trim().length < 3) {
      return res.status(400).json({ usernameError: true });
    } else if (!isEmail(body?.email)) {
      return res.status(400).json({ emailError: true });
    } else if (isEmpty(body?.password) || body?.password?.trim().length < 6) {
      return res.status(400).json({ passwordError: true });
    }

    user = await UserModel.findOne({ email: body.email });
    if (!isEmpty(user)) {
      return res.status(400).json({ userAlreadyExist: true });
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(body.password, salt);

    user = await UserModel.create({
      name: body.name,
      username: body.username,
      email: body.email,
      password,
    });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
