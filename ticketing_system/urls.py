from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from tickets.views import (
    TicketViewSet,
    TicketCategoryViewSet,
    AnalyticsView,
    TicketTypeViewSet,
    DepartmentViewSet,
    PriorityRuleViewSet,
    SLAViewSet,
    UserViewSet,
    GroupViewSet,
    PermissionViewSet,
    RegisterView,
    DailyReportView,
    WeeklyReportView,
    SLAReportView,
    WorkloadReportView,
    DepartmentReportView,
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'categories', TicketCategoryViewSet, basename='category')
router.register(r'types', TicketTypeViewSet, basename='type')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'priority-rules', PriorityRuleViewSet, basename='priorityrule')
router.register(r'sla-rules', SLAViewSet, basename='sla')
router.register(r'users', UserViewSet, basename='user') 
router.register(r'roles', GroupViewSet, basename='role')  
router.register(r'permissions', PermissionViewSet, basename='permission') 


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'groups': [g.name for g in user.groups.all()],
        })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),

    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # Auth endpoints
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/user/', UserView.as_view(), name='user_info'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    
    # Report endpoints
    path('api/reports/daily/', DailyReportView.as_view(), name='daily_report'),
    path('api/reports/weekly/', WeeklyReportView.as_view(), name='weekly_report'),
    path('api/reports/sla/', SLAReportView.as_view(), name='sla_report'),
    path('api/reports/workload/', WorkloadReportView.as_view(), name='workload_report'),
    path('api/reports/departments/', DepartmentReportView.as_view(), name='department_report'),
    
    # ============================================
    # REASSIGN & FILTERING ENDPOINTS (NEW)
    # ============================================
    # Reassign ticket (Admin/Superadmin only)
    path('api/tickets/<int:pk>/reassign/', TicketViewSet.as_view({'post': 'reassign'}), name='ticket_reassign'),
    
    # Get available agents for dropdown
    path('api/tickets/available-agents/', TicketViewSet.as_view({'get': 'available_agents'}), name='available_agents'),
    
    # Filtered tickets with query parameters
    path('api/tickets/filtered/', TicketViewSet.as_view({'get': 'filtered'}), name='filtered_tickets'),
    
    # Get filter options (statuses, priorities, agents)
    path('api/tickets/filter-options/', TicketViewSet.as_view({'get': 'filter_options'}), name='filter_options'),
]