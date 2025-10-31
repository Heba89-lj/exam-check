import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // 🔹 استلام الرقم القومي من الرابط
    const { nationalId } = req.query;
    if (!nationalId) {
      return res.status(400).json({ error: "Missing national ID" });
    }

    // 🔹 قراءة بيانات Service Account من متغير البيئة
    // لازم تضيفي GOOGLE_SERVICE_ACCOUNT كـ JSON كامل في Vercel
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    // 🔹 إنشاء Auth للاتصال بـ Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID; // ضيفي هنا الـ Sheet ID في Vercel

    // 🔹 قراءة كل البيانات من الشيت (صفوف)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1", // غيري الاسم إذا كان شيتك اسمه غير Sheet1
    });

    const rows = response.data.values?.slice(1) || []; // تجاهل صف العناوين

    // 🔹 البحث عن الرقم القومي
    const found = rows.find(
      (r) => r[2]?.toString().replace(/\s+/g, "") === nationalId.replace(/\s+/g, "")
    );

    if (!found) {
      return res.status(404).json({ error: "No matching record for this national ID" });
    }

    // 🔹 تجهيز النتيجة للإرسال للواجهة
    const result = {
      examNumber: found[0] || "",
      year: found[1] || "",
      nationalId: found[2] || "",
      applicant: found[3] || "",
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
