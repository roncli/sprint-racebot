/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Discord = require(".."),
    Race = require("../../models/race");

//   ###    ##                          ###              #
//  #   #    #                         #   #             #
//  #        #     ###    ###    ###   #      ## #    ## #
//  #        #    #   #  #      #   #  #      # # #  #  ##
//  #        #    #   #   ###   #####  #      # # #  #   #
//  #   #    #    #   #      #  #      #   #  # # #  #  ##
//   ###    ###    ###   ####    ###    ###   #   #   ## #
/**
 * A class that handles the close command.
 */
class CloseCmd {
    // #                    #  ##
    // #                    #   #
    // ###    ###  ###    ###   #     ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  # ##  #  #  #  #   #    ##
    // #  #   # #  #  #   ###  ###    ##
    /**
     * Handles the command.
     * @param {DiscordJs.GuildMember} member The member using the command.
     * @param {DiscordJs.TextChannel} channel The channel the command is being used in.
     * @returns {Promise} A promise that returns when the command is done executing.
     */
    static async handle(member, channel) {
        if (!member.roles.cache.has(Discord.staffRole.id)) {
            return;
        }

        const race = Race.getByChannel(channel);

        if (race) {
            await race.close(member);
        } else if (channel.parent && channel.parent.id === Discord.raceCategory.id) {
            await channel.delete(`The stale race room ${channel.name} was closed by ${member}.`);
        }
    }
}

module.exports = CloseCmd;
