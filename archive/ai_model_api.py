from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TradingAI:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'rsi', 'macd', 'momentum', 'volume_ratio', 'vix',
            'is_bullish_sentiment', 'is_bearish_sentiment',
            'is_bullish_writers', 'is_bearish_writers',
            'is_doji', 'is_hammer', 'is_shooting_star', 'is_marubozu'
        ]
        self.initialize_model()
    
    def initialize_model(self):
        """Initialize or load the trading model"""
        try:
            # Try to load existing model
            if os.path.exists('trading_model.pkl'):
                self.model = joblib.load('trading_model.pkl')
                self.scaler = joblib.load('scaler.pkl')
                logger.info("Loaded existing model")
            else:
                # Create new model with sample data
                self.create_initial_model()
                logger.info("Created new model")
        except Exception as e:
            logger.error(f"Error initializing model: {e}")
            self.create_initial_model()
    
    def create_initial_model(self):
        """Create initial model with sample training data"""
        # Sample training data (replace with historical data)
        sample_data = self.generate_sample_data()
        
        X = sample_data[self.feature_columns]
        y = sample_data['signal']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        # Save model
        joblib.dump(self.model, 'trading_model.pkl')
        joblib.dump(self.scaler, 'scaler.pkl')
    
    def generate_sample_data(self):
        """Generate sample training data"""
        np.random.seed(42)
        n_samples = 1000
        
        data = {
            'rsi': np.random.uniform(20, 80, n_samples),
            'macd': np.random.uniform(-2, 2, n_samples),
            'momentum': np.random.uniform(-5, 5, n_samples),
            'volume_ratio': np.random.uniform(0.5, 2.0, n_samples),
            'vix': np.random.uniform(10, 25, n_samples),
            'is_bullish_sentiment': np.random.choice([0, 1], n_samples),
            'is_bearish_sentiment': np.random.choice([0, 1], n_samples),
            'is_bullish_writers': np.random.choice([0, 1], n_samples),
            'is_bearish_writers': np.random.choice([0, 1], n_samples),
            'is_doji': np.random.choice([0, 1], n_samples),
            'is_hammer': np.random.choice([0, 1], n_samples),
            'is_shooting_star': np.random.choice([0, 1], n_samples),
            'is_marubozu': np.random.choice([0, 1], n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Create target based on rules
        conditions = [
            (df['rsi'] < 30) & (df['macd'] > 0) & (df['momentum'] > 0),
            (df['rsi'] > 70) & (df['macd'] < 0) & (df['momentum'] < 0),
        ]
        choices = ['BUY_CE', 'BUY_PE']
        df['signal'] = np.select(conditions, choices, default='HOLD')
        
        return df
    
    def preprocess_input(self, data):
        """Preprocess input data for prediction"""
        # Convert categorical variables to binary
        features = {
            'rsi': float(data.get('rsi', 50)),
            'macd': float(data.get('macd', 0)),
            'momentum': float(data.get('momentum', 0)),
            'volume_ratio': float(data.get('volumeRatio', 1)),
            'vix': float(data.get('vix', 15)),
            'is_bullish_sentiment': 1 if data.get('sentiment') == 'BULLISH' else 0,
            'is_bearish_sentiment': 1 if data.get('sentiment') == 'BEARISH' else 0,
            'is_bullish_writers': 1 if data.get('writersZone') == 'BULLISH' else 0,
            'is_bearish_writers': 1 if data.get('writersZone') == 'BEARISH' else 0,
            'is_doji': 1 if data.get('candlePattern') == 'DOJI' else 0,
            'is_hammer': 1 if data.get('candlePattern') == 'HAMMER' else 0,
            'is_shooting_star': 1 if data.get('candlePattern') == 'SHOOTING_STAR' else 0,
            'is_marubozu': 1 if data.get('candlePattern') == 'MARUBOZU' else 0
        }
        
        return np.array([list(features.values())])
    
    def predict_signal(self, data):
        """Predict trading signal"""
        try:
            # Preprocess input
            X = self.preprocess_input(data)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make prediction
            prediction = self.model.predict(X_scaled)[0]
            probabilities = self.model.predict_proba(X_scaled)[0]
            
            # Get confidence (max probability)
            confidence = float(np.max(probabilities))
            
            # Apply additional filters
            if data.get('vix', 0) > 18:
                prediction = 'HOLD'
                confidence = 0.0
            
            return {
                'signal': prediction,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            return {
                'signal': 'HOLD',
                'confidence': 0.0,
                'error': str(e)
            }

# Initialize AI model
trading_ai = TradingAI()

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Make prediction
        result = trading_ai.predict_signal(data)
        
        logger.info(f"Prediction: {result}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in predict endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': trading_ai.model is not None
    })

@app.route('/retrain', methods=['POST'])
def retrain():
    """Retrain model with new data"""
    try:
        data = request.get_json()
        
        if not data or 'training_data' not in data:
            return jsonify({'error': 'No training data provided'}), 400
        
        # Process training data
        df = pd.DataFrame(data['training_data'])
        
        # Retrain model
        X = df[trading_ai.feature_columns]
        y = df['signal']
        
        X_scaled = trading_ai.scaler.fit_transform(X)
        trading_ai.model.fit(X_scaled, y)
        
        # Save updated model
        joblib.dump(trading_ai.model, 'trading_model.pkl')
        joblib.dump(trading_ai.scaler, 'scaler.pkl')
        
        return jsonify({'message': 'Model retrained successfully'})
    
    except Exception as e:
        logger.error(f"Error in retrain endpoint: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)