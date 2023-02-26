
import { Client } from "discord.js-selfbot-v13"
import Database from "easy-json-database"
import chalkAnimation from 'chalk-animation'
import { createSpinner } from "nanospinner"
import figlet from "figlet"
import fs from 'fs'
import fsExtra from 'fs-extra'
import gradient from "gradient-string"
import https from 'https'

import config from "../../config.json" assert { type: "json" }

const client = new Client({
        checkUpdate: false,
      })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


function download(url,hash,guild) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.pipe(fs.createWriteStream(`..\\..\\Servers\\${guild}\\photo\\Token-Hub-${hash}.${config.IMG_TYPE}`))
            .on('error', reject)
            .once('close', () => resolve(`..\\..\\Servers\\${guild}\\photo\\Token-Hub-${hash}.${config.IMG_TYPE}`))
        })
    })
}

async function shuffle(sourceArray) {
    for (let i = 0; i < sourceArray.length - 1; i++) {
        let j = i + Math.floor(Math.random() * (sourceArray.length - i))
        let temp = sourceArray[j]
        sourceArray[j] = sourceArray[i]
        sourceArray[i] = temp
    }
    return sourceArray
}

async function files(guild) {
    if (!fs.existsSync(`..\\..\\Servers\\${guild}`)) {
        await fs.mkdirSync(`..\\..\\Servers\\${guild}`)
    }

    if (!fs.existsSync(`..\\..\\Servers\\${guild}\\photo`)) {
        fs.mkdirSync(`..\\..\\Servers\\${guild}\\photo`)
    }

    if (fs.existsSync(`..\\..\\Servers\\${guild}\\photo`)) {
        fsExtra.emptyDirSync(`..\\..\\Servers\\${guild}\\photo`)
    }
    await fs.createWriteStream(`..\\..\\Servers\\${guild}\\Token-Hub-usernames.txt`, { overwrite: false })
    await sleep(500)
    fs.truncateSync(`..\\..\\Servers\\${guild}\\Token-Hub-usernames.txt`, 0)
}


async function welcome(guild) {
  console.clear()
    let author = chalkAnimation.glitch(`[Successful login] Scraper user : ${client.user.tag} To scrap ${guild}`)
    figlet(`Token Hub`, async(_err, data) => {
        console.log(gradient.pastel.multiline(data))
        await author.start()
    })
    author.stop()
}

async function scrape(guild) {
    const db = new Database(`../../Servers/${guild}/Token-Hub-database.json`);
    let memberid =  await shuffle((await (await client.guilds.fetch(guild)).members.fetch({limit: 0})).filter(x => x.user.id !== null && !x.user.bot).map(r => r.user.id))
   // db.set('id', memberid )
    //db.set('pfp_url', [])
    let l = memberid.length
    for (var i = 0; i < l; i++) {
        let member = await client.users.fetch(memberid[i])
        fs.appendFileSync(`..\\..\\Servers\\${guild}\\Token-Hub-usernames.txt`, member.username + '\r\n')
        if (member.avatar) {
            let spinner = createSpinner().start()
                let pfp_url = await member.displayAvatarURL({ forceStatic: true }).replace(".webp", `.${config.IMG_TYPE}`)
                db.push(`pfp_url`, pfp_url)         
                try {
                    await download(pfp_url + '?size=4096', member.avatar,guild)
                }
                catch(err) {
                    console.log(err)
                }
            spinner.success({ text: `[${((100* i) / memberid.length).toFixed(3)}%] Successful scrap : ${(member.username).replace(/[\u0250-\ue007]/g, '')}#${member.discriminator}`})
    }
}
console.log(`${i} user scraped in ${guild}`)
}

client.on('ready', async() => {
    let guild = await client.guilds.fetch(config.SERVER_ID)
    await files(guild)
    await welcome(guild)
    scrape(guild)
})


client.login(config.TOKEN)