import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.betright_CONCURRENCY_LIMIT || 10);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://next-api.betright.com.au/Racing/Event?eventId=${race.id}`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint });
//console.log("response",response?.data?.rnnr)

        if (response?.data?.outcomes) {
            const runners = response?.data?.outcomes

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    
                        const winOdd = runner?.fixedPrices?.find(o=>o.marketTypeCode=="WIN");
                        const winPlace = runner?.fixedPrices?.find(o=>o.marketTypeCode=="PLC");
                        return {
                            number: runner.outcomeId,
                            bookmakerMarkets: [{
                                bookmaker: "betright",
                                odds: {
                                    Win: winOdd?.price|| undefined,
                                    Place: winPlace?.price || undefined
                                }
                            }]
                        };
                    
                })
            };

            console.log("Sending to queue betright:", JSON.stringify(mappedData));
            await sendToQueue("races_queue_smartb" , mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getbetrightMeetingByDate() {
    try {
        
    
    const startDate = moment().format("YYYY-MM-DD");


    const endpoint = `https://next-api.betright.com.au/Racing/GroupedRaceCard?raceDate=${startDate}`;

    const response = await httpClient.get({ url: endpoint});

    // if (!response?.status || !response?.data?.meetings) {
    //     throw new Error('Failed to fetch meetings data from betright');
    // }
//console.log(response)
let meetings = [];
// console.log(data)
if (response?.data ) {
    const data=response.data;
  if (data.thoroughbred && data.thoroughbred.length > 0) {
    data.thoroughbred = data.thoroughbred.map((e) => {
      e["sport"] = "Horse Racing";
      return e;
    });
    meetings = [...meetings, ...data.thoroughbred];
  }
  if (data.greyhounds && data.greyhounds.length > 0) {
    data.greyhounds = data.greyhounds.map((e) => {
      e["sport"] = "Greyhound Racing";
      return e;
    });
    meetings = [...meetings, ...data.greyhounds];
  }
  if (data.trots && data.trots.length > 0) {
    data.trots = data.trots.map((e) => {
      e["sport"] = "Harness Racing";
      return e;
    });
    meetings = [...meetings, ...data.trots];
  }
}

console.log("Meeting betright",meetings?.length)



     const races = [];
    for (const meeting of meetings) {
        for (const race of meeting.races) {
            if (race.isOpenForBetting) {
                races.push({
                    track: {
                        trackName: meeting.venue,
                        country: meeting.countryCode,
                        raceType: meeting.sport
                    },
                    raceNumber: Number(race.raceNumber),
                    raceStartTime: race.advertisedStartTimeUtc,
                    //status: race.status,
                    id: race.eventId
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
