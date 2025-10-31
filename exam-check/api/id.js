export default async function handler(req, res) {
  try {
    const { nationalId } = req.query;

    if (!nationalId) {
      return res.status(400).json({ error: "Missing national ID" });
    }

    const sheetId = process.env.SHEET_ID; // لازم تضيفيه في متغيرات Vercel

    // قراءة Google Sheet العام بصيغة JSON
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(url);
    const text = await response.text();

    // تحويل صيغة Google Sheets JSON إلى كائن JS
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows.map((r) => r.c.map((c) => c?.v || ""));

    // البحث عن الرقم القومي مع تجاهل المسافات
    const found = rows.find(
      (row) => row[2]?.toString().replace(/\s+/g, "") === nationalId.replace(/\s+/g, "")
    );

    if (!found) {
      return res.status(404).json({ error: "No matching record for this national ID" });
    }

    // تجهيز البيانات للإرسال
    const result = {
      number: found[0] || "",
      year: found[1] || "",
      nationalId: found[2] || "",
      name: found[3] || "",
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
