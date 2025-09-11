/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import { validateField, validateForm, getFieldError } from '../../src/components/modal/validation';
import type { ValidationRule } from '../../src/components/types';

describe('validation utilities', () => {
  describe('validateField', () => {
    it('validates required fields correctly', () => {
      const rule: ValidationRule = { required: true };

      expect(validateField('', 'name', rule)).toEqual({
        field: 'name',
        message: 'name is required',
      });

      expect(validateField(null, 'name', rule)).toEqual({
        field: 'name',
        message: 'name is required',
      });

      expect(validateField(undefined, 'name', rule)).toEqual({
        field: 'name',
        message: 'name is required',
      });

      expect(validateField('valid', 'name', rule)).toBeNull();
    });

    it('skips validation for empty non-required fields', () => {
      const rule: ValidationRule = { min: 5 };

      expect(validateField('', 'name', rule)).toBeNull();
      expect(validateField(null, 'name', rule)).toBeNull();
      expect(validateField(undefined, 'name', rule)).toBeNull();
    });

    it('validates min/max for numbers', () => {
      const rule: ValidationRule = { min: 5, max: 10 };

      expect(validateField(3, 'value', rule)).toEqual({
        field: 'value',
        message: 'value must be at least 5',
      });

      expect(validateField(15, 'value', rule)).toEqual({
        field: 'value',
        message: 'value must be at most 10',
      });

      expect(validateField(7, 'value', rule)).toBeNull();
    });

    it('validates string length', () => {
      const rule: ValidationRule = { minLength: 3, maxLength: 10 };

      expect(validateField('ab', 'name', rule)).toEqual({
        field: 'name',
        message: 'name must be at least 3 characters',
      });

      expect(validateField('this is too long', 'name', rule)).toEqual({
        field: 'name',
        message: 'name must be at most 10 characters',
      });

      expect(validateField('valid', 'name', rule)).toBeNull();
    });

    it('validates pattern', () => {
      const rule: ValidationRule = { pattern: /^[A-Z][a-z]+$/ };

      expect(validateField('invalid', 'name', rule)).toEqual({
        field: 'name',
        message: 'name has invalid format',
      });

      expect(validateField('Valid', 'name', rule)).toBeNull();
    });

    it('validates custom rules', () => {
      const rule: ValidationRule = {
        custom: (value) => (value === 'forbidden' ? 'This value is not allowed' : null),
      };

      expect(validateField('forbidden', 'name', rule)).toEqual({
        field: 'name',
        message: 'This value is not allowed',
      });

      expect(validateField('allowed', 'name', rule)).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('validates multiple fields', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        age: 15,
      };

      const rules = {
        name: { required: true },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { min: 18 },
      };

      const errors = validateForm(formData, rules);

      expect(errors).toHaveLength(3);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'name is required',
      });
      expect(errors).toContainEqual({
        field: 'email',
        message: 'email has invalid format',
      });
      expect(errors).toContainEqual({
        field: 'age',
        message: 'age must be at least 18',
      });
    });

    it('returns empty array for valid form', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const rules = {
        name: { required: true },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { min: 18 },
      };

      const errors = validateForm(formData, rules);
      expect(errors).toHaveLength(0);
    });
  });

  describe('getFieldError', () => {
    it('returns error message for field', () => {
      const errors = [
        { field: 'name', message: 'name is required' },
        { field: 'email', message: 'email has invalid format' },
      ];

      expect(getFieldError(errors, 'name')).toBe('name is required');
      expect(getFieldError(errors, 'email')).toBe('email has invalid format');
      expect(getFieldError(errors, 'age')).toBeUndefined();
    });

    it('returns undefined when no error exists', () => {
      const errors: any[] = [];
      expect(getFieldError(errors, 'name')).toBeUndefined();
    });
  });
});