const express = require('express');
const { register, login, logout, getuserdetails, updateProfile, changePassword } = require('../controller/authController');

const { createPoll, getAllPolls, getUserPolls, deletePoll, voteOnPoll, getVotedPolls, bookmarkpoll, getbookmarkedPolls, getTrendingPolls } = require('../controller/pollController');
const { analyzeSentiment } = require('../controller/sentimentController');
const protect = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');
const router = express.Router();

// Auth routes
router.post('/register', upload.single('profileImage'), (req, res, next) => {
  console.log('Register route called with body:', req.body);
  next();
}, register);

router.post('/login', (req, res, next) => {
  console.log('Login route called with body:', req.body);
  next();
}, login);

router.post('/logout', protect, (req, res, next) => {
  console.log('Logout route called');
  next();
}, logout);

// User routes
router.get('/getuser', protect, (req, res, next) => {
  console.log('Get user route called');
  next();
}, getuserdetails);

router.put('/update-profile', protect, upload.single('profileImage'), (req, res, next) => {
  console.log('Update profile route called with body:', req.body);
  console.log('File:', req.file);
  next();
}, updateProfile);

router.put('/change-password', protect, (req, res, next) => {
  console.log('Change password route called');
  next();
}, changePassword);

// Poll creation and retrieval
router.post('/create-poll', protect, upload.array('images', 4), (req, res, next) => {
  console.log('Create poll route called');
  next();
}, createPoll);

router.get('/getpolls', (req, res, next) => {
  console.log('Get all polls route called');
  next();
}, getAllPolls);

router.get('/userpoll', protect, (req, res, next) => {
  console.log('Get user polls route called');
  next();
}, getUserPolls);

// Poll deletion
router.delete('/delete-poll/:id', protect, (req, res, next) => {
  console.log('Delete poll route called with id:', req.params.id);
  next();
}, deletePoll);

// Voting and polls
router.patch('/votepoll/:pollId', protect, (req, res, next) => {
  console.log('Vote on poll route called');
  next();
}, voteOnPoll);

router.get('/getvotedpolls', protect, (req, res, next) => {
  console.log('Get voted polls route called');
  next();
}, getVotedPolls);

// Bookmarking
router.post('/bookmarkpoll/:pollId', protect, (req, res, next) => {
  console.log('Bookmark poll route called');
  next();
}, bookmarkpoll);

router.get('/getbookmarkedpolls', protect, (req, res, next) => {
  console.log('Get bookmarked polls route called');
  next();
}, getbookmarkedPolls);

router.get('/trendingpolls', (req, res, next) => {
  console.log('Get trending polls route called');
  next();
}, getTrendingPolls);

// Sentiment analysis
router.post('/analyze-sentiment', protect, (req, res, next) => {
  console.log('Analyze sentiment route called for', req.body?.pollIds?.length, 'polls');
  next();
}, analyzeSentiment);

module.exports = router;