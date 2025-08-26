"""
RAG (Retrieval Augmented Generation) Engine
Uses vector database for intelligent context retrieval
"""

import numpy as np
import json
import os
import pickle
from typing import List, Dict, Tuple, Optional
from sentence_transformers import SentenceTransformer
import faiss
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, vector_db_path: str = "vectors.db"):
        self.vector_db_path = vector_db_path
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384  # Dimension of all-MiniLM-L6-v2
        self.index = None
        self.documents = []
        self.metadata = []
        
        # Initialize or load vector database
        self.initialize_vector_db()
        
    def initialize_vector_db(self):
        """Initialize or load existing vector database"""
        index_path = f"{self.vector_db_path}.index"
        docs_path = f"{self.vector_db_path}.docs"
        meta_path = f"{self.vector_db_path}.meta"
        
        if os.path.exists(index_path) and os.path.exists(docs_path):
            # Load existing index
            self.index = faiss.read_index(index_path)
            with open(docs_path, 'rb') as f:
                self.documents = pickle.load(f)
            with open(meta_path, 'rb') as f:
                self.metadata = pickle.load(f)
            logger.info(f"Loaded vector database with {len(self.documents)} documents")
        else:
            # Create new index
            self.index = faiss.IndexFlatL2(self.dimension)
            self.populate_knowledge_base()
            self.save_vector_db()
    
    def populate_knowledge_base(self):
        """Populate vector database with Sai's information"""
        
        knowledge_base = [
            # Personal Information
            {
                "content": "Sai Teja Reddy is an AI/ML Engineer with 5+ years of experience in developing and deploying machine learning solutions. Currently pursuing Master's in AI at Oklahoma Christian University.",
                "category": "personal",
                "keywords": ["introduction", "who", "about"],
                "importance": 1.0
            },
            {
                "content": "Contact: Email: saitejareddyg97@gmail.com, Phone: +1 (248) 803-3210, Location: Edmond, Oklahoma, USA. LinkedIn: linkedin.com/in/sai-teja-reddy-b5846322b, GitHub: github.com/sgunreddy97",
                "category": "contact",
                "keywords": ["contact", "email", "phone", "reach"],
                "importance": 1.0
            },
            
            # Experience - Ericsson
            {
                "content": "At Ericsson Canada (Mar 2022 - Jul 2024), worked as Machine Learning Engineer. Built large-scale AI applications for telecom networks processing 100M+ daily events. Fine-tuned transformer-based LLMs achieving 41% reduction in customer query resolution time.",
                "category": "experience",
                "keywords": ["ericsson", "experience", "ml engineer", "work"],
                "importance": 1.0
            },
            {
                "content": "Key achievements at Ericsson: Led integration of RAG (Retrieval-Augmented Generation) with LangChain into internal knowledge platform. Automated ML workflows using Apache Airflow, reduced model deployment time from 5 days to 6 hours.",
                "category": "experience",
                "keywords": ["ericsson", "achievements", "rag", "langchain", "airflow"],
                "importance": 0.9
            },
            {
                "content": "At Ericsson, implemented SHAP-based model explainability frameworks for regulatory compliance. Optimized inference pipelines using TensorRT and ONNX, achieving 3x speed improvement. Built distributed training infrastructure using Horovod.",
                "category": "experience",
                "keywords": ["ericsson", "shap", "tensorrt", "onnx", "distributed"],
                "importance": 0.8
            },
            
            # Experience - Cash4You
            {
                "content": "At Cash4You Inc. (Jun 2021 - Feb 2022), worked as Data Scientist. Developed predictive credit scoring models using XGBoost and LightGBM, reducing loan defaults by 23%. Created real-time fraud detection API reducing fraud by 18%.",
                "category": "experience",
                "keywords": ["cash4you", "data scientist", "credit", "fraud"],
                "importance": 0.9
            },
            {
                "content": "Cash4You achievements: Engineered 70+ features from transactional and behavioral datasets. Built dynamic Tableau dashboards for C-suite executives. Implemented A/B testing framework for loan approval strategies.",
                "category": "experience",
                "keywords": ["cash4you", "features", "tableau", "ab testing"],
                "importance": 0.8
            },
            
            # Experience - SanSah
            {
                "content": "At SanSah Innovations (Oct 2018 - Apr 2019), worked as Data Analyst. Developed Power BI dashboards for real-time KPI monitoring. Built customer lifetime value prediction models. Automated ETL processes using Python and SQL.",
                "category": "experience",
                "keywords": ["sansah", "data analyst", "power bi", "etl"],
                "importance": 0.7
            },
            
            # Technical Skills
            {
                "content": "Expert-level skills: Python (95% proficiency), TensorFlow, PyTorch, Hugging Face Transformers, LangChain, Scikit-learn. Extensive experience with LLMs, fine-tuning, and prompt engineering.",
                "category": "skills",
                "keywords": ["skills", "python", "tensorflow", "pytorch", "expert"],
                "importance": 1.0
            },
            {
                "content": "Cloud and MLOps expertise: AWS (SageMaker, EC2, S3, Lambda), GCP (Vertex AI, Cloud Run), Docker, Kubernetes, MLflow, Kubeflow, CI/CD pipelines with Jenkins and GitHub Actions.",
                "category": "skills",
                "keywords": ["cloud", "aws", "gcp", "docker", "mlops"],
                "importance": 0.9
            },
            {
                "content": "Big Data and Databases: Apache Spark, Hadoop, Kafka, Airflow, PostgreSQL, MongoDB, Elasticsearch, Redis. Experience with distributed computing and real-time data processing.",
                "category": "skills",
                "keywords": ["big data", "spark", "kafka", "database"],
                "importance": 0.8
            },
            {
                "content": "Specialized ML skills: NLP (BERT, GPT, T5), Computer Vision (YOLO, ResNet, Vision Transformers), Time Series (ARIMA, Prophet, LSTM), Reinforcement Learning (PPO, DQN, A3C).",
                "category": "skills",
                "keywords": ["nlp", "computer vision", "time series", "reinforcement learning"],
                "importance": 0.9
            },
            
            # Education
            {
                "content": "Education: Currently pursuing Master's in Computer Science with AI specialization at Oklahoma Christian University (2024-Present). GPA: 4.0/4.0. Relevant coursework: Advanced ML, Deep Learning, NLP, Computer Vision.",
                "category": "education",
                "keywords": ["education", "master", "degree", "university"],
                "importance": 1.0
            },
            {
                "content": "Previous education: PG Diploma in IT Business Analysis from Conestoga College, Canada (2020-2021). B.Tech in Electronics and Communication Engineering from JNTU Hyderabad (2014-2018).",
                "category": "education",
                "keywords": ["diploma", "bachelor", "conestoga", "jntu"],
                "importance": 0.8
            },
            
            # Certifications
            {
                "content": "Certifications: Salesforce AI Associate (2024), Salesforce AI Specialist (2024), AWS Certified Developer - Associate",
                "category": "certifications",
                "keywords": ["certification", "salesforce", "aws", "certified"],
                "importance": 0.9
            },
            
            # Projects
            {
                "content": "LLM Classification Fine-Tuning Project: Fine-tuned DistilBERT for binary classification of instruction prompts. Achieved 92% accuracy. Used Hugging Face Transformers, implemented custom data preprocessing pipeline, deployed on Hugging Face Spaces.",
                "category": "projects",
                "keywords": ["llm", "distilbert", "classification", "project"],
                "importance": 0.9
            },
            {
                "content": "Multilingual Speech Recognition System: Built end-to-end pipeline combining Thai ASR (Wav2Vec2) with neural machine translation (MarianMT). Achieved 85% accuracy on Thai to English translation. Real-time processing capability.",
                "category": "projects",
                "keywords": ["speech", "recognition", "wav2vec2", "translation"],
                "importance": 0.9
            },
            {
                "content": "Amazon Review Sentiment Analysis: Fine-tuned GPT-2 using LoRA (Low-Rank Adaptation) for parameter-efficient training. Reduced training time by 60% while maintaining 94% accuracy. Implemented custom tokenization for review-specific vocabulary.",
                "category": "projects",
                "keywords": ["sentiment", "gpt2", "lora", "amazon"],
                "importance": 0.9
            },
            {
                "content": "IoT Projects: Mobile Sniffer - RF detection device for restricted areas. Smart Trolley - RFID-based automated checkout system. Bus ID for Vision Impaired - Audio notification system using wireless communication.",
                "category": "projects",
                "keywords": ["iot", "mobile sniffer", "smart trolley", "bus id"],
                "importance": 0.7
            },
            
            # Achievements
            {
                "content": "Academic achievements: Consistently ranked in top 1% in national competitive exams (NTSE, Math Olympiad). Perfect mathematics scores throughout academic career. Won state-level science exhibition. Founded robotics club in college.",
                "category": "achievements",
                "keywords": ["achievements", "top 1%", "olympiad", "awards"],
                "importance": 0.8
            },
            {
                "content": "Professional achievements: Received internal spotlight award at Cash4You for fraud detection system. Led team of 5 engineers at Ericsson. Published 2 research papers on ML applications. Active Kaggle competitor (top 15%).",
                "category": "achievements",
                "keywords": ["awards", "leadership", "kaggle", "research"],
                "importance": 0.8
            },
            
            # Personal Interests
            {
                "content": "Personal interests: Passionate about space exploration and astronomy. Avid movie enthusiast, especially sci-fi and technology films. Enjoys camping and nature photography. Active in teaching and mentoring students.",
                "category": "personal",
                "keywords": ["interests", "hobbies", "space", "movies"],
                "importance": 0.6
            },
            {
                "content": "Life goals and values: Plans to adopt and educate 10 underprivileged children. Believes in using AI for social good. Committed to democratizing education through technology. Active in community service and village outreach programs.",
                "category": "personal",
                "keywords": ["goals", "values", "social", "education"],
                "importance": 0.7
            },
            
            # Why Hire
            {
                "content": "Why hire Sai: Proven track record with 41% improvement in metrics at Fortune 500 companies. Expert in modern AI/ML stack with production deployment experience. Strong business acumen - translates ML into ROI. Continuous learner currently pursuing Master's in AI.",
                "category": "hiring",
                "keywords": ["why hire", "unique", "value", "fit"],
                "importance": 1.0
            },
            {
                "content": "Unique value proposition: Combines deep technical expertise with business understanding. Experience across telecom, finance, and retail industries. Excellent communicator who can explain complex ML to stakeholders. Entrepreneurial mindset with corporate experience.",
                "category": "hiring",
                "keywords": ["value", "unique", "strengths", "advantages"],
                "importance": 0.9
            },
            
            # Technical Details
            {
                "content": "LLM expertise: Fine-tuned models including BERT, GPT-2, T5, and LLaMA. Experience with prompt engineering, few-shot learning, and chain-of-thought reasoning. Implemented RAG systems using LangChain and vector databases.",
                "category": "technical",
                "keywords": ["llm", "bert", "gpt", "prompt engineering"],
                "importance": 0.9
            },
            {
                "content": "Production ML experience: Deployed 15+ models serving millions of requests. Implemented A/B testing frameworks for model comparison. Built monitoring systems for model drift detection. Experience with edge deployment and model optimization.",
                "category": "technical",
                "keywords": ["production", "deployment", "monitoring", "optimization"],
                "importance": 0.9
            }
        ]
        
        # Process and add to vector database
        for idx, doc in enumerate(knowledge_base):
            # Create embedding
            embedding = self.model.encode(doc["content"])
            
            # Add to index
            self.index.add(np.array([embedding]))
            
            # Store document and metadata
            self.documents.append(doc["content"])
            self.metadata.append({
                "category": doc["category"],
                "keywords": doc["keywords"],
                "importance": doc["importance"],
                "index": idx
            })
        
        logger.info(f"Populated vector database with {len(knowledge_base)} documents")
    
    def save_vector_db(self):
        """Save vector database to disk"""
        index_path = f"{self.vector_db_path}.index"
        docs_path = f"{self.vector_db_path}.docs"
        meta_path = f"{self.vector_db_path}.meta"
        
        faiss.write_index(self.index, index_path)
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
        with open(meta_path, 'wb') as f:
            pickle.dump(self.metadata, f)
        
        logger.info("Saved vector database to disk")
    
    def search(self, query: str, k: int = 5, threshold: float = 0.7) -> List[Tuple[str, Dict, float]]:
        """
        Search for relevant documents
        Returns: List of (document, metadata, score) tuples
        """
        # Create query embedding
        query_embedding = self.model.encode(query)
        
        # Search in index
        distances, indices = self.index.search(np.array([query_embedding]), k)
        
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx >= 0:  # Valid index
                # Convert L2 distance to similarity score (0-1)
                similarity = 1 / (1 + distance)
                
                if similarity >= threshold:
                    results.append((
                        self.documents[idx],
                        self.metadata[idx],
                        similarity
                    ))
        
        # Sort by importance and similarity
        results.sort(key=lambda x: x[1]["importance"] * x[2], reverse=True)
        
        return results
    
    def add_document(self, content: str, category: str, keywords: List[str], importance: float = 0.5):
        """Add a new document to the vector database"""
        # Create embedding
        embedding = self.model.encode(content)
        
        # Add to index
        self.index.add(np.array([embedding]))
        
        # Store document and metadata
        self.documents.append(content)
        self.metadata.append({
            "category": category,
            "keywords": keywords,
            "importance": importance,
            "index": len(self.documents) - 1,
            "added_at": datetime.now().isoformat()
        })
        
        # Save to disk
        self.save_vector_db()
        
        logger.info(f"Added new document to vector database: {content[:50]}...")
    
    def get_context_for_query(self, query: str, max_context_length: int = 2000) -> str:
        """Get relevant context for a query"""
        results = self.search(query, k=5)
        
        if not results:
            return ""
        
        # Build context from search results
        context_parts = []
        total_length = 0
        
        for doc, meta, score in results:
            if total_length + len(doc) <= max_context_length:
                context_parts.append(f"[{meta['category'].upper()}] {doc}")
                total_length += len(doc)
            else:
                # Add partial document if space allows
                remaining = max_context_length - total_length
                if remaining > 100:  # Only add if meaningful amount
                    context_parts.append(f"[{meta['category'].upper()}] {doc[:remaining]}...")
                break
        
        return "\n\n".join(context_parts)
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text for better matching"""
        # Simple keyword extraction (can be enhanced with RAKE or TextRank)
        words = re.findall(r'\b[a-z]+\b', text.lower())
        
        # Filter common words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'could'}
        
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        
        # Get unique keywords
        return list(set(keywords))[:10]
    
    def update_from_conversation(self, query: str, response: str, effectiveness: float):
        """Learn from conversations to improve future responses"""
        if effectiveness > 0.7:  # Only learn from effective conversations
            # Extract keywords from query
            keywords = self.extract_keywords(query)
            
            # Determine category based on keywords
            category_keywords = {
                'experience': ['work', 'job', 'ericsson', 'cash4you', 'experience'],
                'skills': ['skill', 'technology', 'framework', 'language', 'tool'],
                'projects': ['project', 'built', 'developed', 'created'],
                'education': ['education', 'degree', 'university', 'study'],
                'personal': ['hobby', 'interest', 'personal', 'like']
            }
            
            category = 'general'
            for cat, cat_keywords in category_keywords.items():
                if any(kw in keywords for kw in cat_keywords):
                    category = cat
                    break
            
            # Add to vector database
            self.add_document(
                content=f"Q: {query}\nA: {response}",
                category=category,
                keywords=keywords,
                importance=effectiveness
            )

# Create global RAG engine instance
rag_engine = RAGEngine()