const Groq = require('groq-sdk');
const Poll = require('../models/poll');

// ─── Groq client (lazy init so missing key doesn't crash at startup) ─────────
let groqClient = null;
const getGroq = () => {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute a vote-spread label based on the top option's share of total votes.
 */
const getVoteSpread = (options) => {
    const totalVotes = options.reduce((s, o) => s + o.votes, 0);
    if (totalVotes === 0) return 'No votes yet';
    const maxVotes = Math.max(...options.map(o => o.votes));
    const pct = (maxVotes / totalVotes) * 100;
    if (pct >= 85) return 'Unanimous (>85% agreement)';
    if (pct >= 60) return 'Clear majority (60-84% agreement)';
    if (pct >= 40) return 'Contested (40-59% — community is split)';
    return 'Highly contested (<40% — deeply divided)';
};

/**
 * Simple local keyword fallback when Groq is unavailable or returns bad JSON.
 */
const localFallback = (question) => {
    const q = question.toLowerCase();
    const negWords = ['ban', 'against', 'worse', 'fear', 'problem', 'danger', 'bad', 'hate', 'wrong', 'fail', 'destroy', 'ruin'];
    const posWords = ['best', 'love', 'happy', 'great', 'good', 'wonderful', 'amazing', 'excellent', 'enjoy', 'support'];
    const contWords = ['should', 'must', 'debate', 'vs', 'versus', 'fight', 'controversy', 'agree', 'disagree'];

    const negScore = negWords.filter(w => q.includes(w)).length;
    const posScore = posWords.filter(w => q.includes(w)).length;
    const contScore = contWords.filter(w => q.includes(w)).length;

    if (contScore >= 2) return { label: 'Controversial', score: 40, emotion: 'Divisive', topic: 'Other', summary: 'Community discussion with multiple perspectives', keywords: [] };
    if (negScore > posScore) return { label: 'Negative', score: 25, emotion: 'Fearful', topic: 'Other', summary: 'Question raises concerns or challenges', keywords: [] };
    if (posScore > 0) return { label: 'Positive', score: 72, emotion: 'Hopeful', topic: 'Other', summary: 'Positive community engagement expected', keywords: [] };
    return { label: 'Neutral', score: 50, emotion: 'Neutral', topic: 'Other', summary: 'Straightforward factual poll', keywords: [] };
};

/**
 * Build the Groq prompt for a batch of polls.
 */
const buildPrompt = (polls) => {
    const pollDescriptions = polls.map((poll, i) => {
        const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
        const topOption = poll.options.sort((a, b) => b.votes - a.votes)[0];
        const spread = getVoteSpread(poll.options);
        const optionTexts = poll.options.map(o => `"${o.text}"`).join(', ');

        return `[Poll ${i}]
Question: "${poll.question}"
Options: ${optionTexts}
Total votes: ${totalVotes}
Leading option: "${topOption?.text || 'N/A'}" with ${topOption?.votes || 0} votes
Vote distribution: ${spread}`;
    }).join('\n\n');

    return `You are a poll sentiment analysis engine. Analyze each poll below considering:
1. The emotional tone of the question
2. The nature of the answer options  
3. The community signal from vote distribution

Return ONLY a valid JSON array with exactly ${polls.length} objects (one per poll, in order):
[
  {
    "pollIndex": 0,
    "sentiment": "Positive" | "Negative" | "Neutral" | "Controversial" | "Engaging",
    "score": <integer 0-100, where 0=most negative, 50=neutral, 100=most positive>,
    "emotion": <one of: Hopeful | Divisive | Curious | Joyful | Fearful | Angry | Inspiring | Neutral>,
    "topic": <one of: Politics | Technology | Lifestyle | Health | Entertainment | Sports | Business | Social | Other>,
    "summary": "<max 15 words describing the community sentiment>",
    "keywords": ["word1", "word2", "word3"]
  }
]

DO NOT include any explanation, markdown, or text outside the JSON array.

${pollDescriptions}`;
};

/**
 * Parse Groq response text into an array of sentiment objects.
 * Handles partial JSON, markdown code fences, etc.
 */
const parseGroqResponse = (text) => {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    // Find the first [ and last ] to extract just the array
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found in response');
    return JSON.parse(cleaned.slice(start, end + 1));
};

// ─── Main Controller ──────────────────────────────────────────────────────────

const analyzeSentiment = async (req, res) => {
    try {
        const { pollIds } = req.body;

        if (!pollIds || !Array.isArray(pollIds) || pollIds.length === 0) {
            return res.status(400).json({ message: 'pollIds array is required' });
        }

        console.log(`\n🤖 [Sentiment] Analyzing ${pollIds.length} polls...`);

        // Load all polls from DB
        const polls = await Poll.find({ _id: { $in: pollIds } }).lean();

        // Split into cached vs needs-analysis
        const cached = polls.filter(p => p.sentiment?.analyzedAt);
        const toAnalyze = polls.filter(p => !p.sentiment?.analyzedAt);

        console.log(`   ✅ Cached: ${cached.length} | 🔍 To analyze: ${toAnalyze.length}`);

        const results = {};

        // Add cached results to map
        cached.forEach(p => {
            results[p._id.toString()] = p.sentiment;
        });

        // Analyze new polls in batches of 10
        if (toAnalyze.length > 0 && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_YOUR_GROQ_KEY_HERE') {
            const BATCH_SIZE = 10;

            for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
                const batch = toAnalyze.slice(i, i + BATCH_SIZE);
                console.log(`   📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} polls)...`);

                try {
                    const groq = getGroq();
                    const chatCompletion = await groq.chat.completions.create({
                        messages: [
                            { role: 'system', content: 'You are a sentiment analysis engine. Always return valid JSON arrays only.' },
                            { role: 'user', content: buildPrompt(batch) },
                        ],
                        model: 'llama3-8b-8192',
                        temperature: 0.2,
                        max_tokens: 2000,
                    });

                    const responseText = chatCompletion.choices[0]?.message?.content || '[]';
                    const parsed = parseGroqResponse(responseText);

                    // Save results to MongoDB & collect for response
                    for (const item of parsed) {
                        const poll = batch[item.pollIndex];
                        if (!poll) continue;

                        const sentiment = {
                            label: item.sentiment || 'Neutral',
                            score: typeof item.score === 'number' ? Math.min(100, Math.max(0, item.score)) : 50,
                            emotion: item.emotion || 'Neutral',
                            topic: item.topic || 'Other',
                            summary: item.summary || '',
                            keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 5) : [],
                            analyzedAt: new Date(),
                        };

                        // Persist to MongoDB
                        await Poll.findByIdAndUpdate(poll._id, { $set: { sentiment } });

                        results[poll._id.toString()] = sentiment;
                        console.log(`   ✅ "${poll.question.substring(0, 40)}..." → ${sentiment.label} (${sentiment.score})`);
                    }

                } catch (batchError) {
                    console.error(`   ❌ Batch error:`, batchError.message);
                    // Apply local fallback for this batch
                    batch.forEach(poll => {
                        const fallback = { ...localFallback(poll.question), analyzedAt: new Date() };
                        results[poll._id.toString()] = fallback;
                    });
                }
            }
        } else if (toAnalyze.length > 0) {
            // No Groq key — use local fallback for all
            console.log(`   ⚠️  No GROQ_API_KEY — using local keyword fallback`);
            toAnalyze.forEach(poll => {
                results[poll._id.toString()] = { ...localFallback(poll.question), analyzedAt: new Date() };
            });
        }

        // Build final response array in original order
        const response = polls.map(poll => ({
            _id: poll._id,
            question: poll.question,
            createdAt: poll.createdAt,
            sentiment: results[poll._id.toString()] || { label: 'Neutral', score: 50, emotion: 'Neutral', topic: 'Other', summary: '', keywords: [] },
        }));

        console.log(`🤖 [Sentiment] Done. Returning ${response.length} results.\n`);
        res.status(200).json({ results: response });

    } catch (error) {
        console.error('❌ Sentiment analysis error:', error.message);
        res.status(500).json({ message: 'Sentiment analysis failed', error: error.message });
    }
};

module.exports = { analyzeSentiment };
