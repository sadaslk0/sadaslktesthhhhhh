const axios = require('axios');

export default async function handler(req, res) {
    const { id, key } = req.query;

    const VALID_API_KEY = "sadas2007";
    const OWNER = "@Sadaslk";
    const host = req.headers.host;

    if (key !== VALID_API_KEY) {
        return res.status(401).json({ status: false, message: "Invalid API Key" });
    }

    if (!id) {
        return res.status(400).json({ status: false, message: "ID required" });
    }

    try {
        const detailRes = await axios.get(
            `https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath=${id}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://moviebox.ph/',
                    'X-Forwarded-For': '123.231.20.15'
                }
            }
        );

        const subject = detailRes.data?.data?.subject;
        const subjectId = subject?.subjectId;
        const cookie = detailRes.headers['set-cookie']?.join('; ') || '';

        if (!subjectId) {
            return res.status(404).json({ status: false, message: "Not found" });
        }

        const allEpisodes = [];
        let se = 0;

        while (true) {
            const seasonRes = await axios.get(
                `https://netfilm.world/wefeed-h5api-bff/subject/play`,
                {
                    params: { subjectId, se, ep: 0, detailPath: id },
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': `https://netfilm.world/spa/videoPlayPage/movies/${id}`,
                        'Cookie': cookie,
                        'X-Forwarded-For': '123.231.20.15'
                    }
                }
            );

            const episodes = seasonRes.data?.data?.episodeVo?.episodes || [];
            const streams = seasonRes.data?.data?.streams || [];

            // Movie
            if (se === 0 && episodes.length === 0 && streams.length > 0) {
                return res.status(200).json({
                    status: true,
                    owner: OWNER,
                    type: "movie",
                    movie_details: {
                        title: subject.title || "N/A",
                        image: subject.cover?.url || "",
                        description: subject.description || "",
                        releaseDate: subject.releaseDate || "N/A",
                        genre: subject.genre || "N/A",
                        countryName: subject.countryName || "N/A",
                        imdbRatingValue: subject.imdbRatingValue || "N/A",
                        duration: subject.duration || "N/A"
                    },
                    download_links: streams.map(s => ({
                        quality: `${s.resolutions}p`,
                        size: (parseInt(s.size) / (1024 * 1024)).toFixed(2) + " MB",
                        direct_url: `https://${host}/api/go?url=${encodeURIComponent(s.url)}`
                    }))
                });
            }

            if (!episodes.length) break;

            for (let ep = 0; ep < episodes.length; ep++) {
                try {
                    const playRes = await axios.get(
                        `https://netfilm.world/wefeed-h5api-bff/subject/play`,
                        {
                            params: { subjectId, se, ep, detailPath: id },
                            headers: {
                                'User-Agent': 'Mozilla/5.0',
                                'Referer': `https://netfilm.world/spa/videoPlayPage/movies/${id}`,
                                'Cookie': cookie,
                                'X-Forwarded-For': '123.231.20.15'
                            }
                        }
                    );

                    const streams = playRes.data?.data?.streams || [];

                    allEpisodes.push({
                        season: se + 1,
                        episode: ep + 1,
                        title: episodes[ep]?.title || `Episode ${ep + 1}`,
                        links: streams.map(s => ({
                            quality: `${s.resolutions}p`,
                            size: (parseInt(s.size) / (1024 * 1024)).toFixed(2) + " MB",
                            direct_url: `https://${host}/api/go?url=${encodeURIComponent(s.url)}`
                        }))
                    });

                } catch {}
            }

            se++;
        }

        res.status(200).json({
            status: true,
            owner: OWNER,
            type: "series",
            movie_details: {
                title: subject.title || "N/A",
                image: subject.cover?.url || "",
                description: subject.description || "",
                releaseDate: subject.releaseDate || "N/A",
                genre: subject.genre || "N/A",
                countryName: subject.countryName || "N/A",
                imdbRatingValue: subject.imdbRatingValue || "N/A",
                duration: subject.duration || "N/A"
            },
            total_episodes: allEpisodes.length,
            episodes: allEpisodes
        });

    } catch (e) {
        res.status(500).json({
            status: false,
            error: e.message
        });
    }
}
