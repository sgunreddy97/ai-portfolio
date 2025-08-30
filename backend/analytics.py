"""
Analytics module for tracking and analyzing user behavior
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from collections import defaultdict
import re

# Try to import user_agents, but make it optional
try:
    from user_agents import parse
    HAS_USER_AGENTS = True
except ImportError:
    HAS_USER_AGENTS = False
    print("Warning: user_agents module not found. Install with: pip install user-agents")

import requests

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    def __init__(self, db):
        self.db = db
        
    def process_user_agent(self, user_agent_string: str) -> Dict:
        """Parse user agent to extract device and browser info"""
        if HAS_USER_AGENTS:
            try:
                user_agent = parse(user_agent_string)
                
                # Determine device type
                if user_agent.is_mobile:
                    device_type = 'Mobile'
                elif user_agent.is_tablet:
                    device_type = 'Tablet'
                else:
                    device_type = 'Desktop'
                
                return {
                    'device_type': device_type,
                    'browser': user_agent.browser.family,
                    'browser_version': user_agent.browser.version_string,
                    'os': user_agent.os.family,
                    'os_version': user_agent.os.version_string,
                    'is_bot': user_agent.is_bot
                }
            except Exception as e:
                logger.error(f"Error parsing user agent: {e}")
        
        # Default response if parsing fails or module not available
        return {
            'device_type': 'Unknown',
            'browser': 'Unknown',
            'browser_version': '',
            'os': 'Unknown',
            'os_version': '',
            'is_bot': False
        }
    
    def get_location_from_ip(self, ip_address: str) -> Dict:
        """Get location information from IP address"""
        try:
            # Skip for localhost
            if ip_address in ['127.0.0.1', 'localhost', '::1']:
                return {
                    'country': 'Local',
                    'city': 'Localhost',
                    'region': 'Local',
                    'lat': None,
                    'lon': None
                }
            
            # Using a free IP geolocation service
            response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country', 'Unknown'),
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('regionName', 'Unknown'),
                    'lat': data.get('lat'),
                    'lon': data.get('lon')
                }
        except Exception as e:
            logger.error(f"Error getting location from IP: {e}")
        
        return {
            'country': 'Unknown',
            'city': 'Unknown',
            'region': 'Unknown',
            'lat': None,
            'lon': None
        }
    
    def track_page_view(self, session_id: str, page: str, **kwargs):
        """Track a page view with detailed information"""
        # Process user agent
        user_agent_info = self.process_user_agent(kwargs.get('user_agent', ''))
        
        # Get location from IP
        location_info = {}
        if kwargs.get('user_ip'):
            location_info = self.get_location_from_ip(kwargs['user_ip'])
        
        # Remove 'page' from kwargs to avoid duplicate argument error
        kwargs_filtered = {k: v for k, v in kwargs.items() if k != 'page'}
        
        # Track in database
        self.db.track_event(
            session_id=session_id,
            page=page,
            action='page_view',
            details={
                **user_agent_info,
                **location_info,
                'referrer': kwargs.get('referrer'),
                'timestamp': datetime.now().isoformat()
            },
            **kwargs_filtered
        )
        
        # Update session
        self.db.create_or_update_session(
            session_id=session_id,
            ip_address=kwargs.get('user_ip'),
            user_agent=kwargs.get('user_agent'),
            device_type=user_agent_info['device_type'],
            browser=user_agent_info['browser'],
            country=location_info.get('country'),
            city=location_info.get('city')
        )
    
    def track_interaction(self, session_id: str, action: str, element: str, **kwargs):
        """Track user interactions (clicks, scrolls, etc.)"""
        # Remove 'page' from kwargs if it exists to avoid duplicate
        page = kwargs.pop('page', 'unknown')
        
        self.db.track_event(
            session_id=session_id,
            page=page,
            action=action,
            details={
                'element': element,
                'value': kwargs.get('value'),
                'timestamp': datetime.now().isoformat()
            },
            **kwargs
        )
    
    def calculate_engagement_score(self, session_id: str) -> float:
        """Calculate engagement score for a session"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get session metrics
            cursor.execute('''
                SELECT 
                    COUNT(DISTINCT page) as pages_visited,
                    COUNT(*) as total_events,
                    MAX(time_spent) as max_time_spent,
                    COUNT(CASE WHEN action = 'chat_opened' THEN 1 END) as chat_interactions,
                    COUNT(CASE WHEN action = 'download_resume' THEN 1 END) as resume_downloads
                FROM analytics
                WHERE session_id = ?
            ''', (session_id,))
            
            metrics = cursor.fetchone()
            
            # Calculate engagement score (0-100)
            score = 0
            
            # Pages visited (max 30 points)
            pages_score = min(metrics['pages_visited'] * 10, 30)
            score += pages_score
            
            # Time spent (max 25 points)
            if metrics['max_time_spent']:
                time_score = min(metrics['max_time_spent'] / 60, 25)
                score += time_score
            
            # Chat interactions (max 20 points)
            if metrics['chat_interactions'] > 0:
                score += 20
            
            # Resume downloads (max 25 points)
            if metrics['resume_downloads'] > 0:
                score += 25
            
            return min(score, 100)
    
    def get_funnel_analytics(self) -> Dict:
        """Get conversion funnel analytics"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Define funnel stages
            funnel_stages = [
                ('landing', "action = 'page_view' AND page = 'home'"),
                ('viewed_projects', "action = 'page_view' AND page = 'projects'"),
                ('opened_chat', "action = 'chat_opened'"),
                ('downloaded_resume', "action = 'download_resume'"),
                ('sent_message', "action = 'contact_form_submit'")
            ]
            
            funnel_data = []
            for stage_name, condition in funnel_stages:
                cursor.execute(f'''
                    SELECT COUNT(DISTINCT session_id) as count
                    FROM analytics
                    WHERE {condition}
                ''')
                count = cursor.fetchone()['count']
                funnel_data.append({
                    'stage': stage_name,
                    'count': count
                })
            
            # Calculate conversion rates
            if funnel_data[0]['count'] > 0:
                for i in range(1, len(funnel_data)):
                    funnel_data[i]['conversion_rate'] = round(
                        funnel_data[i]['count'] / funnel_data[0]['count'] * 100, 2
                    )
            
            return {'funnel': funnel_data}
    
    def get_behavior_flow(self, session_id: str) -> List[Dict]:
        """Get user behavior flow for a session"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT page, action, timestamp, time_spent, details
                FROM analytics
                WHERE session_id = ?
                ORDER BY timestamp
            ''', (session_id,))
            
            flow = []
            for row in cursor.fetchall():
                flow.append({
                    'page': row['page'],
                    'action': row['action'],
                    'timestamp': row['timestamp'],
                    'time_spent': row['time_spent'],
                    'details': json.loads(row['details']) if row['details'] else {}
                })
            
            return flow
    
    def get_heatmap_data(self, page: str, days: int = 7) -> List[Dict]:
        """Get click heatmap data for a page"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT details
                FROM analytics
                WHERE page = ? 
                AND action = 'click'
                AND timestamp > datetime('now', '-' || ? || ' days')
                AND details IS NOT NULL
            ''', (page, days))
            
            clicks = []
            for row in cursor.fetchall():
                details = json.loads(row['details'])
                if 'x' in details and 'y' in details:
                    clicks.append({
                        'x': details['x'],
                        'y': details['y'],
                        'element': details.get('element', 'unknown')
                    })
            
            return clicks
    
    def get_real_time_stats(self) -> Dict:
        """Get real-time statistics"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Active users (last 5 minutes)
            cursor.execute('''
                SELECT COUNT(DISTINCT session_id) as active_users
                FROM analytics
                WHERE timestamp > datetime('now', '-5 minutes')
            ''')
            active_users = cursor.fetchone()['active_users']
            
            # Current page distribution
            cursor.execute('''
                SELECT page, COUNT(DISTINCT session_id) as users
                FROM analytics
                WHERE timestamp > datetime('now', '-5 minutes')
                AND action = 'page_view'
                GROUP BY page
            ''')
            current_pages = [dict(row) for row in cursor.fetchall()]
            
            # Recent events
            cursor.execute('''
                SELECT action, page, timestamp
                FROM analytics
                WHERE timestamp > datetime('now', '-1 minute')
                ORDER BY timestamp DESC
                LIMIT 10
            ''')
            recent_events = [dict(row) for row in cursor.fetchall()]
            
            return {
                'active_users': active_users,
                'current_pages': current_pages,
                'recent_events': recent_events
            }
    
    def get_content_performance(self) -> Dict:
        """Analyze content performance"""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Most viewed projects
            cursor.execute('''
                SELECT 
                    json_extract(details, '$.project_id') as project_id,
                    COUNT(*) as views
                FROM analytics
                WHERE action = 'view_project'
                AND details IS NOT NULL
                GROUP BY project_id
                ORDER BY views DESC
                LIMIT 5
            ''')
            top_projects = [dict(row) for row in cursor.fetchall()]
            
            # Average time on pages
            cursor.execute('''
                SELECT 
                    page,
                    AVG(time_spent) as avg_time,
                    COUNT(*) as visits
                FROM analytics
                WHERE time_spent IS NOT NULL
                GROUP BY page
                ORDER BY avg_time DESC
            ''')
            page_engagement = [dict(row) for row in cursor.fetchall()]
            
            # Chat conversation topics
            cursor.execute('''
                SELECT 
                    topics,
                    COUNT(*) as count
                FROM conversations
                WHERE topics IS NOT NULL
                GROUP BY topics
                ORDER BY count DESC
                LIMIT 10
            ''')
            
            chat_topics = []
            for row in cursor.fetchall():
                topics = json.loads(row['topics']) if row['topics'] else []
                for topic in topics:
                    chat_topics.append(topic)
            
            # Count topic frequency
            topic_counts = defaultdict(int)
            for topic in chat_topics:
                topic_counts[topic] += 1
            
            return {
                'top_projects': top_projects,
                'page_engagement': page_engagement,
                'chat_topics': sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            }
    
    def generate_report(self, period: str = 'week') -> Dict:
        """Generate comprehensive analytics report"""
        days = {'day': 1, 'week': 7, 'month': 30, 'year': 365}.get(period, 7)
        
        # Get all analytics data
        summary = self.db.get_analytics_summary(days)
        detailed = self.db.get_detailed_analytics(days)
        funnel = self.get_funnel_analytics()
        content = self.get_content_performance()
        real_time = self.get_real_time_stats()
        
        # Calculate additional metrics
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Bounce rate
            cursor.execute('''
                SELECT 
                    COUNT(CASE WHEN page_count = 1 THEN 1 END) * 100.0 / COUNT(*) as bounce_rate
                FROM (
                    SELECT session_id, COUNT(DISTINCT page) as page_count
                    FROM analytics
                    WHERE timestamp > datetime('now', '-' || ? || ' days')
                    GROUP BY session_id
                )
            ''', (days,))
            result = cursor.fetchone()
            bounce_rate = result['bounce_rate'] if result and result['bounce_rate'] else 0
            
            # New vs returning visitors
            cursor.execute('''
                SELECT 
                    COUNT(CASE WHEN is_returning = 1 THEN 1 END) * 100.0 / COUNT(*) as returning_rate
                FROM sessions
                WHERE started_at > datetime('now', '-' || ? || ' days')
            ''', (days,))
            result = cursor.fetchone()
            returning_rate = result['returning_rate'] if result and result['returning_rate'] else 0
            
            # Peak hours
            cursor.execute('''
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as events
                FROM analytics
                WHERE timestamp > datetime('now', '-' || ? || ' days')
                GROUP BY hour
                ORDER BY events DESC
                LIMIT 3
            ''', (days,))
            peak_hours = [int(row['hour']) for row in cursor.fetchall()]
        
        return {
            'period': period,
            'generated_at': datetime.now().isoformat(),
            'summary': summary,
            'detailed': detailed,
            'funnel': funnel,
            'content_performance': content,
            'real_time': real_time,
            'metrics': {
                'bounce_rate': round(bounce_rate, 2),
                'returning_visitor_rate': round(returning_rate, 2),
                'peak_hours': peak_hours
            }
        }

# Create analytics instance (will be initialized with db in server.py)
analytics_engine = None