// -------------------------------------------------------------
// ALEXA HANDLER COMPLETO CON LaunchRequest
// -----------------------------------------------------------
app.post("/", async (req, res) => {
    console.log("====== ALEXA REQUEST ======");
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const requestType = req.body.request?.type;

        // -----------------------------
        // LaunchRequest
        // -----------------------------
        if (requestType === "LaunchRequest") {
            return res.json({
                version: "1.0",
                response: {
                    outputSpeech: {
                        type: "PlainText",
                        text: "Bienvenido al sistema Victron. Puedes pedirme el estado de la batería o la producción solar."
                    },
                    shouldEndSession: false
                }
            });
        }

        // -----------------------------
        // IntentRequest
        // -----------------------------
        if (requestType === "IntentRequest") {
            const intent = req.body.request.intent?.name;

            if (intent === "AbrirSistemaVictronIntent") {
                return res.json({
                    version: "1.0",
                    response: {
                        outputSpeech: { type: "PlainText", text: "El sistema Victron está activo." },
                        shouldEndSession: true
                    }
                });
            }

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

            // DEFAULT INTENT
            return res.json({
                version: "1.0",
                response: {
                    outputSpeech: { type: "PlainText", text: "No entendí la solicitud." },
                    shouldEndSession: true
                }
            });
        }

        // DEFAULT REQUEST TYPE
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
                outputSpeech: { type: "PlainText", text: "Hubo un problema con la respuesta de la skill." },
                shouldEndSession: true
            }
        });
    }
});
