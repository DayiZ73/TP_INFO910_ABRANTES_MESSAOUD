class AnalyzeService {
  calculateCommonMovies(usersData) {
    const movieMap = new Map();

    usersData.forEach(userData => {
      userData.watchlist.forEach(movie => {
        const key = movie.id;
        if (!movieMap.has(key)) {
          movieMap.set(key, {
            ...movie,
            inWatchlistCount: 0,
            watchedCount: 0,
            users: []
          });
        }

        const movieData = movieMap.get(key);
        movieData.inWatchlistCount++;
        movieData.users.push(userData.username);

        if (userData.watched.includes(movie.id)) {
          movieData.watchedCount++;
        }
      });
    });

    return Array.from(movieMap.values());
  }

  sortMoviesByRelevance(movies, totalUsers) {
    return movies.sort((a, b) => {
      const aWatchlistRatio = a.inWatchlistCount / totalUsers;
      const bWatchlistRatio = b.inWatchlistCount / totalUsers;
      const aWatchedRatio = a.watchedCount / totalUsers;
      const bWatchedRatio = b.watchedCount / totalUsers;

      if (aWatchedRatio === 0 && bWatchedRatio > 0) return -1;
      if (bWatchedRatio === 0 && aWatchedRatio > 0) return 1;

      if (aWatchedRatio === 0 && bWatchedRatio === 0) {
        if (aWatchlistRatio !== bWatchlistRatio) {
          return bWatchlistRatio - aWatchlistRatio;
        }
      }

      if (aWatchlistRatio === 1 && bWatchlistRatio < 1) return -1;
      if (bWatchlistRatio === 1 && aWatchlistRatio < 1) return 1;

      if (aWatchlistRatio !== bWatchlistRatio) {
        return bWatchlistRatio - aWatchlistRatio;
      }

      return aWatchedRatio - bWatchedRatio;
    });
  }

  calculatePriority(movie, totalUsers) {
    const watchlistRatio = movie.inWatchlistCount / totalUsers;
    const watchedRatio = movie.watchedCount / totalUsers;

    if (watchlistRatio === 1 && watchedRatio === 0) return 1;
    if (watchlistRatio >= 0.6 && watchedRatio === 0) return 2;
    if (watchlistRatio >= 0.3 && watchedRatio === 0) return 3;
    if (watchlistRatio === 1 && watchedRatio > 0) return 4;
    if (watchlistRatio >= 0.6 && watchedRatio > 0) return 5;
    
    return 6;
  }

  analyzeWatchlists(usersData) {
    const commonMovies = this.calculateCommonMovies(usersData);

    // Filter to only show truly common movies (in at least 2 users' watchlists)
    // If analyzing a single user, show all their movies
    const filteredMovies = usersData.length > 1
      ? commonMovies.filter(movie => movie.inWatchlistCount >= 2)
      : commonMovies;

    const sortedMovies = this.sortMoviesByRelevance(filteredMovies, usersData.length);

    const moviesWithPriority = sortedMovies.map(movie => ({
      ...movie,
      priority: this.calculatePriority(movie, usersData.length)
    }));

    return {
      totalMovies: moviesWithPriority.length,
      totalUsers: usersData.length,
      movies: moviesWithPriority
    };
  }
}

module.exports = new AnalyzeService();
