// src/utils/defaultParsersValidators.ts
import { DefaultParsersValidators } from '../types/grid';

export const defaultParsersValidators: DefaultParsersValidators = {
  parsers: {
    // String parsers
    string: (value: any) => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    },

    // Number parsers
    number: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? null : parsed;
    },

    integer: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = parseInt(String(value), 10);
      return isNaN(parsed) ? null : parsed;
    },

    currency: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      // Remove currency symbols and commas
      const cleaned = String(value).replace(/[$,€£¥]/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    },

    percentage: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const cleaned = String(value).replace(/%/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed / 100; // Convert to decimal
    },

    // Date parsers
    date: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    },

    // Boolean parsers
    boolean: (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'boolean') return value;
      const str = String(value).toLowerCase().trim();
      return ['true', '1', 'yes', 'on', 'y'].includes(str);
    },

    // SKU/Code parsers
    sku: (value: any) => {
      if (value === null || value === undefined) return '';
      return String(value).toUpperCase().trim();
    },

    email: (value: any) => {
      if (value === null || value === undefined) return '';
      return String(value).toLowerCase().trim();
    }
  },

  validators: {
    // Basic validators
    required: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return 'This field is required';
      }
      return null;
    },

    // Number validators
    positiveNumber: (value: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid number';
      }
      if (value < 0) {
        return 'Must be a positive number';
      }
      return null;
    },

    nonNegativeNumber: (value: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid number';
      }
      if (value < 0) {
        return 'Must be zero or positive';
      }
      return null;
    },

    price: (value: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid price';
      }
      if (value < 0) {
        return 'Price cannot be negative';
      }
      if (value > 1000000) {
        return 'Price seems unreasonably high';
      }
      return null;
    },

    quantity: (value: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid number';
      }
      if (!Number.isInteger(value)) {
        return 'Quantity must be a whole number';
      }
      if (value < 0) {
        return 'Quantity cannot be negative';
      }
      if (value > 10000) {
        return 'Quantity seems unreasonably high';
      }
      return null;
    },

    percentage: (value: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid percentage';
      }
      if (value < 0 || value > 1) {
        return 'Percentage must be between 0% and 100%';
      }
      return null;
    },

    // String validators
    minLength: (minLength: number) => (value: any) => {
      if (value === null || value === undefined) return null;
      if (String(value).length < minLength) {
        return `Must be at least ${minLength} characters`;
      }
      return null;
    },

    maxLength: (maxLength: number) => (value: any) => {
      if (value === null || value === undefined) return null;
      if (String(value).length > maxLength) {
        return `Must be no more than ${maxLength} characters`;
      }
      return null;
    },

    email: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return 'Must be a valid email address';
      }
      return null;
    },

    sku: (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const skuRegex = /^[A-Z0-9]{3,20}$/;
      if (!skuRegex.test(String(value))) {
        return 'SKU must be 3-20 uppercase letters and numbers';
      }
      return null;
    },

    // Date validators
    futureDate: (value: any) => {
      if (value === null || value === undefined) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Must be a valid date';
      }
      if (date <= new Date()) {
        return 'Date must be in the future';
      }
      return null;
    },

    pastDate: (value: any) => {
      if (value === null || value === undefined) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Must be a valid date';
      }
      if (date >= new Date()) {
        return 'Date must be in the past';
      }
      return null;
    },

    // Business logic validators
    stockLevel: (value: any, rowData: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid stock level';
      }
      if (value < 0) {
        return 'Stock cannot be negative';
      }
      
      const reorderLevel = rowData.reorderLevel || 0;
      if (value < reorderLevel * 0.1) {
        return 'Stock level is critically low';
      }
      
      return null;
    },

    reorderLevel: (value: any, rowData: any) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid reorder level';
      }
      if (value < 0) {
        return 'Reorder level cannot be negative';
      }
      
      const currentStock = rowData.currentStock || 0;
      if (value > currentStock * 2) {
        return 'Reorder level seems too high compared to current stock';
      }
      
      return null;
    }
  }
};

// Helper function to create range validators
export const createRangeValidator = (min: number, max: number, fieldName = 'Value') => 
  (value: any) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'number' || isNaN(value)) {
      return `${fieldName} must be a valid number`;
    }
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  };

// Helper function to create custom length validators
export const createLengthValidator = (min: number, max: number) => 
  (value: any) => {
    if (value === null || value === undefined) return null;
    const length = String(value).length;
    if (length < min || length > max) {
      return `Must be between ${min} and ${max} characters`;
    }
    return null;
  };