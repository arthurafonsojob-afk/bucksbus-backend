// ✅ BACKEND COMPLETO — index.js com BucksBus + Shopify Webhook

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const apiKey = "SUA_API_KEY";
const apiSecret = "SEU_API_SECRET";
const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

// 🧲 RECEBE CONFIRMAÇÃO DA BUCKSBUS
app.post("/webhook/bucksbus", async (req, res) => {
  const { event, payment } = req.body;
  if (event === "payment.complete" && payment.status === "COMPLETE") {
    console.log(`💰 Pagamento confirmado! Pedido: ${payment.custom}`);
    // Aqui você atualiza o pedido no seu sistema (Shopify, banco, etc)
  }
  res.sendStatus(200);
});

// 🚀 CRIA PAGAMENTO MANUAL (usado pelo script do Shopify, se quiser usar)
app.post("/criar-pagamento", async (req, res) => {
  const { orderId, email, valorUSD } = req.body;
  try {
    const response = await axios.post(
      "https://api.bucksbus.com/int/payment",
      {
        amount: valorUSD,
        asset_id: "USD",
        payment_asset_id: "BTC",
        payment_type: "FIXED_AMOUNT",
        custom: orderId,
        payer_email: email,
        webhook_url: "https://bucksbus-backend-production.up.railway.app/webhook/bucksbus"
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ payment_url: response.data.payment_url });
  } catch (err) {
    console.error("Erro:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// 🧠 WEBHOOK DE PEDIDO CRIADO (APP PRIVADO SHOPIFY)
app.post("/shopify/order-created", async (req, res) => {
  const pedido = req.body;
  const valorUSD = parseFloat(pedido.total_price);
  const orderId = `order_${pedido.name}`;
  const email = pedido.email;

  try {
    const response = await axios.post(
      "https://api.bucksbus.com/int/payment",
      {
        amount: valorUSD,
        asset_id: "USD",
        payment_asset_id: "BTC",
        payment_type: "FIXED_AMOUNT",
        custom: orderId,
        payer_email: email,
        webhook_url: "https://bucksbus-backend-production.up.railway.app/webhook/bucksbus"
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json"
        }
      }
    );

    const payment_url = response.data.payment_url;
    console.log(`✅ Pagamento gerado para o pedido ${orderId}: ${payment_url}`);
  } catch (error) {
    console.error("❌ Erro ao criar pagamento BucksBus:", error.response?.data || error);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
