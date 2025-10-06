#!/usr/bin/env python3
import json
import re

# Define category mapping
CATEGORY_MAP = {
    "": "No Category Assigned",
    "e459d11f-e77e-4b57-9daf-1f4c5f8aa52b": "Urgent",
    "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb": "Electrical",
    "4e7b2af8-44a8-4570-b4cc-20deaa28a65b": "Make Safe",
    "080733e2-a30a-4553-9e40-1f47cec7f6cb": "Solar, Battery, Standalone",
    "5f08a40b-f578-465d-b3ee-1f4c5e4d900b": "Admin office time & Quotes",
    "cfc84630-8c27-48cc-b6aa-1f47cfefaffb": "Level Two",
    "75a20c1b-bc57-4251-92cf-21eca071128b": "Security, CCTV, Access control",
    "067bdf55-7332-4103-9f72-1f4c5e18c70b": "Data, Phone"
}

def classify_job_by_description(description, current_category):
    """Classify job based on description content"""
    desc_lower = description.lower()

    # Make Safe indicators (highest priority for safety)
    make_safe_keywords = [
        'make safe', 'makesafe', 'ms ', 'water entry', 'storm damage', 'flooding',
        'unsafe', 'lightning strike', 'burst pipe', 'hanging wire', 'power line',
        'isolate electric', 'secure electric', 'disconnect', 'water damage'
    ]

    # Urgent/Emergency indicators
    urgent_keywords = [
        'urgent', 'emergency', 'asap', 'stopped working', 'not working', 'failed',
        'no power', 'no hot water', 'fault', 'breakdown', 'immediate'
    ]

    # Solar/Battery indicators
    solar_keywords = [
        'solar', 'battery', 'inverter', 'pv', 'photovoltaic', 'renewable',
        'grid tie', 'standalone', 'off grid', 'panels'
    ]

    # Level Two indicators
    level_two_keywords = [
        'level 2', 'level two', 'l2 ', 'service mains', 'overhead service',
        'meter connection', 'essential energy', 'reconnection', 'service fuse'
    ]

    # Admin indicators
    admin_keywords = [
        'meeting', 'office time', 'quote', 'admin', 'certification', 'ndis',
        'paperwork', 'training'
    ]

    # Security/CCTV indicators
    security_keywords = [
        'security', 'cctv', 'access control', 'starlink', 'camera', 'alarm system',
        'monitoring'
    ]

    # Data/Phone indicators
    data_keywords = [
        'data', 'phone', 'telecommunications', 'network', 'ethernet', 'cat6',
        'alarm test', 'communication'
    ]

    # Commercial/Medical facility indicators
    commercial_keywords = [
        'qml', 'histology', 'tissue sample', 'bench', 'commercial', 'facility',
        'office', 'medical'
    ]

    # Check for Make Safe (highest priority)
    if any(keyword in desc_lower for keyword in make_safe_keywords):
        return "Make Safe"

    # Check for Level Two work
    if any(keyword in desc_lower for keyword in level_two_keywords):
        return "Level Two"

    # Check for Solar/Battery
    if any(keyword in desc_lower for keyword in solar_keywords):
        return "Solar, Battery, Standalone"

    # Check for Admin work
    if any(keyword in desc_lower for keyword in admin_keywords):
        return "Admin office time & Quotes"

    # Check for Security/CCTV
    if any(keyword in desc_lower for keyword in security_keywords):
        return "Security, CCTV, Access control"

    # Check for Data/Phone
    if any(keyword in desc_lower for keyword in data_keywords):
        return "Data, Phone"

    # Check for Urgent (emergency situations)
    if any(keyword in desc_lower for keyword in urgent_keywords):
        return "Urgent"

    # Check for commercial/medical work (often miscategorized)
    if any(keyword in desc_lower for keyword in commercial_keywords):
        return "Electrical"  # Commercial electrical work

    # Default to general electrical for electrical work
    electrical_keywords = [
        'wiring', 'power point', 'lighting', 'switch', 'gpo', 'circuit',
        'electrical', 'install', 'fit off', 'power supply'
    ]

    if any(keyword in desc_lower for keyword in electrical_keywords):
        return "Electrical"

    # If unclear, keep current category if it makes sense, otherwise suggest electrical
    if current_category in ["Electrical", "Urgent"]:
        return current_category

    return "Electrical"  # Default fallback

def main():
    # Load the jobs data
    with open('company_jobs_array.json', 'r') as f:
        jobs = json.load(f)

    # Analyze each job
    results = []
    for job in jobs:
        current_category = CATEGORY_MAP.get(job['category_uuid'], 'Unknown')
        recommended_category = classify_job_by_description(job['job_description'], current_category)

        results.append({
            'job_number': job['generated_job_id'],
            'current_category': current_category,
            'recommended_category': recommended_category,
            'needs_change': current_category != recommended_category,
            'job_description_snippet': job['job_description'][:150] + '...' if len(job['job_description']) > 150 else job['job_description'],
            'amount': job['total_invoice_amount'],
            'status': job['status']
        })

    # Sort by job number
    results.sort(key=lambda x: int(x['job_number']) if x['job_number'].isdigit() else float('inf'))

    # Save results
    with open('job_reclassification_recommendations.json', 'w') as f:
        json.dump(results, f, indent=2)

    # Create summary
    changes_needed = [r for r in results if r['needs_change']]
    summary = {
        'total_jobs': len(results),
        'jobs_needing_reclassification': len(changes_needed),
        'percentage_needing_change': round(len(changes_needed) / len(results) * 100, 1),
        'changes_by_category': {}
    }

    for change in changes_needed:
        key = f"{change['current_category']} -> {change['recommended_category']}"
        summary['changes_by_category'][key] = summary['changes_by_category'].get(key, 0) + 1

    with open('reclassification_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"Analysis complete!")
    print(f"Total jobs analyzed: {summary['total_jobs']}")
    print(f"Jobs needing reclassification: {summary['jobs_needing_reclassification']} ({summary['percentage_needing_change']}%)")

if __name__ == "__main__":
    main()