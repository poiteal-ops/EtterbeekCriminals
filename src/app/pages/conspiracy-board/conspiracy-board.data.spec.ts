import {
  CONSPIRACY_CONNECTIONS,
  CONSPIRACY_NODES,
  neighborsForNode,
  sequenceStateFor,
  validateBoardGraph,
} from './conspiracy-board.data';
import { EN_CONTENT } from '../../i18n/content/en.content';

describe('Conspiracy Board graph', () => {
  it('defines exactly six unique evidence cards with the three approved case-file routes', () => {
    expect(CONSPIRACY_NODES).toHaveLength(6);
    expect(new Set(CONSPIRACY_NODES.map((node) => node.id)).size).toBe(6);

    expect(CONSPIRACY_NODES.filter((node) => node.type === 'case').map((node) => node.route)).toEqual([
      '/couch',
      '/pigeon',
      '/theft-and-destruction',
    ]);
  });

  it('rejects a connection whose endpoint is not an authored node', () => {
    expect(validateBoardGraph(CONSPIRACY_NODES, [
      ...CONSPIRACY_CONNECTIONS,
      { id: 'invalid', from: 'le-criminel', to: 'missing-node', kind: 'linked-to' },
    ])).toEqual(['Connection "invalid" references missing node "missing-node".']);
  });

  it('returns only direct neighbours for a selected card', () => {
    expect(neighborsForNode('pikette')).toEqual(['le-criminel', 'couch', 'pikette-visits']);
  });

  it('makes skip and replay deterministic instead of depending on animation timing', () => {
    expect(sequenceStateFor(0)).toEqual({ revealedNodeIds: [], revealedConnectionIds: [], complete: false });
    expect(sequenceStateFor(3)).toEqual({
      revealedNodeIds: ['le-criminel', 'couch', 'balcony'],
      revealedConnectionIds: ['le-criminel-couch', 'le-criminel-balcony'],
      complete: false,
    });
    expect(sequenceStateFor(Number.POSITIVE_INFINITY).complete).toBe(true);
  });

  it('provides English fictional framing and copy for every authored node', () => {
    expect(EN_CONTENT.conspiracyBoard.title).toBe('THE CONSPIRACY BOARD');
    expect(EN_CONTENT.conspiracyBoard.fictionalNotice).toContain('fictional');
    expect(Object.keys(EN_CONTENT.conspiracyBoard.nodes).sort()).toEqual(
      CONSPIRACY_NODES.map((node) => node.id).sort(),
    );
  });
});
