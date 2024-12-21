const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberUpdate, // Name of the event
  execute(oldMember, newMember) {
    const trackedRoleId = '891051293584547910'; // The role we are tracking

    const roleAdded = newMember.roles.cache.has(trackedRoleId) && !oldMember.roles.cache.has(trackedRoleId);

    if (roleAdded) {
      console.log(`${newMember.user.tag} has been assigned the tracked role.`);

      // IDs of roles to be added
      const additionalRoleIds = [
        '1082211526422831185', '985439876541468702', '925846183828652042', 
        '891040105765167164', '919634217762168933', '891040181552042024', 
        '1075477761877102662', '891039890198900786', '939969829224480788', 
        '1234138426920534087', '893142220331425863'
      ];

      // Adding the roles to the member
      newMember.roles.add(additionalRoleIds).then(() => {
        console.log(`Successfully added additional roles to ${newMember.user.tag}`);

        const infoMessage = `:tada: Congratulations on reaching the first star rank in **${newMember.guild.name}**! :star2:
- You're now able to access more of the server, including most of it's additional channels.
- You also now have access to sending pictures, GIFs, and other features!
- Head over to our channel selection area here: https://discord.com/channels/858622511574679562/891012819624030269 to explore and customize your experience.

If you have any questions or need help, don't hesitate to ask—we're here to help! :blush:`;

        // Send DM to the user with information
        newMember.send(infoMessage).catch((error) => {
          console.error(`Could not send DM to ${newMember.user.tag}. Error:`, error);

          const notificationChannelId = '878901585709789204'; // Fallback channel to send message if DM fails
          const channel = newMember.guild.channels.cache.get(notificationChannelId);
          if (channel) {
            channel.send(`${newMember}, I couldn't send you a DM, but here's the info: ${infoMessage}`);
          }
        });
      }).catch((error) => {
        console.error(`Failed to add roles to ${newMember.user.tag}. Error:`, error);
      });
    }
  }
};