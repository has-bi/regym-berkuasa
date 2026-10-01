-- Program: 3x strength (full body) + 2-3x cardio/HIIT + daily walking
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
-- Safe to re-run: the old program rows are removed first, and workout_logs is
-- never touched, so training history survives intact.

begin;

-- ---------------------------------------------------------------- exercises
-- Only the ones the new program needs that are not already there.
insert into exercises (name, muscle_group, equipment, cues, video_url) values
  ('Plank', 'Core', 'Bodyweight',
   'Siku di bawah bahu, badan satu garis dari kepala sampai tumit. Kencengin perut dan glutes, jangan biarin pinggul turun. Napas tetap jalan.', ''),
  ('Dead Bug', 'Core', 'Bodyweight',
   'Punggung bawah nempel lantai terus — itu kuncinya. Turunin tangan dan kaki berlawanan pelan-pelan, berhenti sebelum pinggang melengkung.', ''),
  ('Pallof Press', 'Core', 'Cable',
   'Berdiri menyamping dari cable, dorong pegangan lurus ke depan dan tahan. Lawan putaran badannya, jangan ikut muter. Ini latihan anti-rotasi.', ''),
  ('HIIT Interval', 'Kardio', 'Machine',
   'Habis pemanasan: 30 detik usaha keras, 90 detik pelan, ulang 8-10 putaran. Treadmill, sepeda, atau rowing sama aja. Yang keras harus beneran keras.', ''),
  ('Jalan Kaki', 'NEAT', 'Bodyweight',
   'Jalan santai di luar sesi latihan. Yang dikejar jumlah hariannya, bukan intensitasnya.', '')
on conflict (name) do nothing;

-- ----------------------------------------------------------------- schedule
insert into schedule (day_of_week, session, notes) values
  ('Senin',  'Full Body A',  'Fokus squat'),
  ('Selasa', 'Cardio',       'Zona 2, 30-45 menit'),
  ('Rabu',   'Full Body B',  'Fokus deadlift'),
  ('Kamis',  'HIIT',         '15-20 menit, keras'),
  ('Jumat',  'Full Body C',  'Mesin & glutes'),
  ('Sabtu',  'Cardio',       'Opsional, santai aja'),
  ('Minggu', 'REST',         'Libur beneran')
on conflict (day_of_week) do update
  set session = excluded.session, notes = excluded.notes;

-- ----------------------------------------------------------------- programs
-- Replaced wholesale; workout_logs keeps its own session names, so the old
-- Upper/Lower history stays readable.
delete from programs;

insert into programs
  (session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order) values

  -- Full Body A — squat pattern leads
  ('Full Body A', 'Jumping Jack / Jalan Cepat',               1, '3 menit',           0,   0,  -4),
  ('Full Body A', 'Leg Swings',                               1, '10x per kaki',      0,   0,  -3),
  ('Full Body A', 'Arm Circles',                              1, '20x per arah',      0,   0,  -2),
  ('Full Body A', 'Bodyweight Squat (Warm Up)',               1, '15x',               0,   0,  -1),
  ('Full Body A', 'Squat',                                    3, '8-12',             120,  10,   1),
  ('Full Body A', 'Bench Press',                              3, '8-12',              90,  12.5, 2),
  ('Full Body A', 'Seated Cable Row',                         3, '10-12',             90,  25,   3),
  ('Full Body A', 'Romanian Deadlift',                        2, '10-12',             90,  20,   4),
  ('Full Body A', 'Plank',                                    3, '30-45 detik',       60,   0,   5),
  ('Full Body A', 'Hamstring Stretch',                        1, '30 detik per sisi',  0,   0,  90),
  ('Full Body A', 'Quad Stretch',                             1, '30 detik per sisi',  0,   0,  91),

  -- Full Body B — hinge pattern leads
  ('Full Body B', 'Jumping Jack / Jalan Cepat',               1, '3 menit',           0,   0,  -4),
  ('Full Body B', 'Glute Bridge',                             1, '15x',               0,   0,  -3),
  ('Full Body B', 'Band Pull-Apart',                          1, '15x',               0,   0,  -2),
  ('Full Body B', 'Cat-Cow',                                  1, '10x',               0,   0,  -1),
  ('Full Body B', 'Deadlift',                                 3, '6-8',              150,  25,   1),
  ('Full Body B', 'Overhead Press',                           3, '8-10',              90,  20,   2),
  ('Full Body B', 'Lat Pulldown',                             3, '10-12',             90,  25,   3),
  ('Full Body B', 'Walking Lunge',                            2, '12 per kaki',       90,  14,   4),
  ('Full Body B', 'Dead Bug',                                 3, '10 per sisi',       60,   0,   5),
  ('Full Body B', 'Hip Flexor Stretch',                       1, '30 detik per sisi',  0,   0,  90),
  ('Full Body B', 'Hamstring Stretch',                        1, '30 detik per sisi',  0,   0,  91),

  -- Full Body C — machines and glutes, easiest to push load on
  ('Full Body C', 'Jumping Jack / Jalan Cepat',               1, '3 menit',           0,   0,  -4),
  ('Full Body C', 'Hip Circles',                              1, '10x per arah',      0,   0,  -3),
  ('Full Body C', 'Scapular Push-Up',                         1, '10x',               0,   0,  -2),
  ('Full Body C', 'Arm Circles',                              1, '20x per arah',      0,   0,  -1),
  ('Full Body C', 'Leg Press',                                3, '10-15',             90,  80,   1),
  ('Full Body C', 'Incline DB Press',                         3, '10-12',             90,  10,   2),
  ('Full Body C', 'Bent Over Row',                            3, '8-12',              90,  20,   3),
  ('Full Body C', 'Hip Thrust',                               3, '10-15',             90,  30,   4),
  ('Full Body C', 'Pallof Press',                             3, '12 per sisi',       60,  10,   5),
  ('Full Body C', 'Quad Stretch',                             1, '30 detik per sisi',  0,   0,  90),
  ('Full Body C', 'Child''s Pose / Cat-Cow (Cool Down)',      1, '1 menit',            0,   0,  91),

  -- Cardio — steady, zone 2
  ('Cardio',      'Jumping Jack / Jalan Cepat',               1, '3 menit',           0,   0,  -1),
  ('Cardio',      'Treadmill',                                1, '30-45 menit',       0,   0,   1),
  ('Cardio',      'Jalan Santai / Light Cycling (Cool Down)', 1, '5 menit',           0,   0,  90),

  -- HIIT — the one hard cardio slot
  ('HIIT',        'Jumping Jack / Jalan Cepat',               1, '5 menit',           0,   0,  -1),
  ('HIIT',        'HIIT Interval',                            1, '15-20 menit',       0,   0,   1),
  ('HIIT',        'Jalan Santai / Light Cycling (Cool Down)', 1, '5 menit',           0,   0,  90);

commit;
