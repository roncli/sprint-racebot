/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Race = require("../../models/race");

//  ####                         #            #       ###              #
//  #   #                        #            #      #   #             #
//  #   #   ###   ## #    ###   ####    ###   # ##   #      ## #    ## #
//  ####   #   #  # # #      #   #     #   #  ##  #  #      # # #  #  ##
//  # #    #####  # # #   ####   #     #      #   #  #      # # #  #   #
//  #  #   #      # # #  #   #   #  #  #   #  #   #  #   #  # # #  #  ##
//  #   #   ###   #   #   ####    ##    ###   #   #   ###   #   #   ## #
/**
 * A class that handles the rematch command.
 */
class RematchCmd {
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
        const race = Race.getByChannel(channel);

        if (!race) {
            return;
        }

        await race.rematch(member);
    }
}

module.exports = RematchCmd;
