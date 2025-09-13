"""
Management command to run anomaly detection
"""
from django.core.management.base import BaseCommand
from core.services import AnomalyDetectionService, TrustScoreCalculator
from core.models import Department


class Command(BaseCommand):
    help = 'Run anomaly detection and trust score calculations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--anomaly-detection',
            action='store_true',
            help='Run anomaly detection',
        )
        parser.add_argument(
            '--trust-scores',
            action='store_true',
            help='Calculate trust scores',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all services',
        )
    
    def handle(self, *args, **options):
        if options['all'] or options['anomaly_detection']:
            self.stdout.write('Running anomaly detection...')
            results = AnomalyDetectionService.run_all_detections()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Anomaly detection completed. Found {results["total_detected"]} anomalies:'
                )
            )
            self.stdout.write(f'  - Budget overruns: {len(results["budget_overruns"])}')
            self.stdout.write(f'  - Unusual spending: {len(results["unusual_spending"])}')
            self.stdout.write(f'  - Delayed projects: {len(results["delayed_projects"])}')
        
        if options['all'] or options['trust_scores']:
            self.stdout.write('Calculating trust scores...')
            
            departments = Department.objects.all()
            for department in departments:
                trust_indicator = TrustScoreCalculator.calculate_department_trust_score(department)
                self.stdout.write(
                    f'  - {department.name}: {trust_indicator.overall_score}/100'
                )
            
            self.stdout.write(
                self.style.SUCCESS('Trust score calculation completed.')
            )
