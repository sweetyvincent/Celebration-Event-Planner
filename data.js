/* Event data: budgets, milestones, vendors, themes, ideas. */
const EVENTS_DATA = {
 "wedding": {
  "label": "Wedding",
  "emoji": "💍",
  "tiers_usd_per_guest": [
   40,
   120
  ],
  "budget": [
   [
    "Venue & Rentals",
    0.22,
    "Book first: the venue decides your date, capacity and decor limits."
   ],
   [
    "Catering & Bar",
    0.3,
    "Ask for per-plate pricing with taxes and service charge included."
   ],
   [
    "Photo & Video",
    0.1,
    "Review full galleries, not only highlight reels."
   ],
   [
    "Decor & Flowers",
    0.1,
    "Seasonal flowers and reusable ceremony pieces cut costs sharply."
   ],
   [
    "Attire & Beauty",
    0.08,
    "Schedule fittings 6+ weeks out and trials for hair and makeup."
   ],
   [
    "Music & Entertainment",
    0.06,
    "Confirm sound equipment, backup power and overtime fees."
   ],
   [
    "Invitations & Stationery",
    0.02,
    "A wedding website or digital invite saves print costs."
   ],
   [
    "Transport & Stay",
    0.04,
    "Block rooms early for out-of-town family."
   ],
   [
    "Contingency",
    0.08,
    "Never skip this: weather, price hikes and last-minute guests happen."
   ]
  ],
  "milestones": [
   [
    365,
    "Lay the foundation",
    [
     "Agree the total budget and who contributes",
     "Draft the guest list (A list and B list)",
     "Shortlist 2–3 possible dates and seasons",
     "Decide ceremony style and rough size"
    ]
   ],
   [
    250,
    "Lock the big bookings",
    [
     "Visit and book the venue",
     "Hire photographer and videographer",
     "Book the caterer and plan tastings",
     "Hire a planner or day-of coordinator if wanted"
    ]
   ],
   [
    170,
    "Style and people",
    [
     "Choose theme, colours and decor direction",
     "Start attire shopping and book makeup artist",
     "Book music, DJ or band",
     "Create a wedding website with RSVP"
    ]
   ],
   [
    110,
    "Details take shape",
    [
     "Send save-the-dates",
     "Book transport and guest accommodation",
     "Plan ceremony rituals and readings",
     "Finalise menu after tasting"
    ]
   ],
   [
    56,
    "Invitations out",
    [
     "Send formal invitations",
     "Confirm all vendor contracts and payment schedule",
     "Final attire fittings",
     "Plan rehearsal and welcome events"
    ]
   ],
   [
    28,
    "Fine-tune",
    [
     "Track RSVPs and follow up",
     "Create seating plan",
     "Share the run-of-show with vendors",
     "Prepare vendor tips and envelopes"
    ]
   ],
   [
    14,
    "Final confirmations",
    [
     "Give final headcount to the caterer",
     "Confirm arrival times with every vendor",
     "Pack an emergency kit",
     "Assign day-of helpers from family or friends"
    ]
   ],
   [
    7,
    "Week-of checklist",
    [
     "Collect attire, rings and documents",
     "Brief the MC and coordinator",
     "Pre-pay balances and label envelopes",
     "Rest and hydrate"
    ]
   ],
   [
    1,
    "The day before",
    [
     "Rehearsal and decor drop-off",
     "Confirm weather backup plan",
     "Early night"
    ]
   ],
   [
    0,
    "Wedding day 🎉",
    [
     "Eat breakfast!",
     "Hand the checklist to your coordinator",
     "Soak it all in"
    ]
   ]
  ],
  "vendors": [
   [
    "Venue",
    "Venue & Rentals",
    [
     "Compare 3 venues on capacity, parking and power",
     "Read contract: overtime, damage deposit, outside-vendor rules",
     "Confirm rain or heat backup",
     "Check licences and noise limits"
    ],
    [
     "What is included in the rental price?",
     "What is the cancellation and date-change policy?",
     "Is there a hard end time?"
    ]
   ],
   [
    "Caterer & Bar",
    "Catering & Bar",
    [
     "Tasting session booked",
     "Dietary needs list shared (veg, vegan, allergies)",
     "Staffing ratio and service style confirmed",
     "Late-night snack option"
    ],
    [
     "Is staffing, crockery and cleanup included?",
     "How are leftovers handled?",
     "Can the menu scale if guests increase?"
    ]
   ],
   [
    "Photo & Video",
    "Photo & Video",
    [
     "Review portfolios and full galleries",
     "Must-have shot list shared",
     "Delivery timeline and format in writing",
     "Backup photographer confirmed"
    ],
    [
     "How many editors and shooters attend?",
     "Who owns the raw files?",
     "What is the delivery time?"
    ]
   ],
   [
    "Decor & Florist",
    "Decor & Flowers",
    [
     "Mood board approved",
     "Venue walkthrough with decorator",
     "Setup and teardown timings",
     "Reusable elements planned"
    ],
    [
     "Which flowers are in season?",
     "Is delivery and setup included?",
     "What is the refund on rented items?"
    ]
   ],
   [
    "Attire & Beauty",
    "Attire & Beauty",
    [
     "Outfits ordered with fitting dates",
     "Makeup and hair trial done",
     "Accessories and shoes sorted",
     "Emergency sewing kit"
    ],
    [
     "How long does alteration take?",
     "Do you travel to the venue?"
    ]
   ],
   [
    "Music & MC",
    "Music & Entertainment",
    [
     "Playlist with must-play and do-not-play songs",
     "Sound check scheduled",
     "MC briefed on names and schedule",
     "Backup equipment confirmed"
    ],
    [
     "What are your overtime charges?",
     "Do you provide lighting and mics?"
    ]
   ],
   [
    "Invitations",
    "Invitations & Stationery",
    [
     "Wording finalised and proofread",
     "Digital RSVP link",
     "Addresses collected",
     "Place cards and signage"
    ],
    [
     "Is there a minimum order?",
     "What is the print turnaround?"
    ]
   ],
   [
    "Transport & Stay",
    "Transport & Stay",
    [
     "Room block booked for guests",
     "Shuttle or cab plan",
     "Couple's transport and parking",
     "Welcome bags"
    ],
    [
     "Is there a group discount?",
     "What is the cancellation deadline?"
    ]
   ]
  ],
  "themes": {
   "elegant": [
    [
     "Garden Ivory",
     "Soft whites, candlelight, lush greenery and linen textures.",
     [
      "#F8F4EC",
      "#CFE0D0",
      "#B8956A",
      "#2F4A3A"
     ]
    ],
    [
     "Midnight Gold",
     "Deep navy tables with gold accents and warm chandeliers.",
     [
      "#0F1B3D",
      "#C9A24B",
      "#F3E9D2",
      "#7B2D3B"
     ]
    ]
   ],
   "rustic": [
    [
     "Barn & Blooms",
     "Wooden tables, wildflowers, lanterns and string lights.",
     [
      "#E7D9C4",
      "#8A5A3B",
      "#7C8F5A",
      "#F2B5A0"
     ]
    ]
   ],
   "fun": [
    [
     "Carnival Love",
     "Vibrant colours, photo booths, lawn games and a dessert bar.",
     [
      "#FF5E78",
      "#FFC857",
      "#2EC4B6",
      "#5B3DF5"
     ]
    ]
   ],
   "minimal": [
    [
     "Modern Monochrome",
     "Clean lines, white florals and architectural lighting.",
     [
      "#FFFFFF",
      "#E5E5E5",
      "#4A4A4A",
      "#C8B6A6"
     ]
    ]
   ],
   "traditional": [
    [
     "Royal Heritage",
     "Rich marigolds, brass, silk drapes and live traditional music.",
     [
      "#F29F05",
      "#B3202A",
      "#6B1F3A",
      "#FFF1CC"
     ]
    ],
    [
     "Temple Blossom",
     "Jasmine strings, banana leaf serving and rangoli entrances.",
     [
      "#F7E7CE",
      "#2E7D32",
      "#D81B60",
      "#FFB300"
     ]
    ]
   ]
  },
  "ideas": {
   "Decor & Atmosphere": [
    "Candlelit aisle with petals",
    "Suspended floral installation over the sweetheart table",
    "Welcome signage with a family photo timeline",
    "Fairy-light canopy for the dance floor",
    "Reusable fabric backdrops and drapes",
    "Memory table for loved ones"
   ],
   "Food & Drinks": [
    "Live counters (chaat, pasta or taco station)",
    "Signature couple cocktails and mocktails",
    "Dessert tasting wall instead of one cake",
    "Regional specialties from both families",
    "Late-night snack cart",
    "Chai or coffee bar for the morning after"
   ],
   "Entertainment": [
    "Surprise choreographed family dance",
    "Live acoustic set during cocktails",
    "Photo booth with props and instant prints",
    "Storytelling toast round",
    "Fireworks or sparkler exit",
    "Lawn games during the afternoon"
   ],
   "Personal Touches": [
    "Handwritten vows exchanged privately",
    "Guest message jar or video guestbook",
    "Custom playlist built from guests' requests",
    "Donation in lieu of favours",
    "Parents' blessing ritual with a personal note"
   ]
  },
  "hacks": [
   "Choose an off-peak day (Friday or Sunday) for 10–20% savings",
   "Cut the guest list by one tier before cutting quality",
   "Repurpose ceremony flowers as reception centrepieces",
   "Use a digital invitation suite with a RSVP site"
  ],
  "facts_pp": {
   "sqft": 12,
   "table": 10,
   "buffer": 1.1
  }
 },
 "birthday": {
  "label": "Birthday",
  "emoji": "🎂",
  "tiers_usd_per_guest": [
   15,
   40
  ],
  "budget": [
   [
    "Venue & Setup",
    0.2,
    "Home, terrace or a party hall: weigh convenience vs. cleanup."
   ],
   [
    "Food & Drinks",
    0.35,
    "Plan 1.1x portions and kid-friendly or dietary alternatives."
   ],
   [
    "Cake & Desserts",
    0.07,
    "Order a week ahead and confirm flavours and allergens."
   ],
   [
    "Decor & Balloons",
    0.1,
    "A statement backdrop beats scattered decorations."
   ],
   [
    "Entertainment & Games",
    0.12,
    "Hire one headline act and add DIY games."
   ],
   [
    "Photography",
    0.05,
    "A friend with a good phone plus a photo corner works great."
   ],
   [
    "Invites & Return Gifts",
    0.05,
    "Digital invites with RSVP; keep favours useful."
   ],
   [
    "Contingency",
    0.06,
    "Keep a buffer for extra guests and last-minute needs."
   ]
  ],
  "milestones": [
   [
    56,
    "Dream it up",
    [
     "Decide the vibe, theme and guest of honour's wishes",
     "Set the budget and draft the guest list",
     "Pick date and time (avoid clashes)"
    ]
   ],
   [
    42,
    "Book key things",
    [
     "Book venue or reserve space at home",
     "Shortlist caterer, bakery and entertainer",
     "Create the invitation"
    ]
   ],
   [
    28,
    "Send invites",
    [
     "Send invitations with RSVP date",
     "Order cake and decor items",
     "Plan the menu and dietary list"
    ]
   ],
   [
    21,
    "Plan the fun",
    [
     "Finalise games and activity schedule",
     "Plan music playlist",
     "Arrange return gifts"
    ]
   ],
   [
    14,
    "Confirm",
    [
     "Chase RSVPs",
     "Confirm all vendors and timings",
     "Arrange helpers for the day"
    ]
   ],
   [
    7,
    "Prepare",
    [
     "Purchase supplies and decor",
     "Final headcount to caterer",
     "Plan the cake-cutting moment and speeches"
    ]
   ],
   [
    2,
    "Almost there",
    [
     "Set up decor where possible",
     "Charge cameras and speakers",
     "Prepare an emergency kit"
    ]
   ],
   [
    0,
    "Party day 🎈",
    [
     "Set up early",
     "Enjoy the celebration",
     "Capture the moments"
    ]
   ]
  ],
  "vendors": [
   [
    "Venue",
    "Venue & Setup",
    [
     "Capacity and rules confirmed",
     "Setup and cleanup time agreed",
     "Parking and access sorted",
     "Backup plan for weather"
    ],
    [
     "Is there a rental time limit?",
     "Is a deposit refundable?"
    ]
   ],
   [
    "Caterer / Food",
    "Food & Drinks",
    [
     "Menu finalised",
     "Allergies and dietary options noted",
     "Serving staff and cutlery included",
     "Drinks and ice planned"
    ],
    [
     "What is the per-head price?",
     "Can they deliver and set up?"
    ]
   ],
   [
    "Bakery",
    "Cake & Desserts",
    [
     "Flavour, size and design confirmed",
     "Allergen check",
     "Pickup or delivery time set",
     "Candles and knife"
    ],
    [
     "How early must I order?",
     "Is the cake transportable?"
    ]
   ],
   [
    "Decor & Balloons",
    "Decor & Balloons",
    [
     "Theme colours picked",
     "Backdrop and balloon arch ordered",
     "Table centrepieces",
     "Setup time confirmed"
    ],
    [
     "Is setup included?",
     "Can I keep the decor?"
    ]
   ],
   [
    "Entertainment",
    "Entertainment & Games",
    [
     "Entertainer, DJ or host booked",
     "Games and prizes planned",
     "Sound system tested",
     "Quiet corner for little ones"
    ],
    [
     "How long is the act?",
     "What are the space and power needs?"
    ]
   ],
   [
    "Photography",
    "Photography",
    [
     "Photographer or friend assigned",
     "Photo corner built",
     "Shot list noted",
     "Sharing album created"
    ],
    [
     "How soon are photos delivered?"
    ]
   ],
   [
    "Invites & Gifts",
    "Invites & Return Gifts",
    [
     "Digital invite sent",
     "RSVP tracker",
     "Return gifts bought and packed"
    ],
    [
     "Is there a bulk discount?"
    ]
   ]
  ],
  "themes": {
   "elegant": [
    [
     "Champagne Soirée",
     "Gold balloons, sparkling mocktails and a dessert tower.",
     [
      "#F7E7CE",
      "#D4AF37",
      "#1B1B1B",
      "#FFFFFF"
     ]
    ]
   ],
   "rustic": [
    [
     "Picnic in the Park",
     "Gingham blankets, wildflowers and homemade treats.",
     [
      "#FFF4D6",
      "#8FBC8F",
      "#E07A5F",
      "#6B4F3A"
     ]
    ]
   ],
   "fun": [
    [
     "Neon Arcade",
     "Glow sticks, retro games and a pixel-art cake.",
     [
      "#7C3AED",
      "#06B6D4",
      "#F43F5E",
      "#FACC15"
     ]
    ],
    [
     "Tropical Splash",
     "Pool party, palm leaves and fruit skewers.",
     [
      "#00B4D8",
      "#FFB703",
      "#FB5607",
      "#90E0EF"
     ]
    ]
   ],
   "minimal": [
    [
     "Pastel Brunch",
     "Muted pastels, a floral cake and a lovely brunch table.",
     [
      "#FDE2E4",
      "#E2ECE9",
      "#BEE1E6",
      "#F0EFEB"
     ]
    ]
   ],
   "traditional": [
    [
     "Festive Family Feast",
     "Marigold decor, family recipes and music.",
     [
      "#F4A261",
      "#E76F51",
      "#2A9D8F",
      "#FFF3E0"
     ]
    ]
   ]
  },
  "ideas": {
   "Decor & Atmosphere": [
    "Balloon garland with name letters",
    "Photo wall of memories through the years",
    "Themed table runners and cups",
    "Light-up age number",
    "Chalkboard signage with fun facts"
   ],
   "Food & Drinks": [
    "DIY pizza or taco bar",
    "Signature mocktail named after the birthday star",
    "Cupcake decorating station",
    "Grazing board with favourites",
    "Mini dessert jars"
   ],
   "Entertainment": [
    "Scavenger hunt through the venue",
    "Karaoke or dance-off",
    "Trivia about the birthday star",
    "Magician or face painter for kids",
    "Outdoor movie night"
   ],
   "Personal Touches": [
    "Video montage from friends",
    "A jar of notes from everyone",
    "Personalised playlist",
    "Surprise guest from out of town",
    "Memory timeline wall"
   ]
  },
  "hacks": [
   "Host at home or a park to avoid venue fees",
   "Bake the cake or order a small hero cake and sheet cakes",
   "DIY decor with balloons and paper",
   "Use digital invitations"
  ],
  "facts_pp": {
   "sqft": 10,
   "table": 8,
   "buffer": 1.15
  }
 },
 "community": {
  "label": "Community Event",
  "emoji": "🏘️",
  "tiers_usd_per_guest": [
   5,
   15
  ],
  "budget": [
   [
    "Venue & Permits",
    0.15,
    "Check permits and noise rules early; they take time."
   ],
   [
    "Food & Refreshments",
    0.25,
    "Partner with local vendors or potluck for savings."
   ],
   [
    "Stage, Sound & AV",
    0.15,
    "Test sound at the real venue time of day."
   ],
   [
    "Marketing & Printing",
    0.1,
    "Social media, WhatsApp groups and local notice boards beat paid ads."
   ],
   [
    "Activities & Entertainment",
    0.15,
    "Mix performances with participatory activities."
   ],
   [
    "Volunteers & Staffing",
    0.05,
    "Provide food, ID badges and a clear role brief."
   ],
   [
    "Safety & Insurance",
    0.05,
    "First aid, fire exits, crowd control and liability cover."
   ],
   [
    "Contingency",
    0.1,
    "Weather and attendance spikes are common."
   ]
  ],
  "milestones": [
   [
    120,
    "Define the purpose",
    [
     "Write the event goal and success metrics",
     "Form the organising committee",
     "Set budget and funding sources (sponsors, donations)"
    ]
   ],
   [
    90,
    "Permissions and venue",
    [
     "Apply for permits and approvals",
     "Book the venue and backup space",
     "Open a sponsorship outreach list"
    ]
   ],
   [
    60,
    "Programme and vendors",
    [
     "Draft the programme and run of show",
     "Book performers, speakers and vendors",
     "Plan accessibility and parking"
    ]
   ],
   [
    42,
    "Promote",
    [
     "Launch event page and posters",
     "Open registration or RSVP",
     "Start volunteer sign-ups"
    ]
   ],
   [
    28,
    "Operations",
    [
     "Finalise safety and crowd plan",
     "Arrange first aid and insurance",
     "Order signage and printing"
    ]
   ],
   [
    14,
    "Confirm",
    [
     "Volunteer briefing session",
     "Reconfirm vendors and equipment",
     "Send a reminder to attendees"
    ]
   ],
   [
    7,
    "Week-of",
    [
     "Site walkthrough",
     "Weather backup decision",
     "Print schedules and ID badges"
    ]
   ],
   [
    2,
    "Setup",
    [
     "Setup stage and signage",
     "Test sound and lights",
     "Assign volunteer posts"
    ]
   ],
   [
    0,
    "Event day 🎪",
    [
     "Early team briefing",
     "Run the programme",
     "Collect feedback before people leave"
    ]
   ]
  ],
  "vendors": [
   [
    "Venue & Permits",
    "Venue & Permits",
    [
     "Permits approved in writing",
     "Capacity, power and water confirmed",
     "Toilets and waste plan",
     "Backup venue or tent"
    ],
    [
     "What are the noise and end-time limits?",
     "Is there a deposit or insurance requirement?"
    ]
   ],
   [
    "Food & Refreshments",
    "Food & Refreshments",
    [
     "Food licences checked",
     "Vendor stalls allocated",
     "Water stations planned",
     "Dietary and cultural needs covered"
    ],
    [
     "Do vendors bring their own equipment?",
     "How is waste handled?"
    ]
   ],
   [
    "Stage, Sound & AV",
    "Stage, Sound & AV",
    [
     "Stage, mics and speakers booked",
     "Generator or power backup",
     "Lighting for evening events",
     "Technician on site"
    ],
    [
     "What is the power load needed?",
     "Can we test the day before?"
    ]
   ],
   [
    "Marketing & Printing",
    "Marketing & Printing",
    [
     "Posters, banners and flyers",
     "Social media calendar",
     "Local press or community radio",
     "Registration link"
    ],
    [
     "What is the print lead time?",
     "Is there a discount for non-profits?"
    ]
   ],
   [
    "Entertainment & Activities",
    "Activities & Entertainment",
    [
     "Performers confirmed",
     "Kids' zone",
     "Workshops or competitions",
     "Prizes and certificates"
    ],
    [
     "Do performers need a green room?",
     "Are there equipment requirements?"
    ]
   ],
   [
    "Safety & Insurance",
    "Safety & Insurance",
    [
     "First aid station",
     "Fire exits and extinguishers",
     "Security or marshals",
     "Lost-and-found and help desk"
    ],
    [
     "Is public liability insurance needed?",
     "Who is the emergency contact?"
    ]
   ],
   [
    "Volunteers",
    "Volunteers & Staffing",
    [
     "Roles and shifts assigned",
     "ID badges or T-shirts",
     "Briefing session held",
     "Meals and breaks planned"
    ],
    [
     "How many volunteers per zone?"
    ]
   ]
  ],
  "themes": {
   "elegant": [
    [
     "Gala for Good",
     "A charity dinner with a silent auction and live music.",
     [
      "#1D3557",
      "#E63946",
      "#F1FAEE",
      "#A8DADC"
     ]
    ]
   ],
   "rustic": [
    [
     "Harvest Festival",
     "Farm stalls, folk music, crafts and long communal tables.",
     [
      "#D4A373",
      "#CCD5AE",
      "#E9EDC9",
      "#6B705C"
     ]
    ]
   ],
   "fun": [
    [
     "Neighbourhood Carnival",
     "Games, food trucks, a talent show and a kids' zone.",
     [
      "#EF476F",
      "#FFD166",
      "#06D6A0",
      "#118AB2"
     ]
    ]
   ],
   "minimal": [
    [
     "Open Talks & Tea",
     "A calm speaker series with simple refreshments.",
     [
      "#F8F9FA",
      "#DEE2E6",
      "#495057",
      "#74C69D"
     ]
    ]
   ],
   "traditional": [
    [
     "Cultural Mela",
     "Folk performances, handicraft stalls and regional food.",
     [
      "#F77F00",
      "#D62828",
      "#003049",
      "#FCBF49"
     ]
    ]
   ]
  },
  "ideas": {
   "Decor & Atmosphere": [
    "Community mural wall",
    "Lantern or bunting trail",
    "Welcome arch with local art",
    "Themed zones with clear signage",
    "Recycled-material decor"
   ],
   "Food & Drinks": [
    "Potluck map of cultures",
    "Local food-truck line-up",
    "Free water refill stations",
    "Chai or lemonade stand run by youth",
    "Zero-waste serving ware"
   ],
   "Entertainment": [
    "Open-mic and talent show",
    "Flash mob or group dance",
    "Kids' craft zone",
    "Sports tournaments",
    "Local band stage"
   ],
   "Personal Touches": [
    "Wall of community stories",
    "Volunteer recognition moment",
    "Neighbour bingo for meeting new people",
    "Time capsule",
    "Photo booth with a shared hashtag"
   ]
  },
  "hacks": [
   "Seek in-kind sponsors (printing, food, AV) instead of cash",
   "Use school or community halls",
   "Recruit student volunteers for credits",
   "Use a free registration tool and WhatsApp groups"
  ],
  "facts_pp": {
   "sqft": 8,
   "table": 8,
   "buffer": 1.05
  }
 }
};
if (typeof module !== 'undefined') module.exports = EVENTS_DATA;
