// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// FIX: Import the 'doc' function from Firestore to create document references.
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { mockAdminUser, mockCurrentUser, mockFeedItems, mockInventory, mockPlayers, mockQuestions, mockShopItems, mockTaskTemplates, mockUserTasks } from "./mockData";

// TODO: Add your own Firebase configuration from your Firebase console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- DATABASE SEEDING ---
// This function runs once to populate the database with initial mock data
// if it's detected to be empty.
export const seedDatabase = async () => {
    const playersRef = collection(db, 'players');
    const snapshot = await getDocs(playersRef);
    if (snapshot.empty) {
        console.log('Database is empty. Seeding with mock data...');
        const batch = writeBatch(db);

        // Add players
        [mockCurrentUser, ...mockPlayers, mockAdminUser].forEach(player => {
            const docRef = doc(playersRef, player.id);
            batch.set(docRef, player);
        });

        // Add shop items
        const shopItemsRef = collection(db, 'shopItems');
        mockShopItems.forEach(item => {
             const docRef = doc(shopItemsRef, item.id);
             batch.set(docRef, item);
        });

        // Add inventory
        const inventoryRef = collection(db, 'inventory');
        mockInventory.forEach(item => {
            const { itemDetails, ...itemData } = item;
            const docRef = doc(inventoryRef, item.id);
            batch.set(docRef, itemData);
        });
        
        // Add task templates
        const taskTemplatesRef = collection(db, 'taskTemplates');
        mockTaskTemplates.forEach(template => {
            const docRef = doc(taskTemplatesRef, template.id);
            batch.set(docRef, template);
        });

        // Add user tasks (without the nested template)
        const userTasksRef = collection(db, 'userTasks');
        mockUserTasks.forEach(task => {
            const docRef = doc(userTasksRef, task.id);
            const { template, ...taskData } = task; // Remove nested template
            batch.set(docRef, taskData);
        });

        // Add questions
        const questionsRef = collection(db, 'questions');
        mockQuestions.forEach(question => {
            const docRef = doc(questionsRef, question.id);
            const { correct_choice_index, ...rest } = question;
            const dataToSave = {
                ...rest,
                correct_answer: question.choices[correct_choice_index]
            };
            batch.set(docRef, dataToSave);
        });

        // Add feed items
        const feedItemsRef = collection(db, 'feedItems');
        mockFeedItems.forEach(item => {
             const docRef = doc(feedItemsRef, item.id);
             batch.set(docRef, item);
        });

        await batch.commit();
        console.log('Database seeded successfully!');
    } else {
        console.log('Database already contains data. Skipping seed.');
    }
};