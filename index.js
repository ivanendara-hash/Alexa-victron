// ================================
//  Victron – Alexa Backend
// ================================

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());

// ================================
//  ENVIRONMENT VARIABLES
// ================================
// 👉 Tu email ya configurado
const VRM_USERNAME = "ivanendara@gmail.com";

// 👉 Tu instalación fija: CASA = 761526
const VRM_SYSTEM_ID = "761526";

// 👉 El token debes ponerlo en Render
const VRM_TOKEN = "e928db2f99325349a62acdf5e61f51b8187a07dd45515be4bd2703357b235809";

if (!VRM_TOKEN) {
  console.error("❌ ERROR: Falta VRM_TOKEN (pónlo en Render)");
}

// ================================
//  VRM FETCH FUNCTION
// ================================
async function vrmRequest(path) {
  const url = `https://vrmapi.victronenergy.com/v2/${path}`;

  const headers = {
    "X-Authorization": `Bearer ${VRM_TOKEN}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { headers });

  // Debug para 401
  if (!response.ok) {
    console.log(`❌ Error VRM: HTTP ${response.status}`);
    const errorBody = await response.text();
    console.log("➡️ Respuesta de VRM:", errorBody);
    throw new Error(`VRM error HTTP ${response.status}`);
  }

  return response.json();
}

// ================================
//  ROOT
// ================================
app.get("/", (req, res) => {
  res.send("🚀 Victron Alexa API funcionando correctamente.");
});

// ================================
//  Battery Endpoint
// ================================
app.get("/battery", async (req, res) => {
  try {
    const result = await vrmRequest(
      `installations/${VRM_SYSTEM_ID}/stats?type=battery`
    );

    const soc = result?.records?.[0]?.battery?.soc;

    if (soc === undefined) {
      return res.json({
        message: "No puedo obtener el estado de la batería.",
      });
    }

    res.json({
      message: `La batería está al ${soc}%`,
      soc,
    });

  } catch (err) {
    res.json({
      message: "No puedo leer la batería.",
      error: err.message,
    });
  }
});

// ================================
//  Solar Endpoint
// ================================
app.get("/solar", async (req, res) => {
  try {
    const result = await vrmRequest(
      `installations/${VRM_SYSTEM_ID}/stats?type=solar`
    );

    const solar = result?.records?.[0]?.solar;

    if (!solar) {
      return res.json({
        message: "No puedo obtener la producción solar.",
      });
    }

    res.json({
      message: `Producción solar actual: ${solar} W`,
      solar,
    });

  } catch (err) {
    res.json({
      message: "No puedo leer la producción solar.",
      error: err.message,
    });
  }
});

// ================================
//  Start Server
// ================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`⚡ Alexa bridge conectado en puerto ${PORT}`);
  console.log(`📡 Instalación VRM: ${VRM_SYSTEM_ID}`);
  console.log(`👤 Usuario VRM: ${VRM_USERNAME}`);
});
