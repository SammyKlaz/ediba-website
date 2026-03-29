import cron from "node-cron";
import pool from "./config/db.js";
import transporter from "./config/email.js";

/* ============================= */
/* Helper Function */
/* ============================= */

async function sendEmailToAllUsers(subject, messageBuilder) {
  try {
    console.log(`[${new Date().toString()}] Starting email broadcast: ${subject}`);

    const result = await pool.query(
      "SELECT first_name, last_name, email FROM users"
    );

    for (let user of result.rows) {
      try {
        const fullName = `${user.first_name} ${user.last_name}`;

        const htmlMessage = churchEmailTemplate(
          subject,
          messageBuilder(fullName)
        );

        await transporter.sendMail({
          from: `P.C.N. Ediba Qua Parish <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject,
          html: htmlMessage
        });

      } catch (mailError) {
        console.error("Email failed for:", user.email, mailError.message);
      }
    }

    console.log(subject + " emails sent successfully");

  } catch (error) {
    console.error("Database error:", error.message);
  }
}

/* ============================= */
/* Email Template */
/* ============================= */

function churchEmailTemplate(title, body) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:6px;">

        <div style="text-align:center; margin-bottom:20px;">
          <img 
            src="${process.env.LOGO_URL}"
            alt="P.C.N. Ediba Qua Parish"
            style="max-width:120px;"
          >
        </div>

        <h2 style="color:#2c3e50; margin-bottom:20px;">
          ${title}
        </h2>

        <p style="font-size:16px; line-height:1.7; color:#333;">
          ${body}
        </p>

        <hr style="margin:30px 0;">

        <p style="font-size:14px; color:#555;">
          P.C.N. Ediba Qua Parish<br>
          We look forward to worshipping with you.
        </p>
      </div>
    </div>
  `;
}


function churchAge() {
  const currentYear = new Date().getFullYear();
  return currentYear - 1988;
}

/* ============================= */
/* 1️⃣ Sunday Worship */
/* Every Sunday 6am */
/* ============================= */

cron.schedule("0 6 * * 0", async () => {
  console.log(`[${new Date().toString()}] Running Sunday Worship cron job`);

  await sendEmailToAllUsers(
    "Sunday Worship Invitation",
    (name) => `
      Welcome ${name},<br><br>
      You are warmly invited to worship with us today at PCN Ediba Qua Parish.<br><br>
      <address><strong>Location:</strong> 25 Ediba Road, Calabar.<br>
      <strong>Sunday School:</strong> 8:00 AM<br>
      <strong>Main Service:</strong> 9:00 AM<br><br>
      Come and be blessed.
    `
  );
}, {
  timezone: "Africa/Lagos"
});

/* ============================= */
/* 2️⃣ Happy New Month */
/* Every 1st day of month 6am */
/* ============================= */

cron.schedule("0 6 1 * *", async () => {
  console.log(`[${new Date().toString()}] Running New Month cron job`);

  await sendEmailToAllUsers(
    "Happy New Month",
    (name) => `
      Welcome ${name},<br><br>
      P.C.N. Ediba Qua Parish wishes you a happy and blessed new month.<br><br>
      May this new month bring you peace, progress, and divine favor.
    `
  );
}, {
  timezone: "Africa/Lagos"
});

/* ============================= */
/* 3️⃣ Crossover Night */
/* 31st December 6pm */
/* ============================= */

cron.schedule("0 18 31 12 *", async () => {
  console.log(`[${new Date().toString()}] Running Crossover Night cron job`);

  await sendEmailToAllUsers(
    "Crossover Night Service Invitation",
    (name) => `
      Welcome ${name},<br><br>
      You are invited to our Crossover Night Service as we thank God for the year and step into the new year in prayer.<br><br>
      <strong>Date:</strong> 31st December<br>
      <strong>Time:</strong> 9:00 PM<br><br>
      Join us as we cross over into the new year together.
    `
  );
}, {
  timezone: "Africa/Lagos"
});

/* ============================= */
/* 4️⃣ Happy New Year */
/* January 1st 8am */
/* ============================= */

cron.schedule("0 0 1 1 *", async () => {
  console.log(`[${new Date().toString()}] Running New Year cron job`);

  await sendEmailToAllUsers(
    "Happy New Year",
    (name) => `
      Welcome ${name},<br><br>
      P.C.N. Ediba Qua Parish wishes you a happy and prosperous New Year.<br><br>
      May this year be filled with joy, good health, and abundant blessings.
    `
  );
}, {
  timezone: "Africa/Lagos"
});


cron.schedule("0 6 3 12 *", async () => {
  console.log(`[${new Date().toString()}] Running Church Anniversary cron job`);

  const years = churchAge();

  await sendEmailToAllUsers(
    "Church Anniversary Celebration",
    (name) => `
      Dear ${name},<br><br>

      We joyfully celebrate the anniversary of
      <strong>P.C.N. Ediba Qua Parish</strong>.<br><br>

      Founded on <strong>3rd December 1988</strong>,
      our church is now <strong>${years} years old</strong>.<br><br>

      We thank God for His faithfulness through the years
      and invite you to join us in celebrating His goodness.<br><br>

      God bless you abundantly.
    `
  );
}, {
  timezone: "Africa/Lagos"
});


export default cron;