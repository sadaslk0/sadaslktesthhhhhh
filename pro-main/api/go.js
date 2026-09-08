export const config = {
    runtime: "nodejs",
    regions: ["sin1"], // Asia (best for Sri Lanka)
};

const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) return res.status(400).send("No URL provided");

    const decodedUrl = decodeURIComponent(url);

    try {
        const response = await axios({
            method: 'get',
            url: decodedUrl,
            responseType: 'stream',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://netfilm.world/',
                'Origin': 'https://netfilm.world',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            maxRedirects: 5,
            validateStatus: () => true
        });

        // status pass-through (important for CDN streaming)
        res.status(response.status);

        // headers forward
        if (response.headers['content-type'])
            res.setHeader('Content-Type', response.headers['content-type']);

        if (response.headers['content-length'])
            res.setHeader('Content-Length', response.headers['content-length']);

        if (response.headers['accept-ranges'])
            res.setHeader('Accept-Ranges', response.headers['accept-ranges']);

        if (response.headers['content-range'])
            res.setHeader('Content-Range', response.headers['content-range']);

        res.setHeader('Content-Disposition', 'inline; filename="nadeen.mp4"');

        response.data.pipe(res);

    } catch (error) {
        console.error("Streaming Error:", error.message);
        res.status(500).send("Streaming failed: " + error.message);
    }
}
