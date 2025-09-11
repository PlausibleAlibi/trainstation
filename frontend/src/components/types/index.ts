/**
 * Common types for modal components
 */

export interface BaseEntity {
  id: number;
  isActive: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string; disabled?: boolean }[];
  multiline?: boolean;
  rows?: number;
}

export interface ModalConfig {
  title: string;
  fields: FormFieldConfig[];
  saveButtonText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityModalProps<T = any> {
  open: boolean;
  onClose: () => void;
  onSave: (data: T) => Promise<void>;
  config: ModalConfig;
  initialData?: Partial<T>;
  isEditing?: boolean;
  loading?: boolean;
  error?: string | null;
}

export interface DeleteConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityName: string;
  entityType: string;
  warning?: string;
  loading?: boolean;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}