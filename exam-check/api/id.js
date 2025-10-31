export default async function handler(req, res) {
  try {
    const { nationalId } = req.query;
    if (!nationalId) {
      return res.status(400).json({ error: "Missing national ID" });
    }

    const sheetId = process.env.SHEET_ID;
    const apiKey = process.env.GOOGLE_API_KEY;

    // جلب البيانات من Google Sheets العامة
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch sheet data");

    const data = await response.json();
    const rows = data.values || [];

    // البحث عن الصف المطابق للرقم القومي
    const found = rows.find(row => row[2]?.toString().replace(/\s+/g,'') === nationalId.replace(/\s+/g,''));
    if (!found) return res.status(404).json({ error: "No matching record for this national ID" });

    // تجهيز كل الأعمدة بالترتيب زي الشيت
    const result = {};
    rows[0].forEach((header, i) => {
      result[header] = found[i] || "";
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
