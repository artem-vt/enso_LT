require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc } = require("firebase/firestore");
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

const ERROR_LOG_FILE = "delete_errors.log";
fs.writeFileSync(ERROR_LOG_FILE, ""); // Clear previous log

async function deleteTestProjects() {
    console.log("Fetching test projects for deletion...");
    const projectsRef = collection(db, "projects");
    
    try {
        const snapshot = await getDocs(projectsRef);
        const testProjects = snapshot.docs.filter(doc => doc.id.startsWith("test-project-"));

        if (testProjects.length === 0) {
            console.log("No test projects found.");
            return;
        }

        console.log(`Found ${testProjects.length} test projects. Starting deletion...`);
        const startTime = Date.now();

        await Promise.all(testProjects.map(async (project) => {
            try {
                await deleteDoc(doc(db, "projects", project.id));
                console.log(`Deleted: ${project.id}`);
            } catch (error) {
                fs.appendFileSync(ERROR_LOG_FILE, `Error deleting ${project.id}: ${error.message}\n`);
                console.error(`Error deleting ${project.id}:`, error);
            }
        }));

        const totalTime = (Date.now() - startTime) / 1000;
        console.log("\nDeletion Complete!");
        console.log(`Total projects deleted: ${testProjects.length}`);
        console.log(`Total time: ${totalTime.toFixed(2)}s`);

    } catch (error) {
        console.error("Error fetching projects:", error);
        fs.appendFileSync(ERROR_LOG_FILE, `Error fetching projects: ${error.message}\n`);
    }
}

deleteTestProjects();