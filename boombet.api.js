import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.BoomBET_CONCURRENCY_LIMIT || 10);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://sb-saturn.azurefd.net/api/v3/race/event/${race.eventId}?checkHotBet=false&includeForm=true`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint });

        if (response?.data?.runners) {
            const runners = response.data.runners;

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    if (runner?.odds) {
                        runner.odds.map(odd => {
                            return {
                                number: runner.sequence,
                                bookmakerMarkets: [{
                                    bookmaker: "BoomBet",
                                    odds: {
                                        Win: odd?.product && odd.product.betType == 'Win' ? odd.value : null,
                                        Place: odd?.product && odd.product.betType == 'Place' ? odd.value : null
                                    }
                                }]
                            };
                        })
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

export async function getboombetMeetingByDate() {
    try {
        
    
    const startDate = moment().startOf('day').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');
    const endDate = moment().startOf('day').add(24, 'hours').utc().format('YYYY-MM-DDTHH:mm:00.000[Z]');

    console.log(`Fetching meetings for ${startDate} to ${endDate}`);

    const endpoint = `https://sb-saturn.azurefd.net/api/v3/race/getracecardsall?day=7&onExactDate=991231`;

    const response = await httpClient.get({ url: endpoint });

    const data = response?.data || [];
    console.log(`Found ${meetings.length} meetings`);

    const races = [];
    for (const race of data) {
        if (race.resultStatus === 4 || race.resultStatus === 0) {
            race.status = race.resultStatus == 4 ? 'Open' : 'Closed'
            races.push({
                track: {
                    trackName: race.meetingName,
                    country: race.state,
                    raceType: race.type == 1 ? 'Horses' : race.type == 2 ? 'Harness' : 'Greyhounds'
                },
                raceNumber: race.raceNumber,
                raceStartTime: race.jumpTime.replace("+00:00", "Z"),
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
