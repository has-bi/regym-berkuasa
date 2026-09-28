-- Latihan — Push / Pull / Legs program, in English
--
-- Run after db/schema.sql:
--   psql "$DATABASE_URL" -f db/program-ppl.sql
--
-- Replaces the whole program and weekly schedule, and rewrites the exercise
-- catalogue in English. Workout history is kept; only the two exercises whose
-- names were Indonesian are renamed in it, so their records stay attached.
--
-- Safe to re-run, but it resets programs and schedule to exactly what is
-- written here — edits made in the database since will be overwritten.
--
-- Week: Push · Pull · Legs · rest · Upper · Conditioning · rest

begin;

-- Renames first, so history and the catalogue agree on the new names.
update exercises    set name = 'Jumping Jacks / Brisk Walk'            where name = 'Jumping Jack / Jalan Cepat';
update exercises    set name = 'Easy Walk / Light Cycling (Cool Down)' where name = 'Jalan Santai / Light Cycling (Cool Down)';
update workout_logs set exercise_name = 'Jumping Jacks / Brisk Walk'            where exercise_name = 'Jumping Jack / Jalan Cepat';
update workout_logs set exercise_name = 'Easy Walk / Light Cycling (Cool Down)' where exercise_name = 'Jalan Santai / Light Cycling (Cool Down)';

-- Conditioning is the same session under its English name; Upper A/B and
-- Lower A/B are left as they were, because that is what was actually trained.
update workout_logs set session = 'Conditioning' where session = 'Kondisioning';

-- Exercise catalogue. video_url is left untouched on existing rows.
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

-- Program. Warm-ups sort below zero, main lifts from 1, cool-downs from 90.
delete from programs;

insert into programs (session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order) values
  -- Push: chest, shoulders, triceps
  ('Push', 'Jumping Jacks / Brisk Walk', 1, '2-3 min',              0,   0, -5),
  ('Push', 'Arm Circles',                1, '20x each direction',   0,   0, -4),
  ('Push', 'Band Pull-Apart',            1, '15x',                  0,   0, -3),
  ('Push', 'Scapular Push-Up',           1, '10x',                  0,   0, -2),
  ('Push', 'Cat-Cow',                    1, '10x',                  0,   0, -1),
  ('Push', 'Bench Press',                4, '6-10',               120,  20,  1),
  ('Push', 'Overhead Press',             3, '8-10',                90,  20,  2),
  ('Push', 'Incline DB Press',           3, '10-12',               90,  10,  3),
  ('Push', 'Cable Fly',                  3, '12-15',               60,  15,  4),
  ('Push', 'Lateral Raise',              3, '12-15',               60,   8,  5),
  ('Push', 'Tricep Pushdown',            3, '10-12',               60,  20,  6),
  ('Push', 'Chest Stretch',              1, '30 sec per side',      0,   0, 90),
  ('Push', 'Child''s Pose / Cat-Cow (Cool Down)',   1, '1 min',     0,   0, 91),
  ('Push', 'Easy Walk / Light Cycling (Cool Down)', 1, '2-3 min',   0,   0, 92),

  -- Pull: back, rear delts, biceps
  ('Pull', 'Jumping Jacks / Brisk Walk', 1, '2-3 min',              0,   0, -5),
  ('Pull', 'Arm Circles',                1, '20x each direction',   0,   0, -4),
  ('Pull', 'Band Pull-Apart',            1, '15x',                  0,   0, -3),
  ('Pull', 'Glute Bridge',               1, '15x',                  0,   0, -2),
  ('Pull', 'Cat-Cow',                    1, '10x',                  0,   0, -1),
  ('Pull', 'Deadlift',                   3, '5-8',                150,  20,  1),
  ('Pull', 'Lat Pulldown',               4, '8-12',                90,  40,  2),
  ('Pull', 'Seated Cable Row',           3, '10-12',               90,  35,  3),
  ('Pull', 'Face Pull',                  3, '15',                  60,  10,  4),
  ('Pull', 'Bicep Curl',                 3, '10-12',               60,  12,  5),
  ('Pull', 'Hammer Curl',                3, '10-12',               60,  10,  6),
  ('Pull', 'Lat Stretch',                1, '30 sec per side',      0,   0, 90),
  ('Pull', 'Hamstring Stretch',          1, '30 sec per side',      0,   0, 91),
  ('Pull', 'Easy Walk / Light Cycling (Cool Down)', 1, '2-3 min',   0,   0, 92),

  -- Legs: quads, hamstrings, calves
  ('Legs', 'Jumping Jacks / Brisk Walk', 1, '3 min',                0,   0, -6),
  ('Legs', 'Bodyweight Squat (Warm Up)', 1, '15x',                  0,   0, -5),
  ('Legs', 'Leg Swings',                 1, '10x per leg each direction', 0, 0, -4),
  ('Legs', 'Hip Circles',                1, '10x each direction',   0,   0, -3),
  ('Legs', 'Glute Bridge',               1, '15x',                  0,   0, -2),
  ('Legs', 'World''s Greatest Stretch',  1, '5x per side',          0,   0, -1),
  ('Legs', 'Squat',                      4, '6-10',               120,  20,  1),
  ('Legs', 'Romanian Deadlift',          3, '8-12',                90,  20,  2),
  ('Legs', 'Leg Press',                  3, '10-15',               90,  80,  3),
  ('Legs', 'Leg Curl',                   3, '10-12',               60,  30,  4),
  ('Legs', 'Leg Extension',              3, '12-15',               60,  30,  5),
  ('Legs', 'Calf Raise',                 4, '15-20',               45,  40,  6),
  ('Legs', 'Hip Flexor Stretch',         1, '30 sec per side',      0,   0, 90),
  ('Legs', 'Hamstring Stretch',          1, '30 sec per side',      0,   0, 91),
  ('Legs', 'Quad Stretch',               1, '30 sec per side',      0,   0, 92),
  ('Legs', 'Child''s Pose / Cat-Cow (Cool Down)',   1, '1 min',     0,   0, 93),
  ('Legs', 'Easy Walk / Light Cycling (Cool Down)', 1, '2-3 min',   0,   0, 94),

  -- Upper: push and pull again with different angles, for twice-weekly upper frequency
  ('Upper', 'Jumping Jacks / Brisk Walk', 1, '2-3 min',             0,   0, -5),
  ('Upper', 'Arm Circles',                1, '20x each direction',  0,   0, -4),
  ('Upper', 'Band Pull-Apart',            1, '15x',                 0,   0, -3),
  ('Upper', 'Scapular Push-Up',           1, '10x',                 0,   0, -2),
  ('Upper', 'Cat-Cow',                    1, '10x',                 0,   0, -1),
  ('Upper', 'Incline Bench Press',        4, '8-10',               90,  20,  1),
  ('Upper', 'Pull Up',                    3, 'AMRAP',              90,   0,  2),
  ('Upper', 'Bent Over Row',              3, '8-10',               90,  20,  3),
  ('Upper', 'Lateral Raise',              3, '15',                 60,   8,  4),
  ('Upper', 'Skull Crusher',              3, '10-12',              60,  12,  5),
  ('Upper', 'Hammer Curl',                3, '12',                 60,  10,  6),
  ('Upper', 'Chest Stretch',              1, '30 sec per side',     0,   0, 90),
  ('Upper', 'Lat Stretch',                1, '30 sec per side',     0,   0, 91),
  ('Upper', 'Easy Walk / Light Cycling (Cool Down)', 1, '2-3 min',  0,   0, 92),

  -- Conditioning
  ('Conditioning', 'Jumping Jacks / Brisk Walk', 1, '3 min',        0,   0, -2),
  ('Conditioning', 'Leg Swings',          1, '2 min (dynamic: leg swings, arm circles, torso twist)', 0, 0, -1),
  ('Conditioning', 'Treadmill',           1, '30 min',              0,   0,  1),
  ('Conditioning', 'Stationary Bike',     1, '20 min',              0,   0,  2),
  ('Conditioning', 'Easy Walk / Light Cycling (Cool Down)', 1, '2-3 min', 0, 0, 90),
  ('Conditioning', 'Quad Stretch',        1, '30 sec per side',     0,   0, 91),
  ('Conditioning', 'Hamstring Stretch',   1, '30 sec per side',     0,   0, 92);

-- Weekly schedule. Day names must match DAY_NAMES in src/lib/streak.js.
delete from schedule;

insert into schedule (day_of_week, session, notes) values
  ('Monday',    'Push',         ''),
  ('Tuesday',   'Pull',         ''),
  ('Wednesday', 'Legs',         ''),
  ('Thursday',  'REST',         'Recovery — an easy walk is fine'),
  ('Friday',    'Upper',        ''),
  ('Saturday',  'Conditioning', ''),
  ('Sunday',    'REST',         'Full rest');

commit;
