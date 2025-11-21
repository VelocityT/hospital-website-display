function doGet(e) {
  try {
    var params = e.parameter;

    var name = params.name || "";
    var email = params.email || "";
    var phone = params.phone || "";
    var hospitalName = params.hospitalName || "";
    var location = params.location || "";
    var demoDate = params.demoDate || "";
    var demoTime = params.demoTime || "";
    var message = params.message || "";

    var subject = "New Demo Request from " + (hospitalName || name || "Visitor");

    var htmlBody = `
      <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 650px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden;">

          <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px 28px;">
            <h2 style="margin: 0; font-size: 22px;">Velocare ERP</h2>
            <p style="margin: 4px 0 0; font-size: 14px;">New Demo Request Received</p>
          </div>

          <div style="padding: 24px; color: #333;">
            <p style="margin-bottom: 18px;">A new demo has been requested through your website form. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
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
                <td style="padding: 8px; font-weight: 600;">School Name:</td>
                <td style="padding: 8px;">${hospitalName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: 600;">Location:</td>
                <td style="padding: 8px;">${location}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 8px; font-weight: 600;">Preferred Date:</td>
                <td style="padding: 8px;">${demoDate || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: 600;">Preferred Time:</td>
                <td style="padding: 8px;">${demoTime || "-"}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 8px; font-weight: 600; vertical-align: top;">Message:</td>
                <td style="padding: 8px;">${message || "No additional message provided."}</td>
              </tr>
            </table>

            <p style="margin-top: 28px; font-size: 13px; color: #1D4ED8; font-weight: 600;">
              — Sent automatically by <b>Velocare</b>
            </p>
          </div>
        </div>
      </div>
    `;

    // ====================YOUR EMAIL ================//
    MailApp.sendEmail({
      to: "your@email.com",
      subject: subject,
      htmlBody: htmlBody,
      name: "Velocare Demo Request",
      replyTo: email
    });

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Demo request sent successfully" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
