import { AdaptiveRecommendation, CitizenAlert, RiskLevel, WardInfo } from './types.js';

export function getAdaptiveRecommendations(
  riskLevel: RiskLevel,
  ward: WardInfo,
  tempC: number,
  wbgt: number,
  userProfile?: {
    ageGroup?: string;
    isOutdoorWorker?: boolean;
    hasHealthCondition?: boolean;
  }
): AdaptiveRecommendation[] {
  const isVulnerable =
    userProfile?.ageGroup === 'Senior (65+)' ||
    userProfile?.ageGroup === 'Child (< 12)' ||
    userProfile?.hasHealthCondition;
  const isOutdoor = userProfile?.isOutdoorWorker;

  const recs: AdaptiveRecommendation[] = [];

  if (riskLevel === 'Extreme' || riskLevel === 'High') {
    recs.push({
      id: 'rec-1',
      priority: 'Immediate',
      category: 'Outdoor Activity',
      what: 'Halt all non-essential outdoor travel and strenuous physical exertion.',
      where: `${ward.highRiskAreas[0] || 'Unshaded public squares and asphalt corridors'} in ${ward.name}`,
      when: '12:00 PM – 04:30 PM (Peak solar and thermal radiation window)',
      why: `Wet Bulb Globe Temp is ${wbgt}°C, which exceeds human biological sweat evaporation thresholds. Core body temperature can rise dangerously within 25 minutes.`,
      actionButtonText: 'View High-Risk Zones on Map',
      actionRoute: 'map',
    });

    recs.push({
      id: 'rec-2',
      priority: 'Immediate',
      category: 'Cooling Centre',
      what: 'Utilize air-conditioned civic cooling sanctuaries for at least 45 minutes of thermal recovery.',
      where: `Shivajinagar Municipal Climate Shelter & ${ward.name} Civic Centre`,
      when: '1:00 PM – 5:00 PM or immediately upon experiencing dizziness, flushing, or headache',
      why: 'Rapid ambient temperature reduction prevents cellular heat shock proteins from degrading and restores cardiovascular equilibrium.',
      actionButtonText: 'Find Nearest Cooling Shelter',
      actionRoute: 'protection',
    });

    if (isOutdoor) {
      recs.push({
        id: 'rec-3',
        priority: 'Immediate',
        category: 'Outdoor Activity',
        what: 'Mandatory 15-minute rest breaks in deep shade for every 30 minutes of labor.',
        where: 'Covered arcades, shaded parks, or designated worker rest stations',
        when: 'All shift hours between 11:30 AM and 05:00 PM',
        why: 'Continuous metabolic heat generation in high humidity causes rapid dehydration and acute heat exhaustion.',
        actionButtonText: 'Locate Shaded Rest Arbours',
        actionRoute: 'protection',
      });
    }

    recs.push({
      id: 'rec-4',
      priority: 'Important',
      category: 'Hydration',
      what: 'Drink 300–400 ml of electrolyte-balanced water or ORS solution every 35 minutes.',
      where: 'Carry an insulated flask or refill at PMC municipal chilled kiosks',
      when: 'Continuously throughout the day, without waiting for the sensation of thirst',
      why: 'High thermal stress drains vital sodium and potassium electrolytes before thirst signals trigger in the brain.',
      actionButtonText: 'View Drinking Water Points',
      actionRoute: 'protection',
    });

    recs.push({
      id: 'rec-5',
      priority: 'Important',
      category: 'Shaded Route',
      what: 'Choose canopy-covered pedestrian routes with tree coverage rather than direct arterial roads.',
      where: `Mutha River greenway and park corridors connecting ${ward.name}`,
      when: 'Whenever travelling between 10:00 AM and 6:00 PM',
      why: 'Dense foliage shields up to 68% of solar radiation, reducing radiant temperature by 2.8°C to 4.2°C.',
      actionButtonText: 'Calculate Thermal-Safe Route',
      actionRoute: 'route',
    });
  } else {
    recs.push({
      id: 'rec-1',
      priority: 'Important',
      category: 'Hydration',
      what: 'Maintain routine hydration of at least 2.5 litres of water across the day.',
      where: 'Home, transit corridors, and work facilities',
      when: 'Morning through late evening',
      why: 'Dry atmospheric conditions and mild winds accelerate insensible water loss from the skin.',
      actionButtonText: 'View Water Points',
      actionRoute: 'protection',
    });

    recs.push({
      id: 'rec-2',
      priority: 'Advisory',
      category: 'Outdoor Activity',
      what: 'Schedule outdoor sports and heavy errands before 11:00 AM or after 5:30 PM.',
      where: `${ward.name} outdoor recreational facilities`,
      when: 'Early morning or dusk hours',
      why: 'Minimizes solar ultraviolet index exposure and optimizes cardiovascular comfort.',
      actionButtonText: 'View Thermal Stress Forecast',
      actionRoute: 'thermal',
    });
  }

  if (isVulnerable) {
    recs.push({
      id: 'rec-vuln',
      priority: 'Immediate',
      category: 'Vulnerable Care',
      what: 'Remain indoors in cross-ventilated or fan-cooled rooms; avoid midday cookstoves.',
      where: 'Residential interiors or ground-floor community centres',
      when: '11:00 AM – 5:00 PM',
      why: 'Seniors and individuals with chronic cardiovascular or respiratory conditions experience diminished thermoregulation capacity.',
      actionButtonText: 'View Healthcare & Emergency Centers',
      actionRoute: 'healthcare',
    });
  }

  return recs;
}

export function getCitizenAlerts(
  riskLevel: RiskLevel,
  ward: WardInfo,
  tempC: number
): CitizenAlert[] {
  const alerts: CitizenAlert[] = [
    {
      id: 'alert-hw-1',
      type: 'Heatwave alert',
      title: 'ORANGE HEATWAVE WARNING ISSUED FOR PUNE URBAN AGGLOMERATION',
      riskLevel: 'Extreme',
      whatIsHappening: `Severe heatwave conditions persisting across Pune district. Maximum daytime temperature expected to surge to ${Math.max(tempC, 39.5)}°C with intense solar irradiance.`,
      where: `${ward.name} and central commercial wards (Wards 14, 21, 18, 25)`,
      when: 'Today, 12:30 PM – 5:00 PM (Active Escalation)',
      whatToDoNext: [
        'Suspend non-critical outdoor labor and student outdoor activities.',
        'Drink chilled electrolyte fluids and avoid direct solar exposure.',
        'Access air-conditioned cooling centers if indoor temperatures exceed 33°C.',
        'Check in on vulnerable seniors living alone.',
      ],
      issuedAt: 'Updated 25 mins ago (IMD / PMC Disaster Management)',
      isRead: false,
      urgent: true,
      recommendedAction: 'Find Nearest Cooling Sanctuary',
    },
    {
      id: 'alert-prot-2',
      type: 'Protection warning',
      title: 'COOLING CAPACITY SURGE ACTIVATED IN WARD 14 & 21',
      riskLevel: 'High',
      whatIsHappening: 'Municipal emergency cooling hubs and RO water stations are now operating on high-demand protocols with free ORS packet distribution.',
      where: 'Shivajinagar Ghole Road Civic Center and Mandai Market Water Kiosks',
      when: '09:00 AM – 09:00 PM Daily',
      whatToDoNext: [
        'Visit cooling shelters to recharge phone and cool down core body temperature.',
        'Collect free oral rehydration salt packets at water refill counters.',
      ],
      issuedAt: 'Updated 1 hour ago',
      isRead: false,
      urgent: false,
      recommendedAction: 'View Available Protection Points',
    },
    {
      id: 'alert-loc-3',
      type: 'Location-specific safety advice',
      title: 'HIGH SURFACE TEMPERATURE ALERT: JM ROAD & FC ROAD CORRIDOR',
      riskLevel: 'High',
      whatIsHappening: 'Asphalt surface temperatures have exceeded 48°C due to unshaded commercial infrastructure, creating intense radiant thermal backscatter.',
      where: 'FC Road, JM Road, and Modern College Chowk',
      when: '1:00 PM – 4:30 PM',
      whatToDoNext: [
        'Use the Sambhaji Park parallel walking greenway instead of open asphalt sidewalks.',
        'Wear footwear with thick heat-insulating soles.',
      ],
      issuedAt: 'Updated 2 hours ago',
      isRead: true,
      urgent: false,
      recommendedAction: 'Switch to Thermal-Safe Route',
    },
  ];

  return alerts;
}
