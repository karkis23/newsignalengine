from flask import Flask, request, jsonify
import json
import os
import logging
from datetime import datetime
from collections import deque

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
                # Technical Indicators
                'rsi_neutral': 0.5,
                'rsi_oversold': 0.8,
                'rsi_overbought': 0.8,
                'ema_bearish': 0.7,
                'ema_bullish': 0.7,
                'sma_bearish': 0.7,
                'sma_bullish': 0.7,
                'macd_neutral': 0.4,
                'macd_bullish': 0.8,
                'macd_bearish': 0.8,
                'vix_calm': 0.9,
                'vix_high': -0.6,
                'bollinger_within': 0.3,
                'bollinger_oversold': 0.8,
                'bollinger_overbought': 0.8,
                'cci_sell': 0.8,
                'cci_buy': 0.8,
                'supertrend_bullish': 0.9,
                'supertrend_bearish': 0.9,
                'volume_weak': -0.4,
                'volume_strong': 0.6,
                'aroon_uptrend': 0.7,
                'aroon_downtrend': 0.7,
                'parabolic_bearish': 0.6,
                'parabolic_bullish': 0.6,
                'mfi_oversold': 0.8,
                'mfi_overbought': 0.8,
                'price_ranging': -0.3,
                'price_trending': 0.4,
                'volume_strength_weak': -0.4,
                'volume_strength_strong': 0.5,
                'atr_high': -0.2,
                'atr_low': 0.2,
                'adx_strong_trend': 0.6,
                'stochastic_oversold': 0.7,
                'stochastic_overbought': 0.7,
                
                # Writers Zone Analysis
                'writers_bullish': 0.9,
                'writers_bearish': 0.9,
                'writers_neutral': 0.0,
                'premium_ratio_call_heavy': 0.6,
                'premium_ratio_put_heavy': 0.6,
                'premium_ratio_balanced': 0.1,
                'high_ce_premium': 0.5,
                'high_pe_premium': 0.5,
                'strong_support': 0.4,
                'strong_resistance': 0.4,
                'market_structure_bullish': 0.3,
                'market_structure_bearish': 0.3
            }
        }
        logger.info("Professional Trading AI initialized")
    
    def analyze_technical_indicators(self, data):
        """Analyze comprehensive technical indicators"""
        signals = []
        strength = 0
        
        # RSI Analysis
        rsi_value = float(data.get('RSI', {}).get('rsi', 50))
        rsi_status = data.get('RSI', {}).get('status', 'Neutral')
        
        if rsi_value < 30:
            signals.append("RSI_OVERSOLD")
            strength += self.model_data['pattern_weights']['rsi_oversold']
        elif rsi_value > 70:
            signals.append("RSI_OVERBOUGHT")
            strength -= self.model_data['pattern_weights']['rsi_overbought']
        elif rsi_status == 'Neutral':
            signals.append("RSI_NEUTRAL")
            strength += self.model_data['pattern_weights']['rsi_neutral']
        
        # EMA Analysis
        ema_status = data.get('EMA20', {}).get('status', 'Neutral')
        if ema_status == 'Bearish':
            signals.append("EMA_BEARISH")
            strength -= self.model_data['pattern_weights']['ema_bearish']
        elif ema_status == 'Bullish':
            signals.append("EMA_BULLISH")
            strength += self.model_data['pattern_weights']['ema_bullish']
        
        # SMA Analysis
        sma_status = data.get('SMA50', {}).get('status', 'Neutral')
        if sma_status == 'Bearish':
            signals.append("SMA_BEARISH")
            strength -= self.model_data['pattern_weights']['sma_bearish']
        elif sma_status == 'Bullish':
            signals.append("SMA_BULLISH")
            strength += self.model_data['pattern_weights']['sma_bullish']
        
        # MACD Analysis
        macd_status = data.get('MACD', {}).get('status', 'Neutral')
        macd_histogram = float(data.get('MACD', {}).get('histogram', 0))
        
        if macd_status == 'Bullish':
            signals.append("MACD_BULLISH")
            strength += self.model_data['pattern_weights']['macd_bullish']
        elif macd_status == 'Bearish':
            signals.append("MACD_BEARISH")
            strength -= self.model_data['pattern_weights']['macd_bearish']
        else:
            signals.append("MACD_NEUTRAL")
            strength += self.model_data['pattern_weights']['macd_neutral']
        
        # VIX Analysis
        vix_value = float(data.get('VIX', {}).get('vix', 15))
        vix_status = data.get('VIX', {}).get('status', 'Normal')
        
        if vix_status == 'Calm Market':
            signals.append("VIX_CALM")
            strength += self.model_data['pattern_weights']['vix_calm']
        elif vix_value > 18:
            signals.append("VIX_HIGH")
            strength += self.model_data['pattern_weights']['vix_high']
        
        # Bollinger Bands Analysis
        bb_status = data.get('BollingerBands', {}).get('status', 'Within Bands')
        if bb_status == 'Within Bands':
            signals.append("BOLLINGER_WITHIN")
            strength += self.model_data['pattern_weights']['bollinger_within']
        elif bb_status == 'Above Upper' or bb_status == 'Overbought':
            signals.append("BOLLINGER_OVERBOUGHT")
            strength -= self.model_data['pattern_weights']['bollinger_overbought']
        elif bb_status == 'Below Lower' or bb_status == 'Oversold':
            signals.append("BOLLINGER_OVERSOLD")
            strength += self.model_data['pattern_weights']['bollinger_oversold']
        
        # CCI Analysis
        cci_value = float(data.get('CCI', {}).get('value', 0))
        cci_status = data.get('CCI', {}).get('status', 'Neutral')
        
        if cci_status == 'Sell':
            signals.append("CCI_SELL")
            strength += self.model_data['pattern_weights']['cci_sell']
        elif cci_status == 'Buy':
            signals.append("CCI_BUY")
            strength += self.model_data['pattern_weights']['cci_buy']
        
        # SuperTrend Analysis
        supertrend_status = data.get('SuperTrend', {}).get('status', 'Neutral')
        if supertrend_status == 'Bullish':
            signals.append("SUPERTREND_BULLISH")
            strength += self.model_data['pattern_weights']['supertrend_bullish']
        elif supertrend_status == 'Bearish':
            signals.append("SUPERTREND_BEARISH")
            strength -= self.model_data['pattern_weights']['supertrend_bearish']
        
        # Volume Indicators Analysis
        volume_status = data.get('VolumeIndicators', {}).get('status', 'Normal')
        if volume_status == 'Weak':
            signals.append("VOLUME_WEAK")
            strength += self.model_data['pattern_weights']['volume_weak']
        elif volume_status == 'Strong':
            signals.append("VOLUME_STRONG")
            strength += self.model_data['pattern_weights']['volume_strong']
        
        # Volume Strength Analysis
        volume_strength = data.get('VolumeStrength', {}).get('type', 'Normal')
        if volume_strength == 'Weak Volume':
            signals.append("VOLUME_STRENGTH_WEAK")
            strength += self.model_data['pattern_weights']['volume_strength_weak']
        elif volume_strength == 'Strong Volume':
            signals.append("VOLUME_STRENGTH_STRONG")
            strength += self.model_data['pattern_weights']['volume_strength_strong']
        
        # Aroon Analysis
        aroon_status = data.get('Aroon', {}).get('status', 'Neutral')
        if aroon_status == 'Uptrend':
            signals.append("AROON_UPTREND")
            strength += self.model_data['pattern_weights']['aroon_uptrend']
        elif aroon_status == 'Downtrend':
            signals.append("AROON_DOWNTREND")
            strength -= self.model_data['pattern_weights']['aroon_downtrend']
        
        # Parabolic SAR Analysis
        psar_status = data.get('ParabolicSAR', {}).get('status', 'Neutral')
        if psar_status == 'Bearish':
            signals.append("PARABOLIC_BEARISH")
            strength -= self.model_data['pattern_weights']['parabolic_bearish']
        elif psar_status == 'Bullish':
            signals.append("PARABOLIC_BULLISH")
            strength += self.model_data['pattern_weights']['parabolic_bullish']
        
        # MFI Analysis
        mfi_value = float(data.get('MFI', {}).get('value', 50))
        mfi_status = data.get('MFI', {}).get('status', 'Neutral')
        
        if mfi_status == 'Oversold':
            signals.append("MFI_OVERSOLD")
            strength += self.model_data['pattern_weights']['mfi_oversold']
        elif mfi_status == 'Overbought':
            signals.append("MFI_OVERBOUGHT")
            strength -= self.model_data['pattern_weights']['mfi_overbought']
        
        # Price Action Analysis
        price_action = data.get('PriceAction', {}).get('type', 'Normal')
        if price_action == 'Ranging':
            signals.append("PRICE_RANGING")
            strength += self.model_data['pattern_weights']['price_ranging']
        elif price_action == 'Trending':
            signals.append("PRICE_TRENDING")
            strength += self.model_data['pattern_weights']['price_trending']
        
        # ATR Analysis
        atr_value = float(data.get('ATR', {}).get('value', 20))
        if atr_value > 25:
            signals.append("ATR_HIGH")
            strength += self.model_data['pattern_weights']['atr_high']
        elif atr_value < 15:
            signals.append("ATR_LOW")
            strength += self.model_data['pattern_weights']['atr_low']
        
        # ADX Analysis
        adx_value = float(data.get('ADX', {}).get('value', 20))
        if adx_value > 25:
            signals.append("ADX_STRONG_TREND")
            strength += self.model_data['pattern_weights']['adx_strong_trend']
        
        # Stochastic Analysis
        stoch_value = float(data.get('Stochastic', {}).get('value', 50))
        stoch_status = data.get('Stochastic', {}).get('status', 'Neutral')
        if stoch_value < 20:
            signals.append("STOCHASTIC_OVERSOLD")
            strength += self.model_data['pattern_weights']['stochastic_oversold']
        elif stoch_value > 80:
            signals.append("STOCHASTIC_OVERBOUGHT")
            strength -= self.model_data['pattern_weights']['stochastic_overbought']
        
        return signals, strength
    
    def analyze_writers_zone(self, writers_data):
        """Analyze Writers Zone Analysis data"""
        signals = []
        strength = 0
        
        # Extract writers zone data
        writers_zone = writers_data.get('writersZone', 'NEUTRAL')
        writers_confidence = float(writers_data.get('confidence', 0))
        put_call_ratio = float(writers_data.get('putCallPremiumRatio', 1))
        market_structure = writers_data.get('marketStructure', 'BALANCED')
        max_ce_ltp = float(writers_data.get('maxCELTP', 0))
        max_pe_ltp = float(writers_data.get('maxPELTP', 0))
        support_levels = writers_data.get('supportLevels', [])
        resistance_levels = writers_data.get('resistanceLevels', [])
        
        # Writers Zone Direction Analysis
        if writers_zone == 'BULLISH' and writers_confidence > 0.3:
            signals.append("WRITERS_BULLISH")
            strength += self.model_data['pattern_weights']['writers_bullish'] * writers_confidence
        elif writers_zone == 'BEARISH' and writers_confidence > 0.3:
            signals.append("WRITERS_BEARISH")
            strength -= self.model_data['pattern_weights']['writers_bearish'] * writers_confidence
        else:
            signals.append("WRITERS_NEUTRAL")
            strength += self.model_data['pattern_weights']['writers_neutral']
        
        # Put-Call Premium Ratio Analysis
        if put_call_ratio > 1.2:
            signals.append("PREMIUM_RATIO_PUT_HEAVY")
            strength -= self.model_data['pattern_weights']['premium_ratio_put_heavy']
        elif put_call_ratio < 0.8:
            signals.append("PREMIUM_RATIO_CALL_HEAVY")
            strength += self.model_data['pattern_weights']['premium_ratio_call_heavy']
        else:
            signals.append("PREMIUM_RATIO_BALANCED")
            strength += self.model_data['pattern_weights']['premium_ratio_balanced']
        
        # Market Structure Analysis
        if market_structure == 'CALL_PREMIUM_HIGH':
            signals.append("MARKET_STRUCTURE_BULLISH")
            strength += self.model_data['pattern_weights']['market_structure_bullish']
        elif market_structure == 'PUT_PREMIUM_HIGH':
            signals.append("MARKET_STRUCTURE_BEARISH")
            strength -= self.model_data['pattern_weights']['market_structure_bearish']
        
        # Premium Analysis
        if max_ce_ltp > max_pe_ltp and max_ce_ltp > 10:
            signals.append("HIGH_CE_PREMIUM")
            strength += self.model_data['pattern_weights']['high_ce_premium']
        elif max_pe_ltp > max_ce_ltp and max_pe_ltp > 10:
            signals.append("HIGH_PE_PREMIUM")
            strength -= self.model_data['pattern_weights']['high_pe_premium']
        
        # Support and Resistance Analysis
        if len(support_levels) >= 2:
            signals.append("STRONG_SUPPORT")
            strength += self.model_data['pattern_weights']['strong_support']
        
        if len(resistance_levels) >= 2:
            signals.append("STRONG_RESISTANCE")
            strength -= self.model_data['pattern_weights']['strong_resistance']
        
        return signals, strength
    
    def professional_signal_generation(self, request_data):
        """Generate professional trading signals with both technical and writers zone data"""
        try:
            # Handle both single object and array formats
            if isinstance(request_data, list) and len(request_data) > 0:
                technical_data = request_data[0]
            else:
                technical_data = request_data
            
            # Check if writers zone data is provided separately or within technical data
            writers_data = request_data.get('writersZone', {}) if isinstance(request_data, dict) else {}
            
            # If writers zone data is in a separate object, extract it
            if 'writersZone' in technical_data:
                writers_data = technical_data
            
            # Extract key values for validation
            ltp = float(technical_data.get('LTP', 0))
            vix_value = float(technical_data.get('VIX', {}).get('vix', 15))
            rsi_value = float(technical_data.get('RSI', {}).get('rsi', 50))
            
            # Analyze all components
            all_signals = []
            total_strength = 0
            
            # Technical Indicators Analysis
            tech_signals, tech_strength = self.analyze_technical_indicators(technical_data)
            all_signals.extend(tech_signals)
            total_strength += tech_strength
            
            # Writers Zone Analysis (if data available)
            if writers_data and 'writersZone' in writers_data:
                writers_signals, writers_strength = self.analyze_writers_zone(writers_data)
                all_signals.extend(writers_signals)
                total_strength += writers_strength
            
            # VIX Filter and Market Regime
            vix_condition = self.determine_vix_condition(vix_value)
            
            # Professional Decision Making
            signal, confidence = self.make_professional_decision(
                all_signals, total_strength, technical_data, writers_data
            )
            
            # Store for learning
            signal_data = {
                'timestamp': datetime.now().isoformat(),
                'signal': signal,
                'confidence': confidence,
                'all_signals': all_signals,
                'strength': total_strength,
                'technical_data': technical_data,
                'writers_data': writers_data
            }
            self.model_data['signals'].append(signal_data)
            
            return {
                'signal': signal,
                'confidence': round(confidence, 3),
                'analysis': {
                    'detected_signals': all_signals,
                    'total_strength': round(total_strength, 2),
                    'vix_condition': vix_condition,
                    'market_regime': self.determine_market_regime(technical_data, writers_data),
                    'ltp': ltp,
                    'signal_count': len(all_signals),
                    'writers_zone': writers_data.get('writersZone', 'UNKNOWN'),
                    'writers_confidence': writers_data.get('confidence', 0)
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
    
    def determine_vix_condition(self, vix):
        """Determine VIX condition"""
        if vix > 25:
            return "EXTREME_VOLATILITY"
        elif vix > 18:
            return "HIGH_VOLATILITY"
        elif vix < 12:
            return "LOW_VOLATILITY"
        else:
            return "NORMAL_VOLATILITY"
    
    def make_professional_decision(self, signals, strength, technical_data, writers_data):
        """Make professional trading decision based on all factors"""
        
        # Extract key values
        vix_value = float(technical_data.get('VIX', {}).get('vix', 15))
        rsi_value = float(technical_data.get('RSI', {}).get('rsi', 50))
        supertrend_status = technical_data.get('SuperTrend', {}).get('status', 'Neutral')
        aroon_status = technical_data.get('Aroon', {}).get('status', 'Neutral')
        writers_zone = writers_data.get('writersZone', 'NEUTRAL')
        writers_confidence = float(writers_data.get('confidence', 0))
        
        # VIX Filter - No trading in high volatility
        if vix_value > 18:
            return 'HOLD', 0.0
        
        # Count bullish and bearish signals
        bullish_signals = [s for s in signals if any(word in s for word in 
                          ['BULLISH', 'OVERSOLD', 'BUY', 'UPTREND', 'STRONG', 'ABOVE', 'CALM'])]
        bearish_signals = [s for s in signals if any(word in s for word in 
                          ['BEARISH', 'OVERBOUGHT', 'SELL', 'DOWNTREND', 'WEAK', 'BELOW', 'HIGH'])]
        
        bullish_count = len(bullish_signals)
        bearish_count = len(bearish_signals)
        
        # Base confidence from signal strength
        base_confidence = min(abs(strength) / 4.0, 1.0)  # Normalize to 0-1
        
        # Writers Zone Boost
        writers_boost = 0
        if writers_zone == 'BULLISH' and writers_confidence > 0.5:
            writers_boost = 0.2
        elif writers_zone == 'BEARISH' and writers_confidence > 0.5:
            writers_boost = 0.2
        
        # Professional decision logic
        if strength > 2.0 and bullish_count >= 4:
            # Very strong bullish setup
            if supertrend_status == 'Bullish' and rsi_value < 60 and writers_zone == 'BULLISH':
                return 'BUY_CE', min(base_confidence + writers_boost + 0.2, 0.95)
            elif aroon_status == 'Uptrend' and rsi_value < 65:
                return 'BUY_CE', min(base_confidence + writers_boost + 0.1, 0.85)
            else:
                return 'BUY_CE', min(base_confidence + writers_boost, 0.8)
                
        elif strength < -2.0 and bearish_count >= 4:
            # Very strong bearish setup
            if supertrend_status == 'Bearish' and rsi_value > 40 and writers_zone == 'BEARISH':
                return 'BUY_PE', min(base_confidence + writers_boost + 0.2, 0.95)
            elif aroon_status == 'Downtrend' and rsi_value > 35:
                return 'BUY_PE', min(base_confidence + writers_boost + 0.1, 0.85)
            else:
                return 'BUY_PE', min(base_confidence + writers_boost, 0.8)
                
        elif abs(strength) > 1.5:
            # Moderate signals with writers zone confirmation
            if strength > 0 and bullish_count > bearish_count:
                confidence = max(base_confidence + writers_boost, 0.65)
                return 'BUY_CE', confidence if confidence >= 0.75 else 0.0
            elif strength < 0 and bearish_count > bullish_count:
                confidence = max(base_confidence + writers_boost, 0.65)
                return 'BUY_PE', confidence if confidence >= 0.75 else 0.0
        
        # Default to HOLD if insufficient conviction
        return 'HOLD', 0.0
    
    def determine_market_regime(self, technical_data, writers_data):
        """Determine current market regime"""
        vix_value = float(technical_data.get('VIX', {}).get('vix', 15))
        rsi_value = float(technical_data.get('RSI', {}).get('rsi', 50))
        supertrend_status = technical_data.get('SuperTrend', {}).get('status', 'Neutral')
        price_action = technical_data.get('PriceAction', {}).get('type', 'Normal')
        writers_zone = writers_data.get('writersZone', 'NEUTRAL')
        
        if vix_value > 20:
            return "HIGH_VOLATILITY"
        elif vix_value < 12:
            return "LOW_VOLATILITY"
        elif supertrend_status == 'Bullish' and rsi_value < 70 and writers_zone == 'BULLISH':
            return "STRONG_BULLISH_TREND"
        elif supertrend_status == 'Bearish' and rsi_value > 30 and writers_zone == 'BEARISH':
            return "STRONG_BEARISH_TREND"
        elif supertrend_status == 'Bullish' and rsi_value < 70:
            return "BULLISH_TREND"
        elif supertrend_status == 'Bearish' and rsi_value > 30:
            return "BEARISH_TREND"
        elif price_action == 'Ranging':
            return "SIDEWAYS_RANGING"
        else:
            return "SIDEWAYS_MARKET"

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
        
        trading_ai.model_data['accuracy_tracker']['total'] += 1
        if actual_outcome == 'correct':
            trading_ai.model_data['accuracy_tracker']['correct'] += 1
        
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