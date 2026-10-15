-- Latihan — starter food library
--
-- Run after db/schema.sql:
--   psql "$DATABASE_URL" -f db/seed-foods.sql
--
-- The first block is what you eat often, with your own calorie numbers. The
-- rest are common warteg and everyday dishes. Every value is per portion.
--
-- Macros are estimates. Your foods came with calories only, so protein, carbs
-- and fat are split to add up to those calories (4/4/9 kcal per gram). The
-- common dishes use typical values for an average warteg portion; real
-- portions vary a lot, so correct anything that looks off in the app.
--
-- Insert-only: a name that already exists is left as it is, so re-running
-- never overwrites a food you have edited.

insert into foods (name, portion, kcal, protein, carbs, fat) values
  -- Yours
  ('Gold Chick Ayam Sambal',       '1 portion',        400, 25,   30,   20),
  ('Ayam Cabe Ijo',                '1 portion',        615, 30,   60,   28),
  ('Nasi Goreng Padang',           '1 plate',          750, 22,   95,   31),
  ('Mont Blanc',                   '1 pc',             300,  4,   38,   15),
  ('Ubi Rebus',                    '2 pcs',            280,  3,   66,    0.5),
  ('Telur Rebus',                  '2 eggs',           154, 12.6,  1.1, 10.6),
  ('Kentang Rebus',                '1 potato',          87,  2,   20,    0.1),
  ('Nasi Pecel',                   '1 plate',         1000, 30,  125,   43),
  ('Banana Cake',                  '1 slice',          230,  3,   32,   10),
  ('French Toast Tiramissu',       '1 portion',        870, 16,   95,   47),

  -- Warteg: rice and protein
  ('Nasi Putih',                   '1 scoop (150 g)',  195,  3.6, 42.6,  0.4),
  ('Nasi Putih (porsi warteg)',    '1 plate (250 g)',  325,  6,   71,    0.7),
  ('Ayam Goreng',                  '1 piece',          260, 22,    6,   16),
  ('Ayam Bakar',                   '1 piece',          230, 25,    6,   11),
  ('Ikan Goreng',                  '1 fish',           250, 24,    3,   16),
  ('Rendang',                      '1 piece',          230, 20,    5,   14.5),
  ('Telur Balado',                 '1 egg',            130,  6.5,  4,   10),
  ('Telur Dadar',                  '1 egg',            150,  7,    1,   13),
  ('Tempe Goreng',                 '2 pcs',            200, 12,    9,   13),
  ('Tahu Goreng',                  '2 pcs',            160,  9,    4,   12),
  ('Tempe Orek',                   '1 portion',        200, 11,   14,   11),
  ('Perkedel Kentang',             '1 pc',             120,  2.5, 12,    7),

  -- Warteg: vegetables
  ('Sayur Sop',                    '1 bowl',            80,  3,   10,    3),
  ('Sayur Lodeh',                  '1 portion',        150,  4,   10,   10.5),
  ('Capcay',                       '1 portion',        120,  5,   10,    7),
  ('Tumis Kangkung',               '1 portion',        100,  3,    6,    7),

  -- Extras that add up
  ('Bakwan / Gorengan',            '1 pc',             140,  2,   13,    9),
  ('Kerupuk',                      '1 pc',              50,  0.5,  6,    2.7),
  ('Sambal',                       '1 tbsp',            30,  0.5,  2,    2.3),

  -- Everyday
  ('Gado-Gado',                    '1 plate',          400, 15,   30,   25),
  ('Soto Ayam (no rice)',          '1 bowl',           230, 18,   10,   13),
  ('Bakso',                        '1 bowl',           375, 20,   40,   15),
  ('Indomie Goreng',               '1 pack',           380,  8,   54,   14),
  ('Dada Ayam Bakar',              '100 g',            165, 31,    0,    3.6),
  ('Pisang',                       '1 banana',         105,  1.3, 24,    0.4),

  -- Drinks
  ('Es Teh Manis',                 '1 glass',          120,  0,   30,    0),
  ('Teh Tawar',                    '1 glass',            0,  0,    0,    0),
  ('Kopi Susu Gula Aren',          '1 cup',            200,  4,   30,    7),
  ('Americano',                    '1 cup',             10,  0.3,  1.7,  0)
on conflict (name) do nothing;
