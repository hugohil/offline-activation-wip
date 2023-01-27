import config from './config.mjs'

import { Key as key }  from 'cryptolens';

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hostname } from 'node:os';
import dns from 'node:dns';

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)
await db.read()
db.data ||= { posts: [] }

const { RSAPubKey, token, appKey, appID } = config;

function getActiveLicense (next) {
    // dns.resolve('www.google.com', async (err) => {
    dns.resolve('http://eeeeee.fr/', async (err) => {
        if (err) {
            console.log("No connection");
            const lastConnexion = db.data.posts[db.data.posts.length - 1];
            if (!lastConnexion.expired) {
                const dateUTC = new Date().toUTCString();
                const dateEpoch = Math.floor(Date.now() / 1000);
                const expired = isExpired(dateEpoch, lastConnexion.expiration);
                
                if (expired) {
                    console.warn("LICENSE EXPIRED");
                } else {
                    console.log("LICENSE ACTIVE");
                }
 
                db.data.posts.push({
                    index: db.data.posts.length,
                    offline: true,
                    dateUTC,
                    dateEpoch,
                    product: lastConnexion.product,
                    creation: lastConnexion.creation,
                    expiration: lastConnexion.expiration,
                    key: lastConnexion.key,
                    expired,
                })
                await db.write()


                next(!expired);
            } else {
                console.log("online activation needed.")
            }
        } else {
            console.log("Connected");
            remoteActivation(next);
        }
    });
}

function isExpired (now, expiration) {
    return (now > expiration);
}

function remoteActivation (next) {
    const result = key.Activate(token, RSAPubKey, appID, appKey, hostname());

    result.then(async function(license) {
        const dateUTC = new Date().toUTCString();
        const dateEpoch = Math.floor(Date.now() / 1000);

        const expired = isExpired(dateEpoch, license.Expires);

        db.data.posts.push({
            index: db.data.posts.length,
            offline: false,
            dateUTC,
            dateEpoch,
            product: license.ProductId,
            creation: license.Created,
            expiration: license.Expired,
            key: license.Key,
            expired,
        })
        await db.write()
    
        if (expired) {
            console.warn("LICENSE EXPIRED");
        } else {
            console.log("LICENSE ACTIVE");
        }
        next(!expired);
    }).catch(function(error) {
        console.log('error:');
        console.log(error.message);
        next(false);
    });
}

export default getActiveLicense;
