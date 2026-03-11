from flask import Flask, request, jsonify
import requests
import json
from datetime import datetime, timedelta
import os
import logging
import re
from collections import deque
import pickle
from threading import Thread
import time

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

latest_sentiment_data = {}  # Cached real-time sentiment data

class RealTimeMarketSentiment:
    def __init__(self):
        self.news_api_key = "548d29e9869445b8b777f2be958252e6"
        self.sentiment_history = deque(maxlen=100)
        self.sentiment_weights = {
            'positive_keywords': ['rally', 'surge', 'bullish', 'gains', 'rise', 'up', 'growth', 'strong', 'buy', 'optimistic'],
            'negative_keywords': ['fall', 'drop', 'bearish', 'decline', 'down', 'crash', 'weak', 'sell', 'pessimistic', 'loss'],
            'market_keywords': ['nifty', 'sensex', 'banknifty', 'market', 'stock', 'equity', 'trading', 'index']
        }
        self.load_sentiment_history()
        logger.info("Real-time Market Sentiment Analyzer initialized")
    
    def load_sentiment_history(self):
        try:
            if os.path.exists('sentiment_history.pkl'):
                with open('sentiment_history.pkl', 'rb') as f:
                    self.sentiment_history = pickle.load(f)
                logger.info("Loaded sentiment history")
        except Exception as e:
            logger.warning(f"Could not load sentiment history: {e}")
    
    def save_sentiment_history(self):
        try:
            with open('sentiment_history.pkl', 'wb') as f:
                pickle.dump(self.sentiment_history, f)
        except Exception as e:
            logger.error(f"Could not save sentiment history: {e}")
    
    def simple_sentiment_analysis(self, text):
        if not text:
            return 0.0
        text = text.lower()
        positive_score = sum(text.count(k) for k in self.sentiment_weights['positive_keywords'])
        negative_score = sum(text.count(k) for k in self.sentiment_weights['negative_keywords'])
        market_relevance = sum(1 for k in self.sentiment_weights['market_keywords'] if k in text)
        if market_relevance == 0:
            return 0.0
        total_words = len(text.split())
        if total_words == 0:
            return 0.0
        pos_norm = positive_score / total_words
        neg_norm = negative_score / total_words
        sentiment_score = (pos_norm - neg_norm) * market_relevance
        return max(-1.0, min(1.0, sentiment_score))
    
    def get_indian_market_news(self):
        try:
            queries = ['indian stock market', 'nifty sensex', 'banknifty trading', 'indian equity market', 'bse nse india']
            all_articles = []
            for query in queries:
                url = "https://newsapi.org/v2/everything"
                params = {
                    'q': query,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'from': (datetime.now() - timedelta(hours=6)).isoformat(),
                    'pageSize': 20,
                    'apiKey': self.news_api_key
                }
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    all_articles.extend(data.get('articles', []))
                else:
                    logger.warning(f"News API error for query '{query}': {response.status_code}")
            return all_articles
        except Exception as e:
            logger.error(f"Error fetching news: {e}")
            return []
    
    def get_business_headlines(self):
        try:
            url = "https://newsapi.org/v2/top-headlines"
            params = {
                'country': 'in',
                'category': 'business',
                'pageSize': 50,
                'apiKey': self.news_api_key
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json().get('articles', [])
            else:
                logger.warning(f"Headlines API error: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching headlines: {e}")
            return []
    
    def analyze_market_sentiment(self):
        try:
            market_news = self.get_indian_market_news()
            business_headlines = self.get_business_headlines()
            all_articles = market_news + business_headlines
            if not all_articles:
                logger.warning("No articles found, returning neutral sentiment")
                return self.get_neutral_sentiment()
            sentiment_scores = []
            relevant_articles = 0
            for article in all_articles:
                content = f"{article.get('title', '')} {article.get('description', '')}"
                if self.is_market_relevant(content):
                    score = self.simple_sentiment_analysis(content)
                    if abs(score) > 0.1:
                        sentiment_scores.append(score)
                        relevant_articles += 1
            if not sentiment_scores:
                return self.get_neutral_sentiment()
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            category = self.categorize_sentiment(avg_sentiment)
            fgi = self.calculate_fear_greed_index(avg_sentiment, relevant_articles)
            data = {
                'timestamp': datetime.now().isoformat(),
                'sentiment': category,
                'score': avg_sentiment,
                'fear_greed_index': fgi,
                'articles_analyzed': relevant_articles
            }
            self.sentiment_history.append(data)
            if len(self.sentiment_history) % 10 == 0:
                self.save_sentiment_history()
            return {
                'sentiment': category,
                'sentiment_score': round(avg_sentiment, 3),
                'fear_greed_index': fgi,
                'fear_greed_label': self.get_fear_greed_label(fgi),
                'articles_analyzed': relevant_articles,
                'confidence': min(relevant_articles / 10.0, 1.0),
                'timestamp': datetime.now().isoformat(),
                'trend': self.get_sentiment_trend()
            }
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return self.get_neutral_sentiment()
    
    def is_market_relevant(self, text):
        if not text:
            return False
        text = text.lower()
        mk = self.sentiment_weights['market_keywords']
        ind = ['india', 'indian', 'mumbai', 'delhi', 'rupee', 'rbi', 'sebi']
        return any(k in text for k in mk) or any(k in text for k in ind)
    
    def categorize_sentiment(self, score):
        return 'BULLISH' if score > 0.1 else 'BEARISH' if score < -0.1 else 'NEUTRAL'
    
    def calculate_fear_greed_index(self, score, count):
        base = 50 + (score * 30)
        volume_adj = min(count / 20.0, 1.0) * 10
        trend_adj = self.get_trend_adjustment()
        return max(0, min(100, int(base + volume_adj + trend_adj)))
    
    def get_fear_greed_label(self, index):
        if index >= 75: return 'EXTREME_GREED'
        elif index >= 55: return 'GREED'
        elif index >= 45: return 'NEUTRAL'
        elif index >= 25: return 'FEAR'
        return 'EXTREME_FEAR'
    
    def get_sentiment_trend(self):
        if len(self.sentiment_history) < 3:
            return 'INSUFFICIENT_DATA'
        scores = [x['score'] for x in list(self.sentiment_history)[-3:]]
        if scores[0] < scores[1] < scores[2]:
            return 'IMPROVING'
        elif scores[0] > scores[1] > scores[2]:
            return 'DETERIORATING'
        return 'STABLE'
    
    def get_trend_adjustment(self):
        trend = self.get_sentiment_trend()
        return 5 if trend == 'IMPROVING' else -5 if trend == 'DETERIORATING' else 0
    
    def get_neutral_sentiment(self):
        return {
            'sentiment': 'NEUTRAL',
            'sentiment_score': 0.0,
            'fear_greed_index': 50,
            'fear_greed_label': 'NEUTRAL',
            'articles_analyzed': 0,
            'confidence': 0.0,
            'timestamp': datetime.now().isoformat(),
            'trend': 'INSUFFICIENT_DATA'
        }

sentiment_analyzer = RealTimeMarketSentiment()

# ------------------- API ROUTES ------------------- #

@app.route('/')
def home():
    return jsonify({
        'message': '✅ Real-time Market Sentiment API is running!',
        'routes': {
            '/market-sentiment': 'GET - Analyze sentiment now',
            '/realtime-sentiment': 'GET - Latest auto-updated sentiment',
            '/sentiment-history': 'GET - Historical readings',
            '/health': 'GET - Health check',
            '/test-sentiment': 'POST - Test custom text'
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'sentiment_history_count': len(sentiment_analyzer.sentiment_history)
    })

@app.route('/market-sentiment')
def get_market_sentiment():
    try:
        sentiment = sentiment_analyzer.analyze_market_sentiment()
        return jsonify(sentiment)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/realtime-sentiment')
def get_realtime_sentiment():
    if latest_sentiment_data:
        return jsonify(latest_sentiment_data)
    return jsonify({'message': 'Initializing...', 'status': 'waiting'}), 202

@app.route('/sentiment-history')
def get_sentiment_history():
    return jsonify({
        'history': list(sentiment_analyzer.sentiment_history),
        'count': len(sentiment_analyzer.sentiment_history),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test-sentiment', methods=['POST'])
def test_sentiment():
    try:
        data = request.get_json()
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text missing'}), 400
        score = sentiment_analyzer.simple_sentiment_analysis(text)
        return jsonify({
            'text': text,
            'sentiment_score': round(score, 3),
            'category': sentiment_analyzer.categorize_sentiment(score),
            'market_relevant': sentiment_analyzer.is_market_relevant(text),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ------------------- BACKGROUND WORKER ------------------- #

def background_sentiment_updater(interval_seconds=300):
    global latest_sentiment_data
    while True:
        try:
            latest_sentiment_data = sentiment_analyzer.analyze_market_sentiment()
            logger.info(f"[Auto] Updated: {latest_sentiment_data['sentiment']} ({latest_sentiment_data['sentiment_score']})")
        except Exception as e:
            logger.error(f"[Auto] Error updating: {e}")
        time.sleep(interval_seconds)

if __name__ == '__main__':
    Thread(target=background_sentiment_updater, daemon=True).start()
    app.run(host='0.0.0.0', port=5001)
