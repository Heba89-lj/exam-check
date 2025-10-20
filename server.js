import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/search", async (req, res) => {
  const { number, year } = req.query;
  const sheetId = process.env.SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`
    );
    const data = await response.json();
    const rows = data.values;

    const match = rows.find(
      (r) => r[1] === number && r[2] === year
    );

    if (match) {
      res.json({
        success: true,
        result: {
          name: match[0],
          number: match[1],
          year: match[2],
        },
      });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
