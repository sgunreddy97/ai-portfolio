"""
Database management for portfolio
Handles all data storage and retrieval
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class PortfolioDB:
    def __init__(self, db_path: str = "portfolio.db"):
        self.db_path = db_path
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def init_database(self):
        """Initialize all database tables"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Conversations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_message TEXT NOT NULL,
                    bot_response TEXT NOT NULL,
                    mode TEXT DEFAULT 'strict',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_ip TEXT,
                    user_agent TEXT,
                    sentiment REAL,
                    topics TEXT,
                    rating INTEGER,
                    feedback TEXT
                )
            ''')
            
            # Analytics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    page TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_ip TEXT,
                    user_agent TEXT,
                    referrer TEXT,
                    time_spent INTEGER,
                    clicks INTEGER,
                    scroll_depth REAL
                )
            ''')
            
            # Contact messages table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    status TEXT DEFAULT 'unread',
                    replied_at DATETIME,
                    notes TEXT
                )
            ''')
            
            # Resume downloads table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS resume_downloads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    referrer TEXT
                )
            ''')
            
            # Learning table (for AI improvement)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS learning_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern TEXT NOT NULL,
                    response TEXT NOT NULL,
                    effectiveness REAL,
                    usage_count INTEGER DEFAULT 0,
                    last_used DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    category TEXT,
                    keywords TEXT
                )
            ''')
            
            # Sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    pages_visited INTEGER DEFAULT 0,
                    total_time_spent INTEGER DEFAULT 0,
                    is_returning BOOLEAN DEFAULT FALSE,
                    country TEXT,
                    city TEXT,
                    device_type TEXT,
                    browser TEXT
                )
            ''')
            
            # Projects table (dynamic content)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    technologies TEXT NOT NULL,
                    impact TEXT,
                    github_url TEXT,
                    demo_url TEXT,
                    image_url TEXT,
                    category TEXT,
                    featured BOOLEAN DEFAULT FALSE,
                    order_index INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Skills table (dynamic content)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    name TEXT NOT NULL,
                    proficiency INTEGER,
                    years_experience REAL,
                    projects_count INTEGER,
                    last_used DATE,
                    certifications TEXT,
                    order_index INTEGER
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_session ON sessions(session_id)')
            
            conn.commit()
            
            # Insert default data if empty
            self._insert_default_data(conn)
    
    def _insert_default_data(self, conn):
        """Insert default portfolio data if tables are empty"""
        cursor = conn.cursor()
        
        # Check if projects table is empty
        cursor.execute('SELECT COUNT(*) FROM projects')
        if cursor.fetchone()[0] == 0:
            default_projects = [
                {
                    'title': 'LLM Classification Fine-Tuning',
                    'description': 'Fine-tuned DistilBERT for binary classification of instruction prompts',
                    'technologies': json.dumps(['Hugging Face', 'PyTorch', 'DistilBERT']),
                    'impact': 'Achieved 92% accuracy on classification tasks',
                    'category': 'NLP',
                    'featured': True,
                    'order_index': 1
                },
                {
                    'title': 'Speech Recognition System',
                    'description': 'Multilingual speech recognition pipeline with translation',
                    'technologies': json.dumps(['Wav2Vec2', 'MarianMT', 'Librosa']),
                    'impact': '85% accuracy on Thai to English translation',
                    'category': 'Speech',
                    'featured': True,
                    'order_index': 2
                },
                {
                    'title': 'Amazon Review Sentiment Analysis',
                    'description': 'GPT-2 fine-tuning with LoRA optimization',
                    'technologies': json.dumps(['GPT-2', 'LoRA', 'PEFT']),
                    'impact': '60% reduction in training time',
                    'category': 'NLP',
                    'featured': True,
                    'order_index': 3
                }
            ]
            
            for project in default_projects:
                cursor.execute('''
                    INSERT INTO projects (title, description, technologies, impact, category, featured, order_index)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (project['title'], project['description'], project['technologies'], 
                      project['impact'], project['category'], project['featured'], project['order_index']))
        
        # Check if skills table is empty
        cursor.execute('SELECT COUNT(*) FROM skills')
        if cursor.fetchone()[0] == 0:
            default_skills = [
                ('Programming', 'Python', 95, 5.0, 50, 1),
                ('Programming', 'JavaScript', 85, 3.0, 20, 2),
                ('ML/AI', 'TensorFlow', 90, 4.0, 30, 1),
                ('ML/AI', 'PyTorch', 90, 4.0, 25, 2),
                ('ML/AI', 'Hugging Face', 85, 2.0, 15, 3),
                ('Cloud', 'AWS', 85, 3.0, 20, 1),
                ('Cloud', 'Docker', 80, 3.0, 15, 2),
                ('Data', 'SQL', 90, 5.0, 40, 1),
                ('Data', 'Spark', 75, 2.0, 10, 2)
            ]
            
            for category, name, prof, years, projects, order in default_skills:
                cursor.execute('''
                    INSERT INTO skills (category, name, proficiency, years_experience, projects_count, order_index)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (category, name, prof, years, projects, order))
        
        conn.commit()
    
    # Conversation Management
    def save_conversation(self, session_id: str, user_message: str, bot_response: str, 
                         mode: str = 'strict', **kwargs) -> int:
        """Save a conversation exchange"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO conversations 
                (session_id, user_message, bot_response, mode, user_ip, user_agent, sentiment, topics)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id, user_message, bot_response, mode,
                kwargs.get('user_ip'), kwargs.get('user_agent'),
                kwargs.get('sentiment'), json.dumps(kwargs.get('topics', []))
            ))
            conn.commit()
            return cursor.lastrowid
    
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a session"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT user_message, bot_response, mode, timestamp
                FROM conversations
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (session_id, limit))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_learning_patterns(self, category: Optional[str] = None) -> List[Dict]:
        """Get effective response patterns for learning"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT pattern, response, effectiveness, keywords
                FROM learning_data
                WHERE effectiveness > 0.7
            '''
            
            if category:
                query += ' AND category = ?'
                cursor.execute(query + ' ORDER BY effectiveness DESC', (category,))
            else:
                cursor.execute(query + ' ORDER BY effectiveness DESC')
            
            return [dict(row) for row in cursor.fetchall()]
    
    def update_learning_data(self, pattern: str, response: str, effective: bool):
        """Update learning data based on conversation effectiveness"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if pattern exists
            cursor.execute('SELECT id, usage_count, effectiveness FROM learning_data WHERE pattern = ?', (pattern,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing pattern
                new_count = existing['usage_count'] + 1
                new_effectiveness = (existing['effectiveness'] * existing['usage_count'] + (1.0 if effective else 0.0)) / new_count
                
                cursor.execute('''
                    UPDATE learning_data 
                    SET usage_count = ?, effectiveness = ?, last_used = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (new_count, new_effectiveness, existing['id']))
            else:
                # Insert new pattern
                cursor.execute('''
                    INSERT INTO learning_data (pattern, response, effectiveness, usage_count)
                    VALUES (?, ?, ?, 1)
                ''', (pattern, response, 1.0 if effective else 0.0))
            
            conn.commit()
    
    # Analytics
    def track_event(self, session_id: str, page: str, action: str, details: Dict = None, **kwargs):
        """Track user analytics event"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO analytics 
                (session_id, page, action, details, user_ip, user_agent, referrer, time_spent, clicks, scroll_depth)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id, page, action, json.dumps(details) if details else None,
                kwargs.get('user_ip'), kwargs.get('user_agent'), kwargs.get('referrer'),
                kwargs.get('time_spent'), kwargs.get('clicks'), kwargs.get('scroll_depth')
            ))
            conn.commit()
    
    def get_analytics_summary(self, days: int = 30) -> Dict:
        """Get analytics summary for dashboard"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Total visitors
            cursor.execute('''
                SELECT COUNT(DISTINCT session_id) as total_visitors
                FROM analytics
                WHERE timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            total_visitors = cursor.fetchone()['total_visitors']
            
            # Page views
            cursor.execute('''
                SELECT COUNT(*) as total_views
                FROM analytics
                WHERE action = 'page_view' AND timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            total_views = cursor.fetchone()['total_views']
            
            # Total conversations
            cursor.execute('''
                SELECT COUNT(DISTINCT session_id) as total_conversations
                FROM conversations
                WHERE timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            total_conversations = cursor.fetchone()['total_conversations']
            
            # Average time spent
            cursor.execute('''
                SELECT AVG(time_spent) as avg_time
                FROM analytics
                WHERE time_spent IS NOT NULL AND timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            avg_time = cursor.fetchone()['avg_time'] or 0
            
            # Most viewed pages
            cursor.execute('''
                SELECT page, COUNT(*) as views
                FROM analytics
                WHERE action = 'page_view' AND timestamp > datetime('now', '-' || ? || ' days')
                GROUP BY page
                ORDER BY views DESC
                LIMIT 5
            ''', (days,))
            top_pages = [dict(row) for row in cursor.fetchall()]
            
            # Conversion metrics
            cursor.execute('''
                SELECT COUNT(*) as resume_downloads
                FROM resume_downloads
                WHERE timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            resume_downloads = cursor.fetchone()['resume_downloads']
            
            cursor.execute('''
                SELECT COUNT(*) as contact_messages
                FROM contact_messages
                WHERE timestamp > datetime('now', '-' || ? || ' days')
            ''', (days,))
            contact_messages = cursor.fetchone()['contact_messages']
            
            return {
                'total_visitors': total_visitors,
                'total_views': total_views,
                'total_conversations': total_conversations,
                'avg_time_spent': round(avg_time / 60, 1) if avg_time else 0,  # Convert to minutes
                'top_pages': top_pages,
                'resume_downloads': resume_downloads,
                'contact_messages': contact_messages,
                'conversion_rate': round((resume_downloads + contact_messages) / total_visitors * 100, 2) if total_visitors > 0 else 0
            }
    
    def get_detailed_analytics(self, days: int = 7) -> Dict:
        """Get detailed analytics for graphs"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Daily visitors
            cursor.execute('''
                SELECT DATE(timestamp) as date, COUNT(DISTINCT session_id) as visitors
                FROM analytics
                WHERE timestamp > datetime('now', '-' || ? || ' days')
                GROUP BY DATE(timestamp)
                ORDER BY date
            ''', (days,))
            daily_visitors = [dict(row) for row in cursor.fetchall()]
            
            # Hourly distribution
            cursor.execute('''
                SELECT strftime('%H', timestamp) as hour, COUNT(*) as events
                FROM analytics
                WHERE timestamp > datetime('now', '-' || ? || ' days')
                GROUP BY strftime('%H', timestamp)
                ORDER BY hour
            ''', (days,))
            hourly_distribution = [dict(row) for row in cursor.fetchall()]
            
            # Device types
            cursor.execute('''
                SELECT 
                    CASE 
                        WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
                        WHEN user_agent LIKE '%Tablet%' THEN 'Tablet'
                        ELSE 'Desktop'
                    END as device,
                    COUNT(*) as count
                FROM analytics
                WHERE timestamp > datetime('now', '-' || ? || ' days')
                GROUP BY device
            ''', (days,))
            device_types = [dict(row) for row in cursor.fetchall()]
            
            return {
                'daily_visitors': daily_visitors,
                'hourly_distribution': hourly_distribution,
                'device_types': device_types
            }
    
    # Session Management
    def create_or_update_session(self, session_id: str, **kwargs) -> int:
        """Create or update a session"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if session exists
            cursor.execute('SELECT id FROM sessions WHERE session_id = ?', (session_id,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing session
                cursor.execute('''
                    UPDATE sessions 
                    SET last_activity = CURRENT_TIMESTAMP, 
                        pages_visited = pages_visited + 1
                    WHERE session_id = ?
                ''', (session_id,))
                return existing['id']
            else:
                # Create new session
                cursor.execute('''
                    INSERT INTO sessions 
                    (session_id, ip_address, user_agent, device_type, browser)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    session_id, 
                    kwargs.get('ip_address'),
                    kwargs.get('user_agent'),
                    kwargs.get('device_type'),
                    kwargs.get('browser')
                ))
                conn.commit()
                return cursor.lastrowid
    
    # Contact Messages
    def save_contact_message(self, name: str, email: str, subject: str, message: str, **kwargs) -> int:
        """Save contact form submission"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO contact_messages (name, email, subject, message, ip_address)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, email, subject, message, kwargs.get('ip_address')))
            conn.commit()
            return cursor.lastrowid
    
    def get_contact_messages(self, status: Optional[str] = None) -> List[Dict]:
        """Get contact messages"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if status:
                cursor.execute('''
                    SELECT * FROM contact_messages 
                    WHERE status = ? 
                    ORDER BY timestamp DESC
                ''', (status,))
            else:
                cursor.execute('SELECT * FROM contact_messages ORDER BY timestamp DESC')
            
            return [dict(row) for row in cursor.fetchall()]
    
    def mark_message_read(self, message_id: int):
        """Mark a contact message as read"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE contact_messages 
                SET status = 'read' 
                WHERE id = ?
            ''', (message_id,))
            conn.commit()
    
    # Content Management
    def get_projects(self, featured_only: bool = False) -> List[Dict]:
        """Get projects from database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if featured_only:
                cursor.execute('''
                    SELECT * FROM projects 
                    WHERE featured = 1 
                    ORDER BY order_index
                ''')
            else:
                cursor.execute('SELECT * FROM projects ORDER BY order_index')
            
            projects = []
            for row in cursor.fetchall():
                project = dict(row)
                project['technologies'] = json.loads(project['technologies'])
                projects.append(project)
            
            return projects
    
    def update_project(self, project_id: int, updates: Dict):
        """Update a project"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Build update query dynamically
            set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
            values = list(updates.values()) + [project_id]
            
            cursor.execute(f'''
                UPDATE projects 
                SET {set_clause}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', values)
            conn.commit()
    
    def get_skills(self) -> Dict[str, List[Dict]]:
        """Get skills grouped by category"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM skills 
                ORDER BY category, order_index
            ''')
            
            skills = {}
            for row in cursor.fetchall():
                skill = dict(row)
                category = skill['category']
                if category not in skills:
                    skills[category] = []
                skills[category].append(skill)
            
            return skills
    
    # Resume Downloads
    def track_resume_download(self, session_id: str, **kwargs):
        """Track resume download"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO resume_downloads (session_id, ip_address, user_agent, referrer)
                VALUES (?, ?, ?, ?)
            ''', (session_id, kwargs.get('ip_address'), kwargs.get('user_agent'), kwargs.get('referrer')))
            conn.commit()

# Create global database instance
db = PortfolioDB()