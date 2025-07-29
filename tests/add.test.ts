import { expect, test } from 'vitest';
const add = (a: number, b: number) => a + b;
test('add', () => expect(add(2, 3)).toBe(5));
