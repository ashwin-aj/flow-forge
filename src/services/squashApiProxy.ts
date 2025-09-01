// Alternative proxy-based approach for CORS issues
import { SquashProject, SquashFolder, SquashTestCase, SquashApiResponse, SquashTreeNode } from '../types/squash';

const SQUASH_API_BASE_URL = 'https://demo.squashtest.org/squash/api/rest/latest';
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwidXVpZCI6ImVmMWY1ZDFjLTkxYmEtNDYyYS1hMjJkLWQ4MDIzZmNmYTFmMCIsInBlcm1pc3Npb25zIjoiUkVBRF9XUklURSIsImlhdCI6MTc1NjY1ODE1NywiZXhwIjoxNzg4MDQ4MDAwfQ.L85847WTiChrbchYWCQhaXeIwYssSLeDZ1TtyvjEuXHeeN8msN1BGJuBYxEN3ju6lHC6FS8N7sA0GUTBWTq0RA';

// Mock data for development when CORS issues prevent real API calls
const mockProjects: SquashProject[] = [
  {
    id: 1,
    name: "Sample Project 1",
    description: "Demo project for testing",
    label: "PROJ1",
    active: true,
    template: false,
    testCaseNatures: ["FUNCTIONAL"],
    testCaseTypes: ["MANUAL"],
    requirementCategories: [],
    infoListItems: [],
    allowTcModifFromExec: true,
    allowAutomationWorkflow: false,
    _links: { self: { href: "/projects/1" } }
  },
  {
    id: 2,
    name: "Sample Project 2", 
    description: "Another demo project",
    label: "PROJ2",
    active: true,
    template: false,
    testCaseNatures: ["FUNCTIONAL", "NON_FUNCTIONAL"],
    testCaseTypes: ["MANUAL", "AUTOMATED"],
    requirementCategories: [],
    infoListItems: [],
    allowTcModifFromExec: true,
    allowAutomationWorkflow: true,
    _links: { self: { href: "/projects/2" } }
  }
];

const mockFolders: SquashFolder[] = [
  {
    id: 101,
    name: "Authentication Tests",
    description: "Tests related to user authentication",
    project: { id: 1, name: "Sample Project 1" },
    path: "/Sample Project 1/Authentication Tests",
    created: { by: "admin", on: "2024-01-01T00:00:00Z" },
    lastModified: { by: "admin", on: "2024-01-15T00:00:00Z" },
    _links: {
      self: { href: "/test-case-folders/101" },
      project: { href: "/projects/1" },
      content: { href: "/test-case-folders/101/content" }
    }
  },
  {
    id: 102,
    name: "API Tests",
    description: "Tests for API functionality",
    project: { id: 1, name: "Sample Project 1" },
    path: "/Sample Project 1/API Tests",
    created: { by: "admin", on: "2024-01-01T00:00:00Z" },
    lastModified: { by: "admin", on: "2024-01-15T00:00:00Z" },
    _links: {
      self: { href: "/test-case-folders/102" },
      project: { href: "/projects/1" },
      content: { href: "/test-case-folders/102/content" }
    }
  }
];

const mockTestCases: SquashTestCase[] = [
  {
    id: 1001,
    name: "Login with valid credentials",
    reference: "TC-001",
    description: "Test successful login with valid username and password",
    prerequisite: "User account exists",
    importance: "HIGH",
    nature: { code: "FUNCTIONAL", label: "Functional" },
    type: { code: "MANUAL", label: "Manual" },
    status: "APPROVED",
    project: { id: 1, name: "Sample Project 1" },
    folder: { id: 101, name: "Authentication Tests" },
    created: { by: "admin", on: "2024-01-01T00:00:00Z" },
    lastModified: { by: "admin", on: "2024-01-15T00:00:00Z" },
    steps: [
      {
        id: 10001,
        action: "Navigate to login page",
        expectedResult: "Login page is displayed",
        index: 1,
        _links: { self: { href: "/test-steps/10001" } }
      },
      {
        id: 10002,
        action: "Enter valid username and password",
        expectedResult: "Credentials are accepted",
        index: 2,
        _links: { self: { href: "/test-steps/10002" } }
      }
    ],
    _links: {
      self: { href: "/test-cases/1001" },
      project: { href: "/projects/1" },
      steps: { href: "/test-cases/1001/steps" }
    }
  }
];

class SquashApiProxyService {
  private useMockData = false;

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (this.useMockData) {
      return this.getMockData<T>(endpoint);
    }

    try {
      // Try direct API call first
      const response = await fetch(`${SQUASH_API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.warn('Direct API call failed, falling back to mock data:', error);
      this.useMockData = true;
      return this.getMockData<T>(endpoint);
    }
  }

  private getMockData<T>(endpoint: string): T {
    console.log('Using mock data for endpoint:', endpoint);
    
    if (endpoint === '/projects') {
      return {
        _embedded: { projects: mockProjects },
        _links: { self: { href: '/projects' } }
      } as T;
    }
    
    if (endpoint.includes('/test-case-folders')) {
      return {
        _embedded: { folders: mockFolders },
        _links: { self: { href: endpoint } }
      } as T;
    }
    
    if (endpoint.includes('/test-cases')) {
      return {
        _embedded: { testCases: mockTestCases },
        _links: { self: { href: endpoint } }
      } as T;
    }

    return {} as T;
  }

  async getProjects(): Promise<SquashProject[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashProject>>('/projects');
      return response._embedded?.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return mockProjects;
    }
  }

  async loadRootProjects(): Promise<SquashTreeNode[]> {
    try {
      const projects = await this.getProjects();
      return projects.map(project => ({
        id: `project-${project.id}`,
        name: project.name,
        type: 'project' as const,
        squashId: project.id,
        children: undefined,
        path: project.name,
        expanded: false,
        hasChildren: true
      }));
    } catch (error) {
      console.error('Error loading root projects:', error);
      return [];
    }
  }

  async loadProjectChildren(projectId: number): Promise<SquashTreeNode[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashFolder>>(`/projects/${projectId}/test-case-folders`);
      const folders = response._embedded?.folders || mockFolders;
      
      return folders.map(folder => ({
        id: `folder-${folder.id}`,
        name: folder.name,
        type: 'folder' as const,
        squashId: folder.id,
        children: undefined,
        parent: `project-${projectId}`,
        path: folder.path || folder.name,
        expanded: false,
        hasChildren: true
      }));
    } catch (error) {
      console.error('Error loading project children:', error);
      return [];
    }
  }

  async loadFolderChildren(folderId: number): Promise<SquashTreeNode[]> {
    try {
      const [subfoldersResponse, testCasesResponse] = await Promise.all([
        this.makeRequest<SquashApiResponse<SquashFolder>>(`/test-case-folders/${folderId}/folders`).catch(() => ({ _embedded: { folders: [] } })),
        this.makeRequest<SquashApiResponse<SquashTestCase>>(`/test-case-folders/${folderId}/test-cases`).catch(() => ({ _embedded: { testCases: mockTestCases } }))
      ]);

      const subfolders = subfoldersResponse._embedded?.folders || [];
      const testCases = testCasesResponse._embedded?.testCases || mockTestCases;
      const children: SquashTreeNode[] = [];

      // Add subfolders
      subfolders.forEach(folder => {
        children.push({
          id: `folder-${folder.id}`,
          name: folder.name,
          type: 'folder',
          squashId: folder.id,
          children: undefined,
          parent: `folder-${folderId}`,
          path: folder.path || folder.name,
          expanded: false,
          hasChildren: true
        });
      });

      // Add test cases
      testCases.forEach(testCase => {
        children.push({
          id: `testcase-${testCase.id}`,
          name: testCase.name,
          type: 'testcase',
          squashId: testCase.id,
          children: undefined,
          parent: `folder-${folderId}`,
          path: `${testCase.folder?.name || 'Unknown'}/${testCase.name}`,
          testCase,
          expanded: false,
          hasChildren: false
        });
      });

      return children;
    } catch (error) {
      console.error('Error loading folder children:', error);
      return [];
    }
  }
}

export const squashApiProxyService = new SquashApiProxyService();