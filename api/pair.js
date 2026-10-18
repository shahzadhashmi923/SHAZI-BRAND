import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers } from "@whiskeysockets/baileys";
import fs from "fs";
import pino from "pino";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const num = (req.query.num || "").replace(/[^0-9]/g, "");
  if (!num) return res.status(400).json({ error: "Number do" });

  const dir = `/tmp/${Date.now()}`;
  fs.mkdirSync(dir, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      version: [2, 3000, 1015901307],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"),
      printQRInTerminal: false,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Yahan SHAZIXMD fix code banega, 8 letters ka
    let code = await sock.requestPairingCode(num, "SHAZIXMD");
    if(!code) code = await sock.requestPairingCode(num);
    code = code?.replace(/-/g, "").toUpperCase() || "SHAZIXMD";

    res.json({ code: code });

    setTimeout(() => { try{fs.rmSync(dir,{recursive:true,force:true})}catch{} }, 10000);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
