"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference lib="dom" /> - Necessary for firebase types.
const app_1 = __importDefault(require("firebase/app"));
require("firebase/auth");
require("firebase/firestore");
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAZoGB2p26UejODezZPmczgwehI6xlSKPs',
    authDomain: 'cli-telemetry.firebaseapp.com',
    databaseURL: 'https://cli-telemetry.firebaseio.com',
    projectId: 'cli-telemetry',
    storageBucket: '',
    messagingSenderId: '449985678611',
    appId: '1:449985678611:web:88b411adc68e6521e19ee6',
};
process.once('message', function ({ uuid, commandData, userEnvironment }) {
    return __awaiter(this, void 0, void 0, function* () {
        const unixWeek = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
        // Initialize Firebase and anonymously authenticate
        const app = app_1.default.initializeApp(FIREBASE_CONFIG);
        try {
            const db = app.firestore();
            const { FieldValue } = app_1.default.firestore;
            yield app.auth().signInAnonymously();
            // create a new command document for the current uuid
            yield db.runTransaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const dbSnapshot = yield tx.get(db.doc(`users/${uuid}`));
                let incrementalId;
                // if the current user document exists, retreive the latest command id and create a new command document.
                // otherwise, create a document for the user and set the id to 0.
                if (dbSnapshot.exists) {
                    incrementalId = dbSnapshot.get('latestId') + 1;
                    yield tx.update(db.doc(`users/${uuid}`), { latestId: FieldValue.increment(1) });
                }
                else {
                    incrementalId = 0;
                    yield tx.set(db.doc(`users/${uuid}`), { latestId: 0 });
                }
                yield tx.set(db.collection(`users/${uuid}/commands`).doc(), Object.assign(Object.assign({}, commandData), { userEnvironment,
                    unixWeek, id: incrementalId }));
            }));
        }
        finally {
            // close all connections
            yield app.delete();
        }
    });
});
//# sourceMappingURL=send-to-firebase.js.map