import type { Skill, Grade } from './types'

/**
 * The Numbersmith skill graph: 41 atomic K-5 numeracy skills.
 *
 * `label` is what the child sees and hears, plain words, no jargon.
 * `detail` is the standards-facing description, shown only on the
 * grown-up dashboard.
 * Each is traced independently by the BKT engine and rendered as one
 * star in the Mastery Constellation.
 *
 * `star` coordinates run left-to-right by grade so the constellation
 * reads as a journey from Kindergarten to Grade 5.
 */
export const SKILLS: Skill[] = [
  // ── Kindergarten ─────────────────────────────────────────────
  { id: 'k.count10',    label: 'Count to Ten',        detail: 'Addition within 10 · K.OA.A.2',            grade: 'K', verb: 'fuse',   prereqs: [],                  star: { x: 0.06, y: 0.50 }, tier: 0 },
  { id: 'k.bond5',      label: 'Pairs That Make 5',       detail: 'Number pairs that make 5 · K.OA.A.3',                      grade: 'K', verb: 'fuse',   prereqs: ['k.count10'],       star: { x: 0.11, y: 0.30 }, tier: 1 },
  { id: 'k.add5',       label: 'Add up to 5',     detail: 'Addition with sums to 5 · K.OA.A.2',                       grade: 'K', verb: 'fuse',   prereqs: ['k.count10'],       star: { x: 0.11, y: 0.68 }, tier: 1 },
  { id: 'k.bond10',     label: 'Pairs That Make 10',        detail: 'Number pairs that make 10 · K.OA.A.4',                     grade: 'K', verb: 'fuse',   prereqs: ['k.bond5'],         star: { x: 0.17, y: 0.20 }, tier: 2 },
  { id: 'k.sub5',       label: 'Subtract from 5',      detail: 'Subtraction within 5 · K.OA.A.2',                          grade: 'K', verb: 'cleave', prereqs: ['k.add5'],          star: { x: 0.17, y: 0.78 }, tier: 2 },
  { id: 'k.teen',       label: 'Teen Numbers',           detail: 'Decompose teens as 10 + n · K.NBT.A.1',                     grade: 'K', verb: 'cleave', prereqs: ['k.bond10'],        star: { x: 0.17, y: 0.48 }, tier: 2 },

  // ── Grade 1 ──────────────────────────────────────────────────
  { id: 'g1.add10',     label: 'Add up to 10',      detail: 'Addition within 10, fluency · 1.OA.C.6',                      grade: '1', verb: 'fuse',   prereqs: ['k.bond10'],        star: { x: 0.24, y: 0.32 }, tier: 3 },
  { id: 'g1.sub10',     label: 'Subtract from 10',       detail: 'Subtraction within 10 · 1.OA.C.6',                         grade: '1', verb: 'cleave', prereqs: ['k.sub5'],          star: { x: 0.24, y: 0.72 }, tier: 3 },
  { id: 'g1.maketen',   label: 'Make a Ten',          detail: 'Bridge through ten: 8 + 5 as 8 + 2 + 3 · 1.OA.C.6',        grade: '1', verb: 'fuse',   prereqs: ['g1.add10'],        star: { x: 0.30, y: 0.18 }, tier: 4 },
  { id: 'g1.doubles',   label: 'Doubles',         detail: 'Doubles and near-doubles to 20 · 1.OA.C.6',                grade: '1', verb: 'fuse',   prereqs: ['g1.add10'],        star: { x: 0.30, y: 0.44 }, tier: 4 },
  { id: 'g1.sub20',     label: 'Subtract from 20',    detail: 'Subtraction within 20 · 1.OA.C.6',                         grade: '1', verb: 'cleave', prereqs: ['g1.sub10'],        star: { x: 0.30, y: 0.80 }, tier: 4 },
  { id: 'g1.place2',    label: 'Tens and Ones',       detail: 'Tens and ones place value · 1.NBT.B.2',                     grade: '1', verb: 'cleave', prereqs: ['k.teen'],          star: { x: 0.30, y: 0.60 }, tier: 4 },

  // ── Grade 2 ──────────────────────────────────────────────────
  { id: 'g2.add100',    label: 'Add Big Numbers',    detail: 'Two-digit addition, no regrouping · 2.NBT.B.5',             grade: '2', verb: 'fuse',   prereqs: ['g1.place2'],       star: { x: 0.38, y: 0.30 }, tier: 5 },
  { id: 'g2.carry',     label: 'Carrying',           detail: 'Two-digit addition with regrouping · 2.NBT.B.5',            grade: '2', verb: 'fuse',   prereqs: ['g2.add100', 'g1.maketen'], star: { x: 0.44, y: 0.20 }, tier: 6 },
  { id: 'g2.sub100',    label: 'Subtract Big Numbers',    detail: 'Two-digit subtraction, no regrouping · 2.NBT.B.5',          grade: '2', verb: 'cleave', prereqs: ['g1.place2'],       star: { x: 0.38, y: 0.70 }, tier: 5 },
  { id: 'g2.borrow',    label: 'Borrowing',          detail: 'Two-digit subtraction with regrouping · 2.NBT.B.5',         grade: '2', verb: 'cleave', prereqs: ['g2.sub100'],       star: { x: 0.44, y: 0.82 }, tier: 6 },
  { id: 'g2.skip',      label: 'Skip Counting',          detail: 'Skip-count by 2s, 5s and 10s · 2.NBT.A.2',                  grade: '2', verb: 'stamp',  prereqs: ['g1.doubles'],      star: { x: 0.38, y: 0.48 }, tier: 5 },
  { id: 'g2.arrays',    label: 'First Rows',        detail: 'Equal groups and rectangular arrays · 2.OA.C.4',           grade: '2', verb: 'stamp',  prereqs: ['g2.skip'],         star: { x: 0.44, y: 0.52 }, tier: 6 },
  { id: 'g2.place3',    label: 'Hundreds',      detail: 'Hundreds, tens and ones · 2.NBT.A.1',                       grade: '2', verb: 'cleave', prereqs: ['g1.place2'],       star: { x: 0.44, y: 0.66 }, tier: 6 },

  // ── Grade 3 ──────────────────────────────────────────────────
  { id: 'g3.mult5',     label: 'Multiply by 1 to 5',          detail: 'Multiplication facts 1x through 5x · 3.OA.C.7',            grade: '3', verb: 'stamp',  prereqs: ['g2.arrays'],       star: { x: 0.52, y: 0.42 }, tier: 7 },
  { id: 'g3.mult10',    label: 'Multiply by 10 and 9',       detail: 'Multiplying by 10 and by 9 · 3.OA.C.7',                    grade: '3', verb: 'stamp',  prereqs: ['g3.mult5'],        star: { x: 0.58, y: 0.30 }, tier: 8 },
  { id: 'g3.mult9',     label: 'Multiply by 6 to 9',          detail: 'Multiplication facts 6x through 9x · 3.OA.C.7',            grade: '3', verb: 'stamp',  prereqs: ['g3.mult5'],        star: { x: 0.58, y: 0.46 }, tier: 8 },
  { id: 'g3.div',       label: 'Divide into Groups',         detail: 'Division as equal sharing · 3.OA.A.2',                     grade: '3', verb: 'share',  prereqs: ['g3.mult5'],        star: { x: 0.58, y: 0.62 }, tier: 8 },
  { id: 'g3.family',    label: 'Number Families',       detail: 'Linking multiplication and division · 3.OA.B.6',           grade: '3', verb: 'share',  prereqs: ['g3.div', 'g3.mult9'], star: { x: 0.64, y: 0.56 }, tier: 9 },
  { id: 'g3.add1000',   label: 'Add and Subtract Big Numbers',      detail: 'Three-digit addition and subtraction · 3.NBT.A.2',          grade: '3', verb: 'fuse',   prereqs: ['g2.carry', 'g2.place3'], star: { x: 0.52, y: 0.18 }, tier: 7 },
  { id: 'g3.unitfrac',  label: 'One Slice',           detail: 'Unit fractions 1/b as equal parts · 3.NF.A.1',             grade: '3', verb: 'temper', prereqs: ['g3.div'],          star: { x: 0.64, y: 0.78 }, tier: 9 },
  { id: 'g3.fraccomp',  label: 'Which Piece Is Bigger',    detail: 'Fractions on a number line and compared · 3.NF.A.2',      grade: '3', verb: 'temper', prereqs: ['g3.unitfrac'],     star: { x: 0.70, y: 0.86 }, tier: 10 },

  // ── Grade 4 ──────────────────────────────────────────────────
  { id: 'g4.mult2x1',   label: 'Big Times',          detail: 'Two-digit by one-digit multiplication · 4.NBT.B.5',         grade: '4', verb: 'stamp',  prereqs: ['g3.mult9'],        star: { x: 0.70, y: 0.38 }, tier: 10 },
  { id: 'g4.mult2x2',   label: 'Bigger Times',        detail: 'Two-digit by two-digit multiplication · 4.NBT.B.5',         grade: '4', verb: 'stamp',  prereqs: ['g4.mult2x1'],      star: { x: 0.77, y: 0.30 }, tier: 11 },
  { id: 'g4.divrem',    label: 'Leftovers',        detail: 'Division with remainders · 4.NBT.B.6',                      grade: '4', verb: 'share',  prereqs: ['g3.family'],       star: { x: 0.70, y: 0.60 }, tier: 10 },
  { id: 'g4.factors',   label: 'Factor Pairs',        detail: 'Factors, multiples, primes to 100 · 4.OA.B.4',             grade: '4', verb: 'share',  prereqs: ['g3.family'],       star: { x: 0.77, y: 0.52 }, tier: 11 },
  { id: 'g4.equivfrac', label: 'Same Size Pieces',          detail: 'Equivalent fractions · 4.NF.A.1',                          grade: '4', verb: 'temper', prereqs: ['g3.fraccomp'],     star: { x: 0.77, y: 0.80 }, tier: 11 },
  { id: 'g4.addlike',   label: 'Add Pieces',   detail: 'Adding fractions with like denominators · 4.NF.B.3',       grade: '4', verb: 'temper', prereqs: ['g3.fraccomp'],     star: { x: 0.77, y: 0.92 }, tier: 11 },

  // ── Grade 5 ──────────────────────────────────────────────────
  { id: 'g5.addunlike', label: 'Add Different Pieces',       detail: 'Adding fractions with unlike denominators · 5.NF.A.1',     grade: '5', verb: 'temper', prereqs: ['g4.addlike', 'g4.equivfrac'], star: { x: 0.86, y: 0.86 }, tier: 12 },
  { id: 'g5.multfrac',  label: 'Pieces of Pieces',    detail: 'Multiplying fractions · 5.NF.B.4',                         grade: '5', verb: 'temper', prereqs: ['g5.addunlike'],    star: { x: 0.93, y: 0.78 }, tier: 13 },
  { id: 'g5.decplace',  label: 'Dots in Numbers',        detail: 'Decimal place value, tenths on a line · 4.NF.C.6',             grade: '5', verb: 'temper', prereqs: ['g4.equivfrac'],    star: { x: 0.86, y: 0.66 }, tier: 12 },
  { id: 'g5.decadd',    label: 'Add Dot Numbers',       detail: 'Adding decimals to tenths · 5.NBT.B.7',               grade: '5', verb: 'fuse',   prereqs: ['g5.decplace'],     star: { x: 0.93, y: 0.60 }, tier: 13 },
  { id: 'g5.div2',      label: 'Divide Big Numbers',          detail: 'Dividing by two-digit divisors · 5.NBT.B.6',                grade: '5', verb: 'share',  prereqs: ['g4.divrem'],       star: { x: 0.86, y: 0.48 }, tier: 12 },
  { id: 'g5.order',     label: 'Which Bit First',         detail: 'Order of operations · 5.OA.A.1',                           grade: '5', verb: 'fuse',   prereqs: ['g4.mult2x2'],      star: { x: 0.93, y: 0.40 }, tier: 13 },
  { id: 'g5.powers',    label: 'Ten Times Bigger',          detail: 'Powers of ten and scaling · 5.NBT.A.2',                     grade: '5', verb: 'stamp',  prereqs: ['g4.mult2x2'],      star: { x: 0.86, y: 0.28 }, tier: 12 },
  { id: 'g5.volume',    label: 'Filling Boxes',        detail: 'Volume as layers of an array · 5.MD.C.5',         grade: '5', verb: 'stamp',  prereqs: ['g5.powers'],       star: { x: 0.93, y: 0.18 }, tier: 13 },
]

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]))

export const GRADES: Grade[] = ['K', '1', '2', '3', '4', '5']

export const GRADE_LABEL: Record<Grade, string> = {
  K: 'Kindergarten', '1': 'Grade 1', '2': 'Grade 2',
  '3': 'Grade 3', '4': 'Grade 4', '5': 'Grade 5',
}

/** Constellation edges: one line per prerequisite relationship. */
export const EDGES: Array<[string, string]> = SKILLS.flatMap((s) =>
  s.prereqs.map((p) => [p, s.id] as [string, string]))
