const dotenv = require("dotenv");
dotenv.config();

const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const { isEmpty } = require("../lib/allFunctions");

const key = process.env.JWT_SECRET;

module.exports.verifyToken = async (req, res) => {
  try {
    const params = req.params;

    if (isEmpty(params?.token)) {
      return res.json({ tokenRequired: true });
    }

    const verify = await jwt.verify(params.token, key);

    if (isEmpty(verify?.infos)) {
      return res.json({ invalidToken: true });
    }

    const user = await UserModel.findById(verify.infos.id);
    if (isEmpty(user)) {
      return res.json({ userNotFound: true });
    }

    return res.status(200).json({ verify });
  } catch (error) {
    return res.status(500).json({ error: `${error.message}` });
  }
};
