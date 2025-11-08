const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const letterboxdService = require('./services/letterboxdService');
const analyzeService = require('./services/analyzeService');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'letterboxd_analyzer';

app.use(cors());
app.use(express.json());

let db;
let usersCollection;
let groupsCollection;
let analysesCollection;
let postersCollection;

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    groupsCollection = db.collection('groups');
    analysesCollection = db.collection('analyses');
    postersCollection = db.collection('posters');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.warn('⚠️  Running in limited mode (validation only, no cache/groups)');
    // Don't exit - run without MongoDB for validation testing
  }
}

// Helper function to fetch poster with caching (30-day TTL)
const POSTER_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

async function fetchPosterWithCache(slug) {
  if (!slug || !postersCollection) {
    return null;
  }

  try {
    // Check cache first
    const cachedPoster = await postersCollection.findOne({ _id: slug });
    const now = new Date();

    if (cachedPoster && cachedPoster.updatedAt) {
      const cacheAge = now - new Date(cachedPoster.updatedAt);
      if (cacheAge < POSTER_CACHE_TTL) {
        console.log(`🖼️  Using cached poster for ${slug}`);
        return cachedPoster.posterUrl;
      }
    }

    // Cache miss or expired - fetch from Letterboxd
    console.log(`🔄 Fetching poster for ${slug}`);
    const posterUrl = await letterboxdService.fetchFilmPoster(slug);

    // Save to cache
    if (posterUrl) {
      await postersCollection.updateOne(
        { _id: slug },
        {
          $set: {
            posterUrl,
            updatedAt: now
          }
        },
        { upsert: true }
      );
    }

    return posterUrl;
  } catch (error) {
    console.error(`Error fetching poster for ${slug}:`, error.message);
    return null;
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users/:username/validate', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 Validating user: ${username}`);

    const response = await letterboxdService.validateUser(username);
    
    res.json({
      exists: response.exists,
      username: username,
      displayName: response.displayName
    });
  } catch (error) {
    console.error(`❌ Validation error for ${req.params.username}:`, error.message);
    res.status(500).json({ error: 'Failed to validate user', exists: false });
  }
});

app.post('/api/analyze', async (req, res) => {
  console.log('📊 Starting watchlist analysis for:', req.body.users);
  try {
    const { users } = req.body;
    const forceRefresh = req.query.forceRefresh === 'true';

    if (forceRefresh) {
      console.log('🔄 Force refresh requested - invalidating cache for all users');
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required and must not be empty' });
    }

    const usersData = [];
    const errors = [];

    for (const username of users) {
      try {
        const cachedUser = await usersCollection.findOne({ _id: username });

        if (cachedUser && letterboxdService.isCacheValid(cachedUser.updatedAt) && !forceRefresh) {
          console.log(`✅ Using cached data for ${username}`);
          usersData.push({
            username,
            watchlist: cachedUser.watchlist,
            watched: cachedUser.watched
          });
        } else {
          if (forceRefresh && cachedUser) {
            console.log(`🗑️  Deleting cache for ${username}`);
            await usersCollection.deleteOne({ _id: username });
          }

          console.log(`🔄 Fetching fresh data for ${username}`);

          const watchlist = await letterboxdService.fetchUserWatchlist(username);
          const watched = await letterboxdService.fetchUserWatched(username);

          console.log(`✅ Found ${watchlist.length} films in watchlist and ${watched.length} watched for ${username}`);

          await usersCollection.updateOne(
            { _id: username },
            {
              $set: {
                watchlist,
                watched,
                updatedAt: new Date()
              }
            },
            { upsert: true }
          );

          usersData.push({
            username,
            watchlist,
            watched
          });
        }
      } catch (userError) {
        console.error(`❌ Error fetching data for ${username}:`, userError.message);
        errors.push({ username, error: userError.message });
      }
    }

    if (usersData.length === 0) {
      return res.status(400).json({
        error: 'Failed to fetch data for all users',
        details: errors
      });
    }

    const analysis = analyzeService.analyzeWatchlists(usersData);
    console.log(`✅ Analysis complete: ${analysis.totalMovies} common movies found`);

    // Fetch posters for common movies only (with caching)
    console.log(`🖼️  Fetching posters for ${analysis.movies.length} common films...`);
    for (const movie of analysis.movies) {
      if (movie.slug) {
        movie.posterUrl = await fetchPosterWithCache(movie.slug);
      }
    }

    res.json({
      ...analysis,
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during analysis' });
  }
});

app.get('/api/groups', async (req, res) => {
  try {
    const groups = await groupsCollection.find({}).toArray();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'Name and users array are required' });
    }

    const group = {
      name,
      users,
      createdAt: new Date()
    };

    const result = await groupsCollection.insertOne(group);
    res.status(201).json({ _id: result.insertedId, ...group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:id', async (req, res) => {
  try {
    const group = await groupsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const result = await groupsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:id/analysis', async (req, res) => {
  try {
    const groupId = req.params.id;

    // Retrieve saved analysis from database
    const savedAnalysis = await analysesCollection.findOne({ groupId: groupId });

    if (!savedAnalysis) {
      return res.status(404).json({
        error: 'No analysis found for this group',
        message: 'Please run an analysis first by clicking the Refresh button'
      });
    }

    console.log(`📖 Retrieved cached analysis for group: ${savedAnalysis.groupName}`);

    // Return the saved analysis (without _id and internal fields)
    res.json({
      movies: savedAnalysis.movies,
      totalMovies: savedAnalysis.totalMovies,
      totalUsers: savedAnalysis.totalUsers
    });
  } catch (error) {
    console.error('Error retrieving analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups/:id/analyze', async (req, res) => {
  try {
    const forceRefresh = req.query.forceRefresh === 'true';
    const group = await groupsCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (forceRefresh) {
      console.log(`🔄 Force refresh requested for group: ${group.name}`);
    }

    const usersData = [];

    for (const username of group.users) {
      const cachedUser = await usersCollection.findOne({ _id: username });

      if (cachedUser && letterboxdService.isCacheValid(cachedUser.updatedAt) && !forceRefresh) {
        console.log(`✅ Using cached data for ${username}`);
        usersData.push({
          username,
          watchlist: cachedUser.watchlist,
          watched: cachedUser.watched
        });
      } else {
        if (forceRefresh && cachedUser) {
          console.log(`🗑️  Deleting cache for ${username}`);
          await usersCollection.deleteOne({ _id: username });
        }

        console.log(`🔄 Fetching fresh data for ${username}`);
        const watchlist = await letterboxdService.fetchUserWatchlist(username);
        const watched = await letterboxdService.fetchUserWatched(username);

        await usersCollection.updateOne(
          { _id: username },
          {
            $set: {
              watchlist,
              watched,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        usersData.push({
          username,
          watchlist,
          watched
        });
      }
    }

    const analysis = analyzeService.analyzeWatchlists(usersData);
    console.log(`✅ Analysis complete: ${analysis.totalMovies} common movies found`);

    // Fetch posters for common movies only (with caching)
    console.log(`🖼️  Fetching posters for ${analysis.movies.length} common films...`);
    for (const movie of analysis.movies) {
      if (movie.slug) {
        movie.posterUrl = await fetchPosterWithCache(movie.slug);
      }
    }

    // Save analysis results to database for future "View" access
    await analysesCollection.updateOne(
      { groupId: group._id.toString() },
      {
        $set: {
          groupId: group._id.toString(),
          groupName: group.name,
          users: group.users,
          movies: analysis.movies,
          totalMovies: analysis.totalMovies,
          totalUsers: analysis.totalUsers,
          timestamp: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`💾 Saved analysis results for group: ${group.name}`);

    res.json(analysis);
  } catch (error) {
    console.error('Group analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Letterboxd Analyzer API running on port ${PORT}`);
  });
});
