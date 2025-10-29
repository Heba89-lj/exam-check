import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    let id = req.query.id?.replace(/\s/g, '');
    const lang = req.query.lang || 'ar';

    if (!id || id.length !== 14) {
      return res.status(400).json({ message: lang==='ar' ? 'الرقم القومي يجب أن يكون 14 رقم' : 'ID number must be 14 digits' });
    }

    let auth;
    try {
      auth = new google.auth.GoogleAuth({
        credentials: {
          type: process.env.GOOGLE_TYPE,
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: process.env.GOOGLE_AUTH_URI,
          token_uri: process.env.GOOGLE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
    } catch(err) {
      console.error('Auth error:', err);
      return res.status(500).json({ message: lang==='ar' ? 'خطأ في إعدادات الحساب' : 'Account setup error' });
    }

    let sheets, response, rows;
    try {
      sheets = google.sheets({ version: "v4", auth });
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A:D',
      });
      rows = response.data.values;
    } catch(err) {
      console.error('Sheets API error:', err);
      return res.status(500).json({ message: lang==='ar' ? 'خطأ في جلب البيانات من الشيت' : 'Error fetching data from sheet' });
    }

    const record = rows.find(r => r[2] === id);
    if(record) {
      return res.status(200).json({
        number: record[0],
        year: record[1],
        name: record[4],
      });
    } else {
      return res.status(404).json({ message: lang==='ar' ? 'لا توجد نتائج لهذا الرقم' : 'No results found' });
    }

  } catch(err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
}
