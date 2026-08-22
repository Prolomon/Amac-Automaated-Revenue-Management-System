import Joi from 'joi';

const createRequestSchema = Joi.object({
  memberId: Joi.string().required().messages({
    'string.base': 'Member ID must be a string',
    'string.empty': 'Member ID is required',
    'any.required': 'Member ID is required',
  }),
  paymentId: Joi.string().required().messages({
    'string.base': 'Payment ID must be a string',
    'string.empty': 'Payment ID is required',
    'any.required': 'Payment ID is required',
  }),
  adminId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Admin ID must be a string',
  }),
  approverId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Approver ID must be a string',
  }),
  reason: Joi.string().min(3).required().messages({
    'string.base': 'Reason must be a string',
    'string.empty': 'Reason is required',
    'string.min': 'Reason must be at least 3 characters long',
    'any.required': 'Reason is required',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean',
  }),
});

const updateRequestSchema = Joi.object({
  reason: Joi.string().min(3).optional().messages({
    'string.base': 'Reason must be a string',
    'string.min': 'Reason must be at least 3 characters long',
  }),
  adminId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Admin ID must be a string',
  }),
  approverId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Approver ID must be a string',
  }),
  paymentId: Joi.string().optional().messages({
    'string.base': 'Payment ID must be a string',
  }),
  memberId: Joi.string().optional().messages({
    'string.base': 'Member ID must be a string',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean',
  }),
});

const updateRequestStatusSchema = Joi.object({
  status: Joi.boolean().required().messages({
    'boolean.base': 'Status must be a boolean',
    'any.required': 'Status is required',
  }),
  approverId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Approver ID must be a string',
  }),
  discount: Joi.number().optional().min(0).messages({
    'number.base': 'Discount must be a number',
    'number.min': 'Discount cannot be negative',
  }),
  reason: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Reason must be a string',
  }),
});

export {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
};
