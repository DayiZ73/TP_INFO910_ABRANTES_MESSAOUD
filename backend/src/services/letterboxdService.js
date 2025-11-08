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

      // Check if page contains Letterboxd's error message for non-existent users
      const bodyText = $('body').text();
      const hasError = bodyText.includes("Sorry, we can't find the page you've requested");

      if (hasError) {
        console.log(`⚠️  User ${username}: Error message found - user doesn't exist`);
        return { exists: false };
      }

      // Try to get display name from profile, fallback to username
      const displayNameElem = $('.profile-person .name');
      const displayName = displayNameElem.text().trim() || username;

      console.log(`✅ User ${username}: Valid user found`);
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
      console.log(`📥 Fetching watchlist for ${username}`);
      const watchlist = [];
      let page = 1;
      let hasMorePages = true;

      // Loop through all pages until no more films found
      while (hasMorePages) {
        await delayRequest();
        const url = `https://letterboxd.com/${username}/watchlist/page/${page}/`;
        console.log(`  📄 Fetching page ${page}...`);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        let filmsFoundOnPage = 0;

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
            filmsFoundOnPage++;
          }
        });

        console.log(`  ✅ Found ${filmsFoundOnPage} films on page ${page}`);

        // Stop if no films found on this page
        if (filmsFoundOnPage === 0) {
          hasMorePages = false;
        } else {
          page++;
        }
      }

      console.log(`✅ Total watchlist: ${watchlist.length} films across ${page - 1} pages`);

      // Posters will be fetched later for common movies only (after analysis)
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
      console.log(`📥 Fetching watched films for ${username}`);
      const watched = [];
      let page = 1;
      let hasMorePages = true;

      // Loop through all pages until no more films found
      while (hasMorePages) {
        await delayRequest();
        const url = `https://letterboxd.com/${username}/films/page/${page}/`;
        console.log(`  📄 Fetching watched page ${page}...`);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        let filmsFoundOnPage = 0;

        $('li.griditem .react-component[data-film-id]').each((i, elem) => {
          const filmId = $(elem).attr('data-film-id');
          if (filmId) {
            watched.push(filmId);
            filmsFoundOnPage++;
          }
        });

        console.log(`  ✅ Found ${filmsFoundOnPage} watched films on page ${page}`);

        // Stop if no films found on this page
        if (filmsFoundOnPage === 0) {
          hasMorePages = false;
        } else {
          page++;
        }
      }

      console.log(`✅ Total watched: ${watched.length} films across ${page - 1} pages`);

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
