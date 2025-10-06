// JavaScript to load the full dataset from JSON
async function loadFullJobData() {
    try {
        const response = await fetch('two_dimensional_job_classification.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading job data:', error);
        // Fallback to sample data if JSON file can't be loaded
        return loadSampleData();
    }
}

function loadSampleData() {
    // First 10 jobs as sample data
    return [
        {
            "job_number": "110",
            "current_category": "Urgent",
            "work_type": "Electrical",
            "urgency_level": "Emergency",
            "recommended_category": "Urgent",
            "needs_change": false,
            "job_description_snippet": "The electric hot water system has stopped working. They need hot water asap as her husband has Parkinson's disease.",
            "amount": "495.0000",
            "status": "Completed",
            "classification_logic": "Electrical + Emergency → Urgent"
        },
        {
            "job_number": "213",
            "current_category": "Urgent",
            "work_type": "Make Safe",
            "urgency_level": "Urgent",
            "recommended_category": "Make Safe",
            "needs_change": true,
            "job_description_snippet": "MS Electrical Power points not working. Pre-approval limit: $300 + GST for all works outlined above. Re: MAKE SAFE_JOB-19538",
            "amount": "438.9000",
            "status": "Completed",
            "classification_logic": "Make Safe + Urgent → Make Safe"
        },
        {
            "job_number": "221",
            "current_category": "Electrical",
            "work_type": "Electrical",
            "urgency_level": "Standard",
            "recommended_category": "Electrical",
            "needs_change": false,
            "job_description_snippet": "Re: 76 Howards Rd Darren's residence. Fit off new shed Light and power. Rough in high bay lights in gym area.",
            "amount": "6933.3700",
            "status": "Completed",
            "classification_logic": "Electrical + Standard → Electrical"
        },
        {
            "job_number": "236",
            "current_category": "Electrical",
            "work_type": "Electrical",
            "urgency_level": "Standard",
            "recommended_category": "Electrical",
            "needs_change": false,
            "job_description_snippet": "Stage 2 of Works.Darren's residence. Fit off new shed Light and power. Rough in high bay lights in gym area.",
            "amount": "4221.9400",
            "status": "Completed",
            "classification_logic": "Electrical + Standard → Electrical"
        },
        {
            "job_number": "267",
            "current_category": "Urgent",
            "work_type": "Make Safe",
            "urgency_level": "Urgent",
            "recommended_category": "Make Safe",
            "needs_change": true,
            "job_description_snippet": "The mandatory Requirements for this Order are: Photos Required = Yes Trade Report Required = Yes Solar Electrical Unit has stopped working",
            "amount": "275.0000",
            "status": "Completed",
            "classification_logic": "Make Safe + Urgent → Make Safe"
        },
        {
            "job_number": "1587",
            "current_category": "Solar, Battery, Standalone",
            "work_type": "Make Safe",
            "urgency_level": "Standard",
            "recommended_category": "Make Safe",
            "needs_change": true,
            "job_description_snippet": "Redback 14.kW Battery add on to existing system. Battery installation and programming.",
            "amount": "13328.8000",
            "status": "Unsuccessful",
            "classification_logic": "Make Safe + Standard → Make Safe"
        }
    ];
}