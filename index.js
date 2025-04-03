import dotenv from 'dotenv';
import { getunibetMeetingByDate } from './unibet.api.js';
import { getpointsbetMeetingByDate } from './pointsbet.api.js';
import { getboombetMeetingByDate } from './boombet.api.js';
import { getbookiepriceMeetingByDate } from './bookieprice.api.js';
import { getcolossalbetMeetingByDate } from './colossalbet.api.js';
import { getbetrightMeetingByDate } from './betright.api.js';
import { getbetrMeetingByDate } from './betr.api.js';
import { getbestbookiesMeetingByDate } from './bookie.api.js';

dotenv.config();

async function recursiveBoomBetFetch() {
    const startTime = Date.now();
     try {
         await getboombetMeetingByDate();
     } catch (err) {
         console.error('Error in BoomBet fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`✅ Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("Calling again")
         await delay(1000);
         await recursiveBoomBetFetch();
     }
 }

async function recursivePointsBetFetch() {
    const startTime = Date.now();
     try {
         await getpointsbetMeetingByDate();
     } catch (err) {
         console.error('Error in Pointsbet fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`✅ Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("Calling again")
         await delay(1000);
         await recursivePointsBetFetch();
     }
 }

async function recursiveFetch() {
   const startTime = Date.now();
    try {
        await getunibetMeetingByDate();
    } catch (err) {
        console.error('Error in Unibet fetch cycle:', err);
    } finally {
      const endTime = Date.now(); // End timer
        const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Completed one full fetch cycle in ${timeTaken} seconds.`);
        // Always wait a bit before the next recursive call
        console.log("Calling again")
        await delay(1000);
        await recursiveFetch();
    }
}

async function recursivebookiePriceFetch() {
    const startTime = Date.now();
     try {
         await getbookiepriceMeetingByDate();
     } catch (err) {
         console.error('Error in bookieprice fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`✅bookieprice Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("bookieprice  Calling again")
         await delay(500);
         await recursivebookiePriceFetch();
     }
 }

 async function recursivecolossalbetFetch() {
    const startTime = Date.now();
     try {
         await getcolossalbetMeetingByDate();
     } catch (err) {
         console.error('Error in colossalbet fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`colossalbet Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("colossalbet  Calling again")
         await delay(1000);
         await recursivecolossalbetFetch();
     }
 }
 async function recursivebetRightFetch() {
    const startTime = Date.now();
     try {
         await getbetrightMeetingByDate();
     } catch (err) {
         console.error('Error in betright fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`betright Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("betright  Calling again")
         await delay(1000);
         await recursivebetRightFetch();
     }
 }

 async function recursivebetRFetch() {
    const startTime = Date.now();
     try {
         await getbetrMeetingByDate();
     } catch (err) {
         console.error('Error in betr fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`bet Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("betr  Calling again")
         await delay(1000);
         await recursivebetRFetch();
     }
 }

 async function recursivebestbookiesFetch() {
    const startTime = Date.now();
     try {
         await getbestbookiesMeetingByDate();
     } catch (err) {
         console.error('Error in bestbookies fetch cycle:', err);
     } finally {
       const endTime = Date.now(); // End timer
         const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
 
         console.log(`bestbookies Completed one full fetch cycle in ${timeTaken} seconds.`);
         // Always wait a bit before the next recursive call
         console.log("bestbookies  Calling again")
         await delay(1000);
         await recursivebestbookiesFetch();
     }
 }
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
recursiveBoomBetFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});
recursivePointsBetFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});
// Start recursive process
recursiveFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});

recursivebookiePriceFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});

recursivecolossalbetFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});
recursivebetRightFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});

recursivebetRFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});

recursivebestbookiesFetch().catch(err => {
    console.error('Unrecoverable error in recursive fetch:', err);
    process.exit(1); // Fail hard if the recursion breaks completely
});