import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

async function startBot() {
  // ✅ Authentication state stored in 'auth' folder
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  // ✅ Create WhatsApp socket
  const sock = makeWASocket({ auth: state });

  // ✅ Save credentials whenever updated
  sock.ev.on("creds.update", saveCreds);

  // ✅ Connection updates (QR, online, reconnect)
  sock.ev.on("connection.update", ({ qr, connection, lastDisconnect }) => {
    if (qr) {
      console.log("📱 QR RECEIVED (Scan this in WhatsApp):");
      qrcode.generate(qr, { small: true }); // Mobile friendly QR
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
    }

    if (connection === "close") {
      console.log("🔴 Disconnected from WhatsApp");
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("♻️ Reconnecting...");
        startBot();
      }
    }
  });

  // ✅ Listen for incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    // Ignore messages sent by bot itself
    if (!msg.message || msg.key.fromMe) return;

    // Get text message content
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    console.log("💬 Message received:", text);

    // Simple auto-reply
    if (text?.toLowerCase() === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Hello 😄 Main tumhara WhatsApp bot hoon!"
      });
      console.log("✅ Replied to 'hi'");
    }
  });
}

// ✅ Start the bot
startBot().catch((err) => console.log("Error starting bot:", err));
