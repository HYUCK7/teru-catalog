import { vi } from "vitest";

type QueryResult = { data: unknown; error: { message?: string } | null };

export function makeQuery(result: QueryResult) {
  const query: Record<string, unknown> = {};
  const chain = () => query;

  query.select = vi.fn(chain);
  query.eq = vi.fn(chain);
  query.order = vi.fn(chain);
  query.single = vi.fn(() => Promise.resolve(result));
  query.then = (onfulfilled: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(onfulfilled);

  return query;
}

export function makeClient(byTable: Record<string, QueryResult>) {
  return {
    from: vi.fn((table: string) =>
      makeQuery(byTable[table] ?? { data: [], error: null }),
    ),
  };
}
