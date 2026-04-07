// ==================== UPTIME COMMAND ====================
module.exports = {
  pattern: "uptime",
  desc: "Check bot uptime and system stats",
  category: "utility",
  use: ".uptime",
  filename: __filename,

  execute: async (conn, message, m, { from, reply, sender }) => {
    try {
      // Send reaction emoji
      await conn.sendMessage(from, {
        react: { text: "⏰", key: message.key }
      });

      const os = require("os");
      const uptime = process.uptime();
      
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(1);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);

      const cpuLoad = os.loadavg()[0].toFixed(2);
      const uptimeEmoji = days > 0 ? "📅" : hours > 0 ? "⏰" : "⚡";

      const caption = `┌─『 *⏰ BOT UPTIME* 』─♱
♱
♱ ${uptimeEmoji} *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
♱
♱ 💾 *Memory Usage:*
♱ └ Used: ${usedMem}GB / ${totalMem}GB
♱ └ Free: ${freeMem}GB
♱
♱ 🖥️ *System Info:*
♱ └ CPU: ${os.cpus().length} Cores
♱ └ Load: ${cpuLoad}%
♱ └ OS: ${os.type()} ${os.release()}
♱
♱ 🤖 Bot: 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      await conn.sendMessage(from, { text: caption }, { quoted: message });

    } catch (error) {
      console.error("Uptime error:", error);
      reply("❌ Failed to get uptime information.");
    }
  }
};
