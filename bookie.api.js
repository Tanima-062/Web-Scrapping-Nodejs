import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.bestbookies_CONCURRENCY_LIMIT || 2);
const MAX_RETRIES = 5; // Maximum retries before giving up
const INITIAL_DELAY = 1000; // Start with 1-second delay
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchWithRetry(url, headers, retries = MAX_RETRIES, delay = INITIAL_DELAY) {
    try {
        const response = await httpClient.get({ url, headers });
        
        if (response?.data?.err == "1") {
            console.log("Error-----------------",response?.data)
            if (retries > 0) {
                console.warn(`Rate limited. Retrying in ${delay}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
                return fetchWithRetry(url, headers, retries - 1, delay * 2); // Exponential backoff
            } else {
                console.error("Max retries reached. Skipping request.");
            }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Request failed: ${error.message}. Retrying in ${delay}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, headers, retries - 1, delay * 2);
        } else {
            console.error(`Failed after ${MAX_RETRIES} retries:`, error.message);
        }
    }
}

async function fetchRaceDetails(race) {
    const startTime = Date.now();
    
      
    try {
        const endpoint = `https://www.bookies.com.au/v4/php/v4RacePrices.php?meet=${race.id}&race=${race.raceNumber}`;
        console.log("Fetching race details:", endpoint);

       const response = await fetchWithRetry(endpoint, { host: "www.bookies.com.au" });
       //const response = await httpClient.get({ url:endpoint, headers:{ host: "www.bookies.com.au" } });
    //    if (response?.data?.err == "1") {
    //     console.log("Error----------------",response?.data)}
       if (response?.data?.runner) {
            const runners = response.data.runner;

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    const winOdd = runner?.winflucts?.[runner?.winflucts?.length - 1];
                    const winPlace = runner?.placeflucts?.[runner?.placeflucts?.length - 1];
                    return {
                        number: Number(runner.no),
                        bookmakerMarkets: [{
                            bookmaker: "bestbookies",
                            odds: {
                                Win: winOdd || undefined,
                                Place: winPlace || undefined
                            }
                        }]
                    };
                })
            };
            await new Promise(resolve => setTimeout(resolve, 500))
            const endTime = Date.now(); // End timer
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
            console.log("Sending to queue bestbookies:",timeTaken, JSON.stringify(mappedData));
            await sendToQueue("races_queue_smartb", mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getbestbookiesMeetingByDate() {
    try {
        const startDate = moment().format("YYYY-MM-DD");
        const endpoint = `https://www.bookies.com.au/v4/php/v4EventsList.php?dts=${startDate}`;

        const response = await fetchWithRetry(endpoint, { host: "www.bookies.com.au" });

        let meetings = [];
        if (response?.data) {
            const data = response.data;
            if (data.racing && data.racing.length > 0) {
                meetings = [...meetings, ...data.racing.map(e => ({ ...e, sport: "Horse Racing" }))];
            }
            if (data.greyhounds && data.greyhounds.length > 0) {
                meetings = [...meetings, ...data.greyhounds.map(e => ({ ...e, sport: "Greyhound Racing" }))];
            }
            if (data.trots && data.trots.length > 0) {
                meetings = [...meetings, ...data.trots.map(e => ({ ...e, sport: "Harness Racing" }))];
            }
        }

        console.log("Meeting bestbookies", meetings.length);

        const races = [];
        for (const meeting of meetings) {
            for (const race of meeting.race) {
                if (race.status !== "Final") {
                    races.push({
                        track: {
                            trackName: meeting.name,
                            country: meeting.country,
                            raceType: meeting.sport
                        },
                        raceNumber: Number(race.no),
                        raceStartTime: race.starttime,
                        id: meeting.mid
                    });
                }
            }
        }
        console.log("Total race--", races.length);
        const promises = races.map(race => limit(() => fetchRaceDetails(race)));
        await Promise.allSettled(promises);
    } catch (error) {
        console.log("Error", error);
        throw error;
    }
}
