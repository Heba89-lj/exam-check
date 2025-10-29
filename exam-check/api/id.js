import { google } from "googleapis";

export default async function handler(req, res) {
  let id = req.query.id?.replace(/\s/g, '');
  const lang = req.query.lang || 'ar';

  if(!id || id.length !== 14) {
    return res.status(400).json({ message: lang==='ar' ? 'الرقم القومي يجب أن يكون 14 رقم' : 'ID number must be 14 digits' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
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

    const sheets = google.sheets({ version: "v4", auth });
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const RANGE = 'Sheet1!A:D';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    const record = rows.find(r => r[2] === id);

    if(record) {
      res.status(200).json({
        number: record[0],
        year: record[1],
        name: record[3],
      });
    } else {
      res.status(404).json({ message: lang==='ar' ? 'لا توجد نتائج لهذا الرقم' : 'No results found' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: lang==='ar' ? 'حدث خطأ أثناء جلب البيانات' : 'Error fetching data' });
  }
}
