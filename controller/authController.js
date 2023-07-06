require("dotenv").config();
const UserModel = require("../model/userModel");
const CustomerModel = require("../model/customers");
const accessToken = require("../utilities/tokenmanager/token");
const enc_dec = require("../utilities/decryptor/decryptor");
const helpers = require("../utilities/helper/general_helper");
const otpSender = require("../utilities/sms/sentotp");
const SequenceUUID = require("sequential-uuid");
const jwt = require("jsonwebtoken");
const moment = require("moment");

var AuthController = {
    send_otp: async (req, res) => {
        const { mobile_code, mobile_no } = req.body;
        try {
            let otp = await helpers.generateOtp(6);
            const title = "Sadhin Pay";
            const mobile_number = `${mobile_code}${mobile_no}`;

            const welcomeMessage =
                "Welcome to " +
                title +
                "! Your verification code is: " +
                otp +
                ". Do not share it with anyone.";

            console.log("mobile_number", mobile_number);
            console.log("welcomeMessage", welcomeMessage);

            await otpSender(mobile_number, welcomeMessage)
                .then(async (data) => {
                    console.log("sms res =>", data);
                    const uuid = new SequenceUUID({
                        valid: true,
                        dashes: true,
                        unsafeBuffer: true,
                    });

                    let token = uuid.generate();
                    let ins_data = {
                        mobile_code: mobile_code,
                        mobile_no: mobile_no,
                        otp: otp,
                        token: token,
                        sms_id: data,
                    };
                    CustomerModel.addMobileOTP(ins_data)
                        .then(async (result) => {
                            res.status(200).json({
                                status: true,
                                token: token,
                                message: "Otp sent on your mobile number",
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(500).json({
                                status: false,
                                message: error.message,
                            });
                        });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: error.message,
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: error.message,
            });
        }
    },

    resend_otp: async (req, res) => {
        const { mobile_code, mobile_no } = req.body;
        try {
            let otp = await helpers.generateOtp(6);
            const title = "Sadhin Pay";
            const mobile_number = `${mobile_code}${mobile_no}`;

            const welcomeMessage =
                "Welcome to " +
                title +
                "! Your verification code is: " +
                otp +
                ". Do not share it with anyone.";

            console.log("mobile_number", mobile_number);
            console.log("welcomeMessage", welcomeMessage);

            await otpSender(mobile_number, welcomeMessage)
                .then(async (data) => {
                    console.log("sms res =>", data);
                    // delete old OTP entry from table
                    let condition = {
                        mobile_code: mobile_code,
                        mobile_no: mobile_no,
                    };
                    await helpers.delete_common_entry(condition, "mobile_otp");

                    // adding new otp entry
                    const uuid = new SequenceUUID({
                        valid: true,
                        dashes: true,
                        unsafeBuffer: true,
                    });
                    let token = uuid.generate();
                    let ins_data = {
                        mobile_code: mobile_code,
                        mobile_no: mobile_no,
                        otp: otp,
                        token: token,
                        sms_id: data,
                    };
                    CustomerModel.addMobileOTP(ins_data)
                        .then(async (result) => {
                            res.status(200).json({
                                status: true,
                                token: token,
                                message: "Otp sent on your mobile number",
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(500).json({
                                status: false,
                                message: error.message,
                            });
                        });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: error.message,
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: error.message,
            });
        }
    },

    otp_verify: async (req, res) => {
        try {
            let selection = "id,mobile_code,mobile_no,sms_id";
            let condition = {
                otp: req.bodyString("otp"),
                token: req.bodyString("otp_token"),
            };
            CustomerModel.selectMobileOtpData(selection, condition)
                .then(async (result) => {
                    if (result) {
                        let userData = {
                            type: "user",
                            mobile_code: result.mobile_code,
                            mobile_no: result.mobile_no,
                        };
                        await UserModel.add(userData)
                            .then(async (result) => {
                                let profile_data = {
                                    user_id: result.insert_id,
                                    mobile_no: userData.mobile_no,
                                };
                                // user details
                                await UserModel.addProfile(profile_data);

                                // jwt token
                                let payload = {
                                    id: result.insert_id,
                                    type: "user",
                                };
                                const token = accessToken(payload);

                                // delete OTP entry from table
                                await helpers.delete_common_entry(
                                    condition,
                                    "mobile_otp"
                                );

                                res.status(200).json({
                                    status: true,
                                    token: token,
                                    message:
                                        "OTP verified. User created successfully!",
                                });
                            })
                            .catch((err) => {
                                console.log(err);
                                res.status(500).json({
                                    status: false,
                                    message: "Internal server error!",
                                });
                            });
                    } else {
                        res.status(500).json({
                            status: false,
                            message: "Wrong OTP, Try again!",
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: "Internal server error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Internal server error!",
            });
        }
    },

    set_pin: async (req, res) => {
        try {
            let token = req.bodyString("token");
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    if (err.message === "jwt expired") {
                        res.status(500).json({
                            status: false,
                            error: "Token Expired Please Login.",
                        });
                    } else {
                        res.status(500).json({
                            status: false,
                            error: "Unable To Validate Token",
                        });
                    }
                } else if (user.type !== "user") {
                    res.status(500).json({
                        status: false,
                        error: "Forbidden access to this route.",
                    });
                } else {
                    req.user = user;
                }
            });

            let condition = {
                id: req.user.id,
            };
            UserModel.select(condition)
                .then(async (result) => {
                    if (result) {
                        userData = {
                            pin: req.bodyString("pin"),
                        };
                        await UserModel.updateDetails(
                            { id: req.user.id },
                            userData
                        )
                            .then(async (result) => {
                                // jwt token
                                let payload = {
                                    id: req.user.id,
                                    type: "user",
                                };
                                const token = accessToken(payload);

                                res.status(200).json({
                                    status: true,
                                    token: token,
                                    message: "Pin added successfully!",
                                });
                            })
                            .catch((err) => {
                                console.log(err);
                                res.status(500).json({
                                    status: false,
                                    message: "Internal server error!",
                                });
                            });
                    } else {
                        res.status(500).json({
                            status: false,
                            message: "User not found!",
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: "Internal server error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Internal server error!",
            });
        }
    },

    change_pin: async (req, res) => {
        try {
            let condition = {
                id: req.user.id,
            };
            UserModel.select(condition)
                .then(async (result) => {
                    if (result) {
                        userData = {
                            pin: req.bodyString("new_pin"),
                        };
                        await UserModel.updateDetails(
                            { id: req.user.id },
                            userData
                        )
                            .then(async (result) => {
                                res.status(200).json({
                                    status: true,
                                    message: "Pin updated successfully!",
                                });
                            })
                            .catch((err) => {
                                console.log(err);
                                res.status(500).json({
                                    status: false,
                                    message: "Internal server error!",
                                });
                            });
                    } else {
                        res.status(500).json({
                            status: false,
                            message: "User not found!",
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: "Internal server error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Internal server error!",
            });
        }
    },

    update_profile: async (req, res) => {
        try {
            const currentDatetime = moment();
            let user_data = {
                full_name: req.bodyString("full_name"),
                user_name: req.bodyString("user_name"),
                mobile_no: req.bodyString("mobile_no"),
                gender: req.bodyString("gender"),
                birth_date: req.bodyString("birth_date"),
                nid_no: req.bodyString("nid_no"),
                profile_img: req.all_files?.profile_img,
                updated_at: currentDatetime.format("YYYY-MM-DD HH:mm:ss"),
            };
            console.log(user_data);

            UserModel.updateProfile({ user_id: req.user.id }, user_data)
                .then((result) => {
                    console.log(result);
                    res.status(200).json({
                        status: true,
                        message: "Profile updated successfully!",
                    });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: "Internal server error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Internal server error!",
            });
        }
    },

    profile_details: async (req, res) => {
        try {
            let user_id = req.user.id;
            UserModel.select_profile({ user_id: user_id })
                .then((result) => {
                    let profile_data;
                    for (let val of result) {
                        profile_data = {
                            id: val?.id ? enc_dec.encrypt(val?.id) : "",
                            user_id: val?.user_id
                                ? enc_dec.encrypt(val?.user_id)
                                : "",
                            profile_img: val?.profile_img
                                ? val?.profile_img
                                : "",
                            full_name: val?.full_name ? val?.full_name : "",
                            user_name: val?.user_name ? val?.user_name : "",
                            birth_date: val?.birth_date ? val?.birth_date : "",
                            gender: val?.gender ? val?.gender : "",
                            mobile_no: val?.mobile_no ? val?.mobile_no : "",
                            nid_no: val?.nid_no ? val?.nid_no : "",
                            created_at: val?.created_at ? val?.created_at : "",
                            updated_at: val?.updated_at ? val?.updated_at : "",
                        };
                    }
                    res.status(200).json({
                        status: true,
                        data: profile_data,
                        message: "Profile fetched successfully!",
                    });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        status: false,
                        message: "Internal server error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Internal server error!",
            });
        }
    },
};

module.exports = AuthController;
