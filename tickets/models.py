from django.db import models

from django.db import models
from django.utils import timezone 

# 1) Ticket_category table
class TicketCategory(models.Model):
    """
    Ticket Category Model
    Groups tickets by IT problems
    Examples: Hardware, Sotware, network, security, emails, Database,
    website, user access
    """
    
    # name field
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Category name (e.g., Hardware, Software)"
    )
    #Description field
    description = models.TextField(
        blank=True,
        help_text="Brief description of this category"
    )
    
    # Icon field
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Image"
    )

    # color field
    color = models.CharField(
        max_length=20,
        default='#6c757d',
        help_text="Hex color code for UI (e.g., #dc3545 for red)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Is this category active and available?"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Ticket Category"
        verbose_name_plural = "Ticket Categories"
    
    def __str__(self):
        return self.name
    
    @property
    def ticket_count(self):
        """Count how many tickets are in this category"""
        return self.tickets.count()


# 2) Ticket_type Table
class TicketType(models.Model):
    """
    Ticket Type Model
    Classifies what kind of ticket it is
    Examples: Bug, Feature Request, Question, Incident, Maintenance
    """
    
    # name field
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Type name (e.g., Bug, Feature Request)"
    )
    #description 
    description = models.TextField(
        blank=True,
        help_text="Brief description of this type"
    )
    
    # icon
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="FontAwesome icon name (e.g., fa-bug, fa-star)"
    )
    #color
    color = models.CharField(
        max_length=20,
        default='#17a2b8',
        help_text="Hex color code for UI (e.g., #dc3545 for red)"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Is this type active and available?"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Ticket Type"
        verbose_name_plural = "Ticket Types"
    
    def __str__(self):
        return self.name
    
    @property
    def ticket_count(self):
        """Count how many tickets have this type"""
        return self.tickets.count()
    
# 3) Ticket Model

class Ticket(models.Model):
    """
    Ticket Model - Core of your ticketing system
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    # Priority choices
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    # Basic Information
    title = models.CharField(max_length=200, help_text="Brief summary of the issue")
    description = models.TextField(help_text="Detailed description of the problem")
    
    # Status and Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Relationships to Category and Type
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )
    type = models.ForeignKey(
        TicketType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )
    
    # User Relationships
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='created_tickets'
    )
    assigned_to = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status != 'resolved' and self.resolved_at:
            self.resolved_at = None
        super().save(*args, **kwargs)
    
    @property
    def is_open(self):
        return self.status in ['open', 'in_progress']
    
    @property
    def time_to_resolution(self):
        if self.resolved_at and self.created_at:
            return self.resolved_at - self.created_at
        return None
    
    @property
    def comment_count(self):
        return self.comments.count()
    

# 4) Ticket_comment table

class TicketComment(models.Model):
    """
    Ticket Comment Model
    Stores comments and updates on tickets
    """
    
    # Relationship to Ticket
    ticket = models.ForeignKey(
        'Ticket',  # String reference (Ticket model will be created later)
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The ticket this comment belongs to"
    )
    
    # Who wrote the comment
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        help_text="The user who wrote this comment"
    )
    
    # The comment text
    comment = models.TextField(
        help_text="The comment text"
    )
    
    # Timestamp
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the comment was posted"
    )
    
    class Meta:
        ordering = ['created_at']  # Oldest first
        verbose_name = "Ticket Comment"
        verbose_name_plural = "Ticket Comments"
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.ticket.title}"

