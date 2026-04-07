// ==================== PING COMMAND ====================
module.exports = {
  pattern: "ping",
  desc: "Check bot response speed",
  category: "utility",
  use: ".ping",
  filename: __filename,

  execute: async (conn, message, m, { from, reply, sender }) => {
    try {
      // Send reaction emoji
      await conn.sendMessage(from, {
        react: { text: "🏓", key: message.key }
      });

      const start = Date.now();
      const pingMsg = await conn.sendMessage(from, { text: "┌─『 *📡 PINGING...* 』─♱\n♱\n♱ ⚡ Measuring response time...\n♱\n└───────────────♱" }, { quoted: message });
      const end = Date.now();
      const responseTime = (end - start) / 1000;

      const speedEmoji = responseTime < 1 ? "🚀" : responseTime < 2 ? "⚡" : "🐢";
      
      const caption = `┌─『 *🏓 PONG!* 』─♱
♱
♱ ${speedEmoji} Response Time: *${responseTime.toFixed(2)}s*
♱ 📡 Status: ${responseTime < 2 ? '✅ Excellent' : responseTime < 4 ? '⚠️ Good' : '❌ Slow'}
♱
♱ 🤖 Bot: 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      await conn.sendMessage(from, {
        text: caption,
        edit: pingMsg.key
      });

    } catch (error) {
      console.error("Ping error:", error);
      reply("❌ Failed to check ping.");
    }
  }
};
