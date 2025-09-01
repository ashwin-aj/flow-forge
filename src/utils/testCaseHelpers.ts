import { Flow } from '../types';
import { SquashTreeNode, SquashTestCase } from '../types/squash';

export const isTestCaseConfigured = (flows: Flow[], squashTestCaseId: number): Flow | undefined => {
  return flows.find(flow => flow.squashTestCaseId === squashTestCaseId);
};

export const getTestCaseStatus = (flows: Flow[], squashTestCaseId: number): 'configured' | 'not-configured' => {
  return isTestCaseConfigured(flows, squashTestCaseId) ? 'configured' : 'not-configured';
};

export const generateFlowNameFromTestCase = (testCase: SquashTreeNode): string => {
  return `TC-${testCase.squashId}: ${testCase.name}`;
};

export const generateFlowDescriptionFromTestCase = (testCase: SquashTreeNode): string => {
  const baseDescription = testCase.testCase?.description || `Automated test case configuration for: ${testCase.name}`;
  const metadata = [
    `SquashTM ID: ${testCase.squashId}`,
    `Path: ${testCase.path}`,
    testCase.testCase?.importance && `Importance: ${testCase.testCase.importance}`,
    testCase.testCase?.status && `Status: ${testCase.testCase.status}`
  ].filter(Boolean).join(' | ');
  
  return `${baseDescription}\n\n${metadata}`;
};

export const generateFlowFromSquashTestCase = (testCase: SquashTestCase): Partial<Flow> => {
  // Convert SquashTestCase to SquashTreeNode format for existing helper functions
  const treeNode: SquashTreeNode = {
    id: `testcase-${testCase.id}`,
    name: testCase.name,
    type: 'testcase',
    squashId: testCase.id,
    path: `${testCase.project.name}/${testCase.folder?.name || 'Root'}/${testCase.name}`,
    testCase
  };

  const flow: Partial<Flow> = {
    name: generateFlowNameFromTestCase(treeNode),
    description: generateFlowDescriptionFromTestCase(treeNode),
    squashTestCaseId: testCase.id,
    status: 'draft' as const,
    steps: [],
    globalVariables: {
      squashTestCaseId: testCase.id,
      squashTestCaseName: testCase.name,
      squashTestCaseReference: testCase.reference,
      squashTestCaseImportance: testCase.importance,
      squashTestCaseStatus: testCase.status,
      squashProjectId: testCase.project.id,
      squashProjectName: testCase.project.name,
      squashFolderId: testCase.folder?.id,
      squashFolderName: testCase.folder?.name
    }
  };

  // Map SquashTM test steps to flow metadata if available
  if (testCase.steps && testCase.steps.length > 0) {
    flow.globalVariables!.squashSteps = testCase.steps.map(step => ({
      id: step.id,
      action: step.action,
      expectedResult: step.expectedResult,
      index: step.index
    }));
  }

  return flow;
};