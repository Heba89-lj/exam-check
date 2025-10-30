// import { google } from "googleapis";

// export default async function handler(req, res) {
//   try {
//     // 🔹 استخراج الرقم القومي من الرابط (query string)
//     const { nationalId } = req.query;
//     if (!nationalId) {
//       return res.status(400).json({ error: "Missing national ID" });
//     }

//     // 🔹 قراءة بيانات الحساب السري من متغير البيئة
//     const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

//     // 🔹 إنشاء اتصال آمن بـ Google Sheets
//     const auth = new google.auth.GoogleAuth({
//       credentials: serviceAccount,
//       scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//     });

//     const sheets = google.sheets({ version: "v4", auth });

//     // 🔹 تحديد الـ Sheet ID
//     const spreadsheetId = process.env.SHEET_ID; // ضيفي SHEET_ID في Vercel

//     // 🔹 قراءة البيانات من الشيت (الصفوف)
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: "Sheet1!A:D", // العمود A إلى D
//     });

//     const rows = response.data.values;
//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ error: "No data found" });
//     }

//     // 🔹 البحث عن الصف اللي فيه الرقم القومي
//     const found = rows.find(
//       (row) => row[2]?.replace(/\s+/g, "") === nationalId.replace(/\s+/g, "")
//     );

//     if (!found) {
//       return res
//         .status(404)
//         .json({ error: "No matching record for this national ID" });
//     }

//     // 🔹 تجهيز النتيجة (A=رقم الفحص, B=السنة, C=الرقم القومي, D=اسم مقدم الطلب)
//     const result = {
//       examNumber: found[0] || "",
//       year: found[1] || "",
//       nationalId: found[2] || "",
//       applicant: found[4] || "",
//     };

//     console.log("✅ Found record:", result);

//     return res.status(200).json(result);
//   } catch (err) {
//     console.error("❌ Server error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { number, year } = req.query;

  if (!number || !year) {
    return res.status(400).json({ success: false, message: "ادخلي رقم الفحص والسنة" });
  }

  const sheetId = process.env.SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    const response = await fetch(url);
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "رد غير صالح من Google Sheets",
        details: rawText,
      });
    }

    const rows = data.values?.slice(1) || [];

    // 🔍 البحث عن الصف المطابق (مع تجاهل الرقم القومي)
    const match = rows.find((r) =>
      r[0]?.toString().trim() === number.toString().trim() &&
      r[1]?.toString().trim() === year.toString().trim()
    );

    if (match) {
      return res.status(200).json({
        success: true,
        result: {
          number: match[0],
          year: match[1],
          caseNumber: match[3],
          applicant: match[4],
          status: match[5],
          visa: match[6],
          notes: match[7],
        },
      });
    } else {
      return res.status(404).json({ success: false, message: "لم يتم العثور على بيانات لهذا الفحص" });
    }
  } catch (error) {
    console.error("🔥 Error fetching Google Sheet:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
}
