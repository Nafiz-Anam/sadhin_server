const router = require("express").Router();
const accountController = require("../../controller/accountController");
const accountValidation = require("../../utilities/validations/accountValidation");
const checkUserToken = require("../../utilities/tokenmanager/checkUserToken");
const receiptUpload = require("../../uploads/receiptUpload");

router.post(
    "/add_money",
    checkUserToken,
    receiptUpload,
    accountValidation.add_money,
    accountController.add_money
);

module.exports = router;
