import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { userServices } from './user-services';

dotenv.config()

const connection = new MongoClient(process.env['MONGO_URI'] ?? '')
await connection.connect()

const database = await connection.db("assistiq")
const collection = await database.collection('users')

async function registerUser(userObj: any, res: any,  burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
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
            res.render("user.pug", { profile: userObj, services: userServices, burns, ambulance, cpr, cuts, fracture })
        } else {
            res.send("Already Existed User !!");
        }
    })
}

async function loginUser(userObj: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
    let doc = collection.find({email: userObj.email}).limit(1) as any;
    doc = doc.toArray();
    doc.then((response: any) => {
        if(response.length == 0) {
            res.send("Please Register to continue !!")
        } else {
            if(userObj.password == response[0].password) {
                res.render("user.pug", { profile: response[0], services: userServices, burns, ambulance, cpr, cuts, fracture })
            }
            else {
                res.send("Incorrect Password")
            }
        }
    })
}

function updateUser(user: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
    collection.updateOne({ email: user.email }, { $set: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        memberSince: user.memberSince,
        initials: user.initials
    } })
    let doc = collection.find({email: user.email}).limit(1) as any;
    doc = doc.toArray();
    doc.then((response: any) => {
        res.render("user.pug", { profile: response[0], services: userServices, burns, ambulance, cpr, cuts, fracture })
    })
}

function BackToUserFromMechanic(email: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
    let doc = collection.find({email: email}).limit(1) as any;
    doc = doc.toArray();
    doc.then((response: any) => {
        res.render("user.pug", { profile: response[0], services: userServices, burns, ambulance, cpr, cuts, fracture })
    })
}

export class MongoAuth {
    registerUser(user: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
        registerUser(user, res, burns, ambulance, cpr, cuts, fracture);
    }
    loginUser(user: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
        loginUser(user, res, burns, ambulance, cpr, cuts, fracture);
    }
    updateUser(user: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
        updateUser(user, res, burns, ambulance, cpr, cuts, fracture);
    }
    BackToUserFromMechanic(email: any, res: any, burns: any, ambulance: any, cpr: any, cuts: any, fracture: any) {
        BackToUserFromMechanic(email, res, burns, ambulance, cpr, cuts, fracture);
    }
}

export const db = database