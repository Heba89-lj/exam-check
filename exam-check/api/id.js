export default async function handler(req, res) {
  try {
    const { nationalId } = req.query;
    if (!nationalId) {
      return res.status(400).json({ error: "Missing national ID" });
    }

    const sheetId = process.env.SHEET_ID; // ضيفي الـ ID بتاع الشيت هنا في Vercel

    // 🔹 قراءة البيانات من Google Sheets العامة (بدون خدمة)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    const response = await fetch(url);
    const text = await response.text();

    // 🔹 تحويل البيانات من JSON خاص بجوجل إلى كائن عادي
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows.map((r) => r.c.map((c) => c?.v || ""));

    // 🔹 البحث عن الرقم القومي
    const found = rows.find(
      (row) => row[2]?.toString().replace(/\s+/g, "") === nationalId.replace(/\s+/g, "")
    );

    if (!found) {
      return res.status(404).json({ error: "No matching record for this national ID" });
    }

    // 🔹 تجهيز النتيجة
    const result = {
      examNumber: found[0] || "",
      year: found[1] || "",
      nationalId: found[2] || "",
      applicant: found[3] || "",
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


// import { google } from "googleapis";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   const { number, year } = req.query;

//   if (!number || !year) {
//     return res.status(400).json({ success: false, message: "ادخلي رقم الفحص والسنة" });
//   }

//   try {
//     const auth = new google.auth.GoogleAuth({
//       credentials: {
//         type: "service_account",
//         project_id: process.env.project_id,
//         private_key: process.env.private_key.replace(/\\n/g, "\n"),
//         client_email: process.env.client_email,
//       },
//       scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//     });

//     const sheets = google.sheets({ version: "v4", auth });
//     const sheetId = process.env.SHEET_ID;

//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: sheetId,
//       range: "Sheet1",
//     });

//     const rows = response.data.values.slice(1); // تجاهل صف العناوين

//     // 🔍 البحث عن الصف المطابق
//     const match = rows.find(
//       (r) =>
//         r[0]?.toString().trim() === number.toString().trim() &&
//         r[1]?.toString().trim() === year.toString().trim()
//     );

//     if (match) {
//       return res.status(200).json({
//         success: true,
//         result: {
//           number: match[0],
//           year: match[1],
//           caseNumber: match[3],
//           applicant: match[4],
//           status: match[5],
//           visa: match[6],
//           notes: match[7],
//         },
//       });
//     } else {
//       return res.status(404).json({ success: false, message: "لم يتم العثور على بيانات لهذا الفحص" });
//     }
//   } catch (error) {
//     console.error("🔥 Error fetching Google Sheet:", error);
//     return res.status(500).json({
//       success: false,
//       message: "حدث خطأ في السيرفر",
//       error: error.message,
//     });
//   }
// }





