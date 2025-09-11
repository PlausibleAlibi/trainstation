/**
 * Reusable delete confirmation modal component
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import type { DeleteConfirmationProps } from '../types';

export const DeleteConfirmationModal: React.FC<DeleteConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  entityName,
  entityType,
  warning,
  loading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is managed by the parent component
      console.error('Delete confirmation error:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-confirmation-title"
      aria-describedby="delete-confirmation-description"
    >
      <DialogTitle
        id="delete-confirmation-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main'
        }}
      >
        <WarningIcon />
        Confirm Deletion
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography 
            id="delete-confirmation-description" 
            variant="body1"
          >
            Are you sure you want to delete the {entityType.toLowerCase()}{' '}
            <strong>"{entityName}"</strong>?
          </Typography>
          
          {warning && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {warning}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
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
          onClick={handleConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};