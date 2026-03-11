from flask import Flask, request, jsonify
import requests
import json
from datetime import datetime, timedelta
import os
from textblob import TextBlob
import re

app = Flask(__name__)

class MarketSentimentAnalyzer:
    def __init__(self):
        self.news_api_key = os.environ.get('NEWS_API_KEY')
        self.twitter_bearer_token = os.environ.get('TWITTER_BEARER_TOKEN')
        
    def get_news_sentiment(self, symbols=['NIFTY', 'BANKNIFTY']):
        """Get sentiment from financial news"""
        try:
            sentiment_scores = []
            
            for symbol in symbols:
                url = f"https://newsapi.org/v2/everything"
                params = {
                    'q': f'{symbol} OR market OR trading OR stocks',
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'from': (datetime.now() - timedelta(hours=6)).isoformat(),
                    'pageSize': 20,
                    'apiKey': self.news_api_key
                }
                
                response = requests.get(url, params=params)
                if response.status_code == 200:
                    articles = response.json().get('articles', [])
                    
                    for article in articles:
                        title = article.get('title', '')
                        description = article.get('description', '')
                        text = f"{title} {description}"
                        
                        # Clean text
                        text = re.sub(r'[^a-zA-Z\s]', '', text)
                        
                        # Analyze sentiment
                        blob = TextBlob(text)
                        sentiment_scores.append(blob.sentiment.polarity)
            
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                
                if avg_sentiment > 0.1:
                    return 'BULLISH'
                elif avg_sentiment < -0.1:
                    return 'BEARISH'
                else:
                    return 'NEUTRAL'
            
            return 'NEUTRAL'
            
        except Exception as e:
            print(f"Error in news sentiment: {e}")
            return 'NEUTRAL'
    
    def get_twitter_sentiment(self, query='$NIFTY OR $BANKNIFTY'):
        """Get sentiment from Twitter (requires Twitter API v2)"""
        try:
            if not self.twitter_bearer_token:
                return 'NEUTRAL'
            
            url = "https://api.twitter.com/2/tweets/search/recent"
            headers = {
                'Authorization': f'Bearer {self.twitter_bearer_token}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'query': f'{query} lang:en',
                'max_results': 50,
                'tweet.fields': 'created_at,public_metrics'
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                tweets = data.get('data', [])
                
                sentiment_scores = []
                for tweet in tweets:
                    text = tweet.get('text', '')
                    # Clean text
                    text = re.sub(r'[^a-zA-Z\s]', '', text)
                    
                    # Analyze sentiment
                    blob = TextBlob(text)
                    sentiment_scores.append(blob.sentiment.polarity)
                
                if sentiment_scores:
                    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                    
                    if avg_sentiment > 0.1:
                        return 'BULLISH'
                    elif avg_sentiment < -0.1:
                        return 'BEARISH'
                    else:
                        return 'NEUTRAL'
            
            return 'NEUTRAL'
            
        except Exception as e:
            print(f"Error in Twitter sentiment: {e}")
            return 'NEUTRAL'
    
    def get_market_sentiment(self):
        """Combine news and social media sentiment"""
        try:
            news_sentiment = self.get_news_sentiment()
            twitter_sentiment = self.get_twitter_sentiment()
            
            # Simple voting system
            sentiments = [news_sentiment, twitter_sentiment]
            
            bullish_count = sentiments.count('BULLISH')
            bearish_count = sentiments.count('BEARISH')
            
            if bullish_count > bearish_count:
                return 'BULLISH'
            elif bearish_count > bullish_count:
                return 'BEARISH'
            else:
                return 'NEUTRAL'
                
        except Exception as e:
            print(f"Error in market sentiment: {e}")
            return 'NEUTRAL'
    
    def get_fear_greed_index(self):
        """Get Fear & Greed Index (alternative data source)"""
        try:
            # This is a placeholder - implement with actual F&G API
            # You can use CNN Fear & Greed Index or create your own
            return {
                'index': 50,
                'label': 'NEUTRAL',
                'description': 'Market is in neutral territory'
            }
        except Exception as e:
            print(f"Error in fear greed index: {e}")
            return {'index': 50, 'label': 'NEUTRAL'}

# Initialize analyzer
sentiment_analyzer = MarketSentimentAnalyzer()

@app.route('/market-sentiment', methods=['GET'])
def get_market_sentiment():
    """Main sentiment endpoint"""
    try:
        sentiment = sentiment_analyzer.get_market_sentiment()
        fear_greed = sentiment_analyzer.get_fear_greed_index()
        
        return jsonify({
            'sentiment': sentiment,
            'fear_greed_index': fear_greed['index'],
            'fear_greed_label': fear_greed['label'],
            'timestamp': datetime.now().isoformat(),
            'sources': ['news', 'twitter']
        })
    
    except Exception as e:
        return jsonify({
            'sentiment': 'NEUTRAL',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/news-sentiment', methods=['GET'])
def get_news_sentiment():
    """News sentiment only"""
    try:
        sentiment = sentiment_analyzer.get_news_sentiment()
        return jsonify({
            'sentiment': sentiment,
            'source': 'news',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/twitter-sentiment', methods=['GET'])
def get_twitter_sentiment():
    """Twitter sentiment only"""
    try:
        sentiment = sentiment_analyzer.get_twitter_sentiment()
        return jsonify({
            'sentiment': sentiment,
            'source': 'twitter',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'apis_configured': {
            'news_api': bool(sentiment_analyzer.news_api_key),
            'twitter_api': bool(sentiment_analyzer.twitter_bearer_token)
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)