const DISTRICTS = {
  'Ariyalur': [11.14, 79.08], 'Chengalpattu': [12.69, 79.98], 'Chennai': [13.08, 80.27],
  'Coimbatore': [11.02, 76.96], 'Cuddalore': [11.75, 79.77], 'Dharmapuri': [12.13, 78.16],
  'Dindigul': [10.36, 77.98], 'Erode': [11.34, 77.72], 'Kallakurichi': [11.74, 78.96],
  'Kanchipuram': [12.83, 79.70], 'Kanyakumari': [8.09, 77.54], 'Karur': [10.96, 78.08],
  'Krishnagiri': [12.52, 78.21], 'Madurai': [9.93, 78.12], 'Mayiladuthurai': [11.10, 79.65],
  'Nagapattinam': [10.77, 79.84], 'Namakkal': [11.22, 78.17], 'Nilgiris': [11.41, 76.70],
  'Perambalur': [11.23, 78.88], 'Pudukkottai': [10.38, 78.82], 'Ramanathapuram': [9.37, 78.83],
  'Ranipet': [12.93, 79.33], 'Salem': [11.66, 78.15], 'Sivaganga': [9.85, 78.48],
  'Tenkasi': [8.96, 77.31], 'Thanjavur': [10.79, 79.14], 'Theni': [10.01, 77.48],
  'Thoothukudi': [8.76, 78.13], 'Tiruchirappalli': [10.79, 78.70], 'Tirunelveli': [8.71, 77.76],
  'Tirupathur': [12.50, 78.57], 'Tiruppur': [11.11, 77.34], 'Tiruvallur': [13.14, 79.91],
  'Tiruvannamalai': [12.23, 79.07], 'Tiruvarur': [10.77, 79.64], 'Vellore': [12.92, 79.13],
  'Viluppuram': [11.94, 79.49], 'Virudhunagar': [9.59, 77.96]
};

const DISTRICT_NAMES = Object.keys(DISTRICTS);

const findDistrict = (name) =>
  DISTRICT_NAMES.find((d) => d.toLowerCase() === String(name || '').trim().toLowerCase());

// Same district + booth always gives the same point
const resolveCoordinates = (districtName, boothNumber) => {
  const district = findDistrict(districtName);
  if (!district) return null;
  const [lat, lng] = DISTRICTS[district];
  let h = 0;
  const key = String(boothNumber || '').trim().toLowerCase();
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 1000;
  const dLat = ((h % 100) / 100 - 0.5) * 0.09;
  const dLng = ((Math.floor(h / 10) % 100) / 100 - 0.5) * 0.09;
  return { district, lat: +(lat + dLat).toFixed(5), lng: +(lng + dLng).toFixed(5) };
};

module.exports = { DISTRICT_NAMES, resolveCoordinates };