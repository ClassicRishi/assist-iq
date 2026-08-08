import { db } from "./mongoauth";

function resolveUserEmail(user: any): string {
    if (!user) return '';
    if (Array.isArray(user)) return resolveUserEmail(user[0]);
    if (typeof user === 'string') return user.trim();
    return String(user.email ?? '').trim();
}

function getBurnsData(user: any) {
    const collection = db.collection('burns');
    const email = resolveUserEmail(user);
    return email ? collection.find({ email }).toArray() : Promise.resolve([]);
}

function getAmbulanceData(user: any) {
    const collection = db.collection('ambulance');
    const email = resolveUserEmail(user);
    return email ? collection.find({ email }).toArray() : Promise.resolve([]);
}

function getCutsData(user: any) {
    const collection = db.collection('cuts');
    const email = resolveUserEmail(user);
    return email ? collection.find({ email }).toArray() : Promise.resolve([]);
}

function getFractureData(user: any) {
    const collection = db.collection('fracture');
    const email = resolveUserEmail(user);
    return email ? collection.find({ email }).toArray() : Promise.resolve([]);
}

function getCPRData(user: any) {
    const collection = db.collection('cpr');
    const email = resolveUserEmail(user);
    return email ? collection.find({ email }).toArray() : Promise.resolve([]);
}

export default {
    Burns: getBurnsData,
    Ambulance: getAmbulanceData,
    Cuts: getCutsData,
    Fracture: getFractureData,
    CPR: getCPRData
}