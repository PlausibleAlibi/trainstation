/**
 * Validation utilities for forms
 */

import type { ValidationRule, ValidationError } from '../types';

export function validateField(
  value: any,
  fieldName: string,
  rule: ValidationRule
): ValidationError | null {
  // Required validation
  if (rule.required && (value === null || value === undefined || value === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`
    };
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // Min/Max validation for numbers
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.min}`
      };
    }
    if (rule.max !== undefined && value > rule.max) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${rule.max}`
      };
    }
  }

  // Length validation for strings
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters`
      };
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${rule.maxLength} characters`
      };
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} has invalid format`
    };
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return {
        field: fieldName,
        message: customError
      };
    }
  }

  return null;
}

export function validateForm(
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRule>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [fieldName, rule] of Object.entries(validationRules)) {
    const value = formData[fieldName];
    const error = validateField(value, fieldName, rule);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

export function getFieldError(
  errors: ValidationError[],
  fieldName: string
): string | undefined {
  const error = errors.find(e => e.field === fieldName);
  return error?.message;
}