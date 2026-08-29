import Joi from "joi";

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(150).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be at most 150 characters long",
    "any.required": "Name is required",
  }),
  center: Joi.string().min(2).max(120).required().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
    "any.required": "Center is required",
  }),
  role: Joi.string().trim().optional().default("STAFF").messages({
    "string.base": "Role must be a string",
  }),
  status: Joi.boolean().optional().default(true).messages({
    "boolean.base": "Status must be a boolean",
  }),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be at most 150 characters long",
  }),
  center: Joi.string().min(2).max(120).optional().messages({
    "string.base": "Center must be a string",
    "string.min": "Center must be at least 2 characters long",
    "string.max": "Center must be at most 120 characters long",
  }),
  role: Joi.string().trim().optional().messages({
    "string.base": "Role must be a string",
  }),
  status: Joi.boolean().optional().messages({
    "boolean.base": "Status must be a boolean",
  }),
}).min(1);

export { createDepartmentSchema, updateDepartmentSchema };
