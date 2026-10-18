-- Latihan — Foundation block: recovery, then fundamentals, plus 1 cardio day
--
-- Run after db/schema.sql:
--   psql "$DATABASE_URL" -f db/seed-program.sql
--
-- Why this block: a lower-back tweak on a barbell squat (18 Oct 2026) after
-- the squat load climbed quickly. The cause was technique plus load, not a
-- weak core, so the fix is the whole picture: easier variations that teach
-- the squat and hinge patterns, trunk stability, and slower load increases.
-- Core work alone would not do it, and would not move waist fat either.
--
--   Recovery     while the back still hurts (typically 1-2 weeks): no loaded
--                squat, hinge, lunge or bent-over row. Upper body on machines
--                and cables, the McGill "big three" (curl-up, side plank, bird
--                dog), glute bridges, easy cycling. Everything pain-free.
--   Foundation   A/B/C for 3-4 weeks once it is pain-free: goblet box squat,
--                dumbbell RDL, split squat, chest-supported rows, seated
--                presses, core three times a week. Leg loads rise at most
--                2.5 kg a session (src/lib/progression.js); stop ~3 reps
--                short of failure; film a set from the side now and then.
--   Cardio Day   unchanged: cycling and treadmill are kind to the back, and
--                vigorous cardio is what moves visceral fat.
--
-- The scheduled days are Foundation; Recovery is offered first on the Lift
-- screen for a week after a note tagged Pain / injury. The full-body block
-- this replaced is kept in db/blocks/full-body.sql for afterwards.
--
-- Safe to re-run, but it resets programs and schedule to exactly what is
-- written here. workout_logs keeps its own session names.
--
-- Week: Foundation A · rest · Foundation B · rest · Foundation C · Cardio Day · rest

begin;

-- Renames first, so history and the catalogue agree on the English names.
-- No-ops once applied.
update exercises    set name = 'Jumping Jacks / Brisk Walk'            where name = 'Jumping Jack / Jalan Cepat';
update exercises    set name = 'Easy Walk / Light Cycling (Cool Down)' where name = 'Jalan Santai / Light Cycling (Cool Down)';
update workout_logs set exercise_name = 'Jumping Jacks / Brisk Walk'            where exercise_name = 'Jumping Jack / Jalan Cepat';
update workout_logs set exercise_name = 'Easy Walk / Light Cycling (Cool Down)' where exercise_name = 'Jalan Santai / Light Cycling (Cool Down)';
update workout_logs set session = 'Conditioning' where session = 'Kondisioning';

-- Exercise catalogue, in English. video_url is left untouched on existing rows.
insert into exercises (name, muscle_group, equipment, cues) values
  -- Chest
  ('Bench Press',         'Chest', 'Barbell',  'Pull your shoulder blades back and down. Lower the bar to your lower chest, elbows about 45° from your body. Drive your feet into the floor and keep your hips on the bench.'),
  ('Incline Bench Press', 'Chest', 'Barbell',  'Bench at 30–45°. Lower the bar to your upper chest, just under the collarbone. Keep your elbows stacked under your wrists.'),
  ('Incline DB Press',    'Chest', 'Dumbbell', 'Lower the dumbbells until they are level with your chest and pause briefly. Don''t clank them together at the top.'),
  ('Cable Fly',           'Chest', 'Cable',    'Keep a slight, fixed bend in the elbows (don''t lock them straight). Move like you are hugging a tree and feel the stretch in your chest, not your shoulders.'),
  -- Back
  ('Deadlift',            'Posterior Chain', 'Barbell',    'Bar close to your shins. Keep your back neutral, push the floor away with your legs, and lock out your hips at the top.'),
  ('Bent Over Row',       'Back', 'Barbell',    'Neutral back, torso at about 45°. Pull the bar to your lower stomach with your elbows brushing your sides.'),
  ('Lat Pulldown',        'Back', 'Cable',      'Chest up and pull the bar to your upper chest. Think about driving your elbows into your back pockets, not pulling with your hands.'),
  ('Seated Cable Row',    'Back', 'Cable',      'Sit tall and don''t swing your torso. Squeeze your shoulder blades together at the end of each rep.'),
  ('Pull Up',             'Back', 'Bodyweight', 'Start from a full hang with active shoulders. Pull until your chin clears the bar and lower under control.'),
  -- Shoulders
  ('Overhead Press',      'Shoulders', 'Barbell',  'Squeeze your glutes and brace your core. Move the bar past your chin, then push your head through under the bar at the top.'),
  ('Lateral Raise',       'Shoulders', 'Dumbbell', 'Go light. Raise out to the sides until level with your shoulders, elbows slightly bent, no momentum.'),
  ('Face Pull',           'Shoulders', 'Cable',    'Set the cable at face height. Pull toward your face (not just your forehead), flare your elbows wide, and rotate your shoulders out at the end.'),
  -- Arms
  ('Bicep Curl',          'Biceps',  'Dumbbell', 'Pin your elbows to your sides. Curl without swinging your back and lower slowly.'),
  ('Hammer Curl',         'Biceps',  'Dumbbell', 'Palms face each other the whole way. Focus on the brachialis and forearms.'),
  ('Tricep Pushdown',     'Triceps', 'Cable',    'Elbows stay glued to your sides. Only your forearms move; lock out fully at the bottom.'),
  ('Skull Crusher',       'Triceps', 'Barbell',  'Keep your elbows pointing up. Lower the bar toward your forehead without flaring your elbows.'),
  -- Legs
  ('Squat',               'Quads',      'Barbell',  'Feet shoulder-width apart, knees tracking over your toes. Sit down until your thighs are at least parallel to the floor, chest up.'),
  ('Leg Press',           'Quads',      'Machine',  'Don''t lock your knees at the top. Lower until your knees are around 90°, keeping your lower back against the pad.'),
  ('Leg Extension',       'Quads',      'Machine',  'Straighten fully and hold for 1 second. Lower slowly; don''t let the weight drop.'),
  ('Walking Lunge',       'Quads',      'Dumbbell', 'Take a long enough stride that your back knee nearly touches the floor. Stay upright.'),
  ('Romanian Deadlift',   'Hamstrings', 'Barbell',  'Keep a slight, fixed bend in the knees (don''t lock them straight). Push your hips back, slide the bar down your thighs, and feel the pull in your hamstrings.'),
  ('Leg Curl',            'Hamstrings', 'Machine',  'Controlled reps, no jerking. Pause briefly at the top of the contraction.'),
  ('Hip Thrust',          'Glutes',     'Bodyweight', 'Upper back on the bench. Drive through your heels, lock out your glutes at the top, chin tucked. Add reps first; a plate on the hips comes later.'),
  ('Calf Raise',          'Calves',     'Machine',  'Full range of motion — lower into a stretch, rise onto your toes as high as you can. Hold at the top.'),
  -- Cardio
  ('Treadmill',           'Cardio', 'Machine', 'Zone 2: you should still be able to hold a conversation while walking or running. Stand tall and don''t hold the rails.'),
  ('Stationary Bike',     'Cardio', 'Machine', 'Seat at hip height. Cadence 80–90 rpm, moderate resistance.'),
  ('Rowing Machine',      'Cardio', 'Machine', 'Order: push with the legs → swing the body → pull with the arms. Reverse the order on the way back.'),
  -- Core
  ('Curl-Up',      'Core', 'Bodyweight', 'McGill curl-up: one knee bent, hands under the small of your back so it keeps its natural curve. Lift head and shoulders a few centimetres as one unit, hold 10 seconds. The spine does not flex.'),
  ('Side Plank',   'Core', 'Bodyweight', 'Elbow under shoulder, knees bent to start, hips in line with your body. Hold without letting the hips drop or rotate. Straight legs once 30 seconds is easy.'),
  ('Bird Dog',     'Core', 'Bodyweight', 'On hands and knees, reach one arm and the opposite leg out until level, hold 10 seconds without the back arching or the hips tipping. Small movement, big brace.'),
  ('Plank',        'Core', 'Bodyweight', 'Elbows under shoulders, body in one line from head to heels. Brace your abs and glutes and don''t let your hips sag. Keep breathing.'),
  ('Dead Bug',     'Core', 'Bodyweight', 'Keep your lower back pressed into the floor the whole time — that is the point. Lower opposite arm and leg slowly and stop before your back arches.'),
  ('Pallof Press', 'Core', 'Cable',      'Stand side-on to the cable, press the handle straight out and hold. Resist the pull to rotate; don''t let your torso turn with it. This is anti-rotation work.'),
  -- Foundation lifts: easier versions that teach the pattern
  ('Goblet Box Squat',            'Quads',      'Dumbbell',   'Hold one dumbbell at your chest, elbows down. Sit back to a box or bench, touch it lightly, stand up. The box sets the depth, so the back never rounds at the bottom.'),
  ('Dumbbell Romanian Deadlift',  'Hamstrings', 'Dumbbell',   'Dumbbells against your thighs, soft knees. Push the hips back until you feel the hamstrings, then stand by driving the hips forward. Stop where the back would start to round.'),
  ('Split Squat',                 'Quads',      'Dumbbell',   'Long stance, back heel up. Drop the back knee straight down toward the floor and push up through the front foot. Start with bodyweight; add dumbbells once 10 per leg is easy.'),
  ('Chest-Supported Row',         'Back',       'Dumbbell',   'Chest on an incline bench, dumbbells hanging. Row the elbows back to your hips and squeeze the shoulder blades. The bench carries the torso, so the lower back stays out of it.'),
  ('Seated Dumbbell Press',       'Shoulders',  'Dumbbell',   'Seated with your back against an upright bench. Press the dumbbells overhead without arching away from the pad.'),
  ('Hip Hinge Drill',             'Warm Up',    'Bodyweight', '10x. A stick along your spine touching head, upper back and tailbone; push the hips back without losing any contact point. Teaches the hinge before any load.'),
  -- Cardio, continued
  ('HIIT Interval', 'Cardio', 'Machine', 'After the warm-up: 30 seconds hard, 90 seconds easy, repeat for 8-10 rounds. Treadmill, bike or rower all work. The hard part has to be genuinely hard.'),
  -- Daily walking, outside sessions
  ('Walking',       'NEAT',   'Bodyweight', 'Easy walking outside your training sessions. What counts is the daily total, not the intensity.'),
  -- Warm up
  ('Jumping Jacks / Brisk Walk', 'Warm Up', 'Bodyweight', '2-3 min. Raise your heart rate and body temperature before mobility work.'),
  ('Arm Circles',                'Warm Up', 'Bodyweight', '20x each direction (small to large). Loosens up the shoulders before an upper body day.'),
  ('Band Pull-Apart',            'Warm Up', 'Band (optional, works without)', '15x. Activates the upper back; important before rows and pulldowns.'),
  ('Scapular Push-Up',           'Warm Up', 'Bodyweight', '10x from a plank or push-up position, moving only your shoulder blades. Activates the scapula before pressing.'),
  ('Cat-Cow',                    'Warm Up', 'Bodyweight', '10x. Mobilises the spine, especially if your back still feels stiff.'),
  ('Bodyweight Squat (Warm Up)', 'Warm Up', 'Bodyweight', '15x with no weight. Grooves the movement pattern before loading up on leg day.'),
  ('Leg Swings',                 'Warm Up', 'Bodyweight', '10x per leg each direction (front-back and side to side), holding a wall or rack. Mobilises the hips.'),
  ('Hip Circles',                'Warm Up', 'Bodyweight', '10x each direction. Mobilises the hip joint before squats and deadlifts.'),
  ('Glute Bridge',               'Warm Up', 'Bodyweight', '15x. Activates the glutes before RDLs, hip thrusts and deadlifts.'),
  ('World''s Greatest Stretch',  'Warm Up', 'Bodyweight', '5x per side. Lunge plus a torso rotation; opens the hip flexors and thoracic spine in one go.'),
  -- Cool down
  ('Chest Stretch',                         'Cool Down', 'Bodyweight',         '30 sec per side. Hold a wall or rack and rotate your body away. Do it after bench or incline pressing.'),
  ('Lat Stretch',                           'Cool Down', 'Bodyweight',         '30 sec per side. Arm overhead, lean to the side. Do it after pulldowns and rows.'),
  ('Hamstring Stretch',                     'Cool Down', 'Bodyweight',         '30 sec per side. Leg straight in front of you, or stand and reach for your toes. Essential after RDLs and deadlifts.'),
  ('Hip Flexor Stretch',                    'Cool Down', 'Bodyweight',         '30 sec per side. Hold a lunge position. Essential after squats, deadlifts and lunges.'),
  ('Quad Stretch',                          'Cool Down', 'Bodyweight',         '30 sec per side. Stand and pull your heel toward your glutes. Do it after squats, leg press and leg extensions.'),
  ('Child''s Pose / Cat-Cow (Cool Down)',   'Cool Down', 'Bodyweight',         '1 min. Relaxes the spine, especially after leg day.'),
  ('Easy Walk / Light Cycling (Cool Down)', 'Cool Down', 'Bodyweight/Machine', '2-3 min. Bring your heart rate down gradually instead of stopping hard after intense work.')
on conflict (name) do update
  set muscle_group = excluded.muscle_group,
      equipment    = excluded.equipment,
      cues         = excluded.cues;

-- Weekly schedule. Day names must match DAY_NAMES in src/lib/schedule.js.
delete from schedule;

insert into schedule (day_of_week, session, notes) values
  ('Monday',    'Foundation A', 'Squat pattern · ~55 min with finisher'),
  ('Tuesday',   'REST',         'Walk if you feel like it'),
  ('Wednesday', 'Foundation B', 'Hinge pattern · ~55 min with finisher'),
  ('Thursday',  'REST',         'Walk if you feel like it'),
  ('Friday',    'Foundation C', 'Single leg & machines · ~50 min'),
  ('Saturday',  'Cardio Day',   'Intervals, then zone 2 · ~50 min'),
  ('Sunday',    'REST',         'A proper day off');

-- Program. Warm-ups sort below zero, main work from 1, cool-downs from 90.
delete from programs;

insert into programs
  (session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order) values

  -- Recovery — while the back hurts. Stop anything that hurts.
  ('Recovery', 'Cat-Cow',                               1, '10x',               0,   0,   -2),
  ('Recovery', 'Glute Bridge',                          1, '15x',               0,   0,   -1),
  ('Recovery', 'Stationary Bike',                       1, '15 min, easy',      0,   0,    1),
  ('Recovery', 'Lat Pulldown',                          3, '10-12',            90,  27,    2),
  ('Recovery', 'Seated Cable Row',                      3, '10-12',            90,  30,    3),
  ('Recovery', 'Bench Press',                           3, '8-12',             90,  40,    4),
  ('Recovery', 'Curl-Up',                               3, '5 x 10 sec hold',  45,   0,    5),
  ('Recovery', 'Side Plank',                            3, '20-30 sec per side', 45, 0,    6),
  ('Recovery', 'Bird Dog',                              3, '6 per side, 10 sec hold', 45, 0, 7),
  ('Recovery', 'Easy Walk / Light Cycling (Cool Down)', 1, '5 min',             0,   0,   90),

  -- Foundation A — squat pattern
  ('Foundation A', 'Jumping Jacks / Brisk Walk',        1, '3 min',             0,   0,   -4),
  ('Foundation A', 'Cat-Cow',                           1, '10x',               0,   0,   -3),
  ('Foundation A', 'Bodyweight Squat (Warm Up)',        1, '15x',               0,   0,   -2),
  ('Foundation A', 'Glute Bridge',                      1, '15x',               0,   0,   -1),
  ('Foundation A', 'Goblet Box Squat',                  3, '8-10',             90,  10,    1),
  ('Foundation A', 'Bench Press',                       3, '8-12',             90,  40,    2),
  ('Foundation A', 'Seated Cable Row',                  3, '10-12',            90,  30,    3),
  ('Foundation A', 'Curl-Up',                           3, '5 x 10 sec hold',  45,   0,    4),
  ('Foundation A', 'Side Plank',                        3, '20-30 sec per side', 45, 0,    5),
  ('Foundation A', 'Stationary Bike',                   1, '15 min, zone 2',    0,   0,   90),
  ('Foundation A', 'Hamstring Stretch',                 1, '30 sec per side',   0,   0,   91),
  ('Foundation A', 'Quad Stretch',                      1, '30 sec per side',   0,   0,   92),

  -- Foundation B — hinge pattern
  ('Foundation B', 'Jumping Jacks / Brisk Walk',        1, '3 min',             0,   0,   -4),
  ('Foundation B', 'Cat-Cow',                           1, '10x',               0,   0,   -3),
  ('Foundation B', 'Hip Hinge Drill',                   1, '10x',               0,   0,   -2),
  ('Foundation B', 'Glute Bridge',                      1, '15x',               0,   0,   -1),
  ('Foundation B', 'Dumbbell Romanian Deadlift',        3, '10-12',            90,  10,    1),
  ('Foundation B', 'Seated Dumbbell Press',             3, '8-10',             90,   8,    2),
  ('Foundation B', 'Lat Pulldown',                      3, '10-12',            90,  27,    3),
  ('Foundation B', 'Hip Thrust',                        3, '12-15',            60,   0,    4),
  ('Foundation B', 'Bird Dog',                          3, '6 per side, 10 sec hold', 45, 0, 5),
  ('Foundation B', 'Treadmill',                         1, '15 min incline walk, zone 2', 0, 0, 90),
  ('Foundation B', 'Hip Flexor Stretch',                1, '30 sec per side',   0,   0,   91),
  ('Foundation B', 'Hamstring Stretch',                 1, '30 sec per side',   0,   0,   92),

  -- Foundation C — single leg and machines
  ('Foundation C', 'Jumping Jacks / Brisk Walk',        1, '3 min',             0,   0,   -4),
  ('Foundation C', 'Hip Circles',                       1, '10x each direction', 0,  0,   -3),
  ('Foundation C', 'Scapular Push-Up',                  1, '10x',               0,   0,   -2),
  ('Foundation C', 'Glute Bridge',                      1, '15x',               0,   0,   -1),
  ('Foundation C', 'Split Squat',                       3, '8-10 per leg',     90,   0,    1),
  ('Foundation C', 'Leg Press',                         3, '12-15',            90,  35,    2),
  ('Foundation C', 'Incline DB Press',                  3, '10-12',            90,  20,    3),
  ('Foundation C', 'Chest-Supported Row',               3, '10-12',            90,  12,    4),
  ('Foundation C', 'Pallof Press',                      3, '12 per side',      60,  10,    5),
  ('Foundation C', 'Dead Bug',                          3, '10 per side',      45,   0,    6),
  ('Foundation C', 'Quad Stretch',                      1, '30 sec per side',   0,   0,   90),
  ('Foundation C', 'Child''s Pose / Cat-Cow (Cool Down)', 1, '1 min',           0,   0,   91),

  -- Cardio Day — unchanged
  ('Cardio Day', 'Jumping Jacks / Brisk Walk',             1, '5 min',            0,   0,   -1),
  ('Cardio Day', 'HIIT Interval',                          1, '6-10 rounds: 30s hard / 90s easy', 0, 0, 1),
  ('Cardio Day', 'Treadmill',                              1, '20-25 min, zone 2', 0,  0,    2),
  ('Cardio Day', 'Easy Walk / Light Cycling (Cool Down)',  1, '5 min',            0,   0,   90),
  ('Cardio Day', 'Hamstring Stretch',                      1, '30 sec per side',  0,   0,   91),
  ('Cardio Day', 'Quad Stretch',                           1, '30 sec per side',  0,   0,   92);

commit;
