import type { SkillItem } from '../types';

export interface SkillComparison {
  /** matched in the newer report but not in the older one (progress) */
  gained: string[];
  /** matched in the older report but no longer in the newer one */
  lost: string[];
  /** missing in both reports (still to do) */
  stillMissing: string[];
  /** missing in the newer report, and not seen as missing OR matched before (a newly surfaced gap) */
  newGaps: string[];
}

/** Case/space-insensitive key so "ReactJS " and "reactjs" count as the same skill. */
export const skillKey = (name: string): string => name.trim().replace(/\s+/g, ' ').toLowerCase();

const byKey = (skills: SkillItem[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const s of skills) {
    if (s.name && s.name.trim()) map.set(skillKey(s.name), s.name.trim());
  }
  return map;
};

export function compareSkills(
  older: { matched: SkillItem[]; missing: SkillItem[] },
  newer: { matched: SkillItem[]; missing: SkillItem[] },
): SkillComparison {
  const oldMatched = byKey(older.matched);
  const oldMissing = byKey(older.missing);
  const newMatched = byKey(newer.matched);
  const newMissing = byKey(newer.missing);

  const pick = (from: Map<string, string>, pred: (key: string) => boolean): string[] =>
    Array.from(from.entries()).filter(([k]) => pred(k)).map(([, label]) => label);

  return {
    gained: pick(newMatched, (k) => !oldMatched.has(k)),
    lost: pick(oldMatched, (k) => !newMatched.has(k) && newMissing.has(k)),
    stillMissing: pick(newMissing, (k) => oldMissing.has(k)),
    newGaps: pick(newMissing, (k) => !oldMissing.has(k) && !oldMatched.has(k)),
  };
}
