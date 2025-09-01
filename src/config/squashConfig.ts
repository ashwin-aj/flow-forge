// SquashTM Configuration
export const SQUASH_CONFIG = {
  // Base URL for SquashTM API
  BASE_URL: 'https://demo.squashtest.org/squash/api/rest/latest',
  
  // API Token - Update this with your valid token
  API_TOKEN: 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwidXVpZCI6ImVmMWY1ZDFjLTkxYmEtNDYyYS1hMjJkLWQ4MDIzZmNmYTFmMCIsInBlcm1pc3Npb25zIjoiUkVBRF9XUklURSIsImlhdCI6MTc1NjY1ODE1NywiZXhwIjoxNzg4MDQ4MDAwfQ.L85847WTiChrbchYWCQhaXeIwYssSLeDZ1TtyvjEuXHeeN8msN1BGJuBYxEN3ju6lHC6FS8N7sA0GUTBWTq0RA',
  
  // Request configuration
  REQUEST_CONFIG: {
    method: 'GET',
    mode: 'cors' as RequestMode,
    credentials: 'omit' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
};

// Function to update token at runtime
export const updateSquashToken = (newToken: string) => {
  SQUASH_CONFIG.API_TOKEN = newToken;
  console.log('SquashTM API token updated');
};

// Function to get authorization header
export const getAuthHeader = () => ({
  'Authorization': `Bearer ${SQUASH_CONFIG.API_TOKEN}`
});