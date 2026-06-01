import { db } from './mongoauth'

function addCPR(patient: any, res: any) {
    const collection = db.collection('cpr');
    collection.insertOne(patient);
    res.render('firstaid-response-added');
}

function addBurns(patient: any, res: any) {
    const collection = db.collection('burns');
    collection.insertOne(patient);
    res.render('firstaid-response-added');
}

function addCuts(patient: any, res: any) {
    const collection = db.collection('cuts');
    collection.insertOne(patient);
    res.render('firstaid-response-added');
}

function addFracture(patient: any, res: any) {
    const collection = db.collection('fracture');
    collection.insertOne(patient);
    res.render('firstaid-response-added');
}

function addAmbulance(patient: any, res: any) {
    const collection = db.collection('ambulance');
    collection.insertOne(patient);
    res.render('firstaid-response-added');
}

export class FirstAid {
    addCPR(patient: any, res: any) {
        return addCPR(patient, res)
    }

    addCuts(patient: any, res: any) {
        return addCuts(patient, res)
    }

    addFracture(patient: any, res: any) {
        return addFracture(patient, res)
    }

    addAmbulance(patient: any, res: any) {
        return addAmbulance(patient, res)
    }

    addBurns(patient: any, res: any) {
        return addBurns(patient, res)
    }
}