import lakeSuite from "@/assets/room-lake-suite.jpg";
import gardenVilla from "@/assets/room-garden-villa.jpg";
import penthouse from "@/assets/room-penthouse.jpg";
const deluxe = "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80"; // garden-view bedroom
import expBoat from "@/assets/exp-boat.jpg";
import expChef from "@/assets/exp-chef.jpg";
import expRose from "@/assets/exp-lavender.jpg";
import expWine from "@/assets/exp-wine.jpg";

export type Room = {
  id: string;
  name: string;
  category: "Suite" | "Villa" | "Penthouse" | "Deluxe";
  view: "Garden" | "City" | "Pool";
  price: number;          // GHS / USD equivalent
  size: number;           // m²
  capacity: number;
  beds: string;
  image: string;
  shortDescription: string;
  description: string;
  amenities: string[];
};

export const rooms: Room[] = [
  {
    id: "presidential-suite",
    name: "Kasena Executive Suite",
    category: "Suite",
    view: "Pool",
    price: 450,
    size: 78,
    capacity: 2,
    beds: "King",
    image: lakeSuite,
    shortDescription: "Spacious luxury suite with private balcony, plush lounge area, and premium Northern artisanal finishes.",
    description:
      "Our premier suite honors the rich heritage of Ghana. Featuring an expansive master bedroom, separate executive workspace, polished terrazzo bath with rain shower, and a private balcony overlooking the tranquil gardens.",
    amenities: ["Private balcony", "High-speed Wi-Fi", "Smart TV & DSTV", "Mini bar & coffee station", "Executive work desk", "24/7 Room service"],
  },
  {
    id: "savannah-pavilion",
    name: "Savannah Garden Chalet",
    category: "Villa",
    view: "Garden",
    price: 350,
    size: 65,
    capacity: 3,
    beds: "King + Single",
    image: gardenVilla,
    shortDescription: "Secluded garden chalet surrounded by lush bougainvillea and serene Northern greenery.",
    description:
      "Designed for absolute peace and relaxation, the Savannah Garden Chalet provides generous living space, outdoor patio seating, and silent climate control ideal for business leaders and travelers seeking privacy.",
    amenities: ["Private garden patio", "Climate control AC", "Ensuite rain shower", "Complimentary hot breakfast", "Dedicated concierge"],
  },
  {
    id: "royal-penthouse",
    name: "Your Penthouse",
    category: "Penthouse",
    view: "City",
    price: 850,
    size: 160,
    capacity: 4,
    beds: "2 King Suites",
    image: penthouse,
    shortDescription: "The finest duplex suite with 360° views across the city and a spectacular sunset horizon.",
    description:
      "The pinnacle of hospitality in the region. Features two lavish ensuite bedrooms, a private dining room, living salon, and private panoramic terrace offering unmatched sunset views over the city.",
    amenities: ["Dedicated butler service", "Private dining salon", "Panoramic roof terrace", "Complimentary airport pickup", "VIP minibar", "Jacuzzi tub"],
  },
  {
    id: "deluxe-executive",
    name: "Superior Deluxe Room",
    category: "Deluxe",
    view: "Garden",
    price: 220,
    size: 38,
    capacity: 2,
    beds: "Queen",
    image: deluxe,
    shortDescription: "Modern comfort tailored for business travelers, university faculty, and tourists.",
    description:
      "Elegantly appointed room with high-thread-count linens, contemporary work desk, fast internet, and modern bathroom amenities for a refreshing and restful stay.",
    amenities: ["Fast fiber Wi-Fi", "Quiet AC", "Work desk", "LED Satellite TV", "Daily housekeeping", "Complimentary breakfast"],
  },
];

export const experiences = [
  { id: "heritage", title: "Heritage & Culture Tour", image: expBoat, eyebrow: "Heritage", copy: "Chauffeured guided excursion through historic landmarks, vibrant markets, and cultural sites." },
  { id: "dining", title: "Authentic Ghanaian & Continental Cuisine", image: expChef, eyebrow: "Culinary", copy: "Taste locally sourced guinea fowl delicacies, Tuo Zaafi, jollof, and contemporary continental dishes curated by our head chef." },
  { id: "culture", title: "Arts, Crafts & Markets Excursion", image: expRose, eyebrow: "Culture", copy: "Explore traditional crafts, colorful markets, and local artisans with our concierge guides." },
  { id: "leisure", title: "Landmarks & Leisure Experience", image: expWine, eyebrow: "Discovery", copy: "Private visits to iconic sites and serene leisure spots, arranged around your schedule." },
];

/** Town-aware experiences: the lead card names the prospect's town. */
export function experiencesFor(town: string) {
  const t = (town || "").trim() || "Accra";
  return experiences.map((e) =>
    e.id === "heritage"
      ? { ...e, title: `${t} Heritage Tour`, copy: `Chauffeured guided excursion through ${t}'s historic landmarks, vibrant markets, and cultural sites.` }
      : e.id === "culture"
        ? { ...e, title: "Arts, Crafts & Markets Excursion", copy: `Explore ${t}'s traditional crafts, colorful markets, and local artisans with our concierge guides.` }
        : e
  );
}

export const reviews = [
  { id: 1, name: "Dr. Kwesi Mensah", origin: "Accra / Visiting Fellow", quote: "Your Hotel brings a standard of luxury and efficiency that matches the best in the country. Seamless Wi-Fi, comfortable beds, and top-tier service.", rating: 5 },
  { id: 2, name: "Amina Sulemana", origin: "Tamale", quote: "The best place to stay in town. The food is exceptional, and the front desk staff went above and beyond to organize our transport.", rating: 5 },
  { id: 3, name: "Marcus Van Der Berg", origin: "Netherlands (NGO Director)", quote: "Quiet, secure, and wonderfully managed. After long days of work, returning to Your Hotel felt like a true oasis.", rating: 5 },
  { id: 4, name: "Grace & David Addo", origin: "Kumasi", quote: "We held our family anniversary gathering here. The conference hall, catering, and guest rooms were all 10/10.", rating: 5 },
];

export const accolades = [
  "Premier Luxury Hotel in Ghana",
  "Ghana Tourism Authority Certified",
  "Upper East Excellence in Hospitality",
  "Top Rated Conference & Event Venue",
  "24/7 Secured & Solar Backed Power",
];

const townAttractions: Record<string, [string, string][]> = {
  accra: [
    ["Kotoka International Airport", "15 min drive"],
    ["Accra Mall", "10 min drive"],
    ["Labadi Beach", "20 min drive"],
    ["Kwame Nkrumah Memorial Park", "25 min drive"],
  ],
  kumasi: [
    ["Kumasi Airport", "15 min drive"],
    ["Manhyia Palace Museum", "10 min drive"],
    ["Kejetia Market", "12 min drive"],
    ["Lake Bosomtwe", "30 min drive"],
  ],
  tamale: [
    ["Tamale Airport", "15 min drive"],
    ["Tamale Cultural Centre", "10 min drive"],
    ["Paga Crocodile Sanctuary", "60 min drive"],
    ["Mole National Park", "2 hr drive"],
  ],
  "cape coast": [
    ["Cape Coast Castle", "10 min drive"],
    ["Kakum National Park", "30 min drive"],
    ["Elmina Castle", "25 min drive"],
    ["Kotokuraba Market", "8 min drive"],
  ],
  takoradi: [
    ["Takoradi Airport", "15 min drive"],
    ["Market Circle", "10 min drive"],
    ["Busua Beach", "40 min drive"],
    ["Fort Orange, Sekondi", "20 min drive"],
  ],
  navrongo: [
    ["CKT-UTAS Navrongo Campus", "4 min drive"],
    ["Navrongo Mud Cathedral", "6 min drive"],
    ["Paga Crocodile Sanctuary", "18 min drive"],
    ["Bolgatanga Town Center", "25 min drive"],
  ],
};

const genericAttractions: [string, string][] = [
  ["International Airport", "15 min drive"],
  ["Central Business District", "10 min drive"],
  ["Cultural Heritage Sites", "20 min drive"],
  ["Nature & Leisure Parks", "30 min drive"],
];

/** Nearby-attraction list matched to the prospect's town, with a generic fallback. */
export function attractionsFor(town: string): [string, string][] {
  return townAttractions[(town || "").trim().toLowerCase()] ?? genericAttractions;
}
