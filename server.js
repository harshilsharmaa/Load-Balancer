import express from "express";
const app = express();
import axios from "axios";
import logger from "./logServer.js";
import cron from "node-cron";
import chalk from "chalk";
import Table from 'cli-table3'
var table = new Table({ head: [ chalk.white("Time"), chalk.blue("Total Servers"), chalk.green("Healthy Servers"), "Dead Servers"] });

let healthyServers = [];

let current = -1;

const changeServer = () => {
  if (healthyServers.length <= 0) {
    return null; // Means all servers are dead
  }
  current = (current + 1) % healthyServers.length;
  return current;
};


const makeRequestToServer = async (req, res) => {
  try {
    const { data } = await axios({
      method: req.method,
      url: `${healthyServers[current]}${req.originalUrl}`,
    });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const handleRequest = async (req, res) => {
  try {
    logger.info("Handling request");
    logger.info(
      `Received request from ${req.ip}\nHost: ${
        req.hostname
      }\nUser-Agent: ${req.get("User-Agent")}`
    );

    const currentServer = changeServer();

    if (currentServer===null) {
      return res.status(500).json({
        success: false,
        error: "All Servers are dead !!!",
        message:
          "If you are a developer, ensure that you have provided the correct URLs in the load balancer configuration.",
      });
    }
    return makeRequestToServer(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const healthCheck = async () => {
  try {
    console.log(chalk.blue(`----- Health check run at every ${healthCheckPeriod} seconds -----`));
    for (let i = 1; i <= servers.size; i++) {
      const curr = servers.get(i);
      try {
        const res = await axios.get(`${curr}${healthCheckEndopint}`);

        const index = healthyServers.indexOf(curr);
        if (index < 0) healthyServers.push(curr);
      } catch (error) {
        // console.log(error);
        const index = healthyServers.indexOf(curr)
        index > -1 && healthyServers.splice(index, 1);
        logger.error(
          `healthCheckError - > serverNumber -> ${current} , errorMessage: ${error.message}`
        );
      }
    }

    const healthyServersCount = healthyServers.length ;
    const deadServersCount = servers.size - healthyServers.length;

    table.splice(0, table.length);
    table.push(
       [new Date().toTimeString(), servers.size, healthyServersCount, deadServersCount]  
    );
  
  console.log(table.toString());
  } catch (error) {
    console.log(error);
  }
};


app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.all("*", (req, res) => {
  handleRequest(req, res);
});



const startServer = () => {
  const PORT = 4000;
  app.listen(PORT, () => {
    for (const [key, value] of servers) {
      healthyServers.push(value);
    }

    console.log(`Load Balancer is running on port: ${PORT}`);
    const helthCheckCronJob = cron.schedule(`*/${healthCheckPeriod} * * * * *`, () => {
      healthCheck();
    });
  });
};

export default startServer;
