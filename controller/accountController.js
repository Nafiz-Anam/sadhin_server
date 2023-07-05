require("dotenv").config();
const UserModel = require("../model/userModel");
const AccountModel = require("../model/accountModel");
const accessToken = require("../utilities/tokenmanager/token");
const enc_dec = require("../utilities/decryptor/decryptor");
const moment = require("moment");
const { get_user_id_by_email } = require("../utilities/helper/general_helper");
const helpers = require("../utilities/helper/general_helper");

var AccountController = {
    getAllUsers: async (req, res) => {
        try {
            let limit = {
                perpage: 10,
                start: 0,
            };
            if (req.bodyString("perpage") && req.bodyString("page")) {
                perpage = parseInt(req.bodyString("perpage"));
                start = parseInt(req.bodyString("page"));
                limit.perpage = perpage;
                limit.start = (start - 1) * perpage;
            }
            let date = {};
            if (req.bodyString("from_date")) {
                date.from_date = req.bodyString("from_date");
            }
            if (req.bodyString("to_date")) {
                date.to_date = req.bodyString("to_date");
            }

            const totalCount = await UserModel.get_count(date);
            console.log(totalCount);

            UserModel.select_list(date, limit)
                .then(async (result) => {
                    let response = [];
                    for (val of result) {
                        let f_name = val?.full_name.split(" ")[0];
                        let l_name = val?.full_name.split(" ")[1];
                        temp = {
                            id: val?.id ? enc_dec.encrypt(val.id) : "",
                            full_name: val?.full_name ? val.full_name : "",
                            f_name: f_name ? f_name : "",
                            l_name: l_name ? l_name : "",
                            email: val?.email ? val.email : "",
                            created_at: val.created_at
                                ? moment(val.created_at).format("YYYY-MM-DD")
                                : "",
                        };
                        response.push(temp);
                    }
                    res.status(200).json({
                        status: true,
                        data: response,
                        message: "Users fetched successfully!",
                        total: totalCount,
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        status: false,
                        data: {},
                        error: "Server side error!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                data: {},
                error: "Server side error!",
            });
        }
    },

    delete: async (req, res) => {
        let user_id = enc_dec.decrypt(req.bodyString("user_id"));
        try {
            await UserModel.delete({ id: user_id });
            res.status(200).json({
                status: true,
                message: "User deleted successfully!",
            });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },

    forgot_password: async (req, res) => {
        try {
            let newPass = req.bodyString("new_password");
            let hashPassword = await enc_dec.encrypt(newPass);
            let insData = {
                password: hashPassword,
            };
            await UserModel.updateDetails(
                { email: req.bodyString("email") },
                insData
            );
            res.status(200).json({
                status: true,
                message: "Password changed successfully!",
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: "Server side error!",
            });
        }
    },

    add_money: async (req, res) => {
        let user_id = req.user.id;
        try {
            let data = {
                user_id: user_id,
                amount: req.bodyString("amount"),
                method: req.bodyString("method"),
                account_id: enc_dec.decrypt(req.bodyString("account_id")),
                transaction_id: req.bodyString("transaction_id"),
                receipt_img: req.all_files.receipt_img,
            };
            await AccountModel.add(data)
                .then((result) => {
                    res.status(200).json({
                        status: true,
                        message: "Add money request sent successfully!",
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        status: false,
                        message: "Unable to send request. Try again!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Server side error! Try again.",
            });
        }
    },

    send_money: async (req, res) => {
        let user_id = req.user.id;
        try {
            let mobile_no = req.bodyString("mobile_no");
            const lastTen = mobile_no.substr(-10);
            let user = await helpers.get_data_list("id", "users", {
                mobile_no: lastTen,
                deleted: 0,
            });
            console.log(user);

            let data = {
                user_id: user_id,
                sent_user_id: user[0]?.id,
                mobile_no: req.bodyString("mobile_no"),
                amount: req.bodyString("amount"),
                commission: req.bodyString("commission"),
            };
            await AccountModel.add_send_money_req(data)
                .then((result) => {
                    res.status(200).json({
                        status: true,
                        message: "Send money request sent successfully!",
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        status: false,
                        message: "Unable to send request. Try again!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Server side error! Try again.",
            });
        }
    },

    mobile_recharge: async (req, res) => {
        let user_id = req.user.id;
        try {
            let data = {
                user_id: user_id,
                operator_type: req.bodyString("operator_type"),
                operator: req.bodyString("operator"),
                mobile_no: req.bodyString("mobile_no"),
                amount: req.bodyString("amount"),
            };
            await AccountModel.add_mobile_recharge_req(data)
                .then((result) => {
                    res.status(200).json({
                        status: true,
                        message: "Mobile recharge request sent successfully!",
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        status: false,
                        message: "Unable to send request. Try again!",
                    });
                });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Server side error! Try again.",
            });
        }
    },

    transactions: async (req, res) => {
        let user_id = req.user.id;
        try {
            let add_money_data = await helpers.get_data_list("*", "add_money", {
                user_id: user_id,
                status: 0,
            });
            console.log(add_money_data);
            let add_money_history = [];
            for (let val of add_money_data) {
                let temp = {
                    id: val?.id ? enc_dec.encrypt(val?.id) : "",
                    user_id: val?.user_id ? enc_dec.encrypt(val?.user_id) : "",
                    amount: val?.amount ? val?.amount : "",
                    method: val?.method ? val?.method : "",
                    account_id: val?.account_id
                        ? enc_dec.encrypt(val?.account_id)
                        : "",
                    transaction_id: val?.transaction_id
                        ? val?.transaction_id
                        : "",
                    receipt_img: val?.receipt_img ? val?.receipt_img : "",
                    created_at: val?.created_at ? val?.created_at : "",
                };
                add_money_history.push(temp);
            }

            let send_money_data = await helpers.get_data_list(
                "*",
                "send_money",
                {
                    user_id: user_id,
                    status: 0,
                }
            );
            console.log(send_money_data);
            let send_money_history = [];
            for (let val of add_money_data) {
                let temp = {
                    id: val?.id ? enc_dec.encrypt(val?.id) : "",
                    user_id: val?.user_id ? enc_dec.encrypt(val?.user_id) : "",
                    amount: val?.amount ? val?.amount : "",
                    sent_user_id: val?.sent_user_id
                        ? enc_dec.encrypt(val?.sent_user_id)
                        : "",
                    commission: val?.commission ? val?.commission : 0,
                    created_at: val?.created_at ? val?.created_at : "",
                };
                send_money_history.push(temp);
            }

            let mobile_recharge_data = await helpers.get_data_list(
                "*",
                "mobile_recharge",
                {
                    user_id: user_id,
                    status: 0,
                }
            );
            console.log(mobile_recharge_data);
            let mobile_recharge_history = [];
            for (let val of add_money_data) {
                let temp = {
                    id: val?.id ? enc_dec.encrypt(val?.id) : "",
                    user_id: val?.user_id ? enc_dec.encrypt(val?.user_id) : "",
                    amount: val?.amount ? val?.amount : "",
                    mobile_no: val?.mobile_no ? val?.mobile_no : "",
                    operator_type: val?.operator_type ? val?.operator_type : "",
                    operator: val?.operator ? val?.operator : "",
                    created_at: val?.created_at ? val?.created_at : "",
                };
                mobile_recharge_history.push(temp);
            }

            let send_res = {
                add_money_history,
                send_money_history,
                mobile_recharge_history,
            };
            res.status(200).json({
                status: true,
                data: send_res,
                message: "Transactions fetched successfully!",
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: false,
                message: "Server side error! Try again.",
            });
        }
    },
};

module.exports = AccountController;
