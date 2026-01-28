import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";

async function startBot() {
  // ✅ Authentication state stored in 'auth' folder
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  // ✅ Create WhatsApp socket
  const sock = makeWASocket({ auth: state });

  // ✅ Save credentials automatically
  sock.ev.on("creds.update", saveCreds);

  // ✅ Connection updates: QR, open, close
  sock.ev.on("connection.update", ({ qr, connection, lastDisconnect }) => {
    if (qr) {
      // Save QR to file (mobile-friendly)
      fs.writeFileSync("qr.txt", qr);
      console.log("📱 QR saved to qr.txt — Scan this in WhatsApp");

      // Optional: show QR in terminal
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") console.log("✅ WhatsApp Connected!");

    if (connection === "close") {
      console.log("🔴 Disconnected from WhatsApp");
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("♻️ Reconnecting...");
        startBot();
      }
    }
  });

  // ✅ Listen for incoming messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    console.log("💬 Message received:", text);

    // Simple auto-reply for everyone
    if (text?.toLowerCase() === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "Hello 😄 Main tumhara WhatsApp bot hoon!"
      });
      console.log("✅ Replied to 'hi'");
    }

    // Owner-only command example
    const ownerNumber = "447456438872@s.whatsapp.net"; // Replace with your number
    if (msg.key.remoteJid === ownerNumber && text?.toLowerCase() === "status") {
      await sock.sendMessage(ownerNumber, {
        text: "Bot is running ✅"
      });
      console.log("✅ Owner requested status");
    }
  });
}

// ✅ Start the bot
startBot().catch((err) => console.log("Error starting bot:", err));
