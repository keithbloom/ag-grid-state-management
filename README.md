# ag-Grid State Management System

A React state management system for ag-Grid with mode-based column configurations and async operations, following the open/closed principle. Built with **Vite** for fast development and modern tooling.

## Features

- ✅ Mode-based column visibility and behavior
- ✅ Async column handlers with cascade updates
- ✅ Built-in loading and error states
- ✅ Extensible without modifying core code
- ✅ Role-based mode permissions
- ✅ Race condition protection
- ✅ TypeScript support
- ✅ **Vite** for lightning-fast development
- ✅ **ESLint** for code quality
- ✅ **Hot Module Replacement (HMR)**

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
├── public/                     # Static assets
├── src/
│   ├── hooks/
│   │   ├── useGridStateManager.ts      # Core state management hook
│   │   ├── useInventoryModeHandlers.ts # Inventory-specific handlers
│   │   └── useModePermissions.ts       # Permission-based mode management
│   ├── components/
│   │   ├── GridExample.tsx             # Main example component
│   │   └── ModeSelector.tsx            # Mode switching component
│   ├── types/
│   │   └── grid.ts                     # TypeScript interfaces
│   ├── App.tsx                         # Main app component
│   ├── App.css                         # Styling
│   ├── main.tsx                        # Entry point
│   └── vite-env.d.ts                   # Vite type definitions
├── index.html                          # HTML template
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript configuration
├── tsconfig.node.json                  # Node TypeScript config
├── .eslintrc.cjs                       # ESLint configuration
└── package.json                        # Dependencies and scripts
```

## Development

### Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### Development Features

- **⚡ Vite**: Lightning-fast cold starts and instant HMR
- **🔧 TypeScript**: Full type checking during development
- **📝 ESLint**: Code quality and consistency checks
- **🎯 Path Aliases**: Clean imports with `@/` prefix
- **🔄 Hot Reload**: Changes reflect instantly without losing state

## Usage

### Basic Setup

```typescript
import { useGridStateManager } from '@/hooks/useGridStateManager';
import { AgGridReact } from 'ag-grid-react';

const MyGrid = () => {
  const gridManager = useGridStateManager([], 'editing');
  
  return (
    <AgGridReact
      rowData={gridManager.data}
      columnDefs={gridManager.getColumnDefsForMode()}
      onCellValueChanged={gridManager.onCellValueChanged}
    />
  );
};
```

### Adding New Modes

```typescript
// Register a new mode
gridManager.registerMode({
  id: 'reporting',
  name: 'Reporting Mode',
  columns: ['name', 'total', 'status'],
  defaultColumnProps: { editable: false }
});

// Add mode-specific handlers
gridManager.registerColumnHandler({
  columnId: 'total',
  modes: ['reporting'],
  handler: async (rowData, newValue) => {
    // Reporting-specific logic
    return { formattedTotal: `${newValue.toFixed(2)}` };
  }
});
```

### Custom Business Logic Hooks

```typescript
const useCustomHandlers = (gridManager) => {
  useEffect(() => {
    gridManager.registerColumnHandler({
      columnId: 'customField',
      handler: async (rowData, newValue) => {
        // Your business logic here
        return { calculatedField: newValue * 2 };
      }
    });
  }, []);
};
```

## Available Modes

- **Editing Mode**: Full editing capabilities with calculations
- **Advanced Mode**: Extended columns with margin calculations and SKU lookup
- **Readonly Mode**: View-only mode for reports
- **Inventory Mode**: Stock management with reorder triggers

## Vite Configuration

The project uses Vite with the following optimizations:

- **React Plugin**: Fast refresh and JSX transformation
- **TypeScript**: Full type checking and compilation
- **Path Aliases**: `@/` points to `src/` directory
- **Development Server**: Runs on port 3000 with auto-open
- **Build Optimization**: Source maps enabled for debugging

## API Reference

### useGridStateManager

Main hook for managing grid state and operations.

#### Parameters
- `initialData: GridRowData[]` - Initial row data
- `defaultMode: string` - Starting mode (default: 'default')

#### Returns
- `data` - Current row data
- `loading` - Set of row IDs currently processing
- `errors` - Map of row IDs to error messages
- `currentMode` - Active mode ID
- `availableModes` - Array of registered modes
- `setMode(modeId)` - Switch to different mode
- `registerMode(config)` - Add new mode configuration
- `registerColumnHandler(handler)` - Add async column handler
- `registerColumnConfig(config)` - Add column configuration
- `getColumnDefsForMode()` - Get ag-Grid column definitions for current mode

### Types

```typescript
interface GridRowData {
  id: string;
  [key: string]: any;
}

interface AsyncColumnHandler {
  columnId: string;
  handler: (rowData: GridRowData, newValue: any) => Promise<Partial<GridRowData>>;
  dependencies?: string[];
  modes?: string[];
}

interface ModeConfig {
  id: string;
  name: string;
  columns: string[];
  defaultColumnProps?: Partial<ColumnConfig>;
}
```

## Production Deployment

```bash
# Build the project
npm run build

# The `dist` folder contains the production-ready files
# Deploy the contents of `dist` to your hosting provider
```

## License

MIT