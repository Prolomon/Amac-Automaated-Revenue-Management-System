import Joi from 'joi';

const alphaNumPattern = /^[A-Za-z0-9]+$/;

const createAgentSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
  }),
  phone: Joi.string().min(10).max(15).required().messages({
    'string.empty': 'Phone number is required',
    'string.min': 'Phone number must be at least 10 characters',
    'string.max': 'Phone number cannot exceed 15 characters',
  }),
  password: Joi.string().min(6).optional().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  location: Joi.string().required().messages({
    'string.base': 'Location must be a string',
    'any.required': 'Location is required',
  }),
  gender: Joi.string().valid('MALE', 'FEMALE').optional().messages({
    'string.valid': 'Gender must be either MALE or FEMALE',
  }),
  center: Joi.string().optional().messages({
    'string.base': 'Center must be a string',
  }),
  batchNo: Joi.string().optional().messages({
    'string.base': 'Batch number must be a string',
  }),
  company: Joi.string().optional().messages({
    'string.base': 'Company must be a string',
  }),
  role: Joi.string().valid('ADMIN', 'USER').optional(),
});

const updateAgentSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(), 
  phone: Joi.string().min(10).max(15).optional(),
  location: Joi.string().optional().messages({
    'string.base': 'Location must be a string',
  }),
  gender: Joi.string().valid('MALE', 'FEMALE').optional().messages({
    'string.valid': 'Gender must be either MALE or FEMALE',
  }),
  role: Joi.string().valid('ADMIN', 'USER').optional(),
  batchNo: Joi.string().optional().messages({
    'string.base': 'Batch number must be a string',
  }),
  company: Joi.string().optional().messages({
    'string.base': 'Company must be a string',
  }),
});

const loginAgentSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

export {
  createAgentSchema,
  updateAgentSchema,
  loginAgentSchema,
};
