require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDoc } = require("firebase/firestore");
const axios = require("axios");
const { performance } = require("perf_hooks");
const fs = require("fs");

// Firebase config from .env file
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PROJECT_COUNT = 1000; // Easily configurable project count
const ERROR_LOG_FILE = "errors.log";

// Generate a unique Run ID based on timestamp
const runId = new Date().toISOString().replace(/[-T:.Z]/g, "");
fs.writeFileSync(ERROR_LOG_FILE, ""); // Clear previous error log

async function createProject(index) {
    const projectId = `test-project-${runId}-${String(index).padStart(3, "0")}`;
    const projectRef = doc(db, "projects", projectId);
    
    try {
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) return { projectId, created: false };
        
        const payload = {
            name: `Test Project ${index}`,
            subdomain: `test-${index}`,
            createdAt: new Date().toISOString(),
            userId: `CUSdO7nNOsZ2Z0vslTFh5doEfvR2`,
            category: "de-fi",
            variant: "shortcuts-widget"
        };
        
        const startTime = performance.now();
        await setDoc(projectRef, payload);
        const endTime = performance.now();
        return { projectId, created: true, responseTime: (endTime - startTime) / 1000 };
    } catch (error) {
        fs.appendFileSync(ERROR_LOG_FILE, `Error creating project ${projectId}: ${error.message}\n`);
        console.error(`Error creating project ${projectId}:`, error);
        return { projectId, created: false, error: error.message };
    }
}

async function runLoadTest() {
    console.log("Starting project creation...");
    const scriptStartTime = performance.now();
    
    const createResults = await Promise.all(
        Array.from({ length: PROJECT_COUNT }, (_, i) => createProject(i + 1))
    );
    
    const scriptEndTime = performance.now();
    const elapsedTotalTime = (scriptEndTime - scriptStartTime) / 1000;
    
    const successfulProjects = createResults.filter(res => res.created);
    const totalCreationTime = successfulProjects.reduce((sum, res) => sum + res.responseTime, 0);
    const errorCount = createResults.length - successfulProjects.length;
    const avgCreationTime = successfulProjects.length ? (totalCreationTime / successfulProjects.length) : 0;
    
    console.log(`\nFinal Report:`);
    console.log(`Total projects created: ${successfulProjects.length}`);
    console.log(`Total execution time: ${elapsedTotalTime.toFixed(2)}s`);
    console.log(`Total creation time (sum of individual responses): ${totalCreationTime.toFixed(2)}s`);
    console.log(`Average creation time: ${avgCreationTime.toFixed(2)}s`);
    console.log(`Errors count: ${errorCount}`);
    
    if (errorCount > 0) {
        console.log(`Errors logged in ${ERROR_LOG_FILE}`);
    }

    process.exit(0);
}

runLoadTest();
