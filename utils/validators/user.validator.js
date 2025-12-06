import Joi from "joi";

export const profileValidation = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .label("First name")
    .optional()
    .messages({
      "string.empty": "First name cannot be empty",
      "string.base": "First name must be text.",
      "string.min": "First name must be at least 2 characters.",
      "string.max": "First name cannot exceed 50 characters.",
    }),

  lastName: Joi.string().min(2).max(50).label("Last name").optional().messages({
    "string.empty": "Last name cannot be empty",
    "string.base": "Last name must be text.",
    "string.min": "Last name must be at least 2 characters.",
    "string.max": "Last name cannot exceed 50 characters.",
  }),

  password: Joi.string().min(6).max(50).label("Password").optional().messages({
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 6 characters.",
    "string.max": "Password cannot exceed 50 characters.",
  }),

  dob: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .label("Date of birth")
    .optional()
    .messages({
      "string.empty": "Date of birth cannot be empty",
      "string.pattern.base": "Date of birth must be in YYYY-MM-DD format.",
    }),

  age: Joi.number().min(1).max(120).label("Age").optional().messages({
    "number.empty": "Age cannot be empty",
    "number.base": "Age must be a number.",
    "number.min": "Age must be at least 1.",
    "number.max": "Age cannot exceed 120.",
  }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .label("Gender")
    .optional()
    .messages({
      "string.empty": "Gender cannot be empty",
      "any.only": "Gender must be male, female or other.",
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .label("Phone number")
    .optional()
    .messages({
      "string.empty": "Phone number cannot be empty",
      "string.pattern.base": "Phone number must be a valid 10-digit number.",
    }),

  email: Joi.string().email().lowercase().label("Email").optional().messages({
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address.",
  }),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .label("Blood group")
    .optional()
    .messages({
      "string.empty": "Blood group cannot be empty",
      "any.only": "Please enter a valid blood group (A+, O-, AB+ etc).",
    }),

  adhaar: Joi.string()
    .pattern(/^\d{12}$/)
    .label("Aadhaar number")
    .optional()
    .messages({
      "string.empty": "Aadhaar number cannot be empty",
      "string.pattern.base": "Aadhaar number must be a 12-digit number.",
    }),

  pan: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .label("PAN number")
    .optional()
    .messages({
      "string.empty": "PAN number cannot be empty",
      "string.pattern.base": "PAN number must be in valid format (ABCDE1234F).",
    }),

  address1: Joi.string().label("Address line 1").optional().messages({
    "string.empty": "Address line 1 cannot be empty",
  }),

  address2: Joi.string().label("Address line 2").optional().messages({
    "string.empty": "Address line 2 cannot be empty",
  }),

  city: Joi.string().label("City").optional().messages({
    "string.empty": "City cannot be empty",
  }),

  state: Joi.string().label("State").optional().messages({
    "string.empty": "State cannot be empty",
  }),

  pincode: Joi.number()
    .integer()
    .min(100000)
    .max(999999)
    .label("Pincode")
    .optional()
    .messages({
      "number.empty": "Pincode cannot be empty",
      "number.base": "Pincode must be a number.",
      "number.min": "Pincode must be a valid 6-digit number.",
      "number.max": "Pincode must be a valid 6-digit number.",
    }),

  profileImage: Joi.string().uri().label("Profile image").optional().messages({
    "string.empty": "Profile image cannot be empty",
    "string.uri": "Profile image must be a valid URL.",
  }),

  userToken: Joi.string().label("User token").optional().messages({
    "string.empty": "User token cannot be empty",
  }),

  isNewUser: Joi.boolean().label("Is new user").optional().messages({
    "boolean.empty": "Is new user cannot be empty",
  }),
});
