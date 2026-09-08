const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    const { keyword, key } = req.query;
    const VALID_API_KEY = "sadas2012";
    const OWNER = "@Sadaslk";

    if (key !== VALID_API_KEY) return res.status(401).json({ status: false, owner: OWNER, message: "Invalid API Key!" });
    if (!keyword) return res.status(400).json({ status: false, message: "Keyword is required!" });

    try {
        const url = `https://moviebox.ph/web/searchResult?keyword=${encodeURIComponent(keyword)}`;
        
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];

 
        $('a.card').each((i, el) => {
            const link = $(el).attr('href'); 
            const title = $(el).find('h2.card-title').text().trim();
            const rating = $(el).find('span.rate').text().trim();
            
 
            const id = link ? link.split('/').pop() : null;

            if (title) {
                results.push({
                    id: id,
                    title: title,
                    rating: rating || "N/A"
                    //link: "https://moviebox.ph" + link,
                    //poster: $(el).find('img').attr('src') || null 
                });
            }
        });

        res.status(200).json({ 
            status: true, 
            owner: OWNER, 
            count: results.length, 
            results: results 
        });

    } catch (error) {
        res.status(500).json({ status: false, error: "Scraping failed: " + error.message });
    }
}
