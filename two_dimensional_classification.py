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

def classify_work_type(description):
    """Classify job based on the TYPE of work being done"""
    desc_lower = description.lower()

    # Make Safe work (safety-related)
    make_safe_keywords = [
        'make safe', 'makesafe', 'ms ', 'water entry', 'storm damage', 'flooding',
        'unsafe', 'lightning strike', 'burst pipe', 'hanging wire', 'power line',
        'isolate electric', 'secure electric', 'disconnect and secure', 'water damage',
        'electrical box.*unsafe', 'secure electricals'
    ]

    # Level Two work (service connections)
    level_two_keywords = [
        'level 2', 'level two', 'l2 ', 'service mains', 'overhead service',
        'meter connection', 'essential energy', 'reconnection', 'service fuse',
        'disconnect reconnect', 'relocate.*pole'
    ]

    # Solar/Battery work
    solar_keywords = [
        'solar', 'battery', 'inverter', 'pv', 'photovoltaic', 'renewable',
        'grid tie', 'standalone', 'off grid', 'panels', 'redback', 'fronius',
        'vaulta', 'noark', 'canadian solar'
    ]

    # Admin work
    admin_keywords = [
        'meeting', 'office time', 'quote', 'admin', 'certification', 'ndis',
        'paperwork', 'training', 'discuss.*taking on'
    ]

    # Security/CCTV work
    security_keywords = [
        'security', 'cctv', 'access control', 'starlink', 'camera', 'monitoring',
        'surveillance'
    ]

    # Data/Phone work
    data_keywords = [
        'data', 'phone', 'telecommunications', 'network', 'ethernet', 'cat6',
        'alarm test', 'communication', 'cabling.*monitoring', 'test alarm'
    ]

    # Air conditioning work
    ac_keywords = [
        'air.?condition', 'hvac', 'split system', 'cooling', 'heating',
        'mitsubishi.*air', 'ac unit', 'ac tech'
    ]

    # Check work types in priority order
    if any(keyword in desc_lower for keyword in make_safe_keywords):
        return "Make Safe"

    if any(keyword in desc_lower for keyword in level_two_keywords):
        return "Level Two"

    if any(keyword in desc_lower for keyword in solar_keywords):
        return "Solar/Battery"

    if any(keyword in desc_lower for keyword in admin_keywords):
        return "Admin"

    if any(keyword in desc_lower for keyword in security_keywords):
        return "Security/CCTV"

    if any(keyword in desc_lower for keyword in data_keywords):
        return "Data/Phone"

    if any(keyword in desc_lower for keyword in ac_keywords):
        return "Air Conditioning"

    # Default to Electrical for electrical work
    return "Electrical"

def classify_urgency_level(description, status, current_category):
    """Classify job based on the URGENCY level"""
    desc_lower = description.lower()

    # Emergency indicators (immediate response needed)
    emergency_keywords = [
        'emergency', 'asap', 'urgent.*parkinson', 'stopped working.*asap',
        'unsafe', 'hanging.*power line', 'lightning strike', 'burst pipe',
        'water.*saturated', 'no power', 'no hot water.*asap'
    ]

    # Urgent indicators (same day response)
    urgent_keywords = [
        'urgent', 'stopped working', 'not working', 'failed', 'fault',
        'breakdown', 'no power', 'no hot water', 'make safe', 'ms ',
        'pre.?approval limit'
    ]

    # Standard work indicators
    standard_keywords = [
        'install', 'fit off', 'supply.*install', 'stage [0-9]', 'rough in',
        'upgrade', 'replace.*service', 'compliance testing'
    ]

    # Planned work indicators
    planned_keywords = [
        'meeting', 'quote', 'admin', 'certification', 'stage.*works',
        'for full details.*attached', 'scheduled'
    ]

    # Check for Emergency first
    if any(keyword in desc_lower for keyword in emergency_keywords):
        return "Emergency"

    # Make Safe work is typically urgent
    if 'make safe' in desc_lower or 'ms ' in desc_lower:
        return "Urgent"

    # Check for general urgent indicators
    if any(keyword in desc_lower for keyword in urgent_keywords):
        return "Urgent"

    # Check for planned work
    if any(keyword in desc_lower for keyword in planned_keywords):
        return "Planned"

    # Check for standard installation work
    if any(keyword in desc_lower for keyword in standard_keywords):
        return "Standard"

    # Default based on current category
    if current_category == "Urgent":
        return "Urgent"
    elif current_category in ["Admin office time & Quotes"]:
        return "Planned"
    else:
        return "Standard"

def determine_recommended_category(work_type, urgency_level):
    """Determine recommended ServiceM8 category based on work type and urgency"""

    # Priority mapping based on work type
    if work_type == "Make Safe":
        return "Make Safe"
    elif work_type == "Level Two":
        return "Level Two"
    elif work_type == "Solar/Battery":
        return "Solar, Battery, Standalone"
    elif work_type == "Admin":
        return "Admin office time & Quotes"
    elif work_type == "Security/CCTV":
        return "Security, CCTV, Access control"
    elif work_type == "Data/Phone":
        return "Data, Phone"
    elif work_type == "Air Conditioning":
        return "AC install"
    elif work_type == "Electrical":
        # For electrical work, consider urgency
        if urgency_level in ["Emergency", "Urgent"]:
            return "Urgent"
        else:
            return "Electrical"
    else:
        return "Electrical"

def main():
    # Load the jobs data
    with open('company_jobs_array.json', 'r') as f:
        jobs = json.load(f)

    # Analyze each job
    results = []
    for job in jobs:
        current_category = CATEGORY_MAP.get(job['category_uuid'], 'Unknown')

        # Classify work type and urgency separately
        work_type = classify_work_type(job['job_description'])
        urgency_level = classify_urgency_level(job['job_description'], job['status'], current_category)

        # Determine recommended ServiceM8 category
        recommended_category = determine_recommended_category(work_type, urgency_level)

        results.append({
            'job_number': job['generated_job_id'],
            'current_category': current_category,
            'work_type': work_type,
            'urgency_level': urgency_level,
            'recommended_category': recommended_category,
            'needs_change': current_category != recommended_category,
            'job_description_snippet': job['job_description'][:200] + '...' if len(job['job_description']) > 200 else job['job_description'],
            'amount': job['total_invoice_amount'],
            'status': job['status'],
            'classification_logic': f"{work_type} + {urgency_level} → {recommended_category}"
        })

    # Sort by job number
    results.sort(key=lambda x: int(x['job_number']) if x['job_number'].isdigit() else float('inf'))

    # Save results
    with open('two_dimensional_job_classification.json', 'w') as f:
        json.dump(results, f, indent=2)

    # Create analysis summary
    work_type_counts = {}
    urgency_counts = {}
    combination_counts = {}

    for result in results:
        work_type = result['work_type']
        urgency = result['urgency_level']
        combo = f"{work_type} - {urgency}"

        work_type_counts[work_type] = work_type_counts.get(work_type, 0) + 1
        urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1
        combination_counts[combo] = combination_counts.get(combo, 0) + 1

    changes_needed = [r for r in results if r['needs_change']]

    summary = {
        'total_jobs': len(results),
        'jobs_needing_reclassification': len(changes_needed),
        'percentage_needing_change': round(len(changes_needed) / len(results) * 100, 1),
        'work_type_breakdown': dict(sorted(work_type_counts.items(), key=lambda x: x[1], reverse=True)),
        'urgency_breakdown': dict(sorted(urgency_counts.items(), key=lambda x: x[1], reverse=True)),
        'top_combinations': dict(sorted(combination_counts.items(), key=lambda x: x[1], reverse=True)[:15])
    }

    with open('two_dimensional_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"Two-dimensional analysis complete!")
    print(f"Total jobs analyzed: {summary['total_jobs']}")
    print(f"Jobs needing reclassification: {summary['jobs_needing_reclassification']} ({summary['percentage_needing_change']}%)")
    print(f"\nWork Type Breakdown:")
    for work_type, count in summary['work_type_breakdown'].items():
        print(f"  {work_type}: {count}")
    print(f"\nUrgency Breakdown:")
    for urgency, count in summary['urgency_breakdown'].items():
        print(f"  {urgency}: {count}")

if __name__ == "__main__":
    main()