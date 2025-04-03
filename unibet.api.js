import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.UNIBET_CONCURRENCY_LIMIT || 10);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://api.unicdn.net/v1/feeds/racingau/api/v1/events/${race.id}.json?app_id=${process.env.UNIBET_APP_ID}&app_key=${process.env.UNIBET_APP_KEY}`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint });

        if (response?.data?.competitors) {
            const runners = response.data.competitors;

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    if (runner.prices) {
                        const winOdd = runner.prices.find(odd => odd.betType === "FixedWin");
                        const winPlace = runner.prices.find(odd => odd.betType === "FixedPlace");
                        return {
                            number: runner.sequence,
                            bookmakerMarkets: [{
                                bookmaker: "Unibet",
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

export async function getunibetMeetingByDate() {
    try {
        
    
    const startDate = moment().startOf('day').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');
    const endDate = moment().startOf('day').add(24, 'hours').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');

    console.log(`Fetching meetings for ${startDate} to ${endDate}`);

    const endpoint = `https://api.unicdn.net/v1/feeds/racingau/api/v1/meetings.json?app_id=${process.env.UNIBET_APP_ID}&app_key=${process.env.UNIBET_APP_KEY}&searchRequest.startDateTime=${startDate}&searchRequest.endDateTime=${endDate}`;

    const response = await httpClient.get({ url: endpoint });

    // if (!response?.status || !response?.data?.meetings) {
    //     throw new Error('Failed to fetch meetings data from Unibet');
    // }

    const meetings = response?.data?.meetings || [];
    console.log(`Found ${meetings.length} meetings`);

    const races = [];
    for (const meeting of meetings) {
        for (const race of meeting.events) {
            if (race.status === 'Open' || race.status === 'Closed') {
                races.push({
                    track: {
                        trackName: meeting.name,
                        country: meeting.countryCode,
                        raceType: meeting.raceType
                    },
                    raceNumber: race.sequence,
                    raceStartTime: race.eventDateTimeUtc,
                    status: race.status,
                    id: race.eventKey
                });
            }
        }
    }

    const promises = races.map(race => limit(() => fetchRaceDetails(race)));
    await Promise.allSettled(promises);
} catch (error) {
    console.log("Error",error) 
    throw error;
     
}
}
