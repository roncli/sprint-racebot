const DiscordJs = require("discord.js"),
    Exception = require("../errors/exception"),
    fs = require("fs/promises"),
    Log = require("@roncli/node-application-insights-logger"),
    path = require("path"),
    util = require("util"),
    Warning = require("../errors/warning"),

    discord = new DiscordJs.Client({
        intents: [
            DiscordJs.IntentsBitField.Flags.Guilds,
            DiscordJs.IntentsBitField.Flags.GuildMessages,
            DiscordJs.IntentsBitField.Flags.MessageContent
        ],
        partials: [DiscordJs.Partials.Channel]
    }),
    messageParse = /^\.(?<command>[a-z]+)\s*(?<parameters>.*)/i;

let readied = false;

/** @type {DiscordJs.CategoryChannel} */
let raceCategory;

/** @type {DiscordJs.TextChannel} */
let resultsChannel;

/** @type {DiscordJs.Guild} */
let sprintGuild;

/** @type {DiscordJs.Role} */
let staffRole;

//  ####     #                                    #
//   #  #                                         #
//   #  #   ##     ###    ###    ###   # ##    ## #
//   #  #    #    #      #   #  #   #  ##  #  #  ##
//   #  #    #     ###   #      #   #  #      #   #
//   #  #    #        #  #   #  #   #  #      #  ##
//  ####    ###   ####    ###    ###   #       ## #
/**
 * A static class that handles all Discord.js interactions.
 */
class Discord {
    //  #
    //
    // ##     ##    ##   ###
    //  #    #     #  #  #  #
    //  #    #     #  #  #  #
    // ###    ##    ##   #  #
    /**
     * Returns the guild's icon.
     * @returns {string} The URL of the icon.
     */
    static get icon() {
        if (discord && discord.ws && discord.ws.status === 0) {
            return discord.user.avatarURL();
        }

        return void 0;
    }

    //                          ##          #
    //                         #  #         #
    // ###    ###   ##    ##   #      ###  ###    ##    ###   ##   ###   #  #
    // #  #  #  #  #     # ##  #     #  #   #    # ##  #  #  #  #  #  #  #  #
    // #     # ##  #     ##    #  #  # ##   #    ##     ##   #  #  #      # #
    // #      # #   ##    ##    ##    # #    ##   ##   #      ##   #       #
    //                                                  ###               #
    /**
     * Returns the race category.
     * @returns {DiscordJs.CategoryChannel} The race category.
     */
    static get raceCategory() {
        return raceCategory;
    }

    //                          ##     #            ##   #                             ##
    //                           #     #           #  #  #                              #
    // ###    ##    ###   #  #   #    ###    ###   #     ###    ###  ###   ###    ##    #
    // #  #  # ##  ##     #  #   #     #    ##     #     #  #  #  #  #  #  #  #  # ##   #
    // #     ##      ##   #  #   #     #      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##   ###     ###  ###     ##  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the results channel.
     * @returns {DiscordJs.TextChannel} The results channel.
     */
    static get resultsChannel() {
        return resultsChannel;
    }

    //         #            #     #   ###         ##
    //         #           # #   # #  #  #         #
    //  ###   ###    ###   #     #    #  #   ##    #     ##
    // ##      #    #  #  ###   ###   ###   #  #   #    # ##
    //   ##    #    # ##   #     #    # #   #  #   #    ##
    // ###      ##   # #   #     #    #  #   ##   ###    ##
    /**
     * Returns the staff role.
     * @returns {DiscordJs.Role} The staff role.
     */
    static get staffRole() {
        return staffRole;
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Sets up Discord events.  Should only ever be called once.
     * @returns {void}
     */
    static startup() {
        discord.on("ready", () => {
            Log.info("Connected to Discord.");

            sprintGuild = discord.guilds.cache.find((g) => g.id === process.env.DISCORD_GUILD_ID);

            if (!readied) {
                readied = true;
            }

            raceCategory = /** @type {DiscordJs.CategoryChannel} */ (sprintGuild.channels.cache.find((c) => c.name === "Race Rooms")); // eslint-disable-line @stylistic/no-extra-parens
            resultsChannel = /** @type {DiscordJs.TextChannel} */ (sprintGuild.channels.cache.find((c) => c.name === "racebot-results")); // eslint-disable-line @stylistic/no-extra-parens
            staffRole = sprintGuild.roles.cache.find((r) => r.name === "SPRINT Staff");
        });

        discord.on("disconnect", (ev) => {
            Log.error("Disconnected from Discord.", {err: ev instanceof Error ? ev : new Error(util.inspect(ev))});
        });

        discord.on("messageCreate", async (message) => {
            // Must only respond on a guild channel.
            if (message.channel.type !== DiscordJs.ChannelType.GuildText) {
                return;
            }

            // Must be a command.
            if (!messageParse.test(message.content)) {
                return;
            }

            // Parse out command and parameters.
            const {groups: {command, parameters}} = messageParse.exec(message.content);

            // Ensure the handler file exists.
            const commandFilePath = path.join(__dirname, "commands", `${command}.js`);

            try {
                await fs.access(commandFilePath);
            } catch (error) {
                return;
            }

            // Ensure the handler function exists.
            const CommandHandler = require(commandFilePath);

            if (typeof CommandHandler.handle !== "function") {
                return;
            }

            // Run the command.
            try {
                await CommandHandler.handle(message.member, message.channel, parameters);
            } catch (err) {
                if (err instanceof Warning) {
                    Log.warn(`${message.channel} ${message.member}: ${message.content} - ${err.message || err}`);
                } else if (err instanceof Exception) {
                    Log.error(`${message.channel} ${message.member}: ${message.content} - ${err.message}`, {err: err.innerError});
                } else {
                    Log.error(`${message.channel} ${message.member}: ${message.content}`, {err});
                }
            }
        });
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   ###    ##    ##   ###
    // #     #  #  #  #  #  #  # ##  #      #
    // #     #  #  #  #  #  #  ##    #      #
    //  ##    ##   #  #  #  #   ##    ##     ##
    /**
     * Connects to Discord.
     * @returns {Promise} A promise that resolves once Discord is connected.
     */
    static async connect() {
        Log.verbose("Connecting to Discord...");

        try {
            await discord.login(process.env.DISCORD_TOKEN);
        } catch (err) {
            Log.error("Error connecting to Discord, will automatically retry.", {err});
        }
    }

    //                          #          #  #              #                          #   ##   #                             ##
    //                          #          ## #              #                          #  #  #  #                              #
    //  ##   ###    ##    ###  ###    ##   ## #  #  #  # #   ###    ##   ###    ##    ###  #     ###    ###  ###   ###    ##    #
    // #     #  #  # ##  #  #   #    # ##  # ##  #  #  ####  #  #  # ##  #  #  # ##  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // #     #     ##    # ##   #    ##    # ##  #  #  #  #  #  #  ##    #     ##    #  #  #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##   #      ##    # #    ##   ##   #  #   ###  #  #  ###    ##   #      ##    ###   ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Creates a new numbered channel.
     * @param {string} name The name of the channel.
     * @returns {Promise<DiscordJs.TextChannel>} A promise that returns the new channel.
     */
    static async createNumberedChannel(name) {
        const channelSuffixes = sprintGuild.channels.cache.filter((c) => c.parentId && c.parentId === raceCategory.id && c.name.startsWith(name)).map((c) => parseInt(c.name.split("-")[1], 10)).sort((a, b) => a - b);

        let suffix = 1;
        for (let i = 0; i < channelSuffixes.length; i++) {
            if (channelSuffixes[i] !== suffix) {
                break;
            }
            suffix++;
        }

        const channel = await sprintGuild.channels.create({
            name: `${name}-${suffix}`,
            parent: raceCategory,
            type: DiscordJs.ChannelType.GuildText
        });

        return channel;
    }

    //             #              #  ###          #    ##       #
    //             #              #  #  #               #       #
    //  ##   # #   ###    ##    ###  ###   #  #  ##     #     ###
    // # ##  ####  #  #  # ##  #  #  #  #  #  #   #     #    #  #
    // ##    #  #  #  #  ##    #  #  #  #  #  #   #     #    #  #
    //  ##   #  #  ###    ##    ###  ###    ###  ###   ###    ###
    /**
     * Gets a new DiscordJs EmbedBuilder object.
     * @param {DiscordJs.EmbedData} [options] The options to pass.
     * @returns {DiscordJs.EmbedBuilder} The EmbedBuilder object.
     */
    static embedBuilder(options) {
        const embed = new DiscordJs.EmbedBuilder(options);

        embed.setFooter({text: embed.data && embed.data.footer ? embed.data.footer.text : "SPRINT Racebot", iconURL: Discord.icon});

        if (!embed.data || !embed.data.color) {
            embed.setColor(0xE22922);
        }

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        return embed;
    }

    //   #    #             #   ##          #    ##       #  #  #              #                 ###         ###      #
    //  # #                 #  #  #               #       #  ####              #                 #  #         #       #
    //  #    ##    ###    ###  #     #  #  ##     #     ###  ####   ##   # #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  # ##  #  #   #     #    #  #  #  #  # ##  ####  #  #  # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #  #  #   #     #    #  #  #  #  ##    #  #  #  #  ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ###   ###  ###   ###    ###  #  #   ##   #  #  ###    ##   #     ###     #   ###    ###
    //                                                                                                  #
    /**
     * Returns the Discord user in the guild by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {DiscordJs.GuildMember} The guild member.
     */
    static findGuildMemberById(id) {
        if (!sprintGuild) {
            return void 0;
        }
        return sprintGuild.members.cache.find((m) => m.id === id);
    }

    //  ###  #  #   ##   #  #   ##
    // #  #  #  #  # ##  #  #  # ##
    // #  #  #  #  ##    #  #  ##
    //  ###   ###   ##    ###   ##
    //    #
    /**
     * Queues a message to be sent.
     * @param {string} message The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.User|DiscordJs.GuildTextBasedChannel} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that returns the sent message.
     */
    static async queue(message, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        let msg;
        try {
            msg = await channel.send(message);
        } catch {}
        return msg;
    }

    //        #          #     ####     #   #     #
    //                   #     #        #         #
    // ###   ##     ##   ###   ###    ###  ##    ###
    // #  #   #    #     #  #  #     #  #   #     #
    // #      #    #     #  #  #     #  #   #     #
    // #     ###    ##   #  #  ####   ###  ###     ##
    /**
     * Edits a rich embed message.
     * @param {DiscordJs.Message} message The posted message to edit.
     * @param {DiscordJs.EmbedBuilder} embed The message to change the posted message to.
     * @returns {Promise} A promise that resolves when the message is edited.
     */
    static async richEdit(message, embed) {
        embed.setFooter({
            text: embed.data && embed.data.footer ? embed.data.footer.text : "SPRINT Racebot",
            iconURL: Discord.icon
        });

        if (embed && embed.data && embed.data.fields) {
            embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        embed.setColor(message.embeds[0].color);

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        await message.edit({embeds: [embed]});
    }

    //        #          #      ##
    //                   #     #  #
    // ###   ##     ##   ###   #  #  #  #   ##   #  #   ##
    // #  #   #    #     #  #  #  #  #  #  # ##  #  #  # ##
    // #      #    #     #  #  ## #  #  #  ##    #  #  ##
    // #     ###    ##   #  #   ##    ###   ##    ###   ##
    //                            #
    /**
     * Queues a rich embed message to be sent.
     * @param {DiscordJs.EmbedBuilder} embed The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.User|DiscordJs.GuildTextBasedChannel} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that returns the sent message.
     */
    static async richQueue(embed, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        if (embed && embed.data && embed.data.fields) {
            embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        let msg;
        try {
            const msgSend = await channel.send({embeds: [embed]});

            if (msgSend instanceof Array) {
                msg = msgSend[0];
            } else {
                msg = msgSend;
            }
        } catch {}
        return msg;
    }

}

module.exports = Discord;
