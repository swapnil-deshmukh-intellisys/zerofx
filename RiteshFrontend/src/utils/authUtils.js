// Authentication utility functions
import { getApiBaseUrl } from '../services/api';

/**
 * Validates if the current user has admin privileges
 * This function checks both sessionStorage and makes a server-side validation
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export const validateAdminAccess = async () => {
  try {
    // Check if admin session exists in sessionStorage
    const adminToken = sessionStorage.getItem('adminToken');
    const adminUser = sessionStorage.getItem('adminUser');
    
    if (!adminToken || !adminUser) {
      console.log('No admin session found');
      return false;
    }

    // Parse admin user data
    let adminData;
    try {
      adminData = JSON.parse(adminUser);
    } catch (error) {
      console.error('Error parsing admin user data:', error);
      return false;
    }

    // Validate token with server
    const response = await fetch(`${getApiBaseUrl()}/auth/validate-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: adminData.email,
        role: adminData.role
      })
    });

    if (!response.ok) {
      console.log('Server validation failed');
      // Clear invalid session
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminEmail');
      return false;
    }

    const result = await response.json();
    return result.success && result.isAdmin;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
};

/**
 * Checks if user has admin session without server validation
 * Used for UI display purposes only
 * @returns {boolean} True if admin session exists, false otherwise
 */
export const hasAdminSession = () => {
  const adminToken = sessionStorage.getItem('adminToken');
  const adminUser = sessionStorage.getItem('adminUser');
  return !!(adminToken && adminUser);
};

/**
 * Clears all admin session data
 */
export const clearAdminSession = () => {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUser');
  sessionStorage.removeItem('adminEmail');
};
