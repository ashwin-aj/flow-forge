'use client';

import { useParams } from 'next/navigation';
import Layout from '../../../../components/Layout/Layout';
import FlowBuilder from '../../../../pages/FlowBuilder/FlowBuilder';

export default function FlowBuilderPage() {
  return (
    <Layout>
      <FlowBuilder />
    </Layout>
  );
}