const { log } = global.utils;
const axios = require('axios');

module.exports = async function ({
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  threadsData,
  usersData,
  dashBoardData,
  globalData,
  getText
}) {
  // Refresh fb_dtsg every 48 hours
  setInterval(async () => {
    api.refreshFb_dtsg()
      .then(() => {
        log.succes("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
      })
      .catch((err) => {
        log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
      });
  }, 1000 * 60 * 60 * 48); // 48h

  // ⛓ Hardcode prefix here for reliability
  const prefix = "`"; // set your desired prefix here

  api.listenMqtt(async (err, message) => {
    if (err || !message.body) return;

    const body = message.body.trim();

    // If message doesn't start with the prefix, ignore it
    if (!body.startsWith(prefix)) return;

    // Extract command and arguments
    const [cmd, ...rest] = body.slice(prefix.length).trim().split(" ");
    const input = rest.join(" ").trim();

    if (cmd.toLowerCase() === "imagine") {
      if (!input) {
        return api.sendMessage("🖼️ Please write what to imagine. Example: `imagine forest made of glass", message.threadID);
      }

      try {
        const res = await axios.get(`https://lexica.art/api/v1/search?q=${encodeURIComponent(input)}`);
        const img = res.data?.images?.[0]?.srcSmall;
        if (!img) return api.sendMessage("⚠️ No image found for your prompt.", message.threadID);

        const imageStream = await global.utils.getStreamFromURL(img);
        api.sendMessage({
          body: `🎨 Here's your AI image for: "${input}"`,
          attachment: imageStream
        }, message.threadID);
      } catch (e) {
        api.sendMessage("❌ Failed to fetch image. Try again later.", message.threadID);
      }
    } else {
      // Optional: reply to other commands
      api.sendMessage("❓ Unknown custom command. Try `imagine something", message.threadID);
    }
  });
};
