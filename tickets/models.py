from django.db import models
from django.utils import timezone
import datetime

# ============================================
# 1) TicketCategory Table
# ============================================
class TicketCategory(models.Model):
    """
    Ticket Category Model
    Groups tickets by IT problems
    Examples: Hardware, Software, network, security, emails, Database,
    website, user access
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Category name (e.g., Hardware, Software)"
    )
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Image"
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='#6c757d',
        help_text="Hex color code for UI"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this category active and available?"
    )
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
        return self.tickets.count()


# ============================================
# 2) TicketType Table
# ============================================
class TicketType(models.Model):
    """
    Ticket Type Model
    Classifies what kind of ticket it is
    Examples: Bug, Feature Request, Question, Incident, Maintenance
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Type name (e.g., Bug, Feature Request)"
    )
    description = models.TextField(
        blank=True,
        help_text="Brief description of this type"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="FontAwesome icon name (e.g., fa-bug, fa-star)"
    )
    color = models.CharField(
        max_length=20,
        null=True,
        default='#17a2b8',
        help_text="Hex color code for UI (e.g., #dc3545 for red)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this type active and available?"
    )
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
        return self.tickets.count()


# ============================================
# 3) PriorityRule Table
# ============================================
class PriorityRule(models.Model):
    """
    Configurable priority rule
    Admins can add/edit/delete these rules via admin panel
    """
    
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Category to match (leave blank for any)"
    )
    type = models.ForeignKey(
        TicketType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Type to match (leave blank for any)"
    )
    keyword = models.CharField(
        max_length=100,
        blank=True,
        help_text="Keyword to search for in description"
    )
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        help_text="Priority to assign"
    )
    order = models.IntegerField(
        default=0,
        help_text="Lower number = checked first"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this rule active?"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Priority Rule"
        verbose_name_plural = "Priority Rules"
    
    def __str__(self):
        parts = []
        if self.category:
            parts.append(f"Category={self.category.name}")
        if self.type:
            parts.append(f"Type={self.type.name}")
        if self.keyword:
            parts.append(f"Keyword='{self.keyword}'")
        parts.append(f"→ {self.get_priority_display()}")
        return " | ".join(parts)
    
    def matches(self, ticket):
        """Check if this rule matches a given ticket"""
        if self.category and ticket.category != self.category:
            return False
        if self.type and ticket.type != self.type:
            return False
        if self.keyword:
            if self.keyword.lower() not in ticket.description.lower():
                return False
        return True


# ============================================
# 4) SLA Table
# ============================================
class SLA(models.Model):
    """
    Service Level Agreement Model
    Defines response and resolution times per priority
    """
    
    name = models.CharField(
        max_length=100,
        help_text="Name of this SLA rule (e.g., 'Emergency SLA')"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this SLA rule"
    )
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        unique=True,
        help_text="Which priority level does this SLA apply to?"
    )
    response_time_minutes = models.IntegerField(
        help_text="Maximum minutes to first respond"
    )
    resolution_time_minutes = models.IntegerField(
        help_text="Maximum minutes to resolve"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this SLA rule active?"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['priority']
        verbose_name = "SLA Rule"
        verbose_name_plural = "SLA Rules"
    
    def __str__(self):
        return f"{self.name} ({self.get_priority_display()})"
    
    @property
    def response_time_display(self):
        return self._format_minutes(self.response_time_minutes)
    
    @property
    def resolution_time_display(self):
        return self._format_minutes(self.resolution_time_minutes)
    
    def _format_minutes(self, minutes):
        if minutes < 60:
            return f"{minutes} minute(s)"
        elif minutes < 1440:
            hours = minutes // 60
            mins = minutes % 60
            if mins == 0:
                return f"{hours} hour(s)"
            return f"{hours} hour(s) {mins} minute(s)"
        else:
            days = minutes // 1440
            hours = (minutes % 1440) // 60
            if hours == 0:
                return f"{days} day(s)"
            return f"{days} day(s) {hours} hour(s)"


# ============================================
# 5) Department Model
# ============================================
class Department(models.Model):
    """
    Department Model
    Tracks which department the ticket belongs to
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Department name (e.g., HR, Finance, IT)"
    )
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="FontAwesome icon name (e.g., fa-users, fa-building)"
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='#6c757d',
        help_text="Hex color code for UI"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this department active?"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Department"
        verbose_name_plural = "Departments"
    
    def __str__(self):
        return self.name
    
    @property
    def ticket_count(self):
        return self.tickets.count()


# ============================================
# 6) Ticket Table (Main)
# ============================================
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
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        editable=False,
        help_text="Automatically calculated priority"
    )
    
    # ============================================
    # TICKET NUMBER FIELD (NEW)
    # ============================================
    ticket_number = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text="Unique ticket number (e.g., T-H-001)"
    )
    
    # Relationships
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
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        help_text="Which department this ticket is from"
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
    
    # SLA Fields
    sla = models.ForeignKey(
        SLA,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        help_text="SLA rule applied to this ticket"
    )
    sla_response_deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Deadline for first response"
    )
    sla_resolution_deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Deadline for resolution"
    )
    sla_status = models.CharField(
        max_length=20,
        choices=[
            ('on_track', 'On Track'),
            ('at_risk', 'At Risk'),
            ('breached', 'Breached'),
        ],
        default='on_track',
        help_text="Current SLA status"
    )
    sla_response_breached = models.BooleanField(
        default=False,
        help_text="Has the response SLA been breached?"
    )
    sla_resolution_breached = models.BooleanField(
        default=False,
        help_text="Has the resolution SLA been breached?"
    )
    first_response_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When was the first response made?"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ticket Creation"
        verbose_name_plural = "Ticket Creation"
    
    def __str__(self):
        return f"{self.ticket_number or self.id} - {self.title} - {self.get_status_display()}"
    
    # ============================================
    # TICKET NUMBER GENERATION (NEW)
    # ============================================
    def generate_ticket_number(self):
        """
        Generate a unique ticket number
        Format: T-{category_code}-{sequential_number}
        Example: T-H-001 (Hardware ticket #1)
        """
        # Get category code
        category_code = 'GEN'  # Default
        
        if self.category and self.category.name:
            # Get the first letter of category, uppercase
            category_code = self.category.name[0].upper()
        
        # Get the last ticket number for this category
        prefix = f"T-{category_code}-"
        last_ticket = Ticket.objects.filter(
            ticket_number__startswith=prefix
        ).order_by('-ticket_number').first()
        
        if last_ticket and last_ticket.ticket_number:
            try:
                last_num = int(last_ticket.ticket_number.split('-')[-1])
                new_num = last_num + 1
            except (ValueError, IndexError):
                new_num = 1
        else:
            new_num = 1
        
        # Format with leading zeros (001, 002, etc.)
        return f"{prefix}{new_num:03d}"
    
    # ============================================
    # PROPERTIES
    # ============================================
    @property
    def is_open(self):
        """Check if ticket is still open (not resolved or closed)"""
        return self.status in ['open', 'in_progress']
    
    @property
    def comment_count(self):
        """Count how many comments this ticket has"""
        return self.comments.count()
    
    @property
    def time_to_resolution(self):
        """Calculate how long it took to resolve"""
        if self.resolved_at and self.created_at:
            return self.resolved_at - self.created_at
        return None
    
    # ============================================
    # PRIORITY AUTOMATION
    # ============================================
    def calculate_priority(self):
        """
        Automatically calculate priority using configurable rules.
        If no rules match, default to 'medium'.
        """
        rules = PriorityRule.objects.filter(is_active=True).order_by('order')
        
        for rule in rules:
            if rule.matches(self):
                return rule.priority
        
        return 'medium'
    
    # ============================================
    # OVERRIDE SAVE METHOD
    # ============================================
    def save(self, *args, **kwargs):
        """Auto-assign priority, apply SLA, generate ticket number, and assign to agent"""
        
        is_new = not self.pk or self._state.adding
        
        # 1. Generate ticket number for new tickets
        if is_new and not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
        
        # 2. Auto-calculate priority for new tickets
        if is_new:
            self.priority = self.calculate_priority()
            self.apply_sla()
        else:
            # Check if priority changed
            try:
                original = Ticket.objects.get(pk=self.pk)
                if original.priority != self.priority:
                    self.apply_sla()
            except Ticket.DoesNotExist:
                pass
        
        # 3. Handle resolved_at
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status != 'resolved' and self.resolved_at:
            self.resolved_at = None
        
        # 4. Save the ticket first (so it has an ID)
        super().save(*args, **kwargs)
        
        # 5. Auto-assign ONLY if it's a new ticket and not already assigned
        if is_new and not self.assigned_to:
            self.assign_ticket()
            if self.assigned_to:
                super().save(update_fields=['assigned_to'])
    
    # ============================================
    # SLA METHODS
    # ============================================
    def apply_sla(self):
        """
        Apply SLA rules to this ticket based on its priority.
        Called when ticket is created or priority changes.
        """
        try:
            sla_rule = SLA.objects.get(priority=self.priority, is_active=True)
            self.sla = sla_rule
            
            now = timezone.now()
            self.sla_response_deadline = now + datetime.timedelta(minutes=sla_rule.response_time_minutes)
            self.sla_resolution_deadline = now + datetime.timedelta(minutes=sla_rule.resolution_time_minutes)
            self.sla_status = 'on_track'
            self.sla_response_breached = False
            self.sla_resolution_breached = False
            
            return True
            
        except SLA.DoesNotExist:
            self.sla = None
            self.sla_response_deadline = None
            self.sla_resolution_deadline = None
            self.sla_status = 'on_track'
            self.sla_response_breached = False
            self.sla_resolution_breached = False
            return False
    
    def update_sla_status(self):
        """
        Update the SLA status based on current time.
        Called periodically or on ticket view.
        """
        if not self.sla_response_deadline or not self.sla_resolution_deadline:
            return
        
        now = timezone.now()
        
        if not self.sla_response_breached:
            if now > self.sla_response_deadline:
                self.sla_response_breached = True
        
        if not self.sla_resolution_breached:
            if now > self.sla_resolution_deadline:
                self.sla_resolution_breached = True
        
        if self.sla_response_breached or self.sla_resolution_breached:
            self.sla_status = 'breached'
        elif self._is_at_risk():
            self.sla_status = 'at_risk'
        else:
            self.sla_status = 'on_track'
        
        self.save()
    
    def _is_at_risk(self):
        """Check if ticket is at risk of breaching SLA (80% of time used)"""
        if not self.sla_response_deadline or not self.sla_resolution_deadline:
            return False
        
        now = timezone.now()
        
        response_total = (self.sla_response_deadline - self.created_at).total_seconds()
        response_used = (now - self.created_at).total_seconds()
        
        resolution_total = (self.sla_resolution_deadline - self.created_at).total_seconds()
        resolution_used = (now - self.created_at).total_seconds()
        
        if response_total > 0 and response_used / response_total >= 0.8:
            return True
        if resolution_total > 0 and resolution_used / resolution_total >= 0.8:
            return True
        
        return False
    
    def set_first_response(self, user):
        """Record the first response time for SLA tracking."""
        if not self.first_response_at and user != self.created_by:
            self.first_response_at = timezone.now()
            self.save()
    
    # ============================================
    # ASSIGNMENT LOGIC
    # ============================================
    def assign_ticket(self):
        """
        Automatically assign a ticket to the best available agent.
        Uses: Availability → Skill-Based → Least Busy
        """
        from django.contrib.auth.models import User
        from .models import AgentAvailability, AgentSkill
        
        # Step 1: Get all agents who can take tickets
        available_agents = AgentAvailability.objects.filter(
            is_active=True,
            status__in=['available', 'busy']
        )
        
        # Filter agents who have not reached max workload
        eligible_agents = []
        for availability in available_agents:
            if availability.can_take_tickets:
                eligible_agents.append(availability.agent)
        
        if not eligible_agents:
            return False
        
        # Step 2: Skill-Based Filtering
        skilled_agents = []
        if self.category:
            for agent in eligible_agents:
                has_skill = AgentSkill.objects.filter(
                    agent=agent,
                    category=self.category
                ).exists()
                if has_skill:
                    skilled_agents.append(agent)
        
        if not skilled_agents:
            skilled_agents = eligible_agents
        
        # Step 3: Least Busy — pick the agent with the fewest tickets
        best_agent = None
        lowest_load = None
        
        for agent in skilled_agents:
            ticket_count = Ticket.objects.filter(
                assigned_to=agent,
                status__in=['open', 'in_progress']
            ).count()
            
            if lowest_load is None or ticket_count < lowest_load:
                lowest_load = ticket_count
                best_agent = agent
        
        # Assign the ticket
        if best_agent:
            self.assigned_to = best_agent
            
            try:
                availability = AgentAvailability.objects.get(agent=best_agent)
                availability.last_assigned_at = timezone.now()
                availability.save()
            except AgentAvailability.DoesNotExist:
                pass
            
            self.save()
            return True
        
        return False


# ============================================
# 7) TicketComment Table
# ============================================
class TicketComment(models.Model):
    """
    Ticket Comment Model
    Stores comments and updates on tickets
    """
    
    ticket = models.ForeignKey(
        'Ticket',
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The ticket this comment belongs to"
    )
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        help_text="The user who wrote this comment"
    )
    comment = models.TextField(
        help_text="The comment text"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the comment was posted"
    )
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Ticket Comment"
        verbose_name_plural = "Ticket Comments"
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.ticket.title}"


# ============================================
# 8) AgentSkill Model
# ============================================
class AgentSkill(models.Model):
    """
    Skills that agents possess
    Matches with ticket categories
    """
    
    agent = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='skills',
        help_text="The agent with this skill"
    )
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.CASCADE,
        related_name='skilled_agents',
        help_text="The category this agent is skilled in"
    )
    proficiency = models.IntegerField(
        default=5,
        choices=[(i, i) for i in range(1, 11)],
        help_text="Proficiency level (1-10)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['agent', 'category']
        verbose_name = "Agent Skill"
        verbose_name_plural = "Agent Skills"
        ordering = ['agent__username', 'category__name']
    
    def __str__(self):
        return f"{self.agent.username} - {self.category.name} (Level {self.proficiency})"


# ============================================
# 9) AgentAvailability Model
# ============================================
class AgentAvailability(models.Model):
    """
    Tracks agent availability and workload
    """
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('on_break', 'On Break'),
        ('in_meeting', 'In Meeting'),
        ('offline', 'Offline'),
        ('sick', 'Sick'),
    ]
    
    agent = models.OneToOneField(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='availability',
        help_text="The agent"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        help_text="Current availability status"
    )
    max_ticket_load = models.IntegerField(
        default=10,
        help_text="Maximum number of open tickets this agent can handle"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Is this agent actively taking tickets?"
    )
    last_assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this agent was last assigned a ticket"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Agent Availability"
        verbose_name_plural = "Agent Availability"
    
    def __str__(self):
        return f"{self.agent.username} - {self.get_status_display()}"
    
    @property
    def current_workload(self):
        """Count of open tickets assigned to this agent"""
        return Ticket.objects.filter(
            assigned_to=self.agent,
            status__in=['open', 'in_progress']
        ).count()
    
    @property
    def can_take_tickets(self):
        """Check if agent can take new tickets"""
        if not self.is_active:
            return False
        if self.status not in ['available', 'busy']:
            return False
        if self.current_workload >= self.max_ticket_load:
            return False
        return True


# ============================================
# 10) AssignmentRule Model
# ============================================
class AssignmentRule(models.Model):
    """
    Configurable rules for automated assignment
    """
    
    STRATEGY_CHOICES = [
        ('least_busy', 'Least Busy'),
        ('round_robin', 'Round Robin'),
        ('skill_based', 'Skill Based'),
    ]
    
    name = models.CharField(max_length=100)
    strategy = models.CharField(max_length=20, choices=STRATEGY_CHOICES, default='least_busy')
    priority = models.CharField(
        max_length=20,
        choices=Ticket.PRIORITY_CHOICES,
        null=True,
        blank=True,
        help_text="Apply this rule only to this priority (leave blank for all)"
    )
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Apply this rule only to this category (leave blank for all)"
    )
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Assignment Rule"
        verbose_name_plural = "Assignment Rules"
    
    def __str__(self):
        return f"{self.name} ({self.get_strategy_display()})"


# ============================================
# 11) Report Model
# ============================================
class Report(models.Model):
    """
    Stores generated reports for historical reference
    """
    
    REPORT_TYPES = [
        ('daily_summary', 'Daily Summary'),
        ('weekly_performance', 'Weekly Performance'),
        ('sla_compliance', 'SLA Compliance'),
        ('agent_workload', 'Agent Workload'),
    ]
    
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    data = models.JSONField(default=dict, help_text="The actual report data")
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_reports'
    )
    is_automated = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-generated_at']
        verbose_name = "Report"
        verbose_name_plural = "Reports"
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.generated_at.strftime('%Y-%m-%d %H:%M')}"


# ============================================
# 12) ReportSchedule Model
# ============================================
class ReportSchedule(models.Model):
    """
    Schedules automated reports
    """
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('hourly', 'Hourly'),
    ]
    
    report_type = models.CharField(max_length=30, choices=Report.REPORT_TYPES)
    name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    send_to = models.ManyToManyField(
        'auth.User',
        related_name='subscribed_reports',
        help_text="Users who receive this report"
    )
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Report Schedule"
        verbose_name_plural = "Report Schedules"
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"