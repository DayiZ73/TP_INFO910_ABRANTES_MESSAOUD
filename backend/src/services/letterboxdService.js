const axios = require('axios');
const cheerio = require('cheerio');

const CACHE_TTL = 24 * 60 * 60 * 1000;
const REQUEST_DELAY = 1000;

let lastRequestTime = 0;

async function delayRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

class LetterboxdService {
  async validateUser(username) {
    try {
      await delayRequest();
      const url = `https://letterboxd.com/${username}/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const displayName = $('.profile-person .name').text().trim() || username;

      return {
        exists: true,
        displayName: displayName
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { exists: false };
      }
      console.error(`Validation error for ${username}:`, error.message);
      throw error;
    }
  }
  async fetchFilmPoster(filmSlug) {
    try {
      await delayRequest();
      const url = `https://letterboxd.com/film/${filmSlug}/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const ogImage = $('meta[property="og:image"]').attr('content');

      return ogImage || 'https://s.ltrbxd.com/static/img/empty-poster-230.png';
    } catch (error) {
      console.warn(`Failed to fetch poster for ${filmSlug}:`, error.message);
      return 'https://s.ltrbxd.com/static/img/empty-poster-230.png';
    }
  }

  async fetchUserWatchlist(username) {
    try {
      await delayRequest();
      console.log(`📥 Fetching watchlist for ${username}`);
      const url = `https://letterboxd.com/${username}/watchlist/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const watchlist = [];

      $('li.griditem .react-component[data-film-id]').each((i, elem) => {
        const filmSlug = $(elem).attr('data-item-slug');
        const filmName = $(elem).attr('data-item-name');
        const filmId = $(elem).attr('data-film-id');

        if (filmSlug && filmId) {
          watchlist.push({
            id: filmId,
            slug: filmSlug,
            title: filmName,
            posterUrl: null // Will be fetched separately to avoid too many requests
          });
        }
      });

      // Fetch poster URLs for first 20 films only to avoid too many requests
      const filmsToFetch = watchlist.slice(0, 20);
      console.log(`🖼️  Fetching poster URLs for ${filmsToFetch.length} films...`);

      for (const film of filmsToFetch) {
        film.posterUrl = await this.fetchFilmPoster(film.slug);
      }

      // Set placeholder for remaining films
      for (let i = 20; i < watchlist.length; i++) {
        watchlist[i].posterUrl = 'https://s.ltrbxd.com/static/img/empty-poster-230.png';
      }

      return watchlist;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`User ${username} not found on Letterboxd`);
      }
      throw new Error(`Failed to fetch watchlist for ${username}: ${error.message}`);
    }
  }

  async fetchUserWatched(username) {
    try {
      await delayRequest();
      console.log(`📥 Fetching watched films for ${username}`);
      const url = `https://letterboxd.com/${username}/films/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const watched = [];

      $('li.griditem .react-component[data-film-id]').each((i, elem) => {
        const filmId = $(elem).attr('data-film-id');
        if (filmId) {
          watched.push(filmId);
        }
      });

      return watched;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`User ${username} not found on Letterboxd`);
      }
      throw new Error(`Failed to fetch watched films for ${username}: ${error.message}`);
    }
  }

  async fetchFilmDetails(filmSlug) {
    try {
      const url = `https://letterboxd.com/film/${filmSlug}/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const rating = $('.average-rating .average').text().trim();
      const year = $('.film-header .number').first().text().trim();
      const director = $('.directedby a').first().text().trim();

      return {
        rating: rating || null,
        year: year || null,
        director: director || null
      };
    } catch (error) {
      console.error(`Failed to fetch film details for ${filmSlug}:`, error.message);
      return { rating: null, year: null, director: null };
    }
  }

  isCacheValid(timestamp) {
    if (!timestamp) return false;
    const now = new Date().getTime();
    const cacheAge = now - new Date(timestamp).getTime();
    return cacheAge < CACHE_TTL;
  }
}

module.exports = new LetterboxdService();
