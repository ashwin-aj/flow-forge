// SquashTM API types based on the REST API documentation
export interface SquashProject {
  id: number;
  name: string;
  description?: string;
  label?: string;
  active: boolean;
  template: boolean;
  testCaseNatures: string[];
  testCaseTypes: string[];
  requirementCategories: string[];
  infoListItems: any[];
  bugtrackerBinding?: any;
  automationWorkflow?: any;
  allowTcModifFromExec: boolean;
  allowAutomationWorkflow: boolean;
  _links: {
    self: { href: string };
  };
}

export interface SquashFolder {
  id: number;
  name: string;
  description?: string;
  project: {
    id: number;
    name: string;
  };
  path: string;
  parent?: {
    id: number;
    name: string;
  };
  created: {
    by: string;
    on: string;
  };
  lastModified: {
    by: string;
    on: string;
  };
  _links: {
    self: { href: string };
    project: { href: string };
    content: { href: string };
  };
}

export interface SquashTestCase {
  id: number;
  name: string;
  reference?: string;
  description?: string;
  prerequisite?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  nature: {
    code: string;
    label: string;
  };
  type: {
    code: string;
    label: string;
  };
  status: 'WORK_IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'OBSOLETE';
  project: {
    id: number;
    name: string;
  };
  folder?: {
    id: number;
    name: string;
  };
  created: {
    by: string;
    on: string;
  };
  lastModified: {
    by: string;
    on: string;
  };
  steps: SquashTestStep[];
  _links: {
    self: { href: string };
    project: { href: string };
    steps: { href: string };
  };
}

export interface SquashTestStep {
  id: number;
  action: string;
  expectedResult: string;
  index: number;
  _links: {
    self: { href: string };
  };
}

export interface SquashTreeNode {
  id: string;
  name: string;
  type: 'project' | 'folder' | 'testcase';
  squashId: number;
  children?: SquashTreeNode[];
  parent?: string;
  path: string;
  testCase?: SquashTestCase;
  expanded?: boolean;
  hasChildren?: boolean;
  loading?: boolean;
}

export interface SquashApiResponse<T> {
  _embedded?: {
    [key: string]: T[];
  };
  _links: {
    self: { href: string };
    first?: { href: string };
    prev?: { href: string };
    next?: { href: string };
    last?: { href: string };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}