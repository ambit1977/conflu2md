// test/p-limit.test.js
import pLimit from '../src/lib/p-limit.js';

describe('pLimit', () => {
  test('should return a function that limits concurrency', async () => {
    // 同時実行数を 2 に制限
    const limit = pLimit(2);
    let activeCount = 0;
    let maxActive = 0;

    // 50ms 待機するタスク
    const waitTask = async (value) => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      // 50ms の遅延
      await new Promise(resolve => setTimeout(resolve, 50));
      activeCount--;
      return value;
    };

    // 5つのタスクを並列で実行（ただし p-limit によって同時実行は2に制限される）
    const tasks = Array.from({ length: 5 }, (_, i) => limit(() => waitTask(i)));
    const results = await Promise.all(tasks);

    // 結果の整合性チェック
    expect(results).toEqual([0, 1, 2, 3, 4]);
    // 同時に最大で動作したタスク数が2以下であることを確認
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
