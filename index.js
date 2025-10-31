import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 👇 ESTA ES TU DIRECCIÓN REAL DE NODE-RED:
const NODE_RED_URL = "https://761526-nodered.proxyrelay12.victronenergy.com/alexa";

// ==========================
// 📡 ENDPOINT PRINCIPAL ALEXA
// ==========================
app.post("/alexa", async (req, res) => {
  try {
    console.log("📩 Petición recibida desde Alexa");

    // Reenviar la solicitud completa a Node-RED
    const response = await fetch(NODE_RED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    // Leer texto (por si no es JSON válido)
    const text = await response.text();
    console.log("📤 Respuesta de Node-RED:", text);

    // Intentar enviar lo mismo de vuelta a Alexa
    res.type("json").send(text);
  } catch (err) {
    console.error("❌ Error al reenviar a Node-RED:", err.message);

    // Si falla la conexión con Node-RED
    res.status(500).json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "No se pudo conectar con el sistema Victron. Verifica la conexión de Node-RED.",
        },
        shouldEndSession: true,
      },
    });
  }
});

// ==========================
// 🚀 INICIAR SERVIDOR EXPRESS
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Alexa-Victron activo en puerto ${PORT}`);
});
