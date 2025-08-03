// src/components/ValidationExamples.tsx
import React, { useEffect } from 'react';
import { useEnhancedGridStateManager } from '../hooks/useEnhancedGridStateManager';
import { createValidationRule, businessValidators, validationPatterns } from '../utils/validationUtils';

/**
 * This component demonstrates advanced usage of parsers and validators
 */
export const ValidationExamples: React.FC = () => {
  const gridManager = useEnhancedGridStateManager([], 'advanced');

  useEffect(() => {
    // Example 1: Complex validation rules using the builder pattern
    const priceValidator = createValidationRule()
      .required('Price is mandatory')
      .min(0.01, 'Price must be greater than zero')
      .max(10000, 'Price cannot exceed $10,000')
      .custom(businessValidators.marginRequirement(15)) // 15% minimum margin
      .build();

    gridManager.registerColumnValidator({
      columnId: 'price',
      validator: priceValidator
    });

    // Example 2: Cross-field validation
    gridManager.registerColumnValidator({
      columnId: 'salePrice',
      validator: (value, rowData) => {
        const salePrice = Number(value);
        const regularPrice = Number(rowData.price);
        
        if (!isNaN(salePrice) && !isNaN(regularPrice)) {
          if (salePrice > regularPrice) {
            return 'Sale price cannot be higher than regular price';
          }
          if (salePrice < regularPrice * 0.1) {
            return 'Sale price seems too low (less than 10% of regular price)';
          }
        }
        return null;
      }
    });

    // Example 3: Email validation with custom parser
    gridManager.registerColumnParser({
      columnId: 'email',
      parser: (value) => {
        if (!value) return '';
        return String(value).toLowerCase().trim();
      }
    });

    gridManager.registerColumnValidator({
      columnId: 'email',
      validator: createValidationRule()
        .pattern(validationPatterns.email, 'Please enter a valid email address')
        .build()
    });

    // Example 4: Phone number with smart parsing
    gridManager.registerColumnParser({
      columnId: 'phone',
      parser: (value) => {
        if (!value) return '';
        const digits = String(value).replace(/\D/g, '');
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return value;
      }
    });

    // Example 5: Conditional validation based on mode
    gridManager.registerColumnValidator({
      columnId: 'quantity',
      modes: ['inventory'], // Only in inventory mode
      validator: (value, rowData) => {
        const quantity = Number(value);
        const stock = Number(rowData.currentStock || 0);
        
        if (!isNaN(quantity) && !isNaN(stock)) {
          if (quantity > stock) {
            return `Cannot order ${quantity} units - only ${stock} in stock`;
          }
        }
        return null;
      }
    });

    // Example 6: Date validation with business rules
    gridManager.registerColumnValidator({
      columnId: 'deliveryDate',
      validator: (value) => {
        if (!value) return 'Delivery date is required';
        
        const date = new Date(value);
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 365); // 1 year from now
        
        if (isNaN(date.getTime())) {
          return 'Invalid date format';
        }
        
        if (date < now) {
          return 'Delivery date cannot be in the past';
        }
        
        if (date > maxDate) {
          return 'Delivery date cannot be more than 1 year from now';
        }
        
        // No weekend deliveries
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return 'Weekend deliveries are not available';
        }
        
        return null;
      }
    });

    // Example 7: Complex SKU validation with check digit
    gridManager.registerColumnParser({
      columnId: 'sku',
      parser: (value) => {
        if (!value) return '';
        return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
    });

    gridManager.registerColumnValidator({
      columnId: 'sku',
      validator: (value) => {
        if (!value) return 'SKU is required';
        
        const sku = String(value);
        
        // Format validation
        if (!/^[A-Z0-9]{6,12}$/.test(sku)) {
          return 'SKU must be 6-12 uppercase letters and numbers';
        }
        
        // Simple check digit validation (last digit is sum of others mod 10)
        if (sku.length > 6) {
          const digits = sku.slice(0, -1).split('').map(c => 
            /\d/.test(c) ? parseInt(c) : c.charCodeAt(0) - 65
          );
          const checkDigit = digits.reduce((sum, d) => sum + d, 0) % 10;
          const lastChar = sku.slice(-1);
          
          if (!/\d/.test(lastChar) || parseInt(lastChar) !== checkDigit) {
            return 'Invalid SKU check digit';
          }
        }
        
        return null;
      }
    });

    return () => {
      // Cleanup
      gridManager.unregisterColumnValidator('price');
      gridManager.unregisterColumnValidator('salePrice');
      gridManager.unregisterColumnValidator('email');
      gridManager.unregisterColumnValidator('quantity');
      gridManager.unregisterColumnValidator('deliveryDate');
      gridManager.unregisterColumnValidator('sku');
    };
  }, []);

  return null; // This is just an example component
};

// Example of how to use in a real component
export const ExampleUsage = () => {
  /*
  // 1. Basic setup with default parsers/validators
  const columnConfig = {
    field: 'price',
    headerName: 'Price',
    defaultParser: 'currency',
    defaultValidator: 'price'
  };

  // 2. Custom validation with builder pattern
  const emailValidator = createValidationRule()
    .required('Email is required')
    .pattern(validationPatterns.email, 'Invalid email format')
    .build();

  gridManager.registerColumnValidator({
    columnId: 'email',
    validator: emailValidator
  });

  // 3. Cross-field validation
  gridManager.registerColumnValidator({
    columnId: 'confirmPassword',
    validator: (value, rowData) => {
      if (value !== rowData.password) {
        return 'Passwords do not match';
      }
      return null;
    }
  });

  // 4. Conditional validation
  gridManager.registerColumnValidator({
    columnId: 'taxId',
    validator: (value, rowData) => {
      // Only validate tax ID for business customers
      if (rowData.customerType === 'business' && !value) {
        return 'Tax ID is required for business customers';
      }
      return null;
    }
  });

  // 5. Mode-specific validation
  gridManager.registerColumnValidator({
    columnId: 'approvalCode',
    modes: ['admin'], // Only validate in admin mode
    validator: createValidationRule()
      .required('Approval code required in admin mode')
      .pattern(/^ADM-\d{6}$/, 'Must be format ADM-123456')
      .build()
  });
  */

  return (
    <div>
      <h3>Validation Examples</h3>
      <p>Check the source code of this component for usage examples!</p>
      
      <h4>Available Default Parsers:</h4>
      <ul>
        <li><code>string</code> - Trims and converts to string</li>
        <li><code>number</code> - Parses to float</li>
        <li><code>integer</code> - Parses to integer</li>
        <li><code>currency</code> - Removes currency symbols and parses</li>
        <li><code>percentage</code> - Removes % and converts to decimal</li>
        <li><code>date</code> - Parses and formats dates</li>
        <li><code>boolean</code> - Smart boolean parsing</li>
        <li><code>sku</code> - Uppercase and trim</li>
        <li><code>email</code> - Lowercase and trim</li>
      </ul>

      <h4>Available Default Validators:</h4>
      <ul>
        <li><code>required</code> - Field cannot be empty</li>
        <li><code>positiveNumber</code> - Must be > 0</li>
        <li><code>nonNegativeNumber</code> - Must be >= 0</li>
        <li><code>price</code> - Valid price with reasonable limits</li>
        <li><code>quantity</code> - Integer quantity with limits</li>
        <li><code>percentage</code> - Between 0% and 100%</li>
        <li><code>email</code> - Valid email format</li>
        <li><code>sku</code> - Valid SKU format</li>
        <li><code>stockLevel</code> - Business logic for stock</li>
        <li><code>reorderLevel</code> - Business logic for reordering</li>
      </ul>

      <h4>How to Use:</h4>
      <pre>{`
// 1. In column config - use defaults
{
  field: 'price',
  defaultParser: 'currency',
  defaultValidator: 'price'
}

// 2. Custom validator
gridManager.registerColumnValidator({
  columnId: 'email',
  validator: createValidationRule()
    .required('Email required')
    .pattern(/email-regex/, 'Invalid email')
    .build()
});

// 3. Custom parser
gridManager.registerColumnParser({
  columnId: 'phone',
  parser: (value) => formatPhoneNumber(value)
});
      `}</pre>
    </div>
  );
};