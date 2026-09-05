# 🔨 Numbersmith

**A K-5 maths game where arithmetic is the physics of the world, not a quiz in front of it.**

Numbers are lumps of hot metal. You **add** them together, **subtract** to break
one in two, **multiply** them out in rows, **divide** them into equal groups and
cut them into **fractions**. Then you say what you'll get, **and BANG your hammer.**

Five actions, each one a physical thing you do to the metal:

| Action | What you do | The maths |
|---|---|---|
| **ADD** | squash two numbers into one | addition |
| **SUBTRACT** | break a bar in two | subtraction |
| **MULTIPLY** | press out rows and rows | multiplication as arrays |
| **DIVIDE** | deal a pile into equal groups | division |
| **FRACTIONS** | cut one whole into equal parts | fractions |

These went through two earlier drafts. The first called them *fuse, cleave and
temper*, written for an adult reading the pitch rather than for the player.
"Cleave" was the worst offender: archaic, and it famously means both *split*
and *stick together*, which is precisely the wrong word for a child learning
subtraction.

The second draft replaced them with invented one-syllable words a young child
could read easily: *mash, snap, stamp, share, slice*. They were friendly, and
they were a mistake. A child who becomes fluent at "mashing" has mastered a
word that appears on no worksheet, in no lesson and in no exam, so none of
that fluency travels back to the classroom. The words a child reads here are
now the words their teacher uses, and a test fails the build if an invented
one creeps back in.

The physical wording still does the work it always did, one layer down: the
header states the maths (*Multiply 8 by 8*) while the on-screen coach states
the action (*Tap to make 8 rows of 8*).

---

## The thesis

Most maths games are a worksheet wearing a costume: remove the game and the maths is
unchanged, because the question was only ever decorative. Numbersmith makes three bets
against that:

**1. The maths is the verb.** Five drag-based actions map onto the five things K-5
arithmetic actually asks children to do. One physical grammar spans six years of curriculum, a kindergartner adds to ten, a fifth grader cuts a whole into fifths.

**2. Children call their shot.** You build the structure physically, then commit to a
predicted value *before* the hammer falls. Committing before the reveal produces far
stronger learning than picking from four options, and it produces a genuine
learner-authored answer, which is the only thing that makes real diagnosis possible.

**3. There is no timer, anywhere.** Timed drill is the best-documented driver of maths
anxiety. Numbersmith scores *how you thought* instead: naming your strategy pays more than
speed ever could, and finding a second strategy for a fact you already knew pays the most.

---

## What's actually under it

### Mastery Constellation, real knowledge tracing
41 atomic skills across K-5, each traced independently with four-parameter **Bayesian
Knowledge Tracing** (Corbett & Anderson) plus an **exponential forgetting curve**. Stars
brighten with mastery and dim on their own as memory decays, so spaced review becomes
something a child can *see*: the sky visibly needs tending.

Problem selection targets the **~80% success sweet spot**, the desirable-difficulty band, and prioritises genuinely decayed skills over merely difficult ones.

### Misconception Radar, diagnosis, not marking
A wrong answer is the richest signal a learner produces, so nothing here ever shows a red
cross. **16 rules** recognise specific, documented arithmetic bugs and each one launches a
guided repair built from the verbs the child already understands:

| What they enter | What the game says |
|---|---|
| `34 − 19 = 25` | smaller-from-larger bug → break a ten-stick into ten ones |
| `27 + 15 = 32` | dropped the carry → ten ones must become a ten-stick |
| `7 × 8 = 48` | one row short → count the rows out loud |
| `7 × 8 = 54` | that's 6×9, a real product from the wrong stamp |
| `25 ÷ 4 = 7` | rounded up; the crucibles must hold the *same* amount |
| 3 cuts → "3 slices" | cuts versus parts, three cuts make four slices |

Effort is paid in sparks whether or not the first attempt landed. Being wrong is somewhere
you want to go.

### Bugs: the child's own mistakes, made collectable

Make the classic `34 - 19 = 25` error and a googly-eyed creature called
**Flipsy** pops out of the number and scuttles into your jar. It has a name, a
face, and a description of exactly what it does wrong. It is *yours*. Get that
same skill right three times in a row and you catch it, and it turns friendly.

This is the whole thesis in one mechanic. The Misconception Radar stops being a
grown-up dashboard feature and becomes the thing the child is playing *for*, and
it inverts maths anxiety completely: a child who keeps making the borrowing
error now actively wants to meet it again.

Fifteen creatures, one per named misconception. `generic.retry` deliberately has
none, because a miss with no diagnosable shape is not a bug and pretending
otherwise would make the collection meaningless.

**Nothing in the bestiary is authored content.** Two children who make different
mistakes end up with different collections, generated entirely from their own
error profiles.

### The Apprentice: the child does the diagnosing

Pip attempts a problem on a skill the child is already solid on, and gets it
wrong in a *plausible* way:

> **Pip says:** Subtract 12 from 66 **= 55**
> *Is Pip right?*  ->  *What did Pip do?*
> A. Pip forgot the ten-stick had lent one away
> B. Pip added them instead of subtracting
> **C. Pip hopped one step too many**

Two reasons this is the strongest idea in the build:

1. **The protege effect.** Teaching a concept produces markedly stronger
   retention than practising it, and almost no maths software asks the learner
   to teach.
2. **It runs the engine backwards.** Everywhere else the game diagnoses the
   child; here the child diagnoses, using exactly the bugs they have been
   collecting. `wrongAnswerFor` is `analyse` inverted, and every generated
   mistake is verified to classify back as the misconception it came from
   before it is ever shown (875 rounds asserted in the test suite).

**Mastery is the gate: you cannot teach what you do not know.** The button only
appears once a skill is above threshold, and a skill that has decayed stops
being teachable. Pip is also right about 30% of the time, so "not quite" is
never the automatic answer.

### Open Forge: "make 20 any way you like"

A second mode with no single right answer. The child hunts for as many
*different* ways to build the target as they can, and the score is how many
distinct ways they find:

```
16 + 4      13 + 7      23 - 3      4 x 5      5 + 15
```

Using an operation not yet tried on this target pays triple, so the mode
explicitly rewards breadth of thinking over repetition of one trick. This is the
strategy-token thesis turned into a whole game mode.

**Operations unlock from the learner model, not from a level number.** A brand
new player has addition only; meeting a multiplication skill in the main game
makes `x` appear here. Mastery elsewhere visibly widens what you can do, which
is the cleanest answer to "reward mastery" the game has.

Duplicate answers are collapsed canonically (`4 + 16` and `16 + 4` are one way,
`23 - 3` and `3 - 23` are not), and the degenerate restatements are refused:
`20 + 0`, `20 x 1` and `20 / 1` all fail because neither operand may *be* the
target. `1 + 19` still counts, because that is a real decomposition.

### Strategy Tokens, the anti-timer
After each forge: *how did you work it out?* Made a ten, used a double, skip-counted, broke
it apart. Breadth of strategy predicts later fluency far better than speed does, so that
is what the game rewards. ("I just knew it" is retrieval, not a strategy, and deliberately
never pays the novelty bonus.)

### Two vocabularies, one game
Every word the child sees is plain: *add, subtract, multiply, divide; pieces,
groups, ten-sticks, medals*. The child never reads "misconception", "mastery"
or "strategy token", a wrong answer just says **"Let's look together."**

The rigorous vocabulary is kept intact one screen away, on the grown-up
dashboard, where a parent or teacher sees the named reasoning bug, the BKT
mastery figure, and the spaced-review queue. Same engine, two registers.

### No typing anywhere

Answers are tapped, never typed. Four orbs appear and the child picks one,
and the three wrong orbs are **generated from the misconception taxonomy**:
for `34 - 19` the options are 15, 25, 53 and 16, which are the answer, the
smaller-from-larger bug, adding instead of subtracting, and a counting slip.

Tapping 25 summons Flipsy exactly as typing it used to. The distractors do
real work: a child with a genuine misconception is pulled toward the option
that names it, rather than producing a random wrong number.

Because answers are now a choice of four, the BKT guess parameter was
raised from 0.18 to 0.25. Leaving it would have quietly overstated every
child's mastery.

### Captain Number

Get one right and a caped hero swoops in from off the right of the screen,
hovers with a thumbs up and a comic cloud bubble, then swoops back out. He
cycles through a dozen cheers so he does not repeat himself, and he leaves
on his own: nothing to tap, nothing to dismiss.

He is pure reward and carries no information, so he is placed to stay out of
the way rather than to be noticed. Wide screens have room beside the stage
and he simply sits there. Narrow screens stack everything vertically, so he
drops into the band between the stage and the answer row, which is the one
strip that is reliably empty.

## One opportunity per question

BKT scores one observation per *opportunity*, and an opportunity is a
question, not a tap. Counting every submission separately meant each extra
guess collected another learning-transition bump, and the result was the
opposite of what this game claims to do:

| From the same start | Mastery after |
|---|---|
| Answered correctly first try | 0.498 |
| Two wrong guesses, then correct | **0.612** |

Brute-forcing the four answer orbs finished *ahead* of simply knowing it.

The opportunity is now scored once, on the first attempt. A later success
on the same question still earns a reduced transfer, because working
through a repair genuinely teaches something, but it never counts as
having known the answer. The same rule governs everything downstream: the
bug hunt needs a clean answer (creatures could otherwise be caught by
guessing), the streak resets, the accuracy figure only counts first-try
answers, and the reward drops to the repair rate.

Guessing now gains nothing at all: one wrong tap or four, the child ends on
the same 0.286, against 0.498 for knowing it.

## The warm-up

The forgetting curve was the least visible thing in this engine and the
most interesting. It already decided what to offer next, but a child never
saw it happen: decay surfaced only as a purple star and a tile on the
grown-ups' dashboard.

A run now opens with up to three skills the child knew and is starting to
forget, most decayed first, under a plain banner: *"Warm up! Let's remember
this one."* The queue drains one skill per order and only while the skill
is still fading, since getting it right can lift it clear and there is no
sense drilling something the child has just shown they remember.

A learner with no history gets no warm-up, and neither does one who
practised the same day, so it never manufactures work to look busy.

### Captain Number knows your name

The title screen asks what to call you. It is optional and nothing gates
on it: a five-year-old may not be able to type yet, and a child who skips
it loses only the name in the cheers. It is kept to 12 characters, lives
in this browser's local storage, and never leaves the device.

Only every other cheer uses the name. Hearing it after every single answer
wears out fast, and the plain cheers in between are what keep the named
ones feeling like they were meant.

Two things about that were harder than they look, and both were caught by
tests rather than by looking:

- **The bubble is a fixed width**, so the real constraint is the longest
  line after wrapping, not the length of the cheer. A test that measured
  the whole string passed happily while *"You nailed it, Konstantinos!"*
  rendered 160px wide inside a 150px cloud. Cheers now wrap to at most two
  balanced lines, and the font steps down with the longest line.
- **Half the named cheers were unreachable.** Alternating with `n % 2`
  against a list of even length only ever names the even indices, so six
  of the twelve named variants were dead code no child could ever see. The
  pass number is now folded into that parity, so which half gets the name
  flips each time round the list.

### When the picture will not fit

17 x 15 is 255 dots. No screen shows that in a way a child can count, and an
earlier build handled it badly: it kept the two steppers and dropped the
array, so the child dialled in "17" and "15" to match numbers the prompt had
already given them, and saw nothing appear. The interaction only ever existed
to build the picture, so with no picture there was nothing left but busywork.

There are two different reasons an array can fail to fit, and they deserve
different answers:

- **The numbers are genuinely big.** That is a maths problem, so it gets the
  **area model**: 17 splits into 10 and 7, 15 into 10 and 5, and the rectangle
  becomes 10x10 + 10x5 + 7x10 + 7x5. The child taps each part to work it out,
  then adds them. This is how 4.NBT.B.5 is taught, and every part is a fact
  the child already owns.
- **The screen is small.** That is only a space problem, so the array is still
  drawn, read-only and shrunk to fit. A picture a child cannot poke still
  teaches; a control with nothing to show does not.

## Curriculum alignment

Every skill names the standard it targets, and the grown-up dashboard shows
that code beside the child's progress. The claim is checked rather than
asserted: `test/engine.test.ts` fails the build if a skill's generated
orders stop matching the skill's own description.

The tests that hold the line:

- decimal skills must emit actual decimals, not whole numbers
- volume must have a third dimension, not be an array with a new name
- order of operations must produce a question where evaluating
  left-to-right gives a *different* answer, or it cannot tell the two apart
- powers of ten must scale by an actual power of ten
- every fraction skill must be met as a bar, a pizza **and** a number line
- equivalent-fraction orders must actually be equivalent
- the stage a skill declares must be the stage its orders use

Decimals are stored as whole tenths and divided only for display, so
`0.1 + 0.2` is three tenths rather than `0.30000000000000004`. Misconception
analysis, distractor generation and equality checks all stay in integers.

### Fractions, in three pictures

A child who only ever meets fractions as a shaded strip learns the strip,
not the fraction: ask them to point at 3/4 on a line and they often cannot.
So every fraction skill rotates through three models of the same idea.

| Model | What it teaches |
|---|---|
| **Bar** | Part of a whole, laid out in a line |
| **Pizza** | The same part, wrapped into a circle, so the shape is not the point |
| **Number line** | The fraction as a *position*, which is its own standard (3.NF.A.2) and the one most often missed |

The number line matters most. Nothing is coloured in, so the only thing
carrying the meaning is where the marker sits. Only the two ends are
labelled: numbering every tick turns a length into a counting exercise and
hands over the answer.

When two fractions are in play, the one being matched, added to or divided
is drawn above the child's own in the same picture, so the comparison is
made by eye rather than by arithmetic.

### Sparks buy hints, and that is all they buy

A score that only goes up is not a reward, it is a decoration. Sparks are
the game's one currency and they have exactly one use: **hints**.

A stuck child should always be able to see a way forward that is not
guessing. **Hint** sits beside the puzzle, not buried in a menu. It costs
5 sparks, clears away two wrong orbs, and leaves a straight choice of two.
Solving still pays the full 10, so a hinted answer nets 5 instead of 10.
The price is printed on the button in the same star used by the counter in
the top bar, so a child can see what they are spending and what it costs.

Two rules keep it honest:

- **Every skill can ask for one.** The hint was built to thin out answer
  orbs, so orders answered by *building* rather than choosing never
  offered one, and four of the six Kindergarten skills had no help at all.
  The youngest children, on the first tasks they meet, had the least
  support. A bond order's hint places the first number instead: half the
  problem solved, the partner left to find.
- **A hinted answer is not evidence of mastery.** The reward and the
  learning signal are scored separately. The reward ignores hints, since
  the child already paid in stars and should not be charged twice. Mastery,
  accuracy, the streak and the bug hunt all mean "can do this unaided", so
  a hint disqualifies them exactly as a miss does: the same question
  answered alone moves mastery to 0.498, and answered with a hint to 0.217.
- **A hint is never a barrier.** A child short of stars still gets the
  hint; it just takes whatever they have. Anyone short of sparks is a
  beginner, which is exactly who needs help most, so the help is never
  withheld. An earlier version waived the cost entirely and the button
  read "free", which was worse than it sounds: a child's first hint is
  always taken at zero stars, so "hints are free" became the first thing
  the game taught about them. The button now always shows the real price.
- **Sparks never buy medals.** Medals mean *you mastered something*, and
  they are awarded only for crossing the mastery threshold on the Star Map
  or hitting the Your Way goal. If volume could buy them, grinding easy
  Kindergarten questions would earn the same badge as learning long
  division, and the game would be arguing against itself.

So sparks measure effort and pay for help. Medals, stars and caught bugs
measure learning. Nothing is hidden and nothing is punished.

### Shows you what to do, without words to read

A bouncing arrow points at whatever you should touch next, with a few
short words beside it, and it changes as you go: pick one orb toward a
target of 3 and the arrow updates to *"One more! Find 1"*.

Numbers can be **dragged onto the anvil or tapped** - dragging suits the
"push them together" metaphor, tapping stays because it is faster and is
the only route for anyone who cannot drag.

An earlier build narrated every prompt with speech synthesis. That has
been removed in favour of visual coaching: a robot voice reading the
order aloud was more intrusive than helpful, and arrows aimed at the
control you need do the same job for a non-reader without the noise.

### Every tap makes a sound
Procedural Web Audio, no asset files. Every pitched sound is drawn from a pentatonic
scale so nothing can clash however fast a child taps, and selecting orbs climbs the
scale so a run of picks sounds like progress.

---

### Devices

A static web app: anything with a modern browser. Measured, not eyeballed,
across six viewports with all six grade bands exercised on each.

| Device | Size | Result |
|---|---|---|
| iPhone SE / 8 | 375 x 667 | plays, forge scrolls |
| iPhone 12-16 | 375 x 812 | plays, fits |
| iPad portrait | 820 x 1180 | plays, fits |
| iPad landscape | 1180 x 820 | plays, fits |
| iPad Pro 12.9 | 1024 x 1366 | plays, fits |
| Desktop | 1440 x 900 | plays, fits |

Zero horizontal overflow and zero touch targets under 38px at every size.

On a phone the keypad stacks under the anvil, the top bar collapses to one icon
row, and a wide multiplication array falls back to steppers, because a big grid
cannot have both a readable rectangle and finger-sized cells on a 375px screen.

## Running it

```bash
npm install && npm run dev
```

Production build:

```bash
npm run build
```

Engine test suite, 52 assertions covering the skill graph, BKT, adaptive selection,
200 generated orders per skill, every misconception rule, every repair scene, and a
500-forge simulated learner:

```bash
npx esbuild test/engine.test.ts --bundle --format=esm --platform=node --outfile=/tmp/t.mjs && node /tmp/t.mjs
```

No backend, no API keys, no network. Works offline, deploys as static files.

---

## Demo notes

**Grown-ups → ✦ Load demo smith** seeds a learner with a few weeks of history, so the
constellation and dashboard are populated rather than empty. **⏩ Simulate a week / month**
fast-forwards the forgetting curve so you can watch mastery decay and the spaced-review
queue fill in real time.

Suggested three-minute run:

| Time | Beat |
|---|---|
| 0:00 | The thesis line, most maths games are a worksheet in a costume |
| 0:15 | Kindergarten: add two numbers to ten, guess it, BANG |
| 0:45 | Grade 3: drag out a 7 × 8 stamp, multiplication as an array |
| 1:15 | **Deliberately enter 25 for 34 - 19**, Flipsy pops out and joins the jar |
| 1:35 | Get it right three times, catch Flipsy, he turns friendly |
| 1:50 | Strategy token: "I made a ten" pays more than being fast |
| 2:10 | Constellation, then simulate a month and watch stars dim |
| 1:50 | Teach Pip: spot Pip's mistake and name it |
| 2:05 | Open Forge: five ways to make 20, medal at the goal |
| 2:20 | The Bug Jar: fifteen creatures, all generated from real mistakes |
| 2:35 | For Grown-Ups: mastery, misconceptions, review queue |

The 1:15 beat is the money shot. Rehearse that one.

---

## Stack

React 18 · TypeScript · Vite · Tailwind v4 · Framer Motion · Zustand · Web Audio
(procedural, zero audio assets, every pitched sound is drawn from a pentatonic scale so
nothing can clash however fast a child taps) · localStorage.

**Art direction, "Toybox":** warm paper, thick charcoal ink, hard offset shadows,
saturated toy colour. Every icon is hand-drawn on a single 24px grid at one stroke weight;
there is no emoji anywhere in the interface. Design tokens live in `src/styles/index.css`,
the shared element vocabulary in `src/components/ui.tsx`, the icon set in
`src/components/Icon.tsx`. Alternative directions are mocked up in `design/directions.html`.
