export type BoardNodeType = 'suspect' | 'object' | 'location' | 'case';
export type BoardConnectionKind = 'identified-in' | 'linked-to' | 'witnessed-at' | 'disputed';

export interface BoardNode {
  id: string;
  type: BoardNodeType;
  titleKey: string;
  summaryKey: string;
  route?: string;
}

export interface BoardConnection {
  id: string;
  from: string;
  to: string;
  kind: BoardConnectionKind;
  explanationKey?: string;
}

export interface BoardSequenceState {
  revealedNodeIds: string[];
  revealedConnectionIds: string[];
  complete: boolean;
}

export const CONSPIRACY_NODES: readonly BoardNode[] = [
  { id: 'le-criminel', type: 'suspect', titleKey: 'leCriminelTitle', summaryKey: 'leCriminelSummary' },
  { id: 'couch', type: 'case', titleKey: 'couchTitle', summaryKey: 'couchSummary', route: '/couch' },
  { id: 'balcony', type: 'case', titleKey: 'balconyTitle', summaryKey: 'balconySummary', route: '/pigeon' },
  { id: 'shoe', type: 'case', titleKey: 'shoeTitle', summaryKey: 'shoeSummary', route: '/theft-and-destruction' },
  { id: 'pikette', type: 'suspect', titleKey: 'piketteTitle', summaryKey: 'piketteSummary' },
  { id: 'pikette-visits', type: 'location', titleKey: 'piketteVisitsTitle', summaryKey: 'piketteVisitsSummary', route: '/blog' },
];

export const CONSPIRACY_CONNECTIONS: readonly BoardConnection[] = [
  { id: 'le-criminel-couch', from: 'le-criminel', to: 'couch', kind: 'identified-in', explanationKey: 'leCriminelCouch' },
  { id: 'le-criminel-balcony', from: 'le-criminel', to: 'balcony', kind: 'identified-in', explanationKey: 'leCriminelBalcony' },
  { id: 'le-criminel-shoe', from: 'le-criminel', to: 'shoe', kind: 'linked-to', explanationKey: 'leCriminelShoe' },
  { id: 'le-criminel-pikette', from: 'le-criminel', to: 'pikette', kind: 'disputed', explanationKey: 'leCriminelPikette' },
  { id: 'pikette-couch', from: 'pikette', to: 'couch', kind: 'witnessed-at', explanationKey: 'piketteCouch' },
  { id: 'pikette-visits', from: 'pikette', to: 'pikette-visits', kind: 'witnessed-at', explanationKey: 'piketteVisits' },
];

const REVEAL_STEPS: ReadonlyArray<Readonly<{ nodeId: string; connectionId?: string }>> = [
  { nodeId: 'le-criminel' },
  { nodeId: 'couch', connectionId: 'le-criminel-couch' },
  { nodeId: 'balcony', connectionId: 'le-criminel-balcony' },
  { nodeId: 'shoe', connectionId: 'le-criminel-shoe' },
  { nodeId: 'pikette', connectionId: 'le-criminel-pikette' },
  { nodeId: 'pikette-visits', connectionId: 'pikette-visits' },
];

export function validateBoardGraph(
  nodes: readonly BoardNode[],
  connections: readonly BoardConnection[],
): string[] {
  const nodeIds = new Set<string>();
  const errors: string[] = [];

  for (const node of nodes) {
    if (nodeIds.has(node.id)) errors.push(`Node "${node.id}" is duplicated.`);
    nodeIds.add(node.id);
  }

  const connectionIds = new Set<string>();
  for (const connection of connections) {
    if (connectionIds.has(connection.id)) errors.push(`Connection "${connection.id}" is duplicated.`);
    connectionIds.add(connection.id);
    for (const endpoint of [connection.from, connection.to]) {
      if (!nodeIds.has(endpoint)) errors.push(`Connection "${connection.id}" references missing node "${endpoint}".`);
    }
  }

  return errors;
}

export function neighborsForNode(nodeId: string): string[] {
  return CONSPIRACY_CONNECTIONS
    .filter((connection) => connection.from === nodeId || connection.to === nodeId)
    .map((connection) => connection.from === nodeId ? connection.to : connection.from);
}

export function sequenceStateFor(stepCount: number): BoardSequenceState {
  const visibleCount = Math.max(0, Math.min(REVEAL_STEPS.length, stepCount));
  const revealed = REVEAL_STEPS.slice(0, visibleCount);

  return {
    revealedNodeIds: revealed.map((step) => step.nodeId),
    revealedConnectionIds: revealed.flatMap((step) => step.connectionId ? [step.connectionId] : []),
    complete: visibleCount === REVEAL_STEPS.length,
  };
}
