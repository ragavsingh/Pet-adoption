import { Pet } from '../types/pet';
import { User, AdopterProfile, ProviderProfile } from '../types/user';
import { AdoptionRequest } from '../types/adoptionRequest';
import { AppNotification } from '../types/notification';
import { ReportItem } from '../types/report';

export const DEMO_ADOPTER: AdopterProfile = {
  id: 'usr_raghav',
  name: 'Raghav Singh',
  email: 'raghav.singh@example.com',
  phone: '+91 98201 54321',
  location: 'Bandra West, Mumbai',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  homeType: 'Apartment',
  workType: 'Hybrid',
  timeAway: 'Under 4 hours',
  activityLevel: 'Active',
  children: 'None',
  existingPets: 'None',
  petExperience: 'Lifelong pet owner',
  preferredPetType: 'Dog (Medium to Large)',
  preferredSize: 'Medium',
  preferredAge: 'Young adult (1-3 years)',
  whyTheyWantToAdopt: 'I live in an apartment with nearby parks and work hybrid 3 days a week. Looking for an active, friendly companion for morning jogs and long weekend walks.',
  profileCompletion: 80,
};

export const DEMO_PROVIDER: ProviderProfile = {
  id: 'prv_sarah',
  name: 'Sarah D\'Souza',
  organizationName: 'Paws & Care Rescue Mumbai',
  email: 'sarah.dsouza@example.com',
  phone: '+91 98192 34567',
  location: 'Andheri East, Mumbai',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  verified: true,
  about: 'Animal welfare advocate and certified foster caregiver with 7+ years of experience helping rescued and surrendered dogs find loving forever homes.',
  activeListingsCount: 8,
  successfulAdoptionsCount: 38,
};

export const DEMO_PETS: Pet[] = [
  {
    "id": "pet_bruno",
    "name": "Bruno",
    "species": "Dog",
    "breed": "Labrador Retriever",
    "age": "2 years",
    "gender": "Male",
    "size": "Large",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Playful",
      "Friendly",
      "Active",
      "Gentle Giant"
    ],
    "stats": {
      "energy": 85,
      "friendliness": 100,
      "trainability": 80,
      "independence": 45
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Bruno is a joyous, heart-melting Labrador who loves morning trots, retrieving tennis balls, and resting his chin on your knee. Rescued as a pup from an overcrowded boarding kennel, he has flourished under foster care.",
    "providerInsight": {
      "personality": "Affectionate, goofy, and deeply people-focused. Loves welcoming you home with gentle tail wags.",
      "habits": "Loves curling up on a rug near your desk. Very gentle when receiving treats.",
      "likes": "Peanut butter treats, squeaky tennis balls, water puddles, belly rubs.",
      "dislikes": "Sudden loud honking or fireworks during Diwali.",
      "behavior": "Completely house-trained, knows basic commands (Sit, Stay, Paw, Come). Good on a leash.",
      "specialCare": "Needs regular brushing twice a week to keep coat sleek.",
      "dailyRoutine": "6:30 AM morning walk, breakfast at 7:30 AM, quiet nap midday, evening park playtime at 6 PM, dinner at 8 PM."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-09-03T11:15:11.458Z"
  },
  {
    "id": "pet_luna",
    "name": "Luna",
    "species": "Dog",
    "breed": "Golden Retriever Mix",
    "age": "1.5 years",
    "gender": "Female",
    "size": "Medium",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Gentle",
      "Family-friendly",
      "Playful",
      "Calm"
    ],
    "stats": {
      "energy": 50,
      "friendliness": 95,
      "trainability": 90,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Luna is a serene Golden Retriever mix with an exceptionally mellow nature. She rarely barks and is happiest lying peacefully by your feet while you work or read.",
    "providerInsight": {
      "personality": "Calm, soulful, observant, and exceptionally patient with young children.",
      "habits": "Resting her head on your lap; sighing softly when settled into her bed.",
      "likes": "Soft cuddly stuffed animals, car rides with windows cracked, sunny balconies.",
      "dislikes": "Fast sudden movements or aggressive dog barking.",
      "behavior": "Fully crate and house-trained. Walks without pulling.",
      "specialCare": "Needs ear cleaning every fortnight.",
      "dailyRoutine": "Relaxed morning stroll at 7:30 AM, breakfast, tranquil lounging, evening family walk at 7:00 PM."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-09-01T11:15:11.458Z"
  },
  {
    "id": "pet_milo",
    "name": "Milo",
    "species": "Dog",
    "breed": "Indie Native",
    "age": "3 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Calm",
      "Loyal",
      "Apartment-friendly",
      "Alert"
    ],
    "stats": {
      "energy": 65,
      "friendliness": 70,
      "trainability": 85,
      "independence": 90
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Milo is a proud, sleek Indian Pariah Dog with amber eyes and unconditional loyalty. Highly intelligent, he picks up household routines within 48 hours and guards his family with quiet vigilance.",
    "providerInsight": {
      "personality": "Fiercely loyal to his primary person, clean, intuitive, and quiet indoors.",
      "habits": "Cleans his paws meticulously after walks; loves sunbathing on tiled floors.",
      "likes": "Boiled chicken broth, interactive puzzle toys, quiet sunlit spots.",
      "dislikes": "Crowded noisy elevator rides during rush hours.",
      "behavior": "Extremely quick learner. Responds to whisper commands.",
      "specialCare": "Short coat requires very minimal grooming.",
      "dailyRoutine": "Morning brisk walk at 6 AM, breakfast, quiet independent rest, evening scent walk at 6 PM."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-30T11:15:11.458Z"
  },
  {
    "id": "pet_coco",
    "name": "Coco",
    "species": "Dog",
    "breed": "Beagle",
    "age": "3 years",
    "gender": "Female",
    "size": "Small",
    "location": "Pune",
    "images": [
      "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Social",
      "Energetic",
      "Curious",
      "Food-motivated"
    ],
    "stats": {
      "energy": 75,
      "friendliness": 90,
      "trainability": 65,
      "independence": 40
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Coco is an affectionate Beagle with a heart of gold and an insatiable curiosity for scents. She greets everyone like an old friend and curls into a snuggly donut on the couch every evening.",
    "providerInsight": {
      "personality": "Playful, merry, cuddly, and deeply motivated by positive praise and treats.",
      "habits": "Buries her snout under blankets before falling asleep.",
      "likes": "Sniffing new trails, apple slices (seedless), tummy scratches behind ears.",
      "dislikes": "Being left alone for more than 5 consecutive hours.",
      "behavior": "Vocal when excited, excellent with guests and toddlers.",
      "specialCare": "Needs regular ear checks and portion-controlled meals.",
      "dailyRoutine": "7:00 AM sniffari walk, breakfast via snuffle mat, sunny nap, 5:30 PM park social, dinner at 8 PM."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-28T11:15:11.458Z"
  },
  {
    "id": "pet_bella",
    "name": "Bella",
    "species": "Dog",
    "breed": "Cocker Spaniel",
    "age": "2.5 years",
    "gender": "Female",
    "size": "Medium",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Gentle",
      "Loving",
      "Cuddle-Bug",
      "Devoted"
    ],
    "stats": {
      "energy": 55,
      "friendliness": 100,
      "trainability": 85,
      "independence": 35
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Bella was rescued from a breeder surrender. She completed her Foster-to-Own trial and has now officially found her forever home with the Mehta family!",
    "providerInsight": {
      "personality": "Warm, sweet, and always ready for a snuggle.",
      "habits": "Sleeps with her chin resting on her human’s foot.",
      "likes": "Belly scratches, peanut butter cookies, warm sunshine.",
      "dislikes": "Thunderstorms.",
      "behavior": "Extremely gentle and well mannered.",
      "specialCare": "Daily ear comb.",
      "dailyRoutine": "Morning walk, family time, quiet evening cuddle."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Adopted",
    "createdAt": "2026-08-26T11:15:11.458Z",
    "adoptionDate": "2026-08-20"
  },
  {
    "id": "pet_06",
    "name": "Rocky",
    "species": "Dog",
    "breed": "German Shepherd Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Large",
    "location": "Hyderabad",
    "images": [
      "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Protective",
      "Intelligent",
      "Athletic",
      "Eager to Please"
    ],
    "stats": {
      "energy": 90,
      "friendliness": 75,
      "trainability": 95,
      "independence": 55
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Rocky is an athletic, handsome German Shepherd mix with keen intelligence and a heart devoted to protecting his family. He thrives on mental stimulation and obedience agility games.",
    "providerInsight": {
      "personality": "Alert, observant, deeply focused on his handler.",
      "habits": "Sits attentively by the front door when visitors knock.",
      "likes": "Agility hurdles, rubber frisbees, boiled carrots.",
      "dislikes": "Motorcycles revving too close.",
      "behavior": "Flawless recall, crate trained, walks like a champion on harness.",
      "specialCare": "Needs at least 1 hour of daily rigorous cardio.",
      "dailyRoutine": "6 AM morning run, mental training drills, midday nap, 6 PM fetch at park."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-24T11:15:11.458Z"
  },
  {
    "id": "pet_07",
    "name": "Simba",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": "3 years",
    "gender": "Male",
    "size": "Large",
    "location": "Chandigarh",
    "images": [
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Affectionate",
      "Gentle",
      "Water-lover",
      "Joyful"
    ],
    "stats": {
      "energy": 70,
      "friendliness": 100,
      "trainability": 90,
      "independence": 40
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Simba is a beaming ray of sunshine. He greets everyone by bringing his favorite slipper and doing a happy full-body wiggle.",
    "providerInsight": {
      "personality": "Endlessly cheerful, trusting, and gentle-hearted.",
      "habits": "Holds your hand gently with his mouth when happy.",
      "likes": "Swimming, tennis balls, ice cubes.",
      "dislikes": "Being left out of family gatherings.",
      "behavior": "Gentle mouth, excellent with elderly and infants.",
      "specialCare": "Regular coat de-shedding.",
      "dailyRoutine": "Morning trot, afternoon belly rubs, evening family walk."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Adoption Pending",
    "createdAt": "2026-08-22T11:15:11.458Z"
  },
  {
    "id": "pet_08",
    "name": "Leo",
    "species": "Dog",
    "breed": "Indie Pariah Pup",
    "age": "7 months",
    "gender": "Male",
    "size": "Medium",
    "location": "Kolkata",
    "images": [
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Spirited",
      "Clever",
      "Playful",
      "Hardy"
    ],
    "stats": {
      "energy": 85,
      "friendliness": 85,
      "trainability": 85,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Rescued from near Howrah station as a tiny pup, Leo has grown into a confident, affectionate young pup who loves racing across lawns and solving treat puzzles.",
    "providerInsight": {
      "personality": "Curious, energetic, and extraordinarily quick on the uptake.",
      "habits": "Tilts head 90 degrees when listening to new words.",
      "likes": "Tug of war ropes, crunchy sweet potatoes.",
      "dislikes": "Being confined without toys.",
      "behavior": "Learned sit and paw in 15 minutes.",
      "specialCare": "Puppy teething toys required.",
      "dailyRoutine": "Playful bursts throughout the day with lots of puppy snoozes."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-20T11:15:11.458Z"
  },
  {
    "id": "pet_09",
    "name": "Shadow",
    "species": "Dog",
    "breed": "Siberian Husky Mix",
    "age": "2.5 years",
    "gender": "Male",
    "size": "Large",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Vocal",
      "High-Energy",
      "Stunning",
      "Social"
    ],
    "stats": {
      "energy": 95,
      "friendliness": 85,
      "trainability": 70,
      "independence": 80
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Shadow has striking icy blue eyes and a comical operatic voice. He sings when excited for walks and loves cool weather adventures.",
    "providerInsight": {
      "personality": "Talkative, charismatic, and enthusiastic.",
      "habits": "Expressive howls when leash is picked up.",
      "likes": "Chilled watermelon slices, snowy trails, long hikes.",
      "dislikes": "Humid midday heat.",
      "behavior": "Needs secure fenced yard; athletic jumper.",
      "specialCare": "Air conditioning essential during North Indian summers.",
      "dailyRoutine": "Pre-dawn 5:30 AM long jog, AC room during day, evening brisk walk."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-18T11:15:11.458Z"
  },
  {
    "id": "pet_10",
    "name": "Max",
    "species": "Dog",
    "breed": "Boxer",
    "age": "4 years",
    "gender": "Male",
    "size": "Large",
    "location": "Chennai",
    "images": [
      "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Goofy",
      "Brave",
      "Affectionate",
      "Bouncy"
    ],
    "stats": {
      "energy": 75,
      "friendliness": 90,
      "trainability": 80,
      "independence": 45
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Max is a gentle soul wrapped in a muscular physique. Known as the shelter’s resident comedian, his kidney-bean wiggle when meeting you will brighten any hard day.",
    "providerInsight": {
      "personality": "Clownish, loving, and deeply protective of little humans.",
      "habits": "Sleeps with his tongue sticking out 1 centimeter.",
      "likes": "Soft chew bones, sleeping under blankets.",
      "dislikes": "Slippery floorboards.",
      "behavior": "House-trained, ignores doorbells.",
      "specialCare": "Wipe facial wrinkles weekly.",
      "dailyRoutine": "Morning walk, lazy nap on armchair, evening garden sprint."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-16T11:15:11.458Z"
  },
  {
    "id": "pet_11",
    "name": "Buster",
    "species": "Dog",
    "breed": "Pug",
    "age": "3 years",
    "gender": "Male",
    "size": "Small",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1587402092301-725e37c70fd8?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Low-Energy",
      "Lap Dog",
      "Comedic",
      "Apartment Hero"
    ],
    "stats": {
      "energy": 35,
      "friendliness": 95,
      "trainability": 60,
      "independence": 30
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Buster is a pocket-sized champion of leisure. He requires only short strolls and prefers curling up against your feet as you work.",
    "providerInsight": {
      "personality": "Mild-mannered, sweet, quiet companion.",
      "habits": "Soft snores during naps.",
      "likes": "Warm soft fleeces, lap cuddles, cucumber rounds.",
      "dislikes": "Stairs (prefers being carried up steps).",
      "behavior": "Quiet indoor pet, never barks.",
      "specialCare": "Keep facial folds clean and avoid overfeeding.",
      "dailyRoutine": "15-min gentle morning stroll, 8 hours of snoozing, 15-min evening stroll."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-14T11:15:11.458Z"
  },
  {
    "id": "pet_12",
    "name": "Oscar",
    "species": "Dog",
    "breed": "Dachshund",
    "age": "2 years",
    "gender": "Male",
    "size": "Small",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Brave",
      "Curious",
      "Loyal",
      "Feisty"
    ],
    "stats": {
      "energy": 60,
      "friendliness": 75,
      "trainability": 70,
      "independence": 65
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Oscar has a big dog attitude in a compact sausage silhouette. He loves burrowing under bed duvets and investigating every leaf in the garden.",
    "providerInsight": {
      "personality": "Determined, hilarious burrower, deeply loyal.",
      "habits": "Burrows like a mole under pillows.",
      "likes": "Warm blankets, scent trails, small chew toys.",
      "dislikes": "Being picked up incorrectly (support back always).",
      "behavior": "Sharp hearing, alerts to doorbell.",
      "specialCare": "Avoid letting him jump off high sofas to safeguard spine.",
      "dailyRoutine": "Morning walk, burrow nap, evening courtyard sniff."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-12T11:15:11.458Z"
  },
  {
    "id": "pet_13",
    "name": "Toby",
    "species": "Dog",
    "breed": "Shih Tzu",
    "age": "1.5 years",
    "gender": "Male",
    "size": "Small",
    "location": "Pune",
    "images": [
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1587402092301-725e37c70fd8?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Gentle",
      "Hypoallergenic",
      "Sweet",
      "Loving"
    ],
    "stats": {
      "energy": 45,
      "friendliness": 95,
      "trainability": 75,
      "independence": 40
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Toby is a fluffy bundle of joy who was rescued from an elderly home where his previous parent could no longer care for him. He is gentle, polite, and loves pampering.",
    "providerInsight": {
      "personality": "Polite, sweet, never begs, loves cuddles.",
      "habits": "Sits quietly waiting for invitation before hopping onto sofa.",
      "likes": "Soft hairbrushing, chicken jerky treats.",
      "dislikes": "Rough tugging games.",
      "behavior": "Gentle, litter/pad trained as well as outdoors.",
      "specialCare": "Daily light brushing.",
      "dailyRoutine": "Morning gentle stroll, pampered brushing session, quiet evening cuddle."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-10T11:15:11.458Z"
  },
  {
    "id": "pet_14",
    "name": "Charlie",
    "species": "Dog",
    "breed": "Beagle Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Friendly",
      "Sniffer",
      "Good-natured",
      "Happy"
    ],
    "stats": {
      "energy": 70,
      "friendliness": 95,
      "trainability": 75,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Charlie has floppy velvet ears and an ever-wagging tail. He loves sniffing every tree and making friends with neighbor children.",
    "providerInsight": {
      "personality": "Extroverted, peaceful, and enthusiastic.",
      "habits": "Loves sniffing backpacks when people arrive.",
      "likes": "Scent games, carrots, ear rubs.",
      "dislikes": "Being rushed on walks.",
      "behavior": "Great on leash, loves car rides.",
      "specialCare": "Needs mentally stimulating scent walks.",
      "dailyRoutine": "Morning sniff walk, daytime quiet nap, evening park visit."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-08T11:15:11.458Z"
  },
  {
    "id": "pet_15",
    "name": "Cooper",
    "species": "Dog",
    "breed": "Indie Desi Dog",
    "age": "1 year",
    "gender": "Male",
    "size": "Medium",
    "location": "Goa",
    "images": [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Beach-lover",
      "Free-spirited",
      "Playful",
      "Smart"
    ],
    "stats": {
      "energy": 80,
      "friendliness": 85,
      "trainability": 85,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Rescued off the coastline of North Goa, Cooper is an agile, sun-loving indie dog who loves sand between his paws and running alongside bikes.",
    "providerInsight": {
      "personality": "Cheerful, adventurous, highly empathetic.",
      "habits": "Loves sleeping curled like a pretzel.",
      "likes": "Splashing in shallow water, boiled fish, coconut flakes.",
      "dislikes": "Loud thunderclaps.",
      "behavior": "Naturally clean, self-grooming.",
      "specialCare": "Zero special medical care needed; super hardy.",
      "dailyRoutine": "6:30 AM beach/park run, wholesome breakfast, daytime relax, sunset walk."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-06T11:15:11.458Z"
  },
  {
    "id": "pet_16",
    "name": "Bailey",
    "species": "Dog",
    "breed": "Rottweiler Mix",
    "age": "3 years",
    "gender": "Female",
    "size": "Large",
    "location": "Gurgaon",
    "images": [
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Loyal Guardian",
      "Gentle Giant",
      "Devoted",
      "Calm"
    ],
    "stats": {
      "energy": 65,
      "friendliness": 80,
      "trainability": 90,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Bailey is a majestic, warm-hearted Rottweiler cross. She looks formidable but is an absolute sweetheart who leans all her weight against your leg for gentle pats.",
    "providerInsight": {
      "personality": "Dignified, steadfast, deeply gentle with her inner circle.",
      "habits": "Leans her body against your shins when she wants head rubs.",
      "likes": "Sturdy rubber chew bones, cheese cubes, cool marble floors.",
      "dislikes": "Strangers approaching her yard unannounced without introduction.",
      "behavior": "Exceptional leash discipline, commands mastered.",
      "specialCare": "Needs regular joint supplement as preventative care.",
      "dailyRoutine": "Morning perimeter walk, relaxed midday nap, evening obedience games."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Adopted",
    "createdAt": "2026-08-04T11:15:11.458Z",
    "adoptionDate": "2026-08-20"
  },
  {
    "id": "pet_17",
    "name": "Murphy",
    "species": "Dog",
    "breed": "Irish Setter Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Large",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Silky Coat",
      "Bouncy",
      "Joyful",
      "Loving"
    ],
    "stats": {
      "energy": 85,
      "friendliness": 95,
      "trainability": 80,
      "independence": 45
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Murphy possesses a lustrous chestnut coat and a radiant spirit. He adores running wide loops around the park and coming back to check on you with a big grin.",
    "providerInsight": {
      "personality": "Effervescent, friendly to strangers, graceful runner.",
      "habits": "Checks in with eye contact every 30 seconds on off-leash park visits.",
      "likes": "Playing fetch, swimming, head massages.",
      "dislikes": "Being alone outdoors in rain.",
      "behavior": "House-trained, eager to please.",
      "specialCare": "Coat needs brushing three times a week.",
      "dailyRoutine": "Energetic morning park session, breakfast, long peaceful afternoon nap, evening stroll."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-08-02T11:15:11.458Z"
  },
  {
    "id": "pet_18",
    "name": "Rusty",
    "species": "Dog",
    "breed": "Indie Hound",
    "age": "2 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Jaipur",
    "images": [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Swift",
      "Alert",
      "Affectionate",
      "Low Maintenance"
    ],
    "stats": {
      "energy": 75,
      "friendliness": 80,
      "trainability": 80,
      "independence": 85
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Rusty has caramel-colored fur and athletic poise. Rescued from the historic streets of Jaipur, he is extraordinarily smart, clean, and gentle indoors.",
    "providerInsight": {
      "personality": "Observant, polite, clean, deeply grateful.",
      "habits": "Sleeps like an arched bow under the bed.",
      "likes": "Boiled eggs, sunny terrace walks, gentle ear scratches.",
      "dislikes": "Crowded market noise.",
      "behavior": "Rarely ever barks, respectful of personal boundaries.",
      "specialCare": "Short coat dries in 5 minutes.",
      "dailyRoutine": "Morning walk around historical garden, breakfast, calm day, sunset walk."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-31T11:15:11.458Z"
  },
  {
    "id": "pet_19",
    "name": "Zoey",
    "species": "Dog",
    "breed": "Pomeranian",
    "age": "2.5 years",
    "gender": "Female",
    "size": "Small",
    "location": "Ahmedabad",
    "images": [
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Fluffy",
      "Alert",
      "Affectionate",
      "Lively"
    ],
    "stats": {
      "energy": 60,
      "friendliness": 85,
      "trainability": 75,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Zoey looks like a small toasted marshmallow with perky triangular ears. She prances when walking and loves being held like a baby.",
    "providerInsight": {
      "personality": "Sprightly, joyful, cuddly princess.",
      "habits": "Does a tiny two-paw dance before meal times.",
      "likes": "Soft fleece beds, chicken shreds, gentle combing.",
      "dislikes": "Fast big dogs barking loudly.",
      "behavior": "Loves being around family members constantly.",
      "specialCare": "Brush coat every 2 days.",
      "dailyRoutine": "Morning short walk, playtime with squeaky toy, evening lap cuddle."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-29T11:15:11.458Z"
  },
  {
    "id": "pet_20",
    "name": "Barney",
    "species": "Dog",
    "breed": "Labrador Mix",
    "age": "3 years",
    "gender": "Male",
    "size": "Large",
    "location": "Lucknow",
    "images": [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Patient",
      "Gentle",
      "Loyal",
      "Comfort Dog"
    ],
    "stats": {
      "energy": 55,
      "friendliness": 95,
      "trainability": 85,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Barney has soulful chocolate eyes and a calming presence. He was a therapy visitor at a local hospital and has an unmatched gentle touch.",
    "providerInsight": {
      "personality": "Deeply empathetic, patient with noisy children, soothing companion.",
      "habits": "Places chin on knee when you seem stressed.",
      "likes": "Gentle strokes along his back, cold yogurt treats, afternoon naps.",
      "dislikes": "Thunderstorms.",
      "behavior": "Impeccable house manners, never jumps on guests.",
      "specialCare": "Moderate exercise to maintain healthy 27kg weight.",
      "dailyRoutine": "Gentle 30-min morning walk, breakfast, relaxing by desk, 30-min evening walk."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-27T11:15:11.458Z"
  },
  {
    "id": "pet_21",
    "name": "Duke",
    "species": "Dog",
    "breed": "Great Dane Mix",
    "age": "3 years",
    "gender": "Male",
    "size": "Large",
    "location": "Pune",
    "images": [
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Gentle Giant",
      "Couch Potato",
      "Polite",
      "Loving"
    ],
    "stats": {
      "energy": 40,
      "friendliness": 90,
      "trainability": 80,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Despite his tall stature, Duke considers himself a 5-kilogram lap dog. He is a gentle couch potato who loves snoozing on large orthopedic mattresses.",
    "providerInsight": {
      "personality": "Mellow, slow-moving, sweet giant.",
      "habits": "Tries to sit on your lap despite weighing 38kg.",
      "likes": "Soft oversized dog beds, peanut butter, slow walks.",
      "dislikes": "Slippery stairs.",
      "behavior": "Very low barker, walks slowly beside you.",
      "specialCare": "Needs raised food bowl for digestion.",
      "dailyRoutine": "Relaxed 25-minute morning stroll, long day of sleep, gentle evening stroll."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Adoption Pending",
    "createdAt": "2026-07-25T11:15:11.458Z"
  },
  {
    "id": "pet_22",
    "name": "Teddy",
    "species": "Dog",
    "breed": "Poodle Mix",
    "age": "1 year",
    "gender": "Male",
    "size": "Small",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Hypoallergenic",
      "Clever",
      "Bouncy",
      "Loving"
    ],
    "stats": {
      "energy": 70,
      "friendliness": 95,
      "trainability": 95,
      "independence": 40
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Teddy has curly apricot fur that doesn’t shed, making him great for people with mild pet dander sensitivities. He learns tricks in minutes.",
    "providerInsight": {
      "personality": "Super smart, eager to learn, affectionate.",
      "habits": "Fetches his leash when he hears the word \"Walk\".",
      "likes": "Brain puzzle toys, agility hurdles, cuddling on beds.",
      "dislikes": "Being alone for long stretches.",
      "behavior": "House-trained, knows over 10 voice commands.",
      "specialCare": "Regular trimming every 6 weeks.",
      "dailyRoutine": "Morning walk, mental enrichment games, midday snooze, evening play."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-23T11:15:11.458Z"
  },
  {
    "id": "pet_23",
    "name": "Archie",
    "species": "Dog",
    "breed": "Indie Pup",
    "age": "6 months",
    "gender": "Male",
    "size": "Medium",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Puppy Energy",
      "Affectionate",
      "Smart",
      "Resilient"
    ],
    "stats": {
      "energy": 80,
      "friendliness": 90,
      "trainability": 85,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Archie was found sheltering under a tea stall during monsoon rains. Today he is a healthy, energetic bundle of joy looking for a family to grow up with.",
    "providerInsight": {
      "personality": "Inquisitive, snuggly, and eager to learn.",
      "habits": "Chases his tail when feeling particularly happy.",
      "likes": "Puppy chew toys, sweet potato chews, warm milk formula.",
      "dislikes": "Cold bath water.",
      "behavior": "Basic pad training completed, quick learner.",
      "specialCare": "Puppy vaccination booster scheduled.",
      "dailyRoutine": "Short frequent puppy walks, meals 3x daily, frequent naps."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-21T11:15:11.458Z"
  },
  {
    "id": "pet_24",
    "name": "Sam",
    "species": "Dog",
    "breed": "Border Collie Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Agile",
      "Genius Level",
      "Dedicated",
      "Sporty"
    ],
    "stats": {
      "energy": 90,
      "friendliness": 85,
      "trainability": 100,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Sam is an intellectual powerhouse who needs an active pet parent. He can organize his toys by color and loves frisbee competitions.",
    "providerInsight": {
      "personality": "Laser-focused, loyal, energetic.",
      "habits": "Watches your hands closely anticipating signals.",
      "likes": "Frisbee, agility courses, puzzle feeders.",
      "dislikes": "Being bored with nothing to do.",
      "behavior": "Mastered agility commands, never pulls leash.",
      "specialCare": "Requires daily mental enrichment + active running.",
      "dailyRoutine": "6 AM 5km run, brain puzzle breakfast, agility games at 5 PM."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-19T11:15:11.458Z"
  },
  {
    "id": "pet_25",
    "name": "Bolt",
    "species": "Dog",
    "breed": "Jack Russell Terrier Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Small",
    "location": "Hyderabad",
    "images": [
      "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Fast",
      "Feisty",
      "Courageous",
      "Fun-Loving"
    ],
    "stats": {
      "energy": 90,
      "friendliness": 80,
      "trainability": 75,
      "independence": 70
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "True to his name, Bolt is lightning fast and filled with boundless optimism. He loves chasing tennis balls until the sun goes down.",
    "providerInsight": {
      "personality": "Zesty, spirited, courageous little sparkplug.",
      "habits": "Jumps vertically like a spring when greeting you.",
      "likes": "Tennis balls, squeaky hedgehogs, sprinting across grass.",
      "dislikes": "Boring slow walks.",
      "behavior": "High prey drive for rodents, alert watch dog.",
      "specialCare": "Lots of ball-throwing sessions.",
      "dailyRoutine": "Morning park sprint, midday nap in sunbeam, evening fetch."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-17T11:15:11.458Z"
  },
  {
    "id": "pet_26",
    "name": "Bruno Jr.",
    "species": "Dog",
    "breed": "Indie Golden Mix",
    "age": "1 year",
    "gender": "Male",
    "size": "Medium",
    "location": "Kolkata",
    "images": [
      "https://images.unsplash.com/photo-1583511666407-5f06533f2113?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Sweet",
      "Friendly",
      "Adaptable",
      "Good Natured"
    ],
    "stats": {
      "energy": 70,
      "friendliness": 95,
      "trainability": 85,
      "independence": 55
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "A gorgeous mix of golden coat and pariah resilience, Bruno Jr. has an affectionate disposition and gets along with everyone he meets.",
    "providerInsight": {
      "personality": "Gentle, forgiving, easy-going.",
      "habits": "Rests his head on the lowest couch cushion.",
      "likes": "Treats, being brushed, meeting neighborhood dogs.",
      "dislikes": "Loud car horns.",
      "behavior": "Great leash behavior, quiet in elevators.",
      "specialCare": "Regular routine checkups.",
      "dailyRoutine": "Morning walk along lakeside, breakfast, calm day, evening social."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-15T11:15:11.458Z"
  },
  {
    "id": "pet_27",
    "name": "Ginger",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": "4 years",
    "gender": "Female",
    "size": "Large",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Gentle Soul",
      "Cuddle Bug",
      "Patient",
      "Loving"
    ],
    "stats": {
      "energy": 50,
      "friendliness": 100,
      "trainability": 90,
      "independence": 45
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Ginger was surrendered by a moving expat family. She is fully trained, walks like a dream on leash, and is ready to shower a new family with devotion.",
    "providerInsight": {
      "personality": "Sweet, calm, mature, extraordinarily gentle.",
      "habits": "Carries her soft plush duck everywhere in the house.",
      "likes": "Plush toys, gentle massages behind ears, ice cubes.",
      "dislikes": "Fast loud scooters.",
      "behavior": "100% house trained, zero behavioral issues.",
      "specialCare": "Ear checkup monthly.",
      "dailyRoutine": "Morning gentle stroll, lounging during work hours, sunset walk."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-13T11:15:11.458Z"
  },
  {
    "id": "pet_28",
    "name": "Scout",
    "species": "Dog",
    "breed": "Doberman Mix",
    "age": "2.5 years",
    "gender": "Male",
    "size": "Large",
    "location": "Chennai",
    "images": [
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Noble",
      "Athletic",
      "Attentive",
      "Gentle Giant"
    ],
    "stats": {
      "energy": 80,
      "friendliness": 80,
      "trainability": 95,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Scout is a sleek, black-and-tan companion with noble bearing. Underneath his athletic look lies a sensitive boy who loves snuggling on rugs.",
    "providerInsight": {
      "personality": "Loyal, intelligent, protective of his loved ones.",
      "habits": "Rests his muzzle on your knee to ask for ear rubs.",
      "likes": "Long endurance trots, agility training, dehydrated liver.",
      "dislikes": "Unfamiliar shouting.",
      "behavior": "Knows heel, sit, stay, down, paw, and leave it.",
      "specialCare": "Keep warm in cold air-conditioned rooms.",
      "dailyRoutine": "Early morning run, breakfast, calm day, evening obedience training."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Adopted",
    "createdAt": "2026-07-11T11:15:11.458Z",
    "adoptionDate": "2026-08-20"
  },
  {
    "id": "pet_29",
    "name": "Penny",
    "species": "Dog",
    "breed": "Corgi Mix",
    "age": "2 years",
    "gender": "Female",
    "size": "Small",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1587402092301-725e37c70fd8?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Cute",
      "Short Legs",
      "Happy",
      "Outgoing"
    ],
    "stats": {
      "energy": 65,
      "friendliness": 90,
      "trainability": 80,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Penny has iconic fox ears, short stubby paws, and a huge personality. She trots with pride and loves making human friends at pet-friendly cafes.",
    "providerInsight": {
      "personality": "Bubbly, confident, funny, and affectionate.",
      "habits": "Splooting flat on the cool floor tiles.",
      "likes": "Belly rubs, squeaky carrot toys, cheese crumbs.",
      "dislikes": "Being left behind when family goes for drives.",
      "behavior": "Great in apartments, loves car rides.",
      "specialCare": "Avoid steep stair jumps.",
      "dailyRoutine": "Morning walk, sploot nap, evening cafe outing with family."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-09T11:15:11.458Z"
  },
  {
    "id": "pet_30",
    "name": "Krypto",
    "species": "Dog",
    "breed": "Dalmatian Mix",
    "age": "2 years",
    "gender": "Male",
    "size": "Large",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Spotted",
      "High Endurance",
      "Playful",
      "Striking"
    ],
    "stats": {
      "energy": 90,
      "friendliness": 85,
      "trainability": 80,
      "independence": 65
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": false,
    "apartmentFriendly": false,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "With unique polka-dot markings and boundless stamina, Krypto is looking for an outdoor enthusiast who loves running, trekking, or cycling.",
    "providerInsight": {
      "personality": "Active, spirited, joyful, loves human company.",
      "habits": "Smiles with teeth shown (submissive grin) when excited.",
      "likes": "Endurance jogging, agility hurdles, boiled chicken.",
      "dislikes": "Sitting still for hours.",
      "behavior": "High energy, requires patient guidance and exercise.",
      "specialCare": "Needs low-purine diet.",
      "dailyRoutine": "6 AM 6km jog, nutritious meal, long rest, 6 PM frisbee."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-07T11:15:11.458Z"
  },
  {
    "id": "pet_31",
    "name": "Flash",
    "species": "Dog",
    "breed": "Indie Whippet Mix",
    "age": "1.5 years",
    "gender": "Female",
    "size": "Medium",
    "location": "Jaipur",
    "images": [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Aerodynamic",
      "Gentle",
      "Quiet",
      "Loving"
    ],
    "stats": {
      "energy": 75,
      "friendliness": 85,
      "trainability": 80,
      "independence": 70
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Flash runs like the wind across open fields, but indoors she transforms into a sweet, silent decorative rug who never makes a peep.",
    "providerInsight": {
      "personality": "Gentle, shy initially, deeply affectionate once bonded.",
      "habits": "Curls up into a tight ball taking up zero bed space.",
      "likes": "High-speed 10-minute sprints, soft fleece jackets, warm sun.",
      "dislikes": "Cold wet pavement.",
      "behavior": "Never barks indoors, very polite.",
      "specialCare": "Short coat needs light sweater during winter months.",
      "dailyRoutine": "Morning sprint in enclosed field, relaxing day, evening gentle walk."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-05T11:15:11.458Z"
  },
  {
    "id": "pet_32",
    "name": "Casper",
    "species": "Dog",
    "breed": "Samoyed Mix",
    "age": "3 years",
    "gender": "Male",
    "size": "Large",
    "location": "Chandigarh",
    "images": [
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Cloud Dog",
      "Smiling",
      "Fluffy",
      "Gentle"
    ],
    "stats": {
      "energy": 65,
      "friendliness": 100,
      "trainability": 80,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "Needs daily active exercise and chew enrichment.",
    "description": "Casper is a walking cloud with the famous Samoyed permanent smile. He loves snow and chilly weather and loves being petted by children.",
    "providerInsight": {
      "personality": "Heartwarmingly friendly, gentle, loves everyone.",
      "habits": "Leans his fluffy head onto your lap while sighing happily.",
      "likes": "Cold tiles, ice cubes, gentle brushing sessions.",
      "dislikes": "Humid heat.",
      "behavior": "Extremely gentle with tiny children.",
      "specialCare": "Thorough coat brushing twice a week.",
      "dailyRoutine": "Morning walk in cool breeze, quiet afternoon inside AC, evening walk."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-03T11:15:11.458Z"
  },
  {
    "id": "pet_33",
    "name": "Tyson",
    "species": "Dog",
    "breed": "Bulldog Mix",
    "age": "4 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Ahmedabad",
    "images": [
      "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Chunky",
      "Sweet",
      "Couch Potato",
      "Hilarious"
    ],
    "stats": {
      "energy": 40,
      "friendliness": 90,
      "trainability": 65,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Tyson has a tough boxer stance but the soul of a gentle teddy bear. He snores rhythmically and enjoys short waddles around the block.",
    "providerInsight": {
      "personality": "Affectionate, goofy, steady, and very calm.",
      "habits": "Sleeps with his rear legs stretched out behind him.",
      "likes": "Tummy rubs, watermelon chunks, afternoon snoozes.",
      "dislikes": "Fast running or hot afternoons.",
      "behavior": "Zero aggression, patient with toddlers.",
      "specialCare": "Keep facial folds dry and clean.",
      "dailyRoutine": "20-minute morning waddle, nap, evening stroll, family cuddle."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-07-01T11:15:11.458Z"
  },
  {
    "id": "pet_34",
    "name": "Bruno Red",
    "species": "Dog",
    "breed": "Red Indie Native",
    "age": "2 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Rust Red",
      "Loyal",
      "Apartment Pro",
      "Loving"
    ],
    "stats": {
      "energy": 65,
      "friendliness": 85,
      "trainability": 85,
      "independence": 80
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "With rich copper-red coat and expressive eyes, Bruno Red is an exemplary Indie who loves home life and learns rules effortlessly.",
    "providerInsight": {
      "personality": "Attentive, loyal, clean, and affectionate.",
      "habits": "Greets you with a gentle tail flick and quiet eyes.",
      "likes": "Boiled chicken broth, soft rugs, morning sunbeams.",
      "dislikes": "Sudden loud clatter.",
      "behavior": "House-trained, quiet in elevators.",
      "specialCare": "Very low maintenance.",
      "dailyRoutine": "Morning walk, quiet day by the window, evening stroll."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-29T11:15:11.458Z"
  },
  {
    "id": "pet_35",
    "name": "Chloe Dog",
    "species": "Dog",
    "breed": "Labrador Puppy",
    "age": "8 months",
    "gender": "Female",
    "size": "Medium",
    "location": "Goa",
    "images": [
      "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Bubbly",
      "Playful",
      "Soft Mouth",
      "Curious"
    ],
    "stats": {
      "energy": 85,
      "friendliness": 100,
      "trainability": 85,
      "independence": 35
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "A joyous yellow lab pup rescued after her owner moved overseas. She has puppy innocence and loves everyone she crosses paths with.",
    "providerInsight": {
      "personality": "Cheerful, optimistic, snuggly puppy.",
      "habits": "Carries her puppy bowl when breakfast is being prepared.",
      "likes": "Peanut butter Kong toys, swimming, tickles.",
      "dislikes": "Being alone.",
      "behavior": "House training 90% complete, knows Sit and Paw.",
      "specialCare": "Puppy chew toys essential.",
      "dailyRoutine": "Frequent puppy walks, feeding 3x daily, lots of naps."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-27T11:15:11.458Z"
  },
  {
    "id": "pet_36",
    "name": "Oliver",
    "species": "Cat",
    "breed": "British Shorthair Mix",
    "age": "1 year",
    "gender": "Male",
    "size": "Small",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Quiet",
      "Playful",
      "Observant",
      "Affectionate"
    ],
    "stats": {
      "energy": 40,
      "friendliness": 85,
      "trainability": 60,
      "independence": 80
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Oliver is a plush, amber-eyed sweetheart who loves purring on your chest during Netflix sessions. Independent during the day and affectionate in the evening.",
    "providerInsight": {
      "personality": "Regal, playful with feather wands, deeply soothing companion.",
      "habits": "Greets you at the door with a chirp; kneading blankets before sleeping.",
      "likes": "Laser pointers, catnip mice, window bird-watching.",
      "dislikes": "Vacuum cleaners.",
      "behavior": "100% litter box trained. Never scratches furniture.",
      "specialCare": "Weekly brushing.",
      "dailyRoutine": "Morning window watch, breakfast, afternoon slumber in sunbeams, evening playtime, purring night cuddle."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-25T11:15:11.458Z"
  },
  {
    "id": "pet_37",
    "name": "Daisy",
    "species": "Cat",
    "breed": "Indie Calico Kitten",
    "age": "6 months",
    "gender": "Female",
    "size": "Small",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Curious",
      "Spirited",
      "Purr Machine",
      "Tiny"
    ],
    "stats": {
      "energy": 75,
      "friendliness": 95,
      "trainability": 70,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Daisy is a vibrant three-colored Calico kitten rescued from a garden in Koramangala. She is fearless, acrobatic, and purrs like a tiny motorboat.",
    "providerInsight": {
      "personality": "Feisty, inquisitive, cuddly and joyful.",
      "habits": "Chirps softly when birdwatching through the window mesh.",
      "likes": "Feather wands, cardboard boxes, chin scritches.",
      "dislikes": "Closed bedroom doors.",
      "behavior": "Litter trained, uses scratching sisal post.",
      "specialCare": "Regular kitten playtime.",
      "dailyRoutine": "Morning zoomies, breakfast, long sun-soaked nap, evening wand games."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-23T11:15:11.458Z"
  },
  {
    "id": "pet_38",
    "name": "Cleo",
    "species": "Cat",
    "breed": "Siamese Mix",
    "age": "2 years",
    "gender": "Female",
    "size": "Small",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Vocal",
      "Graceful",
      "Affectionate",
      "Intelligent"
    ],
    "stats": {
      "energy": 55,
      "friendliness": 90,
      "trainability": 75,
      "independence": 65
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Cleo has piercing blue eyes and cream-and-chocolate points. She loves carrying on gentle conversations with her humans throughout the day.",
    "providerInsight": {
      "personality": "Conversational, affectionate, elegant.",
      "habits": "Sleeps curled like a scarf on top of pillows.",
      "likes": "Warm laptop keyboards, salmon pate, high cat trees.",
      "dislikes": "Sudden cold drafts.",
      "behavior": "Very expressive meows, loves being held.",
      "specialCare": "Keep indoors.",
      "dailyRoutine": "Morning conversational meow, breakfast, high perching, evening cuddle."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-21T11:15:11.458Z"
  },
  {
    "id": "pet_39",
    "name": "Whiskers",
    "species": "Cat",
    "breed": "Persian Cat",
    "age": "3 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Pune",
    "images": [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Fluffy Royalty",
      "Gentle",
      "Quiet",
      "Lap Cat"
    ],
    "stats": {
      "energy": 30,
      "friendliness": 85,
      "trainability": 50,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Whiskers is a magnificent cream-colored Persian with a flat doll face and cloud-like coat. He moves with tranquil dignity and rarely makes a sound.",
    "providerInsight": {
      "personality": "Serene, dignified, loves quiet households.",
      "habits": "Rests gracefully like a sculpture on velvet pillows.",
      "likes": "Soft hair brushing, quiet rooms, tuna flakes.",
      "dislikes": "Rough handling.",
      "behavior": "100% gentle indoor lap companion.",
      "specialCare": "Daily facial eye wipe and coat brushing.",
      "dailyRoutine": "Gentle breakfast, tranquil slumber, evening grooming, bedtime purr."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Adoption Pending",
    "createdAt": "2026-06-19T11:15:11.458Z"
  },
  {
    "id": "pet_40",
    "name": "Smokey",
    "species": "Cat",
    "breed": "Russian Blue Mix",
    "age": "1.5 years",
    "gender": "Male",
    "size": "Small",
    "location": "Hyderabad",
    "images": [
      "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Silvery Grey",
      "Shy Sweetheart",
      "Gentle",
      "Calm"
    ],
    "stats": {
      "energy": 45,
      "friendliness": 80,
      "trainability": 65,
      "independence": 85
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Smokey has a shimmering slate-grey coat and emerald green eyes. A quiet sweetheart, he forms deep unconditional bonds with one or two people.",
    "providerInsight": {
      "personality": "Thoughtful, quiet, sensitive and deeply affectionate.",
      "habits": "Slow-blinks lovingly when looking at his favorite person.",
      "likes": "Window perches, cat grass, silent companionship.",
      "dislikes": "Noisy kitchen appliances.",
      "behavior": "Extremely clean, never misses litter box.",
      "specialCare": "Short coat requires minimal grooming.",
      "dailyRoutine": "Morning windowsill watch, breakfast, serene afternoon rest, evening head rubs."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-17T11:15:11.458Z"
  },
  {
    "id": "pet_41",
    "name": "Felix",
    "species": "Cat",
    "breed": "Tuxedo Cat",
    "age": "2 years",
    "gender": "Male",
    "size": "Small",
    "location": "Kolkata",
    "images": [
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Formal Wear",
      "Mischievous",
      "Playful",
      "Confident"
    ],
    "stats": {
      "energy": 70,
      "friendliness": 90,
      "trainability": 70,
      "independence": 65
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Felix wears a permanent black-and-white tuxedo with white socks on all four paws. He is an adventurous clown who loves catching toy mice in midair.",
    "providerInsight": {
      "personality": "Curious, comical, bold and entertaining.",
      "habits": "Brings toy mice and drops them in your shoe as gifts.",
      "likes": "Ping pong balls, cat tunnels, freeze-dried treats.",
      "dislikes": "Empty food bowls.",
      "behavior": "Very friendly with house guests.",
      "specialCare": "Claw trimming every 3 weeks.",
      "dailyRoutine": "Morning gymnastics, breakfast, sunny nap, evening acrobatic play."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-15T11:15:11.458Z"
  },
  {
    "id": "pet_42",
    "name": "Bella Cat",
    "species": "Cat",
    "breed": "Tabby Cat",
    "age": "1 year",
    "gender": "Female",
    "size": "Small",
    "location": "Chennai",
    "images": [
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Classic Swirls",
      "Snuggly",
      "Sweet Voice",
      "Playful"
    ],
    "stats": {
      "energy": 50,
      "friendliness": 95,
      "trainability": 65,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Bella Cat is a beautiful brown-mackerel tabby with a white locket on her chest. She gives head-butts of affection and curls up on your chest.",
    "providerInsight": {
      "personality": "Loving, gentle, vocal purrer.",
      "habits": "Gives gentle head-butts to your chin to ask for pets.",
      "likes": "Catnip cushions, basking in window sunbeams, wet food.",
      "dislikes": "Cold tiles.",
      "behavior": "Gentle claws, uses scratching posts.",
      "specialCare": "Regular ear checks.",
      "dailyRoutine": "Sunbeam morning nap, meal, afternoon play, night cuddle on bed."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-13T11:15:11.458Z"
  },
  {
    "id": "pet_43",
    "name": "Nala",
    "species": "Cat",
    "breed": "Ginger Tabby",
    "age": "2 years",
    "gender": "Female",
    "size": "Small",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Warm Ginger",
      "Affectionate",
      "Talkative",
      "Sunny"
    ],
    "stats": {
      "energy": 60,
      "friendliness": 95,
      "trainability": 60,
      "independence": 55
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Female ginger tabbies are rare (only 20% of orange cats are female!). Nala is a warm golden sweetheart who loves sitting on your shoulder like a parrot.",
    "providerInsight": {
      "personality": "Sociable, friendly, always near people.",
      "habits": "Likes perching on shoulders while you walk around the house.",
      "likes": "Chicken pate, feather toys, window hammocks.",
      "dislikes": "Car rides.",
      "behavior": "Extremely sweet, never bites or scratches.",
      "specialCare": "Keep indoor safely meshed.",
      "dailyRoutine": "Morning greeting song, breakfast, window sunning, evening couch cuddle."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-11T11:15:11.458Z"
  },
  {
    "id": "pet_44",
    "name": "Mochi",
    "species": "Cat",
    "breed": "White Persian Mix",
    "age": "1.5 years",
    "gender": "Female",
    "size": "Small",
    "location": "Bangalore",
    "images": [
      "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Snow White",
      "Gentle",
      "Quiet",
      "Photogenic"
    ],
    "stats": {
      "energy": 35,
      "friendliness": 85,
      "trainability": 55,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Mochi has pure snow-white fur and heterochromatic eyes (one blue, one amber!). She looks like a mystical creature and moves with silken silence.",
    "providerInsight": {
      "personality": "Quiet, peaceful, gentle observer.",
      "habits": "Likes sitting inside clean cardboard shoe boxes.",
      "likes": "Grooming brush, soft fleece blankets, freeze-dried chicken.",
      "dislikes": "Loud sudden clapping.",
      "behavior": "Extremely clean, quiet purrs.",
      "specialCare": "Brush coat weekly.",
      "dailyRoutine": "Morning window watch, breakfast, afternoon beauty sleep, bedtime pets."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-09T11:15:11.458Z"
  },
  {
    "id": "pet_45",
    "name": "Luna Cat",
    "species": "Cat",
    "breed": "Calico Cat",
    "age": "2 years",
    "gender": "Female",
    "size": "Small",
    "location": "Delhi",
    "images": [
      "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Calico Beauty",
      "Playful",
      "Lap Cat",
      "Sweet"
    ],
    "stats": {
      "energy": 55,
      "friendliness": 90,
      "trainability": 60,
      "independence": 70
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Luna Cat is an artistic collage of black, ginger, and cream patches. She loves interactive cat dancer wires and curling inside laundry baskets.",
    "providerInsight": {
      "personality": "Gentle, curious, affectionate.",
      "habits": "Sleeps on freshly washed blankets.",
      "likes": "Cat dancer wire toys, tuna flakes, warm sun.",
      "dislikes": "Being sprayed with water.",
      "behavior": "100% litter trained, gentle companion.",
      "specialCare": "Regular ear check.",
      "dailyRoutine": "Morning stretch and purr, meal, sunny windowsill nap, evening play."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-07T11:15:11.458Z"
  },
  {
    "id": "pet_46",
    "name": "Oreo",
    "species": "Cat",
    "breed": "Tuxedo Kitten",
    "age": "7 months",
    "gender": "Male",
    "size": "Small",
    "location": "Pune",
    "images": [
      "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Kitten Energy",
      "Playful",
      "Acrobatic",
      "Loving"
    ],
    "stats": {
      "energy": 80,
      "friendliness": 95,
      "trainability": 70,
      "independence": 50
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Oreo has a white mustache on his black face. Full of kitten zest, he can chase a felt ball for an hour and then fall asleep upside down in your arms.",
    "providerInsight": {
      "personality": "Playful, comical, deeply affectionate kitten.",
      "habits": "Falls asleep in random funny positions.",
      "likes": "Felt balls, wand feathers, lap naps.",
      "dislikes": "Being alone in a closed room.",
      "behavior": "Great with other cats and friendly dogs.",
      "specialCare": "Puppy/kitten proofing cables.",
      "dailyRoutine": "Morning kitten zoomies, breakfast, naps, evening play."
    },
    "provider": {
      "id": "prv_sarah",
      "name": "Sarah D'Souza",
      "title": "Verified Pet Provider",
      "location": "Andheri East, Mumbai",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "about": "Certified rescue foster caregiver with over 38 successful adoptions across Maharashtra.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-05T11:15:11.458Z"
  },
  {
    "id": "pet_47",
    "name": "Simba Cat",
    "species": "Cat",
    "breed": "Orange Tabby",
    "age": "3 years",
    "gender": "Male",
    "size": "Medium",
    "location": "Jaipur",
    "images": [
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Big Orange",
      "Hearty",
      "Purr King",
      "Chilled Out"
    ],
    "stats": {
      "energy": 40,
      "friendliness": 95,
      "trainability": 55,
      "independence": 65
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Simba is an imposing 5.5kg orange tabby with a giant heart. He greets you with a deep, rumbling purr that vibrates across the whole sofa.",
    "providerInsight": {
      "personality": "Mellow, unflappable, deeply loving.",
      "habits": "Lays on his back offering belly for gentle rubs.",
      "likes": "Back scratches, salmon treats, big sunny spots.",
      "dislikes": "Diet food.",
      "behavior": "Extremely tolerant and gentle.",
      "specialCare": "Weight management portions.",
      "dailyRoutine": "Morning slow stretch, breakfast, 10 hours of lounging, evening snuggle."
    },
    "provider": {
      "id": "prv_delhi_paws",
      "name": "Delhi Paws NGO",
      "title": "Registered Rescue Trust",
      "location": "Hauz Khas, Delhi",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      "about": "Dedicated rescue NGO rehabilitating abandoned and injured animals in Delhi NCR.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-03T11:15:11.458Z"
  },
  {
    "id": "pet_48",
    "name": "Chloe Cat",
    "species": "Cat",
    "breed": "Birman Mix",
    "age": "2 years",
    "gender": "Female",
    "size": "Small",
    "location": "Goa",
    "images": [
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Silky Fur",
      "White Gloves",
      "Gentle",
      "Soulful"
    ],
    "stats": {
      "energy": 45,
      "friendliness": 90,
      "trainability": 60,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Chloe has deep sapphire blue eyes and four immaculate white gloved paws. She has a soothing, serene temperament that brings immediate peace to any room.",
    "providerInsight": {
      "personality": "Sweet, quiet, peaceful, graceful.",
      "habits": "Walks softly and kneads softly with front paws before lying down.",
      "likes": "Soft brush strokes, window perches looking at palms, gentle jazz music.",
      "dislikes": "Loud screaming.",
      "behavior": "Never scratches furniture.",
      "specialCare": "Regular gentle combing.",
      "dailyRoutine": "Gentle breakfast, window bird watching, evening cuddle."
    },
    "provider": {
      "id": "prv_happy_tails",
      "name": "Happy Tails Shelter",
      "title": "Registered Rescue Society",
      "location": "Kalyani Nagar, Pune",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
      "about": "Pune community shelter dedicated to ethical rehabilitation and Foster-to-Own adoptions.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-06-01T11:15:11.458Z"
  },
  {
    "id": "pet_49",
    "name": "Jasper",
    "species": "Cat",
    "breed": "Bombay Black Cat",
    "age": "2 years",
    "gender": "Male",
    "size": "Small",
    "location": "Mumbai",
    "images": [
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Mini Panther",
      "Glossy Black",
      "Good Luck",
      "Super Affectionate"
    ],
    "stats": {
      "energy": 60,
      "friendliness": 95,
      "trainability": 70,
      "independence": 60
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Jasper looks like a sleek miniature black panther with glossy patent-leather fur and golden copper eyes. He busts all silly superstitions with pure affection!",
    "providerInsight": {
      "personality": "Affectionate, shadows you around the house, playful.",
      "habits": "Sleeps curled like a black donut right next to your pillow.",
      "likes": "Playing fetch with crinkle balls, chin scratches.",
      "dislikes": "Being ignored.",
      "behavior": "Incredibly loving and vocal.",
      "specialCare": "Gleaming coat from good nutrition.",
      "dailyRoutine": "Morning chirp, meal, nap in warm laundry, evening play and night cuddle."
    },
    "provider": {
      "id": "prv_bangalore_cares",
      "name": "Bangalore Animal Alliance",
      "title": "Certified Rescue Foster",
      "location": "Indiranagar, Bangalore",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "about": "Volunteer group promoting community Indie adoptions and sterilization programs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-05-30T11:15:11.458Z"
  },
  {
    "id": "pet_50",
    "name": "Mia",
    "species": "Cat",
    "breed": "Himalayan Mix",
    "age": "2.5 years",
    "gender": "Female",
    "size": "Medium",
    "location": "Chandigarh",
    "images": [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=1200"
    ],
    "personalityTags": [
      "Fluffy Pointed",
      "Blue Eyes",
      "Sweet",
      "Quiet"
    ],
    "stats": {
      "energy": 35,
      "friendliness": 85,
      "trainability": 55,
      "independence": 75
    },
    "goodWithChildren": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "apartmentFriendly": true,
    "vaccination": "Fully Vaccinated",
    "sterilization": "Sterilized",
    "healthInfo": "Up to date with all core vaccines, dewormed, vet-checked, and microchipped.",
    "specialNeeds": "None.",
    "description": "Mia combines the luxurious coat of a Persian with the beautiful chocolate points and blue eyes of a Siamese. She is a serene companion who loves gentle laps.",
    "providerInsight": {
      "personality": "Quiet, regal, affectionate on her own terms.",
      "habits": "Sits near you while you read or work.",
      "likes": "Soft hairbrushes, warm sunny rugs, gourmet cat pate.",
      "dislikes": "Baths and loud vacuuming.",
      "behavior": "Very quiet voice, gentle claws.",
      "specialCare": "Daily brushing to prevent mats.",
      "dailyRoutine": "Morning brush, breakfast, calm day, evening gentle purring."
    },
    "provider": {
      "id": "prv_hyderabad_hope",
      "name": "Hope For Paws Hyderabad",
      "title": "Animal Welfare Trust",
      "location": "Jubilee Hills, Hyderabad",
      "verified": true,
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      "about": "Non-profit dedicated to rescuing abandoned pets and senior dogs.",
      "phone": "+91 98192 34567"
    },
    "status": "Available",
    "createdAt": "2026-05-28T11:15:11.458Z"
  }
];

export const INITIAL_ADOPTION_REQUESTS: AdoptionRequest[] = [
  {
    id: 'req_bruno_01',
    petId: 'pet_bruno',
    petName: 'Bruno',
    petBreed: 'Labrador Retriever',
    petImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    providerId: 'prv_sarah',
    providerName: 'Sarah D\'Souza',
    providerLocation: 'Mumbai',
    adopterId: 'usr_raghav',
    adopterName: 'Raghav Singh',
    adopterEmail: 'raghav.singh@example.com',
    adopterPhone: '+91 98201 54321',
    adopterLocation: 'Bandra West, Mumbai',
    adopterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    message: 'Hello Sarah! I fell in love with Bruno\'s profile. I live in a spacious 2BHK near Bandra Bandstand with lots of walking trails. Having raised Labradors growing up, I am excited to give Bruno a loving forever home through your Foster-to-Own program.',
    homeType: 'Apartment (2BHK)',
    existingPets: 'None currently',
    children: 'No children',
    petExperience: 'Lifelong pet owner (raised 2 Labradors)',
    timeAvailable: 'Works hybrid 3 days/week; available all mornings & evenings',
    whyTheyWantToAdopt: 'I want a loyal, active companion to share adventures with and provide a safe forever sanctuary.',
    confirmedAccurate: true,
    status: 'Approved',
    createdAt: '2026-09-01T11:20:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    trial: {
      startDate: '2026-09-03',
      endDate: '2026-09-17',
      currentDay: 2,
      totalDays: 14,
      notes: [
        'Day 1: Bruno arrived and explored the living room happily. Settled into his warm dog bed after a comforting bowl of chicken and rice.',
        'Day 2: Morning walk went wonderfully, very gentle on leash and curious about squirrels in the park.'
      ],
    },
    timeline: [
      { step: 1, status: 'Pending', title: 'Request Sent', date: 'Sept 1, 2026', description: 'Adoption request submitted with verified adopter profile details.', completed: true, current: false },
      { step: 2, status: 'Under Review', title: 'Under Review', date: 'Sept 2, 2026', description: 'Sarah reviewed your profile and home suitability. Background check passed.', completed: true, current: false },
      { step: 3, status: 'Approved', title: 'Decision & Foster Trial', date: 'Sept 3, 2026', description: 'Foster-to-Own trial initiated. 14-day bonding period underway.', completed: true, current: true },
      { step: 4, status: 'Completed', title: 'Adoption Completed', date: 'Upcoming', description: 'Signing the official adoption pledge and issuance of Certificate of Adoption.', completed: false, current: false }
    ],
  },
  {
    id: 'req_luna_02',
    petId: 'pet_luna',
    petName: 'Luna',
    petBreed: 'Golden Retriever Mix',
    petImage: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=800',
    providerId: 'prv_delhi_paws',
    providerName: 'Delhi Paws NGO',
    providerLocation: 'Delhi',
    adopterId: 'usr_raghav',
    adopterName: 'Raghav Singh',
    adopterEmail: 'raghav.singh@example.com',
    adopterPhone: '+91 98201 54321',
    adopterLocation: 'Mumbai',
    adopterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    message: 'Interested in knowing if Luna can be transported to Mumbai or if adoptions are strictly local.',
    homeType: 'Apartment',
    existingPets: 'None',
    children: 'None',
    petExperience: 'Lifelong pet owner',
    timeAvailable: 'Evenings & Weekends',
    whyTheyWantToAdopt: 'Seeking a calm companion for remote work days.',
    confirmedAccurate: true,
    status: 'Pending',
    createdAt: '2026-09-02T16:00:00Z',
    updatedAt: '2026-09-02T16:00:00Z',
    timeline: [
      { step: 1, status: 'Pending', title: 'Request Sent', date: 'Sept 2, 2026', description: 'Adoption inquiry submitted to Delhi Paws NGO.', completed: true, current: true },
      { step: 2, status: 'Under Review', title: 'Under Review', date: 'Pending', description: 'Provider will review within 24-48 hours.', completed: false, current: false }
    ],
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_01',
    userId: 'usr_raghav',
    type: 'request_reviewing',
    title: 'Review in Progress',
    message: 'Sarah is reviewing your adoption request for Bruno.',
    timestamp: '2 hours ago',
    read: false,
    link: '/adopter/requests/req_bruno_01',
    petName: 'Bruno',
    petImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'notif_02',
    userId: 'usr_raghav',
    type: 'request_received',
    title: 'Adoption Request Sent',
    message: 'Your adoption request for Bruno was sent to Sarah.',
    timestamp: '1 day ago',
    read: true,
    link: '/adopter/requests/req_bruno_01',
    petName: 'Bruno',
    petImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'notif_03',
    userId: 'prv_sarah',
    type: 'request_received',
    title: 'New Adoption Request',
    message: 'Your pet Bruno received a new adoption request from Raghav Singh.',
    timestamp: '1 day ago',
    read: false,
    link: '/provider/requests/req_bruno_01',
    petName: 'Bruno',
    petImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200',
  },
];

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep_01',
    reporterName: 'Ananya Verma',
    targetType: 'Pet Listing',
    targetId: 'pet_bruno',
    targetName: 'Bruno Listing',
    reason: 'Duplicate photo check',
    description: 'Inquiring if Bruno is listed on another rescue board.',
    status: 'Resolved',
    createdAt: '2026-08-29',
  }
];
