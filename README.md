# sprint-racebot

A race bot for the SPRINT racing league.

# Commands

## General Commands
- `.help`/`.h` - This help text.
- `.race <settings>` - Start a new race.  The settings for the race must be entered here.  For instance, `.race F5 Null Hard Mild`.

## Race Room Commands

### Before the Race
- `.enter`/`.e` - Enter the race.
- `.ready`/`.r` - Indicate that you are ready to start the race.
- `.unready`/`.u` - Indicate you are not ready and need more time before the race starts.
- `.withdraw`/`.w` - Withdraw from the race.

### During the Race
- `.done`/`.d` - Indicate that you have finished the race.
- `.forfeit`/`.f` - Forfeit the race.
- `.notdone`/`.n` - If you did `.done` or `.forfeit`, this undoes that, re-entering you into the race.
- `.time`/`.t` - Get the current elapsed time of the race.

### After the Race
- `.notdone`/`.n` - If you did `.done` or `.forfeit`, this undoes that, continuing the race and re-entering you into it.
- `.rematch` - Start a new race in this channel with the same settings but on a different seed.

## Staff Commands
- `.close` - Immediately close the race room you are in.
- `.kick <@user>` - Kick a player out of the race in the room you are in.  You must mention the player.  They can rejoin, if the race is still accepting entries.

# Version History

## v1.0.0
* Initial version.
