import Joi from 'joi';

const createTerminalSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
  }),
  uid: Joi.string().optional().messages({
    'string.base': 'UID must be a string',
  }),
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
  }),
  center: Joi.string().required().messages({
    'string.base': 'Center must be a string',
    'any.required': 'Center is required',
  }),
  companyId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Company ID must be a string',
  }),
  agentId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Agent ID must be a string',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean',
  }),
});

const updateTerminalSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
  }),
  center: Joi.string().optional().messages({
    'string.base': 'Center must be a string',
  }),
  companyId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Company ID must be a string',
  }),
  agentId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'Agent ID must be a string',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean',
  }),
});

const assignTerminalSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
  }),
  uid: Joi.string().optional().messages({
    'string.base': 'UID must be a string',
  }),
  center: Joi.string().optional().messages({
    'string.base': 'Center must be a string',
  }),
  companyId: Joi.string().optional().allow(null, ''),
  agentId: Joi.string().optional().allow(null, ''),
});

const unassignTerminalSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
  }),
  uid: Joi.string().optional().messages({
    'string.base': 'UID must be a string',
  }),
});

export {
  createTerminalSchema,
  updateTerminalSchema,
  assignTerminalSchema,
  unassignTerminalSchema,
};
