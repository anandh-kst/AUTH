import Joi from "joi";

export const updateUserValidation = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  dateOfBirth: Joi.date().optional(),
  age: Joi.number().min(1).max(120).optional(),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  address: Joi.string().optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  bloodGroup: Joi.string().optional(),
  profileImage: Joi.string().optional(),
  password: Joi.string().min(6).optional()
});
