import { Configuration, OpenAIApi } from "openai";
import * as XLSX from "xlsx";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    const completion = await openai.createChatCompletion({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae el contenido como tabla para exportar a Excel." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1000
    });

    const extracted = completion.data.choices[0].message.content;
    const rows = extracted.trim().split("\n").map(r => r.split(/\s{2,}|\t/));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.status(200).json({ excelBase64: buffer.toString("base64") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar la imagen" });
  }
}
