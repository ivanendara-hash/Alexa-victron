import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VRM_TOKEN = process.env.VRM_TOKEN;
const VRM_INSTALLATION_ID = process.env.VRM_INSTALLATION_ID;

app.get("/", (req, res) => {
  res.send("✅ Alexa-Victron activo.");
});

app.post("/alexa", async (req, res) => {
  try {
    const requestType = req.body.request?.type;

    if (requestType === "LaunchRequest") {
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Bienvenido al sistema Victron Solar. Puedes preguntarme cómo está la batería o cuánta energía solar estás generando.",
          },
          shouldEndSession: false,
        },
      });
    }

    if (requestType === "IntentRequest") {
      const intentName = req.body.request.intent.name;

      if (intentName === "EstadoEnergiaIntent") {
        const url = `https://vrmapi.victronenergy.com/v2/installations/${VRM_INSTALLATION_ID}/widgets/Overview?_=123`;
        const response = await fetch(url, {
          headers: { "X-Authorization": `Bearer ${VRM_TOKEN}` },
        });
        const data = await response.json();

        const soc = data?.records?.battery?.stateOfCharge?.value ?? "desconocido";
        const solar = data?.records?.pvPower?.value ?? 0;

        const mensaje = `La batería está al ${Math.round(soc)} por ciento y la producción solar es de ${Math.round(solar)} vatios.`;

        return res.json({
          version: "1.0",
          response: {
            outputSpeech: { type: "PlainText", text: mensaje },
            shouldEndSession: true,
          },
        });
      }
    }

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: "No entendí tu solicitud." },
        shouldEndSession: true,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocurrió un error al obtener los datos del sistema Victron.",
        },
        shouldEndSession: true,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Alexa-Victron corriendo en puerto ${PORT}`);
});
