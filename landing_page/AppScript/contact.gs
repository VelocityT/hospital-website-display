function doGet(e) {
  try {
    var params = e.parameter;
    var name = params.name || "";
    var email = params.email || "";
    var phone = params.phone || "";
    var message = params.message || "";

    var subject = "📩 New Inquiry from Velocare Hospital Website";

    var htmlBody = `
      <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f8;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

          <div style="background-color: #0d9488; color: white; padding: 16px 24px;">
            <h2 style="margin: 0; font-size: 22px;">Velocare Hospital ERP</h2>
            <p style="margin: 4px 0 0; font-size: 14px;">New Contact Form Submission</p>
          </div>

          <div style="padding: 24px; color: #333;">
            <p style="margin-bottom: 16px;">You have received a new inquiry from your website’s contact form:</p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: 600;">Name:</td>
                <td style="padding: 8px;">${name}</td>
              </tr>

              <tr style="background-color: #f9fafb;">
                <td style="padding: 8px; font-weight: 600;">Email:</td>
                <td style="padding: 8px;">${email}</td>
              </tr>

              <tr>
                <td style="padding: 8px; font-weight: 600;">Phone:</td>
                <td style="padding: 8px;">${phone}</td>
              </tr>

              <tr style="background-color: #f9fafb;">
                <td style="padding: 8px; font-weight: 600; vertical-align: top;">Message:</td>
                <td style="padding: 8px;">${message}</td>
              </tr>
            </table>

            <p style="margin-top: 24px; font-size: 13px; color: #0d9488; font-weight: 600;">
              — Sent automatically by <b>Velocare Hospital ERP</b>
            </p>
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: "loganvidedits@gmail.com",
      subject: subject,
      htmlBody: htmlBody,
      name: "Velocare Hospital ERP",
      replyTo: email
    });

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
