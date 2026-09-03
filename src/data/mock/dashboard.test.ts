import { describe, expect, it } from 'vitest';

import { businessSummaries } from './companies';
import { strategicGoals } from './goals';
import { mockTasks } from './tasks';

describe('Phase 1 mock data', () => {
  it('keeps FindingMat as the single strategic-priority business', () => {
    const strategicBusinesses = businessSummaries.filter(
      (business) => business.isStrategicPriority,
    );

    expect(strategicBusinesses).toHaveLength(1);
    expect(strategicBusinesses[0]?.name).toBe('FindingMat');
  });

  it('uses unique ids and valid progress ranges', () => {
    const ids = [
      ...mockTasks.map((task) => task.id),
      ...strategicGoals.map((goal) => goal.id),
      ...businessSummaries.map((business) => business.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      businessSummaries.every(
        (business) => business.progress >= 0 && business.progress <= 100,
      ),
    ).toBe(true);
  });
});
