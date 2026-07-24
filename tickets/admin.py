from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from unfold.admin import ModelAdmin
from .models import (
    TicketCategory, TicketType, Ticket, TicketComment,
    SLA, PriorityRule, Department,
    AgentSkill, AgentAvailability, AssignmentRule,
    Report, ReportSchedule
)
from .models import Department

# unregister admin
if admin.site.is_registered(User):
    admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    filter_horizontal = ('groups', 'user_permissions',)



# REGISTERING ALL MODELS 

# 1) Ticket
@admin.register(Ticket)
class TicketAdmin(ModelAdmin):
    list_display = [
        'title', 'status', 'priority', 
        'sla_status',
        'category', 'type', 'department',
        'created_by', 'assigned_to', 
        'created_at'
    ]
    list_filter = ['status', 'priority', 'sla_status', 'category', 'type', 'department']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at', 'priority',
                      'sla_response_deadline',   
                      'sla_resolution_deadline', 
                      'sla_status',            
                      'sla_response_breached',   
                      'sla_resolution_breached', 
                      'first_response_at']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('title', 'description', 'status')
        }),
        ('Classification', {
            'fields': ('category', 'type', 'department')
        }),
        ('SLA & Service Level', {  
            'fields': (
                'sla',
                'sla_status',
                'sla_response_deadline',
                'sla_resolution_deadline',
                'sla_response_breached',
                'sla_resolution_breached',
                'first_response_at',
            ),
            'classes': ('collapse',)
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )


# 2) Ticket Categories
@admin.register(TicketCategory)
class TicketCategoryAdmin(ModelAdmin):
    list_display = ['name', 'description',  'is_active', 'ticket_count', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


# 3) Ticket Types
@admin.register(TicketType)
class TicketTypeAdmin(ModelAdmin):
    list_display = ['name', 'description', 'color', 'is_active', 'ticket_count', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


# 4) Ticket Comments
@admin.register(TicketComment)
class TicketCommentAdmin(ModelAdmin):
    list_display = ['ticket', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['comment', 'user__username', 'ticket__title']
    readonly_fields = ['created_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + "..." if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = "Comment Preview"


# 5) Departments
@admin.register(Department)
class DepartmentAdmin(ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'ticket_count', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


# 6) Agent Availability
@admin.register(AgentAvailability)
class AgentAvailabilityAdmin(ModelAdmin):
    list_display = ['agent', 'status', 'current_workload', 'max_ticket_load', 'can_take_tickets']
    list_filter = ['status', 'is_active']
    search_fields = ['agent__username']
    readonly_fields = ['current_workload', 'can_take_tickets']


# 7) Agent Skills
@admin.register(AgentSkill)
class AgentSkillAdmin(ModelAdmin):
    list_display = ['agent', 'category', 'proficiency', 'created_at']
    list_filter = ['category', 'proficiency']
    search_fields = ['agent__username', 'category__name']
    ordering = ['agent__username', 'category__name']


# 8) SLA Rules
@admin.register(SLA)
class SLAAdmin(ModelAdmin):
    list_display = ['name', 'priority', 'response_time_display', 'resolution_time_display', 'is_active']
    list_filter = ['priority', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


# 9) Priority Rules
@admin.register(PriorityRule)
class PriorityRuleAdmin(ModelAdmin):
    list_display = ['category', 'type', 'keyword', 'priority', 'order', 'is_active']
    list_filter = ['priority', 'is_active']
    search_fields = ['keyword']
    ordering = ['order']
    readonly_fields = ['created_at', 'updated_at']


# 10) Assignment Rules
@admin.register(AssignmentRule)
class AssignmentRuleAdmin(ModelAdmin):
    list_display = ['name', 'strategy', 'priority', 'category', 'is_active', 'order']
    list_filter = ['strategy', 'priority', 'category', 'is_active']
    search_fields = ['name']
    ordering = ['order']
    readonly_fields = ['created_at', 'updated_at']


# 11) Reports
@admin.register(Report)
class ReportAdmin(ModelAdmin):
    list_display = ['report_type', 'title', 'generated_at', 'is_automated']
    list_filter = ['report_type', 'is_automated']
    search_fields = ['title']
    readonly_fields = ['data']
    ordering = ['-generated_at']


# 12) Report Schedules
@admin.register(ReportSchedule)
class ReportScheduleAdmin(ModelAdmin):
    list_display = ['name', 'report_type', 'frequency', 'is_active', 'last_run']
    list_filter = ['report_type', 'frequency', 'is_active']
    search_fields = ['name']