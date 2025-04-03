import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.betr_CONCURRENCY_LIMIT || 5);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://web20-api.bluebet.com.au/Race?eventId=${race.id}&format=json`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint,headers:{origin:"https://www.betr.com.au/"} });
//console.log("response",response?.data?.rnnr)

        if (response?.data?.Outcomes) {
            const runners = response?.data?.Outcomes

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                    
                        const winOdd = runner?.FixedPrices?.find(o=>o.MarketTypeCode=="WIN");
                        const winPlace = runner?.FixedPrices?.find(o=>o.MarketTypeCode=="PLC");
                        return {
                            number: runner.OutcomeId,
                            bookmakerMarkets: [{
                                bookmaker: "betr",
                                odds: {
                                    Win: winOdd?.Price|| undefined,
                                    Place: winPlace?.Price || undefined
                                }
                            }]
                        };
                    
                })
            };

            console.log("Sending to queue Betr:", JSON.stringify(mappedData));
            await sendToQueue("races_queue_smartb" , mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getbetrMeetingByDate() {
    try {
        
    
    const startDate = moment().format("YYYY-MM-DD");


    const endpoint = `https://web20-api.bluebet.com.au/GroupedRaceCard?DaysToRace=0&format=json`;

    const response = await httpClient.get({ url: endpoint,headers:{origin:"https://www.betr.com.au/"} });

    // if (!response?.status || !response?.data?.meetings) {
    //     throw new Error('Failed to fetch meetings data from betr');
    // }
//console.log(response)
let meetings = [];
// console.log(data)
if (response?.data ) {
    const data=response.data;
  if (data.Thoroughbred && data.Thoroughbred.length > 0) {
    data.Thoroughbred = data.Thoroughbred.map((e) => {
      e["sport"] = "Horse Racing";
      return e;
    });
    meetings = [...meetings, ...data.Thoroughbred];
  }
  if (data.Greyhounds && data.Greyhounds.length > 0) {
    data.Greyhounds = data.Greyhounds.map((e) => {
      e["sport"] = "Greyhound Racing";
      return e;
    });
    meetings = [...meetings, ...data.Greyhounds];
  }
  if (data.Trots && data.Trots.length > 0) {
    data.Trots = data.Trots.map((e) => {
      e["sport"] = "Harness Racing";
      return e;
    });
    meetings = [...meetings, ...data.Trots];
  }
}

console.log("Meeting betr",meetings?.length)



     const races = [];
    for (const meeting of meetings) {
        for (const race of meeting) {
            if (race.IsOpenForBetting) {
                races.push({
                    track: {
                        trackName: race.Venue,
                        country: race.CountryCode,
                        raceType: meeting.sport
                    },
                    raceNumber: Number(race.RaceNumber),
                    raceStartTime: race.AdvertisedStartTime,
                    //status: race.status,
                    id: race.EventId
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
