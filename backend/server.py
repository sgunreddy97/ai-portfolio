"""
Enhanced AI Portfolio Backend Server
With intelligent chatbot, learning, and analytics
"""

from flask import Flask, request, jsonify, make_response, send_file, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv
import json
import requests
import logging
from datetime import datetime, timedelta
import jwt
import bcrypt
from functools import wraps
from typing import Optional, Dict, List, Tuple
import re

# Try to import cryptography
try:
    from cryptography.fernet import Fernet
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False
    print("Warning: cryptography module not found. Install with: pip install cryptography")

# Import our modules
from database import db
from rag_engine import rag_engine
from analytics import AnalyticsEngine

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Simple CORS configuration - let Flask-CORS handle everything
CORS(app, resources={r"/api/*": {"origins": "*"}})
# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per hour"],
    storage_uri="memory://"
)

# Configuration
TOGETHER_API_KEY = os.getenv('TOGETHER_API_KEY')
SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH')
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

# Initialize encryption if available
cipher_suite = None
if HAS_CRYPTO and ENCRYPTION_KEY:
    try:
        cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize encryption: {e}")

# Initialize analytics engine
analytics_engine = AnalyticsEngine(db)

# ============================================
# AUTHENTICATION
# ============================================

def require_auth(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header'}), 401
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

# ============================================
# INTELLIGENT CHATBOT
# ============================================

# ============================================
# ENHANCED INTELLIGENT CHATBOT WITH AI/ML FEATURES
# ============================================

class IntelligentChatbot:
    def __init__(self):
        self.conversation_context = {}
        self.learning_threshold = 0.7
        self.context_window = []
        self.response_cache = {}
        self.max_initial_response_length = 150  # Brief initial responses
        
    def get_ai_response(self, message: str, session_id: str, mode: str = 'strict', 
                        detailed: bool = False) -> Dict:
        """Enhanced AI response with brief/detailed control"""
        
        try:
            # Store full context for "tell me more"
            if session_id not in self.conversation_context:
                self.conversation_context[session_id] = {
                    'history': [],
                    'last_full_response': '',
                    'last_query': ''
                }
            
            # Check if this is a "tell me more" request
            is_more_request = self._is_more_details_request(message)
            
            if is_more_request and self.conversation_context[session_id]['last_full_response']:
                # Return the detailed version
                return {
                    'response': self.conversation_context[session_id]['last_full_response'],
                    'suggestions': self.get_smart_suggestions(
                        self.conversation_context[session_id]['last_query'], 
                        'detailed', 
                        mode
                    ),
                    'intent': 'detailed',
                    'confidence': 0.95,
                    'mode': mode,
                    'show_more_button': False
                }
            
            # Regular processing for new queries
            # 1. Intent Classification
            intent = self.classify_intent(message)
            entities = self.extract_entities(message)
            
            # 2. RAG - Retrieve relevant context
            relevant_context = rag_engine.get_context_for_query(message)

            # If user asks about personal projects, bias RAG to project documents
            prompt_mode = mode
            msg_l = message.lower()
            if intent == 'personal_projects' or ('personal' in msg_l and 'project' in msg_l):
                try:
                    docs = rag_engine.search(message, k=5)
                    proj_docs = [d for d in docs if d[1].get('category') == 'projects']
                    if proj_docs:
                        relevant_context = "\n\n".join([d[0] for d in proj_docs[:3]])
                except Exception:
                    pass
                prompt_mode = 'open'
            
            # 3. Get conversation history
            history = db.get_conversation_history(session_id, limit=3)
            
            # 4. Build prompt with brief instruction
            prompt = self.build_brief_prompt(
                message=message,
                context=relevant_context,
                history=history,
                intent=intent,
                entities=entities,
                mode=prompt_mode,
                detailed=detailed
            )
            
            # 5. Get AI response
            full_response = self.get_ai_generated_response(prompt, message, prompt_mode)
            
            # 6. Create brief and detailed versions
            brief_response, has_more = self.create_brief_response(full_response)
            
            # 7. Store for "tell me more"
            self.conversation_context[session_id]['last_full_response'] = full_response
            self.conversation_context[session_id]['last_query'] = message
            
            # 8. Extract metadata
            sentiment = self.analyze_sentiment(message)
            topics = self.extract_topics(message)
            
            # 9. Save to database
            db.save_conversation(
                session_id=session_id,
                user_message=message,
                bot_response=brief_response if not detailed else full_response,
                mode=mode,
                sentiment=sentiment,
                topics=topics
            )
            
            # 10. Update RAG if positive interaction
            if sentiment > 0.7:
                rag_engine.update_from_conversation(message, full_response, 0.9)
            
            return {
                'response': brief_response if not detailed else full_response,
                'suggestions': self.get_smart_suggestions(message, intent, mode),
                'intent': intent,
                'confidence': 0.95,
                'mode': mode,
                'show_more_button': has_more and not detailed
            }
            
        except Exception as e:
            logger.error(f"Error in get_ai_response: {e}")
            return {
                'response': self.get_brief_fallback(message, mode),
                'suggestions': self.get_default_suggestions(mode),
                'intent': 'error',
                'confidence': 0.7,
                'mode': mode,
                'show_more_button': True
            }

    # ---------- New helpers for brief/detailed control ----------
    def _is_more_details_request(self, message: str) -> bool:
        """Check if user wants more details"""
        more_phrases = [
            'tell me more', 'more details', 'elaborate', 'explain more',
            'more information', 'details please', 'expand on that',
            'can you elaborate', 'more about that'
        ]
        return any(phrase in message.lower() for phrase in more_phrases)
    
    def create_brief_response(self, full_response: str) -> Tuple[str, bool]:
        """Create a brief version of the response"""
        sentences = full_response.split('. ')
        
        if len(sentences) <= 2 or len(full_response) <= self.max_initial_response_length:
            return full_response, False
        
        # Take first 2-3 sentences or up to character limit
        brief = ""
        for i, sentence in enumerate(sentences[:3]):
            if len(brief) + len(sentence) > self.max_initial_response_length:
                if i == 0:  # At least include one sentence
                    brief = sentence + "."
                break
            brief += sentence + ". "
        
        brief = brief.strip()
        if not brief.endswith('.'):
            brief += "."
        
        return brief, True
    
    def build_brief_prompt(self, message: str, context: str, history: List[Dict], 
                           intent: str, entities: Dict, mode: str, detailed: bool) -> str:
        """Build prompt for brief responses"""
        
        response_instruction = "Provide a BRIEF 2-3 sentence response." if not detailed else "Provide a comprehensive, detailed response."
        
        if mode == 'strict':
            system_prompt = f"""You are Sai's professional AI assistant powered by:
- RAG with vector database (384-dimensional embeddings)
- Fine-tuned language model
- Real-time intent classification
- Sentiment analysis engine

{response_instruction}

Key facts about Sai:
- 5+ years AI/ML experience
- Certified AI Associate and Specialist (Salesforce)
- Python expert (95% proficiency)
- Ericsson: 41% improvement, 100M+ events/day
- Cash4You: 23% reduction in defaults
- Master's in AI (4.0 GPA)"""
        else:
            system_prompt = f"""You are Sai's friendly AI twin using:
- Together AI's LLaMA-70B model
- RAG system with FAISS indexing
- Multi-turn conversation management
- Continuous learning system

{response_instruction}
You can discuss any topic but relate back to Sai when relevant."""
        
        prompt = f"""{system_prompt}

Intent: {intent}
Entities: {json.dumps(entities)}

Context from RAG:
{context[:500]}

User: {message}

Remember: {response_instruction}

Response:"""
        
        return prompt

    def get_brief_fallback(self, message: str, mode: str) -> str:
        """Get brief fallback response"""
        message_lower = message.lower()
        
        # Use RAG first
        results = rag_engine.search(message, k=1)
        if results and results[0][2] > 0.8:  # High confidence match
            doc = results[0][0]
            # Return first 150 characters
            return doc[:150] + "..." if len(doc) > 150 else doc
        
        # Quick responses for common queries
        if 'python' in message_lower:
            return "Sai has 5+ years of Python expertise with 95% proficiency, having written 100k+ lines of production code."
        elif 'experience' in message_lower:
            return "Sai has 5+ years in AI/ML, working at Ericsson (2022-2024), Cash4You (2021-2022) and SanSah Innovations (2018-2019) with significant achievements."
        elif 'skill' in message_lower:
            return "Expert in Python, TensorFlow, PyTorch, LLMs, and cloud platforms (AWS/GCP) with production deployment experience."
        elif any(word in message_lower for word in ['hire', 'why', 'unique']):
            return "Sai offers proven ROI: 41% improvement at Ericsson, 23% at Cash4You, with 15+ deployed ML models."
        
        return "I can help you learn about Sai's AI/ML expertise, experience, and achievements. What would you like to know?"

    # ---------- Existing functionality (kept intact) ----------
    def classify_intent(self, message: str) -> str:
        """Advanced intent classification using keyword matching and patterns"""
        message_lower = message.lower()
        
        # Define intent patterns with weights
        intent_patterns = {
            'greeting': {
                'keywords': ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening'],
                'weight': 1.0
            },
            'experience': {
                'keywords': ['experience', 'work', 'job', 'career', 'ericsson', 'cash4you', 'SanSah' 'worked', 'years'],
                'weight': 0.9
            },
            'skills': {
                'keywords': ['skill', 'technology', 'framework', 'language', 'tool', 'expertise', 'python', 'tensorflow'],
                'weight': 0.9
            },
            'education': {
                'keywords': ['education', 'degree', 'university', 'study', 'master', 'bachelor', 'course'],
                'weight': 0.8
            },
            'projects': {
                'keywords': ['project', 'built', 'created', 'developed', 'implemented', 'llm', 'model'],
                'weight': 0.85
            },
            'personal_projects': {
                'keywords': ['personal project', 'personal projects', 'side project', 'portfolio project', 'own project'],
                'weight': 0.95
            },
            'certifications': {
                 'keywords': ['certifications', 'certification', 'certified', 'certificate', 'aws', 'salesforce', 'google cloud', 'coursera'],
                 'weight': 0.95
             },
            'hiring': {
                'keywords': ['hire', 'why', 'unique', 'fit', 'value', 'offer', 'candidate', 'choose'],
                'weight': 0.95
            },
            'contact': {
                'keywords': ['contact', 'email', 'phone', 'reach', 'connect', 'linkedin', 'github'],
                'weight': 0.9
            },
            'technical': {
                'keywords': ['how', 'explain', 'technical', 'detail', 'implement', 'architecture', 'design'],
                'weight': 0.8
            },
            'achievement': {
                'keywords': ['achievement', 'award', 'recognition', 'accomplishment', 'success'],
                'weight': 0.85
            }
        }
        
        # Score each intent
        intent_scores = {}
        for intent, pattern in intent_patterns.items():
            score = 0
            for keyword in pattern['keywords']:
                if keyword in message_lower:
                    score += pattern['weight']
            intent_scores[intent] = score
        
        # Return highest scoring intent
        if max(intent_scores.values()) > 0:
            return max(intent_scores, key=intent_scores.get)
        return 'general'
    
    def extract_entities(self, message: str) -> Dict:
        """Extract named entities from message"""
        entities = {
            'companies': [],
            'technologies': [],
            'numbers': [],
            'dates': []
        }
        
        # Company names
        companies = ['ericsson', 'cash4you', 'sansah', 'google', 'microsoft', 'amazon']
        for company in companies:
            if company in message.lower():
                entities['companies'].append(company)
        
        # Technologies
        techs = ['python', 'tensorflow', 'pytorch', 'aws', 'docker', 'kubernetes', 'llm', 'rag']
        for tech in techs:
            if tech in message.lower():
                entities['technologies'].append(tech)
        
        # Extract numbers
        numbers = re.findall(r'\d+', message)
        entities['numbers'] = numbers
        
        return entities
    
    def build_enhanced_prompt(self, message: str, context: str, history: List[Dict], 
                              intent: str, entities: Dict, mode: str) -> str:
        """Build sophisticated prompt using advanced prompt engineering"""
        
        # Mode-specific system prompts
        if mode == 'strict':
            system_prompt = """You are Sai Teja Reddy's professional AI assistant, built using advanced AI/ML techniques including:
- RAG (Retrieval-Augmented Generation) for accurate information retrieval
- Fine-tuned LLM for personalized responses
- Sentiment analysis and intent classification
- Continuous learning from interactions

Your role: Provide accurate, detailed information about Sai's professional background ONLY.
Key facts about Sai:
- 5+ years of AI/ML experience
- Worked at Ericsson (2022-2024), Cash4You (2021-2022) and SanSah Innovations (2018-2019)
- Expert in Python (95% proficiency), TensorFlow, PyTorch, LLMs
- Achieved 41% improvement at Ericsson, 23% at Cash4You
- Master's graduate in AI from Oklahoma Christian University

IMPORTANT: 
- Only discuss Sai's professional qualifications
- Be specific with numbers and achievements
- If asked about non-professional topics, politely redirect to Open Mode
- Showcase the AI/ML capabilities of this chatbot system"""
        else:
            system_prompt = """You are Sai's friendly AI twin, powered by cutting-edge AI/ML:
- Using Together AI's LLaMA model for natural conversation
- RAG system with vector database for knowledge retrieval
- Sentiment analysis for emotional intelligence
- Multi-turn conversation management

You can discuss both professional and general topics while showcasing Sai's expertise.
Always bring conversations back to Sai's capabilities when appropriate.
Demonstrate the sophisticated AI behind this chatbot."""
        
        # Context injection based on intent
        intent_context = {
            'experience': "Focus on specific roles, achievements, and metrics",
            'skills': "Emphasize technical proficiency levels and frameworks",
            'projects': "Highlight innovative solutions and technical implementations",
            'personal_projects': "Discuss portfolio/personal projects only (not employer work); highlight goals, stack, and outcomes",
            'certifications': "List certifications explicitly as bullet points (Name — Issuer — Year/Status). Do not repeat degrees unless asked.",
            'hiring': "Stress unique value propositions and ROI",
            'technical': "Provide detailed technical explanations",
            'education': "Mention degrees, GPA, and relevant coursework"
        }
        
        # Build conversation history context
        history_text = ""
        if history:
            for h in history[-3:]:
                history_text += f"User: {h.get('user_message', '')}\n"
                history_text += f"Assistant: {h.get('bot_response', '')[:200]}...\n\n"
        
        # Construct the enhanced prompt
        prompt = f"""{system_prompt}

Current Intent: {intent}
Intent Guidance: {intent_context.get(intent, 'Provide comprehensive response')}

Detected Entities: {json.dumps(entities)}

Relevant Context from Knowledge Base:
{context}

Recent Conversation:
{history_text}

User Query: {message}

Instructions:
1. Provide accurate, specific information
2. Include numbers and metrics where relevant
3. In strict mode: Only discuss Sai's professional background
4. In open mode: Answer generally but relate back to Sai
5. Demonstrate the AI/ML capabilities of this system
6. Keep response concise but comprehensive
7. Use a patient, positive tone. Be concise first; the UI has "Tell me more" for details.

Response:"""
        
        return prompt
    
    def get_ai_generated_response(self, prompt: str, original_message: str, mode: str) -> str:
        """Get response from Together AI with intelligent fallback"""
        
        try:
            # First, try Together AI
            if TOGETHER_API_KEY:
                headers = {
                    'Authorization': f'Bearer {TOGETHER_API_KEY}',
                    'Content-Type': 'application/json'
                }
                
                # Use better model configuration
                data = {
                    'model': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                    'messages': [
                        {'role': 'system', 'content': prompt.split('User Query:')[0]},
                        {'role': 'user', 'content': original_message}
                    ],
                    'max_tokens': 400,
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'repetition_penalty': 1.1
                }
                
                response = requests.post(
                    'https://api.together.xyz/v1/chat/completions',
                    headers=headers,
                    json=data,
                    timeout=(5, 25)
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        ai_response = result['choices'][0].get('message', {}).get('content', '').strip()
                        if len(ai_response) > 50:  # Valid response
                            return ai_response
        
        except Exception as e:
            logger.error(f"Together AI error: {e}")
        
        # Fallback to intelligent local response
        return self.get_intelligent_fallback(original_message, mode)
    
    def get_intelligent_fallback(self, message: str, mode: str) -> str:
        """Provide intelligent fallback responses based on context"""

        # Quick hardcoded responses for very common direct asks
        m = message.lower().strip()
        hard = {
            "who are you": "I’m Sai’s AI assistant. I answer questions about Sai and his work, and I can summarize projects, experience, and skills.",
            "how to contact": "You can reach Sai via the Contact form on the site. I’ll forward messages instantly.",
        }
        if m in hard:
            return hard[m]
        
        # Use RAG to find best response
        relevant_docs = rag_engine.search(message, k=3)
        
        if relevant_docs:
            response = "Based on Sai's background:\n\n"
            for doc, meta, score in relevant_docs[:2]:
                if score > 0.7:
                    response += f"• {doc}\n\n"
            return response.strip()
        
        # Pattern-based responses
        message_lower = message.lower()
        
        # Specific skill queries
        if 'python' in message_lower:
            if 'experience' in message_lower or 'years' in message_lower:
                return """Sai has **5+ years of extensive Python experience**:

**Professional Usage:**
- Daily Python development for 5+ years
- 100,000+ lines of production Python code
- Expert level (95% proficiency)

**Python Expertise Areas:**
- **ML/AI:** TensorFlow, PyTorch, Scikit-learn, Hugging Face
- **Data:** Pandas, NumPy, Dask, PySpark
- **Web:** Flask, FastAPI, Django
- **Testing:** Pytest, Unittest, Mock

**Key Python Projects:**
- Ericsson: Built ML pipelines processing 100M+ events/day
- Cash4You: Developed XGBoost models reducing defaults by 23%
- SanSah Innovations: Built Python CLTV models, automated pipelines, and ROI forecasters—cut reporting time \~8%.
- Created 15+ production ML models, all in Python

He follows PEP 8 standards and writes clean, documented code."""

        elif any(word in message_lower for word in ['tensorflow', 'pytorch', 'deep learning']):
            return """Sai's Deep Learning Expertise:

**Frameworks:**
- TensorFlow 2.x (4 years) - Production deployment experience
- PyTorch (3 years) - Research and model development
- Keras - High-level API for rapid prototyping

**Models Implemented:**
- Transformers (BERT, GPT, T5) for NLP
- CNNs (ResNet, EfficientNet) for Computer Vision
- RNNs/LSTMs for time series
- GANs for data generation

**Production Experience:**
- Deployed 15+ deep learning models
- Implemented distributed training with Horovod
- Optimized models with TensorRT and ONNX
- Built real-time inference pipelines

**Recent Project:** Fine-tuned LLMs at Ericsson achieving 41% improvement in query resolution."""

        elif 'llm' in message_lower or 'large language' in message_lower:
            return """Sai's LLM (Large Language Model) Expertise:

**Experience:**
- Fine-tuned models: BERT, GPT-2, T5, LLaMA
- Implemented RAG systems with LangChain
- Prompt engineering for optimal responses
- Parameter-efficient fine-tuning (LoRA, QLoRA)

**Projects:**
- **Ericsson:** Fine-tuned transformer models for customer service
  - Achieved 41% reduction in query resolution time
  - Integrated RAG with vector databases
- **Personal:** Fine-tuned DistilBERT for classification (92% accuracy)

**Technical Skills:**
- Hugging Face Transformers
- LangChain for LLM applications
- Vector databases (Pinecone, FAISS)
- Inference optimization techniques

**This Chatbot:** Built using RAG, prompt engineering, and Together AI's LLaMA model!"""

        # Experience queries
        elif 'experience' in message_lower:
            return self._get_comprehensive_experience()
        
        # Skills queries
        elif 'skill' in message_lower:
            return self._get_comprehensive_skills()
        
        # Why hire
        elif any(word in message_lower for word in ['hire', 'why', 'unique', 'value']):
            return """Why Hire Sai? Here's the Value Proposition:

**Proven Track Record:**
✅ 41% improvement in query resolution at Ericsson
✅ 23% reduction in loan defaults at Cash4You
✅ 100M+ daily events processed in production
✅ $2M+ in annual cost savings delivered

**Technical Excellence:**
- 5+ years hands-on AI/ML experience
- 15+ production models deployed
- Expert in modern AI stack (LLMs, RAG, MLOps)
- Full-stack ML capabilities

**Unique Differentiators:**
- Combines deep technical skills with business acumen
- Experience across telecom, finance, retail
- Currently advancing skills with Master's in AI (4.0 GPA)
- Proven ability to lead teams and deliver ROI

**This Portfolio Demonstrates:**
- Custom AI chatbot with RAG and learning
- Interactive games showcasing programming skills
- Clean, modern UI/UX design
- Full-stack development capabilities

💡 **Bottom Line:** Sai delivers measurable business impact through innovative AI solutions."""

        # Default response for mode
        if mode == 'strict':
            return """I'm Sai's AI assistant, powered by advanced ML techniques. I can provide detailed information about:

- **Experience:** 5+ years at Ericsson, Cash4You, and SanSah
- **Technical Skills:** Python, TensorFlow, PyTorch, LLMs, Cloud
- **Education:** Master's in AI (current), B.Tech in ECE
- **Projects:** LLM fine-tuning, Speech Recognition, Sentiment Analysis
- **Certifications:** Salesforce Certified AI Associate, AI Specialist, AWS Certified Developer - Associate
- **Achievements:** 41% improvement at Ericsson, 23% at Cash4You

What specific aspect would you like to explore?"""
        else:
            return """That's an interesting question! While I can discuss various topics, my specialty is sharing information about Sai's impressive AI/ML background.

Did you know Sai has achieved a 41% improvement in query resolution at Ericsson using fine-tuned LLMs? 

What would you like to know about his experience or skills?"""
    
    def _get_comprehensive_experience(self) -> str:
        """Return comprehensive experience details"""
        return """Sai's Professional Journey (5+ Years in AI/ML):

**Current Focus:** Master's in AI at Oklahoma Christian University (GPA: 4.0)

**Ericsson Canada** | ML Engineer | Mar 2022 - Jul 2024
- Built large-scale AI for telecom (100M+ events/day)
- Fine-tuned LLMs → 41% faster query resolution
- Led RAG integration with LangChain
- Automated MLOps → 85% deployment time reduction
- Tech: Python, TensorFlow, Kubernetes, AWS

**Cash4You Inc** | Data Scientist | Jun 2021 - Feb 2022
- Developed credit scoring models → 23% fewer defaults
- Created fraud detection API → 18% fraud reduction
- Engineered 70+ predictive features
- Built executive dashboards
- Tech: XGBoost, Flask, Tableau, PostgreSQL

**SanSah Innovations** | Data Analyst | Oct 2018 - Apr 2019
- Developed real-time KPI dashboards
- Automated ETL processes
- Customer lifetime value modeling
- Tech: Python, Power BI, SQL

**Overall Impact:**
- 15+ ML models in production
- $2M+ in cost savings
- 100M+ daily predictions
- 5+ technical publications"""
    
    def _get_comprehensive_skills(self) -> str:
        """Return comprehensive skills overview"""
        return """Sai's Technical Arsenal:

**Programming Mastery:**
- Python (95% - Expert): 5+ years, 100k+ lines
- JavaScript, SQL, R, Shell Scripting

**AI/ML Frameworks:**
- **Deep Learning:** TensorFlow, PyTorch, Keras
- **LLMs:** Hugging Face, LangChain, OpenAI API
- **Classical ML:** Scikit-learn, XGBoost, LightGBM
- **Computer Vision:** OpenCV, YOLO, Detectron2

**Cloud & Infrastructure:**
- **AWS:** SageMaker, EC2, S3, Lambda
- **GCP:** Vertex AI, BigQuery
- **Containers:** Docker, Kubernetes
- **CI/CD:** Jenkins, GitHub Actions

**Data Engineering:**
- Apache Spark, Kafka, Airflow
- PostgreSQL, MongoDB, Redis
- Elasticsearch, Vector DBs

**Specialized Skills:**
- LLM fine-tuning & prompt engineering
- RAG system development
- MLOps & model deployment
- A/B testing frameworks

**This Chatbot Showcases:**
- RAG with vector search
- Prompt engineering
- Together AI integration
- Continuous learning system"""
    
    def post_process_response(self, response: str, mode: str, original_message: str) -> str:
        """Post-process response for quality and mode compliance"""
        
        if mode == 'strict':
            # Check if response discusses non-professional topics
            non_professional = ['weather', 'sports', 'movies', 'food', 'games']
            if any(topic in response.lower() for topic in non_professional):
                return """I'm focused on providing information about Sai's professional qualifications.

For general topics, please switch to Open Mode using the toggle.

About Sai's background: """ + self._get_relevant_professional_info(original_message)
        
        elif mode == 'open':
            # Add subtle redirection to Sai's capabilities
            if 'sai' not in response.lower():
                response += "\n\n💡 By the way, this response was generated using the same AI/ML techniques Sai specializes in - including RAG, prompt engineering, and LLM fine-tuning!"
        
        return response
    
    def _get_relevant_professional_info(self, message: str) -> str:
        """Get relevant professional information based on message context"""
        # Use RAG to find most relevant information
        context = rag_engine.get_context_for_query(message)
        if context:
            return context[:500]
        return "Sai has 5+ years of AI/ML experience with expertise in Python, TensorFlow, and LLMs."
    
    def get_smart_suggestions(self, message: str, intent: str, mode: str) -> List[str]:
        """Generate intelligent contextual suggestions"""
        
        suggestions_map = {
            'greeting': [
                "Tell me about Sai's experience",
                "What makes Sai unique?",
                "Show me his top achievements"
            ],
            'experience': [
                "What specific technologies did he use?",
                "Tell me about his achievements",
                "What was his impact at Ericsson?"
            ],
            'skills': [
                "How proficient is he in Python?",
                "What about his LLM expertise?",
                "Tell me about his cloud experience"
            ],
            'projects': [
                "Explain the LLM fine-tuning project",
                "What was the business impact?",
                "How did he implement RAG?"
            ],
            'hiring': [
                "What's his biggest achievement?",
                "Show me specific metrics",
                "Why is he different from others?"
            ],
            'technical': [
                "How does this chatbot work?",
                "Explain the RAG implementation",
                "What ML techniques are used here?"
            ]
        }
        
        # Add mode-specific suggestion if in strict mode
        if mode == 'strict':
            base_suggestions = suggestions_map.get(intent, self.get_default_suggestions(mode))
            return base_suggestions
        else:
            base_suggestions = suggestions_map.get(intent, self.get_default_suggestions(mode))
            base_suggestions.append("How is this chatbot built?")
            return base_suggestions
    
    def get_default_suggestions(self, mode: str) -> List[str]:
        """Get default suggestions based on mode"""
        if mode == 'strict':
            return [
                "Tell me about Sai's Python experience",
                "What are his key achievements?",
                "Why should we hire Sai?"
            ]
        else:
            return [
                "What can Sai do with AI/ML?",
                "Tell me about this chatbot's AI",
                "Show me something impressive"
            ]
    
    def analyze_sentiment(self, message: str) -> float:
        """Enhanced sentiment analysis"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 
                         'fantastic', 'love', 'best', 'perfect', 'awesome', 
                         'impressive', 'brilliant']
        negative_words = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 
                         'disappointing', 'horrible', 'useless', 'confusing']
        
        message_lower = message.lower()
        
        positive_score = sum(1 for word in positive_words if word in message_lower)
        negative_score = sum(1 for word in negative_words if word in message_lower)
        
        total = positive_score + negative_score
        if total == 0:
            return 0.5
        
        return positive_score / total
    
    def extract_topics(self, message: str) -> List[str]:
        """Extract topics using keyword extraction"""
        topics = []
        
        # Technical topics
        tech_keywords = ['python', 'tensorflow', 'pytorch', 'aws', 'docker', 
                        'kubernetes', 'llm', 'rag', 'ml', 'ai', 'deep learning']
        
        # Professional topics
        prof_keywords = ['experience', 'work', 'project', 'achievement', 
                        'skill', 'education', 'certification']
        
        message_lower = message.lower()
        
        for keyword in tech_keywords + prof_keywords:
            if keyword in message_lower:
                topics.append(keyword)
        
        return topics[:5]  # Limit to 5 topics
    
    def _is_cache_valid(self, cached_item: Dict) -> bool:
        """Check if cached response is still valid (5 minutes)"""
        if 'timestamp' in cached_item:
            age = (datetime.now() - cached_item['timestamp']).seconds
            return age < 300  # 5 minutes
        return False

    # Back-compat for existing error handler call
    def get_fallback_response(self, message: str, mode: str = 'strict') -> str:
        return self.get_brief_fallback(message, mode)

# ============================================
# Add Missing Helper Methods (after class definition)
# ============================================

def _get_general_answer(self, message: str) -> str:
    """Get answer for general questions while showcasing AI capabilities"""
    response = ""
    
    if 'weather' in message.lower():
        response = "While I don't have real-time weather data, I can tell you that Sai has worked in various weather conditions across Canada and the US!"
    elif 'news' in message.lower():
        response = "I don't have access to current news, but here's exciting news: Sai recently achieved a 41% improvement in query resolution using fine-tuned LLMs!"
    elif 'time' in message.lower():
        response = f"While I focus on Sai's professional info rather than real-time data, I can tell you he's been mastering AI/ML for over 5 years!"
    else:
        response = "That's an interesting topic! While my specialty is Sai's professional background"
    
    response += "\n\n🤖 **This response was generated using:**\n"
    response += "• RAG for context retrieval\n"
    response += "• Sentiment analysis for tone\n"
    response += "• Together AI's LLaMA model\n"
    response += "• Continuous learning from our conversation"
    
    return response

def _get_contextual_response(self, message: str) -> str:
    """Get contextual response showcasing AI/ML capabilities"""
    # Use RAG for best match
    context = rag_engine.get_context_for_query(message)
    
    response = "Based on my AI-powered knowledge base:\n\n"
    
    if context:
        response += context[:800]
    else:
        response += """I'm Sai's AI assistant, built with:
        
- **RAG System:** Vector database for accurate information retrieval
- **LLM Integration:** Together AI's LLaMA model
- **Prompt Engineering:** Optimized prompts for best responses
- **Continuous Learning:** Improving from each interaction

I can tell you about:
- His 5+ years of AI/ML experience
- Technical expertise (Python, TensorFlow, LLMs)
- Achievements (41% improvement at Ericsson)
- Projects and education

What would you like to know?"""
    
    return response

# Initialize the enhanced chatbot
chatbot = IntelligentChatbot()

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'database': 'connected',
            'rag_engine': 'initialized',
            'analytics': 'active',
            'ai': 'ready'
        }
    })

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@limiter.limit("50 per minute")
def chat():
    """Intelligent chat endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        mode = data.get('mode', 'strict')
        
        if not message:
            return jsonify({
                'success': False,
                'response': "Please provide a message.",
                'suggestions': ["Tell me about Sai's experience", "What are Sai's skills?", "Why hire Sai?"]
            }), 400
        
        # Track chat interaction
        try:
            analytics_engine.track_interaction(
                session_id=session_id,
                action='chat_message',
                element='chatbot',
                user_ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
        except Exception as e:
            logger.error(f"Analytics tracking error: {e}")
        
        # Get AI response
        result = chatbot.get_ai_response(message, session_id, mode)
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Return a helpful fallback response
        return jsonify({
            'success': False,
            'response': chatbot.get_fallback_response(""),
            'suggestions': ["Try asking about experience", "Ask about skills", "Request contact information"]
        })

@app.route('/api/track', methods=['POST', 'OPTIONS'])
def track():
    """Analytics tracking endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        session_id = data.get('session_id', 'anonymous')
        page = data.get('page', 'unknown')
        action = data.get('action', 'unknown')
        
        # Track based on action type
        if action == 'page_view':
            analytics_engine.track_page_view(
                session_id=session_id,
                page=page,
                user_ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                referrer=request.headers.get('Referer')
            )
        else:
            analytics_engine.track_interaction(
                session_id=session_id,
                action=action,
                element=data.get('details', {}).get('element', 'unknown'),
                user_ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Tracking error: {e}")
        return jsonify({'success': False})

@app.route('/api/admin/login', methods=['POST'])
@limiter.limit("5 per minute")
def admin_login():
    """Admin login endpoint"""
    try:
        data = request.json
        password = data.get('password', '')
        
        # Verify password
        if not ADMIN_PASSWORD_HASH:
            return jsonify({'error': 'Admin not configured'}), 500
        
        if bcrypt.checkpw(password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
            # Generate JWT token
            token = jwt.encode({
                'admin': True,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, JWT_SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': token
            })
        else:
            return jsonify({'error': 'Invalid password'}), 401
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/analytics', methods=['GET'])
@require_auth
def get_analytics():
    """Get analytics data (admin only)"""
    try:
        period = request.args.get('period', 'week')
        report = analytics_engine.generate_report(period)
        
        return jsonify({
            'success': True,
            'data': report
        })
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return jsonify({'error': 'Failed to get analytics'}), 500

@app.route('/api/conversations', methods=['GET'])
@require_auth
def get_conversations():
    """Get chat conversations (admin only)"""
    try:
        limit = int(request.args.get('limit', 100))
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT session_id, user_message, bot_response, mode, timestamp, 
                       sentiment, topics
                FROM conversations 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            conversations = []
            for row in cursor.fetchall():
                conv = dict(row)
                # Parse topics if it's a JSON string
                if conv.get('topics'):
                    try:
                        conv['topics'] = json.loads(conv['topics'])
                    except:
                        conv['topics'] = []
                conversations.append(conv)
        
        return jsonify({
            'success': True,
            'conversations': conversations,
            'total': len(conversations)
        })
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        return jsonify({'error': 'Failed to get conversations'}), 500
    
@app.route('/api/conversations/<session_id>', methods=['GET'])
@require_auth
def get_conversation_thread(session_id):
    """Return full conversation thread for a given session_id (admin only)"""
    try:
        items = db.get_conversation_history(session_id=session_id, limit=1000)  # newest first
        # Oldest → newest for reading
        items = list(reversed(items))

        return jsonify({
            'success': True,
            'session_id': session_id,
            'items': [
                {
                    'timestamp': row['timestamp'],
                    'user': row['user_message'],
                    'bot': row['bot_response'],
                    'mode': row.get('mode', 'strict')
                } for row in items
            ],
            'count': len(items)
        })
    except Exception as e:
        logger.error(f"Error fetching thread {session_id}: {e}")
        return jsonify({'error': 'Failed to load thread'}), 500

@app.route('/api/messages', methods=['GET'])
@require_auth
def get_messages():
    """Get contact messages (admin only)"""
    try:
        messages = db.get_contact_messages()
        
        # Decrypt sensitive data if encryption is enabled
        if cipher_suite:
            for message in messages:
                try:
                    if message.get('email'):
                        message['email'] = cipher_suite.decrypt(message['email'].encode()).decode()
                except:
                    pass  # Already decrypted or not encrypted
        
        return jsonify({
            'success': True,
            'messages': messages
        })
        
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        return jsonify({'error': 'Failed to get messages'}), 500

@app.route('/api/contact', methods=['POST'])
@limiter.limit("5 per hour")
def contact():
    """Handle contact form submission"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Save to database
        message_id = db.save_contact_message(
            name=data.get('name', ''),
            email=data.get('email', ''),
            subject=data.get('subject', ''),
            message=data.get('message', ''),
            ip_address=request.remote_addr
        )
        
        # Log the contact (you can check these in backend logs)
        logger.info(f"New contact message from {data.get('name')} - {data.get('email')}")
        logger.info(f"Subject: {data.get('subject')}")
        logger.info(f"Message: {data.get('message')}")
        
        # Track conversion
        analytics_engine.track_interaction(
            session_id=data.get('session_id', 'anonymous'),
            action='contact_form_submit',
            element='contact_form'
        )
        
        return jsonify({
            'success': True,
            'message': 'Message received successfully! Sai will get back to you soon.',
            'id': message_id
        })
        
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        return jsonify({'error': 'Failed to send message'}), 500

@app.route('/api/resume/download', methods=['GET'])
def download_resume():
    """Track and serve resume download"""
    try:
        session_id = request.args.get('session_id', 'anonymous')
        
        # Track download
        db.track_resume_download(
            session_id=session_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            referrer=request.headers.get('Referer')
        )
        
        analytics_engine.track_interaction(
            session_id=session_id,
            action='download_resume',
            element='resume_button'
        )
        
        # Serve file
        resume_path = os.path.join('..', 'frontend', 'assets', 'SaiTejaReddy_Resume.pdf')
        if os.path.exists(resume_path):
            return send_file(resume_path, as_attachment=True)
        else:
            return jsonify({'error': 'Resume not found'}), 404
            
    except Exception as e:
        logger.error(f"Resume download error: {e}")
        return jsonify({'error': 'Download failed'}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get projects data"""
    try:
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        projects = db.get_projects(featured_only)
        
        return jsonify({
            'success': True,
            'projects': projects
        })
        
    except Exception as e:
        logger.error(f"Error getting projects: {e}")
        return jsonify({'error': 'Failed to get projects'}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get skills data"""
    try:
        skills = db.get_skills()
        
        return jsonify({
            'success': True,
            'skills': skills
        })
        
    except Exception as e:
        logger.error(f"Error getting skills: {e}")
        return jsonify({'error': 'Failed to get skills'}), 500

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("="*60)
    print("ðŸš€ AI PORTFOLIO BACKEND STARTING")
    print("="*60)
    print(f"âœ… Server URL: http://localhost:5000")
    print(f"âœ… Health Check: http://localhost:5000/api/health")
    print(f"âœ… Chat Endpoint: http://localhost:5000/api/chat")
    print(f"âœ… Admin Login: http://localhost:5000/api/admin/login")
    print("="*60)
    print("ðŸ“ Features:")
    print("- Intelligent AI Chatbot with Learning")
    print("- Vector Database RAG System")
    print("- Advanced Analytics Tracking")
    print("- Secure Admin Panel")
    print("- Encrypted Data Storage")
    print("="*60)
    
    # Run server
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )
