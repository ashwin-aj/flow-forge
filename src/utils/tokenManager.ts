// Token management utility for SquashTM API
export class TokenManager {
  private static instance: TokenManager;
  private currentToken: string;

  private constructor() {
    // Default token - replace with your new token
    this.currentToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwidXVpZCI6ImVmMWY1ZDFjLTkxYmEtNDYyYS1hMjJkLWQ4MDIzZmNmYTFmMCIsInBlcm1pc3Npb25zIjoiUkVBRF9XUklURSIsImlhdCI6MTc1NjY1ODE1NywiZXhwIjoxNzg4MDQ4MDAwfQ.L85847WTiChrbchYWCQhaXeIwYssSLeDZ1TtyvjEuXHeeN8msN1BGJuBYxEN3ju6lHC6FS8N7sA0GUTBWTq0RA';
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public getToken(): string {
    return this.currentToken;
  }

  public setToken(newToken: string): void {
    this.currentToken = newToken;
    console.log('SquashTM API token updated');
  }

  public isTokenExpired(): boolean {
    try {
      const payload = JSON.parse(atob(this.currentToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  public getTokenInfo(): any {
    try {
      const payload = JSON.parse(atob(this.currentToken.split('.')[1]));
      return {
        subject: payload.sub,
        permissions: payload.permissions,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        isExpired: this.isTokenExpired()
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
}

export const tokenManager = TokenManager.getInstance();