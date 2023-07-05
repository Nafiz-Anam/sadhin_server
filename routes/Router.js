const router = require("express").Router();
const UserRouter = require("./UserRoute/UserRouter");


router.use("/user", UserRouter);

module.exports = router;
