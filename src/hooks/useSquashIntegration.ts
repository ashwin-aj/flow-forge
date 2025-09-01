import { useState, useCallback } from 'react';
import { SquashTreeNode } from '../types/squash';
import { Flow } from '../types';
import { generateFlowNameFromTestCase, generateFlowDescriptionFromTestCase } from '../utils/testCaseHelpers';

export const useSquashIntegration = () => {
  const [selectedTestCase, setSelectedTestCase] = useState<SquashTreeNode | null>(null);

  const createFlowFromTestCase = useCallback((testCase: SquashTreeNode): Partial<Flow> => {
    if (!testCase.testCase) {
      throw new Error('Invalid test case data');
    }

    const flow: Partial<Flow> = {
      name: generateFlowNameFromTestCase(testCase),
      description: generateFlowDescriptionFromTestCase(testCase),
      squashTestCaseId: testCase.squashId,
      status: 'draft' as const,
      steps: [],
      globalVariables: {
        squashTestCaseId: testCase.squashId,
        squashTestCaseName: testCase.name,
        squashTestCaseReference: testCase.testCase.reference,
        squashTestCaseImportance: testCase.testCase.importance,
        squashTestCaseStatus: testCase.testCase.status
      }
    };

    // Map SquashTM test steps to flow steps if available
    if (testCase.testCase.steps && testCase.testCase.steps.length > 0) {
      flow.globalVariables!.squashSteps = testCase.testCase.steps.map(step => ({
        id: step.id,
        action: step.action,
        expectedResult: step.expectedResult,
        index: step.index
      }));
    }

    return flow;
  }, []);

  const linkFlowToTestCase = useCallback((flowId: string, testCase: SquashTreeNode) => {
    // This would typically update the flow in your state management
    // to link it with the SquashTM test case
    console.log(`Linking flow ${flowId} to test case ${testCase.squashId}`);
  }, []);

  return {
    selectedTestCase,
    setSelectedTestCase,
    createFlowFromTestCase,
    linkFlowToTestCase
  };
};