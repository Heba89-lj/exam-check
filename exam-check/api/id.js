import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // 🔹 استخراج الرقم القومي من الرابط (query string)
    const { nationalId } = req.query;
    if (!nationalId) {
      return res.status(400).json({ error: "Missing national ID" });
    }

    // 🔹 قراءة بيانات الحساب السري من متغير البيئة
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    // 🔹 إنشاء اتصال آمن بـ Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 🔹 تحديد الـ Sheet ID
    const spreadsheetId = process.env.SHEET_ID; // ضيفي SHEET_ID في Vercel

    // 🔹 قراءة البيانات من الشيت (الصفوف)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:D", // العمود A إلى D
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    // 🔹 البحث عن الصف اللي فيه الرقم القومي
    const found = rows.find(
      (row) => row[2]?.replace(/\s+/g, "") === nationalId.replace(/\s+/g, "")
    );

    if (!found) {
      return res
        .status(404)
        .json({ error: "No matching record for this national ID" });
    }

    // 🔹 تجهيز النتيجة (A=رقم الفحص, B=السنة, C=الرقم القومي, D=اسم مقدم الطلب)
    const result = {
      examNumber: found[0] || "",
      year: found[1] || "",
      nationalId: found[2] || "",
      applicant: found[4] || "",
    };

    console.log("✅ Found record:", result);

    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
