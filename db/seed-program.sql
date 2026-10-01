-- Latihan — training program: 3x full body + cardio + HIIT, plus daily walking
--
-- Run after db/schema.sql:
--   psql "$DATABASE_URL" -f db/seed-program.sql
--
-- Goal: waist circumference and visceral fat. That shapes three choices here.
--
-- Full body three times a week, not a split. At three sessions the squat,
-- hinge, push and pull patterns each get trained three times instead of once,
-- which is what drives progress at entry-level loads.
--
-- Compound lifts carry the session. Nothing targets the waist directly —
-- spot reduction is not a thing — so the abdominal work here is trunk
-- stability, and the fat loss comes from the whole week's energy balance.
--
-- Cardio is zone 2 by default, with one HIIT slot. Zone 2 is easy to recover
-- from alongside three lifting days; making every cardio session hard would
-- eat into the strength work.
--
-- Target weights start from the loads already in the logs, rounded to
-- something beatable. They are a starting point, not a ceiling.
--
-- Safe to re-run, but it resets programs and schedule to exactly what is
-- written here. workout_logs keeps its own session names, so history under
-- earlier programs (Upper/Lower, Push/Pull/Legs) stays readable.
--
-- Week: Full Body A · Cardio · Full Body B · HIIT · Full Body C · Cardio · rest

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
  ('Hip Thrust',          'Glutes',     'Barbell',  'Upper back on the bench. Drive through your heels, lock out your glutes at the top, chin tucked.'),
  ('Calf Raise',          'Calves',     'Machine',  'Full range of motion — lower into a stretch, rise onto your toes as high as you can. Hold at the top.'),
  -- Cardio
  ('Treadmill',           'Cardio', 'Machine', 'Zone 2: you should still be able to hold a conversation while walking or running. Stand tall and don''t hold the rails.'),
  ('Stationary Bike',     'Cardio', 'Machine', 'Seat at hip height. Cadence 80–90 rpm, moderate resistance.'),
  ('Rowing Machine',      'Cardio', 'Machine', 'Order: push with the legs → swing the body → pull with the arms. Reverse the order on the way back.'),
  -- Core
  ('Plank',        'Core', 'Bodyweight', 'Elbows under shoulders, body in one line from head to heels. Brace your abs and glutes and don''t let your hips sag. Keep breathing.'),
  ('Dead Bug',     'Core', 'Bodyweight', 'Keep your lower back pressed into the floor the whole time — that is the point. Lower opposite arm and leg slowly and stop before your back arches.'),
  ('Pallof Press', 'Core', 'Cable',      'Stand side-on to the cable, press the handle straight out and hold. Resist the pull to rotate; don''t let your torso turn with it. This is anti-rotation work.'),
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

-- Weekly schedule. Day names must match DAY_NAMES in src/lib/streak.js.
delete from schedule;

insert into schedule (day_of_week, session, notes) values
  ('Monday',    'Full Body A', 'Squat focus'),
  ('Tuesday',   'Cardio',      'Zone 2, 30-45 min'),
  ('Wednesday', 'Full Body B', 'Deadlift focus'),
  ('Thursday',  'HIIT',        '15-20 min, hard'),
  ('Friday',    'Full Body C', 'Machines & glutes'),
  ('Saturday',  'Cardio',      'Optional, keep it easy'),
  ('Sunday',    'REST',        'A proper day off');

-- Program. Warm-ups sort below zero, main work from 1, cool-downs from 90.
delete from programs;

insert into programs
  (session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order) values

  -- Full Body A — squat pattern leads
  ('Full Body A', 'Jumping Jacks / Brisk Walk',            1, '3 min',            0,   0,   -4),
  ('Full Body A', 'Leg Swings',                            1, '10x per leg',      0,   0,   -3),
  ('Full Body A', 'Arm Circles',                           1, '20x each direction', 0, 0,   -2),
  ('Full Body A', 'Bodyweight Squat (Warm Up)',            1, '15x',              0,   0,   -1),
  ('Full Body A', 'Squat',                                 3, '8-12',           120,  10,    1),
  ('Full Body A', 'Bench Press',                           3, '8-12',            90,  12.5,  2),
  ('Full Body A', 'Seated Cable Row',                      3, '10-12',           90,  32,    3),
  ('Full Body A', 'Romanian Deadlift',                     2, '10-12',           90,  20,    4),
  ('Full Body A', 'Plank',                                 3, '30-45 sec',       60,   0,    5),
  ('Full Body A', 'Hamstring Stretch',                     1, '30 sec per side',  0,   0,   90),
  ('Full Body A', 'Quad Stretch',                          1, '30 sec per side',  0,   0,   91),

  -- Full Body B — hinge pattern leads
  ('Full Body B', 'Jumping Jacks / Brisk Walk',            1, '3 min',            0,   0,   -4),
  ('Full Body B', 'Glute Bridge',                          1, '15x',              0,   0,   -3),
  ('Full Body B', 'Band Pull-Apart',                       1, '15x',              0,   0,   -2),
  ('Full Body B', 'Cat-Cow',                               1, '10x',              0,   0,   -1),
  ('Full Body B', 'Deadlift',                              3, '6-8',            150,  30,    1),
  ('Full Body B', 'Overhead Press',                        3, '8-10',            90,  10,    2),
  ('Full Body B', 'Lat Pulldown',                          3, '10-12',           90,  25,    3),
  ('Full Body B', 'Walking Lunge',                         2, '12 per leg',      90,  14,    4),
  ('Full Body B', 'Dead Bug',                              3, '10 per side',     60,   0,    5),
  ('Full Body B', 'Hip Flexor Stretch',                    1, '30 sec per side',  0,   0,   90),
  ('Full Body B', 'Hamstring Stretch',                     1, '30 sec per side',  0,   0,   91),

  -- Full Body C — machines and glutes, easiest to push load on
  ('Full Body C', 'Jumping Jacks / Brisk Walk',            1, '3 min',            0,   0,   -4),
  ('Full Body C', 'Hip Circles',                           1, '10x each direction', 0, 0,   -3),
  ('Full Body C', 'Scapular Push-Up',                      1, '10x',              0,   0,   -2),
  ('Full Body C', 'Arm Circles',                           1, '20x each direction', 0, 0,   -1),
  ('Full Body C', 'Leg Press',                             3, '10-15',           90,  45,    1),
  ('Full Body C', 'Incline DB Press',                      3, '10-12',           90,  10,    2),
  ('Full Body C', 'Bent Over Row',                         3, '8-12',            90,  20,    3),
  ('Full Body C', 'Hip Thrust',                            3, '10-15',           90,  30,    4),
  ('Full Body C', 'Pallof Press',                          3, '12 per side',     60,  10,    5),
  ('Full Body C', 'Quad Stretch',                          1, '30 sec per side',  0,   0,   90),
  ('Full Body C', 'Child''s Pose / Cat-Cow (Cool Down)',   1, '1 min',            0,   0,   91),

  -- Cardio — steady, zone 2
  ('Cardio', 'Jumping Jacks / Brisk Walk',                 1, '3 min',            0,   0,   -1),
  ('Cardio', 'Treadmill',                                  1, '30-45 min',        0,   0,    1),
  ('Cardio', 'Easy Walk / Light Cycling (Cool Down)',      1, '5 min',            0,   0,   90),

  -- HIIT — the one hard cardio slot
  ('HIIT',   'Jumping Jacks / Brisk Walk',                 1, '5 min',            0,   0,   -1),
  ('HIIT',   'HIIT Interval',                              1, '15-20 min',        0,   0,    1),
  ('HIIT',   'Easy Walk / Light Cycling (Cool Down)',      1, '5 min',            0,   0,   90);

commit;
