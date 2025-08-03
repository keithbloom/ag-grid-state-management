// src/utils/validationUtils.ts
import { ColumnParser, ColumnValidator } from '../types/grid';

/**
 * Utility functions for creating complex validators and parsers
 */

// Composite validator - runs multiple validators in sequence
export const createCompositeValidator = (
  validators: Array<(value: any, rowData: any) => string | null>
) => (value: any, rowData: any): string | null => {
  for (const validator of validators) {
    const error = validator(value, rowData);
    if (error) return error;
  }
  return null;
};

// Conditional validator - only validates if condition is met
export const createConditionalValidator = (
  condition: (value: any, rowData: any) => boolean,
  validator: (value: any, rowData: any) => string | null
) => (value: any, rowData: any): string | null => {
  if (condition(value, rowData)) {
    return validator(value, rowData);
  }
  return null;
};

// Cross-field validator - validates based on other fields
export const createCrossFieldValidator = (
  fieldName: string,
  comparison: 'greater' | 'less' | 'equal' | 'notEqual',
  message?: string
) => (value: any, rowData: any): string | null => {
  const otherValue = rowData[fieldName];
  if (otherValue === undefined || otherValue === null) return null;
  
  const numValue = Number(value);
  const numOther = Number(otherValue);
  
  if (isNaN(numValue) || isNaN(numOther)) return null;
  
  let isValid = false;
  switch (comparison) {
    case 'greater':
      isValid = numValue > numOther;
      break;
    case 'less':
      isValid = numValue < numOther;
      break;
    case 'equal':
      isValid = numValue === numOther;
      break;
    case 'notEqual':
      isValid = numValue !== numOther;
      break;
  }
  
  if (!isValid) {
    return message || `Value must be ${comparison} than ${fieldName} (${otherValue})`;
  }
  
  return null;
};

// Async validator wrapper (for future use with server validation)
export const createAsyncValidator = (
  validator: (value: any, rowData: any) => Promise<string | null>,
  timeout: number = 5000
) => {
  // Store pending validations to avoid duplicate requests
  const pendingValidations = new Map<string, Promise<string | null>>();
  
  return async (value: any, rowData: any): Promise<string | null> => {
    const key = `${rowData.id}-${JSON.stringify(value)}`;
    
    if (pendingValidations.has(key)) {
      return pendingValidations.get(key)!;
    }
    
    const validationPromise = Promise.race([
      validator(value, rowData),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Validation timeout')), timeout)
      )
    ]).catch(() => 'Validation failed - please try again');
    
    pendingValidations.set(key, validationPromise);
    
    try {
      const result = await validationPromise;
      return result;
    } finally {
      pendingValidations.delete(key);
    }
  };
};

// Business logic validators
export const businessValidators = {
  // Validates that a discount doesn't exceed the total
  discountNotExceedingTotal: (value: any, rowData: any): string | null => {
    const discount = Number(value);
    const total = Number(rowData.total || 0);
    
    if (isNaN(discount) || isNaN(total)) return null;
    
    if (discount > total) {
      return `Discount ($${discount.toFixed(2)}) cannot exceed total ($${total.toFixed(2)})`;
    }
    
    return null;
  },

  // Validates quantity against available stock
  quantityVsStock: (value: any, rowData: any): string | null => {
    const quantity = Number(value);
    const stock = Number(rowData.currentStock || 0);
    
    if (isNaN(quantity) || isNaN(stock)) return null;
    
    if (quantity > stock) {
      return `Quantity (${quantity}) exceeds available stock (${stock})`;
    }
    
    if (quantity > stock * 0.8) {
      return `Warning: Quantity (${quantity}) is close to stock limit (${stock})`;
    }
    
    return null;
  },

  // Validates that margin meets minimum requirements
  marginRequirement: (minMarginPercent: number) => (value: any, rowData: any): string | null => {
    const price = Number(value);
    const cost = Number(rowData.cost || 0);
    
    if (isNaN(price) || isNaN(cost) || cost === 0) return null;
    
    const margin = ((price - cost) / price) * 100;
    
    if (margin < minMarginPercent) {
      return `Margin (${margin.toFixed(1)}%) is below minimum requirement (${minMarginPercent}%)`;
    }
    
    return null;
  },

  // Validates date ranges
  dateRange: (minDate?: Date, maxDate?: Date) => (value: any, rowData: any): string | null => {
    if (!value) return null;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date format';
    
    if (minDate && date < minDate) {
      return `Date cannot be before ${minDate.toLocaleDateString()}`;
    }
    
    if (maxDate && date > maxDate) {
      return `Date cannot be after ${maxDate.toLocaleDateString()}`;
    }
    
    return null;
  }
};

// Advanced parsers
export const advancedParsers = {
  // Smart number parser that handles various formats
  smartNumber: (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    
    let str = String(value).trim();
    
    // Remove common formatting
    str = str.replace(/[$€£¥,\s]/g, '');
    
    // Handle percentages
    if (str.endsWith('%')) {
      str = str.slice(0, -1);
      const num = parseFloat(str);
      return isNaN(num) ? null : num / 100;
    }
    
    // Handle fractions
    if (str.includes('/')) {
      const [numerator, denominator] = str.split('/').map(Number);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
  },

  // Phone number parser
  phoneNumber: (value: any): string => {
    if (!value) return '';
    
    const digits = String(value).replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return digits;
  },

  // Address parser
  address: (value: any): string => {
    if (!value) return '';
    
    return String(value)
      .trim()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/,\s*,/g, ',') // Remove duplicate commas
      .replace(/^\s*,|,\s*$/g, ''); // Remove leading/trailing commas
  }
};

// Validation rule builder
export class ValidationRuleBuilder {
  private validators: Array<(value: any, rowData: any) => string | null> = [];

  required(message = 'This field is required') {
    this.validators.push((value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    });
    return this;
  }

  min(minValue: number, message?: string) {
    this.validators.push((value) => {
      const num = Number(value);
      if (!isNaN(num) && num < minValue) {
        return message || `Value must be at least ${minValue}`;
      }
      return null;
    });
    return this;
  }

  max(maxValue: number, message?: string) {
    this.validators.push((value) => {
      const num = Number(value);
      if (!isNaN(num) && num > maxValue) {
        return message || `Value must be at most ${maxValue}`;
      }
      return null;
    });
    return this;
  }

  length(minLength: number, maxLength?: number) {
    this.validators.push((value) => {
      if (value === null || value === undefined) return null;
      const length = String(value).length;
      
      if (length < minLength) {
        return `Must be at least ${minLength} characters`;
      }
      
      if (maxLength && length > maxLength) {
        return `Must be no more than ${maxLength} characters`;
      }
      
      return null;
    });
    return this;
  }

  pattern(regex: RegExp, message: string) {
    this.validators.push((value) => {
      if (value === null || value === undefined || value === '') return null;
      
      if (!regex.test(String(value))) {
        return message;
      }
      
      return null;
    });
    return this;
  }

  custom(validator: (value: any, rowData: any) => string | null) {
    this.validators.push(validator);
    return this;
  }

  build(): (value: any, rowData: any) => string | null {
    return createCompositeValidator(this.validators);
  }
}

// Helper function to create a validation rule builder
export const createValidationRule = () => new ValidationRuleBuilder();

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  sku: /^[A-Z0-9\-]{3,20}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  url: /^https?:\/\/.+/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};