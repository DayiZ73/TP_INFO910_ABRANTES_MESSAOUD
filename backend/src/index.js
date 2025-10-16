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

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    groupsCollection = db.collection('groups');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.warn('⚠️  Running in limited mode (validation only, no cache/groups)');
    // Don't exit - run without MongoDB for validation testing
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

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required and must not be empty' });
    }

    const usersData = [];
    const errors = [];

    for (const username of users) {
      try {
        const cachedUser = await usersCollection.findOne({ _id: username });

        if (cachedUser && letterboxdService.isCacheValid(cachedUser.updatedAt)) {
          console.log(`✅ Using cached data for ${username}`);
          usersData.push({
            username,
            watchlist: cachedUser.watchlist,
            watched: cachedUser.watched
          });
        } else {
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

app.post('/api/groups/:id/analyze', async (req, res) => {
  try {
    const group = await groupsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const usersData = [];

    for (const username of group.users) {
      const cachedUser = await usersCollection.findOne({ _id: username });

      if (cachedUser && letterboxdService.isCacheValid(cachedUser.updatedAt)) {
        usersData.push({
          username,
          watchlist: cachedUser.watchlist,
          watched: cachedUser.watched
        });
      } else {
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
