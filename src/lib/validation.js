import Joi from 'joi';
import passwordComplexity from 'joi-password-complexity';
import { isAdult } from './dates';

const email = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .required();

/** Cognito's default policy: 8+ characters with upper and lower case, a number and a symbol. */
const password = passwordComplexity({
  min: 8,
  max: 64,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
});

function fieldsWithErrors(schema, value) {
  const { error } = schema.validate(value, { abortEarly: false, allowUnknown: true });
  return new Set(error ? error.details.map((detail) => detail.path[0]) : []);
}

export function accountErrors(form) {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(80).required(),
    email,
    password,
    passwordRepeat: Joi.valid(Joi.ref('password')).required(),
    role: Joi.string().valid('CLIENT', 'WORKER').required(),
  });
  return fieldsWithErrors(schema, form);
}

export function contactErrors(form) {
  const schema = Joi.object({
    city: Joi.string().trim().min(1).max(80).required(),
    address: Joi.string().trim().min(1).max(160).required(),
    phone: Joi.string()
      .trim()
      .pattern(/^\+?[0-9]{7,15}$/)
      .required(),
  });
  return fieldsWithErrors(schema, form);
}

export function personalErrors(form) {
  const errors = contactErrors({ city: form.city, address: form.address, phone: form.phone });
  if (!/^[0-9]{7,15}$/.test(form.idNumber.trim())) {
    errors.add('idNumber');
  }
  if (!form.birthDate || !isAdult(form.birthDate)) {
    errors.add('birthDate');
  }
  return errors;
}

export function loginErrors(form) {
  return fieldsWithErrors(
    Joi.object({ email, password: Joi.string().min(1).required() }),
    form,
  );
}
