const Joi = require("joi");
const helpers = require("../helper/general_helper");

const accountValidation = {
    add_money: async (req, res, next) => {
        const schema = Joi.object({
            method: Joi.string().required().messages({
                "any.required": "Method is required",
                "string.empty": "Method cannot be empty",
            }),
            amount: Joi.string()
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    "any.required": "Amount is required",
                    "string.empty": "Amount cannot be empty",
                    "string.pattern.base": "Amount must be a valid number",
                }),
            account_id: Joi.string().required().messages({
                "any.required": "Account id is required",
                "string.empty": "Account id cannot be empty",
            }),
            transaction_id: Joi.string().optional().allow(""),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(503).json({
                    status: false,
                    error: result.error.message,
                });
            } else {
                next();
            }
        } catch (error) {
            res.status(503).json({
                status: false,
                error: "Server side error!",
            });
        }
    },

    send_money: async (req, res, next) => {
        const schema = Joi.object({
            mobile_no: Joi.string().required().min(11).messages({
                "any.required": "Mobile number is required",
                "string.min":
                    "Mobile number must be at least 11 characters long",
                "string.empty": "Mobile number cannot be empty",
            }),
            amount: Joi.string()
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    "any.required": "Amount is required",
                    "string.empty": "Amount cannot be empty",
                    "string.pattern.base": "Amount must be a valid number",
                }),
            commission: Joi.string()
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    "any.required": "Amount is required",
                    "string.empty": "Amount cannot be empty",
                    "string.pattern.base": "Amount must be a valid number",
                }),
            pin: Joi.string().required().length(4).pattern(/^\d+$/).messages({
                "any.required": "PIN is required",
                "string.base": "PIN must be a string",
                "string.empty": "PIN cannot be empty",
                "string.length": "PIN must be exactly 4 characters long",
                "string.pattern.base": "PIN must contain only digits",
            }),
        });
        try {
            const result = schema.validate(req.body);
            let mobile_no = req.bodyString("mobile_no");
            const lastTen = mobile_no.substr(-10);
            let user = await helpers.get_data_list("id", "users", {
                mobile_no: lastTen,
                deleted: 0,
            });
            console.log(user);
            let pin = await helpers.get_data_list("id", "users", {
                mobile_no: lastTen,
                pin: req.bodyString("pin"),
                deleted: 0,
            });
            console.log(pin);

            if (result.error) {
                res.status(503).json({
                    status: false,
                    error: result.error.message,
                });
            } else if (!user.length > 0) {
                res.status(503).json({
                    status: false,
                    error: "User not found!",
                });
            } else if (!pin.length > 0) {
                res.status(503).json({
                    status: false,
                    error: "Incorrect PIN number!",
                });
            } else {
                next();
            }
        } catch (error) {
            res.status(503).json({
                status: false,
                error: "Server side error!",
            });
        }
    },

    mobile_recharge: async (req, res, next) => {
        const schema = Joi.object({
            operator_type: Joi.string().required().messages({
                "any.required": "Operator type is required",
                "string.empty": "Operator type cannot be empty",
            }),
            operator: Joi.string().required().messages({
                "any.required": "Operator is required",
                "string.empty": "Operator cannot be empty",
            }),
            mobile_no: Joi.string().required().min(11).messages({
                "any.required": "Mobile number is required",
                "string.min":
                    "Mobile number must be at least 11 characters long",
                "string.empty": "Mobile number cannot be empty",
            }),
            amount: Joi.string()
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    "any.required": "Amount is required",
                    "string.empty": "Amount cannot be empty",
                    "string.pattern.base": "Amount must be a valid number",
                }),
            pin: Joi.string().required().length(4).pattern(/^\d+$/).messages({
                "any.required": "PIN is required",
                "string.base": "PIN must be a string",
                "string.empty": "PIN cannot be empty",
                "string.length": "PIN must be exactly 4 characters long",
                "string.pattern.base": "PIN must contain only digits",
            }),
        });
        try {
            const result = schema.validate(req.body);
            let mobile_no = req.bodyString("mobile_no");
            const lastTen = mobile_no.substr(-10);
            let pin = await helpers.get_data_list("id", "users", {
                mobile_no: lastTen,
                pin: req.bodyString("pin"),
                deleted: 0,
            });
            console.log(pin);

            if (result.error) {
                res.status(503).json({
                    status: false,
                    error: result.error.message,
                });
            } else if (!pin.length > 0) {
                res.status(503).json({
                    status: false,
                    error: "Incorrect PIN number!",
                });
            } else {
                next();
            }
        } catch (error) {
            res.status(503).json({
                status: false,
                error: "Server side error!",
            });
        }
    },

};

module.exports = accountValidation;
