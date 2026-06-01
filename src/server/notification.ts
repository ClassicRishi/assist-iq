import { db } from "./mongoauth";

function getBurnsData(user: any) {
    const collection = db.collection('burns');
    const burnsData = collection.find({ email: user.email }).toArray()
    return burnsData;
}

function getAmbulanceData(user: any) {
    const collection = db.collection('ambulance');
    const ambulanceData = collection.find({ email: user.email }).toArray()
    return ambulanceData;
}

function getCutsData(user: any) {
    const collection = db.collection('cuts');
    const cutsData = collection.find({ email: user.email }).toArray()
    return cutsData;
}

function getFractureData(user: any) {
    const collection = db.collection('fracture');
    const fracturesData = collection.find({ email: user.email }).toArray()
    return fracturesData;
}

function getCPRData(user: any) {
    const collection = db.collection('cpr');
    const crpData = collection.find({ email: user.email }).toArray()
    return crpData;
}

export default {
    Burns: getBurnsData,
    Ambulance: getAmbulanceData,
    Cuts: getCutsData,
    Fracture: getFractureData,
    CPR: getCPRData
}