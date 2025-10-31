import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// Endpoint raíz de prueba
app.get("/", (req, res) => {
  res.send("✅ Alexa Victron Skill activa y lista");
});

// Redirección del webhook de Alexa hacia Node-RED
app.post("/alexa", async (req, res) => {
  try {
    const nodeRedURL = "http://127.0.0.1:1880/alexa"; // URL local si está en el mismo servidor
    const response = await fetch(nodeRedURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error reenviando a Node-RED:", err);
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Hubo un error al conectar con el sistema Victron.",
        },
        shouldEndSession: true,
      },
    });
  }
});

// Puerto Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor Alexa Victron activo en puerto ${PORT}`));
