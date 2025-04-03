import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.UNIBET_CONCURRENCY_LIMIT || 10);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://api.au.pointsbet.com/api/racing/v3/races/${race.eventId}`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint });

        if (response?.data?.results?.winners) {
            const runners = response.data.results.winners;

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    if (runner?.outcome?.fixedPrices) {
                        const winOdd = runner.outcome.fixedPrices.find(odd => odd.betType === "WIN");
                        const winPlace = runner.outcome.fixedPrices.find(odd => odd.betType === "PLC");
                        return {
                            number: runner.sequence,
                            bookmakerMarkets: [{
                                bookmaker: "PointsBet",
                                odds: {
                                    Win: winOdd?.price || null,
                                    Place: winPlace?.price || null
                                }
                            }]
                        };
                    }
                }).filter(Boolean)  // Remove any undefined if no prices exist
            };

            console.log("Sending to queue:", JSON.stringify(mappedData));
            await sendToQueue(process.env.RACE_QUEUE, mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getpointsbetMeetingByDate() {
    try {
        
    
    const startDate = moment().startOf('day').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');
    const endDate = moment().startOf('day').add(24, 'hours').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');

    console.log(`Fetching meetings for ${startDate} to ${endDate}`);

    const endpoint = `https://api.au.pointsbet.com/api/racing/v2/races/nextup?racingType=7&region=3&count=10`;

    const response = await httpClient.get({ url: endpoint });

    const data = response?.data || [];
    console.log(`Found ${meetings.length} meetings`);

    const races = [];
    for (const race of data) {
        if (race.resultStatus === 4 || race.resultStatus === 0) {
            race.status = race.resultStatus == 4 ? 'Open' : 'Closed'
            races.push({
                track: {
                    trackName: race.venue,
                    country: race.countryCode,
                    raceType: race.racingType
                },
                raceNumber: race.raceNumber,
                raceStartTime: race.advertisedStartDateTime,
                status: race.status,
                id: race.eventId
            });
        }
        
    }

    const promises = races.map(race => limit(() => fetchRaceDetails(race)));
    await Promise.allSettled(promises);
} catch (error) {
    console.log("Error",error) 
    throw error;
     
}
}
