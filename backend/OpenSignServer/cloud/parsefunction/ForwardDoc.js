import axios from 'axios';
import nodemailer from 'nodemailer';
import { appName } from '../../Utils.js'; // cloudServerUrl/serverAppId no longer needed here

export default async function forwardDoc(request) {
  try {
    if (!request.user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'unauthorized.');
    }

    // --- Safety: ensure SMTP is enabled and creds exist ---
    if (process.env.SMTP_ENABLE !== 'true') {
      throw new Parse.Error(400, 'Mail adapter is disabled. Set SMTP_ENABLE=true in env.');
    }
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_USER = process.env.SMTP_USER_EMAIL;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Parse.Error(
        400,
        'Missing SMTP env vars (SMTP_HOST/SMTP_PORT/SMTP_USER_EMAIL/SMTP_PASS).'
      );
    }

    const { docId, recipients } = request.params;
    const isReceipents = recipients?.length > 0 && recipients?.length <= 10;

    if (!docId || !isReceipents) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'please provide parameters.');
    }

    // --- Load document (same as before) ---
    const userPtr = { __type: 'Pointer', className: '_User', objectId: request.user.id };
    const docQuery = new Parse.Query('contracts_Document');
    docQuery
      .equalTo('objectId', docId)
      .equalTo('CreatedBy', userPtr)
      .notEqualTo('IsArchive', true)
      .notEqualTo('IsDeclined', true)
      .include('Signers')
      .include('ExtUserPtr')
      .include('Placeholders.signerPtr')
      .include('ExtUserPtr.TenantId');

    const docRes = await docQuery.first({ useMasterKey: true });
    if (!docRes) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Document not found.');
    }

    const _docRes = docRes.toJSON();
    const docName = _docRes.Name || 'document.pdf';
    const signedUrl = _docRes?.SignedUrl || '';
    const TenantAppName = appName;

    const senderName = _docRes?.ExtUserPtr?.Name || 'OpenSign User';
    const replyToFromDoc = _docRes?.ExtUserPtr?.Email || '';
    const replyTo =
      process.env.SMTP_REPLY_TO_EMAIL || replyToFromDoc || process.env.SMTP_USER_EMAIL;

    // Gmail rule of thumb: "from" must be the authenticated account;
    // we keep your Gmail address as sender, and show original sender name in display name.
    const fromDisplay = `${
      process.env.SMTP_FROM_NAME || 'OpenSign'
    } • ${senderName} <${SMTP_USER}>`;

    // Build a single transporter (reuse for all recipients)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      requireTLS: SMTP_PORT === 587, // enforce STARTTLS on 587
    });

    // Try to fetch the PDF if we have a URL
    let attachments = [];
    if (signedUrl) {
      try {
        const fileRes = await axios.get(signedUrl, { responseType: 'arraybuffer' });
        attachments.push({
          filename: `${docName.endsWith('.pdf') ? docName : `${docName}.pdf`}`,
          content: Buffer.from(fileRes.data),
          contentType: 'application/pdf',
        });
      } catch (e) {
        // If we can’t fetch the file, still send email with link instead of failing
        // console.warn('Could not fetch SignedUrl, sending without attachment:', e?.message);
      }
    }

    // HTML template (same visuals you had)
    const logo = `<img src='https://qikinnovation.ams3.digitaloceanspaces.com/logo.png' height='50' style='padding:20px'/>`;
    const opurl = ` <a href='www.opensignlabs.com' target=_blank>here</a>`;
    const themeColor = '#47a3ad';
    const baseHtml =
      `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/></head><body>` +
      `<div style='background-color:#f5f5f5;padding:20px'><div style='background-color:white'><div>${logo}</div>` +
      `<div style='padding:2px;font-family:system-ui;background-color:${themeColor}'>` +
      `<p style='font-size:20px;font-weight:400;color:white;padding-left:20px'>Document Copy</p></div>` +
      `<div><p style='padding:20px;font-family:system-ui;font-size:14px'>` +
      `A copy of the document <strong>${docName}</strong> is attached to this email. ` +
      `${
        attachments.length
          ? 'Kindly download the document from the attachment.'
          : signedUrl
            ? `Attachment couldn’t be added; you can download it from <a href="${signedUrl}" target="_blank">this link</a>.`
            : 'Attachment unavailable.'
      }` +
      `</p></div></div><div><p>` +
      `This is an automated email from ${TenantAppName}. For any queries regarding this email, please contact the sender ${replyTo} directly. ` +
      `If you think this email is inappropriate or spam, you may file a complaint with ${TenantAppName}${opurl}.` +
      `</p></div></div></body></html>`;

    // Send to each recipient
    let lastInfo = null;
    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i];

      const subject = `${senderName} has signed the doc - ${docName}`;

      lastInfo = await transporter.sendMail({
        from: fromDisplay,
        to,
        subject,
        replyTo,
        html: baseHtml,
        attachments, // may be empty
      });
    }

    // Optionally return the last nodemailer response
    return { status: 'success', ok: true, messageId: lastInfo?.messageId || null };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Err in forwardDoc', err);
    const msg =
      err?.response?.data?.error || err?.response?.data || err?.message || 'Something went wrong.';
    throw new Parse.Error(400, msg);
  }
}
