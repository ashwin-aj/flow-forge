import { useState, useCallback } from 'react';
import { SquashTestCase } from '../types/squash';
import { Flow } from '../types';
import { generateFlowNameFromTestCase, generateFlowDescriptionFromTestCase, isTestCaseConfigured } from '../utils/testCaseHelpers';

export const useSquashGrid = (flows: Flow[]) => {
  const [selectedTestCase, setSelectedTestCase] = useState<SquashTestCase | null>(null);
  const [isGridOpen, setIsGridOpen] = useState(false);

  const createFlowFromTestCase = useCallback((testCase: SquashTestCase): Partial<Flow> => {
    // Convert SquashTestCase to SquashTreeNode format for helper functions
    const treeNode = {
      id: `testcase-${testCase.id}`,
      name: testCase.name,
      type: 'testcase' as const,
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
  }, []);

  const handleTestCaseSelect = useCallback((testCase: SquashTestCase) => {
    setSelectedTestCase(testCase);
    setIsGridOpen(false);
  }, []);

  const openGrid = useCallback(() => {
    setIsGridOpen(true);
  }, []);

  const closeGrid = useCallback(() => {
    setIsGridOpen(false);
    setSelectedTestCase(null);
  }, []);

  const getTestCaseStatus = useCallback((testCaseId: number) => {
    return isTestCaseConfigured(flows, testCaseId) ? 'configured' : 'not-configured';
  }, [flows]);

  return {
    selectedTestCase,
    setSelectedTestCase,
    isGridOpen,
    openGrid,
    closeGrid,
    handleTestCaseSelect,
    createFlowFromTestCase,
    getTestCaseStatus
  };
};