from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from tickets.models import Ticket, TicketComment, SLA, TicketCategory, TicketType
from django.contrib.auth.models import User

class ReportGenerator:
    """
    Generates all types of reports (excluding aging reports)
    """
    
    @staticmethod
    def generate_daily_summary():
        """Generate daily ticket summary"""
        today = timezone.now().date()
        start_of_day = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        # Tickets created today
        new_tickets = Ticket.objects.filter(created_at__gte=start_of_day)
        
        # Tickets resolved today
        resolved_tickets = Ticket.objects.filter(
            status='resolved',
            resolved_at__gte=start_of_day
        )
        
        # Open tickets by priority
        open_by_priority = list(Ticket.objects.filter(
            status__in=['open', 'in_progress']
        ).values('priority').annotate(count=Count('id')))
        
        # SLA status breakdown
        sla_breakdown = list(Ticket.objects.filter(
            status__in=['open', 'in_progress']
        ).values('sla_status').annotate(count=Count('id')))
        
        # Agent workload
        agent_workload = {}
        agents = User.objects.filter(groups__name='Support_Agent')
        for agent in agents:
            ticket_count = Ticket.objects.filter(
                assigned_to=agent,
                status__in=['open', 'in_progress']
            ).count()
            agent_workload[agent.username] = ticket_count
        
        # Most common categories
        top_categories = list(Ticket.objects.filter(
            created_at__gte=start_of_day
        ).values('category__name').annotate(count=Count('id')).order_by('-count')[:5])
        
        return {
            'date': today.strftime('%Y-%m-%d'),
            'new_tickets': new_tickets.count(),
            'resolved_tickets': resolved_tickets.count(),
            'open_by_priority': open_by_priority,
            'sla_breakdown': sla_breakdown,
            'agent_workload': agent_workload,
            'top_categories': top_categories,
            'sla_compliance': ReportGenerator.calculate_sla_compliance(),
        }
    
    @staticmethod
    def generate_weekly_performance():
        """Generate weekly team performance report"""
        week_ago = timezone.now() - timedelta(days=7)
        
        # Tickets this week
        tickets_this_week = Ticket.objects.filter(created_at__gte=week_ago)
        
        # Agent performance
        agent_performance = []
        agents = User.objects.filter(groups__name='Support_Agent')
        
        for agent in agents:
            resolved = Ticket.objects.filter(
                assigned_to=agent,
                status='resolved',
                resolved_at__gte=week_ago
            ).count()
            
            assigned = Ticket.objects.filter(
                assigned_to=agent,
                created_at__gte=week_ago
            ).count()
            
            # ============================================
            # FIX: Calculate average resolution time manually
            # (SQLite doesn't support Avg on datetime fields)
            # ============================================
            resolved_tickets = Ticket.objects.filter(
                assigned_to=agent,
                status='resolved',
                resolved_at__gte=week_ago
            )
            
            total_seconds = 0
            ticket_count = resolved_tickets.count()
            avg_time = None
            
            for ticket in resolved_tickets:
                if ticket.created_at and ticket.resolved_at:
                    delta = ticket.resolved_at - ticket.created_at
                    total_seconds += delta.total_seconds()
            
            if ticket_count > 0:
                avg_seconds = total_seconds / ticket_count
                if avg_seconds > 0:
                    hours = int(avg_seconds // 3600)
                    minutes = int((avg_seconds % 3600) // 60)
                    if hours > 0:
                        avg_time = f"{hours}h {minutes}m"
                    else:
                        avg_time = f"{minutes}m"
            # ============================================
            
            # SLA compliance for this agent
            total_tickets = Ticket.objects.filter(
                assigned_to=agent,
                status='resolved',
                resolved_at__gte=week_ago
            ).count()
            
            met_sla = Ticket.objects.filter(
                assigned_to=agent,
                status='resolved',
                resolved_at__gte=week_ago,
                sla_response_breached=False,
                sla_resolution_breached=False
            ).count()
            
            sla_score = (met_sla / total_tickets * 100) if total_tickets > 0 else 0
            
            agent_performance.append({
                'agent': agent.username,
                'resolved': resolved,
                'assigned': assigned,
                'avg_resolution_time': avg_time,
                'sla_compliance': round(sla_score, 2),
                'tickets_handled': total_tickets,
            })
        
        # Top categories - convert to list
        top_categories = list(Ticket.objects.filter(
            created_at__gte=week_ago
        ).values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5])
        
        return {
            'week_start': week_ago.date().strftime('%Y-%m-%d'),
            'week_end': timezone.now().date().strftime('%Y-%m-%d'),
            'total_created': tickets_this_week.count(),
            'total_resolved': Ticket.objects.filter(
                status='resolved',
                resolved_at__gte=week_ago
            ).count(),
            'agent_performance': agent_performance,
            'top_categories': top_categories,
            'sla_compliance': ReportGenerator.calculate_sla_compliance(),
        }
    
    @staticmethod
    def generate_sla_compliance():
        """Generate SLA compliance report"""
        total_tickets = Ticket.objects.filter(status__in=['resolved', 'closed']).count()
        
        if total_tickets == 0:
            return {
                'total': 0,
                'met': 0,
                'breached': 0,
                'compliance': 100,
                'by_priority': []
            }
        
        # Overall SLA compliance
        met_sla = Ticket.objects.filter(
            status__in=['resolved', 'closed'],
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        
        breached = total_tickets - met_sla
        compliance = (met_sla / total_tickets) * 100
        
        # SLA by priority
        by_priority = []
        for priority in ['critical', 'high', 'medium', 'low']:
            total = Ticket.objects.filter(
                status__in=['resolved', 'closed'],
                priority=priority
            ).count()
            
            met = Ticket.objects.filter(
                status__in=['resolved', 'closed'],
                priority=priority,
                sla_response_breached=False,
                sla_resolution_breached=False
            ).count()
            
            if total > 0:
                by_priority.append({
                    'priority': priority,
                    'total': total,
                    'met': met,
                    'breached': total - met,
                    'compliance': round((met / total) * 100, 2)
                })
        
        return {
            'total': total_tickets,
            'met': met_sla,
            'breached': breached,
            'compliance': round(compliance, 2),
            'by_priority': by_priority,
        }
    
    @staticmethod
    def generate_agent_workload():
        """Generate agent workload report"""
        agents = User.objects.filter(groups__name='Support_Agent')
        workload_data = []
        
        for agent in agents:
            open_tickets = Ticket.objects.filter(
                assigned_to=agent,
                status__in=['open', 'in_progress']
            ).count()
            
            in_progress = Ticket.objects.filter(
                assigned_to=agent,
                status='in_progress'
            ).count()
            
            resolved_today = Ticket.objects.filter(
                assigned_to=agent,
                status='resolved',
                resolved_at__date=timezone.now().date()
            ).count()
            
            # Get SLA breaches for this agent
            breached = Ticket.objects.filter(
                assigned_to=agent,
                status__in=['open', 'in_progress'],
                sla_status='breached'
            ).count()
            
            # Get agent status (if available)
            status = 'unknown'
            if hasattr(agent, 'availability'):
                status = agent.availability.status
            
            workload_data.append({
                'agent': agent.username,
                'open_tickets': open_tickets,
                'in_progress': in_progress,
                'resolved_today': resolved_today,
                'sla_breaches': breached,
                'status': status,
            })
        
        return {
            'generated_at': timezone.now().isoformat(),
            'total_agents': len(workload_data),
            'total_open_tickets': sum(w['open_tickets'] for w in workload_data),
            'workload_summary': workload_data,
        }
    
    @staticmethod
    def calculate_sla_compliance():
        """Helper: Calculate overall SLA compliance"""
        total = Ticket.objects.filter(status__in=['resolved', 'closed']).count()
        if total == 0:
            return 100.0
        met = Ticket.objects.filter(
            status__in=['resolved', 'closed'],
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        return round((met / total) * 100, 2)
    
    @staticmethod
    def get_top_categories(since_date):
        """Helper: Get top categories"""
        return list(
            Ticket.objects.filter(
                created_at__gte=since_date
            ).values('category__name').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
        )