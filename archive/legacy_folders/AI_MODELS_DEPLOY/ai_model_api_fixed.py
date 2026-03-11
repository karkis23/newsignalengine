from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import os
import logging
from collections import deque
import pickle

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProfessionalTradingAI:
    def __init__(self):
        self.model_data = {
            'signals': deque(maxlen=1000),  # Store last 1000 signals for learning
            'accuracy_tracker': {'correct': 0, 'total': 0},
            'pattern_weights': {
                'rsi_oversold': 0.8,
                'rsi_overbought': 0.8,
                'macd_bullish': 0.7,
                'macd_bearish': 0.7,
                'momentum_strong': 0.6,
                'volume_surge': 0.5,
                'sentiment_alignment': 0.4,
                'writers_support': 0.9,
                'candle_reversal': 0.3
            }
        }
        self.load_historical_data()
        logger.info("Professional Trading AI initialized")
    
    def load_historical_data(self):
        """Load any existing model data"""
        try:
            if os.path.exists('trading_ai_data.pkl'):
                with open('trading_ai_data.pkl', 'rb') as f:
                    saved_data = pickle.load(f)
                    self.model_data.update(saved_data)
                logger.info("Loaded historical trading data")
        except Exception as e:
            logger.warning(f"Could not load historical data: {e}")
    
    def save_model_data(self):
        """Save current model data"""
        try:
            with open('trading_ai_data.pkl', 'wb') as f:
                pickle.dump(self.model_data, f)
        except Exception as e:
            logger.error(f"Could not save model data: {e}")
    
    def analyze_rsi_signals(self, rsi):
        """Professional RSI analysis"""
        signals = []
        strength = 0
        
        if rsi < 30:
            signals.append("RSI_OVERSOLD")
            strength += self.model_data['pattern_weights']['rsi_oversold']
        elif rsi > 70:
            signals.append("RSI_OVERBOUGHT")
            strength += self.model_data['pattern_weights']['rsi_overbought']
        elif 45 <= rsi <= 55:
            signals.append("RSI_NEUTRAL")
            strength += 0.1
        
        return signals, strength
    
    def analyze_macd_signals(self, macd, signal_line=None):
        """Professional MACD analysis"""
        signals = []
        strength = 0
        
        if isinstance(macd, dict):
            macd_line = macd.get('macd', 0)
            signal_line = macd.get('signal', 0)
            histogram = macd.get('histogram', 0)
        else:
            macd_line = float(macd)
            histogram = 0
        
        if macd_line > 0 and histogram > 0:
            signals.append("MACD_BULLISH")
            strength += self.model_data['pattern_weights']['macd_bullish']
        elif macd_line < 0 and histogram < 0:
            signals.append("MACD_BEARISH")
            strength += self.model_data['pattern_weights']['macd_bearish']
        
        return signals, strength
    
    def analyze_momentum_signals(self, momentum):
        """Professional momentum analysis"""
        signals = []
        strength = 0
        
        if momentum > 2:
            signals.append("MOMENTUM_STRONG_BULLISH")
            strength += self.model_data['pattern_weights']['momentum_strong']
        elif momentum < -2:
            signals.append("MOMENTUM_STRONG_BEARISH")
            strength += self.model_data['pattern_weights']['momentum_strong']
        elif momentum > 0.5:
            signals.append("MOMENTUM_WEAK_BULLISH")
            strength += 0.3
        elif momentum < -0.5:
            signals.append("MOMENTUM_WEAK_BEARISH")
            strength += 0.3
        
        return signals, strength
    
    def analyze_volume_signals(self, volume_ratio):
        """Professional volume analysis"""
        signals = []
        strength = 0
        
        if volume_ratio > 1.5:
            signals.append("VOLUME_SURGE")
            strength += self.model_data['pattern_weights']['volume_surge']
        elif volume_ratio > 1.2:
            signals.append("VOLUME_ABOVE_AVERAGE")
            strength += 0.3
        elif volume_ratio < 0.8:
            signals.append("VOLUME_LOW")
            strength -= 0.2
        
        return signals, strength
    
    def analyze_sentiment_alignment(self, sentiment, writers_zone):
        """Analyze sentiment and writers zone alignment"""
        signals = []
        strength = 0
        
        # Sentiment analysis
        if sentiment == 'BULLISH':
            signals.append("SENTIMENT_BULLISH")
            strength += self.model_data['pattern_weights']['sentiment_alignment']
        elif sentiment == 'BEARISH':
            signals.append("SENTIMENT_BEARISH")
            strength += self.model_data['pattern_weights']['sentiment_alignment']
        
        # Writers zone analysis (most important)
        if writers_zone == 'BULLISH':
            signals.append("WRITERS_BULLISH_SUPPORT")
            strength += self.model_data['pattern_weights']['writers_support']
        elif writers_zone == 'BEARISH':
            signals.append("WRITERS_BEARISH_RESISTANCE")
            strength += self.model_data['pattern_weights']['writers_support']
        
        # Alignment bonus
        if (sentiment == 'BULLISH' and writers_zone == 'BULLISH') or \
           (sentiment == 'BEARISH' and writers_zone == 'BEARISH'):
            signals.append("SENTIMENT_WRITERS_ALIGNED")
            strength += 0.3
        
        return signals, strength
    
    def analyze_candle_patterns(self, candle_pattern):
        """Analyze candle patterns"""
        signals = []
        strength = 0
        
        reversal_patterns = ['DOJI', 'HAMMER', 'SHOOTING_STAR']
        continuation_patterns = ['MARUBOZU']
        
        if candle_pattern in reversal_patterns:
            signals.append(f"CANDLE_{candle_pattern}_REVERSAL")
            strength += self.model_data['pattern_weights']['candle_reversal']
        elif candle_pattern in continuation_patterns:
            signals.append(f"CANDLE_{candle_pattern}_CONTINUATION")
            strength += 0.2
        
        return signals, strength
    
    def calculate_vix_filter(self, vix):
        """VIX-based market condition analysis"""
        if vix > 25:
            return "HIGH_VOLATILITY", -0.5
        elif vix > 18:
            return "MEDIUM_VOLATILITY", -0.2
        elif vix < 12:
            return "LOW_VOLATILITY", 0.1
        else:
            return "NORMAL_VOLATILITY", 0.0
    
    def professional_signal_generation(self, data):
        """Generate professional trading signals"""
        try:
            # Extract data
            rsi = float(data.get('rsi', 50))
            macd = data.get('macd', 0)
            momentum = float(data.get('momentum', 0))
            volume_ratio = float(data.get('volumeRatio', 1))
            vix = float(data.get('vix', 15))
            sentiment = data.get('sentiment', 'NEUTRAL')
            writers_zone = data.get('writersZone', 'NEUTRAL')
            candle_pattern = data.get('candlePattern', 'NORMAL')
            
            # Analyze all components
            all_signals = []
            total_strength = 0
            
            # RSI Analysis
            rsi_signals, rsi_strength = self.analyze_rsi_signals(rsi)
            all_signals.extend(rsi_signals)
            total_strength += rsi_strength
            
            # MACD Analysis
            macd_signals, macd_strength = self.analyze_macd_signals(macd)
            all_signals.extend(macd_signals)
            total_strength += macd_strength
            
            # Momentum Analysis
            momentum_signals, momentum_strength = self.analyze_momentum_signals(momentum)
            all_signals.extend(momentum_signals)
            total_strength += momentum_strength
            
            # Volume Analysis
            volume_signals, volume_strength = self.analyze_volume_signals(volume_ratio)
            all_signals.extend(volume_signals)
            total_strength += volume_strength
            
            # Sentiment & Writers Zone Analysis
            sentiment_signals, sentiment_strength = self.analyze_sentiment_alignment(sentiment, writers_zone)
            all_signals.extend(sentiment_signals)
            total_strength += sentiment_strength
            
            # Candle Pattern Analysis
            candle_signals, candle_strength = self.analyze_candle_patterns(candle_pattern)
            all_signals.extend(candle_signals)
            total_strength += candle_strength
            
            # VIX Filter
            vix_condition, vix_adjustment = self.calculate_vix_filter(vix)
            total_strength += vix_adjustment
            
            # Professional Decision Making
            signal, confidence = self.make_professional_decision(
                all_signals, total_strength, rsi, momentum, sentiment, writers_zone, vix
            )
            
            # Store for learning
            signal_data = {
                'timestamp': datetime.now().isoformat(),
                'signal': signal,
                'confidence': confidence,
                'all_signals': all_signals,
                'strength': total_strength,
                'market_data': data
            }
            self.model_data['signals'].append(signal_data)
            
            # Save periodically
            if len(self.model_data['signals']) % 50 == 0:
                self.save_model_data()
            
            return {
                'signal': signal,
                'confidence': round(confidence, 3),
                'analysis': {
                    'detected_signals': all_signals,
                    'total_strength': round(total_strength, 2),
                    'vix_condition': vix_condition,
                    'market_regime': self.determine_market_regime(rsi, vix, sentiment)
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in signal generation: {e}")
            return {
                'signal': 'HOLD',
                'confidence': 0.0,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def make_professional_decision(self, signals, strength, rsi, momentum, sentiment, writers_zone, vix):
        """Make professional trading decision based on all factors"""
        
        # VIX Filter - No trading in high volatility
        if vix > 18:
            return 'HOLD', 0.0
        
        # Count bullish and bearish signals
        bullish_signals = [s for s in signals if any(word in s for word in 
                          ['BULLISH', 'OVERSOLD', 'SURGE', 'SUPPORT'])]
        bearish_signals = [s for s in signals if any(word in s for word in 
                          ['BEARISH', 'OVERBOUGHT', 'RESISTANCE'])]
        
        bullish_count = len(bullish_signals)
        bearish_count = len(bearish_signals)
        
        # Base confidence from signal strength
        base_confidence = min(abs(strength) / 3.0, 1.0)  # Normalize to 0-1
        
        # Professional decision logic
        if strength > 1.5 and bullish_count >= 3:
            # Strong bullish setup
            if writers_zone == 'BULLISH' and rsi < 60:
                return 'BUY_CE', min(base_confidence + 0.2, 0.95)
            elif sentiment == 'BULLISH' and momentum > 1:
                return 'BUY_CE', min(base_confidence + 0.1, 0.85)
            else:
                return 'BUY_CE', base_confidence
                
        elif strength < -1.5 and bearish_count >= 3:
            # Strong bearish setup
            if writers_zone == 'BEARISH' and rsi > 40:
                return 'BUY_PE', min(base_confidence + 0.2, 0.95)
            elif sentiment == 'BEARISH' and momentum < -1:
                return 'BUY_PE', min(base_confidence + 0.1, 0.85)
            else:
                return 'BUY_PE', base_confidence
                
        elif abs(strength) > 0.8:
            # Moderate signals
            if strength > 0 and bullish_count > bearish_count:
                return 'BUY_CE', max(base_confidence, 0.6)
            elif strength < 0 and bearish_count > bullish_count:
                return 'BUY_PE', max(base_confidence, 0.6)
        
        # Default to HOLD
        return 'HOLD', 0.0
    
    def determine_market_regime(self, rsi, vix, sentiment):
        """Determine current market regime"""
        if vix > 20:
            return "HIGH_VOLATILITY"
        elif vix < 12:
            return "LOW_VOLATILITY"
        elif sentiment == 'BULLISH' and rsi < 70:
            return "BULLISH_TREND"
        elif sentiment == 'BEARISH' and rsi > 30:
            return "BEARISH_TREND"
        else:
            return "SIDEWAYS_MARKET"
    
    def update_accuracy(self, predicted_signal, actual_outcome):
        """Update model accuracy based on actual outcomes"""
        self.model_data['accuracy_tracker']['total'] += 1
        if actual_outcome == 'correct':
            self.model_data['accuracy_tracker']['correct'] += 1
        
        # Adjust pattern weights based on performance
        accuracy = self.model_data['accuracy_tracker']['correct'] / self.model_data['accuracy_tracker']['total']
        if accuracy < 0.6:  # If accuracy drops below 60%, adjust weights
            self.adjust_pattern_weights()
    
    def adjust_pattern_weights(self):
        """Adjust pattern weights based on recent performance"""
        # Simple weight adjustment - can be enhanced
        for key in self.model_data['pattern_weights']:
            current_weight = self.model_data['pattern_weights'][key]
            # Slightly reduce weights if performance is poor
            self.model_data['pattern_weights'][key] = max(current_weight * 0.95, 0.1)

# Initialize the AI model
trading_ai = ProfessionalTradingAI()

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Generate professional trading signal
        result = trading_ai.professional_signal_generation(data)
        
        logger.info(f"Prediction: {result['signal']} with confidence {result['confidence']}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in predict endpoint: {e}")
        return jsonify({
            'signal': 'HOLD',
            'confidence': 0.0,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    accuracy = 0.0
    if trading_ai.model_data['accuracy_tracker']['total'] > 0:
        accuracy = trading_ai.model_data['accuracy_tracker']['correct'] / trading_ai.model_data['accuracy_tracker']['total']
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': True,
        'total_signals': len(trading_ai.model_data['signals']),
        'accuracy': round(accuracy, 3),
        'pattern_weights': trading_ai.model_data['pattern_weights']
    })

@app.route('/update_accuracy', methods=['POST'])
def update_accuracy():
    """Update model accuracy based on trade outcomes"""
    try:
        data = request.get_json()
        predicted_signal = data.get('predicted_signal')
        actual_outcome = data.get('actual_outcome')  # 'correct' or 'incorrect'
        
        trading_ai.update_accuracy(predicted_signal, actual_outcome)
        trading_ai.save_model_data()
        
        return jsonify({'message': 'Accuracy updated successfully'})
    
    except Exception as e:
        logger.error(f"Error updating accuracy: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_stats', methods=['GET'])
def get_stats():
    """Get model statistics"""
    try:
        accuracy = 0.0
        if trading_ai.model_data['accuracy_tracker']['total'] > 0:
            accuracy = trading_ai.model_data['accuracy_tracker']['correct'] / trading_ai.model_data['accuracy_tracker']['total']
        
        recent_signals = list(trading_ai.model_data['signals'])[-10:]  # Last 10 signals
        
        return jsonify({
            'total_predictions': trading_ai.model_data['accuracy_tracker']['total'],
            'correct_predictions': trading_ai.model_data['accuracy_tracker']['correct'],
            'accuracy': round(accuracy, 3),
            'recent_signals': recent_signals,
            'pattern_weights': trading_ai.model_data['pattern_weights']
        })
    
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)