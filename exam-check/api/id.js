// api/id.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { nationalId } = req.query;

  if (!nationalId || nationalId.length !== 14) {
    return res.status(400).json({
      success: false,
      message: "من فضلك أدخل الرقم القومي المكون من 14 رقمًا فقط.",
    });
  }

  // تحويل الأرقام العربية إلى إنجليزية
  const normalize = (str = "") =>
    str.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]).trim();

  const nid = normalize(nationalId);

  const SHEET_ID = process.env.SHEET_ID; // ضع هنا ID الشيت في env
  const API_KEY = process.env.API_KEY;   // ضع هنا مفتاح API في env

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`;
    const response = await fetch(url);
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Google API returned invalid JSON:", rawText);
      return res.status(500).json({
        success: false,
        message: "رد غير صالح من Google Sheets",
      });
    }

    if (!response.ok || data.error) {
      return res.status(500).json({
        success: false,
        message: "خطأ في الوصول إلى Google Sheet",
      });
    }

    const rows = data.values?.slice(1) || []; // تجاهل العنوان
    const results = rows.filter(r => normalize(r[2]) === nid); // العمود الثالث = الرقم القومي

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لا توجد نتائج لهذا الرقم القومي",
      });
    }

    // ترتيب الأعمدة في الشيت: رقم الفحص | السنة | الرقم القومي | رقم القضية | اسم مقدم الطلب | حالة الفحص | ما تم | ملاحظات
    const formatted = results.map(r => ({
      testNumber: r[0],
      year: r[1],
      name: r[4],
    }));

    return res.status(200).json({ success: true, data: formatted });

  } catch (error) {
    console.error("🔥 Error fetching Google Sheet:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
}
