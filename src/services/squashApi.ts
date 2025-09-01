import { SquashProject, SquashFolder, SquashTestCase, SquashApiResponse, SquashTreeNode } from '../types/squash';
import { SQUASH_CONFIG, getAuthHeader } from '../config/squashConfig';

class SquashApiService {
  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${SQUASH_CONFIG.BASE_URL}${endpoint}`, {
        ...SQUASH_CONFIG.REQUEST_CONFIG,
        headers: {
          ...SQUASH_CONFIG.REQUEST_CONFIG.headers,
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SquashTM API Error ${response.status}:`, errorText);
        throw new Error(`SquashTM API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('CORS')) {
        console.error('CORS Error - trying alternative approach');
        throw new Error('CORS Error: Unable to connect to SquashTM API. Please check CORS configuration.');
      }
      throw error;
    }
  }

  async getProjects(): Promise<SquashProject[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashProject>>('/projects');
      return response._embedded?.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async getProjectRootFolders(projectId: number): Promise<SquashFolder[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashFolder>>(`/projects/${projectId}/test-case-folders`);
      return response._embedded?.folders || [];
    } catch (error) {
      console.error('Error fetching project root folders:', error);
      return [];
    }
  }

  async getFolderSubfolders(folderId: number): Promise<SquashFolder[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashFolder>>(`/test-case-folders/${folderId}/folders`);
      return response._embedded?.folders || [];
    } catch (error) {
      console.error('Error fetching folder subfolders:', error);
      return [];
    }
  }

  async getFolderTestCases(folderId: number): Promise<SquashTestCase[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashTestCase>>(`/test-case-folders/${folderId}/test-cases`);
      return response._embedded?.testCases || [];
    } catch (error) {
      console.error('Error fetching folder test cases:', error);
      return [];
    }
  }

  async getProjectTestCases(projectId: number): Promise<SquashTestCase[]> {
    try {
      const response = await this.makeRequest<SquashApiResponse<SquashTestCase>>(`/projects/${projectId}/test-cases`);
      return response._embedded?.testCases || [];
    } catch (error) {
      console.error('Error fetching project test cases:', error);
      return [];
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

  async loadProjectChildren(projectId: number): Promise<SquashTreeNode[]> {
    try {
      const folders = await this.getProjectRootFolders(projectId);
      return folders.map(folder => ({
        id: `folder-${folder.id}`,
        name: folder.name,
        type: 'folder' as const,
        squashId: folder.id,
        children: undefined, // Will be loaded on demand
        parent: `project-${projectId}`,
        path: folder.path || folder.name,
        expanded: false,
        hasChildren: true // Assume folders have children until proven otherwise
      }));
    } catch (error) {
      console.error('Error loading project children:', error);
      return [];
    }
  }

  async loadFolderChildren(folderId: number): Promise<SquashTreeNode[]> {
    try {
      const [subfolders, testCases] = await Promise.all([
        this.getFolderSubfolders(folderId),
        this.getFolderTestCases(folderId)
      ]);

      const children: SquashTreeNode[] = [];

      // Add subfolders
      subfolders.forEach(folder => {
        children.push({
          id: `folder-${folder.id}`,
          name: folder.name,
          type: 'folder',
          squashId: folder.id,
          children: undefined, // Will be loaded on demand
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

  async loadRootProjects(): Promise<SquashTreeNode[]> {
    try {
      const projects = await this.getProjects();
      return projects.map(project => ({
        id: `project-${project.id}`,
        name: project.name,
        type: 'project' as const,
        squashId: project.id,
        children: undefined, // Will be loaded on demand
        path: project.name,
        expanded: false,
        hasChildren: true
      }));
    } catch (error) {
      console.error('Error loading root projects:', error);
      return [];
    }
  }
}

export const squashApiService = new SquashApiService();