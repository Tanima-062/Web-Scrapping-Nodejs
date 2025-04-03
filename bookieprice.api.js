import moment from 'moment';
import HttpClient from './http.client.js';
import { sendToQueue } from './producers/producer.js';
import pLimit from 'p-limit';

const httpClient = new HttpClient();
const CONCURRENCY_LIMIT = Number(process.env.bookieprice_CONCURRENCY_LIMIT || 15);
const limit = pLimit(CONCURRENCY_LIMIT);

async function fetchRaceDetails(race) {
    try {
        const endpoint = `https://api.bookieprice.com/v1/api/xapi/${race.id}`;

        console.log("Fetching race details:", endpoint);

        const response = await httpClient.get({ url: endpoint,headers:{
            "x-api-key":"ANrj300a1hBCqrwCWJADzi1vONA2IL9oWcD9nKRMWxLhO3xp+wGoO2+CYP9M5gP2y0Q00"
        } });

        if (response?.data?.rnrs) {
            const runners = response.data.rnrs;

            const mappedData = {
                ...race,
                runners: runners.map(runner => {
                  //  if (runner.prices) {
                        const winOdd = runner?.win;
                        const winPlace = runner.plc;
                        return {
                            number: runner.number,
                            bookmakerMarkets: [{
                                bookmaker: "bookieprice",
                                odds: {
                                    Win: winOdd,
                                    Place: winPlace
                                }
                            }]
                        };
                //    }
                })
            };

            console.log("Sending to queue:", JSON.stringify(mappedData));
            await sendToQueue("races_queue_smartb", mappedData);
        }

    } catch (error) {
        console.error(`Failed to fetch race ${race.id}:`, error.message);
    }
}

export async function getbookiepriceMeetingByDate() {
    try {
        
    
        const currentDate = moment().format("DDMMYYYY");

   // console.log(`Fetching meetings for ${startDate} to ${endDate}`);

    const endpoint = `https://api.bookieprice.com/v1/api/xapi/Date/${currentDate}`;

    const response = await httpClient.get({ url: endpoint,headers:{
        "x-api-key":"ANrj300a1hBCqrwCWJADzi1vONA2IL9oWcD9nKRMWxLhO3xp+wGoO2+CYP9M5gP2y0Q00"
    } });

    // if (!response?.status || !response?.data?.meetings) {
    //     throw new Error('Failed to fetch meetings data from bookieprice');
    // }

    const meetings = response?.data || [];
    console.log(`Found ${meetings.length} meetings`);

    const races = [];
    for (const meeting of meetings) {
        for (const race of meeting.mkts) {
            if(race.status==1){
            let raceType="Horse Racing"
            if(meeting.type==2){
                raceType="Harness"
            }else if(meeting.type==3){
                raceType="Greyhound"
            }
          
                races.push({
                    track: {
                        trackName: meeting.name,
                        country: meeting.country,
                        raceType: raceType
                    },
                    raceNumber: race.sortorder,
                    raceStartTime: race.utcstart,
                    status: race.status,
                    id: race.mid
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
