import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.colossalbet_CONCURRENCY_LIMIT || 10);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://apicob.generationweb.com.au/GWBetService/r/b/GetEventRace/${race.id}/RunnerNum?rand=${Date.now()}`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint ,headers:{
            "authorization":`clientKey=colossalbet&timestamp=${Date.now()}&signature=7a34c4341ef77f111a5665eb174811b19df406f1`
        }});
//console.log("response",response?.data?.rnnr)

        if (response?.data?.rnnr) {
            const runners = response?.data?.rnnr

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    
                        const winOdd = runner.FWIN;
                        const winPlace = runner.FPLC;
                        return {
                            number: runner.rs,
                            bookmakerMarkets: [{
                                bookmaker: "colossalbet",
                                odds: {
                                    Win: winOdd|| undefined,
                                    Place: winPlace || undefined
                                }
                            }]
                        };
                    
                })
            };

            console.log("Sending to queue:", JSON.stringify(mappedData));
            await sendToQueue("races_queue_smartb" , mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getcolossalbetMeetingByDate() {
    try {
        
    
    const startDate = moment().format("YYYY-MM-DD");


    const endpoint = `https://api.racebookhq.com/api/v1/genweb/events/short/${startDate}`;

    const response = await httpClient.get({ url: endpoint,headers:{origin:"https://www.colossalbet.com.au"} });

    // if (!response?.status || !response?.data?.meetings) {
    //     throw new Error('Failed to fetch meetings data from colossalbet');
    // }
//console.log(response)
    const meetings = response?.data?.meeting || [];
    console.log(`Found ${meetings.length} meetings`);

    const races = [];
    for (const meeting of meetings) {
        for (const race of meeting.races) {
            if (race.status !== "DONE") {
                races.push({
                    track: {
                        trackName: meeting?.meetingName?.replace(/\d{2}-\d{2}$/, '').trim()
                        ,
                        country: meeting.country,
                        raceType: meeting.sportCode
                    },
                    raceNumber: Number(race.raceNumber),
                    raceStartTime: race.startTime,
                    status: race.status,
                    id: race.raceId
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
