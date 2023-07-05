const router = require("express").Router();
const authController = require("../../controller/authController");
const authValidator = require("../../utilities/validations/authValidation");
const checkUserToken = require("../../utilities/tokenmanager/checkUserToken");
const applyUploader = require("../../uploads/applyUploder");
const UserController = require("../../controller/userController");

router.post("/send_otp", authValidator.check_user, authController.send_otp);
router.post("/resend_otp", authValidator.check_user, authController.resend_otp);
router.post("/verify_otp", authValidator.otp_verify, authController.otp_verify);
router.post("/set_pin", authValidator.set_pin, authController.set_pin);
router.post("/profile/update", checkUserToken, applyUploader, authValidator.update_profile, authController.update_profile);
router.post("/profile/details", checkUserToken, authController.profile_details);

// router.post("/login", authValidator.login, authController.login);
// router.post("/review/add", checkUserToken, UserController.add_review);
// router.post("/review/list", checkUserToken, UserController.list_reviews);


module.exports = router;
