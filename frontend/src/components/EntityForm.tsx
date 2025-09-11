import React from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
} from "@mui/material";

export type EntityField = {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  options?: Array<{ value: any; label: string }>;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  disabled?: boolean;
};

export type EntityFormProps = {
  title: string;
  fields: EntityField[];
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  loading?: boolean;
};

export default function EntityForm({ title, fields, onSubmit, submitLabel = "Create", loading }: EntityFormProps) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      {fields.map((field) => {
        if (field.type === "select" && field.options) {
          return (
            <FormControl size="small" fullWidth key={field.name}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={field.value}
                onChange={field.onChange}
                label={field.label}
                disabled={field.disabled}
              >
                {field.options.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        if (field.type === "checkbox") {
          return (
            <FormControlLabel
              key={field.name}
              control={
                <Checkbox
                  checked={!!field.value}
                  onChange={field.onChange}
                  disabled={field.disabled}
                />
              }
              label={field.label}
            />
          );
        }
        return (
          <TextField
            key={field.name}
            type={field.type || "text"}
            value={field.value}
            onChange={field.onChange}
            label={field.label}
            size="small"
            fullWidth
            disabled={field.disabled}
          />
        );
      })}
      <Button type="submit" disabled={loading} variant="contained" fullWidth>
        {loading ? "Saving…" : submitLabel}
      </Button>
    </Box>
  );
}
