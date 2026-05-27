import { MongoClient, Db } from 'mongodb'
import dotenv from 'dotenv'
import { userServices } from './user-services'
import { resolve } from 'node:path'

dotenv.config()

const connection = new MongoClient(process.env['MONGO_URI'] ?? '')
await connection.connect()

const database = await connection.db("assistiq")
const collection = await database.collection('users')

async function registerUser(userObj: any, res: any) {
    let doc = collection.find({email: userObj.email}).limit(1) as any;
    doc = doc.toArray();
    doc.then(async (response: any) => {
        if(response.length == 0) {
            await collection.insertOne({
                initials: userObj.initials,
                name: userObj.name,
                phone: userObj.phone,
                email: userObj.email,
                password: userObj.password,
                location: userObj.location,
                memberSince: userObj.memberSince
            });
            res.render("user.pug", { profile: userObj, services: userServices })
        } else {
            res.send("Already Existed User !!");
        }
    })
}

async function loginUser(userObj: any, res: any) {
    let doc = collection.find({email: userObj.email}).limit(1) as any;
    doc = doc.toArray();
    doc.then((response: any) => {
        if(response.length == 0) {
            alert("Please Register to continue !!")
        } else {
            if(userObj.password == response[0].password) {
                res.render("user.pug", { profile: response[0], services: userServices })
            }
            else {
                res.send("Incorrect Password")
            }
        }
    })
}

export class MongoAuth {
    registerUser(user: any, res: any) {
        registerUser(user, res);
    }
    loginUser(user: any, res: any) {
        loginUser(user, res);
    }
}