const axios = require('axios');

export default async function handler(req, res) {
    const { id, key } = req.query;
    const VALID_API_KEY = "sadas2012";
    const OWNER = "@Sadaslk";
    const host = req.headers.host; 

    if (key !== VALID_API_KEY) return res.status(401).json({ status: false, message: "Invalid API Key!" });
    if (!id) return res.status(400).json({ status: false, message: "Movie ID is required!" });

    try {
        const detailUrl = `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath=${id}`;
        const detailRes = await axios.get(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Referer': 'https://moviebox.ph/',
                'X-Forwarded-For': '123.231.20.15'
            }
        });

        const subject = detailRes.data?.data?.subject;
        const subjectId = subject?.subjectId;
        const cookies = detailRes.headers['set-cookie'];
        const token = cookies ? cookies.join('; ') : '';

        if (!subjectId) return res.status(404).json({ status: false, message: "Subject ID not found" });

        const playUrl = `https://netfilm.world/wefeed-h5api-bff/subject/play`;
        const playRes = await axios.get(playUrl, {
            params: { subjectId, se: 0, ep: 0, detailPath: id },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': `https://netfilm.world/spa/videoPlayPage/movies/${id}`,
                'Cookie': token,
                'X-Forwarded-For': '123.231.20.15'
            }
        });

        const streams = playRes.data?.data?.streams || [];

        res.status(200).json({
            status: true,
            owner: OWNER,
            movie_details: {
                title: subject.title || "N/A",
                image: subject.cover?.url || "",
                releaseDate: subject.releaseDate || "N/A",
                genre: subject.genre || "N/A",
                countryName: subject.countryName || "N/A",
                imdbRatingValue: subject.imdbRatingValue || "N/A"
            },
            download_links: streams.map(s => ({
                quality: s.resolutions + "p",
                size: (parseInt(s.size) / (1024 * 1024)).toFixed(2) + " MB",
                original_url: s.url,
                direct_url: `https://${host}/api/go?url=${encodeURIComponent(s.url)}`
            }))
        });

    } catch (error) {
        res.status(500).json({ 
            status: false, 
            error: error.message 
        });
    }
}
