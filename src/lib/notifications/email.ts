import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendFlightAlert = async (to: string, tx: any, timeLeft: string) => {
    const mailOptions = {
        from: `"BRICS Notifications" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Flight Alert: ${tx.passengerName} - ${timeLeft} to Travel`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Upcoming Flight Notification</h2>
        <p>This is a reminder for an upcoming passenger flight.</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Passenger:</strong> ${tx.passengerName}</p>
          <p><strong>Sector:</strong> ${tx.sector}</p>
          <p><strong>Travel Date:</strong> ${tx.travelDate.toLocaleDateString()}</p>
          <p><strong>Bill No:</strong> ${tx.salesBillNo}</p>
        </div>
        <p>Status: ${timeLeft} before travel.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b;">BRICS Administrative Suite</p>
      </div>
    `,
    };

    return transporter.sendMail(mailOptions);
};
