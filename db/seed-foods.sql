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
  ('Nanas',                        '100 g',             50,  0.5, 13,    0.1),

  -- Drinks
  ('Es Teh Manis',                 '1 glass',          120,  0,   30,    0),
  ('Teh Tawar',                    '1 glass',            0,  0,    0,    0),
  ('Kopi Susu Gula Aren',          '1 cup',            200,  4,   30,    7),
  ('Americano',                    '1 cup',             10,  0.3,  1.7,  0),

  -- Nusantara: rice and noodle plates (rice included unless the name says otherwise)
  ('Bubur Ayam',                   '1 bowl, complete', 370, 18,   50,   11),
  ('Lontong Padang',               '1 portion',        450, 13,   55,   20),
  ('Ketupat Sayur',                '1 portion',        400, 10,   55,   15),
  ('Ketoprak',                     '1 plate',          500, 17,   60,   22),
  ('Nasi Uduk',                    '1 portion rice',   300,  5,   50,    9),
  ('Nasi Kuning',                  '1 plate, complete', 550, 18,  70,   22),
  ('Nasi Goreng',                  '1 plate, with egg', 600, 18,  75,   25),
  ('Mie Goreng',                   '1 plate',          550, 15,   70,   23),
  ('Mie Ayam',                     '1 bowl',           450, 20,   60,   14),
  ('Nasi Rames',                   '1 plate',          650, 25,   80,   25),
  ('Nasi Padang',                  '1 plate, rendang', 800, 32,   85,   37),
  ('Nasi Gudeg',                   '1 plate, complete', 600, 22,  75,   24),
  ('Ayam Geprek + Nasi',           '1 plate',          700, 32,   70,   32),
  ('Pecel Lele + Nasi',            '1 plate',          650, 25,   65,   32),
  ('Nasi Bebek Goreng',            '1 plate',          850, 35,   70,   48),
  ('Lontong',                      '1 lontong',        150,  3,   33,    0.3),

  -- Nusantara: satay and soups (no rice)
  ('Sate Padang',                  '10 skewers + ketupat', 550, 30, 55, 23),
  ('Sate Ayam',                    '10 skewers, peanut sauce', 450, 33, 15, 29),
  ('Sate Kambing',                 '10 skewers',       420, 30,    6,   31),
  ('Rawon',                        '1 bowl, no rice',  300, 22,    8,   20),
  ('Soto Betawi',                  '1 bowl, no rice',  450, 22,   10,   36),
  ('Coto Makassar',                '1 bowl, no ketupat', 350, 28,  8,   23),
  ('Sop Buntut',                   '1 bowl, no rice',  450, 28,   10,   33),
  ('Tongseng Kambing',             '1 bowl, no rice',  400, 24,   12,   28),
  ('Empal Gentong',                '1 bowl, no rice',  400, 22,   10,   30),

  -- Nusantara: street food and snacks
  ('Siomay Bandung',               '1 portion',        400, 18,   45,   16),
  ('Batagor',                      '1 portion',        500, 18,   45,   27),
  ('Pempek',                       '1 portion, with cuko', 450, 18, 60, 15),
  ('Seblak',                       '1 bowl',           400, 10,   55,   16),
  ('Cilok',                        '10 pcs',           250,  3,   50,    4),
  ('Martabak Telur',               '2 pieces',         350, 14,   25,   22),
  ('Martabak Manis',               '2 pieces',         450,  8,   55,   22),
  ('Risoles',                      '1 pc',             160,  4,   15,    9.5),
  ('Lemper',                       '1 pc',             130,  4,   20,    3.8),
  ('Klepon',                       '5 pcs',            200,  2,   42,    3),

  -- Packaged. Per pack or stated serving; check the Informasi Nilai Gizi panel
  -- on your pack, since sizes and recipes change between variants.
  ('Indomie Soto Mie',             '1 pack (70 g)',    300,  7,   46,   10),
  ('Indomie Ayam Bawang',          '1 pack (69 g)',    300,  7,   43,   11),
  ('Indomie Kari Ayam',            '1 pack (72 g)',    320,  7,   44,   13),
  ('Indomie Goreng Rendang',       '1 pack (91 g)',    420,  8,   57,   18),
  ('Indomie Goreng Jumbo',         '1 pack (129 g)',   540, 11,   78,   20),
  ('Mie Sedaap Goreng',            '1 pack (91 g)',    420,  8,   54,   19),
  ('Mie Sedaap Soto',              '1 pack (75 g)',    330,  7,   47,   12.5),
  ('Pop Mie Ayam',                 '1 cup (75 g)',     340,  7,   47,   14),
  ('Sari Roti Tawar',              '2 slices',         130,  4.5, 25,    1.5),
  ('Sari Roti Sandwich',           '1 pack (2 pcs)',   190,  5,   27,    7),
  ('Chitato',                      '1 pack (68 g)',    360,  4,   37,   22),
  ('Qtela Singkong',               '1 pack (60 g)',    300,  1,   38,   16),
  ('Taro Net',                     '1 pack (36 g)',    180,  3,   22,    9),
  ('Beng-Beng',                    '1 bar',            110,  1.3, 13,    6),
  ('Tango Wafer',                  '1 small pack',     110,  1,   13,    6),
  ('Oreo',                         '3 cookies',        140,  1.5, 21,    6),
  ('Roma Kelapa',                  '4 biscuits',       130,  2,   18,    5.5),
  ('Richeese Nabati',              '1 pc',             100,  1,   12,    5.5),
  ('SilverQueen',                  '1 small bar (30 g)', 160, 2.5, 16,  10),
  ('Choki-Choki',                  '1 stick',           55,  0.5,  6,    3.2),
  ('So Good Nugget',               '4 pcs',            200,  9,   14,   12),
  ('Sosis So Nice',                '1 pc',              70,  3,    4,    4.7),
  ('Energen',                      '1 sachet',         120,  3,   20,    3),
  ('Good Day Cappuccino',          '1 sachet',         110,  1,   18,    4),
  ('Nescafe Kaleng',               '1 can (240 ml)',   110,  2,   20,    2.5),
  ('Teh Botol Sosro',              '1 bottle (220 ml)', 90,  0,   22.5,  0),
  ('Teh Pucuk Harum',              '1 bottle (350 ml)', 140, 0,   35,    0),
  ('Pocari Sweat',                 '1 bottle (500 ml)', 130, 0,   32.5,  0),
  ('Coca-Cola',                    '1 can (330 ml)',   140,  0,   35,    0),
  ('Ultra Milk Full Cream',        '1 box (250 ml)',   160,  8,   12,    9),
  ('Ultra Milk Coklat',            '1 box (250 ml)',   200,  7,   28,    6.5),
  ('Yakult',                       '1 bottle (65 ml)',  50,  0.8, 11.5,  0),
  ('Wall''s Feast',                 '1 stick',          180,  2.5, 18,   11),

  -- Kue tradisional. Per piece unless stated; sizes vary by maker.
  ('Kue Lapis',                    '1 pc',             140,  1,   25,    4),
  ('Lapis Legit',                  '1 slice',          200,  3,   20,   12),
  ('Kue Lumpur',                   '1 pc',             150,  3,   20,    6.5),
  ('Nagasari',                     '1 pc',             130,  1.5, 25,    2.7),
  ('Kue Putu',                     '5 pcs',            200,  2,   38,    4.5),
  ('Putu Ayu',                     '1 pc',             110,  1.5, 18,    3.5),
  ('Onde-Onde',                    '1 pc',             180,  3.5, 25,    7.5),
  ('Bika Ambon',                   '1 pc',             170,  3,   25,    6.5),
  ('Serabi',                       '1 pc, with kinca', 160,  2,   28,    4.5),
  ('Dadar Gulung',                 '1 pc',             150,  2,   25,    4.7),
  ('Kue Cubit',                    '5 pcs',            200,  4,   28,    8),
  ('Pukis',                        '2 pcs',            180,  3.5, 26,    7),
  ('Kue Pancong',                  '2 pcs',            220,  2.5, 30,   10),
  ('Kue Talam',                    '1 pc',             130,  1,   22,    4.3),
  ('Kue Mangkok',                  '1 pc',             130,  2,   28,    1),
  ('Getuk',                        '1 pc',             150,  1,   32,    2),
  ('Wajik',                        '1 pc',             160,  1.5, 30,    3.8),
  ('Cucur',                        '1 pc',             160,  1,   28,    5),
  ('Bakpia',                       '1 pc',             130,  3,   20,    4.2),
  ('Kue Sus',                      '1 pc',             140,  3,   12,    9),
  ('Pastel',                       '1 pc',             200,  4,   20,   11.5),
  ('Lumpia Semarang',              '1 pc',             200,  6,   20,   10.5),
  ('Combro',                       '1 pc',             150,  1.5, 20,    7),
  ('Misro',                        '1 pc',             140,  1,   20,    6.2),
  ('Pisang Goreng',                '1 pc',             150,  1.5, 22,    6.5)
on conflict (name) do nothing;
