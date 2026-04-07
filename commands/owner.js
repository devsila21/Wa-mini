// ==================== OWNER (vCard) COMMAND ====================
module.exports = {
  pattern: "owner",
  desc: "Get bot owner contact information",
  category: "utility",
  use: ".owner",
  filename: __filename,

  execute: async (conn, message, m, { from, reply, sender }) => {
    try {
      // Send reaction emoji
      await conn.sendMessage(from, {
        react: { text: "👑", key: message.key }
      });

      // Owner information (Change these to your details)
      const ownerName = "𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡";
      const ownerNumber = "255712345678"; // Change to your number
      const ownerJid = ownerNumber + "@s.whatsapp.net";
      
      // Try to get owner profile picture
      let ownerPp;
      try {
        ownerPp = await conn.profilePictureUrl(ownerJid, "image");
      } catch {
        ownerPp = "https://files.catbox.moe/46utz9.png";
      }

      // Create vCard
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡
TITLE:Bot Owner & Developer
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
URL:https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02
EMAIL:silatech@example.com
NOTE:⚔️ 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 Owner\n𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡\n\nFor support, inquiries, or collaboration.
ROLE:Owner & Developer
REV:${new Date().toISOString()}
END:VCARD`;

      const caption = `┌─『 *👑 BOT OWNER* 』─♱
♱
♱ 👤 *Name:* ${ownerName}
♱ 📞 *Number:* ${ownerNumber}
♱ 🤖 *Bot:* 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸
♱
♱ 📢 *Channel:*
♱ https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02
♱
♱ 💬 *Contact owner for:*
♱ • Bot support
♱ • Feature requests
♱ • Bug reports
♱ • Collaboration
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      // Send vCard contact
      await conn.sendMessage(from, {
        contacts: {
          displayName: ownerName,
          contacts: [{ vcard }]
        },
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363402325089913@newsletter",
            newsletterName: "𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸",
            serverMessageId: 200
          }
        }
      }, { quoted: message });

      // Send additional info with owner picture
      await conn.sendMessage(from, {
        image: { url: ownerPp },
        caption: caption,
        mentions: [ownerJid]
      }, { quoted: message });

    } catch (error) {
      console.error("Owner error:", error);
      reply("❌ Failed to get owner information.");
    }
  }
};
