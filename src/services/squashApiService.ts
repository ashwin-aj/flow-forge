import { SquashProject, SquashFolder, SquashTestCase, SquashApiResponse, SquashTreeNode } from '../types/squash';
import { tokenManager } from '../utils/tokenManager';

interface ApiRequestOptions {
  page?: number;
  size?: number;
  fields?: string;
  timeout?: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

class SquashApiService {
  private baseUrl = 'https://demo.squashtest.org/squash/api/rest/latest';
  private defaultTimeout = 10000; // 10 seconds
  private globalTimeout = 30000; // 30 seconds
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    jitter: true
  };
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    threshold: 5,
    cooldownPeriod: 60000 // 1 minute
  };

  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < this.circuitBreaker.cooldownPeriod) {
        return true;
      } else {
        // Reset circuit breaker after cooldown
        this.circuitBreaker.failures = 0;
      }
    }
    return false;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    
    if (this.retryConfig.jitter) {
      return delay + Math.random() * 1000;
    }
    
    return delay;
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxAttempts) return false;
    
    // Retry on network errors, timeouts, and specific HTTP status codes
    if (error.name === 'TypeError' || error.name === 'AbortError') return true;
    if (error.status && [502, 503, 504, 429].includes(error.status)) return true;
    
    return false;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<T> {
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open. Service temporarily unavailable.');
    }

    if (tokenManager.isTokenExpired()) {
      throw new Error('Authentication token has expired. Please refresh your token.');
    }

    const { timeout = this.defaultTimeout } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (options.page !== undefined) url.searchParams.set('page', options.page.toString());
    if (options.size !== undefined) url.searchParams.set('size', options.size.toString());
    if (options.fields) url.searchParams.set('fields', options.fields);

    let lastError: any;

    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit'
        });

        clearTimeout(timeoutId);

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateDelay(attempt);
          console.warn(`Rate limited. Retrying after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        // Handle auth errors separately
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          const error = new Error(`API error: ${response.status} ${response.statusText}`);
          (error as any).status = response.status;
          
          if (this.shouldRetry(error, attempt)) {
            lastError = error;
            const delay = this.calculateDelay(attempt);
            console.warn(`Request failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error.message);
            await this.sleep(delay);
            continue;
          }
          
          throw error;
        }

        const data = await response.json();
        this.recordSuccess();
        return data;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        if (this.shouldRetry(error, attempt)) {
          const delay = this.calculateDelay(attempt);
          console.warn(`Request failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
          await this.sleep(delay);
          continue;
        }

        this.recordFailure();
        throw error;
      }
    }

    this.recordFailure();
    throw lastError || new Error('Max retry attempts exceeded');
  }

  async getProjects(options: ApiRequestOptions = {}): Promise<{ projects: SquashProject[], totalElements: number }> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashProject>>('/projects', {
        page: 0,
        size: 20,
        ...options
      });
      
      return {
        projects: response._embedded?.projects || [],
        totalElements: response.page?.totalElements || 0
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProjectFolders(projectId: number, options: ApiRequestOptions = {}): Promise<{ folders: SquashFolder[], totalElements: number }> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashFolder>>(`/projects/${projectId}/test-case-folders`, {
        page: 0,
        size: 50,
        ...options
      });
      
      return {
        folders: response._embedded?.folders || [],
        totalElements: response.page?.totalElements || 0
      };
    } catch (error) {
      console.error('Error fetching project folders:', error);
      throw error;
    }
  }

  async getFolderChildren(folderId: number, options: ApiRequestOptions = {}): Promise<{ folders: SquashFolder[], testCases: SquashTestCase[] }> {
    try {
      const [foldersResponse, testCasesResponse] = await Promise.allSettled([
        this.makeRequest<SquashApiResponse<SquashFolder>>(`/test-case-folders/${folderId}/folders`, options),
        this.makeRequest<SquashApiResponse<SquashTestCase>>(`/test-case-folders/${folderId}/test-cases`, {
          ...options,
          fields: 'name,reference,description,importance,nature,type,status'
        })
      ]);

      const folders = foldersResponse.status === 'fulfilled' 
        ? foldersResponse.value._embedded?.folders || []
        : [];
      
      const testCases = testCasesResponse.status === 'fulfilled'
        ? testCasesResponse.value._embedded?.testCases || []
        : [];

      return { folders, testCases };
    } catch (error) {
      console.error('Error fetching folder children:', error);
      throw error;
    }
  }

  async getTestCases(options: ApiRequestOptions = {}): Promise<{ testCases: SquashTestCase[], totalElements: number }> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashTestCase>>('/test-cases', {
        page: 0,
        size: 100,
        fields: 'name,reference,description,importance,nature,type,status',
        ...options
      });
      
      return {
        testCases: response._embedded?.testCases || [],
        totalElements: response.page?.totalElements || 0
      };
    } catch (error) {
      console.error('Error fetching test cases:', error);
      throw error;
    }
  }

  async getTestCase(testCaseId: number): Promise<SquashTestCase | null> {
    try {
      return await this.makeRequest<SquashTestCase>(`/test-cases/${testCaseId}`);
    } catch (error) {
      console.error('Error fetching test case:', error);
      return null;
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/projects', { page: 0, size: 1, timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get circuit breaker status
  getCircuitBreakerStatus() {
    return {
      isOpen: this.isCircuitOpen(),
      failures: this.circuitBreaker.failures,
      threshold: this.circuitBreaker.threshold,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      cooldownRemaining: Math.max(0, this.circuitBreaker.cooldownPeriod - (Date.now() - this.circuitBreaker.lastFailureTime))
    };
  }
}

export const squashApiService = new SquashApiService();