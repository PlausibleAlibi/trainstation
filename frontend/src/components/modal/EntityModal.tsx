/**
 * Reusable entity modal for create/edit operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { EntityModalProps, FormFieldConfig, ValidationError } from '../types';
import { validateForm, getFieldError } from './validation';

export function EntityModal<T extends Record<string, any>>({
  open,
  onClose,
  onSave,
  config,
  initialData = {},
  isEditing = false,
  loading = false,
  error = null,
}: EntityModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Initialize form data
  useEffect(() => {
    if (open) {
      const initialFormData: Partial<T> = {};
      
      // Initialize with config defaults and initial data
      config.fields.forEach(field => {
        const value = initialData[field.name as keyof T];
        if (value !== undefined) {
          initialFormData[field.name as keyof T] = value;
        } else {
          // Set default values based on field type
          switch (field.type) {
            case 'checkbox':
              initialFormData[field.name as keyof T] = false as any;
              break;
            case 'number':
              initialFormData[field.name as keyof T] = (field.options?.[0]?.value || 0) as any;
              break;
            case 'select':
              initialFormData[field.name as keyof T] = (field.options?.[0]?.value || '') as any;
              break;
            default:
              initialFormData[field.name as keyof T] = '' as any;
          }
        }
      });
      
      setFormData(initialFormData);
      setValidationErrors([]);
      setTouched(new Set());
    }
  }, [open, initialData, config.fields]);

  // Validate form
  const validate = useCallback(() => {
    const validationRules: Record<string, any> = {};
    
    config.fields.forEach(field => {
      validationRules[field.name] = {
        required: field.required,
        ...(field.type === 'text' && { minLength: 1 }),
      };
    });

    return validateForm(formData as Record<string, any>, validationRules);
  }, [formData, config.fields]);

  // Update field value
  const updateField = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Mark field as touched
    setTouched(prev => new Set(prev).add(fieldName));
    
    // Validate in real-time for touched fields
    const errors = validate();
    setValidationErrors(errors);
  };

  // Handle form submission
  const handleSave = async () => {
    // Validate all fields
    const errors = validate();
    setValidationErrors(errors);
    
    // Mark all fields as touched
    const allFields = new Set(config.fields.map(f => f.name));
    setTouched(allFields);

    if (errors.length > 0) {
      return;
    }

    try {
      await onSave(formData as T);
    } catch (saveError) {
      // Error handling is managed by the parent component
      console.error('Save error:', saveError);
    }
  };

  // Render form field based on type
  const renderField = (field: FormFieldConfig) => {
    const fieldValue = formData[field.name as keyof T] ?? '';
    const fieldError = getFieldError(validationErrors, field.name);
    const isFieldTouched = touched.has(field.name);
    const showError = isFieldTouched && fieldError;

    switch (field.type) {
      case 'textarea':
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={fieldValue}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            fullWidth
            multiline
            rows={field.rows || 3}
            placeholder={field.placeholder}
            error={!!showError}
            helperText={showError}
            inputProps={{
              'aria-describedby': showError ? `${field.name}-error` : undefined,
            }}
          />
        );

      case 'number':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="number"
            value={fieldValue}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              updateField(field.name, value);
            }}
            required={field.required}
            fullWidth
            placeholder={field.placeholder}
            error={!!showError}
            helperText={showError}
            inputProps={{
              'aria-describedby': showError ? `${field.name}-error` : undefined,
            }}
          />
        );

      case 'select':
        return (
          <FormControl key={field.name} required={field.required} fullWidth>
            <InputLabel error={!!showError}>{field.label}</InputLabel>
            <Select
              value={fieldValue}
              onChange={(e) => updateField(field.name, e.target.value)}
              label={field.label}
              error={!!showError}
              aria-describedby={showError ? `${field.name}-error` : undefined}
            >
              {field.options?.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {showError && (
              <Box 
                id={`${field.name}-error`}
                sx={{ 
                  color: 'error.main', 
                  fontSize: '0.75rem', 
                  mt: 0.5, 
                  ml: 2 
                }}
                role="alert"
              >
                {fieldError}
              </Box>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={!!fieldValue}
                onChange={(e) => updateField(field.name, e.target.checked)}
                aria-describedby={showError ? `${field.name}-error` : undefined}
              />
            }
            label={field.label}
          />
        );

      default: // text
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={fieldValue}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            fullWidth
            placeholder={field.placeholder}
            error={!!showError}
            helperText={showError}
            inputProps={{
              'aria-describedby': showError ? `${field.name}-error` : undefined,
            }}
          />
        );
    }
  };

  const hasValidationErrors = validationErrors.length > 0;
  const isFormDisabled = loading || hasValidationErrors;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={config.maxWidth || 'sm'}
      fullWidth
      aria-labelledby="entity-modal-title"
    >
      <DialogTitle id="entity-modal-title">
        {isEditing ? `Edit ${config.title}` : `Create ${config.title}`}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          
          {config.fields.map(renderField)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isFormDisabled}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading 
            ? 'Saving...' 
            : (config.saveButtonText || (isEditing ? 'Save Changes' : 'Create'))
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}