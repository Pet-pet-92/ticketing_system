from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import TicketCategory, TicketType, Ticket, TicketComment

 # 1) registering ticket category
@admin.register(TicketCategory)
class TicketCategoryAdmin(ModelAdmin):
    list_display = ['name', 'description', 'color', 'is_active', 'ticket_count', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
        ('Display Settings', {
            'fields': ('icon', 'color')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

# 2) Registering Ticket Type
@admin.register(TicketType)
class TicketTypeAdmin(ModelAdmin):
    list_display = ['name', 'description', 'color', 'is_active', 'ticket_count', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Type Information', {
            'fields': ('name', 'description')
        }),
        ('Display Settings', {
            'fields': ('icon', 'color')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

# 3) Registering TICKET 

@admin.register(Ticket)
class TicketAdmin(ModelAdmin):
    list_display = [
        'title', 'status', 'priority', 
        'category', 'type', 
        'created_by', 'assigned_to', 
        'created_at'
    ]
    list_filter = ['status', 'priority', 'category', 'type', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('title', 'description', 'status', 'priority')
        }),
        ('Classification', {
            'fields': ('category', 'type')
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )


# 4) TICKET COMMENT ADMIN (NEW)

@admin.register(TicketComment)
class TicketCommentAdmin(ModelAdmin):
    list_display = ['ticket', 'user', 'comment_preview', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['comment', 'user__username', 'ticket__title']
    readonly_fields = ['created_at']
    
    def comment_preview(self, obj):
        """Show first 50 characters of comment"""
        return obj.comment[:50] + "..." if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = "Comment Preview"
    
    fieldsets = (
        ('Comment Information', {
            'fields': ('ticket', 'user', 'comment')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )