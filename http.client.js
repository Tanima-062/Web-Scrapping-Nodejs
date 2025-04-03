import axios from 'axios';
import UserAgent from 'user-agents';
import { SocksProxyAgent } from 'socks-proxy-agent';

class HttpClient {
    constructor(baseURL = '') {
        this.client = axios.create({
            baseURL,
            timeout: 15000, // Temporarily increased timeout
            maxRedirects: 0,
        });
    }

    async get({ url, headers = {}, randomUserAgent = true, proxy = 'socks5://192.168.9.199:1080' }) {
        const userAgent = randomUserAgent
            ? new UserAgent({ deviceCategory: 'desktop' }).toString()
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

        // Create a new proxy agent for each request
        const agent = new SocksProxyAgent(proxy);
        agent.keepAlive = false; // Disable keep-alive to close connections immediately

        const config = {
            method: 'get',
            url,
            headers: {
                ...headers,
                'User-Agent': userAgent,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            httpAgent: agent,
            httpsAgent: agent,
        };

        console.log("Config---", config);

        try {
            const response = await this.client(config);
            return {
                status: true,
                statusCode: response.status,
                headers: response.headers,
                data: response.data,
            };
        } catch (error) {
            console.error(' Request failed:',config.url, error.message);
            return {
                status: false,
                errors: [error.message],
            };
        }
    }
}

export default HttpClient;
