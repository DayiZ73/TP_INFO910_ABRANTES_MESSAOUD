// Quick test to understand data types in the comparison

// Simulate what fetchUserWatchlist returns (line 108-112 in letterboxdService.js)
const watchlistMovie = {
  id: "12345",
  slug: "inception",
  title: "Inception",
  posterUrl: null
};

// Simulate what fetchUserWatched returns (line 177-179 in letterboxdService.js)
const watchedFilmIds = ["12345", "67890"];

// The comparison in analyzeService.js line 21
console.log("=== DATA TYPE ANALYSIS ===\n");

console.log("1. Watchlist movie object:");
console.log("   movie.id =", watchlistMovie.id);
console.log("   typeof movie.id =", typeof watchlistMovie.id);
console.log("");

console.log("2. Watched array:");
console.log("   watched =", watchedFilmIds);
console.log("   typeof watched[0] =", typeof watchedFilmIds[0]);
console.log("");

console.log("3. Comparison test:");
console.log("   userData.watched.includes(movie.id)");
console.log("   Result:", watchedFilmIds.includes(watchlistMovie.id));
console.log("");

// Test with different types
const numericId = 12345;
const stringId = "12345";
const watchedNumeric = [12345, 67890];
const watchedString = ["12345", "67890"];

console.log("4. Type mismatch scenarios:");
console.log("   String in string array:", watchedString.includes(stringId), "✓");
console.log("   Number in number array:", watchedNumeric.includes(numericId), "✓");
console.log("   String in number array:", watchedNumeric.includes(stringId), "✗");
console.log("   Number in string array:", watchedString.includes(numericId), "✗");

