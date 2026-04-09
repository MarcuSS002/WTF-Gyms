// seed.js

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const INDIAN_FIRST_NAMES = [
  "Rahul", "Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Kunal", "Siddharth", "Ishaan", "Aman",
  "Priya", "Ananya", "Diya", "Kavya", "Riya", "Aisha", "Sneha", "Pooja", "Meera", "Ira",
];

const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Singh", "Khan", "Iyer", "Nair", "Reddy", "Rao",
  "Chopra", "Mehta", "Joshi", "Kapoor", "Mishra", "Das", "Ghosh", "Yadav", "Jain", "Bose",
];

function indianNameByIndex(index) {
  const i = Math.max(1, Number(index || 1));
  const first = INDIAN_FIRST_NAMES[(i - 1) % INDIAN_FIRST_NAMES.length];
  const last = INDIAN_LAST_NAMES[Math.floor((i - 1) / INDIAN_FIRST_NAMES.length) % INDIAN_LAST_NAMES.length];
  return `${first} ${last}`;
}

function buildTimedCheckin(date) {
  const hourBands = [
    { weight: 0.45, start: 7, span: 3 },
    { weight: 0.18, start: 10, span: 4 },
    { weight: 0.12, start: 14, span: 3 },
    { weight: 0.25, start: 17, span: 4 },
  ];
  const roll = Math.random();
  let cumulative = 0;
  let band = hourBands[0];
  for (const candidate of hourBands) {
    cumulative += candidate.weight;
    if (roll <= cumulative) {
      band = candidate;
      break;
    }
  }

  const checkIn = new Date(date);
  checkIn.setHours(band.start, 0, 0, 0);
  checkIn.setMinutes(checkIn.getMinutes() + Math.floor(Math.random() * band.span * 60));
  return checkIn;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log("🌱 Seeding started...");

    // ============================
    // 0. CHECK (idempotent)
    // ============================
    const check = await client.query("SELECT COUNT(*) FROM gyms");
    if (parseInt(check.rows[0].count) > 0) {
      console.log("⚠️ Seed already exists. Skipping...");
      return;
    }

    // ============================
    // 1. GYMS
    // ============================
    console.log("🏢 Seeding gyms...");

    const gyms = [
      ["WTF Gyms — Lajpat Nagar", "New Delhi", 220, "05:30", "22:30"],
      ["WTF Gyms — Connaught Place", "New Delhi", 180, "06:00", "22:00"],
      ["WTF Gyms — Bandra West", "Mumbai", 300, "05:00", "23:00"],
      ["WTF Gyms — Powai", "Mumbai", 250, "05:30", "22:30"],
      ["WTF Gyms — Indiranagar", "Bengaluru", 200, "05:30", "22:00"],
      ["WTF Gyms — Koramangala", "Bengaluru", 180, "06:00", "22:00"],
      ["WTF Gyms — Banjara Hills", "Hyderabad", 160, "06:00", "22:00"],
      ["WTF Gyms — Sector 18 Noida", "Noida", 140, "06:00", "21:30"],
      ["WTF Gyms — Salt Lake", "Kolkata", 120, "06:00", "21:00"],
      ["WTF Gyms — Velachery", "Chennai", 110, "06:00", "21:00"],
    ];

    const gymRes = await client.query(
      `INSERT INTO gyms (name, city, capacity, opens_at, closes_at, status)
       VALUES ${gyms.map((_, i) => `($${i * 5 + 1},$${i * 5 + 2},$${i * 5 + 3},$${i * 5 + 4},$${i * 5 + 5},'active')`).join(",")}
       RETURNING id,name`,
      gyms.flat()
    );

    const gymMap = {};
    gymRes.rows.forEach(g => (gymMap[g.name] = g.id));

    console.log("✅ Gyms done");

    // ============================
    // 2. MEMBERS
    // ============================
    console.log("👥 Seeding members...");

    const distribution = {
      "WTF Gyms — Lajpat Nagar": 650,
      "WTF Gyms — Connaught Place": 550,
      "WTF Gyms — Bandra West": 750,
      "WTF Gyms — Powai": 600,
      "WTF Gyms — Indiranagar": 550,
      "WTF Gyms — Koramangala": 500,
      "WTF Gyms — Banjara Hills": 450,
      "WTF Gyms — Sector 18 Noida": 400,
      "WTF Gyms — Salt Lake": 300,
      "WTF Gyms — Velachery": 250,
    };

    const members = [];
    let counter = 1;

    for (const gymName in distribution) {
      const count = distribution[gymName];
      const gymId = gymMap[gymName];

      for (let i = 0; i < count; i++) {
        const joinedAt = new Date(Date.now() - Math.random() * 90 * 86400000);

        const plans = ["monthly", "quarterly", "annual"];
        const plan = plans[Math.floor(Math.random() * 3)];

        let expiry = new Date(joinedAt);
        if (plan === "monthly") expiry.setDate(expiry.getDate() + 30);
        if (plan === "quarterly") expiry.setDate(expiry.getDate() + 90);
        if (plan === "annual") expiry.setDate(expiry.getDate() + 365);

        const rand = Math.random();

        members.push([
          gymId,
          indianNameByIndex(counter),
          `user${counter}@gmail.com`,
          "9" + Math.floor(Math.random() * 1e9),
          plan,
          Math.random() < 0.2 ? "renewal" : "new",
          rand < 0.85 ? "active" : rand < 0.93 ? "inactive" : "frozen",
          joinedAt,
          expiry,
        ]);

        counter++;
      }
    }

    for (let i = 0; i < members.length; i += 1000) {
      const chunk = members.slice(i, i + 1000);

      await client.query(
        `INSERT INTO members 
        (gym_id,name,email,phone,plan_type,member_type,status,joined_at,plan_expires_at)
        VALUES ${chunk.map((_, i) =>
          `($${i * 9 + 1},$${i * 9 + 2},$${i * 9 + 3},$${i * 9 + 4},
           $${i * 9 + 5},$${i * 9 + 6},$${i * 9 + 7},$${i * 9 + 8},$${i * 9 + 9})`
        ).join(",")}`,
        chunk.flat()
      );
    }

    console.log("✅ Members done");

    // ============================
    // 3. CHECKINS
    // ============================
    console.log("🏋️ Seeding checkins...");

    const memberIds = (await client.query("SELECT id,gym_id FROM members")).rows;
    const checkins = [];

    for (let i = 0; i < 270000; i++) {
      const m = memberIds[Math.floor(Math.random() * memberIds.length)];
      const date = new Date(Date.now() - Math.random() * 90 * 86400000);
      const checkedIn = buildTimedCheckin(date);
      const duration = 45 + Math.random() * 45;

      checkins.push([
        m.id,
        m.gym_id,
        checkedIn,
        new Date(checkedIn.getTime() + duration * 60000),
      ]);
    }

    for (let i = 0; i < checkins.length; i += 2000) {
      const chunk = checkins.slice(i, i + 2000);

      await client.query(
        `INSERT INTO checkins (member_id,gym_id,checked_in,checked_out)
        VALUES ${chunk.map((_, i) =>
          `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`
        ).join(",")}`,
        chunk.flat()
      );
    }

    console.log("✅ Checkins done");

    // ============================
    // 4. last_checkin_at
    // ============================
    await client.query(`
      UPDATE members m SET last_checkin_at = sub.max
      FROM (
        SELECT member_id, MAX(checked_in) max
        FROM checkins GROUP BY member_id
      ) sub WHERE m.id=sub.member_id
    `);

    // ============================
    // 5. CHURN (IMPORTANT)
    // ============================
    await client.query(`
      UPDATE members SET last_checkin_at = NOW() - INTERVAL '50 days'
      WHERE id IN (SELECT id FROM members WHERE status='active' LIMIT 150)
    `);

    await client.query(`
      UPDATE members SET last_checkin_at = NOW() - INTERVAL '70 days'
      WHERE id IN (SELECT id FROM members WHERE status='active' LIMIT 80)
    `);

    // ============================
    // 6. PAYMENTS
    // ============================
    await client.query(`
      INSERT INTO payments (member_id,gym_id,amount,plan_type,payment_type,paid_at)
      SELECT id,gym_id,
      CASE 
        WHEN plan_type='monthly' THEN 1499
        WHEN plan_type='quarterly' THEN 3999
        ELSE 11999 END,
      plan_type,member_type,joined_at
      FROM members
    `);

    console.log("💰 Payments done");

    // ============================
    // 7. LIVE CHECKINS (FIXED)
    // ============================
    await client.query(`
      INSERT INTO checkins (member_id,gym_id,checked_in)
      WITH gym_targets AS (
        SELECT g.id AS gym_id,
          CASE
            WHEN g.name = 'WTF Gyms — Bandra West' THEN 276
            WHEN g.name = 'WTF Gyms — Velachery' THEN 0
            WHEN g.capacity >= 240 THEN 30
            WHEN g.capacity BETWEEN 160 AND 239 THEN 20
            ELSE 10
          END AS open_count
        FROM gyms g
      )
      SELECT m.id, m.gym_id,
        date_trunc('day', NOW())
        + CASE
            WHEN gt.gym_id = (SELECT id FROM gyms WHERE name = 'WTF Gyms — Bandra West') THEN INTERVAL '15 minutes'
            WHEN random() < 0.55 THEN INTERVAL '7 hours' + random() * INTERVAL '3 hours'
            WHEN random() < 0.8 THEN INTERVAL '17 hours' + random() * INTERVAL '4 hours'
            WHEN random() < 0.92 THEN INTERVAL '10 hours' + random() * INTERVAL '3 hours'
            ELSE INTERVAL '14 hours' + random() * INTERVAL '2 hours'
          END
      FROM gym_targets gt
      JOIN LATERAL (
        SELECT id, gym_id
        FROM members
        WHERE gym_id = gt.gym_id AND status='active'
        ORDER BY random()
        LIMIT GREATEST(gt.open_count, 0)
      ) m ON true
    `);

    await client.query(`DELETE FROM checkins WHERE gym_id = (SELECT id FROM gyms WHERE name='WTF Gyms — Velachery')`);

    console.log("⚡ Live data ready");

    console.log("🎉 SEED COMPLETE!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();