// === groupevents.js ===
const { isJidGroup } = require('@whiskeysockets/baileys');

const defaultProfilePics = [
  'https://files.catbox.moe/46utz9.png',
  'https://files.catbox.moe/46utz9.png',
  'https://files.catbox.moe/46utz9.png',
];

// Store violation counts per user per group
const violationCounts = new Map();

// Newsletter context (for forwarded-style look)
const getContextInfo = (mentionedJids) => ({
  mentionedJid: mentionedJids,
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363402325089913@newsletter',
    newsletterName: "𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸",
    serverMessageId: 200,
  },
});

// Get user profile picture with fallback
const getUserProfilePic = async (conn, jid) => {
  try {
    const ppUrl = await conn.profilePictureUrl(jid, "image");
    return ppUrl;
  } catch {
    return defaultProfilePics[Math.floor(Math.random() * defaultProfilePics.length)];
  }
};

// Get user name
const getUserName = async (conn, jid) => {
  try {
    const name = await conn.getName(jid);
    return name || jid.split('@')[0];
  } catch {
    return jid.split('@')[0];
  }
};

// Format timestamp
const getTimestamp = () => {
  return new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Fonction Antilink
const antiLinkHandler = async (conn, m, groupId) => {
  try {
    const message = m.message;
    if (!message) return;

    let detectedLink = null;

    if (message.conversation && /https?:\/\/[^\s]+/gi.test(message.conversation)) {
      detectedLink = message.conversation.match(/https?:\/\/[^\s]+/gi)[0];
    }
    
    if (message.extendedTextMessage?.text && /https?:\/\/[^\s]+/gi.test(message.extendedTextMessage.text)) {
      detectedLink = message.extendedTextMessage.text.match(/https?:\/\/[^\s]+/gi)[0];
    }

    if (message.imageMessage?.caption && /https?:\/\/[^\s]+/gi.test(message.imageMessage.caption)) {
      detectedLink = message.imageMessage.caption.match(/https?:\/\/[^\s]+/gi)[0];
    }

    if (message.videoMessage?.caption && /https?:\/\/[^\s]+/gi.test(message.videoMessage.caption)) {
      detectedLink = message.videoMessage.caption.match(/https?:\/\/[^\s]+/gi)[0];
    }

    if (detectedLink) {
      const sender = m.key.participant || m.key.remoteJid;
      const user = sender.split('@')[0];
      
      const userKey = `${groupId}_${sender}`;
      const currentViolations = violationCounts.get(userKey) || 0;
      const newViolations = currentViolations + 1;
      violationCounts.set(userKey, newViolations);
      
      await conn.sendMessage(groupId, {
        delete: {
          id: m.key.id,
          participant: sender,
          remoteJid: groupId,
          fromMe: false
        }
      });

      let warningMsg = '';
      let shouldKick = false;

      if (newViolations >= 3) {
        warningMsg = `┌─『 *⚠️ FINAL WARNING* 』─♱
♱
♱ @${user} has been removed from the group
♱ for sharing links 3 times!
♱ Violations: ${newViolations}/3
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        shouldKick = true;
      } else if (newViolations === 2) {
        warningMsg = `┌─『 *⚠️ SECOND WARNING* 』─♱
♱
♱ @${user} - Link detected!
♱ Violations: ${newViolations}/3
♱ Next violation = removal from group
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
      } else {
        warningMsg = `┌─『 *⚠️ FIRST WARNING* 』─♱
♱
♱ @${user} - Link detected!
♱ Violations: ${newViolations}/3
♱ Please stop sharing links in this group
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
      }

      await conn.sendMessage(groupId, {
        text: warningMsg,
        mentions: [sender]
      });

      if (shouldKick) {
        try {
          await conn.groupParticipantsUpdate(groupId, [sender], "remove");
          violationCounts.delete(userKey);
        } catch (kickError) {
          console.error("Failed to kick user:", kickError);
          await conn.sendMessage(groupId, {
            text: `❌ Failed to remove @${user}. Bot may need admin permissions.`,
            mentions: [sender]
          });
        }
      }

      return true;
    }
  } catch (error) {
    console.error("Antilink error:", error);
  }
  return false;
};

// Reset violations
const resetViolations = (groupId, userId = null) => {
  if (userId) {
    const userKey = `${groupId}_${userId}`;
    violationCounts.delete(userKey);
  } else {
    for (const [key] of violationCounts) {
      if (key.startsWith(groupId)) {
        violationCounts.delete(key);
      }
    }
  }
};

// Get violation count
const getViolationCount = (groupId, userId) => {
  const userKey = `${groupId}_${userId}`;
  return violationCounts.get(userKey) || 0;
};

module.exports = async (conn, update) => {
  try {
    const { id, participants, action, desc, subject, profilePicture } = update || {};
    
    if (!id || !isJidGroup(id)) return;

    const groupMetadata = await conn.groupMetadata(id);
    const groupName = groupMetadata.subject || "Group";
    const groupDesc = groupMetadata.desc || "No description available.";
    const groupMembersCount = groupMetadata.participants?.length || 0;
    const timestamp = getTimestamp();

    // === GROUP PARTICIPANTS EVENTS (add/remove) ===
    if (participants && participants.length > 0) {
      for (const participant of participants) {
        const userName = participant.split('@')[0];
        const userJid = participant;
        const userPpUrl = await getUserProfilePic(conn, participant);
        const userFullName = await getUserName(conn, participant);

        // === WELCOME EVENT (Someone joined) ===
        if (action === "add") {
          const welcomeText = `┌─『 *🎉 WELCOME TO GROUP* 』─♱
♱
♱ 👋 Hello @${userFullName}!
♱ 🏠 Group: ${groupName}
♱ 🔢 Member #: ${groupMembersCount}
♱ 🕒 Joined: ${timestamp}
♱
♱ 📝 Group Description:
♱ ${groupDesc.substring(0, 100)}${groupDesc.length > 100 ? '...' : ''}
♱
♱ ⚔️ Follow Bot Updates:
♱ https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

          await conn.sendMessage(id, {
            image: { url: userPpUrl },
            caption: welcomeText,
            mentions: [participant],
            contextInfo: getContextInfo([participant]),
          });
        }

        // === GOODBYE EVENT (Someone left/was removed) ===
        else if (action === "remove") {
          const goodbyeText = `┌─『 *👋 GOODBYE* 』─♱
♱
♱ 😢 @${userFullName} has left the group
♱ 🏠 Group: ${groupName}
♱ 🕒 Time: ${timestamp}
♱ 👥 Remaining members: ${groupMembersCount}
♱
♱ 🌟 You will be missed!
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

          await conn.sendMessage(id, {
            image: { url: userPpUrl },
            caption: goodbyeText,
            mentions: [participant],
            contextInfo: getContextInfo([participant]),
          });
        }
      }
    }

    // === ADMIN EVENTS ===
    // Promote event
    if (action === "promote" && participants) {
      for (const participant of participants) {
        const userFullName = await getUserName(conn, participant);
        const userPpUrl = await getUserProfilePic(conn, participant);
        
        const promoteText = `┌─『 *👑 PROMOTED TO ADMIN* 』─♱
♱
♱ 🎉 Congratulations @${userFullName}!
♱ ⚡ You have been promoted to ADMIN
♱ 🏠 Group: ${groupName}
♱ 🕒 Time: ${timestamp}
♱
♱ Use your power wisely!
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(id, {
          image: { url: userPpUrl },
          caption: promoteText,
          mentions: [participant],
          contextInfo: getContextInfo([participant]),
        });
      }
    }

    // Demote event
    else if (action === "demote" && participants) {
      for (const participant of participants) {
        const userFullName = await getUserName(conn, participant);
        const userPpUrl = await getUserProfilePic(conn, participant);
        
        const demoteText = `┌─『 *📛 DEMOTED* 』─♱
♱
♱ 😔 @${userFullName} has been demoted
♱ 🔻 Removed from ADMIN role
♱ 🏠 Group: ${groupName}
♱ 🕒 Time: ${timestamp}
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(id, {
          image: { url: userPpUrl },
          caption: demoteText,
          mentions: [participant],
          contextInfo: getContextInfo([participant]),
        });
      }
    }

    // === GROUP SETTINGS EVENTS ===
    // Subject (group name) changed
    if (subject && subject !== groupMetadata.subject) {
      const subjectText = `┌─『 *📝 GROUP NAME CHANGED* 』─♱
♱
♱ 🏠 Old Name: ${groupMetadata.subject}
♱ ✨ New Name: ${subject}
♱ 👤 Changed by: ${await getUserName(conn, update.author || 'Unknown')}
♱ 🕒 Time: ${timestamp}
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      await conn.sendMessage(id, { text: subjectText });
    }

    // Description changed
    if (desc && desc !== groupMetadata.desc) {
      const descText = `┌─『 *📄 GROUP DESCRIPTION CHANGED* 』─♱
♱
♱ 📝 New Description:
♱ ${desc.substring(0, 200)}${desc.length > 200 ? '...' : ''}
♱ 👤 Changed by: ${await getUserName(conn, update.author || 'Unknown')}
♱ 🕒 Time: ${timestamp}
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      await conn.sendMessage(id, { text: descText });
    }

    // Group icon (profile picture) changed
    if (profilePicture) {
      let oldPpUrl = null;
      try {
        oldPpUrl = await conn.profilePictureUrl(id, "image");
      } catch {
        oldPpUrl = null;
      }

      const iconText = `┌─『 *🖼️ GROUP ICON CHANGED* 』─♱
♱
♱ 📸 Group profile picture has been updated!
♱ 👤 Changed by: ${await getUserName(conn, update.author || 'Unknown')}
♱ 🕒 Time: ${timestamp}
♱
└───────────────♱
> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

      await conn.sendMessage(id, { text: iconText });
    }

  } catch (err) {
    console.error("GroupEvents error:", err);
  }
};

// Export functions for external use
module.exports.antiLinkHandler = antiLinkHandler;
module.exports.resetViolations = resetViolations;
module.exports.getViolationCount = getViolationCount;
module.exports.violationCounts = violationCounts;