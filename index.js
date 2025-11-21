// index.js
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// CONFIG VRM
// --------------------------------------------------
const VRM_SYSTEM_ID = process.env.VRM_ID; 
const VRM_TOKEN = process.env.VRM_TOKEN;

// --------------------------------------------------
// Función para leer datos del VRM
// --------------------------------------------------
async function leerVRM(path) {
    const url = `https://vrmapi.victronenergy.com/v2/installations/${VRM_SYSTEM_ID}/${path}`;
    try {
        const response = await fetch(url, {
            headers: { "X-Authorization": `Bearer ${VRM_TOKEN}` }
        });
        if (!response.ok) {
            console.error("Error VRM:", await response.text());
            throw new Error("Error leyendo VRM");
        }
        const data = await response.json();
        console.log("VRM DATA:", JSON.stringify(data, null, 2)); // para depuración
        return data;
    } catch (err) {
        console.error("Fallo al conectar con VRM:", err);
        throw err;
    }
}

// --------------------------------------------------
// ALEXA HANDLER
// --------------------------------------------------
app.post("/", async (req, res) => {
    console.log("====== ALEXA REQUEST ======");
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const intent = req.body.request?.intent?.name;

        // -----------------------------
        // INTENT: Abrir sistema Victron
        // -----------------------------
        if (intent === "AbrirSistemaVictronIntent") {
            return res.json({
                version: "1.0",
                response: {
                    outputSpeech: { type: "PlainText", text: "El sistema Victron está activo." },
                    shouldEndSession: true
                }
            });
        }

        // -----------------------------
        // INTENT: Estado de batería
        // -----------------------------
        if (intent === "EstadoBateriaIntent") {
            const data = await leerVRM("system-overview");
            const soc = data?.records?.battery?.stateOfCharge ?? null;

            const texto = soc !== null
                ? `El estado de la batería es ${soc} por ciento.`
                : "No pude obtener el estado de la batería.";

            return res.json({
                version: "1.0",
                response: {
                    outputSpeech: { type: "PlainText", text: texto },
                    shouldEndSession: true
                }
            });
        }

        // -----------------------------
        // INTENT: Producción Solar
        // -----------------------------
        if (intent === "ProduccionSolarIntent") {
            const data = await leerVRM("system-overview");
            const solar = data?.records?.solar?.power ?? null;

            const texto = solar !== null
                ? `La producción solar actual es de ${solar} vatios.`
                : "No pude obtener la producción solar.";

            return res.json({
                version: "1.0",
                response: {
                    outputSpeech: { type: "PlainText", text: texto },
                    shouldEndSession: true
                }
            });
        }

        // -----------------------------
        // DEFAULT
        // -----------------------------
        return res.json({
            version: "1.0",
            response: {
                outputSpeech: { type: "PlainText", text: "No entendí la solicitud." },
                shouldEndSession: true
            }
        });

    } catch (error) {
        console.error("ERROR:", error);
        return res.json({
            version: "1.0",
            response: {
                outputSpeech: {
                    type: "PlainText",
                    text: "Hubo un problema con la respuesta de la skill."
                },
                shouldEndSession: true
            }
        });
    }
});

// --------------------------------------------------
// SERVIDOR LISTO
// --------------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor Alexa Victron escuchando en puerto ${PORT}`);
});
