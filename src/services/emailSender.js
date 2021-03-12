import sendGrid from '@sendgrid/mail';

const { SENDGRID_API_KEY } = process.env;

/**
 * Sends email notifications to admin and users
 *
 * @class - The EmailSender class
 */
class EmailSender {
  /**
   * Sends an email to a recipient
   *
   * @param {String} userEmail - The email address of the recipent
   * @param {String} mailSubject - The subject of the mail
   * @param {String} mailBody - The mail/message body
   */
  static async sendNotificationEmail(
    recieverEmail,
    subject,
    body
  ) {
    const message = {
      fromname: 'SendIt',
      from: `SendIt <${process.env.SENDGRID_EMAIL}>`,
      to: recieverEmail,
      replyto: 'ananioluwatobiloba2000@gmail.com',
      subject: subject,
      html: `<body>${body}</body>`,
    };

    sendGrid.setApiKey(SENDGRID_API_KEY);
    sendGrid
      .send(message)
      .then(() => true)
      .catch((err) => console.log({err}));
  }
}

export default EmailSender;
