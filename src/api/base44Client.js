import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6883d7d5b7801a4f4024db14", 
  requiresAuth: true // Ensure authentication is required for all operations
});
