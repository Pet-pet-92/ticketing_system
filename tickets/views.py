import re
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User, Group, Permission
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta, datetime
from .models import (
    Ticket, TicketComment, TicketCategory, TicketType,
    Department, PriorityRule, SLA
)
from .serializers import (
    TicketSerializer, TicketCommentSerializer,
    TicketCategorySerializer, TicketTypeSerializer,
    DepartmentSerializer, PriorityRuleSerializer,
    SLASerializer
)


# ============================================
# REGISTER VIEW
# ============================================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def validate_password(self, password):
        """Validate password strength"""
        errors = []
        
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'[0-9]', password):
            errors.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character (!@#$%^&* etc.)")
        
        return errors

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        role = request.data.get('role', 'User')

        # Validation
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        #  Password strength validation
        password_errors = self.validate_password(password)
        if password_errors:
            return Response(
                {'error': password_errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=(role in ['Admin', 'Agent'])
        )

        # Assign role (group)
        try:
            group = Group.objects.get(name=role)
            user.groups.add(group)
        except Group.DoesNotExist:
            try:
                group = Group.objects.get(name='User')
                user.groups.add(group)
            except Group.DoesNotExist:
                pass

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'User registered successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role,
                'is_staff': user.is_staff,
            }
        }, status=status.HTTP_201_CREATED)


# ============================================
# TICKET VIEWSET
# ============================================
class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # ============================================
        # ADMIN → All tickets
        # ============================================
        if user.is_superuser or user.groups.filter(name='Admin').exists():
            return Ticket.objects.all().order_by('-created_at')
        
        # ============================================
        # AGENT → Tickets assigned to them
        # ============================================
        if user.groups.filter(name='Support_Agent').exists() or user.is_staff:
            return Ticket.objects.filter(
                assigned_to=user
            ).order_by('-created_at')
        
        # ============================================
        # USER → Tickets they created
        # ============================================
        return Ticket.objects.filter(
            created_by=user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        ticket = self.get_object()
        comment_text = request.data.get('comment')
        if not comment_text:
            return Response(
                {'error': 'Comment text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        comment = TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=comment_text
        )
        serializer = TicketCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Ticket.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ticket.status = new_status
        if new_status == 'resolved':
            ticket.resolved_at = timezone.now()
        ticket.save()
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get all comments for a ticket"""
        ticket = self.get_object()
        comments = ticket.comments.all().order_by('created_at')
        serializer = TicketCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get ticket statistics for dashboard"""
        user = request.user
        tickets = Ticket.objects.all()
        
        # ============================================
        # ADMIN → All tickets stats
        # ============================================
        if user.is_superuser or user.groups.filter(name='Admin').exists():
            pass  # Keep all tickets
        
        # ============================================
        # AGENT → Tickets assigned to them
        # ============================================
        elif user.groups.filter(name='Support_Agent').exists() or user.is_staff:
            tickets = tickets.filter(assigned_to=user)
        
        # ============================================
        # USER → Tickets they created
        # ============================================
        else:
            tickets = tickets.filter(created_by=user)
        
        return Response({
            'total': tickets.count(),
            'open': tickets.filter(status='open').count(),
            'in_progress': tickets.filter(status='in_progress').count(),
            'resolved': tickets.filter(status='resolved').count(),
            'closed': tickets.filter(status='closed').count(),
        })

    # ============================================
    # REASSIGN TICKET (Admin/Superadmin only)
    # ============================================
    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Reassign ticket to another agent"""
        ticket = self.get_object()
        new_agent_id = request.data.get('assigned_to')
        
        # Check if user is admin or superadmin
        if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
            return Response(
                {'error': 'Only admins can reassign tickets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate new agent
        if not new_agent_id:
            return Response(
                {'error': 'Please select an agent to assign'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_agent = User.objects.get(id=new_agent_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the user is an agent
        if not (new_agent.groups.filter(name='Support_Agent').exists() or new_agent.is_staff):
            return Response(
                {'error': 'Selected user is not an agent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reassign ticket
        old_agent = ticket.assigned_to
        ticket.assigned_to = new_agent
        ticket.save()
        
        return Response({
            'success': True,
            'message': f'Ticket reassigned from {old_agent.username if old_agent else "Unassigned"} to {new_agent.username}',
            'assigned_to': new_agent.username,
        })

    @action(detail=False, methods=['get'])
    def available_agents(self, request):
        """Get list of available agents for reassignment"""
        if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
            return Response(
                {'error': 'Only admins can view available agents'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        agents = User.objects.filter(
            groups__name='Support_Agent'
        ).values('id', 'username', 'email')
        
        return Response(list(agents))

    @action(detail=False, methods=['get'])
    def filtered(self, request):
        """Get tickets with filters for admin dashboard"""
        user = request.user
        
        # Base queryset based on role
        if user.is_superuser or user.groups.filter(name='Admin').exists():
            tickets = Ticket.objects.all()
        elif user.groups.filter(name='Support_Agent').exists() or user.is_staff:
            tickets = Ticket.objects.filter(assigned_to=user)
        else:
            tickets = Ticket.objects.filter(created_by=user)
        
        # Date range filter
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                tickets = tickets.filter(created_at__date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                tickets = tickets.filter(created_at__date__lte=end)
            except ValueError:
                pass
        
        # Status filter
        status = request.query_params.get('status')
        if status:
            tickets = tickets.filter(status=status)
        
        # Priority filter
        priority = request.query_params.get('priority')
        if priority:
            tickets = tickets.filter(priority=priority)
        
        # Assigned to filter (admin only)
        assigned_to = request.query_params.get('assigned_to')
        if assigned_to and (user.is_superuser or user.groups.filter(name='Admin').exists()):
            tickets = tickets.filter(assigned_to__id=assigned_to)
        
        # Search filter
        search = request.query_params.get('search')
        if search:
            tickets = tickets.filter(
                Q(title__icontains=search) | 
                Q(ticket_number__icontains=search)
            )
        
        # Pagination
        limit = int(request.query_params.get('limit', 20))
        tickets = tickets.order_by('-created_at')[:limit]
        
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options"""
        user = request.user
        
        # Get all agents (only for admin)
        agents = []
        if user.is_superuser or user.groups.filter(name='Admin').exists():
            agents = list(User.objects.filter(groups__name='Support_Agent').values('id', 'username'))
        else:
            # Agents see only themselves
            agents = [{'id': user.id, 'username': user.username}]
        
        return Response({
            'statuses': [
                {'value': 'open', 'label': 'Open'},
                {'value': 'in_progress', 'label': 'In Progress'},
                {'value': 'resolved', 'label': 'Resolved'},
                {'value': 'closed', 'label': 'Closed'},
            ],
            'priorities': [
                {'value': 'low', 'label': 'Low'},
                {'value': 'medium', 'label': 'Medium'},
                {'value': 'high', 'label': 'High'},
                {'value': 'critical', 'label': 'Critical'},
            ],
            'agents': agents,
        })


# ============================================
# ANALYTICS VIEW
# ============================================
class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        tickets = Ticket.objects.filter(created_at__gte=start_date)
        
        # Total counts
        total_tickets = tickets.count()
        open_tickets = tickets.filter(status__in=['open', 'in_progress']).count()
        resolved_tickets = tickets.filter(status='resolved').count()
        
        # Priority data
        priority_data = []
        for priority in ['critical', 'high', 'medium', 'low']:
            count = tickets.filter(priority=priority).count()
            priority_data.append(count)
        
        # Status data
        status_data = [
            tickets.filter(status='open').count(),
            tickets.filter(status='in_progress').count(),
            tickets.filter(status='resolved').count(),
            tickets.filter(status='closed').count(),
        ]
        
        # Category data
        categories = TicketCategory.objects.filter(is_active=True)
        category_labels = []
        category_data = []
        for category in categories:
            count = tickets.filter(category=category).count()
            if count > 0:
                category_labels.append(category.name)
                category_data.append(count)
        
        # Trend data (last 7 days)
        trend_labels = []
        trend_data = []
        trend_resolved = []
        for i in range(days, 0, -1):
            date = timezone.now() - timedelta(days=i)
            day_start = timezone.make_aware(
                datetime.combine(date.date(), datetime.min.time())
            )
            day_end = timezone.make_aware(
                datetime.combine(date.date(), datetime.max.time())
            )
            trend_labels.append(date.strftime('%b %d'))
            trend_data.append(
                Ticket.objects.filter(
                    created_at__range=[day_start, day_end]
                ).count()
            )
            trend_resolved.append(
                Ticket.objects.filter(
                    resolved_at__range=[day_start, day_end]
                ).count()
            )
        
        # SLA data
        total_resolved = Ticket.objects.filter(status='resolved').count()
        met_sla = Ticket.objects.filter(
            status='resolved',
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        sla_compliance = round((met_sla / total_resolved * 100), 2) if total_resolved > 0 else 100
        
        return Response({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'resolved_tickets': resolved_tickets,
            'priority_data': priority_data,
            'status_data': status_data,
            'category_labels': category_labels,
            'category_data': category_data,
            'trend_labels': trend_labels,
            'trend_data': trend_data,
            'trend_resolved': trend_resolved,
            'sla_met': met_sla,
            'sla_breached': total_resolved - met_sla,
            'sla_compliance': sla_compliance,
        })


# ============================================
# TICKET CATEGORY VIEWSET
# ============================================
class TicketCategoryViewSet(viewsets.ModelViewSet):
    queryset = TicketCategory.objects.all()
    serializer_class = TicketCategorySerializer
    permission_classes = [IsAuthenticated]


# ============================================
# TICKET TYPE VIEWSET
# ============================================
class TicketTypeViewSet(viewsets.ModelViewSet):
    queryset = TicketType.objects.all()
    serializer_class = TicketTypeSerializer
    permission_classes = [IsAuthenticated]


# ============================================
# DEPARTMENT VIEWSET
# ============================================
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


# ============================================
# PRIORITY RULE VIEWSET
# ============================================
class PriorityRuleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Priority Rules
    """
    queryset = PriorityRule.objects.all()
    serializer_class = PriorityRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PriorityRule.objects.all().order_by('order')


# ============================================
# SLA RULE VIEWSET
# ============================================
class SLAViewSet(viewsets.ModelViewSet):
    """
    API endpoint for SLA Rules
    """
    queryset = SLA.objects.all()
    serializer_class = SLASerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SLA.objects.all().order_by('priority')


# ============================================
# USER VIEWS
# ============================================
class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Users
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Only superusers can see all users
        if user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        user = self.get_object()
        password = request.data.get('password')
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(password)
        user.save()
        return Response({'message': 'Password updated successfully'})
    
    # ============================================
    # ✅ SET ROLE ACTION (FULLY IMPLEMENTED)
    # ============================================
    @action(detail=True, methods=['post'])
    def set_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get('role')
        
        if role not in ['Admin', 'Support_Agent', 'User']:
            return Response(
                {'error': 'Invalid role. Must be Admin, Support_Agent, or User'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove from all groups
        user.groups.clear()
        
        # Reset permissions based on role
        if role == 'Admin':
            user.is_superuser = True
            user.is_staff = True
            group, _ = Group.objects.get_or_create(name='Admin')
            user.groups.add(group)
        elif role == 'Support_Agent':
            user.is_superuser = False
            user.is_staff = True
            group, _ = Group.objects.get_or_create(name='Support_Agent')
            user.groups.add(group)
        else:  # User
            user.is_superuser = False
            user.is_staff = False
            group, _ = Group.objects.get_or_create(name='User')
            user.groups.add(group)
        
        user.save()
        
        return Response({
            'message': f'Role updated to {role}',
            'role': role,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })
    
    @action(detail=False, methods=['get'])
    def roles(self, request):
        """Get all available roles"""
        roles = ['Admin', 'Support_Agent', 'User']
        return Response(roles)


# ============================================
# ROLE (GROUP) VIEWS
# ============================================
class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Roles (Groups)
    """
    queryset = Group.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update':
            return GroupCreateSerializer
        return GroupSerializer
    
    def get_queryset(self):
        # Only superusers can manage groups
        if self.request.user.is_superuser:
            return Group.objects.all()
        return Group.objects.none()


# ============================================
# PERMISSION VIEWS
# ============================================
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for Permissions (read-only)
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only superusers can view permissions
        if self.request.user.is_superuser:
            return Permission.objects.all().order_by('content_type__app_label', 'codename')
        return Permission.objects.none()


# ============================================
# REPORT VIEWS
# ============================================
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Ticket, TicketComment, SLA, TicketCategory
from django.contrib.auth.models import User


class DailyReportView(APIView):
    """
    Daily Summary Report
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get date from query param or use today
        date_str = request.query_params.get('date')
        if date_str:
            try:
                report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        else:
            report_date = timezone.now().date()

        start_of_day = timezone.make_aware(
            datetime.combine(report_date, datetime.min.time())
        )
        end_of_day = timezone.make_aware(
            datetime.combine(report_date, datetime.max.time())
        )

        # New tickets
        new_tickets = Ticket.objects.filter(created_at__range=[start_of_day, end_of_day])
        
        # Resolved tickets
        resolved_tickets = Ticket.objects.filter(
            status='resolved',
            resolved_at__range=[start_of_day, end_of_day]
        )
        
        # Open tickets by priority
        open_by_priority = Ticket.objects.filter(
            status__in=['open', 'in_progress']
        ).values('priority').annotate(count=Count('id'))
        
        # SLA compliance
        total_resolved = Ticket.objects.filter(status='resolved').count()
        met_sla = Ticket.objects.filter(
            status='resolved',
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        sla_compliance = round((met_sla / total_resolved * 100), 2) if total_resolved > 0 else 100
        
        # Top categories
        top_categories = Ticket.objects.filter(
            created_at__range=[start_of_day, end_of_day]
        ).values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        return Response({
            'date': report_date.strftime('%Y-%m-%d'),
            'new_tickets': new_tickets.count(),
            'resolved_tickets': resolved_tickets.count(),
            'open_by_priority': list(open_by_priority),
            'sla_compliance': sla_compliance,
            'top_categories': list(top_categories),
        })


class WeeklyReportView(APIView):
    """
    Weekly Performance Report
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        
        # Tickets this week
        tickets_this_week = Ticket.objects.filter(created_at__gte=week_ago)
        
        # Agent performance
        agents = User.objects.filter(groups__name='Support_Agent')
        agent_performance = []
        
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
            
            # Average resolution time (manual calculation for SQLite)
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
        
        # Top categories
        top_categories = list(Ticket.objects.filter(
            created_at__gte=week_ago
        ).values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5])
        
        # SLA compliance
        total_resolved = Ticket.objects.filter(status='resolved').count()
        met_sla = Ticket.objects.filter(
            status='resolved',
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        sla_compliance = round((met_sla / total_resolved * 100), 2) if total_resolved > 0 else 100

        return Response({
            'week_start': week_ago.date().strftime('%Y-%m-%d'),
            'week_end': timezone.now().date().strftime('%Y-%m-%d'),
            'total_created': tickets_this_week.count(),
            'total_resolved': Ticket.objects.filter(
                status='resolved',
                resolved_at__gte=week_ago
            ).count(),
            'agent_performance': agent_performance,
            'top_categories': top_categories,
            'sla_compliance': sla_compliance,
        })


class SLAReportView(APIView):
    """
    SLA Compliance Report
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_tickets = Ticket.objects.filter(status__in=['resolved', 'closed']).count()
        
        if total_tickets == 0:
            return Response({
                'total': 0,
                'met': 0,
                'breached': 0,
                'compliance': 100,
                'by_priority': []
            })
        
        # Overall SLA compliance
        met_sla = Ticket.objects.filter(
            status__in=['resolved', 'closed'],
            sla_response_breached=False,
            sla_resolution_breached=False
        ).count()
        
        breached = total_tickets - met_sla
        compliance = round((met_sla / total_tickets) * 100, 2)
        
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
        
        return Response({
            'total': total_tickets,
            'met': met_sla,
            'breached': breached,
            'compliance': compliance,
            'by_priority': by_priority,
        })


class WorkloadReportView(APIView):
    """
    Agent Workload Report
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
            
            # Get agent status
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
        
        return Response({
            'generated_at': timezone.now().isoformat(),
            'total_agents': len(workload_data),
            'total_open_tickets': sum(w['open_tickets'] for w in workload_data),
            'workload_summary': workload_data,
        })

class DepartmentReportView(APIView):
    """
    Department Report
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        departments = Department.objects.filter(is_active=True)
        report_data = []

        for dept in departments:
            tickets = Ticket.objects.filter(department=dept)
            report_data.append({
                'name': dept.name,
                'total': tickets.count(),
                'open': tickets.filter(status='open').count(),
                'in_progress': tickets.filter(status='in_progress').count(),
                'resolved': tickets.filter(status='resolved').count(),
                'closed': tickets.filter(status='closed').count(),
            })

        # Also include uncategorized tickets
        uncategorized = Ticket.objects.filter(department__isnull=True)
        if uncategorized.exists():
            report_data.append({
                'name': 'Uncategorized',
                'total': uncategorized.count(),
                'open': uncategorized.filter(status='open').count(),
                'in_progress': uncategorized.filter(status='in_progress').count(),
                'resolved': uncategorized.filter(status='resolved').count(),
                'closed': uncategorized.filter(status='closed').count(),
            })

        return Response({
            'departments': report_data,
        })