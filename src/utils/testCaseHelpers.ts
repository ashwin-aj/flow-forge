import { Flow } from '../types';
import { SquashTreeNode } from '../types/squash';

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