from django.core.management.base import BaseCommand
from django.utils import timezone
from tickets.reports import ReportGenerator
from tickets.models import Report

class Command(BaseCommand):
    help = 'Generate and save all reports'

    def handle(self, *args, **options):
        self.stdout.write('Generating reports...')
        
        # Generate daily summary
        daily_data = ReportGenerator.generate_daily_summary()
        Report.objects.create(
            report_type='daily_summary',
            title=f"Daily Summary - {timezone.now().strftime('%Y-%m-%d')}",
            data=daily_data,
            is_automated=True
        )
        self.stdout.write('Daily summary generated')
        
        # Generate weekly performance
        weekly_data = ReportGenerator.generate_weekly_performance()
        Report.objects.create(
            report_type='weekly_performance',
            title=f"Weekly Performance - Week {timezone.now().isocalendar()[1]}",
            data=weekly_data,
            is_automated=True
        )
        self.stdout.write('Weekly performance generated')
        
        # Generate SLA compliance
        sla_data = ReportGenerator.generate_sla_compliance()
        Report.objects.create(
            report_type='sla_compliance',
            title=f"SLA Compliance - {timezone.now().strftime('%Y-%m-%d')}",
            data=sla_data,
            is_automated=True
        )
        self.stdout.write('SLA compliance generated')
        
        # Generate agent workload
        workload_data = ReportGenerator.generate_agent_workload()
        Report.objects.create(
            report_type='agent_workload',
            title=f"Agent Workload - {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            data=workload_data,
            is_automated=True
        )
        self.stdout.write('Agent workload generated')
        
        self.stdout.write(self.style.SUCCESS('All reports generated successfully!'))