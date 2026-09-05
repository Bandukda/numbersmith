<p align="center">
  <img src=".github/assets/banner.svg" alt="Numbersmith" width="100%">
</p>

<p align="center">
  <img alt="Grades K to 5" src="https://img.shields.io/badge/grades-K%E2%80%935-FF5C39?style=for-the-badge&labelColor=23180F">
  <img alt="41 skills" src="https://img.shields.io/badge/skills-41-FFB627?style=for-the-badge&labelColor=23180F">
  <img alt="187 tests" src="https://img.shields.io/badge/tests-187%20passing-58B368?style=for-the-badge&labelColor=23180F">
  <img alt="No accounts, no tracking" src="https://img.shields.io/badge/offline-no%20accounts-2EC4B6?style=for-the-badge&labelColor=23180F">
  <img alt="Zero asset files" src="https://img.shields.io/badge/assets-0%20files-7B2CBF?style=for-the-badge&labelColor=23180F">
</p>

> **A K-5 maths game where arithmetic is the physics of the world, not a quiz in front of it.**

Numbers are lumps of hot metal. You **add** them together, **subtract** to break one in
two, **multiply** them out in rows, **divide** them into equal groups, and cut them into
**fractions**. Then you say what you'll get, **and BANG your hammer.**

Every wrong answer is diagnosed, not just marked. Every mistake becomes a creature you can
catch. And the model underneath knows not just what you've learned, but what you're
starting to forget.

```bash
npm install && npm run dev
```

---

## Why this is not another quiz app

Most maths games put a sum on screen and ask you to pick the answer. The maths sits *behind
glass*: it is the thing being tested, never the thing being touched. Numbersmith inverts
that. **Arithmetic is how the world physically works.** You drag two orbs together to add,
slide a bar apart to subtract, press out a rectangle to multiply. The answer is a
prediction you make about what you just built.

Four things follow from that, and they are what make this different:

| | |
|---|---|
| 🔬 **Mistakes are diagnosed** | A wrong answer is the richest signal a learner produces. 16 rules classify *what* went wrong, and a guided repair scene walks through that exact misconception |
| 🐛 **Mistakes become collectable** | Each misconception has a creature. Make the error and it escapes; get that skill right three times unaided and you catch it. **Your bug jar is a museum of things you used to get wrong** |
| 🧠 **Forgetting is modelled** | Mastery decays on a curve. A session opens with a warm-up on what you knew and are starting to lose |
| 🎓 **You teach, too** | In Teach Pip, an apprentice makes a mistake and *you* diagnose it. Explaining is the strongest evidence of understanding there is |

---

## The five actions

Each is a physical thing you do to the metal, named the way school names it.

<table>
<tr>
<td width="20%" align="center"><h3>➕<br>ADD</h3></td>
<td width="20%" align="center"><h3>➖<br>SUBTRACT</h3></td>
<td width="20%" align="center"><h3>✖️<br>MULTIPLY</h3></td>
<td width="20%" align="center"><h3>➗<br>DIVIDE</h3></td>
<td width="20%" align="center"><h3>🍕<br>FRACTIONS</h3></td>
</tr>
<tr>
<td align="center">Squash two numbers into one</td>
<td align="center">Break a bar in two</td>
<td align="center">Press out rows and rows</td>
<td align="center">Deal into equal groups</td>
<td align="center">Cut a whole into equal parts</td>
</tr>
<tr>
<td align="center"><sub>drag orbs together</sub></td>
<td align="center"><sub>slide the cut</sub></td>
<td align="center"><sub>tap out an array</sub></td>
<td align="center"><sub>fill the groups</sub></td>
<td align="center"><sub>bar, pizza or number line</sub></td>
</tr>
</table>

> **On the words.** These went through two earlier drafts. The first used *fuse, cleave,
> temper*, written for an adult reading the pitch. The second replaced them with invented
> one-syllable words: *mash, snap, stamp*. They were friendly, and they were a mistake. A
> child fluent at "mashing" has mastered a word that appears on no worksheet, in no lesson
> and in no exam, so none of that fluency travels back to the classroom. The words a child
> reads are now the words their teacher uses, and **a test fails the build if an invented
> one creeps back in.**

---

## Structure

**41 skills across K-5**, each independently traced, each naming the standard it targets.
The grown-ups' dashboard shows that code beside the child's progress.

```
K   Count to Ten · Pairs That Make 5 · Add up to 5 · Pairs That Make 10
    Subtract from 5 · Teen Numbers

1   Add up to 10 · Subtract from 10 · Make a Ten · Doubles
    Subtract from 20 · Tens and Ones

2   Add Big Numbers · Carrying · Subtract Big Numbers · Borrowing
    Skip Counting · First Rows · Hundreds

3   Multiply by 1 to 5 · by 10 and 9 · by 6 to 9 · Divide into Groups
    Number Families · Add and Subtract Big Numbers · One Slice · Which Piece Is Bigger

4   Big Times · Bigger Times · Leftovers · Factor Pairs
    Same Size Pieces · Add Pieces

5   Add Different Pieces · Pieces of Pieces · Dots in Numbers · Add Dot Numbers
    Divide Big Numbers · Which Bit First · Ten Times Bigger · Filling Boxes
```

Skills form a **prerequisite graph**, not a list. Nothing unlocks until what it rests on is
solid, and the selector always offers the frontier: the hardest thing you're ready for.

### Alignment is tested, not asserted

The build fails if a skill's generated content drifts from what its label promises:

- decimal skills must emit **actual decimals**, not whole numbers
- volume must have a **third dimension**, not be an array with a new name
- order of operations must produce a question where left-to-right gives a *different*
  answer, or it cannot tell the two apart
- every fraction skill must be met as a **bar, a pizza and a number line**
- the stage a skill declares must be the stage its orders use

---

## The reward system

Four currencies, and they deliberately measure different things.

### ⭐ Stars, what you spend

Earned by solving. **Spent on hints, and nothing else.** A score that only goes up is a
decoration, not a reward.

| Action | Stars |
|---|---|
| Solve a problem | **+10** |
| Solve it after a repair | **+8** |
| Take a hint | **−5** |
| Catch a bug | **+60** |
| Find a new way in Your Way | **+15** to **+40** |
| Teach Pip correctly | **+20** to **+40** |

A hint is **never a barrier**: a child short of stars still gets it, it just takes whatever
they have. Anyone short of stars is a beginner, which is exactly who needs help most.

### 🏅 Medals, what you cannot buy

One per skill mastered, plus one for hitting a Your Way goal. **Stars can never buy a
medal.** If volume could purchase them, grinding easy Kindergarten questions would earn the
same badge as learning long division, and the game would be arguing against itself.

### 🐛 Bug jar, a museum of your old mistakes

15 creatures, each the face of one misconception. *Flipsy* always takes the small number
from the big one. *Hoppo* hops one step too many. *Snipsy* counts the cuts instead of the
pieces. Make the mistake and the creature escapes; get that skill right **three times
unaided** and you catch it for good.

### ⭐ Star map, what you have lit up

Every skill is a star. Mastered ones burn bright, fading ones dim, locked ones wait.

### The rule that holds it together

**Every reward that means "you know this" requires an unaided answer.** Not a guess, not a
hint.

This was a real bug, found by measurement. BKT scores one observation per *opportunity*,
and an opportunity is a question, not a tap. Counting every submission separately meant
each extra guess collected another learning bump:

| From the same start | Mastery after |
|---|---|
| Answered correctly first try | 0.498 |
| Two wrong guesses, then correct | **0.612** ← brute force *beat* knowing it |

Fixed. The opportunity is scored once, on the first attempt. A later success still earns a
reduced transfer, because working through a repair genuinely teaches, but never counts as having
known it. Guessing now gains nothing at all: **one wrong tap or four, you land on the same
0.286, against 0.498 for knowing it.** A hint disqualifies mastery for the same reason,
though it never touches the star reward, because you already paid for it.

---

## The adaptive engine

### Bayesian Knowledge Tracing, with a forgetting curve

Every skill carries `P(learned)`, updated after each answer from a four-parameter model
(prior, transfer, slip, guess). `pG` is set to **0.25**, not the free-entry value: answers
are chosen from four orbs, so a pure guess lands about a quarter of the time, and leaving
it higher would have quietly overstated every child's mastery.

Mastery then **decays exponentially with time away**, down to a retention floor. A skill
practised once and abandoned is not the same as a skill known.

### The warm-up

The forgetting curve was the least visible thing in the engine and the most interesting: it
already decided what to offer, but a child never saw it. A run now opens with up to three
skills you knew and are starting to forget, most decayed first:

> ⏱ **Warm up! Let's remember this one** · 1 of 3

It only holds a skill *while it is still fading*. Getting it right lifts it clear and it is
dropped. A learner with no history, or one who practised today, gets no warm-up at all. It
never manufactures work to look busy.

### The misconception radar

16 rules classify wrong answers into named, diagnosable errors:

```
smaller-from-larger  ·  swapped operands  ·  dropped borrow  ·  dropped carry
count-on slip  ·  added instead of multiplied  ·  skipped a row  ·  adjacent fact
multiplied instead of divided  ·  reversed division  ·  dropped remainder
cuts vs parts  ·  bigger denominator  ·  added across denominators
```

Each builds a **guided repair scene** from the child's own numbers, using number lines,
ten-rods and arrays, walking through their specific error rather than replaying the
question.

---

## The other modes

| Mode | What it is |
|---|---|
| 🔨 **Forge** | The main loop: build, predict, BANG |
| 🌟 **Star Map** | The skill graph as a constellation |
| 🔀 **Your Way** | Make 24 as many ways as you can. Rewards flexibility over speed |
| 🎓 **Teach Pip** | Pip answers; *you* say whether he's right and name his mistake |
| 🐛 **Bug Jar** | The creatures you've caught |
| 📋 **For Grown-Ups** | Mastery by grade band, misconceptions detected, spaced review queue |

---

## Design decisions worth defending

**No keypad, anywhere.** Numbers are dragged or tapped. A keypad made the answer feel like
data entry rather than a claim about something you built.

**No reading required.** Every instruction has an arrow pointing at what to do next. The
game never depends on a child being able to read it.

**No timers, ever.** *"There is no clock. Nobody is rushing you."* Speed is not
understanding, and a clock teaches the wrong lesson about what maths is.

**Fractions in three pictures.** A child who only meets fractions as a shaded strip learns
the strip, not the fraction. Ask them to point at 3/4 on a line and they often cannot, so
every fraction skill rotates through a **bar**, a **pizza** and a **number line**. The line
matters most: nothing is coloured in, so the only thing carrying meaning is where the
marker sits.

**When the picture won't fit.** 17 × 15 is 255 dots, which no screen can show. Big numbers get the
**area model** instead: 17 splits into 10 and 7, 15 into 10 and 5, and you tap out
100 + 50 + 70 + 35. That's how 4.NBT.B.5 is actually taught, and every part is a fact you
already own.

**Captain Number.** Get one right and a caped hero flies in from off-screen, lands, and
holds up a comic bubble with your name in it. Only every other cheer uses the name,
because hearing it every single time wears out fast.

---

## Tech

**React 18 · TypeScript · Vite 6 · Tailwind v4 · Framer Motion · Zustand**

- **Zero asset files.** Every sound is synthesised live through Web Audio on a C-major
  pentatonic scale, so no two sounds can clash however fast a child mashes. Every graphic
  is inline SVG or CSS.
- **Fully offline.** No accounts, no network, no telemetry. Progress lives in
  `localStorage` and never leaves the device. The name a child types is stored the same way.
- **187 tests**, run without a framework: `esbuild` bundles the suite, `node` runs it.

```bash
npm run dev      # play it
npm run build    # production build
npm test         # 187 tests
```

Responsive from iPhone SE (375×667) to desktop, verified on phone, tablet and laptop
viewports in both orientations.

---

<p align="center">
  <sub>Built for a K-5 maths hackathon. Engineering notes, including the bugs found by
  measurement rather than by looking, are in <a href="docs/ENGINEERING.md">docs/ENGINEERING.md</a>.</sub>
</p>
