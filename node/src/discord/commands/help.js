/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Discord = require(".."),
    pjson = require("../../../package.json");

//  #   #          ##            ###              #
//  #   #           #           #   #             #
//  #   #   ###     #    # ##   #      ## #    ## #
//  #####  #   #    #    ##  #  #      # # #  #  ##
//  #   #  #####    #    ##  #  #      # # #  #   #
//  #   #  #        #    # ##   #   #  # # #  #  ##
//  #   #   ###    ###   #       ###   #   #   ## #
//                       #
//                       #
/**
 * A class that handles the help command.
 */
class HelpCmd {
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
        await Discord.richQueue(
            Discord.embedBuilder({
                title: `SPRINT Racebot v${pjson.version}`,
                description: "A Discord bot for racing Star of Providence.",
                fields: [
                    {
                        name: "General Commands",
                        value: "`.help` - This help text.\n`.race` - Start a new race.",
                        inline: true
                    },
                    {
                        name: "Race Room Commands - Before the Race",
                        value: "`.enter`/`.e` - Enter the race.\n`.ready`/`.r` - Indicate that you are ready to start the race.\n`.unready`/`.u` - Indicate you are not ready and need more time before the race starts.\n`.withdraw`/`.w` - Withdraw from the race."
                    },
                    {
                        name: "Race Room Commands - During the Race",
                        value: "`.done`/`.d` - Indicate that you have finished the race.\n`.forfeit`/`.f` - Forfeit the race.\n`.notdone`/`.n` - If you did `.done` or `.forfeit`, this undoes that, re-entering you into the race.\n`.time` - Get the current elapsed time of the race."
                    },
                    {
                        name: "Race Room Commands - After the Race",
                        value: "`.notdone`/`.n` - If you did `.done` or `.forfeit`, this undoes that, continuing the race and re-entering you into it.\n`.rematch` - Starts a new race in the same race channel."
                    },
                    {
                        name: "Staff Commands",
                        value: "`.close` - Immediately close the race room you are in.\n`.kick <@user>` - Kick a player out of the race in the room you are in.  You must mention the player.  They can rejoin, if the race is still accepting entries.",
                        inline: true
                    },
                    {
                        name: "Bugs?",
                        value: "Please report bugs on GitHub, https://github.com/roncli/sprint-racebot"
                    }
                ]
            }),
            channel
        );
    }
}

module.exports = HelpCmd;
