export default async function handler(req, res) {
  const { number, year } = req.query;

  if (!number || !year) {
    return res.status(400).json({ success: false, message: "ادخلي رقم الفحص والسنة" });
  }

  const sheetId = process.env.SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) return res.status(500).json({ success: false, message: "خطأ في الشيت" });

    const rows = data.values.slice(1); // تجاهل العناوين
    const match = rows.find(
      (r) => r[0]?.toString().trim() === number.toString().trim() &&
             r[1]?.toString().trim() === year.toString().trim()
    );

    if (match) {
      return res.status(200).json({
        success: true,
        result: {
          number: match[0],
          year: match[1],
          caseNumber: match[2],
          applicant: match[3],
          status: match[4],
          visa: match[5],
          notes: match[6],
        },
      });
    } else {
      return res.status(404).json({ success: false, message: "لم يتم العثور على بيانات لهذا الفحص" });
    }
  } catch (err) {
    console.error("🔥 Error fetching Google Sheet:", err);
    return res.status(500).json({ success: false, message: "حدث خطأ في السيرفر", error: err.message });
  }
}
