import { useEffect } from 'react';
import { useGridStateManager } from './useGridStateManager';

export const useModePermissions = (
  gridManager: ReturnType<typeof useGridStateManager>,
  userRole: string
) => {
  useEffect(() => {
    const allowedModes = {
      'admin': ['editing', 'readonly', 'advanced', 'inventory'],
      'manager': ['editing', 'readonly', 'advanced'],
      'editor': ['editing', 'readonly'],
      'viewer': ['readonly']
    };

    const userModes = allowedModes[userRole as keyof typeof allowedModes] || ['readonly'];
    
    // Filter available modes based on permissions
    const filteredModes = gridManager.availableModes.filter(mode => 
      userModes.includes(mode.id)
    );

    // Switch to an allowed mode if current mode is not permitted
    if (filteredModes.length > 0 && !userModes.includes(gridManager.currentMode)) {
      gridManager.setMode(filteredModes[0].id);
    }

    // Log permission changes for debugging
    console.log(`User role: ${userRole}, Allowed modes: ${userModes.join(', ')}`);
  }, [gridManager, userRole, gridManager.availableModes, gridManager.currentMode]);
};