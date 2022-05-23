# Gamma Protocol Defender Bot CLI Sync Script 

Helps manage bots running on OZ's defender using auto task client (https://www.npmjs.com/package/defender-autotask-client) 

## Prequisites

Currently, there is not way to add new bots via autotask client defender hence new bots will have to be added through the GUI for defender and pasted in the **defender-config.js** file:

-  Add your infura key in `.infuraKey` file
-  Add your dotenv key in `.env` file
    -  You'll need the  `ETHERSCAN_API`,  `AUTOTASK_API_KEY`, `AUTOTASK_API_SECRET` added to the  `.env` file

## Managing Base Asset using Chainlink's Pricer Bot

As a pre-requisite, you need:

- Get Asset addreess
- Get bot key for chainlink's pricer bot

Add new base asset (run the **view-bots** commands to get botkeys):

```sh
$ npm run add-asset --asset=0x2xxxxxxxxxxxxxxxxx --bot=botkey
```

View assets for a bot:

```sh
$ npm run view-bot --bot=botkey
```

Remove base asset for a bot:

```sh
$ npm run remove-asset --asset=0xC0xxxxxxxxxxxxxxxxxxxx --bot=botkey    
```

## Managing Derived Asset Pricer Bot

Add new derived asset (run the **view-bots** commands to get botkeys):

```sh
$ npm run update-asset --asset=0xa276xxxxxxxxxxxxxxxxxxxxxxxxxxx --bot=2 
```

Override exist asset tied to this bot:

```sh
$ npm run update-asset --asset=0xa2xxxxxxxxxxxxxxxxxxxxxxxx --bot=2 --override=true
```


## General Commands

View all bots on defender:

```sh
$ npm run view-bots
```

Push the changes to defender:

```sh
$ npm run sync-bot --bot=botkey
```



,