const appInsights = require("applicationinsights"),
    Docker = require("./src/docker"),
    gelfserver = require("graygelf/server"),

    port = process.env.PORT || 12201;

const docker = new Docker();

//   ###              #
//    #               #
//    #    # ##    ## #   ###   #   #
//    #    ##  #  #  ##  #   #   # #
//    #    #   #  #   #  #####    #
//    #    #   #  #  ##  #       # #
//   ###   #   #   ## #   ###   #   #
/**
 * The primary class for the application.
 */
class Index {
    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Starts up the application.
     * @returns {void}
     */
    static startup() {
        // Setup application insights.
        appInsights.setup();
        appInsights.start();

        const server = gelfserver();

        server.on("message", (gelf) => {
            const tagOverrides = {};
            if (gelf._container_name) {
                tagOverrides.Container = gelf._container_name;
            }

            // Default log.
            appInsights.defaultClient.trackTrace({message: gelf.short_message, properties: {application: process.env.APPLICATION, container: gelf._container_name || "sprint-racebot-logging"}});
        });

        server.listen(port);
        console.log(`Server PID ${process.pid} listening on port ${port}.`);

        if (+process.env.APPINSIGHTS_PERFORMANCE_METRICS) {
            docker.start();
        }
    }
}

Index.startup();
