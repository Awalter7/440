// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fetch from 'node-fetch'; // Only needed if your environment doesn't have fetch

export default async function handler(req, res) {
  try {
    // You can allow query params for pagination
    const { page = 1 } = req.query;

    const response = await fetch(`https://api.reverb.com/api/listings/?page=${page}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/hal+json',
        'Content-Type': 'application/hal+json',
        'Authorization': `Bearer 03d34ac7e8658dec40e4777a3bad2ac7cc0d62552f56594d9846b27d0e84a7aa` // <-- Replace with your actual token
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    console.error('Error fetching Reverb listings:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
