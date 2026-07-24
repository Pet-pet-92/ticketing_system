from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Ticket

@login_required
def ticket_list(request):
    user = request.user
    
    # Check if user is admin or support agent
    if user.is_superuser or user.groups.filter(name='Support_Agent').exists():
        # Show ALL tickets
        tickets = Ticket.objects.all()
    else:
        # Show ONLY user's own tickets
        tickets = Ticket.objects.filter(created_by=user)
    
    context = {
        'tickets': tickets,
        'is_agent': user.groups.filter(name='Support_Agent').exists(),
        'is_admin': user.is_superuser,
    }
    return render(request, 'tickets/ticket_list.html', context)