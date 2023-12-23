#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import startServer from "../server.js";

console.log(chalk.green("Welcome to the load balancer CLI"));

let serverCount = 0;
global.servers = new Map();
global.healthCheckPeriod = 10;
global.healthCheckEndopint = "/";

const getNumberOfServers = async()=>{
    const server = await inquirer.prompt({
        name: "serverCount",
        type: "input",
        message: "Enter number of servers:",
        validate: (input)=> /^\d+$/.test(input) || 'Please enter a valid numeric value.'
    });
    serverCount = server.serverCount;
}

const validateUrl = (url)=>{
    const urlPattern =
    /^(https?:\/\/)?([a-zA-Z0-9.-]+(:[0-9]+)?)(\/[^\s?#]*)?(\?[^#\s]*)?(#.*)?$/;

    return urlPattern.test(url);
}

const getServersDetails = async()=>{

    for(let i=1;i<=serverCount;i++){
        const server = await inquirer.prompt({
            name: "serverUrl",
            type: "input",
            message: `Enter server url ${i}`,
    
        });

        servers.set(i, server.serverUrl)
    }
}

const getHealthCheckEndpoint = async()=>{
    const server = await inquirer.prompt({
        name: "endpoint",
        type: "input",
        message: "Enter the health check endpoint (e.g., /health). By default, it is set to '/'.",
    });

    healthCheckEndopint = server.endpoint;
}

const getHealthCheckPeriod = async()=>{
    const server = await inquirer.prompt({
        name: "seconds",
        type: "number",
        message: `Enter the time period (in seconds) for checking the server health.`,
        validate: (input)=> /^\d+$/.test(input) || 'Please enter a valid numeric value.'
    });

    healthCheckPeriod = server.seconds;
}

const confirmStartServer = async()=>{
    const server = await inquirer.prompt({
        name: "startLB",
        type: "confirm",
        message: `Start LoadBalancer server ?`,
    });
    if(server.startLB){
        startServer();
    }
    else{
        console.log("Closing");
    }
}

const startIt = async()=>{
    await getNumberOfServers();
    await getServersDetails();
    await getHealthCheckEndpoint();
    await getHealthCheckPeriod();
    await confirmStartServer();
}

startIt();
