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

def classify_property_type(description, job_address):
    """Classify job based on property type: Commercial, Residential, Industrial, or Agricultural"""
    desc_lower = description.lower()
    address_lower = job_address.lower() if job_address else ""
    combined = f"{desc_lower} {address_lower}"

    # Commercial indicators
    commercial_keywords = [
        'qml', 'histology', 'laboratory', 'lab', 'medical', 'hospital', 'clinic',
        'office', 'commercial', 'business', 'shop', 'store', 'retail', 'restaurant',
        'hotel', 'motel', 'church', 'school', 'university', 'college', 'bank',
        'warehouse', 'factory', 'workshop', 'dealership', 'salon', 'pharmacy',
        'dental', 'veterinary', 'vet', 'gym', 'fitness', 'centre', 'center',
        'plaza', 'mall', 'building', 'complex', 'facility', 'premises',
        'tissue sample', 'blood bank', 'pathology', 'radiology', 'x-ray',
        'consulting room', 'consultation room', 'reception', 'waiting room',
        'boardroom', 'conference', 'meeting room', 'office block', 'tower',
        'industrial estate', 'business park', 'showroom', 'garage door.*roller',
        'commercial kitchen', 'cool room', 'freezer room', 'food prep'
    ]

    # Residential indicators
    residential_keywords = [
        'residence', 'home', 'house', 'unit', 'apartment', 'villa', 'townhouse',
        'bathroom', 'bedroom', 'kitchen', 'living room', 'lounge', 'dining',
        'laundry', 'ensuite', 'toilet', 'family room', 'study', 'garage',
        'shed.*home', 'domestic', 'private', 'personal', 'family', 'couple',
        'husband', 'wife', 'parkinson', 'elderly', 'disabled', 'wheelchair',
        'hot water.*home', 'pool', 'spa', 'deck', 'patio', 'verandah',
        'driveway', 'garden', 'backyard', 'front yard', 'fence', 'gate',
        'carport', 'granny flat', 'studio', 'cottage', 'cabin', 'duplex',
        'street', 'road', 'avenue', 'court', 'close', 'place', 'drive',
        'circuit', 'crescent', 'lane', 'way'
    ]

    # Industrial indicators
    industrial_keywords = [
        'factory', 'plant', 'mill', 'foundry', 'manufacturing', 'production',
        'assembly', 'processing', 'refinery', 'smelter', 'quarry', 'mine',
        'depot', 'distribution', 'logistics', 'freight', 'transport',
        'heavy machinery', 'crane', 'conveyor', 'pump station', 'compressor',
        'generator', 'transformer', 'substation', 'switchyard', 'control room',
        'boiler', 'furnace', 'kiln', 'press', 'industrial shed', 'loading dock',
        'chemical', 'pharmaceutical', 'textile', 'automotive', 'aerospace',
        'steel', 'aluminium', 'concrete', 'cement', 'oil', 'gas', 'petroleum'
    ]

    # Agricultural indicators
    agricultural_keywords = [
        'farm', 'farming', 'agricultural', 'agriculture', 'rural', 'pastoral',
        'property.*acres', 'property.*hectares', 'station', 'ranch', 'orchard',
        'vineyard', 'winery', 'dairy', 'cattle', 'sheep', 'pig', 'poultry',
        'chicken', 'turkey', 'duck', 'goose', 'livestock', 'animal', 'stable',
        'barn', 'silo', 'grain', 'wheat', 'corn', 'barley', 'oats', 'rice',
        'cotton', 'sugar', 'fruit', 'vegetable', 'crop', 'harvest', 'irrigation',
        'bore', 'pump.*water', 'tank.*water', 'trough', 'paddock', 'pasture',
        'field', 'acreage', 'rural property', 'country property', 'farming operation',
        'milking', 'shearing', 'feedlot', 'greenhouse', 'nursery.*plants'
    ]

    # Check for specific property type indicators
    if any(keyword in combined for keyword in commercial_keywords):
        return "Commercial"

    if any(keyword in combined for keyword in industrial_keywords):
        return "Industrial"

    if any(keyword in combined for keyword in agricultural_keywords):
        return "Agricultural"

    if any(keyword in combined for keyword in residential_keywords):
        return "Residential"

    # Default classification based on job characteristics
    # Shed work is often residential unless specified otherwise
    if 'shed' in desc_lower and not any(word in desc_lower for word in ['industrial', 'commercial', 'business']):
        return "Residential"

    # QML and medical work is commercial
    if any(word in desc_lower for word in ['qml', 'medical', 'hospital', 'clinic', 'lab']):
        return "Commercial"

    # Home assist programs are residential
    if 'home assist' in desc_lower:
        return "Residential"

    # Make safe work in residential areas
    if 'make safe' in desc_lower and any(word in desc_lower for word in ['home', 'house', 'residence']):
        return "Residential"

    # Default to residential for uncertain cases
    return "Residential"

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
        # All electrical work goes to Electrical category regardless of urgency
        # (urgency is now tracked separately in urgency_level field)
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

        # Classify work type, urgency, and property type
        work_type = classify_work_type(job['job_description'])
        urgency_level = classify_urgency_level(job['job_description'], job['status'], current_category)
        property_type = classify_property_type(job['job_description'], job.get('job_address', ''))

        # Determine recommended ServiceM8 category
        recommended_category = determine_recommended_category(work_type, urgency_level)

        results.append({
            'job_number': job['generated_job_id'],
            'current_category': current_category,
            'work_type': work_type,
            'urgency_level': urgency_level,
            'property_type': property_type,
            'recommended_category': recommended_category,
            'needs_change': current_category != recommended_category,
            'job_description_snippet': job['job_description'],
            'job_address': job.get('job_address', ''),
            'amount': job['total_invoice_amount'],
            'status': job['status'],
            'classification_logic': f"{work_type} + {urgency_level} + {property_type} → {recommended_category}"
        })

    # Sort by job number
    results.sort(key=lambda x: int(x['job_number']) if x['job_number'].isdigit() else float('inf'))

    # Save results
    with open('three_dimensional_job_classification.json', 'w') as f:
        json.dump(results, f, indent=2)

    # Create analysis summary
    work_type_counts = {}
    urgency_counts = {}
    property_type_counts = {}
    combination_counts = {}

    for result in results:
        work_type = result['work_type']
        urgency = result['urgency_level']
        prop_type = result['property_type']
        combo = f"{work_type} - {urgency} - {prop_type}"

        work_type_counts[work_type] = work_type_counts.get(work_type, 0) + 1
        urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1
        property_type_counts[prop_type] = property_type_counts.get(prop_type, 0) + 1
        combination_counts[combo] = combination_counts.get(combo, 0) + 1

    changes_needed = [r for r in results if r['needs_change']]

    # Order urgency by priority: Emergency, Urgent, Standard, Planned
    urgency_priority_order = ['Emergency', 'Urgent', 'Standard', 'Planned']
    urgency_ordered = {}
    for urgency in urgency_priority_order:
        if urgency in urgency_counts:
            urgency_ordered[urgency] = urgency_counts[urgency]

    summary = {
        'total_jobs': len(results),
        'jobs_needing_reclassification': len(changes_needed),
        'percentage_needing_change': round(len(changes_needed) / len(results) * 100, 1),
        'work_type_breakdown': dict(sorted(work_type_counts.items(), key=lambda x: x[1], reverse=True)),
        'urgency_breakdown': urgency_ordered,
        'property_type_breakdown': dict(sorted(property_type_counts.items(), key=lambda x: x[1], reverse=True)),
        'top_combinations': dict(sorted(combination_counts.items(), key=lambda x: x[1], reverse=True)[:20])
    }

    with open('three_dimensional_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"Three-dimensional analysis complete!")
    print(f"Total jobs analyzed: {summary['total_jobs']}")
    print(f"Jobs needing reclassification: {summary['jobs_needing_reclassification']} ({summary['percentage_needing_change']}%)")
    print(f"\nWork Type Breakdown:")
    for work_type, count in summary['work_type_breakdown'].items():
        print(f"  {work_type}: {count}")
    print(f"\nUrgency Breakdown:")
    for urgency, count in summary['urgency_breakdown'].items():
        print(f"  {urgency}: {count}")
    print(f"\nProperty Type Breakdown:")
    for prop_type, count in summary['property_type_breakdown'].items():
        print(f"  {prop_type}: {count}")

if __name__ == "__main__":
    main()