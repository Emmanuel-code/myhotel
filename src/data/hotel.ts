import lakeSuite from "@/assets/room-lake-suite.jpg";
import gardenVilla from "@/assets/room-garden-villa.jpg";
import penthouse from "@/assets/room-penthouse.jpg";
import deluxe from "@/assets/room-deluxe.jpg";
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
      "Our premier suite honors the rich heritage of Navrongo. Featuring an expansive master bedroom, separate executive workspace, polished terrazzo bath with rain shower, and a private balcony overlooking the tranquil gardens.",
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
    shortDescription: "Navrongo's finest duplex suite with 360° views across the city and Sahel sunset horizon.",
    description:
      "The pinnacle of hospitality in the Upper East Region. Features two lavish ensuite bedrooms, a private dining room, living salon, and private panoramic terrace offering unmatched sunset views over Navrongo.",
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
      "Elegantly appointed room with high-thread-count linens, contemporary work desk, fast internet, and modern bathroom amenities for a refreshing and restful stay in Navrongo.",
    amenities: ["Fast fiber Wi-Fi", "Quiet AC", "Work desk", "LED Satellite TV", "Daily housekeeping", "Complimentary breakfast"],
  },
];

export const experiences = [
  { id: "paga", title: "Paga Crocodile & Slave Camp Tour", image: expBoat, eyebrow: "Heritage", copy: "Chauffeured guided excursion to the sacred Paga crocodile sanctuary and historic Pikworo slave camp." },
  { id: "dining", title: "Authentic Sahel & Continental Cuisine", image: expChef, eyebrow: "Culinary", copy: "Taste locally sourced guinea fowl delicacies, Tuo Zaafi, jollof, and contemporary continental dishes curated by our head chef." },
  { id: "sirigu", title: "Sirigu Pottery & Wall Art Excursion", image: expRose, eyebrow: "Culture", copy: "Explore traditional Gurunsi architecture, geometric wall paintings, and handmade clay pottery with local women artisans." },
  { id: "cathedral", title: "Navrongo Mud Cathedral Experience", image: expWine, eyebrow: "Architecture", copy: "Private visit to the famous 1906 Navrongo Cathedral Basilica of Our Lady of Seven Sorrows, crafted in earth and stone." },
];

export const reviews = [
  { id: 1, name: "Dr. Kwesi Mensah", origin: "Accra / CKT-UTAS Visiting Fellow", quote: "Your Hotel   brings a standard of luxury and efficiency to Navrongo that matches top hotels in Accra. Seamless Wi-Fi, comfortable beds, and top-tier service.", rating: 5 },
  { id: 2, name: "Amina Sulemana", origin: "Tamale", quote: "The best place to stay in the Upper East. The food is exceptional, and the front desk staff went above and beyond to organize our transport to Paga.", rating: 5 },
  { id: 3, name: "Marcus Van Der Berg", origin: "Netherlands (NGO Director)", quote: "Quiet, secure, and wonderfully managed. After long days of fieldwork, returning to Your Hotel   felt like a true oasis.", rating: 5 },
  { id: 4, name: "Grace & David Addo", origin: "Kumasi", quote: "We held our family anniversary gathering here. The conference hall, catering, and guest rooms were all 10/10.", rating: 5 },
];

export const accolades = [
  "Navrongo's Premier Luxury Hotel",
  "Ghana Tourism Authority Certified",
  "Upper East Excellence in Hospitality",
  "Top Rated Conference & Event Venue",
  "24/7 Secured & Solar Backed Power",
];
