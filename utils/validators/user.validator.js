import Joi from "joi";

export const profileValidation = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  password: Joi.string().min(6).max(50).optional(),
  dob: Joi.date().optional(),
  age: Joi.number().min(1).max(120).optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  email: Joi.string().email().lowercase().optional(),
  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional(),
  adhaar: Joi.string()
    .pattern(/^\d{12}$/)
    .optional(),
  pan: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional(),
  address1: Joi.string().optional(),
  address2: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  pincode: Joi.number().integer().min(100000).max(999999).optional(),
  profileImage: Joi.string().uri().optional(),
  userToken: Joi.string().optional(),
});
