/**
 * Mock fixture data for the Moondock demo.
 * Used by MSW handlers when VITE_MOCK_API=true.
 */

// ─── Trips (Plan a Trip / Trip History) ──────────────────────────────────────

export const MOCK_TRIPS = [
  {
    id: 1,
    name: 'Hocking Hills Weekend',
    provider: 'OhioStateParks',
    campgroundId: '458',
    campgroundName: 'Hocking Hills State Park',
    recAreaId: '',
    recAreaName: '',
    startDate: '2026-08-15',
    endDate: '2026-08-17',
    nights: 2,
    status: 'Planned',
    notes: 'Need to pack bear canister. Check trail conditions before leaving.',
    checklistJson: JSON.stringify([
      { id: 'c1', text: 'Pack bear canister', done: true },
      { id: 'c2', text: 'Check trail conditions', done: false },
      { id: 'c3', text: 'Fill water filter', done: false },
      { id: 'c4', text: 'Download offline maps', done: true },
    ]),
    createdAt: '2026-07-01T14:00:00Z',
    updatedAt: '2026-07-04T09:30:00Z',
  },
  {
    id: 2,
    name: 'Salt Fork Fishing Trip',
    provider: 'OhioStateParks',
    campgroundId: '612',
    campgroundName: 'Salt Fork State Park',
    recAreaId: '',
    recAreaName: '',
    startDate: '2026-07-04',
    endDate: '2026-07-06',
    nights: 2,
    status: 'Completed',
    notes: 'Bass were biting near the east cove. Site B-04 had good shade.',
    checklistJson: JSON.stringify([
      { id: 'c1', text: 'Fishing license', done: true },
      { id: 'c2', text: 'Ice for cooler', done: true },
      { id: 'c3', text: 'Firewood permit', done: true },
    ]),
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-07-07T08:00:00Z',
  },
  {
    id: 3,
    name: 'Wayne National Forest Backpack',
    provider: 'RecreationDotGov',
    campgroundId: '1079',
    campgroundName: 'Wayne National Forest — Burr Oak',
    recAreaId: '1150',
    recAreaName: 'Wayne National Forest',
    startDate: '2026-09-20',
    endDate: '2026-09-23',
    nights: 3,
    status: 'Planned',
    notes: 'Three-night loop on the Wildcat Hollow trail.',
    checklistJson: JSON.stringify([
      { id: 'c1', text: 'Permit printed', done: false },
      { id: 'c2', text: 'Water treatment tabs', done: false },
      { id: 'c3', text: 'Emergency beacon charged', done: false },
    ]),
    createdAt: '2026-07-05T16:00:00Z',
    updatedAt: '2026-07-05T16:00:00Z',
  },
  {
    id: 4,
    name: 'Mohican Memorial Day',
    provider: 'OhioStateParks',
    campgroundId: '471',
    campgroundName: 'Mohican State Park',
    recAreaId: '',
    recAreaName: '',
    startDate: '2026-05-24',
    endDate: '2026-05-27',
    nights: 3,
    status: 'Cancelled',
    notes: 'Cancelled due to flooding. Will rebook in September.',
    checklistJson: '[]',
    createdAt: '2026-04-10T11:00:00Z',
    updatedAt: '2026-05-22T07:45:00Z',
  },
];

// ─── Outings (Trip Log / Field Journal) ──────────────────────────────────────

export const MOCK_OUTINGS = [
  {
    id: 1,
    tripId: 2,
    tripName: 'Salt Fork Fishing Trip',
    date: '2026-07-04',
    title: 'Arrival & First Cast',
    body: 'Set up camp at B-04 by 3pm. The lake was glassy. Caught two largemouth bass before sunset from the eastern cove. Fire ring in great shape. Skies clear.',
    mood: 'Great',
    weather: 'Sunny, 82°F',
    photoUrls: [],
    createdAt: '2026-07-04T21:00:00Z',
  },
  {
    id: 2,
    tripId: 2,
    tripName: 'Salt Fork Fishing Trip',
    date: '2026-07-05',
    title: 'Early Morning Kayak',
    body: 'Out on the water at 6am. Fog lifted around 7:30. Spotted a great blue heron hunting the shallows. Managed five fish before the heat set in. Broke camp slowly in the afternoon.',
    mood: 'Great',
    weather: 'Partly cloudy, 78°F',
    photoUrls: [],
    createdAt: '2026-07-05T20:00:00Z',
  },
  {
    id: 3,
    tripId: null,
    tripName: null,
    date: '2026-06-14',
    title: 'Day Hike — Old Man\'s Cave',
    body: 'Solo day hike through the gorge. Hemlock grove still lush. The recess cave was packed with weekend visitors but worth it. Approximately 7 miles round trip.',
    mood: 'Good',
    weather: 'Overcast, 70°F',
    photoUrls: [],
    createdAt: '2026-06-14T18:30:00Z',
  },
];

// ─── Campsites (Search Results) ───────────────────────────────────────────────

export const MOCK_CAMPSITES = [
  {
    id: 1, campgroundName: 'Hocking Hills State Park', campgroundId: '458',
    provider: 'OhioStateParks', siteId: 'A-12', siteType: 'WALK_IN',
    siteTypeLabel: 'Walk-In', isReservable: true, loop: 'WALK-IN LOOP A',
    checkIn: '2026-08-15', checkOut: '2026-08-17', nights: 2,
    bookingUrl: 'https://ohiostateparks.reserveamerica.com/campsite/458',
    receivedAt: new Date().toISOString(), status: 'New', matchScore: 94,
  },
  {
    id: 2, campgroundName: 'Salt Fork State Park', campgroundId: '612',
    provider: 'OhioStateParks', siteId: 'B-04', siteType: 'STANDARD_ELECTRIC',
    siteTypeLabel: 'Standard / Electric', isReservable: true, loop: 'LOOP B',
    checkIn: '2026-08-15', checkOut: '2026-08-17', nights: 2,
    bookingUrl: 'https://ohiostateparks.reserveamerica.com/campsite/612',
    receivedAt: new Date().toISOString(), status: 'New', matchScore: 78,
  },
  {
    id: 3, campgroundName: 'Wayne National Forest — Burr Oak', campgroundId: '1079',
    provider: 'RecreationDotGov', siteId: 'C-07', siteType: 'WOODED_NONELECTRIC',
    siteTypeLabel: 'Wooded / Non-electric', isReservable: false, loop: 'HEMLOCK RIDGE',
    checkIn: '2026-08-15', checkOut: '2026-08-18', nights: 3,
    bookingUrl: 'https://www.recreation.gov/camping/campsites/1079',
    receivedAt: new Date().toISOString(), status: 'Interested', matchScore: 91,
  },
  {
    id: 4, campgroundName: 'Mohican State Park', campgroundId: '471',
    provider: 'OhioStateParks', siteId: 'D-02', siteType: 'STANDARD_NONELECTRIC',
    siteTypeLabel: 'Standard / Non-electric', isReservable: true, loop: 'GORGE LOOP',
    checkIn: '2026-08-15', checkOut: '2026-08-17', nights: 2,
    bookingUrl: 'https://ohiostateparks.reserveamerica.com/campsite/471',
    receivedAt: new Date().toISOString(), status: 'New', matchScore: 65,
  },
  {
    id: 5, campgroundName: 'Tar Hollow State Forest', campgroundId: '823',
    provider: 'OhioStateParks', siteId: 'A-03', siteType: 'PRIMITIVE',
    siteTypeLabel: 'Primitive', isReservable: true, loop: 'PINE LOOP',
    checkIn: '2026-08-15', checkOut: '2026-08-17', nights: 2,
    bookingUrl: 'https://ohiostateparks.reserveamerica.com/campsite/823',
    receivedAt: new Date().toISOString(), status: 'New', matchScore: 88,
  },
  {
    id: 6, campgroundName: 'Lake Hope State Park', campgroundId: '516',
    provider: 'OhioStateParks', siteId: 'B-11', siteType: 'LAKEFRONT',
    siteTypeLabel: 'Lakefront', isReservable: true, loop: 'LAKESIDE LOOP',
    checkIn: '2026-08-15', checkOut: '2026-08-18', nights: 3,
    bookingUrl: 'https://ohiostateparks.reserveamerica.com/campsite/516',
    receivedAt: new Date().toISOString(), status: 'New', matchScore: 97,
  },
];

// ─── Campground seed data (CamplyPicker) ─────────────────────────────────────

export const MOCK_CAMPGROUND_SEEDS: Record<string, { items: { id: string; label: string; sublabel?: string }[] }> = {
  OhioStateParks: {
    items: [
      { id: '458', label: 'Hocking Hills State Park', sublabel: 'Logan, OH' },
      { id: '612', label: 'Salt Fork State Park', sublabel: 'Cambridge, OH' },
      { id: '471', label: 'Mohican State Park', sublabel: 'Loudonville, OH' },
      { id: '516', label: 'Lake Hope State Park', sublabel: 'McArthur, OH' },
      { id: '823', label: 'Tar Hollow State Forest', sublabel: 'Laurelville, OH' },
      { id: '388', label: 'Findley State Park', sublabel: 'Wellington, OH' },
      { id: '504', label: 'John Bryan State Park', sublabel: 'Yellow Springs, OH' },
    ],
  },
  RecreationDotGov: {
    items: [
      { id: '1079', label: 'Burr Oak Cove Campground', sublabel: 'Wayne NF, OH' },
      { id: '1150', label: 'Lamping Homestead', sublabel: 'Wayne NF, OH' },
      { id: '2201', label: 'Vesuvius Recreation Area', sublabel: 'Wayne NF, OH' },
      { id: '2540', label: 'Iron Ridge Campground', sublabel: 'Wayne NF, OH' },
    ],
  },
  Reserveamerica: {
    items: [
      { id: '73984', label: 'Douthat State Park', sublabel: 'Millboro, VA' },
      { id: '73985', label: 'Hungry Mother State Park', sublabel: 'Marion, VA' },
      { id: '73990', label: 'Fairy Stone State Park', sublabel: 'Stuart, VA' },
    ],
  },
  Usedirect: {
    items: [
      { id: '90010', label: 'Promised Land State Park', sublabel: 'Greentown, PA' },
      { id: '90011', label: 'Hickory Run State Park', sublabel: 'White Haven, PA' },
    ],
  },
};

// ─── Recreation area seed data ────────────────────────────────────────────────

export const MOCK_REC_AREA_SEEDS: Record<string, { items: { id: string; label: string; sublabel?: string }[] }> = {
  OhioStateParks: {
    items: [
      { id: 'ra-hocking', label: 'Hocking Hills Region', sublabel: 'Logan County, OH' },
      { id: 'ra-mohican', label: 'Mohican Country', sublabel: 'Ashland County, OH' },
    ],
  },
  RecreationDotGov: {
    items: [
      { id: '1150', label: 'Wayne National Forest', sublabel: 'Ohio' },
      { id: '2710', label: 'Shawnee National Forest', sublabel: 'Illinois' },
    ],
  },
  Reserveamerica: { items: [] },
  Usedirect: { items: [] },
};
