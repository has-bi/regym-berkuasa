# Lanjutan migrasi Google Sheets → Neon Postgres

Copy semua di bawah ini sebagai prompt pertama di VSCode.

---

## Konteks

Repo: `has-bi/grocery-inventory`, branch **`claude/sleepy-mendel-qggzqx`**
(commit `8583b52`, udah di-push).

Aplikasi fitness tracker Next.js 15. Backend-nya **sudah dipindah dari Google
Sheets ke Postgres (Neon)** di sisi kode — semua sudah ditulis dan diuji lawan
Postgres lokal. Yang **belum** dilakukan cuma yang butuh akses jaringan ke Neon,
karena sandbox tempat kerjaan ini dibuat memblokir host Neon.

Database Neon-nya dibuat lewat integrasi Vercel, jadi `DATABASE_URL` sudah
otomatis ada di environment variables Vercel.

## Yang sudah selesai (jangan diulang)

- `db/schema.sql` — 5 tabel: `exercises`, `programs`, `schedule`,
  `workout_logs`, `body_metrics`
- `src/lib/db.js` — akses Postgres. Driver dipilih dari host: Neon HTTP untuk
  `*.neon.tech`, `pg` biasa untuk selainnya (biar dev lokal jalan)
- `src/app/api/data/{bundle,workout,body}` — menggantikan 6 route `/api/sheets/*`
- `src/actions/data.js` — menggantikan `src/actions/sheets.js`
- `scripts/migrate-sheets-to-pg.mjs` — migrasi data, idempoten
- Hooks & komponen sudah dipointing ulang; `npm run build` lolos

Sudah diverifikasi lawan Postgres lokal: schema apply, migrasi jalan + aman
di-rerun, 4 layar render tanpa error, 1 request per layar, dan add / retry /
edit / delete semuanya benar.

## Status per 1 Okt 2026

- **Langkah 1 & 2 sudah selesai.** Schema sudah di Neon, data Sheet sudah
  dimigrasi dan jumlah barisnya cocok (112 / 71 / 44 / 7 / 7).
- **Program sekarang Full Body** lewat `db/seed-program.sql`:
  Senin Full Body A · Selasa Cardio · Rabu Full Body B · Kamis HIIT ·
  Jumat Full Body C · Sabtu Cardio · Minggu rest. Push/Pull/Legs sempat
  dipakai 28 Sep – 1 Okt; riwayatnya tetap ada di log.
- **Jalan kaki harian** dicatat di tabel `daily_activity` (target 8.000
  langkah), terpisah dari sesi supaya nggak ngaruh ke streak.
- **Semua copy di app sudah bahasa Inggris**, termasuk nama hari di
  `schedule` (`Monday` … `Sunday`).
- **Jangan jalankan migrasi Sheet lagi** — sheet-nya masih pakai nama hari
  Indonesia, jadi rerun bakal nambah baris schedule dobel.
- **Urutan langkah 3 & 4 dibalik:** deploy dulu, baru hapus `APPS_SCRIPT_URL`.
  Production sekarang masih jalan pakai Sheets, jadi hapus env var duluan
  bikin app live rusak sampai merge ke-deploy.

## Yang perlu kamu kerjakan

### 1. Apply schema ke Neon

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Verifikasi: 5 tabel ada, `programs.target_reps` bertipe `text`,
`workout_logs.client_id` punya unique constraint.

### 2. Migrasi data dari Sheet

Butuh URL Apps Script `/exec` yang masih aktif (ada di `APPS_SCRIPT_URL` di
Vercel sekarang).

```bash
# lihat dulu, tanpa nulis
APPS_SCRIPT_URL="<url /exec>" DATABASE_URL="<neon url>" \
  node scripts/migrate-sheets-to-pg.mjs --dry-run

# jalankan
APPS_SCRIPT_URL="<url /exec>" DATABASE_URL="<neon url>" \
  node scripts/migrate-sheets-to-pg.mjs
```

Aman diulang. Kalau ada baris yang dilaporkan "skipped", itu baris yang
tanggalnya nggak kebaca — cek manual di sheet sebelum memutuskan.

**Sebelum lanjut, cocokkan jumlah barisnya** dengan sheet asli:

```sql
select 'workout_logs' t, count(*) from workout_logs
union all select 'body_metrics', count(*) from body_metrics
union all select 'programs', count(*) from programs
union all select 'exercises', count(*) from exercises
union all select 'schedule', count(*) from schedule;
```

Patokan dari sheet per 28 Sep 2026: WorkoutLogs 112, Programs 71,
Exercises 44, BodyMetrics 7, Schedule 7.

### 2b. Muat program

```bash
psql "$DATABASE_URL" -f db/seed-program.sql
```

Full Body A/B/C + Cardio + HIIT, jadwal mingguan, dan katalog exercise
bahasa Inggris. Harus **setelah** migrasi: seed-nya me-reset `programs` dan
`schedule`, jadi sisa program Upper/Lower dari sheet ikut bersih. Aman diulang.

### 3. Env vars di Vercel

`DATABASE_URL` sudah ada dari integrasi. **Hapus `APPS_SCRIPT_URL`** setelah
migrasi diverifikasi. `AUTH_PIN_HASH` dan `SESSION_SECRET` biarkan.

### 4. Deploy & cek

Merge branch-nya, tunggu Vercel deploy, lalu buka appnya. Yang harus benar:
- 4 layar (Lift / Body / Program / Report) tampil tanpa kartu error,
  dan kartu "Steps today" muncul di layar Lift
- Data lama muncul — streak dan riwayat sesuai
- Catat 1 set baru, refresh, set-nya masih ada
- Tab Program menampilkan Full Body A, B, C, Cardio, HIIT

### 5. Rotate kredensial Neon

Password database sempat kekirim di chat waktu setup. Ganti di Neon console,
lalu update `DATABASE_URL` di Vercel.

## Yang belum ada, dan perlu kamu putuskan

**Program sekarang nggak bisa diedit dari mana pun.** Dulu Google Sheet yang
jadi tempat ngatur `programs`, `schedule`, dan `exercises` — tombol "Atur di
Google Sheet" sudah dihapus karena sheet-nya nggak lagi jadi sumber data.
Sekarang satu-satunya cara ganti program adalah lewat SQL di Neon console.

Tiga pilihan:
1. Biarkan — pakai SQL editor Neon kalau perlu ganti program (jarang)
2. Bangun layar editing di app untuk program + schedule
3. Bikin halaman admin sederhana yang menulis ke tabel itu

Kalau pilih (2) atau (3), catatan: `POST /api/data/*` sudah ada polanya, tinggal
ikuti bentuk yang sama.

## Hal yang sengaja dirancang begini

Kalau ketemu dan kelihatan aneh, ini alasannya:

- **`target_reps` bertipe `text`, bukan angka.** Isinya bisa `8-12`, `AMRAP`,
  `30 detik per sisi`. Di Sheets, `10-12` pernah dibaca jadi tanggal 12 Oktober
  dan muncul di UI sebagai `2026-10-12`. Tipe text bikin itu mustahil.
- **`client_id` unique, dan insert pakai `on conflict do nothing`.** Ini yang
  mencegah set dobel waktu retry. Pernah ada 8 baris Hamstring Stretch identik
  karena timeout di sisi klien nggak membatalkan tulisan yang sudah commit.
- **`weight` default 0 dan itu nilai valid**, bukan "belum diisi" — gerakan
  bodyweight memang 0 kg.
- **Bundle diambil satu query** pakai `json_build_object`. Dulu 5 request
  paralel, dan Apps Script sering gagal berbarengan karena batas eksekusi.
- **`google-apps-script.js` masih ada** khusus buat migrasi. Habis data
  terverifikasi, file dan deployment-nya boleh dihapus.
